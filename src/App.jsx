import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import FileUpload from './components/FileUpload';
import Registration from './components/Registration';
import PaymentSummary from './components/PaymentSummary';
import FileUploadProgress from './components/FileUploadProgress';
import Login from './components/Login';
import ApiDebug from './components/ApiDebug';
import RazorpayTest from './components/RazorpayTest';

function App() {
  const [currentScreen, setCurrentScreen] = useState('upload'); // 'upload', 'registration', 'payment', or 'login'
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [showUploadProgress, setShowUploadProgress] = useState(false);
  const [transactionId, setTransactionId] = useState(null);
  const [paymentId, setPaymentId] = useState(null);

  const handleProceedToRegistration = (files) => {
    setUploadedFiles(files);
    setCurrentScreen('registration');
  };

  const handleBackToUpload = () => {
    setCurrentScreen('upload');
  };

  const handleRegistrationComplete = (userData) => {
    setUserInfo(userData);
    setCurrentScreen('payment');
  };

  const handleBackToRegistration = () => {
    setCurrentScreen('registration');
  };

  const handlePaymentSuccess = (transactionId, paymentId) => {
    // Store transaction and payment IDs
    setTransactionId(transactionId);
    setPaymentId(paymentId);
    // Show upload progress popup after successful payment
    setShowUploadProgress(true);
  };

  const handleUploadComplete = () => {
    // Hide upload progress and show login screen
    setShowUploadProgress(false);
    setCurrentScreen('login');
  };

  const handleBackToHome = () => {
    // Reset everything and go back to upload screen
    setCurrentScreen('upload');
    setUploadedFiles([]);
    setUserInfo(null);
    setShowUploadProgress(false);
    setTransactionId(null);
    setPaymentId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {currentScreen !== 'login' && <Navbar />}
      <main className="flex-1">
        {currentScreen === 'upload' && (
          <FileUpload onProceedToRegistration={handleProceedToRegistration} />
        )}
        {currentScreen === 'registration' && (
          <Registration
            onBack={handleBackToUpload}
            uploadedFiles={uploadedFiles}
            onRegistrationComplete={handleRegistrationComplete}
          />
        )}
        {currentScreen === 'payment' && (
          <PaymentSummary
            userInfo={userInfo}
            onBack={handleBackToRegistration}
            onPaymentSuccess={handlePaymentSuccess}
          />
        )}
        {currentScreen === 'login' && (
          <Login onBack={handleBackToHome} />
        )}
      </main>
      {currentScreen !== 'login' && <Footer />}

      {/* Upload Progress Modal */}
      <FileUploadProgress
        isOpen={showUploadProgress}
        onClose={() => setShowUploadProgress(false)}
        onUploadComplete={handleUploadComplete}
        userInfo={userInfo}
        transactionId={transactionId}
        paymentId={paymentId}
      />

      {/* Debug Tools (Development Only) */}
      {import.meta.env.DEV && (
        <>
          <ApiDebug />
          <RazorpayTest />
        </>
      )}
    </div>
  );
}

export default App;
