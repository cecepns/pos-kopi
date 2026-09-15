-- =========================================================================
-- MIGRATION: Add Rider Stock Allocation, Reject Items, and Stock Movements
-- Project: POS Kopi & Rider Management
-- Date: 2026-09-15
-- =========================================================================

USE `pos_coffee`;

-- 1. Tabel rider_stocks: Mencatat alokasi stok awal dagang, penjualan, reject, dan sisa per rider per tanggal
CREATE TABLE IF NOT EXISTS `rider_stocks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `rider_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `stock_date` DATE NOT NULL,
  `allocated_qty` INT NOT NULL DEFAULT 0 COMMENT 'Stok awal dagang yang digeser dari HO',
  `sold_qty` INT NOT NULL DEFAULT 0 COMMENT 'Jumlah cup terjual',
  `reject_qty` INT NOT NULL DEFAULT 0 COMMENT 'Jumlah cup yang digeser jadi reject',
  `returned_qty` INT NOT NULL DEFAULT 0 COMMENT 'Jumlah cup sisa yang dikembalikan ke HO',
  `notes` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_rider_product_date` (`rider_id`, `product_id`, `stock_date`),
  INDEX `idx_rider_stock_date` (`stock_date`),
  INDEX `idx_rider_stock_rider` (`rider_id`),
  INDEX `idx_rider_stock_product` (`product_id`),
  CONSTRAINT `fk_rider_stocks_rider` FOREIGN KEY (`rider_id`) REFERENCES `riders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rider_stocks_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabel rejected_stocks: Mencatat rincian barang reject (rusak, bocor, tumpah, basi) dari rider atau HO
CREATE TABLE IF NOT EXISTS `rejected_stocks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `rider_id` INT NULL COMMENT 'NULL jika barang reject berasal dari gudang HO',
  `product_id` INT NOT NULL,
  `reject_date` DATE NOT NULL,
  `qty` INT NOT NULL DEFAULT 1,
  `reason` ENUM('bocor', 'tumpah', 'basi', 'rusak', 'lainnya') NOT NULL DEFAULT 'bocor',
  `notes` TEXT NULL,
  `created_by` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_reject_date` (`reject_date`),
  INDEX `idx_reject_rider` (`rider_id`),
  INDEX `idx_reject_product` (`product_id`),
  CONSTRAINT `fk_rejected_stocks_rider` FOREIGN KEY (`rider_id`) REFERENCES `riders` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_rejected_stocks_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rejected_stocks_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabel stock_movements: Log audit jejak mutasi perpindahan stok
CREATE TABLE IF NOT EXISTS `stock_movements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `product_id` INT NOT NULL,
  `rider_id` INT NULL COMMENT 'Terkait rider jika pergeseran ke/dari rider',
  `movement_type` ENUM('in_ho', 'transfer_to_rider', 'return_to_ho', 'reject') NOT NULL,
  `qty` INT NOT NULL,
  `notes` VARCHAR(255) NULL,
  `created_by` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_mov_product` (`product_id`),
  INDEX `idx_mov_rider` (`rider_id`),
  INDEX `idx_mov_type` (`movement_type`),
  INDEX `idx_mov_date` (`created_at`),
  CONSTRAINT `fk_mov_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_mov_rider` FOREIGN KEY (`rider_id`) REFERENCES `riders` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_mov_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
