-- Add relief STL columns to custom_designs for two-color 3MF support
ALTER TABLE `custom_designs`
  ADD COLUMN `reliefStlKey` VARCHAR(191) NULL,
  ADD COLUMN `reliefStlSha256` VARCHAR(191) NULL,
  ADD COLUMN `reliefStlBytes` INT NULL;

ALTER TABLE `custom_designs`
  ADD UNIQUE INDEX `custom_designs_reliefStlKey_key` (`reliefStlKey`);
