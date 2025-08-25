import React, { useState } from 'react';
import { calculateTotal } from '../data/pricing.js';
import { saveFilesToDB } from '../utils/indexedDB.js';

const CostBreakdown = ({ isOpen, onClose, uploadedFiles, onContinue }) => {
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const calculation = calculateTotal(uploadedFiles.filter(f => f.documentType));

  const handleContinueToRegistration = async () => {
    setIsSaving(true);
    try {
      // Save files to IndexedDB
      const filesWithDocumentType = uploadedFiles.filter(f => f.documentType);
      console.log('Attempting to save files to IndexedDB:', filesWithDocumentType);
      console.log('Number of files to save:', filesWithDocumentType.length);

      const success = await saveFilesToDB(filesWithDocumentType);

      if (success) {
        console.log('Files saved successfully to IndexedDB');
        console.log('Saved files count:', filesWithDocumentType.length);
      } else {
        console.error('Failed to save files to IndexedDB');
        // Continue anyway for now
      }

      // Always proceed to registration after attempting to save
      onContinue();
    } catch (error) {
      console.error('Error saving files:', error);
      // Continue anyway for now
      onContinue();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Cost Breakdown</h2>
                <p className="text-purple-100 text-sm">Review your document processing costs</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-white hover:text-purple-200 rounded-full hover:bg-white hover:bg-opacity-10 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          {/* Document Items */}
          <div className="space-y-3 mb-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
              Selected Documents ({calculation.items.length})
            </h3>
            {calculation.items.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 leading-tight">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Quantity: {item.quantity}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    ₹{item.price.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Cost Summary */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
              Cost Summary
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">Documents Subtotal</span>
                <span className="text-gray-900 font-semibold">
                  ₹{calculation.subtotal.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-700 font-medium">GST</span>
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                    18%
                  </span>
                </div>
                <span className="text-gray-900 font-semibold">
                  ₹{calculation.gst.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="border-t border-gray-300 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-600">
                      ₹{calculation.total.toLocaleString('en-IN')}
                    </div>
                    <div className="text-xs text-gray-500">
                      (inclusive of all taxes)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">Payment Information</p>
                <p className="text-sm text-blue-700 mt-1">
                  Files are stored securely. Payment will be collected during the registration process.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="flex-shrink-0 px-6 py-4 bg-white border-t border-gray-200 shadow-lg">
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 hover:border-gray-400 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              onClick={handleContinueToRegistration}
              disabled={isSaving}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 shadow-lg ${
                isSaving
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 transform hover:scale-105'
              } text-white`}
            >
              <span className="flex items-center justify-center space-x-2">
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to Registration</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostBreakdown;
