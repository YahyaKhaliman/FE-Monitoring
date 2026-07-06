# Dokumentasi Sistem - FE Monitoring Job (Jahit)

Repositori ini berisi kode sumber Frontend (FE) untuk aplikasi **Monitoring Job (Jahit)**. Aplikasi ini dirancang untuk menyajikan antarmuka visual yang memudahkan pemantauan, pencatatan target SPK, manajemen tenaga kerja (man power), pencatatan realisasi produksi harian, serta analisis laporan produktivitas secara real-time.

---

## 1. Stack Teknologi & Pustaka Utama

- **Core Framework:** React 19 & Vite 7 (Build tool cepat berbasis ES Modules)
- **Routing:** React Router DOM v7 (Navigasi antarpag & proteksi rute masuk)
- **State Management & Auth:** React Context (AuthProvider untuk data sesi pengguna)
- **HTTP Client:** Axios (Komunikasi API terintegrasi dengan interceptor token)
- **UI & Visualisasi Data:** Recharts (Grafik laporan interaktif), React Icons (Ikonografi)
- **Pemberitahuan:** React-Toastify (Pemberitahuan toast yang ramah)

---

## 2. Struktur Direktori Proyek

```text
fe-monitoring/
├── .github/workflows/
│   └── frontend-deploy-vps.yml   # Skrip otomatisasi deploy CI/CD ke VPS
├── src/
│   ├── assets/                   # Gambar, logo, dan file statis lainnya
│   ├── config/
│   │   └── api.js                # Konfigurasi instance Axios & Response Interceptor
│   ├── context/
│   │   └── authProvider.jsx      # Pengelola state login, logout, dan session user
│   ├── pages/                    # File halaman utama aplikasi (Screen)
│   │   ├── aksesCabangPage.jsx
│   │   ├── changePasswordPage.jsx
│   │   ├── laporanSatuPage.jsx
│   │   ├── loginPage.jsx
│   │   ├── menuPage.jsx
│   │   ├── monitoringJobPage.jsx
│   │   ├── realisasiPage.jsx
│   │   └── spkTargetPage.jsx
│   ├── routes/
│   │   └── appRoute.jsx          # Proteksi rute (Guest vs Auth Route)
│   ├── services/                 # Layer jembatan komunikasi API ke Backend (BE)
│   │   ├── laporan.service.js
│   │   ├── manPower.service.js
│   │   ├── monitoringJob.service.js
│   │   ├── realisasi.service.js
│   │   ├── spkTarget.service.js
│   │   └── user.service.js
│   ├── utils/
│   │   └── storage.js            # Fungsi helper LocalStorage (token & profile user)
│   ├── App.css                   # Style global pelengkap
│   ├── index.css                 # Reset CSS dasar
│   ├── main.jsx                  # Entry point utama React
│   └── vite-env.d.ts             # Definisi tipe environment Vite
├── DESIGN.md                     # Panduan aturan visual dan boilerplate menu baru
└── package.json                  # Konfigurasi modul proyek & npx scripts
```

---

## 3. Fitur Utama Aplikasi

1. **Otentikasi & Manajemen Sesi:**
   - Login berdasarkan username dan password dengan pembagian hak akses (Admin/IT vs User Lini Produksi).
   - Otomatis melakukan logout dan mengarahkan ke halaman login jika token JWT kadaluarsa (sistem deteksi 401 via Axios Interceptor).
2. **Dashboard Menu Utama (`/menu`):**
   - Panel navigasi responsif berbentuk grid card untuk mengakses semua fungsi aplikasi.
3. **SPK Target (`/spk-target`):**
   - Pengecekan status SPK dari database.
   - Input dan update data target produksi per jam untuk lini produksi tertentu.
4. **Man Power (`/manpower`):**
   - Pencatatan jumlah tenaga kerja aktif per kelompok dan lini produksi setiap harinya.
5. **Realisasi Job (`/realisasi`):**
   - Pencatatan jumlah realisasi hasil jahit per jam kerja beserta validasi status SPK (apakah sudah CLOSE atau masih OPEN).
6. **Monitoring Job (`/monitoring`):**
   - Tampilan visual capaian realisasi dibanding target dalam bentuk persentase efisiensi per jam kerja.
7. **Analisis Laporan (`/laporan`):**
   - Laporan untuk OWNER ringkasan eksekutif, capaian harian, capaian per lini jahit, hingga detail pencapaian per SPK yang dilengkapi grafik interaktif (Recharts).

---

## 4. Panduan Pengembangan Lokal (Local Development)

### Prasyarat:

- Node.js versi 18 atau yang terbaru.
- npm (Node Package Manager).

### Langkah-langkah:

1. Buka folder proyek ini di terminal Anda.
2. Instal semua modul dependensi proyek:
   ```bash
   npm install
   ```
3. Salin/buat file `.env` di direktori utama proyek, lalu isi variabel URL API Backend Anda:
   ```text
   VITE_API_URL=http://localhost:3000/api
   ```
4. Jalankan aplikasi dalam mode pengembangan lokal:
   ```bash
   npm run dev
   ```
5. Akses tautan lokal yang tertera di terminal Anda (biasanya `http://localhost:5173`).

---

## 5. Panduan Standardisasi Tampilan (UI/UX)

Untuk memastikan bahwa menu atau halaman baru yang dibuat di masa mendatang memiliki visual yang sama persis:

- Silakan merujuk pada berkas panduan **[DESIGN.md](file:///D:/Coding/fe-monitoring/DESIGN.md)**.
- Di dalam panduan tersebut, terdapat detail kode warna terstandar (_color tokens_), ukuran radius sudut (_border-radius_), tipografi wajib, serta kerangka kode boilerplate siap pakai.

---

## 6. Integrasi CI/CD & Deployment

Aplikasi ini dilengkapi dengan pipeline otomatisasi deployment menggunakan GitHub Actions ke server produksi (VPS).

- Berkas konfigurasi workflow berada di: **[.github/workflows/frontend-deploy-vps.yml](file:///D:/Coding/fe-monitoring/.github/workflows/frontend-deploy-vps.yml)**.
- Pipeline ini akan memicu proses penarikan kode terbaru (`git pull`), penginstalan dependensi (`npm ci`), dan kompilasi proyek (`npm run build`) secara otomatis langsung di VPS setiap kali Anda melakukan push ke branch `main`.
- **GitHub Secrets** yang wajib didaftarkan di repositori Anda meliputi: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, dan `VPS_FRONTEND_PATH`.
