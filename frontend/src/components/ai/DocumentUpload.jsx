import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { uploadDocument } from '../../services/aiApi';
import toast from 'react-hot-toast';

const DocumentUpload = ({ onUploadSuccess }) => {
  const { user } = useAuthStore();
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (file) => {
    if (!file) return;

    // Validate type
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Only PDF files are allowed.");
      return;
    }

    // Validate size (15MB = 15 * 1024 * 1024 bytes)
    const maxSize = 15 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File is too large. Maximum size is 15MB.");
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const result = await uploadDocument(user.token, file, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setProgress(percentCompleted);
      });

      toast.success(result.message || "File uploaded successfully!");
      if (onUploadSuccess) {
        onUploadSuccess(result);
      }
    } catch (err) {
      console.error("Upload error:", err);
      const errMsg = err.response?.data?.message || "Failed to upload document.";
      toast.error(errMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-3xl transition-all ${
          dragActive 
            ? "border-indigo-500 bg-indigo-50/30 scale-[0.99]" 
            : "border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50"
        } ${uploading ? "pointer-events-none" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,application/pdf"
          onChange={handleChange}
          disabled={uploading}
        />

        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className={`p-4 rounded-full ${dragActive ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500"} transition-colors`}>
            {uploading ? (
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            ) : (
              <UploadCloud className="w-8 h-8" />
            )}
          </div>

          {!uploading ? (
            <div className="space-y-1">
              <p className="text-slate-800 font-bold text-base">
                Drag and drop your PDF here, or{" "}
                <button
                  type="button"
                  onClick={onButtonClick}
                  className="text-indigo-600 hover:text-indigo-500 hover:underline font-extrabold focus:outline-none"
                >
                  browse
                </button>
              </p>
              <p className="text-slate-500 text-xs font-medium">
                Supports PDF textbook chapters, papers, or study notes up to 15MB
              </p>
            </div>
          ) : (
            <div className="space-y-3 w-64 sm:w-80">
              <p className="text-slate-800 font-bold text-sm">
                Uploading and extracting text... {progress}%
              </p>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden shadow-inner">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload;
