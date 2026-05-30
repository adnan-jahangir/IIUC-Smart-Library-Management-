import React, { useEffect, useRef, useState } from 'react';
import { useLibraryChat } from '../hooks/useLibraryChat';
import { MessageSquareText, Sparkles, X } from 'lucide-react';
import { resolveBookCover, getBookCoverFallback } from '../utils/bookCover';

/**
 * Returns a formatted time label for a chat message timestamp.
 * Returns a short local time string.
 */
function formatMessageTime(timestamp) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Returns the alignment class for a chat message bubble.
 * Returns a Tailwind class string.
 */
function getMessageAlignmentClass(role) {
  return role === 'user' ? 'justify-end' : 'justify-start';
}

/**
 * Returns the bubble styling class for a chat message.
 * Returns a Tailwind class string.
 */
function getMessageBubbleClass(role) {
  return role === 'user'
    ? 'bg-slate-900 text-white rounded-br-md'
    : 'bg-slate-100 text-slate-800 rounded-bl-md border border-slate-200';
}

/**
 * Returns the button label for the launcher button.
 * Returns the correct label based on the drawer state.
 */
function getLauncherLabel(isOpen) {
  return isOpen ? 'Close chat' : 'Chat with library AI';
}

/**
 * Renders the floating library chat widget.
 * Returns a React element that opens a drawer-style chat interface.
 */
export default function LibraryChatWidget({ optionalBooks = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const { messages, isLoading, error, recommendations, sendMessage, clearChat } = useLibraryChat(optionalBooks);
  const messagesEndRef = useRef(null);

  /**
   * Scrolls the message list to the latest message.
   * Returns nothing and only updates the scroll position.
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isOpen]);

  /**
   * Toggles the drawer open or closed.
   * Returns nothing and flips the local visibility state.
   */
  const toggleChat = () => {
    setIsOpen((currentValue) => !currentValue);
  };

  /**
   * Updates the input field value as the user types.
   * Returns nothing and stores the latest text.
   */
  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  /**
   * Sends the current input to the chat hook.
   * Returns nothing and clears the input after dispatching the message.
   */
  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmedInput = inputValue.trim();

    if (!trimmedInput) {
      return;
    }

    setInputValue('');
    void sendMessage(trimmedInput);
  };

  /**
   * Clears the conversation through the hook.
   * Returns nothing and resets the drawer content.
   */
  const handleClearChat = () => {
    clearChat();
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      <button
        type="button"
        onClick={toggleChat}
        aria-expanded={isOpen}
        aria-controls="library-chat-drawer"
        className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-slate-950/25 transition-transform hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
      >
        <MessageSquareText className="h-4 w-4 text-emerald-300" />
        {getLauncherLabel(isOpen)}
      </button>

      {isOpen ? (
        <section
          id="library-chat-drawer"
          role="dialog"
          aria-label="Library AI chat assistant"
          className="w-[min(92vw,28rem)] overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/20 backdrop-blur"
        >
          <header className="flex items-start justify-between gap-3 border-b border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 px-5 py-4 text-white">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>

              {recommendations.length > 0 ? (
                <div className="border-t border-slate-200 bg-white px-4 py-4 sm:px-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Suggested books</p>
                      <h3 className="text-sm font-bold text-slate-900">With cover pages</h3>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {recommendations.length} found
                    </span>
                  </div>
                  <div className="grid max-h-72 gap-3 overflow-y-auto pr-1">
                    {recommendations.map((book) => (
                      <div key={book._id || book.id || `${book.title}-${book.author}`} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
                        <div className="h-20 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
                          <img
                            src={resolveBookCover(book)}
                            alt={book.title}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = getBookCoverFallback(book.title || 'Book');
                            }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-slate-900">{book.title}</p>
                          <p className="mt-1 text-xs text-slate-500">{book.author}</p>
                          <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-slate-400">{book.department || book.category || 'Library book'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200">Library assistant</p>
                <h2 className="mt-1 text-lg font-semibold">Chat and ask questions</h2>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClearChat}
              className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/10"
            >
              Clear
            </button>
          </header>

          <div className="flex h-[32rem] flex-col bg-slate-50/80">
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
              {messages.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-4 py-5 text-sm text-slate-500 shadow-sm">
                  Ask for book recommendations, chapter summaries, study roadmaps, or library policy help.
                </div>
              ) : null}

              {messages.map((message) => (
                <div key={message.id} className={`flex ${getMessageAlignmentClass(message.role)}`}>
                  <div className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-relaxed shadow-sm ${getMessageBubbleClass(message.role)}`}>
                    <p>{message.content}</p>
                    <p className="mt-2 text-[11px] uppercase tracking-[0.22em] opacity-60">
                      {message.role} {formatMessageTime(message.timestamp) ? `• ${formatMessageTime(message.timestamp)}` : ''}
                    </p>
                  </div>
                </div>
              ))}

              {isLoading ? (
                <div className="flex justify-start">
                  <div className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                    Thinking...
                  </div>
                </div>
              ) : null}

              <div ref={messagesEndRef} />
            </div>

            {error ? (
              <div className="border-t border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white p-3">
              <label className="sr-only" htmlFor="library-chat-input">
                Type a message
              </label>
              <div className="flex items-end gap-2 rounded-3xl border border-slate-200 bg-slate-50 p-2 shadow-sm">
                <textarea
                  id="library-chat-input"
                  value={inputValue}
                  onChange={handleInputChange}
                  rows={2}
                  placeholder="Ask about books, roadmaps, or library policies..."
                  className="min-h-12 flex-1 resize-none rounded-2xl border-0 bg-transparent px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </section>
      ) : null}
    </div>
  );
}