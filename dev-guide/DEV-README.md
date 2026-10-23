# 🛒 Smart Ledger & Auto-Closing UMKM

Aplikasi manajemen inventaris dan pencatatan keuangan harian berbasis web yang dirancang khusus untuk digitalisasi UMKM. Mengadaptasi alur pencatatan buku besar fisik ke sistem digital dengan fitur otomatisasi *closing* bulanan dan *carry-over* stok.

---

## 📂 Struktur Proyek

my-umkm-app/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── _components/                 # Berisi React Component yang akan digunakan secara global
│   │   │   └── QueryClientProviders.tsx # Provider untuk tRPC & TanStack Query di root layout
│   │   ├── (auth)/
│   │   │   └── [nama_auth]/
│   │   │       ├── _components/         # Berisi local Component yang hanya digunakan pada fitur ini
│   │   │       ├── page.tsx             # Halaman utama modul auth (misal: login/register)
│   │   │       └── _components/         # Komponen UI khusus untuk halaman auth
│   │   ├── (dashboard)/
│   │   │   └── [nama_fitur]/
│   │   │       ├── _components/         # Berisi local Component yang hanya digunakan pada fitur ini
│   │   │       ├── page.tsx             # Halaman utama fitur dashboard (misal: inventory/closing)
│   │   │       └── _components/         # Komponen UI khusus untuk halaman fitur tersebut
│   │   └── api/
│   │       └── trpc/
│   │           └── [trpc]/
│   │               └── route.ts         # HTTP handler utama tRPC (menghubungkan client & server)
│   ├── server/
│   │   ├── trpc.ts                      # Inisialisasi tRPC (context, router, public/protected procedure)
│   │   ├── index.ts                     # Root Router (menggabungkan seluruh modul router)
│   │   └── routers/
│   │       └── [nama_modul]/
│   │           ├── router.ts            # Definisi endpoint/procedure tRPC untuk modul terkait
│   │           ├── [nama_modul].actions.ts    # Logika bisnis / service layer per modul
│   │           └── [nama_modul].repository.ts # Akses database / query Prisma per modul
│   ├── client/
│   │   ├── trpc.ts                      # Konfigurasi tRPC client (React Query hooks)
│   │   └── index.ts                     # Entry point client utility & ekspor state/query client
│   ├── features/
│   │   └── [nama_fitur]/
│   │       ├── components/              # Komponen kompleks/global yang bisa dipakai ulang khusus fitur ini
│   │       ├── hooks/                   # Custom hooks (termasuk pemanggilan tRPC hooks seperti useQuery/useMutation)
│   │       └── utils/                   # Fungsi helper atau formatter khusus fitur tersebut
│   ├── lib/
│   │   ├── supabase/                    # Konfigurasi client, middleware, dan server Supabase
│   │   ├── dayjs.ts                     # Konfigurasi library manipulasi tanggal
│   │   ├── mailer.ts                    # Konfigurasi pengiriman email
│   │   └── prisma.ts                    # Inisialisasi instance Prisma Client global
│   ├── types/                           # Kumpulan tipe data global / TypeScript interfaces
│   └── utils/                           # Fungsi helper atau utility umum yang bersifat global

---

## 📌 Deskripsi Database (Prisma Schema)

* **`profiles`**: Menyimpan data pengguna (Auth Supabase) dengan peran `OWNER` (akses penuh) atau `STAFF` (pencatatan transaksi harian).
* **`products`**: Tabel master barang yang menyimpan informasi dasar produk beserta harga modal (`default_cost`) dan harga jual (`default_price`).
* **`monthly_inventories`**: Mencatat kondisi stok produk per periode bulanan (`YYYY-MM`), mencakup stok awal (`initial_stock`), stok tambahan (`added_stock`), dan sisa stok berjalan (`current_stock`).
* **`transactions`**: Mencatat setiap barang yang terjual harian dengan mengunci snapshot harga modal dan harga jual saat transaksi terjadi, serta menghitung margin keuntungan (`total_profit`).
* **`monthly_closings`**: Menyimpan ringkasan rekapitulasi keuangan resmi (omzet, modal, dan laba bersih) saat proses *closing* bulanan dieksekusi.

---

## 🎯 Progress Tracker Fitur
**Beri x disela `[ ]` untuk mencentang progressnya**
### 🔐 1. Autentikasi & Hak Akses (Auth & RBAC)
- **Backend (BE)**:
  - [ ] **Supabase Auth & Database Sync**: Buat Postgres Trigger/Function untuk menyinkronkan user baru dari Supabase Auth (`auth.users`) ke tabel `profiles`.
  - [ ] **tRPC Auth Middleware**: Buat `protectedProcedure` dan `adminProcedure` di `server/api/trpc.ts` untuk memverifikasi JWT session dan mengecek `role` (`OWNER` vs `STAFF`).
  - [ ] **Supabase Server Client Setup**: Konfigurasi `@supabase/ssr` di `lib/supabase/server.ts` & `middleware.ts` untuk handling session secara server-side.
- **Frontend (FE)**:
  - [ ] **Halaman Login UI**: Buat halaman login (`src/app/(auth)/login/page.tsx`) dengan form validasi (Zod + React Hook Form).
  - [ ] **Middleware Route Guard**: Konfigurasi middleware Next.js untuk meredirect user unauthenticated ke `/login`.
  - [ ] **Role-Based UI Rendering**: Buat custom hook `useUser` / `useRole` untuk menyembunyikan/menampilkan elemen UI sensitif berdasarkan peran (`OWNER` / `STAFF`).

---

