import React, { useState, useEffect } from 'react';
import { getDocumentsByUser, getTransactionsByUser, deleteDocument } from '../api/api';

const Dashboard = ({ onLogout, onBack }) => {
  const [documents, setDocuments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('documents'); // 'documents' or 'transactions'
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(null);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);

  useEffect(() => {
    // Get user data from localStorage
    const storedUserData = localStorage.getItem('userData');
    const userId = localStorage.getItem('userId');
    
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData));
    }

    // Fetch user data
    if (userId) {
      fetchData(userId);
    } else {
      setError('User not found. Please log in again.');
      setIsLoading(false);
    }
  }, []);

  const fetchData = async (userId) => {
    try {
      setIsLoading(true);
      setError('');
      
      // Fetch both documents and transactions
      const [documentsResponse, transactionsResponse] = await Promise.all([
        getDocumentsByUser(userId),
        getTransactionsByUser(userId)
      ]);
      
      if (documentsResponse.success && documentsResponse.data) {
        setDocuments(documentsResponse.data);
      } else {
        setDocuments([]);
      }
      
      if (transactionsResponse.success && transactionsResponse.data) {
        setTransactions(transactionsResponse.data);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    try {
      setIsDeleting(documentId);
      const response = await deleteDocument(documentId);
      
      if (response.success) {
        // Remove document from state
        setDocuments(prev => prev.filter(doc => doc._id !== documentId));
        setShowDeleteModal(null);
      } else {
        setError('Failed to delete document. Please try again.');
      }
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('Failed to delete document. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleLogout = () => {
    // Clear localStorage
    localStorage.clear();
    onLogout?.();
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      processing: 'bg-blue-100 text-blue-800 border-blue-200',
      signed: 'bg-green-100 text-green-800 border-green-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      failed: 'bg-red-100 text-red-800 border-red-200'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${
        statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
      }`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown'}
      </span>
    );
  };

  const getTransactionStatusBadge = (status) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-200'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${
        statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
      }`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown'}
      </span>
    );
  };

  const getDocumentTypeIcon = (type) => {
    const icons = {
      aadhaar: '🆔',
      pan: '📄',
      passport: '📘',
      driving_license: '🚗',
      voter_id: '🗳️',
      birth_certificate: '👶',
      marriage_certificate: '💒',
      income_certificate: '💰',
      caste_certificate: '📋',
      domicile_certificate: '🏠',
      other: '📎'
    };

    return icons[type] || icons.other;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const handleDownload = (documentLink, fileName) => {
    if (documentLink) {
      window.open(documentLink, '_blank');
    }
  };

  const handleRefresh = () => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      fetchData(userId);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg mb-2">Loading your dashboard...</p>
          <p className="text-gray-500 text-sm">Fetching documents and transactions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">📄</span>
                </div>
                <span className="text-xl font-semibold text-gray-900">UDIN</span>
              </div>
              
              <div className="hidden md:flex space-x-8">
                <button
                  onClick={() => setActiveTab('documents')}
                  className={`px-3 py-2 text-sm font-medium ${
                    activeTab === 'documents'
                      ? 'text-purple-600 border-b-2 border-purple-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Documents
                </button>
                <button
                  onClick={() => setActiveTab('transactions')}
                  className={`px-3 py-2 text-sm font-medium ${
                    activeTab === 'transactions'
                      ? 'text-purple-600 border-b-2 border-purple-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Transactions
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {userData && (
                <div className="hidden md:block text-sm">
                  <span className="text-gray-600">Welcome, </span>
                  <span className="text-gray-900 font-medium">
                    {userData.firstName} {userData.lastName}
                  </span>
                </div>
              )}
              <button
                onClick={handleRefresh}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button
                onClick={onBack}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium"
              >
                Home
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Info Card */}
        {userData && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Name:</span>
                <span className="ml-2 font-medium">{userData.firstName} {userData.lastName}</span>
              </div>
              <div>
                <span className="text-gray-600">Email:</span>
                <span className="ml-2 font-medium">{userData.email}</span>
              </div>
              <div>
                <span className="text-gray-600">Phone:</span>
                <span className="ml-2 font-medium">{userData.phoneNumber}</span>
              </div>
              <div>
                <span className="text-gray-600">Address:</span>
                <span className="ml-2 font-medium">{userData.address}</span>
              </div>
              <div>
                <span className="text-gray-600">State:</span>
                <span className="ml-2 font-medium">{userData.state}</span>
              </div>
              <div>
                <span className="text-gray-600">PIN Code:</span>
                <span className="ml-2 font-medium">{userData.pinCode}</span>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'documents' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">My Documents</h2>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>Total: {documents.length}</span>
                </div>
              </div>
            </div>

            {documents.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
                <p className="text-gray-600">You haven't uploaded any documents yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Document
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Uploaded On
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Signed Document
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {documents.map((doc) => (
                      <tr key={doc._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-2xl mr-3">
                              {getDocumentTypeIcon(doc.documentType)}
                            </span>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                Document #{doc._id.slice(-8)}
                              </div>
                              <div className="text-sm text-gray-500">
                                Transaction: {doc.transactionId?.slice(-8) || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {doc.documentType?.replace('_', ' ').toUpperCase() || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(doc.documentStatus)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(doc.uploadedDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {doc.signedDocumentLink ? (
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-green-600 font-medium">✓ Available</span>
                              <button
                                onClick={() => handleDownload(doc.signedDocumentLink, 'signed-document')}
                                className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                              >
                                Download
                              </button>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">Not available</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleDownload(doc.documentLink, 'original-document')}
                              className="text-purple-600 hover:text-purple-800"
                              title="Download original document"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setShowDeleteModal(doc._id)}
                              className="text-red-600 hover:text-red-800"
                              title="Delete document"
                              disabled={isDeleting === doc._id}
                            >
                              {isDeleting === doc._id ? (
                                <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">My Transactions</h2>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>Total: {transactions.length}</span>
                </div>
              </div>
            </div>

            {transactions.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
                <p className="text-gray-600">You haven't made any transactions yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transaction Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount Breakdown
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timestamps
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Documents & Types
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction) => (
                      <tr key={transaction._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              #{transaction.transactionId || transaction._id.slice(-8)}
                            </div>
                            <div className="text-sm text-gray-500">
                              DB ID: {transaction._id.slice(-8)}
                            </div>
                            {transaction.userInfo && (
                              <div className="text-xs text-gray-400 mt-1">
                                {transaction.userInfo.first_name} {transaction.userInfo.last_name}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-medium">
                            {formatCurrency(transaction.pricing?.total_amount || 0)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Subtotal: {formatCurrency(transaction.pricing?.subtotal || 0)}
                          </div>
                          {transaction.pricing?.gst_amount && (
                            <div className="text-xs text-gray-500">
                              GST ({transaction.pricing.gst_percentage}%): {formatCurrency(transaction.pricing.gst_amount)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getTransactionStatusBadge(transaction.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(transaction.createdAt)}
                          </div>
                          {transaction.updatedAt !== transaction.createdAt && (
                            <div className="text-xs text-gray-500">
                              Updated: {formatDate(transaction.updatedAt)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-1">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs inline-block w-fit">
                              {transaction.metadata?.total_documents || transaction.documents?.length || 0} docs
                            </span>
                            {transaction.documents && transaction.documents.length > 0 && (
                              <div className="text-xs text-gray-500">
                                {transaction.documents.map((doc, index) => (
                                  <div key={index} className="truncate max-w-32">
                                    {doc.document_type?.replace(/-/g, ' ') || 'Document'}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          {activeTab === 'documents' && documents.length > 0 && (
            <>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="text-2xl font-bold text-gray-900">
                  {documents.length}
                </div>
                <div className="text-sm text-gray-600">Total Documents</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="text-2xl font-bold text-green-600">
                  {documents.filter(doc => doc.documentStatus === 'signed' || doc.documentStatus === 'completed').length}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="text-2xl font-bold text-yellow-600">
                  {documents.filter(doc => doc.documentStatus === 'pending' || doc.documentStatus === 'processing').length}
                </div>
                <div className="text-sm text-gray-600">In Progress</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="text-2xl font-bold text-green-600">
                  {documents.filter(doc => doc.signedDocumentLink).length}
                </div>
                <div className="text-sm text-gray-600">Signed Available</div>
              </div>
            </>
          )}
          {activeTab === 'transactions' && transactions.length > 0 && (
            <>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="text-2xl font-bold text-gray-900">
                  {transactions.length}
                </div>
                <div className="text-sm text-gray-600">Total Transactions</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="text-2xl font-bold text-green-600">
                  {transactions.filter(tx => tx.status === 'completed').length}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="text-2xl font-bold text-yellow-600">
                  {transactions.filter(tx => tx.status === 'pending').length}
                </div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(transactions.reduce((sum, tx) => sum + (tx.pricing?.total_amount || 0), 0))}
                </div>
                <div className="text-sm text-gray-600">Total Amount</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">Delete Document</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this document? This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteDocument(showDeleteModal)}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
