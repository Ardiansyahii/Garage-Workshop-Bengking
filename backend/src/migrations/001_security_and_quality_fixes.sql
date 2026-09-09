-- ==========================================
-- MIGRATION: Security & Quality Fixes
-- Branch: fix/backend-security-and-quality
-- ==========================================

-- Helper procedure to safely add index if not exists
DELIMITER //

CREATE PROCEDURE IF NOT EXISTS safe_add_index(
  IN p_table_name VARCHAR(64),
  IN p_index_name VARCHAR(64),
  IN p_columns VARCHAR(255)
)
BEGIN
  DECLARE idx_count INT DEFAULT 0;
  SELECT COUNT(*) INTO idx_count
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = p_table_name
    AND INDEX_NAME = p_index_name;
  IF idx_count = 0 THEN
    SET @sql = CONCAT('CREATE INDEX ', p_index_name, ' ON ', p_table_name, '(', p_columns, ')');
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END //

DELIMITER ;

-- 1. UNIQUE constraint: users.whatsapp
SET @uk_exists = (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND CONSTRAINT_TYPE = 'UNIQUE'
    AND CONSTRAINT_NAME = 'uk_users_whatsapp'
);
SET @sql_uk = IF(@uk_exists = 0,
  'ALTER TABLE users ADD CONSTRAINT uk_users_whatsapp UNIQUE (whatsapp)',
  'SELECT 1'
);
PREPARE stmt_uk FROM @sql_uk;
EXECUTE stmt_uk;
DEALLOCATE PREPARE stmt_uk;

-- 2. UNIQUE constraint: schedules(bengkel_id, day_name)
SET @uk2_exists = (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'schedules'
    AND CONSTRAINT_TYPE = 'UNIQUE'
    AND CONSTRAINT_NAME = 'uk_schedules_bengkel_day'
);
SET @sql_uk2 = IF(@uk2_exists = 0,
  'ALTER TABLE schedules ADD CONSTRAINT uk_schedules_bengkel_day UNIQUE (bengkel_id, day_name)',
  'SELECT 1'
);
PREPARE stmt_uk2 FROM @sql_uk2;
EXECUTE stmt_uk2;
DEALLOCATE PREPARE stmt_uk2;

-- 3. Tambah indexes untuk performa query
CALL safe_add_index('users', 'idx_users_whatsapp', 'whatsapp');
CALL safe_add_index('users', 'idx_users_role', 'role');
CALL safe_add_index('users', 'idx_users_role_bengkel', 'role, bengkel_id');
CALL safe_add_index('vehicles', 'idx_vehicles_user_id', 'user_id');
CALL safe_add_index('services', 'idx_services_bengkel_id', 'bengkel_id');
CALL safe_add_index('schedules', 'idx_schedules_bengkel_id', 'bengkel_id');
CALL safe_add_index('bookings', 'idx_bookings_user_id', 'user_id');
CALL safe_add_index('bookings', 'idx_bookings_bengkel_id', 'bengkel_id');
CALL safe_add_index('bookings', 'idx_bookings_status', 'status');
CALL safe_add_index('bookings', 'idx_bookings_date_time', 'booking_date, booking_time');
CALL safe_add_index('bookings', 'idx_bookings_code', 'booking_code');
CALL safe_add_index('mitra_requests', 'idx_mitra_requests_status', 'status');
CALL safe_add_index('mitra_requests', 'idx_mitra_requests_whatsapp_status', 'whatsapp, status');

-- 4. Foreign key: bookings.user_id -> users.id
SET @fk1 = (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    AND CONSTRAINT_NAME = 'fk_bookings_user'
);
SET @sql_fk1 = IF(@fk1 = 0,
  'ALTER TABLE bookings ADD CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE',
  'SELECT 1'
);
PREPARE stmt_fk1 FROM @sql_fk1;
EXECUTE stmt_fk1;
DEALLOCATE PREPARE stmt_fk1;

