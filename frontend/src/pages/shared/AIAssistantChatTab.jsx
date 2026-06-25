import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Maximize2, X, Sparkles, BookOpen, GraduationCap, Route, HelpCircle, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import AlgorithmVisualizer from '../../components/ai/AlgorithmVisualizer';
import ChatSidebar from '../../components/ai/ChatSidebar';
import toast from 'react-hot-toast';
import { 
  sendChatMessage, 
  listChatSessions, 
  getChatSession, 
  deleteChatSession, 
  renameChatSession 
} from '../../services/aiApi';

const QUICK_ACTIONS = [
  { icon: BookOpen, label: 'Recommend Books', prompt: 'Can you recommend some books for my studies?', color: 'emerald' },
  { icon: GraduationCap, label: 'Study Roadmap', prompt: 'Help me create a 10-day study roadmap for my upcoming exam.', color: 'indigo' },
  { icon: Route, label: 'Summarize Text', prompt: 'I need help summarizing a chapter. Here it is:', color: 'amber' },
  { icon: HelpCircle, label: 'Library Policies', prompt: 'What are the library borrowing rules and fine policies?', color: 'rose' },
];

const COLOR_MAP = {
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: 'text-emerald-500' },
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', icon: 'text-indigo-500' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: 'text-amber-500' },
  rose: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', icon: 'text-rose-500' },
};

const DEFAULT_WELCOME_MESSAGE = { 
  role: 'assistant', 
  content: 'Assalamualikum! I am your Library assistant.', 
  isWelcome: true 
};

