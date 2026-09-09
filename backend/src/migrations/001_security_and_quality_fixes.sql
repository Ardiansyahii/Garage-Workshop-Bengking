-- ==========================================
-- MIGRATION: Security & Quality Fixes
-- Branch: fix/backend-security-and-quality
-- ==========================================

-- 1. Tambah UNIQUE constraint ke users.whatsapp
-- (Cek dulu apakah constraint sudah ada)
SET @exists = (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND CONSTRAINT_TYPE = 'UNIQUE'
    AND CONSTRAINT_NAME = 'uk_users_whatsapp'
);

SET @sql = IF(@exists = 0,
  'ALTER TABLE users ADD CONSTRAINT uk_users_whatsapp UNIQUE (whatsapp)',
  'SELECT "UNIQUE constraint already exists" as info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Tambah UNIQUE constraint ke schedules(bengkel_id, day_name)
SET @exists2 = (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'schedules'
    AND CONSTRAINT_TYPE = 'UNIQUE'
    AND CONSTRAINT_NAME = 'uk_schedules_bengkel_day'
);

SET @sql2 = IF(@exists2 = 0,
  'ALTER TABLE schedules ADD CONSTRAINT uk_schedules_bengkel_day UNIQUE (bengkel_id, day_name)',
  'SELECT "UNIQUE constraint already exists" as info'
);
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- 3. Tambah indexes untuk performa query
CREATE INDEX IF NOT EXISTS idx_users_whatsapp ON users(whatsapp);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_role_bengkel ON users(role, bengkel_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_services_bengkel_id ON services(bengkel_id);
CREATE INDEX IF NOT EXISTS idx_schedules_bengkel_id ON schedules(bengkel_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_bengkel_id ON bookings(bengkel_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date_time ON bookings(booking_date, booking_time);
CREATE INDEX IF NOT EXISTS idx_bookings_code ON bookings(booking_code);
CREATE INDEX IF NOT EXISTS idx_mitra_requests_status ON mitra_requests(status);
CREATE INDEX IF NOT EXISTS idx_mitra_requests_whatsapp_status ON mitra_requests(whatsapp, status);

-- 4. Tambah ENUM constraint ke bookings.status (opsional, gunakan CHECK constraint)
-- MySQL 8.0.16+ supports CHECK constraints
SET @mysql_version = (SELECT VERSION());
SET @check_exists = (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings'
    AND CONSTRAINT_TYPE = 'CHECK'
);

-- 5. Pastikan bookings.status ENUM via CHECK constraint
-- (Hanya jalankan jika MySQL >= 8.0.16 dan constraint belum ada)
-- SET @sql3 = IF(@check_exists = 0 AND @mysql_version >= '8.0.16',
--   'ALTER TABLE bookings ADD CONSTRAINT chk_bookings_status CHECK (status IN ('Menunggu', 'Diproses', 'Selesai', 'Batal'))',
--   'SELECT "CHECK constraint skipped" as info'
-- );
-- PREPARE stmt3 FROM @sql3;
-- EXECUTE stmt3;
-- DEALLOCATE PREPARE stmt3;

-- 6. Tambah foreign key constraints
SET @fk_exists = (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    AND CONSTRAINT_NAME = 'fk_bookings_user'
);

SET @sql_fk = IF(@fk_exists = 0,
  'ALTER TABLE bookings ADD CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE',
  'SELECT "FK constraint already exists" as info'
);
PREPARE stmt_fk FROM @sql_fk;
EXECUTE stmt_fk;
DEALLOCATE PREPARE stmt_fk;

SET @fk_exists2 = (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    AND CONSTRAINT_NAME = 'fk_bookings_bengkel'
);

SET @sql_fk2 = IF(@fk_exists2 = 0,
  'ALTER TABLE bookings ADD CONSTRAINT fk_bookings_bengkel FOREIGN KEY (bengkel_id) REFERENCES bengkels(id) ON DELETE CASCADE',
  'SELECT "FK constraint already exists" as info'
);
PREPARE stmt_fk2 FROM @sql_fk2;
EXECUTE stmt_fk2;
DEALLOCATE PREPARE stmt_fk2;

SET @fk_exists3 = (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    AND CONSTRAINT_NAME = 'fk_bookings_vehicle'
);

SET @sql_fk3 = IF(@fk_exists3 = 0,
  'ALTER TABLE bookings ADD CONSTRAINT fk_bookings_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE',
  'SELECT "FK constraint already exists" as info'
);
PREPARE stmt_fk3 FROM @sql_fk3;
EXECUTE stmt_fk3;
DEALLOCATE PREPARE stmt_fk3;

SET @fk_exists4 = (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    AND CONSTRAINT_NAME = 'fk_bookings_service'
);

SET @sql_fk4 = IF(@fk_exists4 = 0,
  'ALTER TABLE bookings ADD CONSTRAINT fk_bookings_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE',
  'SELECT "FK constraint already exists" as info'
);
PREPARE stmt_fk4 FROM @sql_fk4;
EXECUTE stmt_fk4;
DEALLOCATE PREPARE stmt_fk4;

SET @fk_exists5 = (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'vehicles'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    AND CONSTRAINT_NAME = 'fk_vehicles_user'
);

SET @sql_fk5 = IF(@fk_exists5 = 0,
  'ALTER TABLE vehicles ADD CONSTRAINT fk_vehicles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE',
  'SELECT "FK constraint already exists" as info'
);
PREPARE stmt_fk5 FROM @sql_fk5;
EXECUTE stmt_fk5;
DEALLOCATE PREPARE stmt_fk5;

SET @fk_exists6 = (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'services'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    AND CONSTRAINT_NAME = 'fk_services_bengkel'
);

SET @sql_fk6 = IF(@fk_exists6 = 0,
  'ALTER TABLE services ADD CONSTRAINT fk_services_bengkel FOREIGN KEY (bengkel_id) REFERENCES bengkels(id) ON DELETE CASCADE',
  'SELECT "FK constraint already exists" as info'
);
PREPARE stmt_fk6 FROM @sql_fk6;
EXECUTE stmt_fk6;
DEALLOCATE PREPARE stmt_fk6;

SET @fk_exists7 = (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'schedules'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    AND CONSTRAINT_NAME = 'fk_schedules_bengkel'
);

SET @sql_fk7 = IF(@fk_exists7 = 0,
  'ALTER TABLE schedules ADD CONSTRAINT fk_schedules_bengkel FOREIGN KEY (bengkel_id) REFERENCES bengkels(id) ON DELETE CASCADE',
  'SELECT "FK constraint already exists" as info'
);
PREPARE stmt_fk7 FROM @sql_fk7;
EXECUTE stmt_fk7;
DEALLOCATE PREPARE stmt_fk7;

SET @fk_exists8 = (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    AND CONSTRAINT_NAME = 'fk_users_bengkel'
);

SET @sql_fk8 = IF(@fk_exists8 = 0,
  'ALTER TABLE users ADD CONSTRAINT fk_users_bengkel FOREIGN KEY (bengkel_id) REFERENCES bengkels(id) ON DELETE SET NULL',
  'SELECT "FK constraint already exists" as info'
);
PREPARE stmt_fk8 FROM @sql_fk8;
EXECUTE stmt_fk8;
DEALLOCATE PREPARE stmt_fk8;

-- Migration selesai
SELECT 'Migration 001_security_and_quality_fixes applied successfully!' as result;
