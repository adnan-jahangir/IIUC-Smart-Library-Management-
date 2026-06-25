const { PDFParse } = require('pdf-parse');
const UploadedDocument = require('../models/UploadedDocument');
const DocumentChunk = require('../models/DocumentChunk');
const AiUsageLog = require('../models/AiUsageLog');
const { getChatCompletion } = require('../services/openaiService');
const { chunkText: chunkTextForEmbedding, generateEmbeddingsBatch } = require('../services/embeddingService');
const { retrieveRelevantChunks } = require('../services/ragRetrievalService');

// Helper: log usage
async function logUsage(userId, role, feature, tokensUsed) {
  try {
    await AiUsageLog.create({
      userId,
      role: String(role || 'student').toLowerCase(),
      feature,
      tokensUsed: tokensUsed || 0,
    });
  } catch (err) {
    console.error('Failed to log AI usage:', err.message);
  }
}

// Helper: chunk text
function chunkText(text, maxChars = 12000) {
  if (!text) return [];
  const chunks = [];
  let index = 0;
  while (index < text.length) {
    chunks.push(text.slice(index, index + maxChars));
    index += maxChars;
  }
  return chunks;
}

// Helper: retrieve relevant context (RAG matching)
function retrieveRelevantContext(text, question, maxChars = 20000) {
  if (!text) return '';
  if (text.length <= maxChars) return text;

  const chunks = chunkText(text, 3000); // 3000 chars chunks
  const keywords = String(question || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter(k => k.length > 3 && !['what', 'where', 'when', 'how', 'who', 'why', 'document', 'about', 'book', 'paper'].includes(k));

  if (keywords.length === 0) {
    return text.substring(0, maxChars);
  }

  // Score each chunk
  const scoredChunks = chunks.map(chunk => {
    let score = 0;
    const lowerChunk = chunk.toLowerCase();
    for (const word of keywords) {
      if (lowerChunk.includes(word)) score += 1;
    }
    return { chunk, score };
  });

  // Sort by score descending
  scoredChunks.sort((a, b) => b.score - a.score);

  let context = '';
  for (const item of scoredChunks) {
    if (context.length + item.chunk.length > maxChars) break;
    context += item.chunk + '\n\n';
  }

  return context.trim() || text.substring(0, maxChars);
}

/**
 * @desc    Upload a PDF, extract text, page cap, and save to DB
 * @route   POST /api/ai/document/upload
 * @access  Private
 */
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const maxPages = 20; // Cap processed pages
    let pdfData;
    let parser;
    try {
      parser = new PDFParse({ data: req.file.buffer });
      const parseResult = await parser.getText({ last: maxPages });
      pdfData = {
        numpages: parseResult.pages ? parseResult.pages.length : (await parser.getInfo()).total,
        text: parseResult.text
      };
    } catch (err) {
      console.error('PDF parsing error:', err.message);
      return res.status(420).json({ message: 'Failed to read PDF. The file might be corrupted or password-protected.' });
    } finally {
      if (parser && typeof parser.destroy === 'function') {
        await parser.destroy().catch(console.error);
      }
    }

    const totalPages = pdfData.numpages || 0;
    let extractedText = (pdfData.text || '').trim();
    
    // Clean up excessive whitespace
    extractedText = extractedText.replace(/\s+/g, ' ');

    const isScanned = extractedText.length < 50; // threshold for scanned PDF check

    const doc = await UploadedDocument.create({
      userId: req.user.id,
      filename: req.file.originalname,
      extractedText: isScanned ? '' : extractedText,
      pageCount: totalPages,
      isScanned,
      embeddingStatus: isScanned ? 'skipped' : 'pending',
    });

    // Respond immediately — embedding happens in background
    res.json({
      documentId: doc._id,
      filename: doc.filename,
      isScanned,
      pageCount: totalPages,
      embeddingStatus: doc.embeddingStatus,
      message: totalPages > maxPages 
        ? `PDF successfully uploaded. (Note: Only the first ${maxPages} pages were processed to optimize performance.)` 
        : 'PDF successfully uploaded.'
    });

    // ---- BACKGROUND: chunk text & generate embeddings ----
    if (!isScanned && extractedText.trim().length > 0) {
      (async () => {
        try {
          const chunks = chunkTextForEmbedding(extractedText, 400, 50);
          if (chunks.length === 0) {
            doc.embeddingStatus = 'skipped';
            await doc.save();
            return;
          }

          const embeddingResults = await generateEmbeddingsBatch(chunks, 250);

          const chunkDocs = [];
          for (const result of embeddingResults) {
            if (result.embedding) {
              chunkDocs.push({
                documentId: doc._id,
                userId: req.user.id,
                chunkIndex: result.index,
                chunkText: chunks[result.index],
                embedding: result.embedding,
              });
            } else {
              console.warn(`Skipping chunk ${result.index} for doc ${doc._id}: ${result.error}`);
            }
          }

          if (chunkDocs.length > 0) {
            await DocumentChunk.insertMany(chunkDocs);
          }

          doc.embeddingStatus = chunkDocs.length > 0 ? 'ready' : 'failed';
          await doc.save();
          console.log(`Embeddings complete for doc ${doc._id}: ${chunkDocs.length}/${chunks.length} chunks indexed.`);
        } catch (err) {
          console.error(`Background embedding failed for doc ${doc._id}:`, err.message);
          try {
            doc.embeddingStatus = 'failed';
            await doc.save();
          } catch (_) { /* ignore save errors here */ }
        }
      })();
    }
  } catch (error) {
    console.error('Document upload error:', error);
    return res.status(500).json({ message: 'An unexpected error occurred during document processing.', error: error.message });
  }
};

