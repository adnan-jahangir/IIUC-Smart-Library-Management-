const Book = require('../models/Book');

/**
 * Returns a safe AI API key from the server environment.
 * Returns the configured key or an empty string when none is set.
 */
function getGeminiApiKey() {
  return process.env.AI_API_KEY || process.env.VITE_AI_API_KEY || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
}

/**
 * Formats the available books list for the AI prompt.
 * Returns a readable text block for the Gemini system instruction.
 */
function formatAvailableBooksList(availableBooks) {
  if (!Array.isArray(availableBooks) || availableBooks.length === 0) {
    return 'No books were provided.';
  }

  return availableBooks
    .map((book, index) => {
      const title = book?.title?.trim() || 'Untitled';
      const author = book?.author?.trim() || 'Unknown author';
      const subject = book?.subject?.trim() || 'Unspecified subject';
      const available = book?.available ? 'Available' : 'Unavailable';

      return `${index + 1}. ${title} | Author: ${author} | Subject: ${subject} | Status: ${available}`;
    })
    .join('\n');
}

/**
 * Builds the Gemini system instruction for the library assistant.
 * Returns a prompt string with policy and catalog guidance.
 */
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

/**
 * Normalizes conversation history into the Gemini message format.
 * Returns an array of user/model messages.
 */
function buildGeminiContents(conversationHistory, userMessage) {
  const history = Array.isArray(conversationHistory) ? conversationHistory : [];
  const contents = history
    .filter((message) => message && typeof message.content === 'string')
    .map((message) => {
      const role = message.role === 'assistant' ? 'model' : 'user';
      return {
        role,
        parts: [{ text: message.content.trim() }],
      };
    })
    .filter((message) => message.parts[0].text);

  const trimmedUserMessage = typeof userMessage === 'string' ? userMessage.trim() : '';

  if (trimmedUserMessage) {
    contents.push({
      role: 'user',
      parts: [{ text: trimmedUserMessage }],
    });
  }

  return contents;
}

/**
 * Extracts a plain text reply from a Gemini response payload.
 * Returns the assistant response string or an empty string when unavailable.
 */
function extractGeminiReply(responseData) {
  const candidates = responseData?.candidates || [];

  for (const candidate of candidates) {
    const parts = candidate?.content?.parts || [];
    const text = parts
      .map((part) => (typeof part?.text === 'string' ? part.text : ''))
      .join('')
      .trim();

    if (text) {
      return text;
    }
  }

  return '';
}

/**
 * Detects whether the user is asking for book suggestions or search help.
 * Returns true when the prompt is recommendation-oriented.
 */
function isBookRecommendationRequest(userMessage) {
  const message = String(userMessage || '').toLowerCase();
  return /recommend|suggest|search|book|books|compiler design|compiler/i.test(message);
}

/**
 * Escapes a string for safe use in a RegExp constructor.
 */
function escapeRegex(text) {
  return String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Attempts to pull book title lines from a model reply.
 * Returns an array of short title strings (may include author text).
 */
function extractRecommendedTitles(replyText) {
  if (!replyText || typeof replyText !== 'string') return [];

  const lines = replyText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const titles = [];

  // pattern: numbered lists (1. Title - Author)
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

    // If the line contains quotes, extract content inside quotes
    const quoteMatch = line.match(/"([^"]+)"|'([^']+)'/);
    if (quoteMatch) {
      titles.push((quoteMatch[1] || quoteMatch[2]).trim());
      continue;
    }
  }

  // If we didn't find list-like lines, try to find comma-separated suggestions
  if (titles.length === 0) {
    const suggestRe = /recommend(?:ed)?[:\-]?\s*(.+)/i;
    const m = replyText.match(suggestRe);
    if (m && m[1]) {
      // split by commas and take first 6
      const parts = m[1].split(/,|;|\band\b/).map((p) => p.trim()).filter(Boolean);
      for (const p of parts.slice(0, 6)) {
        titles.push(p.split(/\s+-\s+|\s+\|\s+|\s+by\s+/i)[0].trim());
      }
    }
  }

  // Deduplicate and limit
  return Array.from(new Set(titles)).slice(0, 6);
}

