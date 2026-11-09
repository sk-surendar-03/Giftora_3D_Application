-- AlterTable
ALTER TABLE `products` ADD COLUMN `shippingCents` INTEGER NOT NULL DEFAULT 0 AFTER `originalPriceCents`;
