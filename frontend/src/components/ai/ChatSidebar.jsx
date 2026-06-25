import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Plus, Trash2, Loader2, MoreVertical, Edit2, X, Check } from 'lucide-react';

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
  onRenameSession,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const editInputRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingId]);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpenId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleStartRename = (e, session) => {
    e.stopPropagation();
    setEditingId(session._id);
    setEditTitle(session.title || 'Untitled');
    setMenuOpenId(null);
  };

  const handleSaveRename = async () => {
    if (editingId && editTitle.trim()) {
      await onRenameSession(editingId, editTitle);
    }
    setEditingId(null);
  };

  const handleStartDelete = (e, id) => {
    e.stopPropagation();
    setDeletingId(id);
    setMenuOpenId(null);
  };

  const handleConfirmDelete = async (e, id) => {
    e.stopPropagation();
    await onDeleteSession(id);
    setDeletingId(null);
  };

  const handleCancelDelete = (e) => {
    e.stopPropagation();
    setDeletingId(null);
  };

  return (
    <div className="flex flex-col h-full w-[280px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* Sessions list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {isLoading ? (
          // Skeleton Loaders
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse flex items-center h-10 px-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-10 px-4">
            <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No conversations yet</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Start chatting to see them here.</p>
          </div>
        ) : (
          sessions.map((session) => {
            const isActive = session._id === activeSessionId;
            const isEditing = editingId === session._id;
            const isDeleting = deletingId === session._id;
            const isMenuOpen = menuOpenId === session._id;

            return (
              <div
                key={session._id}
                className={`group relative flex items-center justify-between rounded-xl px-3 py-2 cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-900/30'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'
                }`}
                onClick={() => !isEditing && !isDeleting && onSelectSession(session._id)}
              >
                {/* Title or Input */}
                {isEditing ? (
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={handleSaveRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveRename();
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    className="flex-1 min-w-0 bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-600 rounded px-2 py-1 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div className="flex-1 min-w-0 pr-6">
                    <p className={`text-sm font-medium truncate ${isActive ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>
                      {session.title || 'Untitled'}
                    </p>
                  </div>
                )}

                {/* Inline Delete Confirmation */}
                {isDeleting && (
                  <div className="absolute right-2 flex items-center gap-1 bg-white dark:bg-slate-800 rounded-md shadow-sm border border-slate-200 dark:border-slate-700 p-0.5 z-10" onClick={(e) => e.stopPropagation()}>
                    <button onClick={(e) => handleConfirmDelete(e, session._id)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={handleCancelDelete} className="p-1 text-rose-600 hover:bg-rose-50 rounded">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Kebab Menu Button (Hover) */}
                {!isEditing && !isDeleting && (
                  <div className="absolute right-2 flex items-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId(isMenuOpen ? null : session._id);
                      }}
                      className={`p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:text-slate-300 dark:hover:bg-slate-700 transition-colors ${
                        isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      } ${isMenuOpen ? 'opacity-100 bg-slate-200 dark:bg-slate-700' : ''}`}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* Kebab Menu Dropdown */}
                    {isMenuOpen && (
                      <div ref={menuRef} className="absolute right-0 top-8 w-32 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-20">
                        <button
                          onClick={(e) => handleStartRename(e, session)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Rename
                        </button>
                        <button
                          onClick={(e) => handleStartDelete(e, session._id)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
