<<<<<<< HEAD
# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
=======
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
http://localhost:4000
```

## 3. Setup Frontend

Masuk ke folder frontend:

```bash
cd bengkel-app
npm install
```

Buat file `.env.local` di dalam folder `bengkel-app`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
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

Setelah server aktif, Anda bisa masuk ke aplikasi melalui halaman login/register. Role yang tersedia meliputi:

- User / pelanggan
- Admin bengkel
- Superadmin

## 5. Endpoint API Utama

Backend tersedia di URL:

```bash
http://localhost:4000/api
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

Project ini akan dikembangkan lebih lanjut dengan menambahkan:

- notifikasi WhatsApp/Fonnte
- dashboard analytics
- export laporan PDF
- mobile friendly optimization

---
>>>>>>> 565db41a64c15c0843e78d35700cd021461eb35b
