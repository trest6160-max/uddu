import React, { useState } from 'react';
import EmailVerification from './EmailVerification.jsx';
import { registerUser } from '../api/api.jsx'; // ⬅️ adjust path to your API helpers

const LOCAL_USER_KEY = 'udin:user';
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const TEMP_PASSWORD_KEY = 'tempPassword';

const Registration = ({ onBack, uploadedFiles, onRegistrationComplete }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    state: '',
    pinCode: '',
    agreeToTerms: false
  });

  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEmailVerify = () => {
    if (!formData.email || !formData.email.trim()) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      alert('Please enter a valid email address.');
      return;
    }
    setShowEmailVerification(true);
  };

  const handleEmailVerificationSuccess = () => {
    setIsEmailVerified(true);
    setShowEmailVerification(false);
  };

  const saveUserToLocalDB = (payload) => {
    // payload matches your signup response shape:
    // { success: true, data: { id, firstName, ..., tempPassword, accessToken, refreshToken } }
    const data = payload?.data || payload;

    if (!data) return;

    const userRecord = {
      id: data.id,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      address: data.address,
      state: data.state,
      pinCode: data.pinCode,
      emailVerified: data.emailVerified,
      createdAt: data.createdAt,
    };

    try {
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(userRecord));
      if (data.accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
      if (data.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
      if (data.tempPassword) localStorage.setItem(TEMP_PASSWORD_KEY, data.tempPassword);
    } catch (e) {
      console.warn('Failed to persist user locally:', e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phone.trim(),
        address: formData.address.trim(),
        state: formData.state,
        pinCode: formData.pinCode.trim(),
        termsAccepted: true
      };

      const resp = await registerUser(payload);
      // Persist in local "DB" (localStorage)
      saveUserToLocalDB(resp);
      // Bubble up full response (parent can start payment flow, etc.)
      onRegistrationComplete?.(resp?.data || resp);
    } catch (e) {
      console.error(e);
      setError(e.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.firstName && 
                      formData.lastName && 
                      formData.email && 
                      isEmailVerified &&
                      formData.phone && 
                      formData.address && 
                      formData.state && 
                      formData.pinCode && 
                      formData.agreeToTerms;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Create Your UDIN Account
          </h1>
          <p className="text-gray-600">
            Complete your registration to process your documents and receive your unique UDIN User ID
          </p>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="John"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Doe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
              <div className="flex space-x-2">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="john@company.com"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={handleEmailVerify}
                  disabled={!formData.email.trim() || isEmailVerified}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isEmailVerified
                      ? 'bg-green-100 text-green-800 border border-green-200 cursor-default'
                      : !formData.email.trim()
                      ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                      : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 cursor-pointer'
                  }`}
                >
                  {isEmailVerified ? '✓ Verified' : 'Verify'}
                </button>
              </div>
              {!isEmailVerified && formData.email && (
                <p className="text-xs text-blue-600 mt-1">Click "Verify" to receive a 6-digit code via email</p>
              )}
            </div>

            {/* Phone Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="98XXXXXXX (without country code)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            {/* Address Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="123 Main Street, City"
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            {/* State and PIN Code */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="">Select State</option>
                  <option value="maharashtra">Maharashtra</option>
                  <option value="delhi">Delhi</option>
                  <option value="karnataka">Karnataka</option>
                  <option value="tamil-nadu">Tamil Nadu</option>
                  <option value="gujarat">Gujarat</option>
                  <option value="rajasthan">Rajasthan</option>
                  <option value="west-bengal">West Bengal</option>
                  <option value="uttar-pradesh">Uttar Pradesh</option>
                  <option value="bihar">Bihar</option>
                  <option value="odisha">Odisha</option>
                  <option value="telangana">Telangana</option>
                  <option value="assam">Assam</option>
                  <option value="kerala">Kerala</option>
                  <option value="punjab">Punjab</option>
                  <option value="haryana">Haryana</option>
                  <option value="himachal-pradesh">Himachal Pradesh</option>
                  <option value="goa">Goa</option>
                  <option value="jharkhand">Jharkhand</option>
                  <option value="chhattisgarh">Chhattisgarh</option>
                  <option value="uttarakhand">Uttarakhand</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">PIN Code *</label>
                <input
                  type="text"
                  name="pinCode"
                  value={formData.pinCode}
                  onChange={handleInputChange}
                  placeholder="400001"
                  maxLength="6"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-3 py-2">
                {error}
              </div>
            )}

            {/* Terms and Actions */}
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleInputChange}
                className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                required
              />
              <label className="text-sm text-gray-700">
                I agree to the{' '}
                <a href="#" className="text-purple-600 hover:text-purple-800 underline">Terms of Service</a>{' '}
                and{' '}
                <a href="#" className="text-purple-600 hover:text-purple-800 underline">Privacy Policy</a>
              </label>
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={onBack}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 font-medium transition-all duration-200"
              >
                Back to Upload
              </button>
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  isFormValid && !isSubmitting
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white transform hover:scale-105 shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating Account...</span>
                  </span>
                ) : (
                  'Create UDIN Account & Proceed to Payment'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Upload Summary */}
        {uploadedFiles && uploadedFiles.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Documents to Process ({uploadedFiles.length})
            </h3>
            <div className="space-y-2">
              {uploadedFiles.slice(0, 3).map((file, index) => (
                <div key={index} className="flex items-center space-x-3 text-sm">
                  <div className="w-4 h-4 bg-purple-100 rounded flex items-center justify-center">
                    <span className="text-purple-600 text-xs">📄</span>
                  </div>
                  <span className="text-gray-700">{file.name}</span>
                </div>
              ))}
              {uploadedFiles.length > 3 && (
                <p className="text-sm text-gray-500 ml-7">
                  +{uploadedFiles.length - 3} more documents
                </p>
              )}
            </div>
          </div>
        )}

        {/* Email Verification Modal */}
        <EmailVerification
          isOpen={showEmailVerification}
          onClose={() => setShowEmailVerification(false)}
          email={formData.email}
          onVerificationSuccess={handleEmailVerificationSuccess}
        />
      </div>
    </div>
  );
};

export default Registration;
