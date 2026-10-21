# 🛒 Smart Ledger & Auto-Closing UMKM

Aplikasi manajemen inventaris dan pencatatan keuangan harian berbasis web yang dirancang khusus untuk digitalisasi UMKM. Mengadaptasi alur pencatatan buku besar fisik ke sistem digital dengan fitur otomatisasi *closing* bulanan dan *carry-over* stok.

---

## 📂 Struktur Proyek

```text
my-umkm-app/
├── prisma/
│   └── schema.prisma
├── supabase/
│   ├── functions/
│   │   └── monthly-closing/
│   │       └── index.ts
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── closing/
│   │   │   │   └── page.tsx
│   │   │   ├── inventory/
│   │   │   │   └── page.tsx
│   │   │   ├── transactions/
│   │   │   │   └── page.tsx
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── api/
│   │   │   └── trpc/[trpc]/
│   │   │       └── route.ts
│   │   ├── layout.tsx
│   │   └── providers.tsx
│   ├── components/
│   │   ├── common/
│   │   └── ui/
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   └── hooks/
│   │   ├── closing/
│   │   │   ├── components/
│   │   │   └── hooks/
│   │   ├── inventory/
│   │   │   ├── components/
│   │   │   └── hooks/
│   │   └── transactions/
│   │       ├── components/
│   │       ├── hooks/
│   │       └── utils/
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── middleware.ts
│   │   │   └── server.ts
│   │   ├── dayjs.ts
│   │   ├── mailer.ts
│   │   └── prisma.ts
│   ├── server/
│   │   ├── api/
│   │   │   ├── routers/
│   │   │   │   ├── closing.ts
│   │   │   │   ├── inventory.ts
│   │   │   │   ├── product.ts
│   │   │   │   └── transaction.ts
│   │   │   ├── root.ts
│   │   │   └── trpc.ts
│   │   └── services/
│   │       ├── closing.service.ts
│   │       ├── inventory.service.ts
│   │       ├── product.service.ts
│   │       └── transaction.service.ts
│   ├── trpc/
│   │   ├── client.ts
│   │   ├── query-client.ts
│   │   └── server.ts
│   ├── types/
│   └── utils/

```

---

## 📌 Deskripsi Database (Prisma Schema)

* **`profiles`**: Menyimpan data pengguna (Auth Supabase) dengan peran `OWNER` (akses penuh) atau `STAFF` (pencatatan transaksi harian).
* **`products`**: Tabel master barang yang menyimpan informasi dasar produk beserta harga modal (`default_cost`) dan harga jual (`default_price`).
* **`monthly_inventories`**: Mencatat kondisi stok produk per periode bulanan (`YYYY-MM`), mencakup stok awal (`initial_stock`), stok tambahan (`added_stock`), dan sisa stok berjalan (`current_stock`).
* **`transactions`**: Mencatat setiap barang yang terjual harian dengan mengunci snapshot harga modal dan harga jual saat transaksi terjadi, serta menghitung margin keuntungan (`total_profit`).
* **`monthly_closings`**: Menyimpan ringkasan rekapitulasi keuangan resmi (omzet, modal, dan laba bersih) saat proses *closing* bulanan dieksekusi.

---

## 🎯 Progress Tracker Fitur

### 🔐 1. Autentikasi & Hak Akses (Auth & RBAC)

* [ ] **Setup Supabase Auth Client**: Integrasi login email/password via `@supabase/ssr` dan Next.js Middleware.
* [ ] **Middleware Route Guard**: Membatasi akses halaman dashboard agar hanya dapat diakses pengguna yang terautentikasi.
* [ ] **Role-Based Access Control (RBAC)**: Memisahkan kewenangan tampilan UI antara `OWNER` (akses penuh) dan `STAFF` (hanya pencatatan harian).
* [ ] **Profile Sync Triggers**: Sinkronisasi otomatis data pengguna baru dari Supabase Auth `users` ke tabel `profiles`.

### 📦 2. Manajemen Barang & Stok (Inventory Management)

* [ ] **CRUD Master Produk**: Fitur penambahan, pengubahan, pencarian, dan penghapusan data produk beserta default harga modal & jual.
* [ ] **Stok Masuk (Restock)**: Modul untuk menambah `added_stock` pada periode berjalan tanpa mengubah stok awal (`initial_stock`).
* [ ] **Inisialisasi Stok Otomatis**: Pembuatan entri stok otomatis pada tabel `monthly_inventories` ketika produk baru ditambahkan.
* [ ] **Stok Read-Only Periode Tertutup**: Mencegah perubahan stok pada periode yang sudah berstatus `CLOSED`.

### 📝 3. Digitalisasi Buku Besar (Interactive Ledger Sheet)

* [ ] **UI Tabel Buku Besar**: Tampilan tabel interaktif bergaya catatan kertas manual untuk kemudahan adaptasi pemilik UMKM.
* [ ] **Baris Input Cepat (Fast Row Entry)**: Form pencatatan transaksi dengan dropdown produk dan pencarian cepat.
* [ ] **Auto-Fill Harga**: Mengisi harga modal dan harga jual secara otomatis berdasarkan master produk (dapat di-override manual).
* [ ] **Real-time Profit Calculation**: Kalkulasi otomatis total margin keuntungan (`(selling_price - cost_price) * quantity`) secara langsung di layar.
* [ ] **Potong Stok Otomatis**: Mengurangi `current_stock` pada tabel `monthly_inventories` begitu transaksi berhasil disimpan.
* [ ] **Out-of-Stock Validation**: Validasi batas stok di server dan UI untuk mencegah transaksi jika `quantity` melebihi `current_stock`.

### 🔄 4. Otomatisasi Closing & Carry-Over (Auto-Closing System)

* [ ] **Tombol Closing Manual**: Modal konfirmasi khusus `OWNER` yang menampilkan ringkasan rekapitulasi sebelum penguncian.
* [ ] **Logika Transaksi Atomic Carry-Over**:
* Mengubah status `monthly_inventories` periode aktif dari `ACTIVE` ke `CLOSED`.
* Mengambil sisa `current_stock` periode berjalan.
* Membuat baris `monthly_inventories` baru untuk periode `YYYY-MM` berikutnya dengan memasukkan sisa stok sebagai `initial_stock` dan `current_stock`.
* Menyimpan total pendapatan, modal terpakai, dan laba bersih ke tabel `monthly_closings`.


* [ ] **Scheduler pg_cron + Edge Function**: Eksekusi otomatis tugas *closing* di Supabase pada hari terakhir tiap bulan pukul 23:59 WIB.

### ✉️ 5. Notifikasi Email (SMTP Integration)

* [ ] **Setup Transporter SMTP**: Integrasi Nodemailer / Supabase Edge Function untuk pengiriman email transaksional.
* [ ] **Email Laporan Bulanan**: Pengiriman rangkuman laporan keuangan (total penjualan, modal, dan laba bersih) dalam format HTML/PDF setelah *closing*.
* [ ] **Alert Stok Menipis**: Kirim notifikasi email otomatis saat ada barang dengan `current_stock` di bawah ambang batas minim.

### 📊 6. Dashboard & Pelaporan

* [ ] **Metric Summary Cards**: Widget informasi ringkas mencakup Total Penjualan, Total Modal, Laba Bersih, dan Item Terjual bulan ini.
* [ ] **Grafik Performa Bisnis**: Visualisasi perbandingan tren omzet dan laba bersih antar periode bulanan.
* [ ] **Ekspor Laporan**: Fitur pengunduhan riwayat transaksi dan rekap bulanan ke format CSV / Excel / PDF.

