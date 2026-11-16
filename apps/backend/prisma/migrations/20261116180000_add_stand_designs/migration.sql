-- Stand customiser schema.
--
-- This migration captures work that previously existed only in the local
-- database (applied with `prisma db push`), so a fresh database built with
-- `prisma migrate deploy` has everything the stand feature needs.
--
-- Generated with `prisma migrate diff` against a database built from the
-- migrations that came before this one, plus the hand-maintained
-- item-reference CHECK constraints (Prisma does not manage CHECKs).

-- AlterTable
ALTER TABLE `cart_items` ADD COLUMN `standDesignId` VARCHAR(191) NULL,
    MODIFY `itemType` ENUM('PRODUCT', 'CUSTOM_DESIGN', 'STAND_DESIGN') NOT NULL DEFAULT 'PRODUCT';

-- AlterTable
ALTER TABLE `contact_inquiries` MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'NEW';

-- AlterTable
ALTER TABLE `order_items` ADD COLUMN `standDesignId` VARCHAR(191) NULL,
    MODIFY `itemType` ENUM('PRODUCT', 'CUSTOM_DESIGN', 'STAND_DESIGN') NOT NULL DEFAULT 'PRODUCT';

-- AlterTable
ALTER TABLE `orders` ADD COLUMN `customerNote` TEXT NULL;

-- AlterTable
ALTER TABLE `products` ADD COLUMN `imageMaterials` JSON NULL;

-- CreateTable
CREATE TABLE `stand_designs` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `schemaVersion` INTEGER NOT NULL DEFAULT 1,
    `title` VARCHAR(191) NOT NULL,
    `category` VARCHAR(40) NOT NULL,
    `designConfig` JSON NOT NULL,
    `paramsHash` VARCHAR(191) NOT NULL,
    `unitPriceCents` INTEGER NOT NULL,
    `solidVolumeCm3` DOUBLE NULL,
    `status` ENUM('PENDING', 'READY') NOT NULL DEFAULT 'PENDING',
    `stlKey` VARCHAR(191) NULL,
    `stlSha256` VARCHAR(191) NULL,
    `stlSizeBytes` INTEGER NULL,
    `triangleCount` INTEGER NULL,
    `bboxMm` JSON NULL,
    `previewKey` VARCHAR(191) NULL,
    `previewSizeBytes` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `stand_designs_stlKey_key`(`stlKey`),
    INDEX `stand_designs_userId_idx`(`userId`),
    INDEX `stand_designs_status_idx`(`status`),
    UNIQUE INDEX `stand_designs_userId_paramsHash_key`(`userId`, `paramsHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `cart_items_standDesignId_idx` ON `cart_items`(`standDesignId`);

-- CreateIndex
CREATE INDEX `order_items_standDesignId_idx` ON `order_items`(`standDesignId`);

-- AddForeignKey
ALTER TABLE `stand_designs` ADD CONSTRAINT `stand_designs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cart_items` ADD CONSTRAINT `cart_items_standDesignId_fkey` FOREIGN KEY (`standDesignId`) REFERENCES `stand_designs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_standDesignId_fkey` FOREIGN KEY (`standDesignId`) REFERENCES `stand_designs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Widened item-reference CHECK constraints so a line can be a stand design.
-- These were added by 20261106000000_add_custom_designs and only allow
-- PRODUCT or CUSTOM_DESIGN; without this, every STAND_DESIGN insert fails.
-- NOTE: MariaDB 10.4 does not support `DROP CHECK`; `DROP CONSTRAINT` is required.
ALTER TABLE `cart_items` DROP CONSTRAINT `cart_items_item_ref_chk`;
ALTER TABLE `cart_items` ADD CONSTRAINT `cart_items_item_ref_chk` CHECK (
    (`itemType` = 'PRODUCT' AND `productId` IS NOT NULL AND `customDesignId` IS NULL AND `standDesignId` IS NULL) OR
    (`itemType` = 'CUSTOM_DESIGN' AND `customDesignId` IS NOT NULL AND `productId` IS NULL AND `standDesignId` IS NULL) OR
    (`itemType` = 'STAND_DESIGN' AND `standDesignId` IS NOT NULL AND `productId` IS NULL AND `customDesignId` IS NULL)
);

ALTER TABLE `order_items` DROP CONSTRAINT `order_items_item_ref_chk`;
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_item_ref_chk` CHECK (
    (`itemType` = 'PRODUCT' AND `productId` IS NOT NULL AND `customDesignId` IS NULL AND `standDesignId` IS NULL) OR
    (`itemType` = 'CUSTOM_DESIGN' AND `customDesignId` IS NOT NULL AND `productId` IS NULL AND `standDesignId` IS NULL) OR
    (`itemType` = 'STAND_DESIGN' AND `standDesignId` IS NOT NULL AND `productId` IS NULL AND `customDesignId` IS NULL)
);
