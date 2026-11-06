-- AlterTable
ALTER TABLE `cart_items` ADD COLUMN `customDesignId` VARCHAR(191) NULL,
    ADD COLUMN `itemType` ENUM('PRODUCT', 'CUSTOM_DESIGN') NOT NULL DEFAULT 'PRODUCT',
    MODIFY `productId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `order_items` ADD COLUMN `customDesignId` VARCHAR(191) NULL,
    ADD COLUMN `itemType` ENUM('PRODUCT', 'CUSTOM_DESIGN') NOT NULL DEFAULT 'PRODUCT',
    MODIFY `productId` VARCHAR(191) NULL,
    MODIFY `productSlug` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `custom_designs` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `schemaVersion` INTEGER NOT NULL DEFAULT 1,
    `title` VARCHAR(191) NOT NULL,
    `params` JSON NOT NULL,
    `engineParams` JSON NOT NULL,
    `paramsHash` VARCHAR(191) NOT NULL,
    `unitPriceCents` INTEGER NOT NULL,
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

    UNIQUE INDEX `custom_designs_stlKey_key`(`stlKey`),
    INDEX `custom_designs_userId_idx`(`userId`),
    UNIQUE INDEX `custom_designs_userId_paramsHash_key`(`userId`, `paramsHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `cart_items_customDesignId_idx` ON `cart_items`(`customDesignId`);

-- CreateIndex
CREATE INDEX `order_items_customDesignId_idx` ON `order_items`(`customDesignId`);

-- AddForeignKey
ALTER TABLE `custom_designs` ADD CONSTRAINT `custom_designs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cart_items` ADD CONSTRAINT `cart_items_customDesignId_fkey` FOREIGN KEY (`customDesignId`) REFERENCES `custom_designs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_customDesignId_fkey` FOREIGN KEY (`customDesignId`) REFERENCES `custom_designs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;


-- Safety net: every cart/order line is EITHER a catalog product OR a custom
-- design, never both and never neither. Existing rows all satisfy this
-- (itemType defaults to PRODUCT and their productId is NOT NULL).
ALTER TABLE `cart_items` ADD CONSTRAINT `cart_items_item_ref_chk` CHECK (
    (`itemType` = 'PRODUCT' AND `productId` IS NOT NULL AND `customDesignId` IS NULL) OR
    (`itemType` = 'CUSTOM_DESIGN' AND `customDesignId` IS NOT NULL AND `productId` IS NULL)
);

ALTER TABLE `order_items` ADD CONSTRAINT `order_items_item_ref_chk` CHECK (
    (`itemType` = 'PRODUCT' AND `productId` IS NOT NULL AND `customDesignId` IS NULL) OR
    (`itemType` = 'CUSTOM_DESIGN' AND `customDesignId` IS NOT NULL AND `productId` IS NULL)
);
