# BengkelKu

Sistem booking bengkel berbasis web yang terdiri dari frontend Next.js dan backend Express.js. Project ini dirancang untuk memudahkan pelanggan melakukan reservasi servis kendaraan, sementara mitra bengkel dan admin dapat mengelola jadwal, layanan, serta booking secara terstruktur.

## Fitur Utama

- Autentikasi pengguna (login/register)
- Reservasi service kendaraan
- Daftar bengkel dan layanan yang tersedia
- Manajemen jadwal dan booking
- Dashboard untuk user, admin bengkel, dan superadmin
- Registrasi mitra bengkel
- Verifikasi akun dan status booking
- Laporan dan monitoring operasional bengkel

## Tech Stack

- Frontend: Next.js 16, React 19, Tailwind CSS
- Backend: Node.js, Express.js
- Database: MySQL
- Authentication: JWT + bcrypt
- UI tambahan: Framer Motion, SweetAlert2, Recharts, Lucide React

## Struktur Project

```bash
website-bengkel/
├── backend/
│   ├── src/
│   ├── package.json
│   └── .env
├── bengkel-app/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── next.config.mjs
│   └── .env.local
├── README.md
└── LICENSE (jika ada)
```

## Persyaratan

Sebelum menjalankan project, pastikan sudah install:

- Node.js v18+
- npm
- MySQL (via Laragon/XAMPP/MAMP/MySQL Server)
- Git

## 1. Setup Database

1. Jalankan MySQL di Laragon/XAMPP.
2. Buat database baru dengan nama:

```sql
CREATE DATABASE bengkel_db;
```

3. Import file SQL yang ada di folder:

```bash
bengkel-app/src/bengkel_db.sql
```

4. Pastikan konfigurasi database di backend sesuai dengan environment lokal Anda.

## 2. Setup Backend

Masuk ke folder backend lalu install dependency:

```bash
cd backend
npm install
```

Buat file `.env` di dalam folder `backend` dengan isi berikut:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=bengkel_db
JWT_SECRET=your_secret_key_here
```

Jalankan backend:

```bash
npm run dev
```

Jika berhasil, server akan berjalan di:

```bash
http://localhost:5000
```

## 3. Setup Frontend

Masuk ke folder frontend:

```bash
cd bengkel-app
npm install
```

Buat file `.env.local` di dalam folder `bengkel-app`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Jalankan frontend:

```bash
npm run dev
```

Akses aplikasi di:

```bash
http://localhost:3000
```

## 4. Login & Akses Aplikasi

Setelah server aktif, Anda bisa masuk ke aplikasi melalui halaman login/register. Role yang tersedia biasanya meliputi:

- User / pelanggan
- Admin bengkel
- Superadmin
- Mitra bengkel

## 5. Endpoint API Utama

Backend tersedia di URL:

```bash
http://localhost:5000/api
```

Beberapa route utama:

- `/api/auth`
- `/api/bengkels`
- `/api/services`
- `/api/bookings`
- `/api/vehicles`
- `/api/users`
- `/api/register-mitra`
- `/api/admin-bengkel`
- `/api/schedules`
- `/api/profile`

## 6. Perintah Penting

### Backend

```bash
npm run dev
npm run start
```

### Frontend

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## 7. Catatan Pengembangan

- Pastikan `NEXT_PUBLIC_API_URL` sesuai dengan URL backend yang sedang berjalan.
- Jika terjadi error koneksi database, cek kembali `DB_HOST`, `DB_USER`, `DB_PASSWORD`, dan `DB_NAME`.
- Untuk development lokal, gunakan MySQL di Laragon agar lebih stabil dan mudah diatur.

## 8. Kontribusi

Project ini dapat dikembangkan lebih lanjut dengan menambahkan:

- notifikasi WhatsApp/Fonnte
- dashboard analytics
- export laporan PDF
- integrasi payment gateway
- mobile friendly optimization

## 9. Lisensi

Project ini dibuat untuk kebutuhan pembelajaran dan pengembangan aplikasi booking bengkel. Sesuaikan lisensi jika project akan dipublikasikan atau dikembangkan bersama tim.

---

Jika Anda mau, saya juga bisa bantu membuat versi README yang lebih formal, lebih modern, atau versi yang siap ditaruh di GitHub dengan badge, screenshot, dan struktur yang lebih rapi.
