-- Better Auth identity + organization (school) mapping for the multi-tenant
-- MySQL schema. This migration is intentionally additive.

-- Organization metadata (Better Auth organization plugin).
ALTER TABLE `schools` ADD COLUMN `metadata` JSON NULL;

-- Active school selected in a Better Auth session.
ALTER TABLE `session` ADD COLUMN `activeOrganizationId` VARCHAR(191) NULL;

-- Better Auth organization invitations.
CREATE TABLE `invitation` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `email` VARCHAR(180) NOT NULL,
    `role` VARCHAR(40) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `inviterId` VARCHAR(191) NOT NULL,
    `teamId` VARCHAR(191) NULL,

    INDEX `invitation_schoolId_email_idx`(`schoolId`, `email`),
    INDEX `invitation_schoolId_status_idx`(`schoolId`, `status`),
    INDEX `invitation_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `invitation` ADD CONSTRAINT `invitation_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `invitation` ADD CONSTRAINT `invitation_inviterId_fkey` FOREIGN KEY (`inviterId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