### 📦 2. Manajemen Barang & Stok (Inventory Management)
- **Backend (BE)**:
  - [ ] **Product Service & Router**: Implementasi tRPC router (`product.ts`) dan service (`product.service.ts`) untuk CRUD master produk (Zod schema validation).
  - [ ] **Inventory Service & Restock Logic**: Buat endpoint `addStock` untuk menambah `added_stock` tanpa merubah `initial_stock`.
  - [ ] **Auto Init Inventory Trigger**: Buat fungsi backend saat produk baru dibuat agar otomatis meng-insert baris baru di `monthly_inventories` untuk periode berjalan (`YYYY-MM`).
  - [ ] **Read-Only Inventory Validation**: Tambahkan validasi di service layer agar stok pada periode `CLOSED` tidak dapat diubah/di-edit.
- **Frontend (FE)**:
  - [ ] **Katalog Produk UI**: Buat tabel daftar produk beserta modal Form Tambah/Edit/Hapus Produk.
  - [ ] **Modal Restock**: Buat UI modal input penambahan stok barang berjalan.
  - [ ] **Filter & Search Produk**: Implementasi komponen pencarian dan filter status stok (hampir habis / tersedia).

---

### 📝 3. Digitalisasi Buku Besar (Interactive Ledger Sheet)
- **Backend (BE)**:
  - [ ] **Transaction Router**: Buat tRPC procedure `transaction.create` dan `transaction.getAll` untuk mencatat dan mengambil data transaksi harian.
  - [ ] **Stock Deduction & Atomic Transaction**: Gunakan Prisma Transaction (`prisma.$transaction`) untuk memastikan saat transaksi berhasil disimpan, `current_stock` di `monthly_inventories` berkurang secara atomic.
  - [ ] **Out-of-Stock Validation**: Validasi backend untuk menolak transaksi jika `quantity` > `current_stock`.
- **Frontend (FE)**:
  - [ ] **UI Ledger Table (Buku Besar)**: Buat komponen tabel interaktif bergaya catatan kertas manual.
  - [ ] **Fast Row Entry Component**: Buat baris input dinamis dengan autocomplete/select produk.
  - [ ] **Auto-Fill & Real-time Calculation**: Integrasikan state form agar harga modal, harga jual, dan total profit terhitung otomatis di UI sebelum disubmit.
  - [ ] **TanStack Query Cache Invalidation**: Panggil `utils.inventory.getStocks.invalidate()` setelah mutasi transaksi berhasil agar angka stok di UI langsung ter-update otomatis.

---

### 🔄 4. Otomatisasi Closing & Carry-Over (Auto-Closing System)
- **Backend (BE)**:
  - [ ] **Closing Service & Atomic Carry-Over**: Buat service `closing.service.ts` yang dalam 1 transaksi Prisma:
    1. Mengubah status `monthly_inventories` aktif menjadi `CLOSED`.
    2. Menghitung total revenue, total capital, dan net profit, lalu menyimpan ke `monthly_closings`.
    3. Mengambil sisa `current_stock` dan meng-insert baris baru di `monthly_inventories` periode `YYYY-MM` berikutnya.
  - [ ] **Supabase Edge Function (`monthly-closing`)**: Tulis fungsi Deno/TypeScript untuk mengeksekusi logika closing dan memicu pengiriman email.
  - [ ] **Supabase pg_cron Setup**: Buat SQL script cron job di Supabase untuk memanggil Edge Function otomatis setiap tanggal terakhir bulan pukul 23:59 WIB.
- **Frontend (FE)**:
  - [ ] **Halaman Rekap Closing**: Tampilkan riwayat *closing* bulanan terdahulu.
  - [ ] **Modal Konfirmasi Closing**: Buat modal khusus `OWNER` yang menampilkan preview angka kalkulasi (omzet, modal, laba) sebelum tombol "Eksekusi Closing" ditekan.

---

### ✉️ 5. Notifikasi Email (SMTP Integration)
- **Backend (BE)**:
  - [ ] **SMTP Mailer Module**: Konfigurasi Nodemailer/Resend di `lib/mailer.ts`.
  - [ ] **Template Email Laporan**: Buat HTML email template untuk ringkasan laporan keuangan bulanan.
  - [ ] **Email Alert Low Stock**: Buat fungsi untuk mengecek stok di bawah threshold (misal < 3 unit) dan mengirim email peringatan ke Owner.
- **Frontend (FE)**:
  - [ ] **UI Status Email & Trigger Test**: Sediakan tombol/indikator di halaman settings/closing untuk mengirim ulang email laporan secara manual jika diperlukan.

---

### 📊 6. Dashboard & Pelaporan
- **Backend (BE)**:
  - [ ] **Dashboard Metrics Procedure**: Buat tRPC query `dashboard.getSummary` untuk mengambil total omzet, total modal, laba bersih, dan total item terjual bulan ini.
  - [ ] **Chart Data Aggregator Procedure**: Buat query untuk mengelompokkan tren omzet & laba bersih per bulan.
  - [ ] **Export Data Generator**: Buat handler API untuk merender data transaksi/closing ke format CSV/Excel (menggunakan `xlsx` atau `papaparse`).
- **Frontend (FE)**:
  - [ ] **Metric Cards Widget**: Tampilkan 4 kartu ringkasan KPI di halaman utama dashboard.
  - [ ] **Chart Component**: Integrasikan Chart.js / Recharts untuk visualisasi grafik tren performa bisnis.
  - [ ] **Fitur Download / Export UI**: Buat tombol export laporan transaksi & closing dengan pilihan format CSV / Excel / PDF.