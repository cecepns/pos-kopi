-- Database Schema: Coffee POS & Rider Management System
-- Compatible with MySQL 5.7 / 8.0+

CREATE DATABASE IF NOT EXISTS `pos_coffee` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `pos_coffee`;

-- 1. Table: users
DROP TABLE IF EXISTS `sale_items`;
DROP TABLE IF EXISTS `sales`;
DROP TABLE IF EXISTS `rider_targets`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `riders`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `store_settings`;

CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('owner', 'admin', 'rider') NOT NULL DEFAULT 'admin',
  `phone` VARCHAR(25) NULL,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Table: riders
CREATE TABLE `riders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NULL,
  `code` VARCHAR(30) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(25) NULL,
  `has_app_access` TINYINT(1) NOT NULL DEFAULT 0,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `joined_at` DATE NOT NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_riders_status` (`status`),
  INDEX `idx_riders_code` (`code`),
  CONSTRAINT `fk_riders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Table: categories
CREATE TABLE `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(120) NOT NULL UNIQUE,
  `icon` VARCHAR(50) NULL,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Table: products
CREATE TABLE `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `category_id` INT NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `sku` VARCHAR(50) NOT NULL UNIQUE,
  `price` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `cost_price` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `image` VARCHAR(255) NULL,
  `unit` VARCHAR(20) NOT NULL DEFAULT 'cup',
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_products_category` (`category_id`),
  INDEX `idx_products_status` (`status`),
  CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Table: sales
CREATE TABLE `sales` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sale_number` VARCHAR(50) NOT NULL UNIQUE,
  `rider_id` INT NULL,
  `sales_channel` ENUM('counter', 'rider', 'manual') NOT NULL DEFAULT 'counter',
  `input_source` ENUM('admin', 'operator', 'rider') NOT NULL DEFAULT 'admin',
  `created_by` INT NOT NULL,
  `sale_date` DATE NOT NULL,
  `total_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `paid_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `change_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `payment_method` ENUM('cash', 'qris', 'transfer') NOT NULL DEFAULT 'cash',
  `status` ENUM('completed', 'cancelled') NOT NULL DEFAULT 'completed',
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_sales_date` (`sale_date`),
  INDEX `idx_sales_rider` (`rider_id`),
  INDEX `idx_sales_channel` (`sales_channel`),
  INDEX `idx_sales_created_by` (`created_by`),
  CONSTRAINT `fk_sales_rider` FOREIGN KEY (`rider_id`) REFERENCES `riders` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_sales_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Table: sale_items (Snapshot product details to protect historical data)
CREATE TABLE `sale_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sale_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `product_name` VARCHAR(150) NOT NULL,
  `price` DECIMAL(12, 2) NOT NULL,
  `cost_price` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `qty` INT NOT NULL DEFAULT 1,
  `subtotal` DECIMAL(12, 2) NOT NULL,
  INDEX `idx_sale_items_sale` (`sale_id`),
  INDEX `idx_sale_items_product` (`product_id`),
  CONSTRAINT `fk_sale_items_sale` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sale_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Table: rider_targets
CREATE TABLE `rider_targets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `rider_id` INT NOT NULL,
  `period_month` VARCHAR(7) NOT NULL, -- Format YYYY-MM e.g. 2026-09
  `target_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `target_qty` INT NOT NULL DEFAULT 0,
  `notes` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_rider_period` (`rider_id`, `period_month`),
  CONSTRAINT `fk_targets_rider` FOREIGN KEY (`rider_id`) REFERENCES `riders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Table: store_settings
