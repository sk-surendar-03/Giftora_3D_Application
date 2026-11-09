-- AlterTable: optional STL/3MF preview model per product (additive, nullable).
ALTER TABLE `products`
  ADD COLUMN `modelKey` VARCHAR(255) NULL,
  ADD COLUMN `modelFilename` VARCHAR(255) NULL,
  ADD COLUMN `modelFormat` VARCHAR(10) NULL,
  ADD COLUMN `modelSizeBytes` INTEGER NULL;
