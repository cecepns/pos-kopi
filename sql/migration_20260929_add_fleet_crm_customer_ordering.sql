-- =========================================================================
-- MIGRATION: Armada (Fleet), Location Analytics, CRM & Customer On-Demand
-- Project: POS Kopi & Rider Management
-- Date: 2026-09-29
-- =========================================================================

USE `pos_coffee`;

-- 1. Tabel carts (Master Gerobak / Sepeda / Kendaraan Armada)
CREATE TABLE IF NOT EXISTS `carts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `cart_code` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `cart_type` ENUM('sepeda_listrik', 'gerobak_motor', 'gerobak_dorong', 'motor_box') NOT NULL DEFAULT 'sepeda_listrik',
  `current_rider_id` INT NULL,
  `condition_status` ENUM('good', 'fair', 'needs_repair', 'broken') NOT NULL DEFAULT 'good',
  `status` ENUM('active', 'in_use', 'maintenance', 'inactive') NOT NULL DEFAULT 'active',
  `notes` TEXT NULL,
  `last_service_date` DATE NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_carts_rider` (`current_rider_id`),
  INDEX `idx_carts_status` (`status`),
  CONSTRAINT `fk_carts_rider` FOREIGN KEY (`current_rider_id`) REFERENCES `riders` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabel cart_checklists (Checklist Sebelum / Sesudah Jualan)
CREATE TABLE IF NOT EXISTS `cart_checklists` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `cart_id` INT NOT NULL,
  `rider_id` INT NOT NULL,
  `checklist_date` DATE NOT NULL,
  `checklist_type` ENUM('pre_sales', 'post_sales') NOT NULL,
  `tire_condition` ENUM('good', 'bad') NOT NULL DEFAULT 'good',
  `brakes_chain_condition` ENUM('good', 'bad') NOT NULL DEFAULT 'good',
  `box_ice_cleanliness` ENUM('clean', 'dirty') NOT NULL DEFAULT 'clean',
  `cup_sealer_ready` ENUM('ready', 'not_ready') NOT NULL DEFAULT 'ready',
  `general_cleanliness` ENUM('clean', 'dirty') NOT NULL DEFAULT 'clean',
  `notes` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_checklists_cart` (`cart_id`),
  INDEX `idx_checklists_rider` (`rider_id`),
  INDEX `idx_checklists_date` (`checklist_date`),
  CONSTRAINT `fk_chk_cart` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_chk_rider` FOREIGN KEY (`rider_id`) REFERENCES `riders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabel cart_damage_reports (Laporan Kerusakan Armada & Biaya Servis)
CREATE TABLE IF NOT EXISTS `cart_damage_reports` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `cart_id` INT NOT NULL,
  `rider_id` INT NULL,
  `reported_by` INT NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `description` TEXT NOT NULL,
  `severity` ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
  `photo` VARCHAR(255) NULL,
  `status` ENUM('reported', 'in_repair', 'repaired', 'cancelled') NOT NULL DEFAULT 'reported',
  `repair_cost` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `repaired_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_dmg_cart` (`cart_id`),
  INDEX `idx_dmg_status` (`status`),
  CONSTRAINT `fk_dmg_cart` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dmg_rider` FOREIGN KEY (`rider_id`) REFERENCES `riders` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_dmg_user` FOREIGN KEY (`reported_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabel customers (Master Pelanggan CRM)
CREATE TABLE IF NOT EXISTS `customers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NULL,
  `name` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(30) NOT NULL UNIQUE,
  `email` VARCHAR(100) NULL,
  `loyalty_points` INT NOT NULL DEFAULT 0,
  `total_spend` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `total_orders` INT NOT NULL DEFAULT 0,
  `last_order_date` DATE NULL,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_customers_phone` (`phone`),
  INDEX `idx_customers_status` (`status`),
  CONSTRAINT `fk_cust_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Tabel vouchers (Manajemen Kode Promo & Diskon)
CREATE TABLE IF NOT EXISTS `vouchers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `title` VARCHAR(150) NOT NULL,
  `discount_type` ENUM('percent', 'fixed') NOT NULL DEFAULT 'percent',
  `discount_value` DECIMAL(12, 2) NOT NULL DEFAULT 10.00,
  `min_order_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `max_discount` DECIMAL(12, 2) NULL,
  `quota` INT NOT NULL DEFAULT 100,
  `used_count` INT NOT NULL DEFAULT 0,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_vouchers_code` (`code`),
  INDEX `idx_vouchers_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Tabel promos (Program Promo & Banner Pemasaran)
CREATE TABLE IF NOT EXISTS `promos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(150) NOT NULL,
  `description` TEXT NULL,
  `banner_image` VARCHAR(255) NULL,
  `discount_percent` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Tabel rider_ratings (Penilaian & Ulasan dari Customer untuk Rider)
CREATE TABLE IF NOT EXISTS `rider_ratings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `rider_id` INT NOT NULL,
  `customer_id` INT NULL,
  `sale_id` INT NULL,
  `rating` INT NOT NULL DEFAULT 5,
  `review` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_ratings_rider` (`rider_id`),
  CONSTRAINT `fk_rat_rider` FOREIGN KEY (`rider_id`) REFERENCES `riders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Tabel customer_favorite_riders (Penyimpanan Rider Favorit Customer)
CREATE TABLE IF NOT EXISTS `customer_favorite_riders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `customer_id` INT NOT NULL,
  `rider_id` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_cust_fav` (`customer_id`, `rider_id`),
  CONSTRAINT `fk_fav_cust` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_fav_rider` FOREIGN KEY (`rider_id`) REFERENCES `riders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Tabel refill_requests (Permintaan Refill Stok dari Rider ke HO/Kasir)
CREATE TABLE IF NOT EXISTS `refill_requests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `rider_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `qty` INT NOT NULL DEFAULT 10,
  `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  `notes` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` TIMESTAMP NULL,
  INDEX `idx_refill_status` (`status`),
  CONSTRAINT `fk_refill_rider` FOREIGN KEY (`rider_id`) REFERENCES `riders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_refill_prod` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Modifikasi Kolom Pelengkap pada Tabel sales & riders
ALTER TABLE `sales`
ADD COLUMN IF NOT EXISTS `customer_id` INT NULL AFTER `rider_id`,
ADD COLUMN IF NOT EXISTS `voucher_id` INT NULL AFTER `customer_id`,
ADD COLUMN IF NOT EXISTS `discount_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 AFTER `voucher_id`,
ADD COLUMN IF NOT EXISTS `order_status` ENUM('pending', 'accepted', 'brewing', 'ready', 'completed', 'cancelled') NOT NULL DEFAULT 'completed' AFTER `status`,
ADD COLUMN IF NOT EXISTS `location_name` VARCHAR(150) NULL AFTER `order_status`,
ADD COLUMN IF NOT EXISTS `customer_lat` DECIMAL(10, 8) NULL AFTER `location_name`,
ADD COLUMN IF NOT EXISTS `customer_lng` DECIMAL(11, 8) NULL AFTER `customer_lat`;

ALTER TABLE `riders`
ADD COLUMN IF NOT EXISTS `cart_id` INT NULL AFTER `has_app_access`,
ADD COLUMN IF NOT EXISTS `average_rating` DECIMAL(3, 2) NOT NULL DEFAULT 5.00 AFTER `is_duty`,
ADD COLUMN IF NOT EXISTS `total_reviews` INT NOT NULL DEFAULT 0 AFTER `average_rating`;
