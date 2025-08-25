import React, { useState, useEffect } from 'react';

const RazorpayTest = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState('');

  const testSimplePayment = () => {
    setIsLoading(true);
    setTestResult('');

    console.log('🧪 Testing simple Razorpay payment...');

    if (!window.Razorpay) {
      setTestResult('❌ Razorpay script not loaded');
      setIsLoading(false);
      return;
    }

    try {
      const options = {
        key: 'rzp_test_R93byKz54qIzaa', // Your test key
        amount: 100, // ₹1 in paise
        currency: 'INR',
        name: 'Test Payment',
        description: 'Simple test payment',
        handler: function (response) {
          console.log('✅ Test payment successful:', response);
          setTestResult(`✅ Success: ${response.razorpay_payment_id}`);
          setIsLoading(false);
        },
        prefill: {
          name: 'Test User',
          email: 'test@example.com',
          contact: '9999999999'
        },
        theme: {
          color: '#7C3AED'
        },
        modal: {
          ondismiss: function() {
            console.log('🚫 Test payment cancelled');
            setTestResult('🚫 Payment cancelled');
            setIsLoading(false);
          }
        }
      };

      console.log('🔄 Creating test Razorpay instance...');
      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', function (response) {
        console.error('❌ Test payment failed:', response);
        setTestResult(`❌ Failed: ${response.error.description} (${response.error.code})`);
        setIsLoading(false);
      });

      console.log('🎯 Opening test payment modal...');
      rzp.open();

    } catch (error) {
      console.error('❌ Error in test payment:', error);
      setTestResult(`❌ Error: ${error.message}`);
      setIsLoading(false);
    }
  };

  const testEnvironmentVariables = () => {
    console.log('🔍 Testing environment variables...');
    console.log('VITE_RAZORPAY_KEY_ID:', import.meta.env.VITE_RAZORPAY_KEY_ID);
    console.log('Development mode:', import.meta.env.DEV);
    console.log('Razorpay loaded:', !!window.Razorpay);
    
    setTestResult(`
Environment Check:
- Key ID: ${import.meta.env.VITE_RAZORPAY_KEY_ID || 'Not set'}
- Dev Mode: ${import.meta.env.DEV}
- Razorpay Loaded: ${!!window.Razorpay}
- Current URL: ${window.location.href}
    `);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-20 right-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors"
        >
          🧪 Razorpay Test
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full overflow-hidden">
        <div className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">🧪 Razorpay Debug Test</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <button
              onClick={testEnvironmentVariables}
              className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
            >
              🔍 Check Environment
            </button>

            <button
              onClick={testSimplePayment}
              disabled={isLoading}
              className={`w-full px-4 py-2 rounded transition-colors ${
                isLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
            >
              {isLoading ? '🔄 Testing...' : '💳 Test ₹1 Payment'}
            </button>
          </div>

          {testResult && (
            <div className="mt-4 p-3 bg-gray-50 rounded border">
              <h3 className="font-medium text-gray-900 mb-2">Test Result:</h3>
              <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                {testResult}
              </pre>
            </div>
          )}

          <div className="mt-4 text-sm text-gray-600">
            <p><strong>Note:</strong> This tests Razorpay with minimal configuration to isolate issues.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RazorpayTest;
