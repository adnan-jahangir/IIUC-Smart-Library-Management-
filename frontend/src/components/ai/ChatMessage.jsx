import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User } from 'lucide-react';

/**
 * Renders a single chat message bubble with markdown support.
 * User messages appear on the right, assistant messages on the left.
 */
export default function ChatMessage({ role, content, timestamp, isStreaming }) {
  const isUser = role === 'user';

  const timeLabel = timestamp
    ? new Date(timestamp).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      })
    : '';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white shadow-md ${
          isUser
            ? 'bg-gradient-to-br from-slate-700 to-slate-900'
            : 'bg-gradient-to-br from-emerald-500 to-teal-600'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Bubble */}
      <div
        className={`relative max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
          isUser
            ? 'bg-slate-900 text-white rounded-tr-md'
            : 'bg-white text-slate-800 border border-slate-200 rounded-tl-md'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          <div className="chat-markdown prose prose-sm prose-slate max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Style code blocks
                code({ inline, className, children, ...props }) {
                  if (inline) {
                    return (
                      <code
                        className="bg-slate-100 text-emerald-700 px-1.5 py-0.5 rounded text-xs font-mono"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  }
                  return (
                    <pre className="bg-slate-900 text-slate-100 rounded-xl p-4 overflow-x-auto my-3">
                      <code className="text-xs font-mono" {...props}>
                        {children}
                      </code>
                    </pre>
                  );
                },
                // Style links
                a({ children, ...props }) {
                  return (
                    <a
                      className="text-emerald-600 underline hover:text-emerald-700"
                      target="_blank"
                      rel="noopener noreferrer"
                      {...props}
                    >
                      {children}
                    </a>
                  );
                },
                // Style lists
                ul({ children, ...props }) {
                  return (
                    <ul className="list-disc pl-5 space-y-1 my-2" {...props}>
                      {children}
                    </ul>
                  );
                },
                ol({ children, ...props }) {
                  return (
                    <ol className="list-decimal pl-5 space-y-1 my-2" {...props}>
                      {children}
                    </ol>
                  );
                },
                // Style paragraphs
                p({ children, ...props }) {
                  return (
                    <p className="my-1.5" {...props}>
                      {children}
                    </p>
                  );
                },
                // Style headings
                h1({ children, ...props }) {
                  return <h3 className="text-base font-bold mt-3 mb-1" {...props}>{children}</h3>;
                },
                h2({ children, ...props }) {
                  return <h4 className="text-sm font-bold mt-2 mb-1" {...props}>{children}</h4>;
                },
                h3({ children, ...props }) {
                  return <h5 className="text-sm font-semibold mt-2 mb-1" {...props}>{children}</h5>;
                },
              }}
            >
              {content || ''}
            </ReactMarkdown>
          </div>
        )}

        {/* Streaming cursor */}
        {isStreaming && (
          <span className="inline-block w-2 h-4 bg-emerald-500 rounded-sm animate-pulse ml-0.5 align-middle" />
        )}

        {/* Timestamp */}
        {timeLabel && (
          <p
            className={`mt-2 text-[10px] uppercase tracking-widest ${
              isUser ? 'text-slate-400' : 'text-slate-400'
            }`}
          >
            {timeLabel}
          </p>
        )}
      </div>
    </div>
  );
}