/**
 * Compute the Levenshtein edit distance between two strings.
 */
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

/**
 * Return a similarity score between 0 and 1 based on Levenshtein distance.
 */
function similarityScore(a, b) {
  const A = String(a || '').toLowerCase();
  const B = String(b || '').toLowerCase();
  if (!A && !B) return 0;
  const dist = levenshtein(A, B);
  const maxLen = Math.max(A.length, B.length);
  return maxLen === 0 ? 1 : 1 - dist / maxLen;
}

/**
 * Find fuzzy matches for a title/phrase in the Book collection.
 * Uses token-based DB narrowing then Levenshtein similarity ranking.
 */
async function findFuzzyMatches(phrase, limit = 6) {
  if (!phrase || !phrase.trim()) return [];
  const tokenQuery = buildBookSearchQuery(phrase);
  // widen search to a reasonable set
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
  // return those above a minimum threshold, else return top few
  const threshold = 0.38;
  const picked = scored.filter((s) => s.score >= threshold).slice(0, limit).map((s) => s.book);
  if (picked.length > 0) return picked;
  return scored.slice(0, Math.min(limit, scored.length)).map((s) => s.book);
}

/**
 * Extracts a JSON block between two marker strings in model reply text.
 * Returns parsed object or null when not found/parsable.
 */
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

/**
 * Detect roadmap requests.
 */
function isRoadmapRequest(userMessage) {
  const m = String(userMessage || '').toLowerCase();
  return /roadmap|study roadmap|study plan|build a roadmap|build a study|10-day|10 day study/i.test(m);
}

/**
 * Validate roadmap JSON schema.
 * Expected shape:
 * { title, focus, duration, timeline: [ { days, title, details, book, bookId } ], aiTip }
 */
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
  // aiTip optional but if present must be string
  if (obj.aiTip && typeof obj.aiTip !== 'string') return false;
  return true;
}

/**
 * Normalize an ISBN-like string by removing non-alphanumeric characters and uppercasing.
 */
function normalizeIsbn(isbn) {
  if (!isbn) return '';
  return String(isbn).replace(/[^0-9XxA-Za-z]/g, '').toUpperCase();
}

/**
 * Builds a case-insensitive regex query from the user's message.
 * Returns a MongoDB query that matches book title, author, category, or department.
 */
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

/**
 * Reads the body of a failed Gemini request.
 * Returns a short string for diagnostics.
 */
async function readFetchError(response) {
  try {
    const text = await response.text();
    return text.trim() || response.statusText || 'Unknown error';
  } catch {
    return response.statusText || 'Unknown error';
  }
}

/**
 * Calls the Gemini API with the chat history and returns the assistant reply.
 * Returns a promise that resolves to a plain text assistant message.
 */
async function sendChatToGemini(conversationHistory, userMessage, availableBooks, options = {}) {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error('Missing Gemini API key. Set GEMINI_API_KEY or VITE_GEMINI_API_KEY in the backend environment.');
  }

  const model = 'gemini-3.5-flash';
  const deterministic = options.deterministic === true;
  const temperature = deterministic ? 0.0 : 0.7;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: buildSystemPrompt(availableBooks) }],
      },
      contents: buildGeminiContents(conversationHistory, userMessage),
      generationConfig: {
        temperature,
        maxOutputTokens: 1024,
      },
    }),
  });

  if (!response.ok) {
    const errorDetails = await readFetchError(response);
    throw new Error(`Gemini request failed with status ${response.status} ${response.statusText}: ${errorDetails}`);
  }

  const data = await response.json();
  const reply = extractGeminiReply(data);

  if (!reply) {
    throw new Error('Gemini request succeeded but returned no assistant text.');
  }

  return reply;
}

// @desc    Return simple AI-based book recommendations (mock)
// @route   POST /api/ai/recommend
// @access  Private
exports.recommend = async (req, res) => {
  try {
    const { interests } = req.body; // e.g., ['compiler', 'algorithms']

    // Simple heuristic: find books with title or author matching interests
    const query = interests && interests.length ? { $or: interests.map(i => ({ title: new RegExp(i, 'i') })) } : {};
    const books = await Book.find(query).limit(6);

    res.json({ recommendations: books });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'AI recommend error', error: error.message });
  }
};

