import React, { useEffect, useState, useRef } from "react";
import { sendEmailOTP, verifyEmailOTP } from "../api/api.jsx"; // <-- adjust path

const EmailVerification = ({ isOpen, onClose, email, onVerificationSuccess }) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [verificationId, setVerificationId] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState("");
  const inputsRef = useRef([]);

  // Kick off sending OTP when modal opens (and reset state)
  useEffect(() => {
    if (!isOpen) return;
    setError("");
    setOtp(["", "", "", "", "", ""]);
    setTimeRemaining(300);
    setCanResend(false);
    startEmailOtp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, email]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || timeRemaining <= 0) return;
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, timeRemaining]);

  const startEmailOtp = async () => {
    if (!email) return;
    try {
      setIsSending(true);
      const res = await sendEmailOTP(email.trim());
      // Try common shapes: {verificationId} or {data: {verificationId}}
      const vid =
        res?.verificationId ||
        res?.data?.verificationId ||
        res?.data?.data?.verificationId;
      if (!vid) throw new Error("Failed to start verification. Try again.");
      setVerificationId(vid);
    } catch (e) {
      setError(e.message || "Failed to send OTP");
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
    };

  // Handle typing (only digits)
  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return; // allow single digit or empty
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  // Handle backspace nav
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === "Enter") {
      handleVerifyOtp();
    }
  };

  // Handle paste of whole OTP
  const handlePaste = (e) => {
    const text = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, 6);
    if (text.length) {
      const arr = text.split("");
      const next = [...otp];
      for (let i = 0; i < 6; i++) next[i] = arr[i] || "";
      setOtp(next);
      inputsRef.current[Math.min(text.length, 5)]?.focus();
      e.preventDefault();
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join("");
    if (code.length !== 6 || !verificationId) return;
    setIsVerifying(true);
    setError("");
    try {
      await verifyEmailOTP(verificationId, code);
      onVerificationSuccess?.();
    } catch (e) {
      setError(e.message || "Invalid OTP. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      inputsRef.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setError("");
    setOtp(["", "", "", "", "", ""]);
    setTimeRemaining(300);
    setCanResend(false);
    await startEmailOtp();
    // Focus first input after resend
    setTimeout(() => inputsRef.current[0]?.focus(), 50);
  };

  if (!isOpen) return null;
  const isOtpComplete = otp.every((d) => d !== "");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl relative">
        {/* Header */}
        <div className="p-6 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-all duration-200 z-10"
            aria-label="Close verification"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h2>
          <p className="text-gray-600">
            We sent a 6-digit code to <span className="font-medium">{email}</span>.
          </p>
          {isSending && (
            <p className="text-sm text-blue-600 mt-2">Sending code…</p>
          )}
          {error && (
            <p className="text-sm text-red-600 mt-2">{error}</p>
          )}
        </div>

        {/* OTP Input */}
        <div className="px-6 pb-6">
          <div className="flex justify-center space-x-3 mb-8" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                ref={(el) => (inputsRef.current[index] = el)}
                type="text"
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                maxLength={1}
                inputMode="numeric"
                pattern="[0-9]"
                autoComplete="one-time-code"
              />
            ))}
          </div>

          {/* Verify Button */}
          <button
            onClick={handleVerifyOtp}
            disabled={!isOtpComplete || isVerifying || isSending}
            className={`w-full py-3 rounded-lg font-medium transition-all duration-200 ${
              isOtpComplete && !isVerifying && !isSending
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isVerifying ? (
              <span className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Verifying…</span>
              </span>
            ) : (
              "Verify Email"
            )}
          </button>

          {/* Timer and Resend */}
          <div className="mt-6 text-center">
            {timeRemaining > 0 ? (
              <div className="flex items-center justify-center space-x-2 text-blue-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium">
                  Code expires in {formatTime(timeRemaining)}
                </span>
              </div>
            ) : (
              <p className="text-sm text-gray-500 mb-2">Code expired</p>
            )}

            <div className="mt-4">
              <button
                onClick={handleResendOtp}
                disabled={!canResend || isSending}
                className={`text-sm font-medium transition-colors ${
                  canResend && !isSending
                    ? "text-gray-600 hover:text-gray-800"
                    : "text-gray-400 cursor-not-allowed"
                }`}
              >
                <span className="flex items-center justify-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>{isSending ? "Sending…" : "Resend Code"}</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
