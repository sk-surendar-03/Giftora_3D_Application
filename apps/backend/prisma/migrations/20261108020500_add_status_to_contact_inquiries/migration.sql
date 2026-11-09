-- AlterTable
ALTER TABLE `contact_inquiries` ADD COLUMN `status` VARCHAR(50) NOT NULL DEFAULT 'NEW' AFTER `message`;
