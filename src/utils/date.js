/**
 * Memformat string tanggal (misal: "2026-07-03" atau "2026-07-03T11:20:29Z") menjadi format "DD/MM/YYYY"
 * @param {string|Date} dateStr 
 * @returns {string}
 */
export function formatDate(dateStr) {
    if (!dateStr) return "";
    
    // Ambil bagian tanggal saja (abaikan jam/waktu yang dipisah 'T' atau spasi)
    const dateOnly = String(dateStr).split(/[T ]/)[0];
    
    // Pecah bagian tanggal berdasarkan tanda hubung '-' atau garis miring '/'
    const parts = dateOnly.split(/[-/]/);
    
    if (parts.length !== 3) return String(dateStr);
    
    // Kasus 1: Format YYYY-MM-DD (Tahun di depan, panjang 4 digit)
    if (parts[0].length === 4) {
        const [y, m, d] = parts;
        return `${d}/${m}/${y}`;
    }
    
    // Kasus 2: Format DD-MM-YYYY (Tahun di belakang, panjang 4 digit)
    if (parts[2].length === 4) {
        const [d, m, y] = parts;
        return `${d}/${m}/${y}`;
    }
    
    return parts.join("/");
}

/**
 * Mendapatkan string tanggal format "YYYY-MM-DD" dari objek Date
 * @param {Date} date 
 * @returns {string}
 */
export function toISO(date) {
    if (!date) return "";
    return new Date(date).toISOString().slice(0, 10);
}
