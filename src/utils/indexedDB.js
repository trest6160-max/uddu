// IndexedDB utility for storing uploaded files
const DB_NAME = 'UDINFilesDB';
const DB_VERSION = 1;
const STORE_NAME = 'uploadedFiles';

// Open IndexedDB connection
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { 
          keyPath: 'id',
          autoIncrement: true 
        });
        
        // Create indexes for efficient querying
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('sessionId', 'sessionId', { unique: false });
      }
    };
  });
};

// Convert File to Base64 for storage
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });
};

// Convert Base64 back to File
const base64ToFile = (base64, filename, mimeType) => {
  const byteCharacters = atob(base64.split(',')[1]);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new File([byteArray], filename, { type: mimeType });
};

// Save files to IndexedDB
export const saveFilesToDB = async (files) => {
  try {
    console.log('saveFilesToDB called with files:', files.length);
    const db = await openDB();

    // First, convert all files to base64 (outside of transaction)
    const sessionId = Date.now().toString();
    console.log('Generated session ID:', sessionId);
    const fileRecords = [];

    for (const fileData of files) {
      console.log('Converting file to base64:', fileData.name);
      const base64Content = await fileToBase64(fileData.file);
      fileRecords.push({
        sessionId,
        name: fileData.name,
        size: fileData.size,
        type: fileData.type,
        documentType: fileData.documentType,
        status: fileData.status,
        base64Content,
        timestamp: Date.now()
      });
    }

    console.log('File records prepared:', fileRecords.length);

    // Now perform database operations in a single transaction
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      // Set a timeout to prevent hanging transactions
      const timeoutId = setTimeout(() => {
        reject(new Error('Transaction timeout'));
      }, 30000); // 30 second timeout

      // Clear existing files first (within the same transaction)
      const clearRequest = store.clear();

      clearRequest.onsuccess = () => {
        // Add new files after clearing
        let completed = 0;
        const total = fileRecords.length;

        if (total === 0) {
          // Store session metadata
          localStorage.setItem('udin_session_id', sessionId);
          localStorage.setItem('udin_files_saved', 'true');
          console.log('Files saved to IndexedDB successfully');
          clearTimeout(timeoutId);
          resolve(true);
          return;
        }

        fileRecords.forEach(fileRecord => {
          const addRequest = store.add(fileRecord);

          addRequest.onsuccess = () => {
            completed++;
            if (completed === total) {
              // Store session metadata
              localStorage.setItem('udin_session_id', sessionId);
              localStorage.setItem('udin_files_saved', 'true');
              console.log('Files saved to IndexedDB successfully');
              clearTimeout(timeoutId);
              resolve(true);
            }
          };

          addRequest.onerror = () => {
            console.error('Error adding file to IndexedDB:', addRequest.error);
            clearTimeout(timeoutId);
            reject(addRequest.error);
          };
        });
      };

      clearRequest.onerror = () => {
        console.error('Error clearing IndexedDB:', clearRequest.error);
        clearTimeout(timeoutId);
        reject(clearRequest.error);
      };

      transaction.onerror = () => {
        console.error('Transaction error:', transaction.error);
        clearTimeout(timeoutId);
        reject(transaction.error);
      };

      transaction.onabort = () => {
        console.error('Transaction aborted');
        clearTimeout(timeoutId);
        reject(new Error('Transaction aborted'));
      };
    });
  } catch (error) {
    console.error('Error saving files to IndexedDB:', error);
    return false;
  }
};

// Load files from IndexedDB
export const loadFilesFromDB = async () => {
  try {
    const sessionId = localStorage.getItem('udin_session_id');
    const filesSaved = localStorage.getItem('udin_files_saved');

    console.log('loadFilesFromDB - sessionId:', sessionId);
    console.log('loadFilesFromDB - filesSaved:', filesSaved);

    if (!sessionId || !filesSaved) {
      console.log('No session ID or files saved flag found');
      return [];
    }
    
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('sessionId');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(sessionId);
      
      request.onsuccess = () => {
        const fileRecords = request.result;
        
        // Convert back to file objects
        const files = fileRecords.map(record => {
          const file = base64ToFile(record.base64Content, record.name, record.type);
          
          return {
            id: record.id,
            name: record.name,
            size: record.size,
            type: record.type,
            documentType: record.documentType,
            status: record.status,
            file: file
          };
        });
        
        console.log('Files loaded from IndexedDB:', files.length);
        resolve(files);
      };
      
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error loading files from IndexedDB:', error);
    return [];
  }
};

// Remove individual file from IndexedDB
export const removeFileFromDB = async (fileId) => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.delete(fileId);
      request.onsuccess = () => {
        console.log('File removed from IndexedDB:', fileId);
        resolve(true);
      };
      request.onerror = () => {
        console.error('Error removing file from IndexedDB:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error removing file from IndexedDB:', error);
    return false;
  }
};

// Clear files from IndexedDB
export const clearFilesFromDB = async () => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => {
        localStorage.removeItem('udin_session_id');
        localStorage.removeItem('udin_files_saved');
        console.log('Files cleared from IndexedDB');
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error clearing files from IndexedDB:', error);
  }
};

// Check if files exist in IndexedDB
export const hasStoredFiles = () => {
  return localStorage.getItem('udin_files_saved') === 'true';
};
