-- ==========================================
-- BENGKEL_DB - COMPLETE CLEAN SCHEMA
-- Jalankan di MySQL Workbench:
--   1. Buka MySQL Workbench
--   2. Koneksi ke localhost (root)
--   3. File > Open SQL Script > pilih file ini
--   4. Klik Lightning icon (Execute) atau Ctrl+Shift+Enter
-- ==========================================

-- ==========================================
-- 0. RESET DATABASE
-- ==========================================
DROP DATABASE IF EXISTS bengkel_db;
CREATE DATABASE bengkel_db;
USE bengkel_db;

-- ==========================================
-- 1. TABEL BENGKELS
-- ==========================================
CREATE TABLE bengkels (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 2. TABEL USERS
-- ==========================================
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bengkel_id INT NULL,
  name VARCHAR(100) NOT NULL,
  whatsapp VARCHAR(20) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('superadmin', 'admin_bengkel', 'pelanggan') DEFAULT 'pelanggan',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uk_users_whatsapp UNIQUE (whatsapp),
  CONSTRAINT fk_users_bengkel FOREIGN KEY (bengkel_id) REFERENCES bengkels(id) ON DELETE SET NULL
);

-- ==========================================
-- 3. TABEL VEHICLES
-- ==========================================
CREATE TABLE vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  vehicle_name VARCHAR(100) NOT NULL,
  license_plate VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_vehicles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==========================================
-- 4. TABEL SERVICES
-- ==========================================
CREATE TABLE services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bengkel_id INT NOT NULL,
  service_name VARCHAR(100) NOT NULL,
  price VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_services_bengkel FOREIGN KEY (bengkel_id) REFERENCES bengkels(id) ON DELETE CASCADE
);

-- ==========================================
-- 5. TABEL BOOKINGS
-- ==========================================
CREATE TABLE bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  bengkel_id INT NOT NULL,
  vehicle_id INT NOT NULL,
  service_id INT NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  booking_code VARCHAR(20) NOT NULL,
  status ENUM('Menunggu', 'Diproses', 'Selesai', 'Batal') DEFAULT 'Menunggu',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_bookings_bengkel FOREIGN KEY (bengkel_id) REFERENCES bengkels(id) ON DELETE CASCADE,
  CONSTRAINT fk_bookings_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  CONSTRAINT fk_bookings_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

-- ==========================================
-- 6. TABEL SCHEDULES
-- ==========================================
CREATE TABLE schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bengkel_id INT NOT NULL,
  day_name VARCHAR(20) NOT NULL,
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  is_closed TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uk_schedules_bengkel_day UNIQUE (bengkel_id, day_name),
  CONSTRAINT fk_schedules_bengkel FOREIGN KEY (bengkel_id) REFERENCES bengkels(id) ON DELETE CASCADE
);

-- ==========================================
-- 7. TABEL MITRA_REQUESTS
-- ==========================================
CREATE TABLE mitra_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_name VARCHAR(100) NOT NULL,
  whatsapp VARCHAR(20) NOT NULL,
  password VARCHAR(255) NOT NULL,
  bengkel_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 8. INDEXES (Percepat Query)
