# Panduan Desain Antarmuka (DESIGN.md)
## Monitoring Job (Jahit) - Frontend

Dokumen ini berfungsi sebagai panduan acuan standar desain UI/UX untuk memastikan tampilan aplikasi tetap **konsisten, harmonis, dan profesional** saat membuat menu, halaman, atau komponen baru di masa mendatang.

---

## 1. Aturan Warna (Color Tokens)

Gunakan kode warna berikut untuk menjaga keseragaman tema visual:

| Kategori | Kode Warna | Contoh Penggunaan |
| :--- | :--- | :--- |
| **Primary (Utama)** | `#B34E33` (Terakota) | Tombol utama, aksen penting, teks penanda aktif. |
| **Secondary Button** | `#ffffff` / Border `#D1D5DB` | Tombol batal, tombol kembali. |
| **Page Background** | `#F9FAFB` (Abu sangat terang) | Latar belakang halaman aplikasi utama. |
| **Card & Header BG** | `#ffffff` (Putih murni) | Latar belakang kotak konten, tabel, dan header panel. |
| **Border & Divider** | `#E5E7EB` / `#F3F4F6` | Garis pembatas antar baris tabel, border kotak pencarian. |
| **Text - Dark** | `#111827` (Hitam pekat) | Judul utama, teks teks tebal, data utama. |
| **Text - Medium** | `#374151` (Abu gelap) | Label formulir, deskripsi menengah. |
| **Text - Muted** | `#6B7280` (Abu pudar) | Teks keterangan, sub-judul, teks sekunder. |
| **Edit Action** | `#b38600` (Kuning zaitun) | Tombol edit data pada tabel. |
| **Delete Action** | `#a01c29` (Merah marun) | Tombol hapus data. |
| **Light Accent** | `#FFF7ED` (Oranye redup) | Kotak latar belakang ikon menu, penyorot status. |

---

## 2. Tipografi (Typography)

* **Font Utama (UI & Judul):** `'Readex Pro', sans-serif`
  * Digunakan untuk judul halaman, menu, label tombol, dan komponen UI utama untuk memberikan kesan ramah (*friendly*) namun profesional.
* **Font Data (Tabel & Angka):** `'Inter', sans-serif`
  * Digunakan khusus untuk konten tabel, angka target, realisasi, dan input teks agar mudah dibaca dalam ukuran kecil.

---

## 3. Tata Letak & Radius Sudut (Layout & Border Radius)

Untuk menjaga kelengkungan visual yang seragam:
* **Halaman Utama (Page Card/Header):** `borderRadius: 16` atau `24`
* **Popup / Modals:** `borderRadius: 20`
* **Kotak Input & Tombol:** `borderRadius: 8` atau `12`
* **Bayangan Halus (Box Shadow):**
  * Card/Header: `boxShadow: "0 1px 3px rgba(0,0,0,0.05)"`
  * Modals: `boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)"`

---

## 4. Struktur Kode Boilerplate Halaman Baru

Gunakan struktur kode di bawah ini sebagai titik awal saat membuat menu atau halaman baru agar struktur file dan styling internal tetap konsisten:

```jsx
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { loadUser } from "../utils/storage";
import { toast } from "react-toastify";

export default function MenuBaruPage() {
    const navigate = useNavigate();
    const user = useMemo(() => loadUser(), []);
    const [loading, setLoading] = useState(false);

    return (
        <div style={styles.page}>
            {/* 1. Header Halaman */}
            <div style={styles.header}>
                <div>
                    <div style={styles.title}>Menu Baru</div>
                    <div style={styles.sub}>Keterangan singkat fungsi halaman</div>
                </div>
                <button style={styles.btnSecondary} onClick={() => navigate("/menu")}>
                    Kembali
                </button>
            </div>

            {/* 2. Area Konten */}
            <div style={styles.card}>
                <p style={styles.textRegular}>Konten halaman Anda ditulis di sini...</p>
                
                <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                    <button style={styles.btnPrimary}>Aksi Utama</button>
                </div>
            </div>
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        background: "#F9FAFB",
        padding: "40px 20px",
        fontFamily: "'Readex Pro', sans-serif",
        maxWidth: "1200px",
        margin: "0 auto",
    },
    header: {
        background: "#ffffff",
        border: "1px solid #E5E7EB",
        borderRadius: 16,
        padding: "24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        marginBottom: 32,
    },
    title: { 
        fontSize: 24, 
        fontWeight: 800, 
        color: "#111827" 
    },
    sub: { 
        marginTop: 4, 
        fontSize: 13, 
        color: "#6B7280", 
        fontWeight: 500 
    },
    card: {
        background: "#ffffff",
        border: "1px solid #E5E7EB",
        borderRadius: 16,
        padding: "32px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    },
    textRegular: {
        fontFamily: "'Inter', sans-serif",
        fontSize: 14,
        color: "#374151",
        lineHeight: 1.6,
    },
    btnPrimary: {
        height: 42,
        padding: "0 24px",
        borderRadius: 8,
        border: 0,
        background: "#B34E33",
        color: "#ffffff",
        fontWeight: 700,
        cursor: "pointer",
        transition: "opacity 0.2s",
        boxShadow: "0 4px 6px -1px rgba(179, 78, 51, 0.2)",
    },
    btnSecondary: {
        height: 42,
        padding: "0 20px",
        borderRadius: 8,
        border: "1px solid #D1D5DB",
        background: "#ffffff",
        color: "#374151",
        fontWeight: 700,
        cursor: "pointer",
        transition: "all 0.2s",
    },
};
```