CREATE TABLE `store_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `store_name` VARCHAR(100) NOT NULL DEFAULT 'Kopi Keliling Nusantara',
  `tagline` VARCHAR(150) NOT NULL DEFAULT 'Sensasi Kopi Segar Setiap Hari',
  `address` TEXT NULL,
  `phone` VARCHAR(30) NULL DEFAULT '0819-1119-0207',
  `receipt_footer` TEXT NULL,
  `tax_percentage` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================================
-- SEED DATA
-- Default Passwords: password123 (bcrypt hash: $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi)
-- =========================================================================

-- Insert Store Settings
INSERT INTO `store_settings` (`id`, `store_name`, `tagline`, `address`, `phone`, `receipt_footer`, `tax_percentage`)
VALUES (1, 'Kopi Keliling & POS Store', 'Cita Rasa Kopi Nusantara', 'Jl. Merdeka No. 45, Jakarta Selatan', '0819-1119-0207', 'Terima kasih atas kunjungan Anda! Follow IG: @kopinusantara', 0.00);

-- Insert Users (Password: password123)
INSERT INTO `users` (`id`, `name`, `username`, `password`, `role`, `phone`, `status`) VALUES
(1, 'Owner Kedai', 'owner', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'owner', '081234567890', 'active'),
(2, 'Admin Kasir Siti', 'admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', '081298765432', 'active'),
(3, 'Rider Budi (HP)', 'riderbudi', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'rider', '085712345678', 'active');

-- Insert Riders (Termasuk rider tanpa HP yang diinput manual oleh Admin)
INSERT INTO `riders` (`id`, `user_id`, `code`, `name`, `phone`, `has_app_access`, `status`, `joined_at`, `notes`) VALUES
(1, NULL, 'RDR-001', 'Rider Ahmad (Tanpa HP)', NULL, 0, 'active', '2026-08-01', 'Keliling area perkantoran Sudirman. Tidak memiliki HP, transaksi dicatat fisik & disetor tiap sore.'),
(2, 3, 'RDR-002', 'Rider Budi Santoso', '085712345678', 1, 'active', '2026-08-10', 'Keliling area Tebet & Kuningan. Memiliki akses HP untuk input mandiri.'),
(3, NULL, 'RDR-003', 'Rider Cecep Supriadi', NULL, 0, 'active', '2026-08-15', 'Keliling area Senayan & GBK. Catatan fisik manual disetor harian ke kasir.'),
(4, NULL, 'RDR-004', 'Rider Dedi Kusnadi', '087811223344', 0, 'active', '2026-09-01', 'Keliling area Kemang. Tidak login aplikasi, input via kasir.');

-- Insert Categories
INSERT INTO `categories` (`id`, `name`, `slug`, `icon`, `status`) VALUES
(1, 'Espresso Based', 'espresso-based', 'Coffee', 'active'),
(2, 'Kopi Susu Spesial', 'kopi-susu-spesial', 'CupSoda', 'active'),
(3, 'Non Coffee', 'non-coffee', 'Milk', 'active'),
(4, 'Tea & Refreshment', 'tea-refreshment', 'Leaf', 'active'),
(5, 'Snack & Pastry', 'snack-pastry', 'Cookie', 'active');

-- Insert Products
INSERT INTO `products` (`id`, `category_id`, `name`, `sku`, `price`, `cost_price`, `image`, `unit`, `status`) VALUES
(1, 2, 'Kopi Susu Gula Aren', 'PROD-KS-001', 18000.00, 8000.00, '/uploads/kopi-susu-aren.jpg', 'cup', 'active'),
(2, 2, 'Kopi Susu Pandan', 'PROD-KS-002', 20000.00, 9000.00, '/uploads/kopi-susu-pandan.jpg', 'cup', 'active'),
(3, 1, 'Americano Dingin', 'PROD-ESP-001', 15000.00, 5000.00, '/uploads/americano.jpg', 'cup', 'active'),
(4, 1, 'Caffe Latte', 'PROD-ESP-002', 22000.00, 9500.00, '/uploads/caffe-latte.jpg', 'cup', 'active'),
(5, 1, 'Caramel Macchiato', 'PROD-ESP-003', 25000.00, 11000.00, '/uploads/macchiato.jpg', 'cup', 'active'),
(6, 3, 'Signature Matcha Latte', 'PROD-NC-001', 22000.00, 9000.00, '/uploads/matcha-latte.jpg', 'cup', 'active'),
(7, 3, 'Dark Chocolate Creamy', 'PROD-NC-002', 22000.00, 9000.00, '/uploads/chocolate.jpg', 'cup', 'active'),
(8, 4, 'Lemon Tea Segar', 'PROD-TEA-001', 14000.00, 4000.00, '/uploads/lemon-tea.jpg', 'cup', 'active'),
(9, 4, 'Earl Grey Milk Tea', 'PROD-TEA-002', 18000.00, 7000.00, '/uploads/earl-grey.jpg', 'cup', 'active'),
(10, 5, 'Croissant Butter', 'PROD-SNK-001', 18000.00, 10000.00, '/uploads/croissant.jpg', 'pcs', 'active'),
(11, 5, 'Donat Kampung Coklat Keju', 'PROD-SNK-002', 12000.00, 5000.00, '/uploads/donat.jpg', 'pcs', 'active');

-- Insert Rider Targets for current month (September 2026)
INSERT INTO `rider_targets` (`rider_id`, `period_month`, `target_amount`, `target_qty`, `notes`) VALUES
(1, '2026-09', 10000000.00, 550, 'Target bulanan Rider Ahmad'),
(2, '2026-09', 12000000.00, 650, 'Target bulanan Rider Budi'),
(3, '2026-09', 9000000.00, 500, 'Target bulanan Rider Cecep'),
(4, '2026-09', 8000000.00, 450, 'Target bulanan Rider Dedi');

-- Insert Sample Sales
-- 1. Counter POS direct walk-in sale
INSERT INTO `sales` (`id`, `sale_number`, `rider_id`, `sales_channel`, `input_source`, `created_by`, `sale_date`, `total_amount`, `paid_amount`, `change_amount`, `payment_method`, `status`, `notes`)
VALUES (1, 'INV-20260913-0001', NULL, 'counter', 'operator', 2, '2026-09-13', 40000.00, 50000.00, 10000.00, 'cash', 'completed', 'Order counter kasir dine-in');

INSERT INTO `sale_items` (`sale_id`, `product_id`, `product_name`, `price`, `cost_price`, `qty`, `subtotal`) VALUES
(1, 1, 'Kopi Susu Gula Aren', 18000.00, 8000.00, 1, 18000.00),
(1, 4, 'Caffe Latte', 22000.00, 9500.00, 1, 22000.00);

-- 2. Rider Ahmad (Tanpa HP) - Diinput manual oleh Admin Siti berdasarkan catatan fisik
INSERT INTO `sales` (`id`, `sale_number`, `rider_id`, `sales_channel`, `input_source`, `created_by`, `sale_date`, `total_amount`, `paid_amount`, `change_amount`, `payment_method`, `status`, `notes`)
VALUES (2, 'INV-20260913-0002', 1, 'rider', 'admin', 2, '2026-09-13', 360000.00, 360000.00, 0.00, 'cash', 'completed', 'Rekap penjualan keliling Rider Ahmad hari Minggu siang');

INSERT INTO `sale_items` (`sale_id`, `product_id`, `product_name`, `price`, `cost_price`, `qty`, `subtotal`) VALUES
(2, 1, 'Kopi Susu Gula Aren', 18000.00, 8000.00, 12, 216000.00),
(2, 3, 'Americano Dingin', 15000.00, 5000.00, 6, 90000.00),
(2, 8, 'Lemon Tea Segar', 14000.00, 4000.00, 3, 42000.00),
(2, 11, 'Donat Kampung Coklat Keju', 12000.00, 5000.00, 1, 12000.00);

-- 3. Rider Budi Santoso (Punya HP) - Input via HP
INSERT INTO `sales` (`id`, `sale_number`, `rider_id`, `sales_channel`, `input_source`, `created_by`, `sale_date`, `total_amount`, `paid_amount`, `change_amount`, `payment_method`, `status`, `notes`)
VALUES (3, 'INV-20260913-0003', 2, 'rider', 'rider', 3, '2026-09-13', 198000.00, 200000.00, 2000.00, 'qris', 'completed', 'Order batch pelanggan kantor Kuningan');

INSERT INTO `sale_items` (`sale_id`, `product_id`, `product_name`, `price`, `cost_price`, `qty`, `subtotal`) VALUES
(3, 1, 'Kopi Susu Gula Aren', 18000.00, 8000.00, 6, 108000.00),
(3, 2, 'Kopi Susu Pandan', 20000.00, 9000.00, 3, 60000.00),
(3, 3, 'Americano Dingin', 15000.00, 5000.00, 2, 30000.00);

-- 4. Rider Cecep (Tanpa HP) - Diinput manual oleh Admin Siti untuk penjualan kemarin (2026-09-12)
INSERT INTO `sales` (`id`, `sale_number`, `rider_id`, `sales_channel`, `input_source`, `created_by`, `sale_date`, `total_amount`, `paid_amount`, `change_amount`, `payment_method`, `status`, `notes`)
VALUES (4, 'INV-20260912-0004', 3, 'manual', 'admin', 2, '2026-09-12', 288000.00, 300000.00, 12000.00, 'cash', 'completed', 'Input susulan catatan fisik Rider Cecep dari shift Sabtu');

INSERT INTO `sale_items` (`sale_id`, `product_id`, `product_name`, `price`, `cost_price`, `qty`, `subtotal`) VALUES
(4, 1, 'Kopi Susu Gula Aren', 18000.00, 8000.00, 10, 180000.00),
(4, 6, 'Signature Matcha Latte', 22000.00, 9000.00, 3, 66000.00),
(4, 8, 'Lemon Tea Segar', 14000.00, 4000.00, 3, 42000.00);
