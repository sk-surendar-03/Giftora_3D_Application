-- AlterTable
ALTER TABLE `orders`
  ADD COLUMN `shippingCarrier` VARCHAR(191) NULL AFTER `status`,
  ADD COLUMN `trackingNumber` VARCHAR(191) NULL AFTER `shippingCarrier`,
  ADD COLUMN `trackingUrl` TEXT NULL AFTER `trackingNumber`;
