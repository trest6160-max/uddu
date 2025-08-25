// Razorpay utility functions
export const loadRazorpayScript = () => {
  return new Promise((resolve, reject) => {
    // Check if Razorpay is already loaded
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    // Check if script is already added
    const existingScript = document.getElementById('razorpay-script');
    if (existingScript) {
      existingScript.onload = () => resolve(true);
      existingScript.onerror = () => reject(false);
      return;
    }

    // Create and load script
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => reject(false);
    document.head.appendChild(script);
  });
};

export const createRazorpayOrder = (orderData) => {
  const {
    amount,
    currency = 'INR',
    name,
    description,
    image,
    prefill = {},
    notes = {},
    theme = { color: '#7C3AED' },
    handler,
    onDismiss,
    onError
  } = orderData;

  // Get key with fallback for development
  const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || (import.meta.env.DEV ? 'rzp_test_R93byKz54qIzaa' : null);

  const options = {
    key: razorpayKey,
    amount: Math.round(amount * 100), // Amount in paise (multiply by 100 and round)
    currency,
    name,
    description,
    image,
    order_id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    handler,
    prefill,
    notes,
    theme,
    modal: {
      ondismiss: onDismiss || (() => console.log('Payment modal dismissed'))
    }
  };

  const rzp = new window.Razorpay(options);
  
  if (onError) {
    rzp.on('payment.failed', onError);
  }

  return rzp;
};

export const validateRazorpayConfig = () => {
  // Try to get the key ID from environment variables
  let keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;

  // Debug logging
  console.log('Environment variables check:', {
    VITE_RAZORPAY_KEY_ID: import.meta.env.VITE_RAZORPAY_KEY_ID,
    mode: import.meta.env.MODE,
    dev: import.meta.env.DEV
  });

  // Fallback to hardcoded key for development (not recommended for production)
  if (!keyId && import.meta.env.DEV) {
    console.warn('Using fallback Razorpay key for development');
    keyId = 'rzp_test_R93byKz54qIzaa';
  }

  if (!keyId) {
    console.error('Razorpay Key ID not found in environment variables');
    console.error('Available env vars:', Object.keys(import.meta.env));
    return false;
  }

  if (!keyId.startsWith('rzp_')) {
    console.error('Invalid Razorpay Key ID format:', keyId);
    return false;
  }

  console.log('Razorpay configuration validated successfully');
  return true;
};