/**
 * @desc    Summarize stored text using map-reduce if long
 * @route   POST /api/ai/document/:id/summarize
 * @access  Private
 */
exports.summarizeDocument = async (req, res) => {
  try {
    const docId = req.params.id;
    const userId = req.user.id;
    const userRole = String(req.user.role || 'student').toLowerCase();

    const doc = await UploadedDocument.findOne({ _id: docId, userId });
    if (!doc) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    if (doc.isScanned) {
      return res.status(400).json({ message: 'This PDF appears to be scanned/image-based and text could not be extracted for summarization.' });
    }

    if (!doc.extractedText || !doc.extractedText.trim()) {
      return res.status(400).json({ message: 'Document contains no readable text.' });
    }

    // Split text into chunks (~3000 tokens / 12,000 chars)
    const chunks = chunkText(doc.extractedText, 12000);
    let finalSummary = '';
    let totalTokens = 0;

    if (chunks.length === 1) {
      // Single prompt
      try {
        const { reply, usage } = await getChatCompletion([
          { role: 'system', content: 'You are a professional academic assistant. Provide a structured, concise, and comprehensive summary of the provided text. Use bullet points and paragraphs.' },
          { role: 'user', content: chunks[0] }
        ], { temperature: 0.3, maxTokens: 4096 });
        finalSummary = reply;
        totalTokens = usage?.total_tokens || 0;
      } catch (err) {
        console.error('OpenAI summarization error:', err.message);
        return res.status(502).json({ message: 'AI summarization failed. Please try again later.' });
      }
    } else {
      // Map-Reduce summarization
      const chunkSummaries = [];
      
      // Map stage
      for (let i = 0; i < chunks.length; i++) {
        try {
          const { reply, usage } = await getChatCompletion([
            { role: 'system', content: `You are an AI academic assistant. Summarize section ${i + 1} of a larger document. Focus on main topics, conclusions, and important facts.` },
            { role: 'user', content: chunks[i] }
          ], { temperature: 0.3, maxTokens: 2048 });
          chunkSummaries.push(reply);
          totalTokens += usage?.total_tokens || 0;
        } catch (err) {
          console.error(`Error summarizing chunk ${i}:`, err.message);
          chunkSummaries.push(`[Section ${i + 1} summary unavailable]`);
        }
      }

      // Reduce stage
      const combinedSummaries = chunkSummaries.join('\n\n');
      try {
        const { reply, usage } = await getChatCompletion([
          { role: 'system', content: 'You are an AI academic assistant. You are given summaries of various sections of a larger document. Combine and compile them into a single, cohesive, logically-structured, and concise overall summary of the entire document.' },
          { role: 'user', content: combinedSummaries }
        ], { temperature: 0.3, maxTokens: 4096 });
        finalSummary = reply;
        totalTokens += usage?.total_tokens || 0;
      } catch (err) {
        console.error('Error reducing summaries:', err.message);
        return res.status(502).json({ message: 'AI failed to condense section summaries. Please try again.' });
      }
    }

    doc.summary = finalSummary;
    await doc.save();

    // Log usage
    await logUsage(userId, userRole, 'summarize', totalTokens);

    return res.json({ summary: finalSummary });
  } catch (error) {
    console.error('Summarize document error:', error);
    return res.status(500).json({ message: 'An unexpected error occurred during summarization.', error: error.message });
  }
};

/**
 * @desc    Generate questions (MCQ/Short/Long) grounded in the PDF content
 * @route   POST /api/ai/document/:id/generate-questions
 * @access  Private
 */
