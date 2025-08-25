import React, { useState, useEffect } from 'react';
import { getDocumentCategories } from '../data/pricing.js';
import CostBreakdown from './CostBreakdown.jsx';
import { loadFilesFromDB, clearFilesFromDB, hasStoredFiles, removeFileFromDB } from '../utils/indexedDB.js';

const FileUpload = ({ onProceedToRegistration }) => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [showCostBreakdown, setShowCostBreakdown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showRestoredNotice, setShowRestoredNotice] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState(null);

  const documentCategories = getDocumentCategories();

  // Load files from IndexedDB on component mount
  useEffect(() => {
    const loadStoredFiles = async () => {
      setIsLoading(true);
      try {
        if (hasStoredFiles()) {
          const storedFiles = await loadFilesFromDB();
          if (storedFiles.length > 0) {
            setUploadedFiles(storedFiles);
            setShowRestoredNotice(true);
            // Hide notice after 5 seconds
            setTimeout(() => setShowRestoredNotice(false), 5000);
          }
        }
      } catch (error) {
        console.error('Error loading stored files:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredFiles();
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files) => {
    const fileArray = Array.from(files);
    const newFiles = fileArray.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      file: file,
      documentType: '',
      status: 'uploaded'
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const handleDocumentTypeChange = (fileId, documentType) => {
    setUploadedFiles(prev => 
      prev.map(file => 
        file.id === fileId ? { ...file, documentType } : file
      )
    );
  };

  const removeFile = async (fileId) => {
    setDeletingFileId(fileId); // Show loading state

    try {
      // Remove from IndexedDB first
      await removeFileFromDB(fileId);

      // Then remove from state
      setUploadedFiles(prev => {
        const updatedFiles = prev.filter(file => file.id !== fileId);

        // If no files left, clear session data
        if (updatedFiles.length === 0) {
          localStorage.removeItem('udin_session_id');
          localStorage.removeItem('udin_files_saved');
          console.log('All files removed, session data cleared');
        }

        return updatedFiles;
      });

      console.log('File removed successfully:', fileId);
    } catch (error) {
      console.error('Error removing file:', error);

      // Still remove from state even if IndexedDB removal fails
      setUploadedFiles(prev => {
        const updatedFiles = prev.filter(file => file.id !== fileId);

        // If no files left, clear session data
        if (updatedFiles.length === 0) {
          localStorage.removeItem('udin_session_id');
          localStorage.removeItem('udin_files_saved');
        }

        return updatedFiles;
      });

      // Show user feedback for partial failure
      console.warn('File removed from display but storage sync may have failed');
    } finally {
      setDeletingFileId(null); // Clear loading state
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const allFilesHaveDocumentType = uploadedFiles.length > 0 && uploadedFiles.every(file => file.documentType);

  const handleContinueToSignup = () => {
    setShowCostBreakdown(true);
  };

  const handleContinueToRegistration = () => {
    setShowCostBreakdown(false);
    // Pass uploaded files to parent component and switch to registration
    const filesWithDocumentType = uploadedFiles.filter(f => f.documentType);
    if (onProceedToRegistration) {
      onProceedToRegistration(filesWithDocumentType);
    }
  };

  const handleClearStoredFiles = async () => {
    try {
      await clearFilesFromDB();
      setUploadedFiles([]);
      setShowRestoredNotice(false);
    } catch (error) {
      console.error('Error clearing stored files:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            UDIN Professional Services
          </h1>
          <p className="text-gray-600">
            Upload your documents for professional UDIN processing. Supported formats: JPG, JPEG, PDF, Word Files, Excel (1KB - 50MB)
          </p>
        </div>

        {/* Restored Files Notice */}
        {showRestoredNotice && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-green-900">
                    Welcome back! Your previously uploaded documents have been restored.
                  </p>
                  <p className="text-sm text-green-700">
                    You can continue from where you left off or start fresh.
                  </p>
                </div>
              </div>
              <button
                onClick={handleClearStoredFiles}
                className="text-sm text-green-600 hover:text-green-800 font-medium underline"
              >
                Start Fresh
              </button>
            </div>
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-sm">⬇</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Upload Documents</h2>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Upload your documents for UDIN processing. Supported formats: JPG, JPEG, PDF, Word Files, Excel. File size: 1KB - 50MB.
            </p>

            {/* Drag and Drop Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                dragActive 
                  ? 'border-purple-400 bg-purple-50' 
                  : 'border-gray-300 bg-gray-50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-2xl text-gray-400">⬆</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Drag and drop your files here
              </h3>
              <p className="text-gray-600 mb-4">
                or click to browse from your computer
              </p>
              <input
                type="file"
                multiple
                onChange={handleChange}
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx"
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-md cursor-pointer transition-colors inline-block"
              >
                Select Files
              </label>
            </div>
          </div>
        </div>

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Uploaded Files ({uploadedFiles.length}/30)
                </h3>
                <span className="text-sm text-gray-600">
                  {uploadedFiles.filter(f => f.documentType).length} completed
                </span>
              </div>

              <div className="space-y-4">
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                        <span className="text-gray-600">📄</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                      <div className="flex-1 max-w-xs">
                        <select
                          value={file.documentType}
                          onChange={(e) => handleDocumentTypeChange(file.id, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="">Select document type</option>
                          {Object.entries(documentCategories).map(([category, documents]) => (
                            <optgroup key={category} label={category}>
                              {documents.map(doc => (
                                <option key={doc.key} value={doc.key}>
                                  {doc.name} - ₹{doc.price}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {file.documentType && (
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 text-sm">✓</span>
                        </div>
                      )}
                      <button
                        onClick={() => removeFile(file.id)}
                        disabled={deletingFileId === file.id}
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                          deletingFileId === file.id
                            ? 'bg-gray-200 cursor-not-allowed'
                            : 'bg-red-100 hover:bg-red-200'
                        }`}
                      >
                        {deletingFileId === file.id ? (
                          <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <span className="text-red-600 text-sm">×</span>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 text-center">
                <button
                  onClick={handleContinueToSignup}
                  disabled={!allFilesHaveDocumentType}
                  className={`px-8 py-3 rounded-md text-white font-medium transition-colors ${
                    allFilesHaveDocumentType
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  Continue to Sign-up
                </button>
                {!allFilesHaveDocumentType && (
                  <p className="text-sm text-gray-500 mt-2">
                    Please select a document type for all files to continue
                  </p>
                )}
                {allFilesHaveDocumentType && (
                  <p className="text-sm text-gray-500 mt-2">
                    Next: Sign-up with OTP verification
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Cost Breakdown Modal */}
        <CostBreakdown
          isOpen={showCostBreakdown}
          onClose={() => setShowCostBreakdown(false)}
          uploadedFiles={uploadedFiles}
          onContinue={handleContinueToRegistration}
        />
      </div>
    </div>
  );
};

export default FileUpload;
