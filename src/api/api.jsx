// Real API system for UDIN Professional Services
// Connected to backend server at localhost:5000

// Base configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

/* -------------------------------------------
   Auth header helpers
-------------------------------------------- */
const getAccessToken = () => localStorage.getItem("accessToken") || "";
const setAccessToken = (t) => t && localStorage.setItem("accessToken", t);
const setRefreshToken = (t) => t && localStorage.setItem("refreshToken", t);
const getAuthHeaders = () => {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/* -------------------------------------------
   Core fetch helpers
-------------------------------------------- */
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
    ...options,
  };

  try {
    const res = await fetch(url, config);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || data.error || `HTTP ${res.status}`);
    return data;
  } catch (err) {
    console.error(`API Error (${endpoint}):`, err);
    throw err;
  }
};

// For uploads (FormData) — do NOT set Content-Type; browser will set boundary.
const apiFormRequest = async (endpoint, formData, method = "POST") => {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      method,
      headers: {
        ...getAuthHeaders(),
      },
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || data.error || `HTTP ${res.status}`);
    return data;
  } catch (err) {
    console.error(`API Error (${endpoint}):`, err);
    throw err;
  }
};

/* -------------------------------------------
   Auth APIs (align with Postman collection)
-------------------------------------------- */
export const registerUser = async (userInfo) => {
  return apiRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      firstName: userInfo.firstName,
      lastName: userInfo.lastName,
      email: userInfo.email,
      phoneNumber: userInfo.phoneNumber ?? userInfo.phone,
      address: userInfo.address,
      state: userInfo.state,
      pinCode: userInfo.pinCode,
      termsAccepted: true,
    }),
  });
};

export const loginUser = async (email, password) => {
  const res = await apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  // Persist tokens if backend returns them
  const at = res?.data?.accessToken || res?.accessToken;
  const rt = res?.data?.refreshToken || res?.refreshToken;
  if (at) setAccessToken(at);
  if (rt) setRefreshToken(rt);
  return res;
};

