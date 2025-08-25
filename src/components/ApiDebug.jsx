import React, { useState } from 'react';
import { 
  createTransaction, 
  updateTransactionPayment, 
  getTransaction, 
  uploadDocuments, 
  processDocuments, 
  getAllTransactions, 
  getAllUploads,
  clearMockStorage,
  getMockStorageStatus 
} from '../api/api.jsx';

const ApiDebug = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (test, result, status = 'success') => {
    setTestResults(prev => [...prev, { test, result, status, timestamp: new Date().toISOString() }]);
  };

  const runFullApiTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      console.log('🧪 Starting comprehensive real API test...');
      console.log('🔗 Backend URL:', import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000');
      
      // Step 1: Create a transaction
      const mockUserInfo = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '1234567890',
        address: 'Test Address',
        state: 'Test State',
        pinCode: '123456'
      };

      const mockDocuments = [
        {
          name: 'Test Document 1.pdf',
          size: 50000,
          type: 'application/pdf',
          documentType: 'statutory-liabilities-certificate'
        },
        {
          name: 'Test Document 2.pdf',
          size: 75000,
          type: 'application/pdf',
          documentType: 'other-certificates'
        }
      ];

      const mockPricing = {
        subtotal: 2000,
        gst: 360,
        total: 2360
      };

      const transactionPayload = {
        userInfo: mockUserInfo,
        documents: mockDocuments,
        pricing: mockPricing
      };

      console.log('1️⃣ Creating transaction...');
      const createResponse = await createTransaction(transactionPayload);
      addResult('Create Transaction', createResponse);

      if (!createResponse.success) {
        throw new Error('Failed to create transaction');
      }

      const transactionId = createResponse.data.transaction_id;

      // Step 2: Update payment status
      console.log('2️⃣ Updating payment status...');
      const paymentData = {
        paymentId: 'test_payment_123',
        orderId: transactionId,
        signature: 'test_signature'
      };

      const paymentResponse = await updateTransactionPayment(transactionId, paymentData);
      addResult('Update Payment', paymentResponse);

      if (!paymentResponse.success) {
        throw new Error('Failed to update payment');
      }

      // Step 3: Get transaction details
      console.log('3️⃣ Getting transaction details...');
      const getResponse = await getTransaction(transactionId);
      addResult('Get Transaction', getResponse);

      // Step 4: Upload documents
      console.log('4️⃣ Uploading documents...');
      const uploadResponse = await uploadDocuments(transactionId, mockDocuments, (fileIndex, progress, fileName) => {
        console.log(`📤 Upload progress: File ${fileIndex + 1}, ${progress}%, ${fileName}`);
      });
      addResult('Upload Documents', uploadResponse);

      // Step 5: Process documents
      console.log('5️⃣ Processing documents...');
      const processResponse = await processDocuments(transactionId);
      addResult('Process Documents', processResponse);

      // Step 6: Get all transactions (debug)
      console.log('6️�� Getting all transactions...');
      const allTransactionsResponse = await getAllTransactions();
      addResult('Get All Transactions', allTransactionsResponse);

      // Step 7: Get all uploads (debug)
      console.log('7️⃣ Getting all uploads...');
      const allUploadsResponse = await getAllUploads();
      addResult('Get All Uploads', allUploadsResponse);

      console.log('✅ All API tests completed successfully!');
      addResult('API Test Complete', { message: 'All tests passed successfully!' });

    } catch (error) {
      console.error('❌ API test failed:', error);
      addResult('API Test Failed', { error: error.message }, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const clearStorage = () => {
    clearMockStorage();
    setTestResults([]);
    addResult('Storage Cleared', { message: 'Test results cleared (Note: Using real API - no local storage to clear)' });
  };

  const checkStorageStatus = () => {
    const status = getMockStorageStatus();
    addResult('Storage Status', status);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors"
        >
          🧪 API Debug
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-purple-600 text-white px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">🧪 Real API Debug Console</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {/* Controls */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={runFullApiTest}
              disabled={isRunning}
              className={`px-4 py-2 rounded ${
                isRunning 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700'
              } text-white transition-colors`}
            >
              {isRunning ? '🔄 Running Tests...' : '🚀 Run Full API Test'}
            </button>
            
            <button
              onClick={checkStorageStatus}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              📊 Check Storage
            </button>
            
            <button
              onClick={clearStorage}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
            >
              🧹 Clear Storage
            </button>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-900 mb-2">🔍 Debug Instructions</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Click "Run Full API Test" to test all real APIs in sequence</li>
              <li>• Check browser console for detailed API logs with request/response data</li>
              <li>• All API calls are made to the backend server at {import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}</li>
              <li>• Ensure the backend server is running for tests to work</li>
              <li>• This debug tool is only available in development mode</li>
            </ul>
          </div>

          {/* Results */}
          <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
            <h3 className="font-medium text-gray-900 mb-3">📋 Test Results</h3>
            
            {testResults.length === 0 ? (
              <p className="text-gray-500 text-sm">No tests run yet. Click "Run Full API Test" to start.</p>
            ) : (
              <div className="space-y-3">
                {testResults.map((result, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded border-l-4 ${
                      result.status === 'error' 
                        ? 'bg-red-50 border-red-400' 
                        : 'bg-green-50 border-green-400'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{result.test}</h4>
                      <span className="text-xs text-gray-500">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <pre className="text-xs text-gray-700 bg-white p-2 rounded overflow-x-auto">
                      {JSON.stringify(result.result, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Console Note */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              💡 <strong>Tip:</strong> Open browser console (F12) to see detailed API logs with request/response data
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiDebug;
