import { useEffect, useState } from 'react';
import { sendMessageToAI } from '../services/libraryAI';

/**
 * Creates a stable chat message object for the local UI state.
 * Returns a message with id, role, content, and timestamp.
 */
function createChatMessage(role, content) {
  return {
    id: typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role,
    content,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Converts the UI message state into the history shape expected by the AI service.
 * Returns an array of role/content objects.
 */
function mapMessagesToConversationHistory(messages) {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

/**
 * Converts an error value into a user-facing message.
 * Returns a short descriptive string.
 */
function getErrorMessage(error) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'Something went wrong while sending the message.';
}

/**
 * Manages the library chat state and AI messaging flow.
 * Returns chat messages, loading and error state, plus send and clear handlers.
 */
export function useLibraryChat(optionalBooks = []) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    if (messages.length === 0 && error !== null) {
      setError(null);
    }
  }, [messages.length, error]);

  /**
   * Sends a user message to the AI and stores the conversation locally.
   * Returns a promise that resolves after the assistant reply has been saved.
   */
  const sendMessage = async (userInput) => {
    const trimmedInput = typeof userInput === 'string' ? userInput.trim() : '';

    if (!trimmedInput) {
      setError('Please enter a message before sending.');
      return;
    }

    const userMessage = createChatMessage('user', trimmedInput);
    const conversationHistory = mapMessagesToConversationHistory(messages);

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const aiResult = await sendMessageToAI(conversationHistory, trimmedInput, optionalBooks);
      const assistantReply = typeof aiResult === 'string' ? aiResult : aiResult?.reply || '';
      const assistantMessage = createChatMessage('assistant', assistantReply);

      setMessages((currentMessages) => [...currentMessages, assistantMessage]);

      if (aiResult && Array.isArray(aiResult.recommendations)) {
        setRecommendations(aiResult.recommendations);
      } else {
        setRecommendations([]);
      }
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Clears the local chat history and any visible error state.
   * Returns nothing and resets the chat to an empty state.
   */
  const clearChat = () => {
    setMessages([]);
    setError(null);
    setIsLoading(false);
    setRecommendations([]);
  };

  return {
    messages,
    isLoading,
    error,
    recommendations,
    sendMessage,
    clearChat,
  };
}