export const sendEmailOTP = async (email) =>
  apiRequest("/api/auth/send-email-otp", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

export const verifyEmailOTP = async (verificationId, otp) =>
  apiRequest("/api/auth/verify-email-otp", {
    method: "POST",
    body: JSON.stringify({ verificationId, otp }),
  });

export const forgotPassword = async (email) =>
  apiRequest("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

export const verifyForgotPasswordOTP = async (verificationId, otp) =>
  apiRequest("/api/auth/verify-forgot-password", {
    method: "POST",
    body: JSON.stringify({ verificationId, otp }),
  });

export const resetPassword = async (email, newPassword) =>
  apiRequest("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, newPassword }),
  });

/* -------------------------------------------
   Transactions (match Postman: business id in URL)
-------------------------------------------- */
// Create Transaction: send Mongo userId as "user_id"
export const createTransaction = async ({ userId, userInfo, documents, pricing }) => {
  const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

  const normalizedDocs = (documents || []).map((doc) => {
    const docType =
      doc.document_type ??
      doc.documentType ??          // camelCase from UI
      doc.typeHint ??              // any other hint you may store
      doc.category ??              // fallback if you used "category"
      "other";                     // final fallback

    const docCategory =
      doc.document_category ??
      doc.documentCategory ??
      "general";

    return {
      name: doc.name,
      size: doc.size,
      type: doc.type,
      document_type: docType,        // <-- always present now
      document_category: docCategory,
    };
  });

  const payload = {
    transaction_id: transactionId,
    user_id: userId,
    user_info: {
      first_name: userInfo.firstName,
      last_name: userInfo.lastName,
      email: userInfo.email,
      phone: userInfo.phone,
      address: userInfo.address,
      state: userInfo.state,
      pin_code: userInfo.pinCode,
    },
    documents: normalizedDocs,
    pricing: {
      subtotal: pricing.subtotal,
      gst_amount: pricing.gst_amount ?? pricing.gst,
      gst_percentage: pricing.gst_percentage ?? 18,
      total_amount: pricing.total_amount ?? pricing.total,
      currency: "INR",
    },
    status: "pending",
    metadata: {
      total_documents: normalizedDocs.length,
      platform: "web",
      version: "1.0.0",
    },
  };

  return await apiRequest("/api/transactions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

// Update Transaction: set to "completed" (Postman)
export const updateTransactionPayment = async (transactionId) => {
  return apiRequest(`/api/transactions/${transactionId}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "completed" }),
  });
};

// Fetch single by business transaction_id
export const getTransaction = async (transactionId) =>
  apiRequest(`/api/transactions/${transactionId}`, { method: "GET" });

// By user (Mongo ObjectId string)
export const getTransactionsByUser = async (userId) =>
  apiRequest(`/api/transactions/user/${userId}`, { method: "GET" });

/* -------------------------------------------
   Documents (upload blocked until tx completed)
   NOTE: Upload endpoints expect:
     - userId: Mongo ObjectId string
     - transactionId: Transaction Mongo _id (not business id)
-------------------------------------------- */
const resolveTransactionDbId = async (transactionBusinessId) => {
  const resp = await getTransaction(transactionBusinessId);
  const tx = resp?.data || resp; // controller returns {success, data}
  // Expecting tx to include its Mongo _id and userId (from our server)
  return {
    txDbId: tx?._id || tx?.id,
    userId: tx?.userId || tx?.user_id,
  };
};


function dataURLToBlob(dataUrl) {
  const [meta, b64] = dataUrl.split(',');
  const mime = (meta.match(/data:(.*?);base64/) || [])[1] || 'application/octet-stream';
  const bin = atob(b64);
  const len = bin.length;
  const u8 = new Uint8Array(len);
  for (let i = 0; i < len; i++) u8[i] = bin.charCodeAt(i);
  return new Blob([u8], { type: mime });
}

function ensureFileLike(f) {
  if (f instanceof File) return f;
  if (f?.file instanceof File) return f.file;
  if (f?.blob instanceof Blob) return new File([f.blob], f.name || 'upload.bin', { type: f.type || f.blob.type });
  if (typeof f?.base64 === 'string') {
    const blob = dataURLToBlob(f.base64);
    return new File([blob], f.name || 'upload.bin', { type: f.type || blob.type });
  }
  if (f?.arrayBuffer && f?.type) {
    const blob = new Blob([f.arrayBuffer], { type: f.type });
    return new File([blob], f.name || 'upload.bin', { type: f.type });
  }
  // last resort: if you stored raw bytes
  if (f?.bytes && f?.type) {
    const blob = new Blob([new Uint8Array(f.bytes)], { type: f.type });
    return new File([blob], f.name || 'upload.bin', { type: f.type });
  }
  throw new Error('Selected item is not a File/Blob. Check how you store files in IndexedDB.');
}
// Upload one-by-one with optional progress callback
export const uploadDocuments = async (transactionBusinessId, files, progressCallback) => {
  const { txDbId, userId } = await resolveTransactionDbId(transactionBusinessId);
  if (!txDbId || !userId) throw new Error("Unable to resolve transaction or user");

  const uploads = [];
  for (let i = 0; i < files.length; i++) {
    const original = files[i];
    const fileObj = ensureFileLike(original); // <-- ensure real File/Blob

    if (progressCallback) progressCallback(i, 0, fileObj.name || original.name);

    const fd = new FormData();
    fd.append("userId", String(userId));
    fd.append("transactionId", transactionBusinessId);  
    fd.append("documentType", original.documentType || "other");
    // include a filename explicitly
    fd.append("file", fileObj, fileObj.name || original.name || "upload.bin");

    const handle = setInterval(() => {
      if (progressCallback) {
        const pct = Math.min(90, (Date.now() % 1000) / 10);
        progressCallback(i, pct, fileObj.name || original.name);
      }
    }, 100);

    try {
      const res = await apiFormRequest("/api/documents/upload", fd); // no manual Content-Type
      clearInterval(handle);
      if (progressCallback) progressCallback(i, 100, fileObj.name || original.name);
      uploads.push(res.data || res);
    } catch (err) {
      clearInterval(handle);
      throw err;
    }
  }

  return {
    success: true,
    data: {
      upload_id: `UPLOAD_${Date.now()}`,
      transaction_id: transactionBusinessId,
      files: uploads,
      total_files: files.length,
      status: "completed",
      completed_at: new Date().toISOString(),
    },
    message: "Documents uploaded successfully",
  };
};

// Upload many in one request
export const uploadMultipleDocuments = async (transactionBusinessId, files) => {
  const { txDbId, userId } = await resolveTransactionDbId(transactionBusinessId);
  if (!txDbId || !userId) throw new Error("Unable to resolve transaction or user");

  const fd = new FormData();
  fd.append("userId", userId);
  fd.append("transactionId", txDbId);
  fd.append("documentType", "other"); // or send per-file types via parallel array
  files.forEach((file) => fd.append("files", file));

  return apiFormRequest("/api/documents/upload-many", fd, "POST");
};

export const getDocumentsByUser = async (userId) =>
  apiRequest(`/api/documents/user/${userId}`, { method: "GET" });

// Backend expects Transaction Mongo _id for this route
export const getDocumentsByTransaction = async (transactionBusinessId) => {
  const { txDbId } = await resolveTransactionDbId(transactionBusinessId);
  if (!txDbId) throw new Error("Unable to resolve transaction");
  return apiRequest(`/api/documents/transaction/${txDbId}`, { method: "GET" });
};

export const getDocument = async (documentId) =>
  apiRequest(`/api/documents/${documentId}`, { method: "GET" });

export const updateDocumentStatus = async (documentId, status) =>
  apiRequest(`/api/documents/${documentId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ documentStatus: status }),
  });

// Upload signed file and mark as signed
export const uploadSignedDocument = async (documentId, signedFile) => {
  const fd = new FormData();
  fd.append("file", signedFile);
  return apiFormRequest(`/api/documents/${documentId}/signed-file`, fd, "PATCH");
};

export const deleteDocument = async (documentId) =>
  apiRequest(`/api/documents/${documentId}`, { method: "DELETE" });

/* -------------------------------------------
   Legacy / debug helpers (kept for compatibility)
-------------------------------------------- */
export const getUploadStatus = async (uploadId) => {
  console.warn("getUploadStatus is deprecated - use getDocumentsByTransaction instead");
  return {
    success: true,
    data: {
      upload_id: uploadId,
      status: "completed",
      message: "Upload status retrieved (compatibility mode)",
    },
  };
};

export const processDocuments = async (transactionId) => {
  console.warn("processDocuments - simulated; ensure backend supports processing status");
  try {
    await updateTransactionPayment(transactionId);
    return {
      success: true,
      data: {
        transaction_id: transactionId,
        processing_status: "completed",
        processing_started_at: new Date(Date.now() - 120000).toISOString(),
        processing_completed_at: new Date().toISOString(),
        estimated_delivery: new Date(Date.now() + 86400000).toISOString(),
      },
      message: "Documents processed successfully",
    };
  } catch (error) {
    throw { success: false, error: error.message, message: "Failed to process documents" };
  }
};

export const getAllTransactions = async () => {
  console.warn("getAllTransactions - not provided by API; use getTransactionsByUser");
  return { success: true, data: [], count: 0, message: "Debug only" };
};

export const getAllUploads = async () => {
  console.warn("getAllUploads - not provided by API; use getDocumentsByUser");
  return { success: true, data: [], count: 0, message: "Debug only" };
};

export const clearMockStorage = () => {
  console.log("clearMockStorage - no longer applicable with real API");
};

export const getMockStorageStatus = () => {
  console.log("getMockStorageStatus - no longer applicable with real API");
  return { message: "Using real API - no mock storage" };
};

/* -------------------------------------------
   Startup log
-------------------------------------------- */
if (import.meta.env.DEV) {
  console.log(`🔗 Real API system initialized - Backend: ${API_BASE_URL}`);
  console.log("📋 Available endpoints:");
  console.log("  Auth: /api/auth/*");
  console.log("  Transactions: /api/transactions/*");
  console.log("  Documents: /api/documents/*");
}
