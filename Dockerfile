# ==========================================
# STAGE 1: Build Image (Menggunakan Node.js & pnpm)
# ==========================================
FROM node:20-alpine AS builder

# Memasang pnpm secara global
RUN npm install -g pnpm

# Menentukan direktori kerja
WORKDIR /app

# 1. Optimasi Cache: Salin file manifest terlebih dahulu
# Ini mencegah install ulang library jika hanya kode source yang berubah
COPY package.json pnpm-lock.yaml ./

# 2. Install dependencies dengan mode frozen (pastikan versi lockfile sama)
RUN pnpm install --frozen-lockfile

# 3. Salin seluruh source code
COPY . .

# 4. Build aplikasi (Vite akan membaca file .env.production secara otomatis)
RUN pnpm build


# ==========================================
# STAGE 2: Production Image (Menggunakan Nginx)
# ==========================================
FROM nginx:stable-alpine

# Hapus konfigurasi default Nginx agar tidak bentrok
RUN rm /etc/nginx/conf.d/default.conf

# 5. Salin file konfigurasi Nginx khusus dari folder proyek Anda
# Pastikan jalur 'docker/nginx/default.conf' benar di laptop Anda
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

# 6. Salin hasil build dari stage builder ke folder publik Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# 7. Berikan izin akses (Permissions) agar file bisa dibaca Nginx
# Ini langkah krusial untuk mencegah error 403 Forbidden
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Ekspos port 80
EXPOSE 80

# Jalankan Nginx
CMD ["nginx", "-g", "daemon off;"]