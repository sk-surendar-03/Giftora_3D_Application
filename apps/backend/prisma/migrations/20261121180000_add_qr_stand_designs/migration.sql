-- 1. Alter cart_items: add qrStandDesignId column and widen itemType enum
ALTER TABLE `cart_items` 
    ADD COLUMN `qrStandDesignId` VARCHAR(191) NULL,
    MODIFY `itemType` ENUM('PRODUCT', 'CUSTOM_DESIGN', 'STAND_DESIGN', 'NAMEPLATE_DESIGN', 'QR_STAND_DESIGN') NOT NULL DEFAULT 'PRODUCT';

-- 2. Alter order_items: add qrStandDesignId column and widen itemType enum
ALTER TABLE `order_items` 
    ADD COLUMN `qrStandDesignId` VARCHAR(191) NULL,
    MODIFY `itemType` ENUM('PRODUCT', 'CUSTOM_DESIGN', 'STAND_DESIGN', 'NAMEPLATE_DESIGN', 'QR_STAND_DESIGN') NOT NULL DEFAULT 'PRODUCT';

-- 3. Create qr_stand_designs table
CREATE TABLE `qr_stand_designs` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `schemaVersion` INTEGER NOT NULL DEFAULT 1,
    `title` VARCHAR(191) NOT NULL,
    `qrType` VARCHAR(40) NOT NULL,
    `qrPayload` TEXT NOT NULL,
    `qrVersion` INTEGER NOT NULL,
    `errorCorrection` VARCHAR(5) NOT NULL,
    `templateId` VARCHAR(50) NOT NULL,
    `printMode` VARCHAR(20) NOT NULL,
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

    UNIQUE INDEX `qr_stand_designs_stlKey_key`(`stlKey`),
    INDEX `qr_stand_designs_userId_idx`(`userId`),
    INDEX `qr_stand_designs_status_idx`(`status`),
    UNIQUE INDEX `qr_stand_designs_userId_paramsHash_key`(`userId`, `paramsHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 4. Create performance indexes for relational lookups
CREATE INDEX `cart_items_qrStandDesignId_idx` ON `cart_items`(`qrStandDesignId`);
CREATE INDEX `order_items_qrStandDesignId_idx` ON `order_items`(`qrStandDesignId`);

-- 5. Add foreign keys with RESTRICT on delete (protects historical orders & users)
ALTER TABLE `qr_stand_designs` 
    ADD CONSTRAINT `qr_stand_designs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `cart_items` 
    ADD CONSTRAINT `cart_items_qrStandDesignId_fkey` FOREIGN KEY (`qrStandDesignId`) REFERENCES `qr_stand_designs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `order_items` 
    ADD CONSTRAINT `order_items_qrStandDesignId_fkey` FOREIGN KEY (`qrStandDesignId`) REFERENCES `qr_stand_designs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
