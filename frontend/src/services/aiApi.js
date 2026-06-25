import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Returns the auth headers for the current user.
 */
function authHeaders(token) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
}

// ===========================================================================
// Session-based Chat API
// ===========================================================================

/**
 * Send a chat message (non-streaming).
 * @param {string} token - JWT token
 * @param {string} message - User message
 * @param {string|null} sessionId - Existing session ID or null for new chat
 * @returns {{ sessionId, reply, title }}
 */
export async function sendChatMessage(token, message, sessionId = null) {
  const res = await axios.post(
    `${API_BASE}/api/ai/chat`,
    { message, sessionId, stream: false },
    authHeaders(token)
  );
  return res.data;
}

/**
 * Send a chat message with streaming (SSE).
 * Returns an object with:
 *   - reader: async generator yielding { token?, done?, error?, usage?, fullReply? }
 *   - abort: function to cancel the stream
 *
 * @param {string} token - JWT token
 * @param {string} message - User message
 * @param {string|null} sessionId - Existing session ID or null
 */
export function sendChatMessageStreaming(token, message, sessionId = null) {
  const controller = new AbortController();

  const readerPromise = (async function* () {
    const response = await fetch(`${API_BASE}/api/ai/chat`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, sessionId, stream: true }),
      signal: controller.signal,
    });

    if (!response.ok) {
      let errorMsg = 'Chat request failed.';
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
      } catch {
        // ignore parse errors
      }
      yield { error: errorMsg };
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // keep incomplete line in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const jsonStr = trimmed.slice(6);
        try {
          const parsed = JSON.parse(jsonStr);
          yield parsed;
          if (parsed.done || parsed.error) return;
        } catch {
          // skip unparseable chunks
        }
      }
    }
  })();

  return {
    reader: readerPromise,
    abort: () => controller.abort(),
  };
}

// ===========================================================================
// Session Management
// ===========================================================================

/**
 * List all chat sessions for the current user.
 */
export async function listChatSessions(token) {
  const res = await axios.get(
    `${API_BASE}/api/ai/chat/sessions`,
    authHeaders(token)
  );
  return res.data.sessions;
}

/**
 * Get full session history by ID.
 */
export async function getChatSession(token, sessionId) {
  const res = await axios.get(
    `${API_BASE}/api/ai/chat/sessions/${sessionId}`,
    authHeaders(token)
  );
  return res.data.session;
}

/**
 * Delete a chat session.
 */
export async function deleteChatSession(token, sessionId) {
  await axios.delete(
    `${API_BASE}/api/ai/chat/sessions/${sessionId}`,
    authHeaders(token)
  );
}

/**
 * Rename a chat session.
 */
export async function renameChatSession(token, sessionId, title) {
  const res = await axios.patch(
    `${API_BASE}/api/ai/chat/sessions/${sessionId}/title`,
    { title },
    authHeaders(token)
  );
  return res.data;
}

// ===========================================================================
// Recommendations API
// ===========================================================================

/**
 * Fetches personalized book recommendations for students.
 * @param {string} token - JWT token
 * @param {Object} data - optional { interests, recentlyBorrowedBookIds, subject }
 */
export async function getStudentRecommendations(token, data = {}) {
  const res = await axios.post(
    `${API_BASE}/api/ai/recommend/books`,
    data,
    authHeaders(token)
  );
  return res.data;
}

/**
 * Fetches book recommendations for a class (for teachers).
 * @param {string} token - JWT token
 * @param {Object} data - { subject, gradeLevel, count }
 */
export async function getClassRecommendations(token, data) {
  const res = await axios.post(
    `${API_BASE}/api/ai/recommend/class-books`,
    data,
    authHeaders(token)
  );
  return res.data;
}

// ===========================================================================
// Document Assistant API
// ===========================================================================

/**
 * Uploads a PDF document to the server.
 * @param {string} token - JWT token
 * @param {File} file - PDF file object
 * @param {Function} onUploadProgress - Callback to monitor upload progress
 */
export async function uploadDocument(token, file, onUploadProgress) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await axios.post(`${API_BASE}/api/ai/document/upload`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress
  });
  return res.data;
}

/**
 * Summarize an uploaded document.
 * @param {string} token - JWT token
 * @param {string} documentId - ID of the document
 */
export async function summarizeDocument(token, documentId) {
  const res = await axios.post(
    `${API_BASE}/api/ai/document/${documentId}/summarize`,
    {},
    authHeaders(token)
  );
  return res.data;
}

/**
 * Generate study questions from a document.
 * @param {string} token - JWT token
 * @param {string} documentId - ID of the document
 * @param {Object} params - { questionType: "mcq"|"short"|"long", count }
 */