exports.generateQuestions = async (req, res) => {
  try {
    const docId = req.params.id;
    const userId = req.user.id;
    const userRole = String(req.user.role || 'student').toLowerCase();
    const { questionType, count } = req.body;

    const doc = await UploadedDocument.findOne({ _id: docId, userId });
    if (!doc) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    if (doc.isScanned) {
      return res.status(400).json({ message: 'This PDF is scanned and text could not be extracted to generate questions.' });
    }

    const type = ['mcq', 'short', 'long'].includes(questionType) ? questionType : 'mcq';
    const targetCount = Math.min(Math.max(parseInt(count) || 5, 1), 15);

    // Limit text context for question generation to avoid token overflow
    const docSnippet = doc.extractedText.slice(0, 15000);

    const promptMessages = [
      {
        role: 'system',
        content: `You are an AI exam and quiz generation assistant. 
Based ONLY on the provided document content, generate exactly ${targetCount} questions of type: "${type}".
Include answers and explanations.

Format the output strictly as a valid JSON array. Do not wrap in Markdown fences, code blocks, or include any preamble. Output ONLY the JSON array matching this schema:
[
  {
    "question": "string (the question text)",
    "options": ["Option A", "Option B", "Option C", "Option D"], // ONLY include options field if type is 'mcq', must have exactly 4 choices
    "correctAnswer": "string (the correct answer. For MCQ, must match one of the options exactly. For short/long, provides a comprehensive correct answer model)",
    "explanation": "string (a detailed explanation referencing why the answer is correct based on the text)"
  }
]`
      },
      {
        role: 'user',
        content: `Document Content:
${docSnippet}

Generate exactly ${targetCount} ${type.toUpperCase()} questions now.`
      }
    ];

    let replyText = '';
    let tokensUsed = 0;
    try {
      const { reply, usage } = await getChatCompletion(promptMessages, { temperature: 0.4, maxTokens: 4096 });
      replyText = reply;
      tokensUsed = usage?.total_tokens || 0;
    } catch (err) {
      console.error('OpenAI question generation error:', err.message);
      return res.status(502).json({ message: 'AI question generation failed. Please try again later.' });
    }

    let parsed = [];
    try {
      let cleanReply = replyText.trim();
      if (cleanReply.startsWith('```')) {
        cleanReply = cleanReply.replace(/^```(json)?\n?/, '');
        cleanReply = cleanReply.replace(/\n?```$/, '');
      }
      parsed = JSON.parse(cleanReply.trim());
    } catch (parseErr) {
      console.error('Failed to parse generated questions JSON:', parseErr.message, replyText);
      return res.status(502).json({ message: 'The AI generated an invalid questions format. Please try again.' });
    }

    // Log usage
    await logUsage(userId, userRole, 'generate-questions', tokensUsed);

    return res.json({ questions: parsed });
  } catch (error) {
    console.error('Generate questions error:', error);
    return res.status(500).json({ message: 'An unexpected error occurred during question generation.', error: error.message });
  }
};

/**
 * @desc    Answer a question grounded strictly in the PDF content (RAG style)
 * @route   POST /api/ai/document/:id/ask
 * @access  Private
 */
exports.askDocument = async (req, res) => {
  try {
    const docId = req.params.id;
    const userId = req.user.id;
    const userRole = String(req.user.role || 'student').toLowerCase();
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ message: 'Question is required.' });
    }

    const doc = await UploadedDocument.findOne({ _id: docId, userId });
    if (!doc) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    if (doc.isScanned) {
      return res.status(400).json({ message: 'This PDF is scanned and text could not be extracted to answer questions.' });
    }

    // Perform RAG context retrieval
    const context = retrieveRelevantContext(doc.extractedText, question, 16000);

    const promptMessages = [
      {
        role: 'system',
        content: `You are an AI document Q&A assistant. 
You answer questions about the document based ONLY on the provided document context.

Strict rules:
1. Ground your answer ONLY in the provided document context. Do not use external knowledge or facts.
2. If the answer cannot be found in the provided context, you MUST respond exactly: "I am sorry, but that information is not covered in the document."
3. Do not make up facts or extrapolate beyond what is stated in the context.`
      },
      {
        role: 'user',
        content: `Document Context:
${context}

Question: ${question}`
      }
    ];

    let reply = '';
    let tokensUsed = 0;
    try {
      const result = await getChatCompletion(promptMessages, { temperature: 0.3 });
      reply = result.reply;
      tokensUsed = result.usage?.total_tokens || 0;
    } catch (err) {
      console.error('OpenAI Q&A error:', err.message);
      return res.status(502).json({ message: 'AI failed to generate an answer. Please try again.' });
    }

    // Log usage
    await logUsage(userId, userRole, 'chat', tokensUsed);

    return res.json({ reply });
  } catch (error) {
    console.error('Ask document error:', error);
    return res.status(500).json({ message: 'An unexpected error occurred during Q&A processing.', error: error.message });
  }
};

