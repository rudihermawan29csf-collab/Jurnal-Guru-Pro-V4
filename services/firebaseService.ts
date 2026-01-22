
// Layanan Firebase telah dihapus karena migrasi ke Google Spreadsheet.
// File ini disisakan kosong untuk mencegah error impor statis jika ada file yang tertinggal referensinya.

export const firebaseApi = {
  isConfigured: () => false,
  save: async () => ({ success: false }),
  fetchAll: async () => null,
  subscribe: () => () => {}
};
