const AI_API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/ai/chat`;

/**
 * Formats a single book entry for inclusion in the system prompt.
 * Returns a human-readable string describing one book.
 */
function formatBookLine(book, index) {
  const title = book?.title?.trim() || 'Untitled';
  const author = book?.author?.trim() || 'Unknown author';
  const subject = book?.subject?.trim() || 'Unspecified subject';
  const available = book?.available ? 'Available' : 'Unavailable';

  return `${index + 1}. ${title} | Author: ${author} | Subject: ${subject} | Status: ${available}`;
}

/**
 * Formats the available books list for the system prompt.
 * Returns a text block that the AI can reference while answering.
 */
function formatAvailableBooksList(availableBooks) {
  if (!Array.isArray(availableBooks) || availableBooks.length === 0) {
    return 'No books were provided.';
  }

  return availableBooks.map(formatBookLine).join('\n');
}

/**
 * Builds the system prompt that guides the assistant as a university library helper.
 * Returns a single prompt string containing the catalog and behavior instructions.
 */
export function buildSystemPrompt(availableBooks) {
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
 * Normalizes a single conversation entry to the format required by the chat API.
 * Returns a message object or null when the entry should be skipped.
 */
function normalizeHistoryMessage(message) {
  if (!message || typeof message.content !== 'string') {
    return null;
  }

  if (message.role !== 'user' && message.role !== 'assistant') {
    return null;
  }

  const content = message.content.trim();

  if (!content) {
    return null;
  }

  return {
    role: message.role,
    content,
  };
}

/**
 * Builds the conversation payload for the chat API.
 * Returns an ordered array of user and assistant messages.
 */
export function buildMessages(conversationHistory, userMessage) {
  const history = Array.isArray(conversationHistory)
    ? conversationHistory.map(normalizeHistoryMessage).filter(Boolean)
    : [];
  const trimmedMessage = typeof userMessage === 'string' ? userMessage.trim() : '';

  if (trimmedMessage) {
    history.push({
      role: 'user',
      content: trimmedMessage,
    });
  }

  return history;
}

/**
 * Builds the base request headers for the backend chat proxy.
 * Returns headers suitable for JSON requests.
 */
function buildRequestHeaders(authToken) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  return headers;
}

/**
 * Extracts a text reply from the backend chat response payload.
 * Returns the assistant reply as a plain string or an empty string when missing.
 */
function extractAssistantReply(responseData) {
  const candidates = [
    responseData?.reply,
    responseData?.text,
    responseData?.message,
    responseData?.response,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }

    if (Array.isArray(candidate)) {
      const text = candidate
        .map((part) => {
          if (typeof part === 'string') {
            return part;
          }

          if (part && typeof part.text === 'string') {
            return part.text;
          }

          return '';
        })
        .join('')
        .trim();

      if (text) {
        return text;
      }
    }
  }

  return '';
}

/**
 * Reads an error payload from a failed backend response.
 * Returns a short string describing the failure.
 */
async function readErrorDetails(response) {
  try {
    const text = await response.text();
    return text.trim() || response.statusText || 'Unknown error';
  } catch {
    return response.statusText || 'Unknown error';
  }
}

/**
 * Sends the conversation to the backend chat proxy and returns the assistant reply.
 * Returns a promise that resolves to the assistant reply data.
 */
export async function sendMessageToAI(conversationHistory, userMessage, availableBooks, authToken) {
  const response = await fetch(AI_API_URL, {
    method: 'POST',
    headers: buildRequestHeaders(authToken),
    body: JSON.stringify({
      conversationHistory: buildMessages(conversationHistory, ''),
      userMessage,
      availableBooks,
    }),
  });

  if (!response.ok) {
    const errorDetails = await readErrorDetails(response);
    throw new Error(`AI request failed with status ${response.status} ${response.statusText}: ${errorDetails}`);
  }

  const data = await response.json();
  const assistantReply = extractAssistantReply(data);

  if (!assistantReply) {
    throw new Error('AI request succeeded but the assistant reply was empty.');
  }

  return {
    reply: assistantReply,
    recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
    generatedPlan: data.generatedPlan || null,
    generatedPlanRequireStructured: !!data.generatedPlanRequireStructured,
    parsedCandidate: data.parsedCandidate || null,
    recommendationsRequireIsbn: !!data.recommendationsRequireIsbn,
  };
}