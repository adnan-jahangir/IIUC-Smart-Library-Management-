import React from 'react';
import { MessageSquare, Plus, Trash2, Loader2 } from 'lucide-react';

/**
 * Sidebar that shows the user's past chat sessions.
 * Click to load a session, button to start a new chat.
 */
export default function ChatSidebar({
  sessions,
  activeSessionId,
  isLoading,
  onSelectSession,
  onNewChat,
  onDeleteSession,
}) {
  return (
    <div className="flex flex-col h-full bg-slate-950 text-white">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* Sessions list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 px-4">
            <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-xs text-slate-500">No conversations yet</p>
          </div>
        ) : (
          sessions.map((session) => {
            const isActive = session._id === activeSessionId;
            return (
              <div
                key={session._id}
                className={`group flex items-center gap-2 rounded-xl px-3 py-2.5 cursor-pointer transition-all ${
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <button
                  onClick={() => onSelectSession(session._id)}
                  className="flex-1 text-left min-w-0"
                >
                  <p className="text-sm font-medium truncate">
                    {session.title || 'Untitled'}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {new Date(session.updatedAt || session.createdAt).toLocaleDateString()}
                  </p>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session._id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all"
                  title="Delete chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-white/10">
        <p className="text-[10px] text-slate-600 text-center uppercase tracking-widest">
          IIUC Library AI
        </p>
      </div>
    </div>
  );
}
