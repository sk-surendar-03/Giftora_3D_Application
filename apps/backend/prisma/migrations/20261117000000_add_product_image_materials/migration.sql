-- AlterTable
ALTER TABLE `products`
  ADD COLUMN `imageMaterials` JSON NULL AFTER `shippingMethods`;
