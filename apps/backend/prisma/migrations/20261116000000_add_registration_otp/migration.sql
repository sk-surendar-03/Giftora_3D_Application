-- 1. Add verification audit fields to users table (defaulting to TRUE so all existing users are verified)
ALTER TABLE `users`
  ADD COLUMN `isEmailVerified` BOOLEAN NOT NULL DEFAULT TRUE AFTER `isActive`,
  ADD COLUMN `emailVerifiedAt` DATETIME(3) NULL AFTER `isEmailVerified`;

-- 2. Backfill all existing user accounts as verified (preserves isActive, role, passwordHash, orders)
UPDATE `users` SET `isEmailVerified` = TRUE, `emailVerifiedAt` = NOW();

-- 3. Create registration_otps table for staging pending customer registrations
CREATE TABLE `registration_otps` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `otpHash` VARCHAR(191) NOT NULL,
    `failedAttempts` INT NOT NULL DEFAULT 0,
    `resendCount` INT NOT NULL DEFAULT 0,
    `version` INT NOT NULL DEFAULT 1,
    `lastResentAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `windowStartedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NOT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `registration_otps_email_key`(`email`),
    INDEX `registration_otps_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 4. Create auth_rate_limits table for persistent cross-instance rate limiting
CREATE TABLE `auth_rate_limits` (
    `key` VARCHAR(191) NOT NULL,
    `count` INT NOT NULL DEFAULT 1,
    `expiresAt` DATETIME(3) NOT NULL,

    INDEX `auth_rate_limits_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
