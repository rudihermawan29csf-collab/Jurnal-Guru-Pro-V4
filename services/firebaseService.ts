
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getDatabase, ref, set, get, onValue, child, Database } from 'firebase/database';

/**
 * TUTORIAL UNTUK PEMULA:
 * 1. Buka Firebase Console (https://console.firebase.google.com/)
 * 2. Pilih Project Anda -> Project Settings (ikon gerigi) -> General.
 * 3. Scroll ke bawah ke bagian "Your apps" dan cari objek "firebaseConfig".
 * 4. Salin nilainya dan tempelkan (GANTI) di bawah ini:
 */
const firebaseConfig = {
  apiKey: "AIzaSyC0aV5oq0dK1b3BgqTVH59cuHEUUdOtF-I",
  authDomain: "smpn3-pacet-jurnal-c390c.firebaseapp.com",
  databaseURL: "https://smpn3-pacet-jurnal-c390c-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smpn3-pacet-jurnal-c390c",
  storageBucket: "smpn3-pacet-jurnal-c390c.firebasestorage.app",
  messagingSenderId: "1066666293990",
  appId: "1:1066666293990:web:995075591de67acc22d927"
};

// --- JANGAN UBAH KODE DI BAWAH INI ---

const hasValidConfig = () => {
  return (
    firebaseConfig.apiKey && 
    firebaseConfig.apiKey !== "SALIN_API_KEY_ANDA_DI_SINI" &&
    firebaseConfig.projectId && 
    firebaseConfig.databaseURL && 
    firebaseConfig.databaseURL.startsWith('https://')
  );
};

let app: FirebaseApp | null = null;
let db: Database | null = null;

if (hasValidConfig()) {
  try {
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    console.log("✅ Firebase berhasil terhubung!");
  } catch (error) {
    console.error("❌ Gagal inisialisasi Firebase:", error);
  }
} else {
  console.warn("⚠️ Konfigurasi Firebase belum diisi atau tidak valid. Silakan tempel kode dari Firebase Console di file services/firebaseService.ts");
}

export const firebaseApi = {
  isConfigured: () => {
    return !!db;
  },

  save: async (key: string, value: any) => {
    if (!db) return;
    try {
      const dbRef = ref(db, 'schoolData/' + key);
      await set(dbRef, value);
      return { success: true };
    } catch (error) {
      console.error("Firebase Save Error:", error);
      throw error;
    }
  },

  fetchAll: async () => {
    if (!db) return null;
    try {
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, 'schoolData'));
      if (snapshot.exists()) {
        return snapshot.val();
      }
      return null;
    } catch (error) {
      console.error("Firebase Fetch Error:", error);
      return null;
    }
  },

  subscribe: (callback: (data: any) => void) => {
    if (!db) return () => {};
    const dbRef = ref(db, 'schoolData');
    return onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      }
    }, (err) => {
      console.error("Firebase Subscription error:", err);
    });
  }
};
