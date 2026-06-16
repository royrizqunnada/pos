#!/usr/bin/env bash
#
# Script deploy Ploi untuk Berkah Jaya POS — pos.digisolve.id
# Salin isi file ini ke kolom "Deploy Script" pada site Ploi,
# atau panggil langsung: `bash deploy.sh`.
#
# Target  : https://pos.digisolve.id
# PHP     : 8.4
# Database: PostgreSQL (terpisah dari project lain)

set -euo pipefail

SITE_DIR="/home/ploi/pos.digisolve.id"
PHP_BIN="php8.4"
BRANCH="main"

cd "$SITE_DIR"

echo "▶ Menarik perubahan terbaru dari origin/${BRANCH}…"
git pull origin "$BRANCH"

echo "▶ Memasang dependency PHP (produksi)…"
composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist

echo "▶ Build aset frontend…"
npm ci
npm run build

# Aktifkan maintenance mode hanya selama migrasi & cache (downtime minimal).
echo "▶ Maintenance mode ON…"
$PHP_BIN artisan down --render="errors::503" --retry=15 || true

echo "▶ Menjalankan migrasi…"
$PHP_BIN artisan migrate --force

# --- HANYA SAAT DEPLOY PERTAMA ---
# Jalankan seeder sekali saja untuk mengisi data contoh (profil toko, akun,
# kategori, satuan, barang, dsb). Setelah deploy pertama, biarkan tetap nonaktif.
# Buka komentar baris di bawah pada deploy pertama:
# $PHP_BIN artisan db:seed --force

echo "▶ Optimasi cache (config, route, view, event)…"
$PHP_BIN artisan optimize:clear
$PHP_BIN artisan config:cache
$PHP_BIN artisan route:cache
$PHP_BIN artisan view:cache
$PHP_BIN artisan event:cache

echo "▶ Memastikan symlink storage…"
$PHP_BIN artisan storage:link || true

echo "▶ Maintenance mode OFF…"
$PHP_BIN artisan up

# Restart worker queue (abaikan bila belum dikonfigurasi di Ploi).
$PHP_BIN artisan queue:restart || true

# Reload PHP-FPM agar opcache memuat kode baru (pola standar Ploi).
( flock -w 10 9 || exit 1
    echo "▶ Reload PHP-FPM…"
    sudo -S service "${PHP_BIN}-fpm" reload ) 9>/tmp/fpmlock-pos || true

echo "✓ Deploy selesai — https://pos.digisolve.id"
