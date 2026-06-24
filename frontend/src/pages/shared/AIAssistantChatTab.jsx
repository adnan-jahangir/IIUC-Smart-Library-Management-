import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Bot, User, Loader2, Maximize2, X } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import AlgorithmVisualizer from '../../components/ai/AlgorithmVisualizer';
import toast from 'react-hot-toast';

const AIAssistantChatTab = () => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Assalamualaikum! I am your Library assistant.' }
  ]);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/ai/chat', {
        message: userMessage.content
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      const data = response.data;
      
      const assistantMessage = {
        role: 'assistant',
        content: data.explanation || data.message || 'No response',
        isAlgorithm: data.isAlgorithm,
        algorithmId: data.algorithmId,
        complexity: data.complexity
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
      toast.error('Failed to get response');
      const errorMsg = error?.response?.data?.message || 'Sorry, I encountered an error while processing your request.';
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden relative">
      
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-emerald-500 text-white'
              }`}>
                {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              <div className="space-y-3">
                <div className={`p-4 rounded-2xl ${
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
              <div className="p-4 rounded-2xl bg-white border border-slate-200 rounded-tl-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                <span className="text-sm text-slate-500 font-medium">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="p-4 bg-white border-t border-slate-200">
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
