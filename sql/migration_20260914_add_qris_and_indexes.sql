-- =========================================================================
-- MIGRATION: Add QRIS Support & Multi-Role Rider Isolation Indexes
-- Project: POS Kopi & Rider Management
-- Date: 2026-09-14
-- =========================================================================

USE `pos_coffee`;

-- 1. Tambah kolom qris_image pada tabel store_settings untuk upload barcode QRIS
ALTER TABLE `store_settings` 
ADD COLUMN IF NOT EXISTS `qris_image` VARCHAR(255) NULL AFTER `tax_percentage`;

-- 2. Pastikan Index performa pada tabel sales untuk isolasi transaksi per rider & tanggal
ALTER TABLE `sales` 
ADD INDEX IF NOT EXISTS `idx_sales_rider_date` (`rider_id`, `sale_date`);

-- 3. Pastikan Index relasi user rider
ALTER TABLE `riders` 
ADD INDEX IF NOT EXISTS `idx_riders_user_id` (`user_id`);
