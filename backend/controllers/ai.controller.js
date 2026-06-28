const Book = require('../models/Book');
const AiUsageLog = require('../models/AiUsageLog');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';
const MODELS_FALLBACK = ['llama-3.3-70b-versatile'];

async function callGrokResponses(messages, options = {}) {
  const apiKey = process.env.GROQ_API_KEY || '';
  if (!apiKey) {
    throw new Error('Missing GROQ_API_KEY. Add it to your backend .env file.');
  }

  const payload = {
    model: options.model || DEFAULT_MODEL,
    messages: messages,
    temperature: options.temperature ?? 0.7,
  };

  if (options.response_format?.type === 'json_object') {
    payload.response_format = options.response_format;
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Groq API error: ${response.status} - ${errorText}`);
    const err = new Error(`Groq API Error: ${response.status} - ${errorText}`);
    err.status = response.status;
    throw err;
  }

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content || '';
  const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

  return { reply, usage };
}

// ---------------------------------------------------------------------------
// Helper: format book catalog for system prompt
// ---------------------------------------------------------------------------
function formatAvailableBooksList(availableBooks) {
  if (!Array.isArray(availableBooks) || availableBooks.length === 0) {
    return 'No books were provided.';
  }

  return availableBooks
    .map((book, index) => {
      const title = book?.title?.trim() || 'Untitled';
      const author = book?.author?.trim() || 'Unknown author';
      const subject = book?.subject?.trim() || book?.category?.trim() || 'Unspecified subject';
      const available = (book?.availableCopies > 0) ? 'Available' : 'Unavailable';

      return `${index + 1}. ${title} | Author: ${author} | Subject: ${subject} | Status: ${available}`;
    })
    .join('\n');
}

// ---------------------------------------------------------------------------
// Helper: build OpenAI system prompt
// ---------------------------------------------------------------------------
function buildSystemPrompt(availableBooks) {
  return [
    'You are a university library assistant for students, teachers, and administrators.',
    'Help users recommend books, summarize or explain book synopses, build study roadmaps, and answer library policy questions.',
    'Use the provided catalog when suggesting books, and prefer books that are marked available.',
    'If the user asks for something unavailable, offer the closest available alternatives from the catalog.',
    'Keep answers concise, helpful, and grounded in the provided library data.',
    '',
    'Available books:',
    formatAvailableBooksList(availableBooks),
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Helper: build Grok messages array from conversation history
// ---------------------------------------------------------------------------
function buildGrokMessages(conversationHistory, userMessage, systemPrompt) {
  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  const history = Array.isArray(conversationHistory) ? conversationHistory : [];
  for (const msg of history) {
    if (!msg || typeof msg.content !== 'string' || !msg.content.trim()) continue;
    const role = msg.role === 'assistant' ? 'assistant' : 'user';
    messages.push({ role, content: msg.content.trim() });
  }

  const trimmedUserMessage = typeof userMessage === 'string' ? userMessage.trim() : '';
  if (trimmedUserMessage) {
    messages.push({ role: 'user', content: trimmedUserMessage });
  }

  return messages;
}

// ---------------------------------------------------------------------------
// Helper: send chat to Grok
// ---------------------------------------------------------------------------
async function sendChatToGemini(conversationHistory, userMessage, availableBooks, options = {}) {
  const systemPrompt = buildSystemPrompt(availableBooks);
  const messages = buildGrokMessages(conversationHistory, userMessage, systemPrompt);
  const temperature = options.deterministic ? 0.0 : 0.7;

  try {
    const result = await callGrokResponses(messages, { temperature });
    return {
      reply: result.reply,
      modelUsed: DEFAULT_MODEL,
      usage: {
        prompt_tokens: result.usage.prompt_tokens || 0,
        completion_tokens: result.usage.completion_tokens || 0,
        total_tokens: result.usage.total_tokens || 0,
      },
      sources: null
    };
  } catch (error) {
    console.error('Chat Grok request failed:', error.message);
    const err = new Error(error.message);
    err.status = error.status || 500;
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Helper: log AI usage to MongoDB
// ---------------------------------------------------------------------------
async function logAiUsage(userId, feature, usage, modelUsed = DEFAULT_MODEL) {
  try {
    await AiUsageLog.create({
      user: userId,
      feature,
      model: modelUsed,
      promptTokens: usage?.prompt_tokens || 0,
      completionTokens: usage?.completion_tokens || 0,
      totalTokens: usage?.total_tokens || 0,
    });
  } catch (err) {
    // Never fail a request because logging failed
    console.error('Failed to log AI usage:', err.message);
  }
}

// ---------------------------------------------------------------------------
// Helper: detect recommendation / roadmap requests
// ---------------------------------------------------------------------------
function isBookRecommendationRequest(userMessage) {
  const message = String(userMessage || '').toLowerCase();
  return /recommend|suggest|search|book|books|compiler design|compiler/i.test(message);
}

function isRoadmapRequest(userMessage) {
  const m = String(userMessage || '').toLowerCase();
  return /roadmap|study roadmap|study plan|build a roadmap|build a study|10-day|10 day study/i.test(m);
}

// ---------------------------------------------------------------------------
// Helper: escape regex
// ---------------------------------------------------------------------------
function escapeRegex(text) {
  return String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---------------------------------------------------------------------------
// Helper: extract titles from AI response for book matching
// ---------------------------------------------------------------------------
function extractRecommendedTitles(replyText) {
  if (!replyText || typeof replyText !== 'string') return [];

  const lines = replyText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const titles = [];

  const numberedRe = /^\d+\.\s*(.+)$/;
  const dashRe = /^[-–]\s*(.+)$/;

  for (const line of lines) {
    let m = line.match(numberedRe);
    if (m && m[1]) {
      titles.push(m[1].split(/\s+-\s+|\s+\|\s+|\s+by\s+/i)[0].trim());
      continue;
    }

    m = line.match(dashRe);
    if (m && m[1]) {
      titles.push(m[1].split(/\s+-\s+|\s+\|\s+|\s+by\s+/i)[0].trim());
      continue;
    }

    const quoteMatch = line.match(/"([^"]+)"|'([^']+)'/);
    if (quoteMatch) {
      titles.push((quoteMatch[1] || quoteMatch[2]).trim());
      continue;
    }
  }

  if (titles.length === 0) {
    const suggestRe = /recommend(?:ed)?[:\-]?\s*(.+)/i;
    const m = replyText.match(suggestRe);
    if (m && m[1]) {
      const parts = m[1].split(/,|;|\band\b/).map((p) => p.trim()).filter(Boolean);
      for (const p of parts.slice(0, 6)) {
        titles.push(p.split(/\s+-\s+|\s+\|\s+|\s+by\s+/i)[0].trim());
      }
    }
  }

  return Array.from(new Set(titles)).slice(0, 6);
}

// ---------------------------------------------------------------------------
// Helper: ISBN normalisation
// ---------------------------------------------------------------------------
function normalizeIsbn(isbn) {
  if (!isbn) return '';
  return String(isbn).replace(/[^0-9XxA-Za-z]/g, '').toUpperCase();
}

// ---------------------------------------------------------------------------
// Helper: build book search query from user message
// ---------------------------------------------------------------------------
function buildBookSearchQuery(userMessage) {
  const tokens = String(userMessage || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !['recommend', 'suggest', 'search', 'book', 'books', 'for', 'the', 'and', 'with', 'please'].includes(token));

  if (tokens.length === 0) {
    return {};
  }

  return {
    $or: tokens.flatMap((token) => [
      { title: new RegExp(token, 'i') },
      { author: new RegExp(token, 'i') },
      { category: new RegExp(token, 'i') },
      { department: new RegExp(token, 'i') },
    ]),
  };
}

// ---------------------------------------------------------------------------
// Helper: Levenshtein / fuzzy matching
// ---------------------------------------------------------------------------
function levenshtein(a, b) {
  const A = String(a || '');
  const B = String(b || '');
  const m = A.length;
  const n = B.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const d = Array.from({ length: m + 1 }, (_, i) => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = A[i - 1] === B[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
    }
  }
  return d[m][n];
}

function similarityScore(a, b) {
  const A = String(a || '').toLowerCase();
  const B = String(b || '').toLowerCase();
  if (!A && !B) return 0;
  const dist = levenshtein(A, B);
  const maxLen = Math.max(A.length, B.length);
  return maxLen === 0 ? 1 : 1 - dist / maxLen;
}

async function findFuzzyMatches(phrase, limit = 6) {
  if (!phrase || !phrase.trim()) return [];
  const tokenQuery = buildBookSearchQuery(phrase);
  const candidates = await Book.find(tokenQuery).limit(50);
  const scored = candidates.map((b) => ({
    book: b,
    score: Math.max(
      similarityScore(phrase, b.title || ''),
      similarityScore(phrase, `${b.title || ''} ${b.author || ''}`),
      similarityScore(phrase, b.author || '')
    ),
  }));

  scored.sort((x, y) => y.score - x.score);
  const threshold = 0.38;
  const picked = scored.filter((s) => s.score >= threshold).slice(0, limit).map((s) => s.book);
  if (picked.length > 0) return picked;
  return scored.slice(0, Math.min(limit, scored.length)).map((s) => s.book);
}

// ---------------------------------------------------------------------------
// Helper: extract JSON between markers
// ---------------------------------------------------------------------------
function extractJsonBetweenMarkers(text, startMarker, endMarker) {
  if (!text || typeof text !== 'string') return null;
  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker, start + startMarker.length);
  if (start === -1 || end === -1) return null;
  const jsonText = text.substring(start + startMarker.length, end).trim();
  try {
    return JSON.parse(jsonText);
  } catch (err) {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Helper: validate roadmap schema
// ---------------------------------------------------------------------------
function validateRoadmapSchema(obj) {
  if (!obj || typeof obj !== 'object') return false;
  if (typeof obj.title !== 'string' || obj.title.trim().length === 0) return false;
  if (typeof obj.focus !== 'string') return false;
  if (typeof obj.duration !== 'string') return false;
  if (!Array.isArray(obj.timeline) || obj.timeline.length === 0) return false;
  for (const step of obj.timeline) {
    if (typeof step !== 'object') return false;
    if (typeof step.days !== 'string' || typeof step.title !== 'string' || typeof step.details !== 'string') return false;
  }
  if (obj.aiTip && typeof obj.aiTip !== 'string') return false;
  return true;
}

// ===========================================================================
// ROUTE HANDLERS
// ===========================================================================

// @desc    Return AI-based book recommendations
// @route   POST /api/ai/recommend
// @access  Private
exports.recommend = async (req, res) => {
  try {
    const { interests } = req.body;

    const query = interests && interests.length ? { $or: interests.map(i => ({ title: new RegExp(i, 'i') })) } : {};
    const books = await Book.find(query).limit(6);

    // Log usage (no OpenAI call for basic recommend, so 0 tokens)
    await logAiUsage(req.user.id, 'recommend', { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 });

    res.json({ recommendations: books });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'AI recommend error', error: error.message });
  }
};

// @desc    Summarize text using OpenAI
// @route   POST /api/ai/summarize
// @access  Private
exports.summarize = async (req, res) => {
  try {
    const { text, bookId } = req.body;
    let textToSummarize = text;

    if (bookId) {
      const book = await Book.findById(bookId);
      if (!book) return res.status(404).json({ message: 'Book not found' });
      textToSummarize = `Please provide a concise summary of the book "${book.title}" by ${book.author}. The book belongs to the ${book.department} department and is categorized as ${book.category || 'general'}.`;
    }

    if (!textToSummarize || !textToSummarize.trim()) {
      return res.status(400).json({ message: 'Text is required for summarization' });
    }

    const messages = [
      { role: 'system', content: 'You are a helpful academic assistant. Provide clear, concise summaries of the given text. Focus on key points and main ideas.' },
      { role: 'user', content: `Please summarize the following:\n\n${textToSummarize}` }
    ];

    try {
      const { reply, usage } = await callGrokResponses(messages, { temperature: 0.3 });
      await logAiUsage(req.user.id, 'summarize', usage, DEFAULT_MODEL);
      return res.json({ summary: reply });
    } catch (error) {
      console.error('Summarize Grok request failed:', error.message);
      const err = new Error(error.message);
      err.status = error.status || 500;
      throw err;
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'AI summarize error', error: error.message });
  }
};

// @desc    Chat with the OpenAI-powered library assistant
// @route   POST /api/ai/chat
// @access  Private
exports.chat = async (req, res) => {
  try {
    const { conversationHistory, userMessage, availableBooks } = req.body;

    if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
      return res.status(400).json({ message: 'userMessage is required' });
    }

    let reply = '';
    let recommendations = [];
    let generatedPlan = null;
    let sources = null;
    let totalUsage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    // Ensure some catalog context
    let effectiveAvailableBooks = Array.isArray(availableBooks) && availableBooks.length ? availableBooks : [];
    if (effectiveAvailableBooks.length === 0) {
      try {
        const searchQuery = buildBookSearchQuery(userMessage);
        if (Object.keys(searchQuery).length > 0) {
          effectiveAvailableBooks = await Book.find(searchQuery).lean().limit(20);
        } else {
          effectiveAvailableBooks = await Book.find({}).sort({ createdAt: -1 }).lean().limit(100);
        }
      } catch (err) {
        effectiveAvailableBooks = [];
      }
    }

    // --- Handle roadmap requests ---
    if (isRoadmapRequest(userMessage)) {
      const startMarker = '###ROADMAP_START';
      const endMarker = '###ROADMAP_END';
      const roadmapInstruction = `${userMessage}\n\nPlease RESPOND ONLY with a JSON object between the markers ${startMarker} and ${endMarker} matching this schema:\n{ "title": "...", "focus": "...", "duration": "...", "timeline": [ { "days": "...", "title": "...", "details": "...", "book": "...", "bookId": number | null } ], "aiTip": "..." }\nDo not include any other text outside the markers.`;

      try {
        const result = await sendChatToGemini(conversationHistory, roadmapInstruction, effectiveAvailableBooks, { deterministic: true });
        reply = result.reply;
        totalUsage = result.usage;

        const parsed = extractJsonBetweenMarkers(reply, startMarker, endMarker);
        if (parsed && validateRoadmapSchema(parsed)) {
          generatedPlan = parsed;
        } else {
          // retry once
          const retryInstruction = `The previous response did not contain a valid roadmap JSON. RESPOND ONLY with the JSON object between ${startMarker} and ${endMarker} using the exact schema provided earlier.`;
          const retryResult = await sendChatToGemini(conversationHistory, retryInstruction, effectiveAvailableBooks, { deterministic: true });
          const retryParsed = extractJsonBetweenMarkers(retryResult.reply, startMarker, endMarker);
          totalUsage.prompt_tokens += retryResult.usage.prompt_tokens || 0;
          totalUsage.completion_tokens += retryResult.usage.completion_tokens || 0;
          totalUsage.total_tokens += retryResult.usage.total_tokens || 0;

          if (retryParsed && validateRoadmapSchema(retryParsed)) {
            generatedPlan = retryParsed;
            reply = retryResult.reply;
          } else {
            await logAiUsage(req.user.id, 'chat', totalUsage);
            return res.json({ reply, generatedPlan: null, generatedPlanRequireStructured: true, parsedCandidate: parsed || retryParsed || null });
          }
        }

        await logAiUsage(req.user.id, 'chat', totalUsage);
        return res.json({ reply, generatedPlan, recommendations });
      } catch (err) {
        console.error('Roadmap generation error', err);
        return res.status(500).json({ message: 'Roadmap generation failed', error: err.message });
      }
    }

    // --- Handle recommendation requests ---
    if (isBookRecommendationRequest(userMessage)) {
      const startMarker = '###RECOMMENDATIONS_START';
      const endMarker = '###RECOMMENDATIONS_END';
      const augmentedUserMessage = `${userMessage}\n\nIf you recommend books, at the end of your answer append a JSON object between the markers ${startMarker} and ${endMarker} with this shape:\n{ "recommendations": [ { "title": "...", "author": "...", "isbn": "..." } ] }\nIf you have no recommendations, set "recommendations": [] and still include the markers.`;

      const result = await sendChatToGemini(conversationHistory, augmentedUserMessage, effectiveAvailableBooks, { deterministic: true });
      reply = result.reply;
      totalUsage = result.usage;

      // Try structured JSON block
      const parsed = extractJsonBetweenMarkers(reply, startMarker, endMarker);
      if (parsed && Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0) {
        const cleaned = parsed.recommendations.filter((r) => r && (r.title || r.isbn || r.name));
        const parsedRecommendations = cleaned.slice(0, 6);
        const anyHasIsbn = parsedRecommendations.some((r) => r.isbn && String(r.isbn).trim());

        if (anyHasIsbn) {
          const matched = [];
          for (const rec of parsedRecommendations) {
            if (!rec || !rec.isbn) continue;
            const norm = normalizeIsbn(rec.isbn);
            if (!norm) continue;
            const book = await Book.findOne({ isbn: { $regex: norm, $options: 'i' } }).lean();
            if (book) matched.push(book);
          }
          if (matched.length > 0) {
            recommendations = matched.slice(0, 6);
          }
        }
        
        if (recommendations.length === 0) {
          // Title-based resolution
          const matched = [];
          for (const rec of parsedRecommendations) {
            const maybeTitle = rec.title || rec.name || '';
            if (!maybeTitle) continue;
            const titleRe = new RegExp(escapeRegex(maybeTitle), 'i');
            const book = await Book.findOne({ title: titleRe }).lean();
            if (book) {
              matched.push(book);
              continue;
            }
            const fuzzy = await findFuzzyMatches(maybeTitle, 3);
            for (const b of fuzzy) {
              if (!matched.find((x) => String(x._id) === String(b._id))) matched.push(b);
            }
          }
          recommendations = matched.slice(0, 6);
        }
      }

      // Fallback: extract titles from human reply
      if (recommendations.length === 0) {
        const extractedTitles = extractRecommendedTitles(reply);
        if (extractedTitles.length > 0) {
          const matched = [];
          for (const t of extractedTitles) {
            const titleRe = new RegExp(escapeRegex(t), 'i');
            const book = await Book.findOne({ title: titleRe });
            if (book) {
              matched.push(book);
              continue;
            }
            const fuzzy = await findFuzzyMatches(t, 3);
            for (const b of fuzzy) {
              if (!matched.find((x) => String(x._id) === String(b._id))) matched.push(b);
            }
          }
          recommendations = matched.slice(0, 6);
        }
      }

      // Final fallback: keyword search
      if (recommendations.length === 0) {
        const searchQuery = buildBookSearchQuery(userMessage);
        const matchedBooks = await Book.find(searchQuery).limit(6);
        recommendations = matchedBooks.length > 0 ? matchedBooks : await Book.find({}).sort({ createdAt: -1 }).limit(6);
      }
    } else {
      // Regular chat message
      const result = await sendChatToGemini(conversationHistory, userMessage, effectiveAvailableBooks, { deterministic: false });
      reply = result.reply;
      totalUsage = result.usage;
      sources = result.sources || null;
    }

    await logAiUsage(req.user.id, 'chat', totalUsage);
    return res.json({ reply, recommendations, sources });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'AI chat error',
      error: error.message,
    });
  }
};

// @desc    Get AI usage stats (for admin dashboard)
// @route   GET /api/ai/usage
// @access  Private (Admin)
exports.getUsageStats = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const stats = await AiUsageLog.aggregate([
      { $match: { timestamp: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: '$feature',
          totalRequests: { $sum: 1 },
          totalTokens: { $sum: '$totalTokens' },
          totalPromptTokens: { $sum: '$promptTokens' },
          totalCompletionTokens: { $sum: '$completionTokens' },
        },
      },
    ]);

    const recentLogs = await AiUsageLog.find()
      .sort({ timestamp: -1 })
      .limit(50)
      .populate('user', 'name email customId role');

    res.json({ stats, recentLogs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch AI usage stats', error: error.message });
  }
};

// @desc    Generate accurate book insights using AI
// @route   GET /api/ai/book-insight/:bookId
// @access  Private
exports.getBookInsight = async (req, res) => {
  try {
    const { bookId } = req.params;
    let book;
    if (bookId && bookId.match(/^[0-9a-fA-F]{24}$/)) {
      book = await Book.findById(bookId);
    }
    if (!book) {
      book = await Book.findOne({ customId: bookId });
    }
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const systemPrompt = `You are an expert academic librarian. Generate an accurate, highly-detailed educational overview of the textbook:
"${book.title}" by ${book.author}.

The output MUST be a valid JSON object matching the exact structure below, without Markdown blocks or additional text:
{
  "synopsis": "A comprehensive 2-paragraph summary explaining the core focus, target audience, and educational value of this textbook.",
  "chapters": [
    { "num": 1, "name": "Chapter 1: Name of Chapter", "description": "Brief details of what this chapter teaches." },
    { "num": 2, "name": "Chapter 2: Name of Chapter", "description": "Brief details of what this chapter teaches." },
    { "num": 3, "name": "Chapter 3: Name of Chapter", "description": "Brief details of what this chapter teaches." },
    { "num": 4, "name": "Chapter 4: Name of Chapter", "description": "Brief details of what this chapter teaches." }
  ],
  "keyTakeaways": [
    "Key concept or core curriculum topic covered",
    "Another key concept or core curriculum topic covered"
  ]
}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Generate a JSON overview for "${book.title}" by ${book.author} based on the system instruction.` }
    ];

    let replyText = '';
    let totalUsage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    try {
      const { reply, usage } = await callGrokResponses(messages, { 
        temperature: 0.3, 
        response_format: { type: "json_object" } 
      });
      replyText = reply;
      totalUsage = usage;
    } catch (err) {
      console.error('Book insight Grok request failed:', err.message);
      return res.status(502).json({ message: 'Failed to generate book insights.' });
    }

    let parsed;
    try {
      let cleanJson = replyText.trim();
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```/, '').replace(/```$/, '').trim();
      }
      parsed = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.error('Failed to parse book insight JSON:', parseErr.message, replyText);
      return res.status(502).json({ message: 'Failed to generate a clean book insight format. Please try again.' });
    }

    // Log usage
    await logAiUsage(req.user.id, 'book-insight', totalUsage, DEFAULT_MODEL);

    return res.json({ insight: parsed });
  } catch (error) {
    console.error('Book insight error:', error);
    return res.status(500).json({ message: 'Failed to generate book insights.', error: error.message });
  }
};