/**
 * @desc    List user's uploaded documents
 * @route   GET /api/ai/document
 * @access  Private
 */
exports.listDocuments = async (req, res) => {
  try {
    const docs = await UploadedDocument.find({ userId: req.user.id })
      .select('filename summary pageCount isScanned embeddingStatus createdAt')
      .sort({ createdAt: -1 });

    return res.json({ documents: docs });
  } catch (error) {
    console.error('List documents error:', error);
    return res.status(500).json({ message: 'Failed to list uploaded documents.' });
  }
};

/**
 * @desc    Delete a document
 * @route   DELETE /api/ai/document/:id
 * @access  Private
 */
exports.deleteDocument = async (req, res) => {
  try {
    const result = await UploadedDocument.deleteOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    // Cascade delete associated chunks
    await DocumentChunk.deleteMany({ documentId: req.params.id });

    return res.json({ message: 'Document deleted successfully.' });
  } catch (error) {
    console.error('Delete document error:', error);
    return res.status(500).json({ message: 'Failed to delete document.' });
  }
};

/**
 * @desc    Get full details of a single document
 * @route   GET /api/ai/document/:id
 * @access  Private
 */
exports.getDocument = async (req, res) => {
  try {
    const doc = await UploadedDocument.findOne({ _id: req.params.id, userId: req.user.id });
    if (!doc) {
      return res.status(404).json({ message: 'Document not found.' });
    }
    return res.json({ document: doc });
  } catch (error) {
    console.error('Get document details error:', error);
    return res.status(500).json({ message: 'Failed to fetch document details.' });
  }
};

/**
 * @desc    Ask a question across ALL of the user's uploaded documents (multi-doc RAG)
 * @route   POST /api/ai/document/ask-all
 * @access  Private
 */
exports.askAllDocuments = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = String(req.user.role || 'student').toLowerCase();
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ message: 'Question is required.' });
    }

    // Retrieve the most relevant chunks across all user documents
    let relevantChunks;
    try {
      relevantChunks = await retrieveRelevantChunks(userId, question, 5);
    } catch (err) {
      console.error('Vector search failed:', err.message);
      return res.status(502).json({ message: 'Failed to search your document library. Please try again.' });
    }

    if (!relevantChunks || relevantChunks.length === 0) {
      return res.json({
        answer: 'No relevant content was found across your uploaded documents. Please upload documents first, or try rephrasing your question.',
        sourcesUsed: [],
      });
    }

    // Build context from retrieved chunks, labeled by source document
    const contextParts = relevantChunks.map((chunk, i) =>
      `--- Context ${i + 1} from "${chunk.filename}" (relevance: ${(chunk.score * 100).toFixed(1)}%) ---\n${chunk.chunkText}`
    );
    const context = contextParts.join('\n\n');

    // Deduplicate sources
    const sourcesMap = new Map();
    for (const chunk of relevantChunks) {
      if (!sourcesMap.has(String(chunk.documentId))) {
        sourcesMap.set(String(chunk.documentId), {
          documentId: chunk.documentId,
          filename: chunk.filename,
        });
      }
    }
    const sourcesUsed = Array.from(sourcesMap.values());

    const promptMessages = [
      {
        role: 'system',
        content: `You are an AI document Q&A assistant with access to a student's uploaded study materials.
You answer questions based ONLY on the provided document context below.

Strict rules:
1. Ground your answer ONLY in the provided document context. Do not use external knowledge.
2. If the answer cannot be found in the provided context, respond: "I'm sorry, but that information is not covered in your uploaded documents."
3. Do not make up facts or extrapolate beyond what is stated.
4. When relevant, mention which source document(s) your answer draws from.
5. Use clear, well-structured markdown formatting.`
      },
      {
        role: 'user',
        content: `${context}\n\n---\nQuestion: ${question}`
      }
    ];

    let answer = '';
    let tokensUsed = 0;
    try {
      const result = await getChatCompletion(promptMessages, { temperature: 0.3, maxTokens: 2048 });
      answer = result.reply;
      tokensUsed = result.usage?.total_tokens || 0;
    } catch (err) {
      console.error('AI multi-doc Q&A error:', err.message);
      return res.status(502).json({ message: 'AI failed to generate an answer. Please try again.' });
    }

    // Log usage
    await logUsage(userId, userRole, 'ask-all-documents', tokensUsed);

    return res.json({ answer, sourcesUsed });
  } catch (error) {
    console.error('Ask all documents error:', error);
    return res.status(500).json({ message: 'An unexpected error occurred during multi-document Q&A.', error: error.message });
  }
};
