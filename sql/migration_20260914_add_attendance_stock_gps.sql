-- =========================================================================
-- MIGRATION: Add Attendance, Stock HO, and Live GPS Tracking
-- Project: POS Kopi & Rider Management
-- Date: 2026-09-14
-- =========================================================================

USE `pos_coffee`;

-- 1. Tambah kolom stok HO pada tabel products jika belum ada
ALTER TABLE `products` 
ADD COLUMN IF NOT EXISTS `stock_ho` INT NOT NULL DEFAULT 100 AFTER `cost_price`,
ADD COLUMN IF NOT EXISTS `min_stock` INT NOT NULL DEFAULT 10 AFTER `stock_ho`;

-- 2. Tambah kolom koordinat dan status duty pada tabel riders jika belum ada
ALTER TABLE `riders` 
ADD COLUMN IF NOT EXISTS `current_lat` DECIMAL(10, 8) NULL AFTER `notes`,
ADD COLUMN IF NOT EXISTS `current_lng` DECIMAL(11, 8) NULL AFTER `current_lat`,
ADD COLUMN IF NOT EXISTS `last_location_time` TIMESTAMP NULL AFTER `current_lng`,
ADD COLUMN IF NOT EXISTS `is_duty` TINYINT(1) NOT NULL DEFAULT 0 AFTER `last_location_time`;

-- 3. Tabel baru: attendances (Presensi Rider dengan foto selfie & titik GPS)
CREATE TABLE IF NOT EXISTS `attendances` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `rider_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `attendance_date` DATE NOT NULL,
  `clock_in` TIME NULL,
  `clock_in_lat` DECIMAL(10, 8) NULL,
  `clock_in_lng` DECIMAL(11, 8) NULL,
  `clock_in_photo` VARCHAR(255) NULL,
  `clock_in_notes` VARCHAR(255) NULL,
  `clock_out` TIME NULL,
  `clock_out_lat` DECIMAL(10, 8) NULL,
  `clock_out_lng` DECIMAL(11, 8) NULL,
  `clock_out_photo` VARCHAR(255) NULL,
  `clock_out_notes` VARCHAR(255) NULL,
  `status` ENUM('present', 'late', 'permission', 'sick') NOT NULL DEFAULT 'present',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_rider_date` (`rider_id`, `attendance_date`),
  INDEX `idx_attendance_date` (`attendance_date`),
  INDEX `idx_attendance_rider` (`rider_id`),
  CONSTRAINT `fk_attendance_rider` FOREIGN KEY (`rider_id`) REFERENCES `riders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_attendance_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabel log riwayat pergerakan rider (Breadcrumbs Tracking)
CREATE TABLE IF NOT EXISTS `rider_location_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `rider_id` INT NOT NULL,
  `lat` DECIMAL(10, 8) NOT NULL,
  `lng` DECIMAL(11, 8) NOT NULL,
  `recorded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_rider_loc_time` (`rider_id`, `recorded_at`),
  CONSTRAINT `fk_loc_rider` FOREIGN KEY (`rider_id`) REFERENCES `riders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
