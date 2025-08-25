import React, { useState, useEffect } from "react";
import { loadFilesFromDB } from "../utils/indexedDB.js";
import { calculateTotal } from "../data/pricing.js";
import {
  createTransaction,
  updateTransactionPayment,
} from "../api/api.jsx";

const LOCAL_USER_KEY = "udin:user";

const PaymentSummary = ({ userInfo, onBack, onPaymentSuccess }) => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [calculation, setCalculation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [localUser, setLocalUser] = useState(null);

  useEffect(() => {
    if (window.Razorpay) {
      setRazorpayLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => setRazorpayLoaded(false);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const files = await loadFilesFromDB();
        setUploadedFiles(files);
        if (files.length > 0) setCalculation(calculateTotal(files));
      } catch (e) {
        console.error("Error loading payment data:", e);
      } finally {
        setIsLoading(false);
      }
      try {
        const raw = localStorage.getItem(LOCAL_USER_KEY);
        if (raw) setLocalUser(JSON.parse(raw));
      } catch {}
    })();
  }, []);

  const getUserId = () => userInfo?.id || localUser?.id || null;

  const buildUserInfoForTransaction = () => {
    const u = userInfo || {};
    const l = localUser || {};
    return {
      firstName: u.firstName ?? l.firstName ?? "",
      lastName: u.lastName ?? l.lastName ?? "",
      email: u.email ?? l.email ?? "",
      phone: u.phone ?? u.phoneNumber ?? l.phoneNumber ?? "",
      address: u.address ?? l.address ?? "",
      state: u.state ?? l.state ?? "",
      pinCode: u.pinCode ?? l.pinCode ?? "",
    };
  };

  const handlePayment = async () => {
    if (!window.Razorpay) {
      alert("Payment system not available. Please refresh and try again.");
      return;
    }
    if (!calculation) return;

    setIsProcessingPayment(true);

    try {
      const uid = getUserId();
      if (!uid) throw new Error("User not found. Please sign up or log in again.");

      const txUserInfo = buildUserInfoForTransaction();

      // Ensure `document_type` is present for each item
      const documents = uploadedFiles.map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type,
        document_type: f.documentType || "other",
        document_category:
          calculation.items.find((i) => i.documentType === f.documentType)?.name ||
          "general",
      }));

      const pricing = {
        subtotal: calculation.subtotal,
        gst_amount: calculation.gst,
        total_amount: calculation.total,
        currency: "INR",
      };

      // 1) Create transaction
      const txRes = await createTransaction({
        userId: uid,
        userInfo: txUserInfo,
        documents,
        pricing,
      });

      const txData = txRes?.data || txRes;
      const transactionId = txData?.transaction_id || txData?.transactionId;
      if (!transactionId) throw new Error("Could not create transaction");
      localStorage.setItem("current_transaction_id", transactionId);

      // 2) Open Razorpay
      const key =
        import.meta.env.VITE_RAZORPAY_KEY_ID ||
        (import.meta.env.DEV ? "rzp_test_R93byKz54qIzaa" : null);
      if (!key) throw new Error("Razorpay key not configured (VITE_RAZORPAY_KEY_ID).");

      const rzp = new window.Razorpay({
        key,
        amount: Math.round(calculation.total * 100),
        currency: "INR",
        name: "UDIN Professional Services",
        description: `Document processing payment - ${transactionId}`,
        prefill: {
          name: `${txUserInfo.firstName || ""} ${txUserInfo.lastName || ""}`.trim(),
          email: txUserInfo.email || "",
          contact: txUserInfo.phone || "",
        },
        theme: { color: "#7C3AED" },
        retry: { enabled: true, max_count: 3 },
        timeout: 300,
        remember_customer: false,
        modal: {
          ondismiss: () => setIsProcessingPayment(false),
          confirm_close: true,
          escape: true,
          animation: true,
          backdrop_close: false,
        },
        handler: async (resp) => {
          try {
            // 3) Mark transaction as paid on backend
            await updateTransactionPayment(transactionId, {
              payment_id: resp.razorpay_payment_id,
              order_id: transactionId,
              signature: resp.razorpay_signature || "direct_payment_no_signature",
              method: "razorpay",
              currency: "INR",
              paid_at: new Date().toISOString(),
            });

            setIsProcessingPayment(false);
            alert(
              `Payment successful!\nPayment ID: ${resp.razorpay_payment_id}\nTransaction ID: ${transactionId}`
            );

            // hand off to the next step (e.g., open upload modal/screen)
            onPaymentSuccess?.(transactionId, resp.razorpay_payment_id);
          } catch (e) {
            setIsProcessingPayment(false);
            console.error("Payment post-update failed:", e);
            alert(
              "Payment succeeded but updating records failed. Please contact support with Transaction ID: " +
                transactionId
            );
          }
        },
      });

      rzp.on("payment.failed", (res) => {
        setIsProcessingPayment(false);
        alert(
          `Payment failed: ${res.error.description}\nError Code: ${res.error.code}\nReason: ${
            res.error.reason || "Unknown"
          }\nTransaction ID: ${transactionId}`
        );
      });

      rzp.on("payment.error", (res) => {
        setIsProcessingPayment(false);
        alert(`Payment error occurred: ${res.error?.description || "Unknown error"}`);
      });

      rzp.open();
    } catch (err) {
      setIsProcessingPayment(false);
      console.error("Error in payment flow:", err);
      alert(`Error initiating payment: ${err.message}. Please try again.`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (!calculation || uploadedFiles.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No documents found for payment.</p>
          <button
            onClick={onBack}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-8 py-6 text-center">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Payment Summary</h1>
          </div>

          <div className="p-8">
            {/* Items */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Order Details</h2>
                <span className="bg-purple-100 text-purple-800 text-sm font-medium px-3 py-1 rounded-full">
                  {uploadedFiles.length} document{uploadedFiles.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="space-y-4">
                {calculation.items.map((item, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{uploadedFiles[idx]?.name}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">Standard</span>
                          <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">UDIN Required</span>
                        </div>
                      </div>
                      <p className="font-semibold text-gray-900">
                        ₹{item.price.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-700">Subtotal</span>
                  <span className="font-medium text-gray-900">
                    ₹{calculation.subtotal.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">GST (18%)</span>
                  <span className="font-medium text-gray-900">
                    ₹{calculation.gst.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="border-t pt-3 flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-600">
                      ₹{calculation.total.toLocaleString("en-IN")}
                    </div>
                    <div className="text-sm text-gray-500">(Including all taxes)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Billing */}
            {(userInfo || localUser) && (
              <div className="bg-blue-50 rounded-lg p-4 mb-8">
                <h3 className="font-medium text-gray-900 mb-2">Billing Information</h3>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>
                    {(userInfo?.firstName || localUser?.firstName) ?? ""}{" "}
                    {(userInfo?.lastName || localUser?.lastName) ?? ""}
                  </p>
                  <p>{userInfo?.email || localUser?.email}</p>
                  <p>{userInfo?.phone || userInfo?.phoneNumber || localUser?.phoneNumber}</p>
                  <p>{userInfo?.address || localUser?.address}</p>
                  <p>
                    {userInfo?.state || localUser?.state}, {userInfo?.pinCode || localUser?.pinCode}
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-4">
              <button
                onClick={onBack}
                disabled={isProcessingPayment}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 font-medium transition-all duration-200"
              >
                Back to Registration
              </button>
              <button
                onClick={handlePayment}
                disabled={isProcessingPayment || !razorpayLoaded}
                className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  isProcessingPayment || !razorpayLoaded
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 transform hover:scale-105 shadow-lg"
                } text-white`}
              >
                {isProcessingPayment ? (
                  <span className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Opening Payment...</span>
                  </span>
                ) : !razorpayLoaded ? (
                  <span className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Loading Razorpay...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <span>Pay ₹{calculation.total.toLocaleString("en-IN")} Now</span>
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSummary;
