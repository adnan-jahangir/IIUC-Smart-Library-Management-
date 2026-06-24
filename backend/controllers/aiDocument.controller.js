const pdfParse = require('pdf-parse');
const UploadedDocument = require('../models/UploadedDocument');
const AiUsageLog = require('../models/AiUsageLog');
const { getChatCompletion } = require('../services/openaiService');

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
    try {
      pdfData = await pdfParse(req.file.buffer, { max: maxPages });
    } catch (err) {
      console.error('PDF parsing error:', err.message);
      return res.status(420).json({ message: 'Failed to read PDF. The file might be corrupted or password-protected.' });
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
      isScanned
    });

    return res.json({
      documentId: doc._id,
      filename: doc.filename,
      isScanned,
      pageCount: totalPages,
      message: totalPages > maxPages 
        ? `PDF successfully uploaded. (Note: Only the first ${maxPages} pages were processed to optimize performance.)` 
        : 'PDF successfully uploaded.'
    });
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
        ], { temperature: 0.3 });
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
          ], { temperature: 0.3 });
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
        ], { temperature: 0.3 });
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
      const { reply, usage } = await getChatCompletion(promptMessages, { temperature: 0.4 });
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
    await logUsage(userId, userRole, 'chat', tokensUsed);

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
      .select('filename summary pageCount isScanned createdAt')
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