// @desc    Summarize a text or book (mock)
// @route   POST /api/ai/summarize
// @access  Private
exports.summarize = async (req, res) => {
  try {
    const { text, bookId } = req.body;
    if (bookId) {
      const book = await Book.findById(bookId);
      if (!book) return res.status(404).json({ message: 'Book not found' });
      // mock summary
      return res.json({ summary: `Summary of ${book.title}: A concise overview (mock).` });
    }
    if (!text) return res.status(400).json({ message: 'Text is required for summarization' });

    // mock summarization
    const snippet = text.slice(0, 200);
    res.json({ summary: `Summary (mock): ${snippet}...` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'AI summarize error', error: error.message });
  }
};

// @desc    Chat with the Gemini-powered library assistant
// @route   POST /api/ai/chat
// @access  Private
exports.chat = async (req, res) => {
  try {
    const { conversationHistory, userMessage, availableBooks } = req.body;

    if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
      return res.status(400).json({ message: 'userMessage is required' });
    }

    // When user asks for book recommendations or roadmap, enforce structured JSON where possible
    let reply = '';
    let recommendations = [];
    let generatedPlan = null;

    // Ensure the model has some catalog context: prefer a focused subset that matches the user's query
    let effectiveAvailableBooks = Array.isArray(availableBooks) && availableBooks.length ? availableBooks : [];
    if (!Array.isArray(effectiveAvailableBooks) || effectiveAvailableBooks.length === 0) {
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

    // Handle roadmap requests with strict JSON schema enforcement first
    if (isRoadmapRequest(userMessage)) {
      const startMarker = '###ROADMAP_START';
      const endMarker = '###ROADMAP_END';
      const roadmapInstruction = `${userMessage}\n\nPlease RESPOND ONLY with a JSON object between the markers ${startMarker} and ${endMarker} matching this schema:\n{ "title": "...", "focus": "...", "duration": "...", "timeline": [ { "days": "...", "title": "...", "details": "...", "book": "...", "bookId": number | null } ], "aiTip": "..." }\nDo not include any other text outside the markers.`;

      try {
        reply = await sendChatToGemini(conversationHistory, roadmapInstruction, effectiveAvailableBooks, { deterministic: true });
        const parsed = extractJsonBetweenMarkers(reply, startMarker, endMarker);
        if (parsed && validateRoadmapSchema(parsed)) {
          generatedPlan = parsed;
        } else {
          // retry once asking for strict JSON only
          const retryInstruction = `The previous response did not contain a valid roadmap JSON. RESPOND ONLY with the JSON object between ${startMarker} and ${endMarker} using the exact schema provided earlier.`;
          const retryReply = await sendChatToGemini(conversationHistory, retryInstruction, effectiveAvailableBooks, { deterministic: true });
          const retryParsed = extractJsonBetweenMarkers(retryReply, startMarker, endMarker);
          if (retryParsed && validateRoadmapSchema(retryParsed)) {
            generatedPlan = retryParsed;
            reply = retryReply;
          } else {
            // leave generatedPlan null and return human-readable reply
            // parsed content included for debugging
            return res.json({ reply, generatedPlan: null, generatedPlanRequireStructured: true, parsedCandidate: parsed || retryParsed || null });
          }
        }
        return res.json({ reply, generatedPlan, recommendations });
      } catch (err) {
        console.error('Roadmap generation error', err);
        return res.status(500).json({ message: 'Roadmap generation failed', error: err.message });
      }
    }

    if (isBookRecommendationRequest(userMessage)) {
      // ask the model to append a JSON block with recommendations between explicit markers
      const startMarker = '###RECOMMENDATIONS_START';
      const endMarker = '###RECOMMENDATIONS_END';
      const augmentedUserMessage = `${userMessage}\n\nIf you recommend books, at the end of your answer append a JSON object between the markers ${startMarker} and ${endMarker} with this shape:\n{ "recommendations": [ { "title": "...", "author": "...", "isbn": "..." } ] }\nIf you have no recommendations, set \"recommendations\": [] and still include the markers.`;

      reply = await sendChatToGemini(conversationHistory, augmentedUserMessage, effectiveAvailableBooks, { deterministic: true });

      // Try to parse the explicit JSON block first
      const parsed = extractJsonBetweenMarkers(reply, startMarker, endMarker);
      if (parsed && Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0) {
        // Validate structured recommendations: prefer entries that include an ISBN for deterministic mapping
        const cleaned = parsed.recommendations.filter((r) => r && (r.title || r.isbn || r.name));
        const parsedRecommendations = cleaned.slice(0, 6);
        // Check whether any parsed recommendation includes an ISBN; if so, enforce ISBN-first matching
        const anyHasIsbn = parsedRecommendations.some((r) => r.isbn && String(r.isbn).trim());

        if (anyHasIsbn) {
          const matched = [];
          for (const rec of parsedRecommendations) {
            if (!rec || !rec.isbn) continue;
            const norm = normalizeIsbn(rec.isbn);
            if (!norm) continue;
            // try exact-ish match against stored ISBN (non-strict regex to tolerate formatting)
            const book = await Book.findOne({ isbn: { $regex: norm, $options: 'i' } }).lean();
            if (book) matched.push(book);
          }

          // Return only books matched by ISBN to keep recommendations deterministic
          if (matched.length > 0) {
            recommendations = matched.slice(0, 6);
          } else {
            // No ISBN-resolved matches; attempt a single deterministic retry asking the model
            // to return only the structured JSON with ISBNs. This improves robustness when
            // the model suggests ISBNs with nonstandard formatting.
            try {
              const retryInstruction = `The previous suggestions did not match our catalog by ISBN.\nPlease RESPOND ONLY with a JSON object between the markers ${startMarker} and ${endMarker} with this exact shape:\n{ "recommendations": [ { "title": "...", "author": "...", "isbn": "..." } ] }\nDo not include any additional text.`;
              const retryMessage = `${retryInstruction}\n\nPrevious assistant reply:\n${reply}`;
              const retryReply = await sendChatToGemini(conversationHistory, retryMessage, effectiveAvailableBooks, { deterministic: true });
              const retryParsed = extractJsonBetweenMarkers(retryReply, startMarker, endMarker);
              if (retryParsed && Array.isArray(retryParsed.recommendations) && retryParsed.recommendations.length > 0) {
                const matchedRetry = [];
                for (const rec of retryParsed.recommendations.slice(0, 6)) {
                  if (!rec || !rec.isbn) continue;
                  const norm = normalizeIsbn(rec.isbn);
                  if (!norm) continue;
                  const book = await Book.findOne({ isbn: { $regex: norm, $options: 'i' } }).lean();
                  if (book) matchedRetry.push(book);
                }
                if (matchedRetry.length > 0) {
                  recommendations = matchedRetry.slice(0, 6);
                } else {
                  return res.json({ reply, recommendations: [], recommendationsRequireIsbn: true, parsedRecommendations, retryParsed });
                }
              } else {
                return res.json({ reply, recommendations: [], recommendationsRequireIsbn: true, parsedRecommendations });
              }
            } catch (retryErr) {
              console.error('Recommendation ISBN retry failed', retryErr);
              return res.json({ reply, recommendations: [], recommendationsRequireIsbn: true, parsedRecommendations });
            }
          }
        } else {
          // No ISBNs provided; fall back to title-based resolution (non-strict)
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

      // If no structured recommendations resolved, fall back to extracting titles from the human reply
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

      // final fallback: keyword search on the user's query
      if (recommendations.length === 0) {
        const searchQuery = buildBookSearchQuery(userMessage);
        const matchedBooks = await Book.find(searchQuery).limit(6);
        recommendations = matchedBooks.length > 0 ? matchedBooks : await Book.find({}).sort({ createdAt: -1 }).limit(6);
      }
    } else {
      // not a recommendation request: return regular reply
      reply = await sendChatToGemini(conversationHistory, userMessage, effectiveAvailableBooks, { deterministic: false });
    }

    return res.json({ reply, recommendations });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'AI chat error',
      error: error.message,
    });
  }
};