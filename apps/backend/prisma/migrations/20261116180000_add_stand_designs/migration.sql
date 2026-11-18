-- 1. Alter cart_items: add standDesignId column and widen itemType enum
ALTER TABLE `cart_items` 
    ADD COLUMN `standDesignId` VARCHAR(191) NULL,
    MODIFY `itemType` ENUM('PRODUCT', 'CUSTOM_DESIGN', 'STAND_DESIGN') NOT NULL DEFAULT 'PRODUCT';

-- 2. Alter order_items: add standDesignId column and widen itemType enum
ALTER TABLE `order_items` 
    ADD COLUMN `standDesignId` VARCHAR(191) NULL,
    MODIFY `itemType` ENUM('PRODUCT', 'CUSTOM_DESIGN', 'STAND_DESIGN') NOT NULL DEFAULT 'PRODUCT';

-- 3. Create stand_designs table
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

-- 4. Create performance indexes for relational lookups
CREATE INDEX `cart_items_standDesignId_idx` ON `cart_items`(`standDesignId`);
CREATE INDEX `order_items_standDesignId_idx` ON `order_items`(`standDesignId`);

-- 5. Add foreign keys with RESTRICT on delete (protects historical orders & users)
ALTER TABLE `stand_designs` 
    ADD CONSTRAINT `stand_designs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `cart_items` 
    ADD CONSTRAINT `cart_items_standDesignId_fkey` FOREIGN KEY (`standDesignId`) REFERENCES `stand_designs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `order_items` 
    ADD CONSTRAINT `order_items_standDesignId_fkey` FOREIGN KEY (`standDesignId`) REFERENCES `stand_designs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- 6. Idempotently add orders.customerNote (if missing on a fresh database, preserving if already present)
SET @note_col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'orders' 
      AND COLUMN_NAME = 'customerNote'
);
SET @sql_note = IF(@note_col_exists = 0, 
    'ALTER TABLE `orders` ADD COLUMN `customerNote` TEXT NULL', 
    'DO 0'
);
PREPARE stmt_note FROM @sql_note;
EXECUTE stmt_note;
DEALLOCATE PREPARE stmt_note;

-- 7. Idempotently drop legacy 2-way CHECK constraints (if present from migration 20261106000000 on fresh DB)
SET @cart_chk_exists = (
    SELECT COUNT(*) 
    FROM information_schema.TABLE_CONSTRAINTS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'cart_items' 
      AND CONSTRAINT_NAME = 'cart_items_item_ref_chk'
      AND CONSTRAINT_TYPE = 'CHECK'
);
SET @sql_cart_drop = IF(@cart_chk_exists > 0, 
    'ALTER TABLE `cart_items` DROP CONSTRAINT `cart_items_item_ref_chk`', 
    'DO 0'
);
PREPARE stmt_cart_drop FROM @sql_cart_drop;
EXECUTE stmt_cart_drop;
DEALLOCATE PREPARE stmt_cart_drop;

SET @order_chk_exists = (
    SELECT COUNT(*) 
    FROM information_schema.TABLE_CONSTRAINTS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'order_items' 
      AND CONSTRAINT_NAME = 'order_items_item_ref_chk'
      AND CONSTRAINT_TYPE = 'CHECK'
);
SET @sql_order_drop = IF(@order_chk_exists > 0, 
    'ALTER TABLE `order_items` DROP CONSTRAINT `order_items_item_ref_chk`', 
    'DO 0'
);
PREPARE stmt_order_drop FROM @sql_order_drop;
EXECUTE stmt_order_drop;
DEALLOCATE PREPARE stmt_order_drop;

-- 8. Add updated 3-way item reference CHECK constraints (supporting PRODUCT, CUSTOM_DESIGN, STAND_DESIGN)
ALTER TABLE `cart_items` ADD CONSTRAINT `cart_items_item_ref_chk` CHECK (
    (`itemType` = 'PRODUCT' AND `productId` IS NOT NULL AND `customDesignId` IS NULL AND `standDesignId` IS NULL) OR
    (`itemType` = 'CUSTOM_DESIGN' AND `customDesignId` IS NOT NULL AND `productId` IS NULL AND `standDesignId` IS NULL) OR
    (`itemType` = 'STAND_DESIGN' AND `standDesignId` IS NOT NULL AND `productId` IS NULL AND `customDesignId` IS NULL)
);

ALTER TABLE `order_items` ADD CONSTRAINT `order_items_item_ref_chk` CHECK (
    (`itemType` = 'PRODUCT' AND `productId` IS NOT NULL AND `customDesignId` IS NULL AND `standDesignId` IS NULL) OR
    (`itemType` = 'CUSTOM_DESIGN' AND `customDesignId` IS NOT NULL AND `productId` IS NULL AND `standDesignId` IS NULL) OR
    (`itemType` = 'STAND_DESIGN' AND `standDesignId` IS NOT NULL AND `productId` IS NULL AND `customDesignId` IS NULL)
);
