const ChatSession = require('../models/ChatSession');
const AiUsageLog = require('../models/AiUsageLog');
const {
  getChatCompletion,
  getStreamingChatCompletion,
  buildSystemPrompt,
} = require('../services/openaiService');

// ---------------------------------------------------------------------------
// Helper: log usage
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Helper: auto-generate a short title from the first user message
// ---------------------------------------------------------------------------
function generateTitle(message) {
  const clean = String(message || '').trim();
  if (!clean) return 'New Chat';
  // Take first 60 chars and add ellipsis if longer
  return clean.length > 60 ? clean.slice(0, 57) + '...' : clean;
}

// ---------------------------------------------------------------------------
// Helper: build messages array for Gemini from a ChatSession
// ---------------------------------------------------------------------------
function buildMessagesForGemini(session, role, newUserMessage) {
  const systemPrompt = buildSystemPrompt(role);
  const messages = [{ role: 'system', content: systemPrompt }];

  // Add conversation history (skip system messages)
  for (const msg of session.messages) {
    if (msg.role === 'user' || msg.role === 'assistant') {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  // Add the new user message
  if (newUserMessage) {
    messages.push({ role: 'user', content: newUserMessage });
  }

  return messages;
}

// ===========================================================================
// POST /api/ai/chat — Send a message (with optional streaming)
// ===========================================================================
exports.sendMessage = async (req, res) => {
  try {
    const { sessionId, message, stream } = req.body;
    const userId = req.user.id;
    const userRole = String(req.user.role || 'student').toLowerCase();

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ message: 'Message is required.' });
    }

    const trimmedMessage = message.trim();

    // Find or create session
    let session;
    if (sessionId) {
      session = await ChatSession.findOne({ _id: sessionId, userId });
      if (!session) {
        return res.status(404).json({ message: 'Chat session not found.' });
      }
    } else {
      // Create a new session
      session = await ChatSession.create({
        userId,
        title: generateTitle(trimmedMessage),
        messages: [],
      });
    }

    // Save user message to session
    session.messages.push({
      role: 'user',
      content: trimmedMessage,
      timestamp: new Date(),
    });
    await session.save();

    // Build messages
    const aiMessages = buildMessagesForGemini(session, userRole, null); // message already pushed

    // --- Streaming path ---
    if (stream) {
      try {
        const result = await getStreamingChatCompletion(
          aiMessages,
          res,
          { temperature: 0.7 }
        );

        // After streaming completes, save assistant reply
        if (result && result.reply) {
          session.messages.push({
            role: 'assistant',
            content: result.reply,
            timestamp: new Date(),
          });
          await session.save();
          await logUsage(userId, userRole, 'chat', result.usage?.total_tokens);
        }
      } catch (streamErr) {
        // Error already sent to client via SSE
        console.error('Streaming chat error:', streamErr.message);
        await logUsage(userId, userRole, 'chat', 0);
      }
      return; // response already ended by SSE
    }

    // --- Non-streaming path ---
    try {
      const { reply, usage, sources } = await getChatCompletion(aiMessages, {
        temperature: 0.7,
      });

      // Save assistant reply
      session.messages.push({
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      });
      await session.save();

      await logUsage(userId, userRole, 'chat', usage?.total_tokens);

      return res.json({
        sessionId: session._id,
        reply,
        title: session.title,
        sources: sources || null,
      });
    } catch (aiErr) {
      console.error('Gemini chat error:', aiErr.message);

      let friendlyMessage = 'Sorry, I encountered an error while generating a response. Please try again.';
      if (aiErr.status === 429) {
        friendlyMessage = 'The AI service is temporarily overloaded or you exceeded your quota. Please try again in a moment.';
      } else if (aiErr.status === 401) {
        friendlyMessage = 'Invalid API key. Please check your .env configuration.';
      }

      return res.status(502).json({
        message: friendlyMessage,
        sessionId: session._id,
      });
    }
  } catch (error) {
    console.error('Chat controller error:', error);
    return res.status(500).json({
      message: 'An unexpected error occurred.',
      error: error.message,
    });
  }
};

// ===========================================================================
// GET /api/ai/chat/sessions — List user's chat sessions
// ===========================================================================
exports.listSessions = async (req, res) => {
  try {
    const sessions = await ChatSession.find({ userId: req.user.id })
      .select('_id title createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .limit(50);

    return res.json({ sessions });
  } catch (error) {
    console.error('List sessions error:', error);
    return res.status(500).json({ message: 'Failed to list sessions.' });
  }
};

// ===========================================================================
// GET /api/ai/chat/sessions/:id — Get one session's full history
// ===========================================================================
exports.getSession = async (req, res) => {
  try {
    const session = await ChatSession.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    return res.json({ session });
  } catch (error) {
    console.error('Get session error:', error);
    return res.status(500).json({ message: 'Failed to load session.' });
  }
};

// ===========================================================================
// DELETE /api/ai/chat/sessions/:id — Delete a session
// ===========================================================================
exports.deleteSession = async (req, res) => {
  try {
    const result = await ChatSession.deleteOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    return res.json({ message: 'Session deleted.' });
  } catch (error) {
    console.error('Delete session error:', error);
    return res.status(500).json({ message: 'Failed to delete session.' });
  }
};
