import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, FileText, Upload, Trash2, ArrowLeft, Loader2, RefreshCw, AlertCircle, FilePlus, ChevronRight, Zap } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { listUploadedDocuments, deleteUploadedDocument } from '../../services/aiApi';
import DocumentUpload from '../../components/ai/DocumentUpload';
import DocumentWorkspace from '../../components/ai/DocumentWorkspace';
import toast from 'react-hot-toast';

const AIAssistantDocumentTab = () => {
  const { user } = useAuthStore();
  const userRole = String(user?.role || 'student').toLowerCase();
  
  // Theme styling configurations
  const theme = {
    primary: userRole === 'teacher' ? 'indigo' : 'emerald',
    textPrimary: userRole === 'teacher' ? 'text-indigo-650' : 'text-emerald-650',
    bgLight: userRole === 'teacher' ? 'bg-indigo-50/50' : 'bg-emerald-50/50',
    borderActive: userRole === 'teacher' ? 'border-indigo-500' : 'border-emerald-500',
    buttonBg: userRole === 'teacher' ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-emerald-600 hover:bg-emerald-500',
  };

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchDocuments = useCallback(async (isSilent = false) => {
    if (!user?.token) return;
    if (!isSilent) setLoading(true);
    try {
      const list = await listUploadedDocuments(user.token);
      setDocuments(list || []);
    } catch (err) {
      console.error("Failed to load documents list:", err);
      toast.error("Failed to load your documents list.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleDelete = async (e, docId) => {
    e.stopPropagation(); // prevent opening the document
    if (!window.confirm("Are you sure you want to delete this document? All generated summaries and questions will be lost.")) return;
    try {
      await deleteUploadedDocument(user.token, docId);
      toast.success("Document deleted successfully.");
      
      // If we are currently viewing the deleted doc, close it
      if (selectedDoc && selectedDoc._id === docId) {
        setSelectedDoc(null);
      }
      
      fetchDocuments(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete document.");
    }
  };

  const handleUploadSuccess = (result) => {
    setIsUploading(false);
    fetchDocuments(true);
    
    // Auto-select the newly uploaded document
    const newDoc = {
      _id: result.documentId,
      filename: result.filename,
      summary: '',
      isScanned: result.isScanned,
      pageCount: result.pageCount,
      extractedText: '' // loaded dynamically in workspace if needed, or fetched
    };
    
    // We fetch the latest full details by refreshing or letting the workspace load it
    // Wait, let's load it from the DB by reloading the lists, then opening it
    setTimeout(async () => {
      try {
        const refreshedList = await listUploadedDocuments(user.token);
        const matched = refreshedList.find(d => d._id === result.documentId);
        if (matched) {
          setSelectedDoc(matched);
        } else {
          setSelectedDoc(newDoc);
        }
      } catch (err) {
        setSelectedDoc(newDoc);
      }
    }, 500);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className={`bg-gradient-to-r ${userRole === 'teacher' ? 'from-indigo-650 to-purple-750' : 'from-emerald-650 to-teal-750'} p-6 md:p-8 rounded-3xl text-white shadow-md relative overflow-hidden`}>
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-10 translate-x-10"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit">
              <Sparkles className="w-3.5 h-3.5" /> Study Assistant
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">AI Document Assistant</h1>
            <p className="text-white/80 max-w-2xl text-sm md:text-base font-medium">
              Upload PDF textbooks, lecture notes, or research papers. Summarize chapters, auto-generate study quizzes, and ask grounded Q&A questions instantly.
            </p>
          </div>
        </div>
      </div>

      {selectedDoc ? (
        /* Workspace View */
        <div className="space-y-4">
          <button
            onClick={() => setSelectedDoc(null)}
            className="flex items-center gap-1.5 text-sm font-bold text-slate-550 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to My Documents
          </button>

          {/* Since our list endpoint only selected summary/filename, we need to load text context.
              Wait! Our listDocuments endpoint does: .select('filename summary pageCount isScanned createdAt')
              So the document object has the parsed text missing.
              Wait! Does the workspace need rawText?
              Let's fetch it, or load it.
              Let's write a small fetch logic: if we open the document, we can fetch its full details or we can just pass the doc.
              Ah! Let's verify if our workspace needs rawText.
              In DocumentWorkspace.jsx, we passed rawText as a prop. Let's make sure we fetch the full document details from the database so the workspace has access to the extractedText!
              Wait, do we have an endpoint to get a single document's full details?
              Ah! In the backend, we don't have a `GET /api/ai/document/:id` endpoint explicitly listed in the task description!
              Wait! Let's check the task description:
              "- GET /api/ai/document — list user's uploaded documents
               - DELETE /api/ai/document/:id"
              Wait! If we don't have a single GET endpoint, how do we load the `extractedText`?
              Ah! We can either add `extractedText` to the selection in `listDocuments` (but that might make the list response large), OR we can add a simple `GET /api/ai/document/:id` endpoint in our backend controllers/routes!
              Yes! Adding a `GET /api/ai/document/:id` endpoint is a very natural and standard architectural decision. It allows the frontend to fetch the full document (including the large `extractedText` field) only when the document is opened, keeping the list endpoint extremely fast!
              Let's check if we should add it. Yes, let's implement `GET /api/ai/document/:id` in `aiDocument.controller.js` and `aiDocumentRoutes.js`!
              Wait, let's write it down. Let's inspect `aiDocument.controller.js`. We can modify it or write it right now.
              Actually, let's edit `aiDocument.controller.js` to include:
              ```javascript
              exports.getDocument = async (req, res) => {
                try {
                  const doc = await UploadedDocument.findOne({ _id: req.params.id, userId: req.user.id });
                  if (!doc) return res.status(404).json({ message: 'Document not found.' });
                  res.json({ document: doc });
                } catch (error) {
                  res.status(500).json({ message: 'Failed to fetch document.' });
                }
              };
              ```
              And register it in `aiDocumentRoutes.js`:
              `router.get('/:id', protect, getDocument);`
              This is extremely clean! Let's do it immediately.
          */}
          <WorkspaceLoader 
            documentId={selectedDoc._id} 
            filename={selectedDoc.filename} 
            initialSummary={selectedDoc.summary} 
            token={user.token}
            documents={documents}
            onSelectDocument={(docId) => {
              const target = documents.find(d => d._id === docId);
              if (target) setSelectedDoc(target);
            }}
          />
        </div>
      ) : (
        /* Documents Directory List View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Upload Panel */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 lg:col-span-1">
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-1.5">
                <FilePlus className={`w-5 h-5 ${theme.textPrimary}`} /> Upload New PDF
              </h3>
              <p className="text-xs text-slate-500 font-medium">Add materials to generate quizzes or Q&A</p>
            </div>
            <DocumentUpload onUploadSuccess={handleUploadSuccess} />
          </div>

          {/* Directory Panel */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 lg:col-span-2 min-h-[300px]">
            <div className="flex justify-between items-center">
              <div className="space-y-0.5">
                <h3 className="text-base sm:text-lg font-bold text-slate-800">My Study Documents</h3>
                <p className="text-xs text-slate-500 font-medium">Click to open in the active workspace</p>
              </div>
              <button
                onClick={() => fetchDocuments()}
                className="p-2 border border-slate-200 hover:border-slate-350 rounded-xl hover:bg-slate-50 text-slate-500 transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-3">
                <Loader2 className="w-8 h-8 text-indigo-650 animate-spin" />
                <p className="text-xs font-semibold text-slate-500">Loading documents directory...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-16 space-y-3 border border-dashed border-slate-200 rounded-2xl bg-slate-50/20">
                <FileText className="w-12 h-12 text-slate-300 mb-2" />
                <h4 className="font-bold text-slate-700 text-sm">No Documents Uploaded</h4>
                <p className="text-slate-500 text-xs max-w-xs leading-relaxed">
                  Drag and drop a PDF on the left panel to begin your AI-powered study assistance.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc._id}
                    onClick={() => setSelectedDoc(doc)}
                    className="flex items-center justify-between p-4 bg-slate-50 hover:bg-white border border-slate-100 hover:border-slate-200 hover:shadow-sm rounded-2xl cursor-pointer group transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 bg-white border border-slate-150 rounded-xl text-slate-500 group-hover:text-indigo-600 transition-colors flex-shrink-0 shadow-sm">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 truncate transition-colors" title={doc.filename}>
                          {doc.filename}
                        </h4>
                        <p className="text-[11px] text-slate-450 font-semibold mt-0.5 flex items-center gap-1.5">
                          {doc.pageCount ? `${doc.pageCount} pages` : 'unknown pages'} • Uploaded {new Date(doc.createdAt).toLocaleDateString()}
                          {doc.embeddingStatus === 'pending' && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded text-[10px] font-bold border border-amber-200 animate-pulse">
                              <Zap className="w-2.5 h-2.5" /> Indexing...
                            </span>
                          )}
                          {doc.embeddingStatus === 'failed' && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-rose-50 text-rose-500 rounded text-[10px] font-bold border border-rose-200">
                              <AlertCircle className="w-2.5 h-2.5" /> Index failed
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleDelete(e, doc._id)}
                        className="p-2 text-slate-400 hover:text-rose-650 hover:bg-rose-50 rounded-xl transition-all"
                        title="Delete Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronRight className="w-5 h-5 text-slate-350 group-hover:text-slate-650 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Workspace loader helper to fetch document text dynamically on open
import axios from 'axios';
const WorkspaceLoader = ({ documentId, filename, initialSummary, token, documents, onSelectDocument }) => {
  const [loading, setLoading] = useState(true);
  const [documentDetails, setDocumentDetails] = useState(null);

  useEffect(() => {
    const fetchDocDetails = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/ai/document/${documentId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDocumentDetails(res.data.document);
      } catch (err) {
        console.error("Failed to load document details", err);
        toast.error("Failed to open document details.");
      } finally {
        setLoading(false);
      }
    };
    fetchDocDetails();
  }, [documentId, token]);

  if (loading) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Opening document workspace...</p>
      </div>
    );
  }

  if (!documentDetails) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center py-16 space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h4 className="font-bold text-slate-800 text-lg">Error Loading Workspace</h4>
        <p className="text-slate-500 text-sm">Failed to retrieve the text content of the selected document.</p>
      </div>
    );
  }

  return (
    <DocumentWorkspace
      documentId={documentId}
      filename={filename}
      initialSummary={documentDetails.summary || initialSummary}
      isScannedText={documentDetails.isScanned}
      rawText={documentDetails.extractedText}
      documents={documents}
      onSelectDocument={onSelectDocument}
    />
  );
};

export default AIAssistantDocumentTab;
