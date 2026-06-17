# Berkah Jaya — Point of Sale Toko Bangunan

Sistem Point of Sale (POS) untuk toko bahan bangunan / material **Berkah Jaya**.
Dibangun dengan **Laravel 13 + Inertia 2 + React 19 + TypeScript + Tailwind 4 (shadcn/ui)**
dan database **PostgreSQL**. Seluruh antarmuka berbahasa Indonesia, mata uang Rupiah (tanpa desimal).

## Fitur Utama

- **Dashboard** — KPI omzet & transaksi hari ini, total piutang, stok menipis, grafik omzet 7 hari, barang terlaris, transaksi terbaru (laba hanya untuk pemilik).
- **Kasir / POS** — pencarian barang, filter kategori, input barcode, keranjang dengan kontrol qty (dibatasi stok), harga grosir otomatis, pembayaran tunai/utang, struk cetak thermal (58/80 mm).
- **Barang & Stok** — CRUD barang, satuan beragam (sak, batang, m³, kg, dst), stok & qty pecahan, badge "Menipis", tambah stok cepat, penyesuaian stok (kartu stok / `stock_movements`).
- **Pelanggan & Utang** — CRUD pelanggan, saldo utang berjalan, pembayaran utang + riwayat.
- **Pemasok & Pembelian** — CRUD pemasok, form pembelian yang menambah stok & memperbarui harga modal.
- **Laporan** — filter rentang tanggal: rekap penjualan, laba kotor (pemilik), penjualan per kategori, barang terlaris, piutang, nilai persediaan; ekspor CSV.
- **Pengaturan** — profil toko (header/footer struk), manajemen akun (tambah/nonaktifkan/reset sandi), & **log aktivitas** (jejak audit: login/logout, penjualan, pembatalan, perubahan barang/stok, pembelian, pelanggan, pembayaran utang, dan perubahan pengaturan — dengan pengguna, waktu, dan alamat IP; bisa difilter).

## Peran & Hak Akses

| Peran | Akses |
| ----- | ----- |
| **Pemilik** | Akses penuh: barang (termasuk harga modal), pemasok, pembelian, akun pengguna, profil toko, semua laporan termasuk laba. |
| **Kasir** | Transaksi penjualan, lihat stok, tambah/edit pelanggan, catat pembayaran utang. Tidak melihat harga modal / laba, tidak mengelola user, pemasok, pembelian, atau menghapus data master. |

Otorisasi memakai Laravel Gate/Policy; menu yang tidak relevan disembunyikan di sisi React sesuai peran.

## Kebutuhan Sistem

- PHP 8.3+ (diuji pada 8.4), Composer 2
- Node.js 22 + npm
- PostgreSQL 14+

> Catatan versi: framework dipin ke `~13.15.0`. Rilis `laravel/framework v13.16.0`
> memiliki regresi yang membuat seluruh perintah `artisan` gagal di konsol
> (registrasi `DevCommands` dari vendor) — terbukti juga pada skeleton L13 baru.
> Naikkan ke `^13.16.1` begitu perbaikan upstream tersedia.

## Setup Lokal

```bash
git clone https://github.com/royrizqunnada/pos.git
cd pos

composer install
npm install

cp .env.example .env
php artisan key:generate
```

Atur kredensial PostgreSQL di `.env`:

```dotenv
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=pos
DB_USERNAME=pos
DB_PASSWORD=pos
```

Jalankan migrasi + data contoh, lalu build aset:

```bash
php artisan migrate --seed
npm run build      # atau `npm run dev` saat pengembangan
php artisan serve
```

### Akun Demo (dari seeder)

| Peran | Email | Kata Sandi |
| ----- | ----- | ---------- |
| Pemilik | `pemilik@berkahjaya.test` | `password` |
| Kasir | `kasir@berkahjaya.test` | `password` |

Seeder mengisi profil toko, 8 kategori, 11 satuan, 24 barang material, 5 pemasok,
6 pelanggan, dan ~37 transaksi penjualan contoh tersebar 10 hari terakhir.

## Pengujian & Kualitas Kode

```bash
php artisan test          # feature test (logika bisnis inti)
vendor/bin/pint           # format PHP
npm run build             # pastikan aset terbangun
```

Test berjalan di SQLite in-memory; aplikasi produksi memakai PostgreSQL.

## Arsitektur

- Logika yang mengubah stok/uang dibungkus `DB::transaction` di dalam *service*:
  `StockService`, `SaleService`, `PurchaseService`, `ReportService`.
- Uang disimpan sebagai `bigInteger` rupiah utuh; stok & qty sebagai `decimal(12,2)`.
- Snapshot nama/satuan/harga disimpan pada `sale_items` agar struk lama tetap akurat.

## Deploy (Ploi)

Target: subdomain `pos.digisolve.id`, PHP 8.4, database PostgreSQL terpisah.

Script deploy lengkap tersedia di [`deploy.sh`](deploy.sh) — salin isinya ke kolom
**Deploy Script** pada site Ploi, atau panggil `bash deploy.sh` dari root site.
Script menangani: `git pull`, `composer install --no-dev`, `npm ci && build`,
maintenance mode, `migrate --force`, cache config/route/view/event, `storage:link`,
`queue:restart`, dan reload PHP-FPM.

### Langkah satu kali sebelum deploy pertama

1. **Buat database PostgreSQL** khusus untuk site ini di Ploi, lalu isi `.env` produksi:

   ```dotenv
   APP_NAME="Berkah Jaya"
   APP_ENV=production
   APP_DEBUG=false
   APP_URL=https://pos.digisolve.id

   DB_CONNECTION=pgsql
   DB_HOST=127.0.0.1
   DB_PORT=5432
   DB_DATABASE=pos_digisolve
   DB_USERNAME=__user__
   DB_PASSWORD=__password__
   ```

2. **Generate app key** (sekali): `php artisan key:generate`.
3. **Aktifkan seeder pada deploy pertama** — buka komentar baris
   `php artisan db:seed --force` di `deploy.sh`, jalankan deploy, lalu
   komentari kembali agar deploy berikutnya tidak menimpa data.

> Catatan: `.env` tidak ikut di-commit (di-`.gitignore`). Isi melalui editor
> environment di panel Ploi.
