import React, { useState, useEffect } from 'react';
import { getDocumentsByUser } from '../api/api';

const Dashboard = ({ onLogout, onBack }) => {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // Get user data from localStorage
    const storedUserData = localStorage.getItem('userData');
    const userId = localStorage.getItem('userId');
    
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData));
    }

    // Fetch user documents
    if (userId) {
      fetchDocuments(userId);
    } else {
      setError('User not found. Please log in again.');
      setIsLoading(false);
    }
  }, []);

  const fetchDocuments = async (userId) => {
    try {
      setIsLoading(true);
      const response = await getDocumentsByUser(userId);
      
      if (response.success && response.data) {
        setDocuments(response.data);
      } else {
        setDocuments([]);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to load documents. Please try again.');
    } finally {
      setIsLoading(false);
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

  const handleDownload = (documentLink, fileName) => {
    if (documentLink) {
      window.open(documentLink, '_blank');
    }
  };

  const handleRefresh = () => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      fetchDocuments(userId);
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
                <span className="text-purple-600 px-3 py-2 text-sm font-medium border-b-2 border-purple-600">
                  Dashboard
                </span>
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

        {/* Documents Section */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">My Documents</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Total: {documents.length}</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-6 border-b bg-red-50">
              <div className="text-red-700">{error}</div>
            </div>
          )}

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
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        {documents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
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
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