-- ==========================================
CREATE INDEX idx_users_whatsapp ON users(whatsapp);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_role_bengkel ON users(role, bengkel_id);
CREATE INDEX idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX idx_services_bengkel_id ON services(bengkel_id);
CREATE INDEX idx_schedules_bengkel_id ON schedules(bengkel_id);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_bengkel_id ON bookings(bengkel_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_date_time ON bookings(booking_date, booking_time);
CREATE INDEX idx_bookings_code ON bookings(booking_code);
CREATE INDEX idx_mitra_requests_status ON mitra_requests(status);
CREATE INDEX idx_mitra_requests_whatsapp_status ON mitra_requests(whatsapp, status);

-- ==========================================
-- 9. DATA DUMMY
-- ==========================================

-- Superadmin (password: Admin123!)
INSERT INTO users (name, whatsapp, password, role) VALUES 
('Super Administrator', '000000', '$2b$10$Nkf8CpaukmAnu/h09q/pPufR7GhGZv2Vp5V2BdAMplmeZ0eSEqp5e', 'superadmin');

-- Bengkel
INSERT INTO bengkels (id, name, address, phone) VALUES 
(50, 'Bengkel Motor Maju Jaya', 'Jl. Jenderal Sudirman No. 12, Jakarta', '081234567890'),
(51, 'Auto Mobil Sentosa', 'Jl. Gatot Subroto No. 88, Bandung', '089876543210');

-- Admin Bengkel (password: Admin123!)
INSERT INTO users (id, name, whatsapp, password, role, bengkel_id) VALUES 
(50, 'Budi (Admin Maju Jaya)', '08111111111', '$2b$10$Nkf8CpaukmAnu/h09q/pPufR7GhGZv2Vp5V2BdAMplmeZ0eSEqp5e', 'admin_bengkel', 50),
(51, 'Siti (Admin Sentosa)', '08222222222', '$2b$10$Nkf8CpaukmAnu/h09q/pPufR7GhGZv2Vp5V2BdAMplmeZ0eSEqp5e', 'admin_bengkel', 51);

-- Pelanggan (password: Admin123!)
INSERT INTO users (id, name, whatsapp, password, role, bengkel_id) VALUES 
(52, 'Andi Setiawan', '08333333333', '$2b$10$Nkf8CpaukmAnu/h09q/pPufR7GhGZv2Vp5V2BdAMplmeZ0eSEqp5e', 'pelanggan', NULL),
(53, 'Rina Melati', '08444444444', '$2b$10$Nkf8CpaukmAnu/h09q/pPufR7GhGZv2Vp5V2BdAMplmeZ0eSEqp5e', 'pelanggan', NULL);

-- Layanan
INSERT INTO services (bengkel_id, service_name, price, description) VALUES 
(50, 'Servis Rutin (Ganti Oli)', 'Rp 50.000', 'Ganti oli mesin dan pengecekan standar'),
(50, 'Servis CVT Matic', 'Rp 85.000', 'Pembersihan ruang CVT dan grease'),
(51, 'Tune Up Mobil', 'Rp 250.000', 'Pengecekan busi, filter, dan injektor'),
(51, 'Spooring & Balancing', 'Rp 150.000', 'Penyelarasan ban roda 4');

-- Kendaraan
INSERT INTO vehicles (user_id, vehicle_name, license_plate) VALUES 
(52, 'Yamaha NMAX 2022', 'B 1234 XYZ'),
(52, 'Honda Vario 150', 'B 9876 ABC'),
(53, 'Toyota Avanza G', 'D 4567 DEF');

-- Jadwal
INSERT INTO schedules (bengkel_id, day_name, open_time, close_time, is_closed) VALUES 
(50, 'Senin', '08:00:00', '17:00:00', 0),
(50, 'Selasa', '08:00:00', '17:00:00', 0),
(50, 'Sabtu', '08:00:00', '15:00:00', 0),
(50, 'Minggu', '00:00:00', '00:00:00', 1),
(51, 'Senin', '09:00:00', '18:00:00', 0),
(51, 'Selasa', '09:00:00', '18:00:00', 0);

-- Booking
INSERT INTO bookings (user_id, bengkel_id, vehicle_id, service_id, booking_date, booking_time, booking_code, status) VALUES 
(52, 50, 1, 1, '2026-07-30', '09:00:00', 'APEX-TEST0001', 'Menunggu'),
(53, 51, 3, 3, '2026-07-31', '13:00:00', 'APEX-TEST0002', 'Diproses'),
(52, 50, 1, 2, '2026-07-28', '10:00:00', 'APEX-TEST0003', 'Selesai'),
(53, 50, 3, 1, '2026-07-29', '11:00:00', 'APEX-TEST0004', 'Batal');

-- ==========================================
-- 10. VERIFIKASI
-- ==========================================
SHOW TABLES;
SELECT '=== Database bengkel_db berhasil dibuat! ===' as hasil;
