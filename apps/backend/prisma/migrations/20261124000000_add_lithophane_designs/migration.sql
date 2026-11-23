-- 1. Alter cart_items: add lithophaneDesignId column and widen itemType enum
ALTER TABLE `cart_items` 
    ADD COLUMN `lithophaneDesignId` VARCHAR(191) NULL,
    MODIFY `itemType` ENUM('PRODUCT', 'CUSTOM_DESIGN', 'STAND_DESIGN', 'NAMEPLATE_DESIGN', 'QR_STAND_DESIGN', 'LITHOPHANE_DESIGN') NOT NULL DEFAULT 'PRODUCT';

-- 2. Alter order_items: add lithophaneDesignId column and widen itemType enum
ALTER TABLE `order_items` 
    ADD COLUMN `lithophaneDesignId` VARCHAR(191) NULL,
    MODIFY `itemType` ENUM('PRODUCT', 'CUSTOM_DESIGN', 'STAND_DESIGN', 'NAMEPLATE_DESIGN', 'QR_STAND_DESIGN', 'LITHOPHANE_DESIGN') NOT NULL DEFAULT 'PRODUCT';

-- 3. Create lithophane_designs table
CREATE TABLE `lithophane_designs` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `schemaVersion` INTEGER NOT NULL DEFAULT 1,
    `title` VARCHAR(191) NOT NULL,
    `templateId` VARCHAR(50) NOT NULL,
    `photoKeys` JSON NOT NULL,
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
    `baseStlKey` VARCHAR(191) NULL,
    `baseStlSha256` VARCHAR(191) NULL,
    `baseStlSizeBytes` INTEGER NULL,
    `baseTriangleCount` INTEGER NULL,
    `baseBboxMm` JSON NULL,
    `previewKey` VARCHAR(191) NULL,
    `previewSizeBytes` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `lithophane_designs_stlKey_key`(`stlKey`),
    UNIQUE INDEX `lithophane_designs_baseStlKey_key`(`baseStlKey`),
    INDEX `lithophane_designs_userId_idx`(`userId`),
    INDEX `lithophane_designs_status_idx`(`status`),
    UNIQUE INDEX `lithophane_designs_userId_paramsHash_key`(`userId`, `paramsHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 4. Create performance indexes for relational lookups
CREATE INDEX `cart_items_lithophaneDesignId_idx` ON `cart_items`(`lithophaneDesignId`);
CREATE INDEX `order_items_lithophaneDesignId_idx` ON `order_items`(`lithophaneDesignId`);

-- 5. Add foreign keys with RESTRICT on delete (protects historical orders & users)
ALTER TABLE `lithophane_designs` 
    ADD CONSTRAINT `lithophane_designs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `cart_items` 
    ADD CONSTRAINT `cart_items_lithophaneDesignId_fkey` FOREIGN KEY (`lithophaneDesignId`) REFERENCES `lithophane_designs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `order_items` 
    ADD CONSTRAINT `order_items_lithophaneDesignId_fkey` FOREIGN KEY (`lithophaneDesignId`) REFERENCES `lithophane_designs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