const AIAssistantChatTab = () => {
  const { user } = useAuthStore();
  
  // Session State
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [isSidebarLoading, setIsSidebarLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Chat State
  const [messages, setMessages] = useState([DEFAULT_WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Modal state for complex algorithms
  const [modalAlgorithm, setModalAlgorithm] = useState(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial Load of Sessions
  useEffect(() => {
    if (user?.token) {
      loadSessions();
    }
  }, [user]);

  const loadSessions = async () => {
    setIsSidebarLoading(true);
    try {
      const data = await listChatSessions(user.token);
      setSessions(data || []);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      toast.error('Failed to load chat history.');
    } finally {
      setIsSidebarLoading(false);
    }
  };

  const handleNewChat = () => {
    setActiveSessionId(null);
    setMessages([DEFAULT_WELCOME_MESSAGE]);
    setInput('');
  };

  const handleSelectSession = async (sessionId) => {
    if (sessionId === activeSessionId) return;
    
    setIsLoading(true);
    try {
      const session = await getChatSession(user.token, sessionId);
      setActiveSessionId(sessionId);
      
      if (session.messages && session.messages.length > 0) {
        setMessages(session.messages);
      } else {
        setMessages([DEFAULT_WELCOME_MESSAGE]);
      }
    } catch (error) {
      console.error('Failed to load session:', error);
      toast.error('Failed to load chat session.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      await deleteChatSession(user.token, sessionId);
      setSessions(prev => prev.filter(s => s._id !== sessionId));
      
      if (activeSessionId === sessionId) {
        handleNewChat();
      }
      toast.success('Chat deleted');
    } catch (error) {
      console.error('Failed to delete session:', error);
      toast.error('Failed to delete session.');
    }
  };

  const handleRenameSession = async (sessionId, newTitle) => {
    try {
      const response = await renameChatSession(user.token, sessionId, newTitle);
      setSessions(prev => prev.map(s => s._id === sessionId ? { ...s, title: response.session.title } : s));
      toast.success('Chat renamed');
    } catch (error) {
      console.error('Failed to rename session:', error);
      toast.error('Failed to rename session.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const data = await sendChatMessage(user.token, userMessage.content, activeSessionId);
      
      // If this was a new session, set the active session ID and refresh the sidebar list
      if (!activeSessionId && data.sessionId) {
        setActiveSessionId(data.sessionId);
        loadSessions(); // Reload sidebar to show the new chat
      }

      const assistantMessage = {
        role: 'assistant',
        content: data.explanation || data.reply || 'No response',
        isAlgorithm: data.isAlgorithm,
        algorithmId: data.algorithmId,
        complexity: data.complexity
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
      const errorMsg = error?.response?.data?.message || 'Sorry, I encountered an error while processing your request.';
      const errSessionId = error?.response?.data?.sessionId;
      
      // If the backend created a session but the AI failed, keep track of the session
      if (!activeSessionId && errSessionId) {
        setActiveSessionId(errSessionId);
        loadSessions(); 
      }

      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
      toast.error('Failed to get response');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (prompt) => {
    setInput(prompt);
  };

  return (
    <div className="flex flex-row h-[600px] bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden relative shadow-sm">
      
      {/* Sidebar */}
      <div className={`transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-[280px] opacity-100' : 'w-0 opacity-0 overflow-hidden'} shrink-0`}>
        <div className="w-[280px] h-full">
          <ChatSidebar
            sessions={sessions}
            activeSessionId={activeSessionId}
            isLoading={isSidebarLoading}
            onSelectSession={handleSelectSession}
            onNewChat={handleNewChat}
            onDeleteSession={handleDeleteSession}
            onRenameSession={handleRenameSession}
          />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 relative">
        {/* Top Header with Sidebar Toggle */}
        <div className="bg-white border-b border-slate-200 p-3 flex items-center shrink-0">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors flex items-center gap-2"
            title={isSidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}
          >
            {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
            {!isSidebarOpen && <span className="text-sm font-medium">History</span>}
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {messages.length === 1 && messages[0].isWelcome && (
            <div className="flex flex-col items-center justify-center pt-8 pb-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg mb-4">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">How can I help you?</h3>
              <p className="text-sm text-slate-500 mt-1">Ask about books, study plans, or library policies</p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                  msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-emerald-500 text-white'
                }`}>
                  {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                <div className="space-y-3 w-full">
                  {msg.isWelcome && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm w-full">
                      <p className="text-sm font-bold text-slate-700 mb-3">Start a specific task:</p>
                      <div className="flex flex-wrap gap-2">
                        {QUICK_ACTIONS.map((action) => {
                          const colors = COLOR_MAP[action.color];
                          const Icon = action.icon;
                          return (
                            <button
                              key={action.label}
                              onClick={() => handleQuickAction(action.prompt)}
                              className={`${colors.bg} ${colors.border} border rounded-xl p-3 flex-1 min-w-[140px] text-left hover:shadow-md transition-all group`}
                            >
                              <Icon className={`w-5 h-5 ${colors.icon} mb-2 group-hover:scale-110 transition-transform`} />
                              <p className={`text-xs font-semibold ${colors.text}`}>{action.label}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  <div className={`p-4 rounded-2xl inline-block ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-sm' 
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'
                  }`}>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                  </div>
                  
                  {/* Algorithm Integration */}
                  {msg.isAlgorithm && msg.algorithmId && (
                    <div className="mt-2">
                      {msg.complexity === 'simple' ? (
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm p-4 mt-2">
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Interactive Visualization</div>
                          <AlgorithmVisualizer defaultAlgorithm={msg.algorithmId} hideControls={false} />
                        </div>
                      ) : (
                        <button 
                          onClick={() => setModalAlgorithm(msg.algorithmId)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-sm font-bold transition-colors border border-indigo-200"
                        >
                          <Maximize2 className="w-4 h-4" /> View Complex Visualization
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[80%]">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 rounded-tl-sm flex items-center gap-2 shadow-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  <span className="text-sm text-slate-500 font-medium">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-4 bg-white border-t border-slate-200 z-10">
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about books, library rules, or to explain algorithms..."
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl pr-14 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-2 bottom-2 w-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Complex Algorithm Modal */}
      {modalAlgorithm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-8">
          <div className="bg-white rounded-3xl w-full max-w-5xl h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in relative">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Algorithm Visualization</h3>
                <p className="text-sm text-slate-500">Interactive detailed view</p>
              </div>
              <button 
                onClick={() => setModalAlgorithm(null)}
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <AlgorithmVisualizer defaultAlgorithm={modalAlgorithm} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistantChatTab;
