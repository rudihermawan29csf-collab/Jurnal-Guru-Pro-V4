
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getDatabase, ref, set, get, onValue, Database, Unsubscribe } from 'firebase/database';
import { getAuth, signInAnonymously, onAuthStateChanged, Auth } from 'firebase/auth';

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
let auth: Auth | null = null;

if (hasValidConfig()) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getDatabase(app);
    console.log("✅ Firebase Service Initialized");
  } catch (error) {
    console.error("❌ Gagal inisialisasi Firebase:", error);
  }
} else {
  console.warn("⚠️ Konfigurasi Firebase belum diisi atau tidak valid.");
}

// Helper untuk memastikan user sudah login sebelum melakukan operasi DB
const ensureAuthenticated = async (): Promise<void> => {
  if (!auth) throw new Error("Firebase Auth not initialized");
  if (auth.currentUser) return; // Sudah login
  
  try {
    await signInAnonymously(auth);
    console.log("✅ Auto-login Anonymous berhasil");
  } catch (error: any) {
    // FALLBACK: Jika Auth gagal (misal belum diaktifkan di console),
    // kita log warning saja dan biarkan lanjut.
    // Ini memungkinkan akses ke DB jika Rules-nya masih public (read: true, write: true).
    if (error.code === 'auth/operation-not-allowed' || error.code === 'auth/configuration-not-found') {
        console.warn("⚠️ Auth Anonim belum aktif. Mencoba akses database mode publik...");
    } else {
        console.warn(`⚠️ Auth error (${error.code}). Mencoba akses database...`);
    }
  }
};

export const firebaseApi = {
  isConfigured: () => {
    return !!db && !!auth;
  },

  save: async (key: string, value: any) => {
    if (!db) return;
    try {
      await ensureAuthenticated(); // Coba login, tapi tidak throw error jika gagal
      const dbRef = ref(db, key);
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
      await ensureAuthenticated(); // Coba login, tapi tidak throw error jika gagal
      const dbRef = ref(db);
      const snapshot = await get(dbRef);
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
    if (!auth || !db) return () => {};

    let dbUnsubscribe: Unsubscribe | null = null;
    const dbRef = ref(db!);

    // Fungsi internal untuk koneksi ke DB
    const connectToDb = () => {
        if (dbUnsubscribe) return; // Mencegah double subscription
        
        dbUnsubscribe = onValue(dbRef, (snapshot) => {
          if (snapshot.exists()) {
            callback(snapshot.val());
          } else {
            callback(null); 
          }
        }, (err) => {
          console.error("Firebase Read Error:", err);
        });
    };

    // Listener Auth State
    const authUnsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Jika berhasil login, langsung konek DB
        connectToDb();
      } else {
        // Jika belum login, coba login anonim
        signInAnonymously(auth!).catch((err: any) => {
             // FALLBACK PENTING:
             // Jika login anonim gagal (error konfigurasi), JANGAN BERHENTI.
             // Tetap coba hubungkan ke database. Siapa tahu Rules database masih public.
             if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/configuration-not-found') {
                 console.warn("⚠️ Firebase Auth belum aktif. Menggunakan mode akses publik.");
             } else {
                 console.error("Auth error inside subscribe:", err);
             }
             // Tetap panggil connectToDb() sebagai fallback
             connectToDb();
        });
      }
    });

    // Kembalikan fungsi cleanup untuk React useEffect
    return () => {
      authUnsubscribe();
      if (dbUnsubscribe) dbUnsubscribe();
    };
  }
};
