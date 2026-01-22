
// Service to interact with Google Apps Script Web App
// Acts as a simple Key-Value store wrapper

// Ambil URL dari environment variable atau gunakan URL default yang diberikan user
const SHEET_URL = process.env.VITE_SHEET_URL || (import.meta as any).env?.VITE_SHEET_URL || "https://script.google.com/macros/s/AKfycbzmItDQS-I0jwahIbckSVYcZUvjMVjVzOaZIniMfWlyhTaVltAZrF-Zy_hurtrv2-m0/exec";

export const sheetApi = {
  // Check if cloud sync is enabled
  isConfigured: () => {
    const isValid = typeof SHEET_URL === 'string' && SHEET_URL.startsWith('https://script.google.com');
    if (!isValid) {
      console.warn("Sheet API: URL Spreadsheet tidak valid.");
    }
    return isValid;
  },

  // Fetch all data from the sheet
  fetchAll: async () => {
    if (!sheetApi.isConfigured()) return null;
    
    try {
      console.log("Sheet API: Memulai pengambilan data dari Cloud...");
      const urlWithCacheBuster = `${SHEET_URL}?t=${Date.now()}`;
      
      const response = await fetch(urlWithCacheBuster, {
        method: 'GET',
        headers: { 'Content-Type': 'text/plain' }
      });
      
      const text = await response.text();
      
      // Jika Google mengalihkan ke halaman login/error
      if (text.trim().startsWith('<!DOCTYPE html>') || text.trim().startsWith('<html')) {
        console.error("Sheet API Error: Google Apps Script meminta login. Pastikan deployment 'Who has access' adalah 'Anyone'.");
        return null;
      }

      try {
        const data = JSON.parse(text);
        console.log("Sheet API: Data Cloud berhasil diterima.");
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

  // Save specific key-value pair to the sheet (Legacy / Backup Mode)
  save: async (key: string, value: any) => {
    if (!sheetApi.isConfigured()) return;
    
    try {
      await fetch(SHEET_URL!, {
        method: 'POST',
        mode: 'no-cors', 
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

  // NEW: Export formatted tables to specific sheets
  exportTables: async (tables: Record<string, any[]>) => {
    if (!sheetApi.isConfigured()) return;

    try {
      console.log("Sheet API: Mengirim tabel terstruktur...");
      await fetch(SHEET_URL!, {
        method: 'POST',
        mode: 'no-cors',
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
