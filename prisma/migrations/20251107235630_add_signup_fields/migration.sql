-- AlterTable
ALTER TABLE `user` ADD COLUMN `age` INTEGER NULL,
    ADD COLUMN `avatar` VARCHAR(191) NULL,
    ADD COLUMN `interests` JSON NULL;
