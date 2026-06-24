import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  MessageSquareText,
  Sparkles,
  X,
  Send,
  PanelLeftOpen,
  PanelLeftClose,
  Loader2,
  BookOpen,
  GraduationCap,
  Route,
  HelpCircle,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import {
  sendChatMessageStreaming,
  listChatSessions,
  getChatSession,
  deleteChatSession,
} from '../../services/aiApi';
import ChatMessage from './ChatMessage';
import ChatSidebar from './ChatSidebar';

// Quick-action suggestion cards
const QUICK_ACTIONS = [
  {
    icon: BookOpen,
    label: 'Recommend Books',
    prompt: 'Can you recommend some books for my studies?',
    color: 'emerald',
  },
  {
    icon: GraduationCap,
    label: 'Study Roadmap',
    prompt: 'Help me create a 10-day study roadmap for my upcoming exam.',
    color: 'indigo',
  },
  {
    icon: Route,
    label: 'Summarize Text',
    prompt: 'I need help summarizing a chapter. Here it is:',
    color: 'amber',
  },
  {
    icon: HelpCircle,
    label: 'Library Policies',
    prompt: 'What are the library borrowing rules and fine policies?',
    color: 'rose',
  },
];

const COLOR_MAP = {
  emerald: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    icon: 'text-emerald-500',
  },
  indigo: {
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    text: 'text-indigo-700',
    icon: 'text-indigo-500',
  },
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    icon: 'text-amber-500',
  },
  rose: {
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-700',
    icon: 'text-rose-500',
  },
};