-- 5. Foreign key: bookings.bengkel_id -> bengkels.id
SET @fk2 = (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    AND CONSTRAINT_NAME = 'fk_bookings_bengkel'
);
SET @sql_fk2 = IF(@fk2 = 0,
  'ALTER TABLE bookings ADD CONSTRAINT fk_bookings_bengkel FOREIGN KEY (bengkel_id) REFERENCES bengkels(id) ON DELETE CASCADE',
  'SELECT 1'
);
PREPARE stmt_fk2 FROM @sql_fk2;
EXECUTE stmt_fk2;
DEALLOCATE PREPARE stmt_fk2;

-- 6. Foreign key: bookings.vehicle_id -> vehicles.id
SET @fk3 = (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    AND CONSTRAINT_NAME = 'fk_bookings_vehicle'
);
SET @sql_fk3 = IF(@fk3 = 0,
  'ALTER TABLE bookings ADD CONSTRAINT fk_bookings_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE',
  'SELECT 1'
);
PREPARE stmt_fk3 FROM @sql_fk3;
EXECUTE stmt_fk3;
DEALLOCATE PREPARE stmt_fk3;

-- 7. Foreign key: bookings.service_id -> services.id
SET @fk4 = (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    AND CONSTRAINT_NAME = 'fk_bookings_service'
);
SET @sql_fk4 = IF(@fk4 = 0,
  'ALTER TABLE bookings ADD CONSTRAINT fk_bookings_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE',
  'SELECT 1'
);
PREPARE stmt_fk4 FROM @sql_fk4;
EXECUTE stmt_fk4;
DEALLOCATE PREPARE stmt_fk4;

-- 8. Foreign key: vehicles.user_id -> users.id
SET @fk5 = (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'vehicles'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    AND CONSTRAINT_NAME = 'fk_vehicles_user'
);
SET @sql_fk5 = IF(@fk5 = 0,
  'ALTER TABLE vehicles ADD CONSTRAINT fk_vehicles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE',
  'SELECT 1'
);
PREPARE stmt_fk5 FROM @sql_fk5;
EXECUTE stmt_fk5;
DEALLOCATE PREPARE stmt_fk5;

-- 9. Foreign key: services.bengkel_id -> bengkels.id
SET @fk6 = (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'services'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    AND CONSTRAINT_NAME = 'fk_services_bengkel'
);
SET @sql_fk6 = IF(@fk6 = 0,
  'ALTER TABLE services ADD CONSTRAINT fk_services_bengkel FOREIGN KEY (bengkel_id) REFERENCES bengkels(id) ON DELETE CASCADE',
  'SELECT 1'
);
PREPARE stmt_fk6 FROM @sql_fk6;
EXECUTE stmt_fk6;
DEALLOCATE PREPARE stmt_fk6;

-- 10. Foreign key: schedules.bengkel_id -> bengkels.id
SET @fk7 = (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'schedules'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    AND CONSTRAINT_NAME = 'fk_schedules_bengkel'
);
SET @sql_fk7 = IF(@fk7 = 0,
  'ALTER TABLE schedules ADD CONSTRAINT fk_schedules_bengkel FOREIGN KEY (bengkel_id) REFERENCES bengkels(id) ON DELETE CASCADE',
  'SELECT 1'
);
PREPARE stmt_fk7 FROM @sql_fk7;
EXECUTE stmt_fk7;
DEALLOCATE PREPARE stmt_fk7;

-- 11. Foreign key: users.bengkel_id -> bengkels.id
SET @fk8 = (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    AND CONSTRAINT_NAME = 'fk_users_bengkel'
);
SET @sql_fk8 = IF(@fk8 = 0,
  'ALTER TABLE users ADD CONSTRAINT fk_users_bengkel FOREIGN KEY (bengkel_id) REFERENCES bengkels(id) ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE stmt_fk8 FROM @sql_fk8;
EXECUTE stmt_fk8;
DEALLOCATE PREPARE stmt_fk8;

-- Cleanup: drop helper procedure
DROP PROCEDURE IF EXISTS safe_add_index;

-- Migration selesai
SELECT 'Migration 001_security_and_quality_fixes applied successfully!' as result;
