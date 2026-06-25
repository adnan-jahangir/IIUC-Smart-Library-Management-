import React, { useState, useEffect, useRef } from 'react';
import { FileText, Sparkles, HelpCircle, MessageSquare, BookOpen, RefreshCw, Eye, EyeOff, Printer, Send, AlertCircle, Loader2, Download, Library, FileSearch } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { summarizeDocument, generateDocumentQuestions, askDocumentQuestion, askAllDocuments } from '../../services/aiApi';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const DocumentWorkspace = ({ documentId, filename, initialSummary, isScannedText, rawText, documents = [], onSelectDocument }) => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('summary');
  
  // Summary Tab State
  const [summary, setSummary] = useState(initialSummary || '');
  const [summarizing, setSummarizing] = useState(false);

  // Questions Tab State
  const [questionType, setQuestionType] = useState('mcq');
  const [questionCount, setQuestionCount] = useState(5);
  const [questions, setQuestions] = useState([]);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [revealedAnswers, setRevealedAnswers] = useState({}); // { [idx]: boolean }

  // Q&A Tab State
  const [qaMode, setQaMode] = useState('single'); // 'single' | 'all'
  const [qaInput, setQaInput] = useState('');
  const [qaMessages, setQaMessages] = useState([
    { role: 'assistant', content: "Hello! Ask me any question, and I'll find the answer grounded strictly in the content of your uploaded document." }
  ]);
  const [asking, setAsking] = useState(false);
  const messagesEndRef = useRef(null);

  const handleSummarize = async () => {
    if (!user?.token) return;
    setSummarizing(true);
    try {
      const data = await summarizeDocument(user.token, documentId);
      setSummary(data.summary);
      toast.success("Summary generated successfully!");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to generate summary.");
    } finally {
      setSummarizing(false);
    }
  };

  const handleGenerateQuestions = async (e) => {
    if (e) e.preventDefault();
    if (!user?.token) return;
    setGeneratingQuestions(true);
    setRevealedAnswers({});
    try {
      const data = await generateDocumentQuestions(user.token, documentId, {
        questionType,
        count: questionCount
      });
      setQuestions(data.questions || []);
      toast.success("Study questions generated!");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to generate questions.");
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const handleAskQuestion = async (e) => {
    if (e) e.preventDefault();
    const query = qaInput.trim();
    if (!query || !user?.token) return;

    // In 'all' mode, check if the user has any documents
    if (qaMode === 'all' && (!documents || documents.length === 0)) {
      toast.error('Upload a document first to use cross-document search.');
      return;
    }

    setQaInput('');
    setQaMessages(prev => [...prev, { role: 'user', content: query }]);
    setAsking(true);

    try {
      if (qaMode === 'all') {
        // Multi-document RAG
        const data = await askAllDocuments(user.token, query);
        const sourcesInfo = data.sourcesUsed && data.sourcesUsed.length > 0
          ? data.sourcesUsed
          : [];
        setQaMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.answer,
          sources: sourcesInfo
        }]);
      } else {
        // Single-document Q&A
        const data = await askDocumentQuestion(user.token, documentId, query);
        setQaMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      }
    } catch (err) {
      console.error(err);
      setQaMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error while searching the document contents. Please try again." }]);
    } finally {
      setAsking(false);
    }
  };

  const toggleRevealAnswer = (idx) => {
    setRevealedAnswers(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const handlePrint = () => {
    if (questions.length === 0) return;
    const printWindow = window.open('', '_blank');
    const styles = `
      body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
      h1 { font-size: 22px; font-weight: bold; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 24px; color: #0f172a; }
      .meta { font-size: 12px; color: #64748b; margin-top: -16px; margin-bottom: 24px; }
      .question-card { margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #f1f5f9; page-break-inside: avoid; }
      .question-num { font-weight: bold; font-size: 15px; margin-bottom: 8px; color: #1e293b; }
      .options { margin-left: 24px; margin-bottom: 12px; list-style-type: upper-alpha; font-size: 14px; }
      .option { margin-bottom: 4px; color: #334155; }
      .answer { margin-top: 8px; font-weight: bold; color: #059669; font-size: 13px; }
      .explanation { font-size: 12px; color: #64748b; font-style: italic; margin-top: 4px; }
    `;
    printWindow.document.write('<html><head><title>Quiz: ' + filename + '</title><style>' + styles + '</style></head><body>');
    printWindow.document.write('<h1>Generated Quiz: ' + filename + '</h1>');
    printWindow.document.write('<div class="meta">Created on IIUC Smart Library AI Document Workspace | Date: ' + new Date().toLocaleDateString() + '</div>');
    
    questions.forEach((q, idx) => {
      printWindow.document.write('<div class="question-card">');
      printWindow.document.write('<div class="question-num">Question ' + (idx + 1) + '. ' + q.question + '</div>');
      if (q.options && q.options.length > 0) {
        printWindow.document.write('<ol class="options">');
        q.options.forEach(opt => {
          printWindow.document.write('<li class="option">' + opt + '</li>');
        });
        printWindow.document.write('</ol>');
      }
      printWindow.document.write('<div class="answer">Correct Answer: ' + q.correctAnswer + '</div>');
      if (q.explanation) {
        printWindow.document.write('<div class="explanation">Explanation: ' + q.explanation + '</div>');
      }
      printWindow.document.write('</div>');
    });
    
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  // Scroll to bottom of Q&A chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [qaMessages]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[550px]">
      
      {/* File Info Header */}
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl flex-shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-slate-800 text-sm sm:text-base truncate" title={filename}>{filename}</h4>
            <p className="text-[11px] sm:text-xs text-slate-400 font-semibold">WORKSPACE CONSOLE</p>
          </div>
        </div>

        {isScannedText && (
          <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold flex items-center gap-1.5 self-start sm:self-center border border-amber-200 animate-pulse">
            <AlertCircle className="w-3.5 h-3.5" /> Scanned Document (No text extracted)
          </span>
        )}
      </div>

      {/* Workspace Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto bg-slate-50/50">
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex items-center gap-2 px-5 py-3.5 font-bold text-xs sm:text-sm border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'summary' 
              ? 'border-indigo-600 text-indigo-600 bg-white' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" /> AI Summary
        </button>
        <button
          onClick={() => setActiveTab('questions')}
          className={`flex items-center gap-2 px-5 py-3.5 font-bold text-xs sm:text-sm border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'questions' 
              ? 'border-indigo-600 text-indigo-600 bg-white' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HelpCircle className="w-4 h-4" /> Generate Quiz
        </button>
        <button
          onClick={() => setActiveTab('qa')}
          className={`flex items-center gap-2 px-5 py-3.5 font-bold text-xs sm:text-sm border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'qa' 
              ? 'border-indigo-600 text-indigo-600 bg-white' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" /> Document Q&A
        </button>
        <button
          onClick={() => setActiveTab('text')}
          className={`flex items-center gap-2 px-5 py-3.5 font-bold text-xs sm:text-sm border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'text' 
              ? 'border-indigo-600 text-indigo-600 bg-white' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Extracted Text
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 p-6">
        
        {/* SUMMARY TAB */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            {summarizing ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                <p className="text-sm font-semibold text-slate-600">Generating summary using AI...</p>
              </div>
            ) : summary ? (
              <div className="space-y-6 max-w-4xl">
                <div className="prose prose-slate prose-sm sm:prose-base max-w-none bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
                </div>
                <button
                  onClick={handleSummarize}
                  className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:border-indigo-300 rounded-xl text-sm font-bold text-slate-600 hover:text-indigo-700 hover:bg-indigo-50/50 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 text-slate-500" /> Regenerate Summary
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-16 space-y-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50/30">
                <Sparkles className="w-12 h-12 text-slate-300 mb-2" />
                <h4 className="font-bold text-slate-700 text-sm">No Summary Available</h4>
                <p className="text-slate-500 text-xs max-w-xs leading-relaxed">
                  Click the button below to analyze your document and generate a structured summary.
                </p>
                <button
                  onClick={handleSummarize}
                  disabled={isScannedText}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-4 h-4" /> Summarize Document
                </button>
              </div>
            )}
          </div>
        )}

        {/* QUESTIONS TAB */}
        {activeTab === 'questions' && (
          <div className="space-y-6">
            {/* Parameters Bar */}
            <form onSubmit={handleGenerateQuestions} className="flex flex-wrap items-end gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Question Format</label>
                <select
                  value={questionType}
                  onChange={(e) => setQuestionType(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-700 min-w-[130px]"
                >
                  <option value="mcq">Multiple Choice</option>
                  <option value="short">Short Answer</option>
                  <option value="long">Long Essay</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Total Count</label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-700 min-w-[90px]"
                >
                  <option value="3">3</option>
                  <option value="5">5</option>
                  <option value="10">10</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={generatingQuestions || isScannedText}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow transition-all text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingQuestions ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Generate Questions
                  </>
                )}
              </button>

              {questions.length > 0 && (
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl shadow-sm transition-all text-sm flex items-center gap-2 ml-auto"
                >
                  <Printer className="w-4 h-4 text-slate-500" /> Export / Save PDF
                </button>
              )}
            </form>

            {/* Questions list */}
            {generatingQuestions ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                <p className="text-sm font-semibold text-slate-600">AI is composing educational questions from the content...</p>
              </div>
            ) : questions.length > 0 ? (
              <div className="space-y-6 max-w-4xl">
                {questions.map((q, idx) => (
                  <div key={idx} className="p-5 bg-slate-50/50 border border-slate-150 rounded-2xl space-y-4 shadow-sm">
                    <h5 className="font-bold text-slate-800 text-base flex items-start gap-2">
                      <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded mt-0.5">Q{idx + 1}</span>
                      {q.question}
                    </h5>

                    {/* MCQ Options list */}
                    {q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-7">
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-700 text-sm font-medium">
                            <span className="font-bold text-indigo-600 mr-1.5">{String.fromCharCode(65 + oIdx)}.</span> {opt}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Answer Reveal Panel */}
                    <div className="pl-7 pt-2 space-y-3">
                      <button
                        onClick={() => toggleRevealAnswer(idx)}
                        className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-500 hover:underline"
                      >
                        {revealedAnswers[idx] ? (
                          <>
                            <EyeOff className="w-4 h-4" /> Hide Solution
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4" /> Reveal Solution
                          </>
                        )}
                      </button>

                      {revealedAnswers[idx] && (
                        <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-xl space-y-2 text-slate-800 text-sm animate-fade-in">
                          <p className="font-bold text-emerald-900">Correct Answer:</p>
                          <p className="font-medium bg-white px-3 py-1.5 rounded-lg border border-emerald-100/50 w-fit">{q.correctAnswer}</p>
                          {q.explanation && (
                            <div className="pt-2 border-t border-emerald-100/50 text-xs text-slate-650 italic leading-relaxed">
                              <strong>Explanation:</strong> {q.explanation}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-16 space-y-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50/30">
                <HelpCircle className="w-12 h-12 text-slate-300 mb-2" />
                <h4 className="font-bold text-slate-700 text-sm">No Questions Loaded</h4>
                <p className="text-slate-500 text-xs max-w-xs leading-relaxed">
                  Click the button above to generate a custom syllabus quiz based on this chapter/document.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Q&A TAB */}
        {activeTab === 'qa' && (
          <div className="space-y-4">
            {/* Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
              <button
                onClick={() => {
                  setQaMode('single');
                  setQaMessages([{ role: 'assistant', content: "Hello! Ask me any question, and I'll find the answer grounded strictly in the content of this document." }]);
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  qaMode === 'single'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <FileSearch className="w-3.5 h-3.5" /> This Document
              </button>
              <button
                onClick={() => {
                  setQaMode('all');
                  setQaMessages([{ role: 'assistant', content: "Hello! I'll search across **all your uploaded documents** to answer your question. Ask me anything!" }]);
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  qaMode === 'all'
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Library className="w-3.5 h-3.5" /> All My Documents
              </button>
            </div>

            {/* No documents warning for multi-doc mode */}
            {qaMode === 'all' && (!documents || documents.length === 0) && (
              <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-semibold text-amber-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                Upload at least one document first to use cross-document search.
              </div>
            )}

            {/* Chat Window */}
            <div className={`flex flex-col h-[380px] border rounded-2xl overflow-hidden shadow-inner ${qaMode === 'all' ? 'border-purple-200 bg-purple-50/10' : 'border-slate-150 bg-slate-50/20'}`}>
              {/* Chat Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {qaMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="max-w-xl space-y-2">
                      <div
                        className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? `${qaMode === 'all' ? 'bg-purple-600' : 'bg-indigo-600'} text-white rounded-br-none shadow-sm`
                            : 'bg-white border border-slate-150 text-slate-700 rounded-bl-none shadow-sm font-medium'
                        }`}
                      >
                        {msg.role === 'assistant' ? (
                          <div className="prose prose-sm prose-slate max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          msg.content
                        )}
                      </div>

                      {/* Sources Used (multi-doc mode only) */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 space-y-1.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-purple-500">Sources Used</p>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.sources.map((src, sIdx) => (
                              <button
                                key={sIdx}
                                onClick={() => onSelectDocument && onSelectDocument(src.documentId)}
                                className="flex items-center gap-1 px-2.5 py-1 bg-white border border-purple-200 rounded-lg text-xs font-semibold text-purple-700 hover:bg-purple-50 hover:border-purple-300 transition-all cursor-pointer"
                                title={`Open ${src.filename}`}
                              >
                                <FileText className="w-3 h-3" />
                                {src.filename}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {asking && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-150 p-3.5 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-1">
                      <div className={`w-2 h-2 ${qaMode === 'all' ? 'bg-purple-600' : 'bg-indigo-600'} rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
                      <div className={`w-2 h-2 ${qaMode === 'all' ? 'bg-purple-600' : 'bg-indigo-600'} rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
                      <div className={`w-2 h-2 ${qaMode === 'all' ? 'bg-purple-600' : 'bg-indigo-600'} rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleAskQuestion} className="bg-white border-t border-slate-150 p-3 flex gap-2">
                <input
                  type="text"
                  value={qaInput}
                  onChange={(e) => setQaInput(e.target.value)}
                  placeholder={
                    isScannedText && qaMode === 'single'
                      ? "Q&A is disabled for scanned documents" 
                      : qaMode === 'all' 
                        ? "Ask across all your uploaded documents..." 
                        : "Ask something about this document..."
                  }
                  disabled={asking || (isScannedText && qaMode === 'single')}
                  className={`flex-1 px-4 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:outline-none text-sm text-slate-800 placeholder:text-slate-400 font-medium ${qaMode === 'all' ? 'focus:border-purple-500' : 'focus:border-indigo-500'}`}
                />
                <button
                  type="submit"
                  disabled={asking || !qaInput.trim() || (isScannedText && qaMode === 'single')}
                  className={`p-2.5 ${qaMode === 'all' ? 'bg-purple-600 hover:bg-purple-500' : 'bg-indigo-600 hover:bg-indigo-500'} text-white rounded-xl shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TEXT PREVIEW TAB */}
        {activeTab === 'text' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-450 font-bold uppercase tracking-wider">Raw Extracted Document Context</span>
              {rawText && (
                <span className="text-xs text-slate-500 font-semibold">{Math.ceil(rawText.length / 4)} tokens extracted</span>
              )}
            </div>
            {rawText ? (
              <div className="bg-slate-900 text-slate-300 p-5 rounded-2xl border border-slate-800 h-[380px] overflow-y-auto font-mono text-xs leading-relaxed whitespace-pre-wrap selection:bg-indigo-600 selection:text-white">
                {rawText}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-16 space-y-3 border border-dashed border-slate-200 rounded-2xl bg-slate-50/30">
                <FileText className="w-12 h-12 text-slate-350" />
                <h4 className="font-bold text-slate-700 text-sm">No Extracted Text</h4>
                <p className="text-slate-550 text-xs max-w-xs leading-relaxed">
                  This document contains no parsed text. This usually happens with scanned PDFs or images.
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default DocumentWorkspace;
