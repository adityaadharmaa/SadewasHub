# ==========================================
# STAGE 1: Build Image (Menggunakan Node.js & pnpm)
# ==========================================
FROM node:20-alpine AS builder

# Install pnpm secara global
RUN npm install -g pnpm

# Set direktori kerja di dalam container
WORKDIR /app

# Salin file dependencies terlebih dahulu (untuk optimasi cache Docker)
COPY package.json pnpm-lock.yaml ./

# Install semua package menggunakan pnpm
RUN pnpm install --frozen-lockfile

# Salin seluruh sisa source code frontend Anda
COPY . .

# Eksekusi build Vite (Hasilnya akan muncul di folder /app/dist)
RUN pnpm build


# ==========================================
# STAGE 2: Production Image (Menggunakan Nginx)
# ==========================================
FROM nginx:alpine

# Salin file konfigurasi Nginx khusus React Router yang kita buat tadi
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Pindahkan hasil build dari STAGE 1 ke dalam folder publik Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Ekspos port 80 di dalam container
EXPOSE 80

# Jalankan Nginx agar terus menyala di latar belakang
CMD ["nginx", "-g", "daemon off;"]