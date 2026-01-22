
// Service to interact with Google Apps Script Web App
// Acts as a simple Key-Value store wrapper

const STORAGE_KEY_URL = 'app_sheet_url';

// URL Backend Default yang Anda berikan
const DEFAULT_SHEET_URL = "https://script.google.com/macros/s/AKfycbxxSCzzbnJP3dA1xUe772DH4Hs0KDZamWUx94pzZGirper0OaV_mhnjPDAzg_0JlKQ3/exec";

// Helper to get URL dynamically
const getSheetUrl = () => {
  // Prioritas: LocalStorage (jika user mengubahnya manual) -> Environment Variable -> Default Hardcoded
  return localStorage.getItem(STORAGE_KEY_URL) || 
         process.env.VITE_SHEET_URL || 
         (import.meta as any).env?.VITE_SHEET_URL || 
         DEFAULT_SHEET_URL;
};

export const sheetApi = {
  // Update URL dynamically
  setBaseUrl: (url: string) => {
    if (url) {
      localStorage.setItem(STORAGE_KEY_URL, url);
    } else {
      localStorage.removeItem(STORAGE_KEY_URL);
    }
  },

  getBaseUrl: () => getSheetUrl(),

  // Check if cloud sync is enabled
  isConfigured: () => {
    const url = getSheetUrl();
    const isValid = typeof url === 'string' && url.startsWith('https://script.google.com');
    if (!isValid && url.length > 0) {
      console.warn("Sheet API: URL Spreadsheet tidak valid.");
    }
    return isValid;
  },

  // Fetch all data from the sheet
  fetchAll: async () => {
    if (!sheetApi.isConfigured()) return null;
    
    const baseUrl = getSheetUrl();
    const separator = baseUrl.includes('?') ? '&' : '?';
    const urlWithCacheBuster = `${baseUrl}${separator}t=${Date.now()}`;

    try {
      console.log("Sheet API: Memulai pengambilan data dari Cloud...");
      
      let response;
      let error;
      
      // Simple retry logic
      for (let i = 0; i < 3; i++) {
        try {
          response = await fetch(urlWithCacheBuster, {
            method: 'GET',
            credentials: 'omit', // CRITICAL: Prevent sending cookies to avoid auth errors
            redirect: 'follow',  // Follow redirects from script.google.com
            referrerPolicy: 'no-referrer', // CRITICAL: Often needed for GAS Web Apps to allow CORS
          });
          if (response.ok) break;
        } catch (e) {
          error = e;
          console.warn(`Sheet API: Percobaan ke-${i+1} gagal.`);
          await new Promise(r => setTimeout(r, 1500));
        }
      }

      if (!response || !response.ok) {
        throw error || new Error(`HTTP Error ${response?.status}`);
      }

      const text = await response.text();
      
      // Jika Google mengalihkan ke halaman login/error
      if (text.trim().startsWith('<!DOCTYPE html>') || text.trim().startsWith('<html')) {
        console.error("Sheet API Error: Google Apps Script meminta login. Pastikan deployment 'Who has access' adalah 'Anyone'.");
        return null;
      }

      try {
        const data = JSON.parse(text);
        console.log("Sheet API: Data Cloud berhasil diterima.", Object.keys(data));
        return data;
      } catch (parseError) {
        console.error("Sheet API Error: Format JSON tidak valid.", text.substring(0, 100));
        return null;
      }
    } catch (error) {
      console.error("Sheet API Network Error:", error);
      return null;
    }
  },

  // Save specific key-value pair to the sheet (Key-Value Store Mode)
  save: async (key: string, value: any) => {
    if (!sheetApi.isConfigured()) return;
    
    try {
      // Use 'no-cors' mode for POST to handle Google Apps Script redirects without CORS errors.
      await fetch(getSheetUrl(), {
        method: 'POST',
        mode: 'no-cors', 
        credentials: 'omit', 
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain' }, 
        body: JSON.stringify({ key, value }),
      });
      
      console.log(`Sheet API: Data '${key}' dikirim ke Spreadsheet.`);
      return { status: 'sent' };
    } catch (error) {
      console.error(`Sheet API Save Error (${key}):`, error);
      throw error;
    }
  },

  // Export formatted tables (Migration Mode)
  exportTables: async (tables: Record<string, any[]>) => {
    if (!sheetApi.isConfigured()) return;

    try {
      console.log("Sheet API: Mengirim tabel terstruktur...");
      await fetch(getSheetUrl(), {
        method: 'POST',
        mode: 'no-cors',
        credentials: 'omit',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain' }, 
        body: JSON.stringify({ 
          type: 'export_tables', 
          data: tables 
        }),
      });
      console.log("Sheet API: Tabel berhasil dikirim.");
      return { status: 'sent' };
    } catch (error) {
      console.error("Sheet API Export Table Error:", error);
      throw error;
    }
  }
};