export default function AiChatWidget() {
  const { user } = useAuthStore();
  const token = user?.token;

  // UI state
  const [isOpen, setIsOpen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  // Chat state
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);

  // Session state
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Refs
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const abortRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Load sessions when widget opens
  useEffect(() => {
    if (isOpen && token) {
      loadSessions();
    }
  }, [isOpen, token]);

  // ─── Session management ────────────────────────────────────────────

  const loadSessions = useCallback(async () => {
    if (!token) return;
    setSessionsLoading(true);
    try {
      const list = await listChatSessions(token);
      setSessions(list || []);
    } catch {
      // silently fail
    } finally {
      setSessionsLoading(false);
    }
  }, [token]);

  const handleSelectSession = useCallback(
    async (sessionId) => {
      if (!token) return;
      try {
        const session = await getChatSession(token, sessionId);
        setActiveSessionId(session._id);
        setMessages(
          (session.messages || [])
            .filter((m) => m.role !== 'system')
            .map((m, i) => ({
              id: `${session._id}-${i}`,
              role: m.role,
              content: m.content,
              timestamp: m.timestamp,
            }))
        );
        setShowSidebar(false);
        setError(null);
      } catch {
        setError('Failed to load chat session.');
      }
    },
    [token]
  );

  const handleDeleteSession = useCallback(
    async (sessionId) => {
      if (!token) return;
      try {
        await deleteChatSession(token, sessionId);
        setSessions((prev) => prev.filter((s) => s._id !== sessionId));
        if (activeSessionId === sessionId) {
          setActiveSessionId(null);
          setMessages([]);
        }
      } catch {
        setError('Failed to delete session.');
      }
    },
    [token, activeSessionId]
  );

  const handleNewChat = useCallback(() => {
    setActiveSessionId(null);
    setMessages([]);
    setError(null);
    setShowSidebar(false);
  }, []);

  // ─── Sending messages ──────────────────────────────────────────────

  const handleSend = useCallback(
    async (overrideMessage) => {
      const text = (overrideMessage || inputValue).trim();
      if (!text || isStreaming || !token) return;

      setInputValue('');
      setError(null);

      // Add user message to UI immediately
      const userMsg = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);

      // Add placeholder for assistant
      const assistantId = `assistant-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: 'assistant', content: '', timestamp: null },
      ]);

      setIsStreaming(true);

      try {
        const { reader, abort } = sendChatMessageStreaming(
          token,
          text,
          activeSessionId
        );
        abortRef.current = abort;

        let fullContent = '';
        let newSessionId = activeSessionId;

        for await (const chunk of reader) {
          if (chunk.error) {
            setError(chunk.error);
            break;
          }

          if (chunk.token) {
            fullContent += chunk.token;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: fullContent } : m
              )
            );
          }

          if (chunk.done) {
            // Update the sessionId if this was a new chat
            if (chunk.fullReply) {
              fullContent = chunk.fullReply;
            }
            break;
          }
        }

        // Finalise assistant message
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: fullContent || 'No response received.',
                  timestamp: new Date().toISOString(),
                }
              : m
          )
        );

        // Refresh sessions list to pick up new/updated session
        await loadSessions();

        // If we don't have a session ID yet, try to find it from the sessions list
        if (!activeSessionId) {
          const updated = await listChatSessions(token);
          if (updated && updated.length > 0) {
            setActiveSessionId(updated[0]._id);
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(
            'Failed to get a response. Please check your connection and try again.'
          );
        }
        // Remove empty assistant placeholder on error
        setMessages((prev) =>
          prev.filter(
            (m) => !(m.id === assistantId && !m.content)
          )
        );
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [inputValue, isStreaming, token, activeSessionId, loadSessions]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSend();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ─── Render ────────────────────────────────────────────────────────

  if (!token) return null; // Don't show for unauthenticated users

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {/* ── Chat Window ── */}
      {isOpen && (
        <div className="w-[min(95vw,28rem)] h-[min(85vh,44rem)] flex rounded-[1.75rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/20 overflow-hidden">
          {/* Sidebar */}
          {showSidebar && (
            <div className="w-56 flex-shrink-0 border-r border-slate-200">
              <ChatSidebar
                sessions={sessions}
                activeSessionId={activeSessionId}
                isLoading={sessionsLoading}
                onSelectSession={handleSelectSession}
                onNewChat={handleNewChat}
                onDeleteSession={handleDeleteSession}
              />
            </div>
          )}

          {/* Main chat area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <header className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white">
              <button
                onClick={() => setShowSidebar((v) => !v)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                title={showSidebar ? 'Hide sessions' : 'Show sessions'}
              >
                {showSidebar ? (
                  <PanelLeftClose className="w-4 h-4" />
                ) : (
                  <PanelLeftOpen className="w-4 h-4" />
                )}
              </button>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-widest text-emerald-200">
                    Library AI
                  </p>
                  <p className="text-sm font-semibold truncate">
                    Chat Assistant
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-slate-50/80">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-5 py-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                    <Sparkles className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-base font-bold text-slate-800">
                      How can I help you?
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Ask about books, study plans, or library policies
                    </p>
                  </div>

                  {/* Quick action cards */}
                  <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
                    {QUICK_ACTIONS.map((action) => {
                      const colors = COLOR_MAP[action.color];
                      const Icon = action.icon;
                      return (
                        <button
                          key={action.label}
                          onClick={() => handleSend(action.prompt)}
                          className={`${colors.bg} ${colors.border} border rounded-2xl p-3 text-left hover:shadow-md transition-all group`}
                        >
                          <Icon
                            className={`w-5 h-5 ${colors.icon} mb-2 group-hover:scale-110 transition-transform`}
                          />
                          <p className={`text-xs font-semibold ${colors.text}`}>
                            {action.label}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    role={msg.role}
                    content={msg.content}
                    timestamp={msg.timestamp}
                    isStreaming={
                      isStreaming &&
                      msg.role === 'assistant' &&
                      msg === messages[messages.length - 1]
                    }
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Error banner */}
            {error && (
              <div className="border-t border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-700 font-medium">
                {error}
              </div>
            )}

            {/* Typing indicator */}
            {isStreaming && messages[messages.length - 1]?.content === '' && (
              <div className="px-4 py-2 border-t border-slate-200 bg-white">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                  AI is thinking...
                </div>
              </div>
            )}

            {/* Input form */}
            <form
              onSubmit={handleSubmit}
              className="border-t border-slate-200 bg-white p-3"
            >
              <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 shadow-sm focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-300 transition-all">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder="Ask anything..."
                  disabled={isStreaming}
                  className="flex-1 min-h-[2.5rem] max-h-24 resize-none rounded-xl border-0 bg-transparent px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isStreaming || !inputValue.trim()}
                  className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  {isStreaming ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Launcher Button ── */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={`inline-flex items-center gap-2 rounded-full px-5 py-3.5 text-sm font-semibold text-white shadow-xl transition-all hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
          isOpen
            ? 'bg-slate-700 hover:bg-slate-600 shadow-slate-700/25'
            : 'bg-slate-950 hover:bg-slate-800 shadow-slate-950/25'
        }`}
      >
        {isOpen ? (
          <>
            <X className="h-4 w-4" />
            Close
          </>
        ) : (
          <>
            <MessageSquareText className="h-4 w-4 text-emerald-300" />
            AI Assistant
          </>
        )}
      </button>
    </div>
  );
}
