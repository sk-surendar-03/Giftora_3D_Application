ALTER TABLE `products`
  ADD COLUMN `materialOptions` JSON NULL,
  ADD COLUMN `sizeOptions` JSON NULL,
  ADD COLUMN `shippingMethods` JSON NULL;