export async function generateDocumentQuestions(token, documentId, params) {
  const res = await axios.post(
    `${API_BASE}/api/ai/document/${documentId}/generate-questions`,
    params,
    authHeaders(token)
  );
  return res.data;
}

/**
 * Ask a question grounded in the document content.
 * @param {string} token - JWT token
 * @param {string} documentId - ID of the document
 * @param {string} question - Question text
 */
export async function askDocumentQuestion(token, documentId, question) {
  const res = await axios.post(
    `${API_BASE}/api/ai/document/${documentId}/ask`,
    { question },
    authHeaders(token)
  );
  return res.data;
}

/**
 * List all uploaded documents for the user.
 * @param {string} token - JWT token
 */
export async function listUploadedDocuments(token) {
  const res = await axios.get(
    `${API_BASE}/api/ai/document`,
    authHeaders(token)
  );
  return res.data.documents;
}

/**
 * Delete an uploaded document.
 * @param {string} token - JWT token
 * @param {string} documentId - ID of the document
 */
export async function deleteUploadedDocument(token, documentId) {
  await axios.delete(
    `${API_BASE}/api/ai/document/${documentId}`,
    authHeaders(token)
  );
}

/**
 * Ask a question across ALL of the user's uploaded documents (multi-doc RAG).
 * @param {string} token - JWT token
 * @param {string} question - Question text
 * @returns {{ answer: string, sourcesUsed: Array<{documentId: string, filename: string}> }}
 */
export async function askAllDocuments(token, question) {
  const res = await axios.post(
    `${API_BASE}/api/ai/document/ask-all`,
    { question },
    authHeaders(token)
  );
  return res.data;
}

// ===========================================================================
// Roadmap Generator API
// ===========================================================================

/**
 * Generate a new learning roadmap.
 * @param {string} token - JWT token
 * @param {Object} data - { topic, currentLevel, goal, durationWeeks }
 */
export async function generateRoadmap(token, data) {
  const res = await axios.post(
    `${API_BASE}/api/ai/roadmap`,
    data,
    authHeaders(token)
  );
  return res.data;
}

/**
 * Get roadmap history.
 * @param {string} token - JWT token
 */
export async function listRoadmapHistory(token) {
  const res = await axios.get(
    `${API_BASE}/api/ai/roadmap`,
    authHeaders(token)
  );
  return res.data.roadmaps;
}

/**
 * Get a specific roadmap by ID.
 * @param {string} token - JWT token
 * @param {string} id - Roadmap ID
 */
export async function getRoadmapById(token, id) {
  const res = await axios.get(
    `${API_BASE}/api/ai/roadmap/${id}`,
    authHeaders(token)
  );
  return res.data.roadmap;
}

// ===========================================================================
// Algorithms & System Logic Visualizer API
// ===========================================================================

/**
 * Get AI explanation for standard DSA algorithm.
 */
export async function explainAlgorithm(token, algorithmName) {
  const res = await axios.post(
    `${API_BASE}/api/ai/algorithms/explain-algorithm`,
    { algorithmName },
    authHeaders(token)
  );
  return res.data;
}

/**
 * Get structured flowchart for a library system logic.
 */
export async function explainSystemLogic(token, logicType) {
  const res = await axios.post(
    `${API_BASE}/api/ai/algorithms/explain-system/${logicType}`,
    {},
    authHeaders(token)
  );
  return res.data;
}

// ===========================================================================
// Notifications API
// ===========================================================================

export async function getNotifications(token) {
  const res = await axios.get(`${API_BASE}/api/ai/notifications`, authHeaders(token));
  return res.data;
}

export async function markNotificationAsRead(token, id) {
  const res = await axios.patch(`${API_BASE}/api/ai/notifications/${id}/read`, {}, authHeaders(token));
  return res.data;
}

export async function getFineSummary(token) {
  const res = await axios.get(`${API_BASE}/api/ai/notifications/fine-summary`, authHeaders(token));
  return res.data;
}

// ===========================================================================
// Teacher AI Tools API
// ===========================================================================

export async function generateReadingList(token, params) {
  const res = await axios.post(`${API_BASE}/api/ai/teacher/reading-list`, params, authHeaders(token));
  return res.data;
}

export async function generateSyllabusQuiz(token, params) {
  const res = await axios.post(`${API_BASE}/api/ai/teacher/quiz-from-syllabus`, params, authHeaders(token));
  return res.data;
}

export async function getClassInsights(token) {
  const res = await axios.get(`${API_BASE}/api/ai/teacher/class-insights`, authHeaders(token));
  return res.data;
}

export async function getBookInsight(token, bookId) {
  const res = await axios.get(`${API_BASE}/api/ai/book-insight/${bookId}`, authHeaders(token));
  return res.data;
}
