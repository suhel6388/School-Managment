-- CreateTable
CREATE TABLE `schools` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `slug` VARCHAR(80) NOT NULL,
    `email` VARCHAR(150) NULL,
    `phone` VARCHAR(40) NULL,
    `address` TEXT NULL,
    `logo` TEXT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `subscriptionPlan` VARCHAR(40) NOT NULL DEFAULT 'free',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `schools_slug_key`(`slug`),
    INDEX `schools_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(180) NOT NULL,
    `emailVerified` BOOLEAN NOT NULL DEFAULT false,
    `image` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `session` (
    `id` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `token` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `ipAddress` VARCHAR(64) NULL,
    `userAgent` TEXT NULL,
    `userId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `session_token_key`(`token`),
    INDEX `session_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `account` (
    `id` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(180) NOT NULL,
    `providerId` VARCHAR(80) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `accessToken` TEXT NULL,
    `refreshToken` TEXT NULL,
    `idToken` TEXT NULL,
    `accessTokenExpiresAt` DATETIME(3) NULL,
    `refreshTokenExpiresAt` DATETIME(3) NULL,
    `scope` TEXT NULL,
    `password` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `account_userId_idx`(`userId`),
    UNIQUE INDEX `account_providerId_accountId_key`(`providerId`, `accountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `verification` (
    `id` VARCHAR(191) NOT NULL,
    `identifier` VARCHAR(255) NOT NULL,
    `value` TEXT NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `verification_identifier_idx`(`identifier`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `school_memberships` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `role` VARCHAR(40) NOT NULL DEFAULT 'member',
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `school_memberships_schoolId_status_idx`(`schoolId`, `status`),
    INDEX `school_memberships_userId_idx`(`userId`),
    UNIQUE INDEX `school_memberships_schoolId_userId_key`(`schoolId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `settings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `schoolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `address` TEXT NULL,
    `phone` VARCHAR(40) NULL,
    `email` VARCHAR(150) NULL,
    `session` VARCHAR(20) NOT NULL DEFAULT '2026-27',
    `headerText` VARCHAR(150) NULL,
    `footerText` TEXT NULL,
    `captcha` BOOLEAN NOT NULL DEFAULT false,
    `waMessage` TEXT NULL,
    `fileTypes` TEXT NULL,
    `planName` VARCHAR(60) NULL,
    `planExpires` DATE NULL,
    `profilePhone` BOOLEAN NOT NULL DEFAULT true,
    `profileAddr` BOOLEAN NOT NULL DEFAULT true,
    `profileEmail` BOOLEAN NOT NULL DEFAULT true,
    `profilePhoto` BOOLEAN NOT NULL DEFAULT false,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `settings_schoolId_key`(`schoolId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `academic_sessions` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(20) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `academic_sessions_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `academic_sessions_schoolId_name_key`(`schoolId`, `name`),
    UNIQUE INDEX `academic_sessions_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `classes` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(60) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `classes_schoolId_idx`(`schoolId`),
    INDEX `classes_order_idx`(`order`),
    UNIQUE INDEX `classes_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sections` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(30) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `sections_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `sections_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `class_sections` (
    `classId` VARCHAR(191) NOT NULL,
    `sectionId` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,

    INDEX `class_sections_schoolId_idx`(`schoolId`),
    PRIMARY KEY (`classId`, `sectionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subjects` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `code` VARCHAR(20) NULL,
    `type` VARCHAR(20) NOT NULL DEFAULT 'Theory',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `subjects_schoolId_idx`(`schoolId`),
    INDEX `subjects_schoolId_name_idx`(`schoolId`, `name`),
    UNIQUE INDEX `subjects_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subject_groups` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `classId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `subject_groups_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `subject_groups_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subject_group_sections` (
    `groupId` VARCHAR(191) NOT NULL,
    `sectionId` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,

    INDEX `subject_group_sections_schoolId_idx`(`schoolId`),
    PRIMARY KEY (`groupId`, `sectionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subject_group_subjects` (
    `groupId` VARCHAR(191) NOT NULL,
    `subjectId` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,

    INDEX `subject_group_subjects_schoolId_idx`(`schoolId`),
    PRIMARY KEY (`groupId`, `subjectId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_categories` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(60) NOT NULL,
    `desc` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `student_categories_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `student_categories_schoolId_name_key`(`schoolId`, `name`),
    UNIQUE INDEX `student_categories_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_houses` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(60) NOT NULL,
    `desc` TEXT NULL,

    INDEX `student_houses_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `student_houses_schoolId_name_key`(`schoolId`, `name`),
    UNIQUE INDEX `student_houses_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `disable_reasons` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `desc` TEXT NULL,

    INDEX `disable_reasons_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `disable_reasons_schoolId_name_key`(`schoolId`, `name`),
    UNIQUE INDEX `disable_reasons_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `students` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `admNo` VARCHAR(32) NOT NULL,
    `rollNo` VARCHAR(20) NULL,
    `name` VARCHAR(120) NOT NULL,
    `gender` VARCHAR(16) NOT NULL DEFAULT 'Male',
    `classId` VARCHAR(191) NULL,
    `sectionId` VARCHAR(191) NULL,
    `dob` DATE NULL,
    `admDate` DATE NOT NULL DEFAULT (curdate()),
    `categoryId` VARCHAR(191) NULL,
    `houseId` VARCHAR(191) NULL,
    `disReasonId` VARCHAR(191) NULL,
    `father` VARCHAR(120) NULL,
    `mother` VARCHAR(120) NULL,
    `phone` VARCHAR(20) NULL,
    `email` VARCHAR(150) NULL,
    `address` TEXT NULL,
    `photo` TEXT NULL,
    `status` VARCHAR(16) NOT NULL DEFAULT 'active',
    `portalPassword` VARCHAR(60) NULL,
    `custom` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `students_schoolId_idx`(`schoolId`),
    INDEX `students_schoolId_status_idx`(`schoolId`, `status`),
    INDEX `students_classId_sectionId_status_idx`(`classId`, `sectionId`, `status`),
    INDEX `students_name_idx`(`name`),
    INDEX `students_phone_idx`(`phone`),
    UNIQUE INDEX `students_schoolId_admNo_key`(`schoolId`, `admNo`),
    UNIQUE INDEX `students_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `counters` (
    `schoolId` VARCHAR(191) NOT NULL,
    `key` VARCHAR(30) NOT NULL,
    `value` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`schoolId`, `key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fee_groups` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `desc` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `fee_groups_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `fee_groups_schoolId_name_key`(`schoolId`, `name`),
    UNIQUE INDEX `fee_groups_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fee_types` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `code` VARCHAR(20) NULL,
    `desc` TEXT NULL,

    INDEX `fee_types_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `fee_types_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fee_discounts` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(20) NULL,
    `type` VARCHAR(12) NOT NULL DEFAULT 'Fixed',
    `amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,

    INDEX `fee_discounts_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `fee_discounts_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fee_masters` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `groupId` VARCHAR(191) NOT NULL,
    `typeId` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,
    `label` VARCHAR(80) NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `due` DATE NULL,
    `fine` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `fee_masters_schoolId_idx`(`schoolId`),
    INDEX `fee_masters_classId_idx`(`classId`),
    UNIQUE INDEX `fee_masters_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `rc` VARCHAR(32) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `feeKey` VARCHAR(80) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `discount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `fine` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `mode` VARCHAR(30) NOT NULL,
    `date` DATE NOT NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `payments_schoolId_idx`(`schoolId`),
    INDEX `payments_schoolId_date_idx`(`schoolId`, `date`),
    INDEX `payments_studentId_feeKey_idx`(`studentId`, `feeKey`),
    INDEX `payments_date_idx`(`date`),
    UNIQUE INDEX `payments_schoolId_rc_key`(`schoolId`, `rc`),
    UNIQUE INDEX `payments_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `carry_forwards` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `fromSession` VARCHAR(20) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `due` DATE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `carry_forwards_schoolId_idx`(`schoolId`),
    INDEX `carry_forwards_studentId_idx`(`studentId`),
    UNIQUE INDEX `carry_forwards_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bank_payments` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `bank` VARCHAR(120) NULL,
    `ref` VARCHAR(80) NOT NULL,
    `date` DATE NOT NULL DEFAULT (curdate()),
    `status` VARCHAR(20) NOT NULL DEFAULT 'Pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `bank_payments_schoolId_idx`(`schoolId`),
    INDEX `bank_payments_status_idx`(`status`),
    UNIQUE INDEX `bank_payments_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fee_reminders` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `kind` VARCHAR(20) NOT NULL,
    `days` INTEGER NOT NULL DEFAULT 0,
    `sms` BOOLEAN NOT NULL DEFAULT true,
    `email` BOOLEAN NOT NULL DEFAULT false,
    `wa` BOOLEAN NOT NULL DEFAULT false,
    `active` BOOLEAN NOT NULL DEFAULT true,

    INDEX `fee_reminders_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `fee_reminders_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `departments` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `desc` TEXT NULL,

    INDEX `departments_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `departments_schoolId_name_key`(`schoolId`, `name`),
    UNIQUE INDEX `departments_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `designations` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `desc` TEXT NULL,

    INDEX `designations_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `designations_schoolId_name_key`(`schoolId`, `name`),
    UNIQUE INDEX `designations_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leave_types` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `days` INTEGER NOT NULL DEFAULT 0,

    INDEX `leave_types_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `leave_types_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `staff` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `empId` VARCHAR(32) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `desigId` VARCHAR(191) NULL,
    `deptId` VARCHAR(191) NULL,
    `gender` VARCHAR(16) NULL,
    `phone` VARCHAR(20) NULL,
    `email` VARCHAR(150) NULL,
    `joinDate` DATE NULL,
    `basic` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `status` VARCHAR(16) NOT NULL DEFAULT 'active',
    `address` TEXT NULL,
    `qual` VARCHAR(120) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `staff_schoolId_idx`(`schoolId`),
    INDEX `staff_status_idx`(`status`),
    UNIQUE INDEX `staff_schoolId_empId_key`(`schoolId`, `empId`),
    UNIQUE INDEX `staff_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `staff_leaves` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `staffId` VARCHAR(191) NOT NULL,
    `typeId` VARCHAR(191) NULL,
    `from` DATE NOT NULL,
    `to` DATE NOT NULL,
    `reason` TEXT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'Pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `staff_leaves_schoolId_idx`(`schoolId`),
    INDEX `staff_leaves_status_idx`(`status`),
    UNIQUE INDEX `staff_leaves_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `staff_ratings` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `staffId` VARCHAR(191) NOT NULL,
    `rating` INTEGER NOT NULL,
    `by` VARCHAR(80) NULL,
    `comment` TEXT NULL,
    `date` DATE NOT NULL DEFAULT (curdate()),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `staff_ratings_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `staff_ratings_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payrolls` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `staffId` VARCHAR(191) NOT NULL,
    `month` VARCHAR(7) NOT NULL,
    `basic` DECIMAL(12, 2) NOT NULL,
    `allow` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `deduct` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `net` DECIMAL(12, 2) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'Generated',
    `paidDate` DATE NULL,
    `mode` VARCHAR(30) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `payrolls_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `payrolls_schoolId_staffId_month_key`(`schoolId`, `staffId`, `month`),
    UNIQUE INDEX `payrolls_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `staff_attendance` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `staffId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'Present',
    `note` TEXT NULL,

    INDEX `staff_attendance_schoolId_idx`(`schoolId`),
    INDEX `staff_attendance_date_idx`(`date`),
    UNIQUE INDEX `staff_attendance_schoolId_staffId_date_key`(`schoolId`, `staffId`, `date`),
    UNIQUE INDEX `staff_attendance_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_attendance` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'Present',
    `note` TEXT NULL,

    INDEX `student_attendance_schoolId_idx`(`schoolId`),
    INDEX `student_attendance_date_idx`(`date`),
    UNIQUE INDEX `student_attendance_schoolId_studentId_date_key`(`schoolId`, `studentId`, `date`),
    UNIQUE INDEX `student_attendance_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_leaves` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `from` DATE NOT NULL,
    `to` DATE NOT NULL,
    `reason` TEXT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'Pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `student_leaves_schoolId_idx`(`schoolId`),
    INDEX `student_leaves_status_idx`(`status`),
    UNIQUE INDEX `student_leaves_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `front_office_setup` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `kind` VARCHAR(20) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `desc` TEXT NULL,

    INDEX `front_office_setup_schoolId_idx`(`schoolId`),
    INDEX `front_office_setup_kind_idx`(`kind`),
    UNIQUE INDEX `front_office_setup_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `enquiries` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `email` VARCHAR(150) NULL,
    `address` TEXT NULL,
    `desc` TEXT NULL,
    `classId` VARCHAR(191) NULL,
    `sourceId` VARCHAR(191) NULL,
    `date` DATE NOT NULL DEFAULT (curdate()),
    `follow` DATE NULL,
    `note` TEXT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'Active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `enquiries_schoolId_idx`(`schoolId`),
    INDEX `enquiries_status_follow_idx`(`status`, `follow`),
    UNIQUE INDEX `enquiries_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visitors` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `purposeId` VARCHAR(191) NULL,
    `name` VARCHAR(120) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `idCard` VARCHAR(60) NULL,
    `persons` INTEGER NOT NULL DEFAULT 1,
    `date` DATE NOT NULL DEFAULT (curdate()),
    `inTime` VARCHAR(5) NULL,
    `outTime` VARCHAR(5) NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `visitors_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `visitors_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `phone_calls` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `date` DATE NOT NULL DEFAULT (curdate()),
    `type` VARCHAR(20) NOT NULL DEFAULT 'Incoming',
    `desc` TEXT NULL,
    `follow` DATE NULL,
    `duration` VARCHAR(40) NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `phone_calls_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `phone_calls_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `postal_dispatch` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `toTitle` VARCHAR(120) NOT NULL,
    `refNo` VARCHAR(60) NULL,
    `address` TEXT NULL,
    `fromTitle` VARCHAR(120) NULL,
    `date` DATE NOT NULL DEFAULT (curdate()),
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `postal_dispatch_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `postal_dispatch_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `postal_receive` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `fromTitle` VARCHAR(120) NOT NULL,
    `refNo` VARCHAR(60) NULL,
    `address` TEXT NULL,
    `toTitle` VARCHAR(120) NULL,
    `date` DATE NOT NULL DEFAULT (curdate()),
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `postal_receive_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `postal_receive_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `complaints` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `typeId` VARCHAR(191) NULL,
    `by` VARCHAR(120) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `date` DATE NOT NULL DEFAULT (curdate()),
    `desc` TEXT NULL,
    `action` TEXT NULL,
    `note` TEXT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'Pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `complaints_schoolId_idx`(`schoolId`),
    INDEX `complaints_status_idx`(`status`),
    UNIQUE INDEX `complaints_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `online_admissions` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `classId` VARCHAR(191) NULL,
    `gender` VARCHAR(16) NULL,
    `dob` DATE NULL,
    `father` VARCHAR(120) NULL,
    `phone` VARCHAR(20) NOT NULL,
    `email` VARCHAR(150) NULL,
    `address` TEXT NULL,
    `date` DATE NOT NULL DEFAULT (curdate()),
    `status` VARCHAR(20) NOT NULL DEFAULT 'Pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `online_admissions_schoolId_idx`(`schoolId`),
    INDEX `online_admissions_status_idx`(`status`),
    UNIQUE INDEX `online_admissions_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `multi_class_students` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,
    `sectionId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `multi_class_students_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `multi_class_students_schoolId_studentId_classId_key`(`schoolId`, `studentId`, `classId`),
    UNIQUE INDEX `multi_class_students_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expense_heads` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `desc` TEXT NULL,

    INDEX `expense_heads_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `expense_heads_schoolId_name_key`(`schoolId`, `name`),
    UNIQUE INDEX `expense_heads_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expenses` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `headId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `invoice` VARCHAR(60) NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `date` DATE NOT NULL,
    `mode` VARCHAR(30) NOT NULL DEFAULT 'Cash',
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `expenses_schoolId_idx`(`schoolId`),
    INDEX `expenses_date_idx`(`date`),
    UNIQUE INDEX `expenses_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_groups` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `session` VARCHAR(20) NOT NULL,
    `desc` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `exam_groups_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `exam_groups_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_schedules` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `groupId` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,
    `subjectId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `time` VARCHAR(5) NULL,
    `room` VARCHAR(60) NULL,
    `max` INTEGER NOT NULL DEFAULT 50,
    `pass` INTEGER NOT NULL DEFAULT 17,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `exam_schedules_schoolId_idx`(`schoolId`),
    INDEX `exam_schedules_groupId_classId_idx`(`groupId`, `classId`),
    UNIQUE INDEX `exam_schedules_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_results` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `schedId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `marks` DECIMAL(6, 2) NOT NULL DEFAULT 0,
    `absent` BOOLEAN NOT NULL DEFAULT false,
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `exam_results_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `exam_results_schoolId_schedId_studentId_key`(`schoolId`, `schedId`, `studentId`),
    UNIQUE INDEX `exam_results_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `grades` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(10) NOT NULL,
    `from` DECIMAL(5, 2) NOT NULL,
    `to` DECIMAL(5, 2) NOT NULL,
    `point` INTEGER NOT NULL DEFAULT 0,
    `remark` VARCHAR(120) NULL,

    INDEX `grades_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `grades_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `divisions` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(40) NOT NULL,
    `from` DECIMAL(5, 2) NOT NULL,
    `to` DECIMAL(5, 2) NOT NULL,

    INDEX `divisions_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `divisions_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admit_templates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `schoolId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(80) NOT NULL DEFAULT 'ADMIT CARD',
    `exam` VARCHAR(150) NULL,
    `instructions` TEXT NULL,
    `sign` VARCHAR(80) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `admit_templates_schoolId_key`(`schoolId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mark_templates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `schoolId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(80) NOT NULL DEFAULT 'REPORT CARD',
    `remarks` TEXT NULL,
    `signL` VARCHAR(80) NULL,
    `signR` VARCHAR(80) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `mark_templates_schoolId_key`(`schoolId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `online_exams` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,
    `subjectId` VARCHAR(191) NOT NULL,
    `start` DATE NULL,
    `end` DATE NULL,
    `duration` INTEGER NOT NULL DEFAULT 10,
    `passPct` INTEGER NOT NULL DEFAULT 40,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `online_exams_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `online_exams_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `questions` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,
    `subjectId` VARCHAR(191) NOT NULL,
    `question` TEXT NOT NULL,
    `a` VARCHAR(255) NOT NULL,
    `b` VARCHAR(255) NOT NULL,
    `c` VARCHAR(255) NULL,
    `d` VARCHAR(255) NULL,
    `ans` VARCHAR(1) NOT NULL,
    `marks` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `questions_schoolId_idx`(`schoolId`),
    INDEX `questions_classId_subjectId_idx`(`classId`, `subjectId`),
    UNIQUE INDEX `questions_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `online_exam_results` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `examId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `score` INTEGER NOT NULL DEFAULT 0,
    `total` INTEGER NOT NULL DEFAULT 0,
    `pct` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `date` DATE NOT NULL DEFAULT (curdate()),

    INDEX `online_exam_results_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `online_exam_results_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lessons` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,
    `subjectId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `lessons_schoolId_idx`(`schoolId`),
    INDEX `lessons_classId_subjectId_idx`(`classId`, `subjectId`),
    UNIQUE INDEX `lessons_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `topics` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `lessonId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `planDate` DATE NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'Pending',

    INDEX `topics_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `topics_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lesson_plans` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,
    `subjectId` VARCHAR(191) NOT NULL,
    `lessonId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `teacherId` VARCHAR(191) NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `lesson_plans_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `lesson_plans_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notices` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `msg` TEXT NOT NULL,
    `date` DATE NOT NULL DEFAULT (curdate()),
    `audience` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notices_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `notices_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_templates` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `body` TEXT NOT NULL,

    INDEX `email_templates_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `email_templates_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sms_templates` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `body` TEXT NOT NULL,

    INDEX `sms_templates_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `sms_templates_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `scheduled_messages` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `channel` VARCHAR(20) NOT NULL,
    `audience` VARCHAR(40) NOT NULL,
    `date` DATE NOT NULL,
    `time` VARCHAR(5) NULL,
    `msg` TEXT NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'Scheduled',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `scheduled_messages_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `scheduled_messages_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `message_logs` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `channel` VARCHAR(20) NOT NULL,
    `to` VARCHAR(180) NOT NULL,
    `phone` VARCHAR(180) NULL,
    `subject` VARCHAR(200) NULL,
    `body` TEXT NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'Logged',

    INDEX `message_logs_schoolId_idx`(`schoolId`),
    INDEX `message_logs_time_idx`(`time`),
    UNIQUE INDEX `message_logs_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `content_types` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `desc` TEXT NULL,

    INDEX `content_types_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `content_types_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contents` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `typeId` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NULL,
    `date` DATE NOT NULL DEFAULT (curdate()),
    `valid` DATE NULL,
    `url` VARCHAR(500) NULL,
    `file` TEXT NULL,
    `fileName` VARCHAR(200) NULL,
    `desc` TEXT NULL,
    `shared` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `contents_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `contents_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `homework` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,
    `sectionId` VARCHAR(191) NULL,
    `subjectId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL DEFAULT (curdate()),
    `due` DATE NOT NULL,
    `desc` TEXT NOT NULL,
    `max` INTEGER NOT NULL DEFAULT 10,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `homework_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `homework_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `homework_submissions` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `homeworkId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `done` BOOLEAN NOT NULL DEFAULT false,
    `marks` INTEGER NULL,

    INDEX `homework_submissions_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `homework_submissions_schoolId_homeworkId_studentId_key`(`schoolId`, `homeworkId`, `studentId`),
    UNIQUE INDEX `homework_submissions_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `school_events` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `date` DATE NOT NULL,
    `time` VARCHAR(5) NULL,
    `place` VARCHAR(150) NULL,
    `note` TEXT NULL,

    INDEX `school_events_schoolId_idx`(`schoolId`),
    INDEX `school_events_date_idx`(`date`),
    UNIQUE INDEX `school_events_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `books` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `no` VARCHAR(40) NULL,
    `isbn` VARCHAR(40) NULL,
    `publisher` VARCHAR(120) NULL,
    `author` VARCHAR(120) NULL,
    `subject` VARCHAR(80) NULL,
    `rack` VARCHAR(20) NULL,
    `qty` INTEGER NOT NULL DEFAULT 1,
    `price` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `date` DATE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `books_schoolId_idx`(`schoolId`),
    INDEX `books_title_idx`(`title`),
    UNIQUE INDEX `books_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `library_members` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `kind` VARCHAR(16) NOT NULL,
    `refId` VARCHAR(40) NOT NULL,
    `card` VARCHAR(40) NOT NULL,

    INDEX `library_members_schoolId_idx`(`schoolId`),
    INDEX `library_members_kind_refId_idx`(`kind`, `refId`),
    UNIQUE INDEX `library_members_schoolId_card_key`(`schoolId`, `card`),
    UNIQUE INDEX `library_members_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `book_issues` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `memberId` VARCHAR(191) NOT NULL,
    `bookId` VARCHAR(191) NOT NULL,
    `issue` DATE NOT NULL,
    `due` DATE NOT NULL,
    `ret` DATE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `book_issues_schoolId_idx`(`schoolId`),
    INDEX `book_issues_bookId_ret_idx`(`bookId`, `ret`),
    UNIQUE INDEX `book_issues_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `item_categories` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `desc` TEXT NULL,

    INDEX `item_categories_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `item_categories_schoolId_name_key`(`schoolId`, `name`),
    UNIQUE INDEX `item_categories_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `item_stores` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(20) NULL,
    `desc` TEXT NULL,

    INDEX `item_stores_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `item_stores_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `item_suppliers` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `contact` VARCHAR(120) NULL,
    `phone` VARCHAR(20) NULL,
    `address` TEXT NULL,
    `desc` TEXT NULL,

    INDEX `item_suppliers_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `item_suppliers_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `items` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `catId` VARCHAR(191) NOT NULL,
    `unit` VARCHAR(30) NULL,
    `desc` TEXT NULL,

    INDEX `items_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `items_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `item_stock` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `itemId` VARCHAR(191) NOT NULL,
    `supId` VARCHAR(191) NULL,
    `storeId` VARCHAR(191) NULL,
    `qty` INTEGER NOT NULL DEFAULT 0,
    `price` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `date` DATE NOT NULL DEFAULT (curdate()),
    `purchaseNo` VARCHAR(60) NULL,
    `desc` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `item_stock_schoolId_idx`(`schoolId`),
    INDEX `item_stock_itemId_idx`(`itemId`),
    UNIQUE INDEX `item_stock_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `item_issues` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `itemId` VARCHAR(191) NOT NULL,
    `staffId` VARCHAR(191) NULL,
    `qty` INTEGER NOT NULL,
    `issue` DATE NOT NULL,
    `ret` DATE NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'Issued',
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `item_issues_schoolId_idx`(`schoolId`),
    INDEX `item_issues_itemId_status_idx`(`itemId`, `status`),
    UNIQUE INDEX `item_issues_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transport_routes` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `desc` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `transport_routes_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `transport_routes_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vehicles` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `number` VARCHAR(40) NOT NULL,
    `model` VARCHAR(80) NULL,
    `year` VARCHAR(10) NULL,
    `driver` VARCHAR(120) NULL,
    `phone` VARCHAR(20) NULL,
    `licence` VARCHAR(40) NULL,
    `capacity` INTEGER NOT NULL DEFAULT 0,

    INDEX `vehicles_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `vehicles_schoolId_number_key`(`schoolId`, `number`),
    UNIQUE INDEX `vehicles_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pickup_points` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(150) NOT NULL,

    INDEX `pickup_points_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `pickup_points_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `route_pickups` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `routeId` VARCHAR(191) NOT NULL,
    `pickupId` VARCHAR(191) NOT NULL,
    `time` VARCHAR(5) NULL,

    INDEX `route_pickups_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `route_pickups_schoolId_routeId_pickupId_key`(`schoolId`, `routeId`, `pickupId`),
    UNIQUE INDEX `route_pickups_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vehicle_assignments` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `routeId` VARCHAR(191) NOT NULL,

    INDEX `vehicle_assignments_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `vehicle_assignments_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assignment_vehicles` (
    `assignmentId` VARCHAR(191) NOT NULL,
    `vehicleId` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,

    INDEX `assignment_vehicles_schoolId_idx`(`schoolId`),
    PRIMARY KEY (`assignmentId`, `vehicleId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transport_fees` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `pickupId` VARCHAR(191) NOT NULL,
    `monthlyFee` DECIMAL(12, 2) NOT NULL,
    `months` INTEGER NOT NULL DEFAULT 10,
    `fine` DECIMAL(12, 2) NOT NULL DEFAULT 0,

    INDEX `transport_fees_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `transport_fees_schoolId_pickupId_key`(`schoolId`, `pickupId`),
    UNIQUE INDEX `transport_fees_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transport_assignments` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `routeId` VARCHAR(191) NOT NULL,
    `pickupId` VARCHAR(191) NOT NULL,
    `due` DATE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `transport_assignments_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `transport_assignments_schoolId_studentId_pickupId_key`(`schoolId`, `studentId`, `pickupId`),
    UNIQUE INDEX `transport_assignments_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hostels` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `type` VARCHAR(20) NULL,
    `address` VARCHAR(200) NULL,
    `intake` INTEGER NOT NULL DEFAULT 0,
    `desc` TEXT NULL,

    INDEX `hostels_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `hostels_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `room_types` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(60) NOT NULL,
    `desc` TEXT NULL,

    INDEX `room_types_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `room_types_schoolId_name_key`(`schoolId`, `name`),
    UNIQUE INDEX `room_types_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rooms` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `hostelId` VARCHAR(191) NOT NULL,
    `typeId` VARCHAR(191) NOT NULL,
    `roomNo` VARCHAR(30) NOT NULL,
    `beds` INTEGER NOT NULL DEFAULT 1,
    `cost` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `desc` TEXT NULL,

    INDEX `rooms_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `rooms_schoolId_hostelId_roomNo_key`(`schoolId`, `hostelId`, `roomNo`),
    UNIQUE INDEX `rooms_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hostel_allocations` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `roomId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL DEFAULT (curdate()),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `hostel_allocations_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `hostel_allocations_schoolId_studentId_key`(`schoolId`, `studentId`),
    UNIQUE INDEX `hostel_allocations_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `certificate_templates` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `body` TEXT NOT NULL,
    `foot` VARCHAR(80) NULL,

    INDEX `certificate_templates_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `certificate_templates_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `id_card_templates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `schoolId` VARCHAR(191) NOT NULL,
    `color` VARCHAR(20) NOT NULL DEFAULT '#1d3a8a',
    `validity` VARCHAR(80) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `id_card_templates_schoolId_key`(`schoolId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `alumni` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `year` VARCHAR(10) NULL,
    `occupation` VARCHAR(120) NULL,
    `phone` VARCHAR(20) NULL,
    `email` VARCHAR(150) NULL,
    `address` TEXT NULL,
    `note` TEXT NULL,

    INDEX `alumni_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `alumni_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `alumni_events` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `from` DATE NOT NULL,
    `to` DATE NULL,
    `place` VARCHAR(150) NULL,
    `note` TEXT NULL,

    INDEX `alumni_events_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `alumni_events_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `custom_fields` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `for` VARCHAR(30) NOT NULL DEFAULT 'Student',
    `type` VARCHAR(20) NOT NULL DEFAULT 'Text',

    INDEX `custom_fields_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `custom_fields_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `languages` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(60) NOT NULL,
    `code` VARCHAR(10) NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,

    INDEX `languages_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `languages_schoolId_code_key`(`schoolId`, `code`),
    UNIQUE INDEX `languages_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(40) NOT NULL,
    `perms` JSON NOT NULL,

    INDEX `roles_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `roles_schoolId_name_key`(`schoolId`, `name`),
    UNIQUE INDEX `roles_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `app_users` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `username` VARCHAR(64) NOT NULL,
    `passwordHash` VARCHAR(200) NOT NULL,
    `role` VARCHAR(40) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `app_users_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `app_users_schoolId_username_key`(`schoolId`, `username`),
    UNIQUE INDEX `app_users_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `user` VARCHAR(64) NOT NULL,
    `act` VARCHAR(40) NOT NULL,
    `entity` VARCHAR(80) NOT NULL,
    `description` TEXT NULL,

    INDEX `audit_logs_schoolId_idx`(`schoolId`),
    INDEX `audit_logs_time_idx`(`time`),
    UNIQUE INDEX `audit_logs_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_logs` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `user` VARCHAR(64) NOT NULL,
    `act` VARCHAR(80) NOT NULL,

    INDEX `user_logs_schoolId_idx`(`schoolId`),
    INDEX `user_logs_time_idx`(`time`),
    UNIQUE INDEX `user_logs_schoolId_id_key`(`schoolId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `session` ADD CONSTRAINT `session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `account` ADD CONSTRAINT `account_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `school_memberships` ADD CONSTRAINT `school_memberships_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `school_memberships` ADD CONSTRAINT `school_memberships_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `settings` ADD CONSTRAINT `settings_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `academic_sessions` ADD CONSTRAINT `academic_sessions_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `classes` ADD CONSTRAINT `classes_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sections` ADD CONSTRAINT `sections_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_sections` ADD CONSTRAINT `class_sections_schoolId_classId_fkey` FOREIGN KEY (`schoolId`, `classId`) REFERENCES `classes`(`schoolId`, `id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_sections` ADD CONSTRAINT `class_sections_schoolId_sectionId_fkey` FOREIGN KEY (`schoolId`, `sectionId`) REFERENCES `sections`(`schoolId`, `id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_sections` ADD CONSTRAINT `class_sections_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subjects` ADD CONSTRAINT `subjects_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subject_groups` ADD CONSTRAINT `subject_groups_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subject_groups` ADD CONSTRAINT `subject_groups_schoolId_classId_fkey` FOREIGN KEY (`schoolId`, `classId`) REFERENCES `classes`(`schoolId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subject_group_sections` ADD CONSTRAINT `subject_group_sections_schoolId_groupId_fkey` FOREIGN KEY (`schoolId`, `groupId`) REFERENCES `subject_groups`(`schoolId`, `id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subject_group_sections` ADD CONSTRAINT `subject_group_sections_schoolId_sectionId_fkey` FOREIGN KEY (`schoolId`, `sectionId`) REFERENCES `sections`(`schoolId`, `id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subject_group_sections` ADD CONSTRAINT `subject_group_sections_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subject_group_subjects` ADD CONSTRAINT `subject_group_subjects_schoolId_groupId_fkey` FOREIGN KEY (`schoolId`, `groupId`) REFERENCES `subject_groups`(`schoolId`, `id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subject_group_subjects` ADD CONSTRAINT `subject_group_subjects_schoolId_subjectId_fkey` FOREIGN KEY (`schoolId`, `subjectId`) REFERENCES `subjects`(`schoolId`, `id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subject_group_subjects` ADD CONSTRAINT `subject_group_subjects_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_categories` ADD CONSTRAINT `student_categories_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_houses` ADD CONSTRAINT `student_houses_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `disable_reasons` ADD CONSTRAINT `disable_reasons_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_schoolId_classId_fkey` FOREIGN KEY (`schoolId`, `classId`) REFERENCES `classes`(`schoolId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_schoolId_sectionId_fkey` FOREIGN KEY (`schoolId`, `sectionId`) REFERENCES `sections`(`schoolId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_schoolId_categoryId_fkey` FOREIGN KEY (`schoolId`, `categoryId`) REFERENCES `student_categories`(`schoolId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_schoolId_houseId_fkey` FOREIGN KEY (`schoolId`, `houseId`) REFERENCES `student_houses`(`schoolId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_schoolId_disReasonId_fkey` FOREIGN KEY (`schoolId`, `disReasonId`) REFERENCES `disable_reasons`(`schoolId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `counters` ADD CONSTRAINT `counters_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_groups` ADD CONSTRAINT `fee_groups_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_types` ADD CONSTRAINT `fee_types_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_discounts` ADD CONSTRAINT `fee_discounts_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_masters` ADD CONSTRAINT `fee_masters_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_masters` ADD CONSTRAINT `fee_masters_schoolId_groupId_fkey` FOREIGN KEY (`schoolId`, `groupId`) REFERENCES `fee_groups`(`schoolId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_masters` ADD CONSTRAINT `fee_masters_schoolId_typeId_fkey` FOREIGN KEY (`schoolId`, `typeId`) REFERENCES `fee_types`(`schoolId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_masters` ADD CONSTRAINT `fee_masters_schoolId_classId_fkey` FOREIGN KEY (`schoolId`, `classId`) REFERENCES `classes`(`schoolId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_schoolId_studentId_fkey` FOREIGN KEY (`schoolId`, `studentId`) REFERENCES `students`(`schoolId`, `id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `carry_forwards` ADD CONSTRAINT `carry_forwards_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `carry_forwards` ADD CONSTRAINT `carry_forwards_schoolId_studentId_fkey` FOREIGN KEY (`schoolId`, `studentId`) REFERENCES `students`(`schoolId`, `id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bank_payments` ADD CONSTRAINT `bank_payments_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bank_payments` ADD CONSTRAINT `bank_payments_schoolId_studentId_fkey` FOREIGN KEY (`schoolId`, `studentId`) REFERENCES `students`(`schoolId`, `id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_reminders` ADD CONSTRAINT `fee_reminders_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `departments` ADD CONSTRAINT `departments_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `designations` ADD CONSTRAINT `designations_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_types` ADD CONSTRAINT `leave_types_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staff` ADD CONSTRAINT `staff_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staff` ADD CONSTRAINT `staff_schoolId_desigId_fkey` FOREIGN KEY (`schoolId`, `desigId`) REFERENCES `designations`(`schoolId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staff` ADD CONSTRAINT `staff_schoolId_deptId_fkey` FOREIGN KEY (`schoolId`, `deptId`) REFERENCES `departments`(`schoolId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staff_leaves` ADD CONSTRAINT `staff_leaves_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staff_leaves` ADD CONSTRAINT `staff_leaves_schoolId_staffId_fkey` FOREIGN KEY (`schoolId`, `staffId`) REFERENCES `staff`(`schoolId`, `id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staff_leaves` ADD CONSTRAINT `staff_leaves_schoolId_typeId_fkey` FOREIGN KEY (`schoolId`, `typeId`) REFERENCES `leave_types`(`schoolId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staff_ratings` ADD CONSTRAINT `staff_ratings_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staff_ratings` ADD CONSTRAINT `staff_ratings_schoolId_staffId_fkey` FOREIGN KEY (`schoolId`, `staffId`) REFERENCES `staff`(`schoolId`, `id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payrolls` ADD CONSTRAINT `payrolls_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payrolls` ADD CONSTRAINT `payrolls_schoolId_staffId_fkey` FOREIGN KEY (`schoolId`, `staffId`) REFERENCES `staff`(`schoolId`, `id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staff_attendance` ADD CONSTRAINT `staff_attendance_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staff_attendance` ADD CONSTRAINT `staff_attendance_schoolId_staffId_fkey` FOREIGN KEY (`schoolId`, `staffId`) REFERENCES `staff`(`schoolId`, `id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_attendance` ADD CONSTRAINT `student_attendance_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_attendance` ADD CONSTRAINT `student_attendance_schoolId_studentId_fkey` FOREIGN KEY (`schoolId`, `studentId`) REFERENCES `students`(`schoolId`, `id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_leaves` ADD CONSTRAINT `student_leaves_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_leaves` ADD CONSTRAINT `student_leaves_schoolId_studentId_fkey` FOREIGN KEY (`schoolId`, `studentId`) REFERENCES `students`(`schoolId`, `id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `front_office_setup` ADD CONSTRAINT `front_office_setup_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `enquiries` ADD CONSTRAINT `enquiries_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `enquiries` ADD CONSTRAINT `enquiries_schoolId_classId_fkey` FOREIGN KEY (`schoolId`, `classId`) REFERENCES `classes`(`schoolId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `enquiries` ADD CONSTRAINT `enquiries_schoolId_sourceId_fkey` FOREIGN KEY (`schoolId`, `sourceId`) REFERENCES `front_office_setup`(`schoolId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visitors` ADD CONSTRAINT `visitors_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visitors` ADD CONSTRAINT `visitors_schoolId_purposeId_fkey` FOREIGN KEY (`schoolId`, `purposeId`) REFERENCES `front_office_setup`(`schoolId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `phone_calls` ADD CONSTRAINT `phone_calls_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `postal_dispatch` ADD CONSTRAINT `postal_dispatch_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `postal_receive` ADD CONSTRAINT `postal_receive_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `complaints` ADD CONSTRAINT `complaints_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `complaints` ADD CONSTRAINT `complaints_schoolId_typeId_fkey` FOREIGN KEY (`schoolId`, `typeId`) REFERENCES `front_office_setup`(`schoolId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `online_admissions` ADD CONSTRAINT `online_admissions_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `online_admissions` ADD CONSTRAINT `online_admissions_schoolId_classId_fkey` FOREIGN KEY (`schoolId`, `classId`) REFERENCES `classes`(`schoolId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `multi_class_students` ADD CONSTRAINT `multi_class_students_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `multi_class_students` ADD CONSTRAINT `multi_class_students_schoolId_studentId_fkey` FOREIGN KEY (`schoolId`, `studentId`) REFERENCES `students`(`schoolId`, `id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `multi_class_students` ADD CONSTRAINT `multi_class_students_schoolId_classId_fkey` FOREIGN KEY (`schoolId`, `classId`) REFERENCES `classes`(`schoolId`, `id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `multi_class_students` ADD CONSTRAINT `multi_class_students_schoolId_sectionId_fkey` FOREIGN KEY (`schoolId`, `sectionId`) REFERENCES `sections`(`schoolId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expense_heads` ADD CONSTRAINT `expense_heads_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_schoolId_headId_fkey` FOREIGN KEY (`schoolId`, `headId`) REFERENCES `expense_heads`(`schoolId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_groups` ADD CONSTRAINT `exam_groups_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_schedules` ADD CONSTRAINT `exam_schedules_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_schedules` ADD CONSTRAINT `exam_schedules_schoolId_groupId_fkey` FOREIGN KEY (`schoolId`, `groupId`) REFERENCES `exam_groups`(`schoolId`, `id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_schedules` ADD CONSTRAINT `exam_schedules_schoolId_classId_fkey` FOREIGN KEY (`schoolId`, `classId`) REFERENCES `classes`(`schoolId`, `id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_schedules` ADD CONSTRAINT `exam_schedules_schoolId_subjectId_fkey` FOREIGN KEY (`schoolId`, `subjectId`) REFERENCES `subjects`(`schoolId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_results` ADD CONSTRAINT `exam_results_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_results` ADD CONSTRAINT `exam_results_schoolId_schedId_fkey` FOREIGN KEY (`schoolId`, `schedId`) REFERENCES `exam_schedules`(`schoolId`, `id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_results` ADD CONSTRAINT `exam_results_schoolId_studentId_fkey` FOREIGN KEY (`schoolId`, `studentId`) REFERENCES `students`(`schoolId`, `id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grades` ADD CONSTRAINT `grades_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `divisions` ADD CONSTRAINT `divisions_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admit_templates` ADD CONSTRAINT `admit_templates_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mark_templates` ADD CONSTRAINT `mark_templates_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `online_exams` ADD CONSTRAINT `online_exams_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `online_exams` ADD CONSTRAINT `online_exams_schoolId_classId_fkey` FOREIGN KEY (`schoolId`, `classId`) REFERENCES `classes`(`schoolId`, `id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `online_exams` ADD CONSTRAINT `online_exams_schoolId_subjectId_fkey` FOREIGN KEY (`schoolId`, `subjectId`) REFERENCES `subjects`(`schoolId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questions` ADD CONSTRAINT `questions_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questions` ADD CONSTRAINT `questions_schoolId_classId_fkey` FOREIGN KEY (`schoolId`, `classId`) REFERENCES `classes`(`schoolId`, `id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questions` ADD CONSTRAINT `questions_schoolId_subjectId_fkey` FOREIGN KEY (`schoolId`, `subjectId`) REFERENCES `subjects`(`schoolId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `online_exam_results` ADD CONSTRAINT `online_exam_results_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `online_exam_results` ADD CONSTRAINT `online_exam_results_schoolId_examId_fkey` FOREIGN KEY (`schoolId`, `examId`) REFERENCES `online_exams`(`schoolId`, `id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `online_exam_results` ADD CONSTRAINT `online_exam_results_schoolId_studentId_fkey` FOREIGN KEY (`schoolId`, `studentId`) REFERENCES `students`(`schoolId`, `id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lessons` ADD CONSTRAINT `lessons_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lessons` ADD CONSTRAINT `lessons_schoolId_classId_fkey` FOREIGN KEY (`schoolId`, `classId`) REFERENCES `classes`(`schoolId`, `id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lessons` ADD CONSTRAINT `lessons_schoolId_subjectId_fkey` FOREIGN KEY (`schoolId`, `subjectId`) REFERENCES `subjects`(`schoolId`, `id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `topics` ADD CONSTRAINT `topics_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `topics` ADD CONSTRAINT `topics_schoolId_lessonId_fkey` FOREIGN KEY (`schoolId`, `lessonId`) REFERENCES `lessons`(`schoolId`, `id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lesson_plans` ADD CONSTRAINT `lesson_plans_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lesson_plans` ADD CONSTRAINT `lesson_plans_schoolId_classId_fkey` FOREIGN KEY (`schoolId`, `classId`) REFERENCES `classes`(`schoolId`, `id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lesson_plans` ADD CONSTRAINT `lesson_plans_schoolId_subjectId_fkey` FOREIGN KEY (`schoolId`, `subjectId`) REFERENCES `subjects`(`schoolId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lesson_plans` ADD CONSTRAINT `lesson_plans_schoolId_lessonId_fkey` FOREIGN KEY (`schoolId`, `lessonId`) REFERENCES `lessons`(`schoolId`, `id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lesson_plans` ADD CONSTRAINT `lesson_plans_schoolId_teacherId_fkey` FOREIGN KEY (`schoolId`, `teacherId`) REFERENCES `staff`(`schoolId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notices` ADD CONSTRAINT `notices_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `email_templates` ADD CONSTRAINT `email_templates_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sms_templates` ADD CONSTRAINT `sms_templates_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `scheduled_messages` ADD CONSTRAINT `scheduled_messages_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `message_logs` ADD CONSTRAINT `message_logs_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `content_types` ADD CONSTRAINT `content_types_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contents` ADD CONSTRAINT `contents_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contents` ADD CONSTRAINT `contents_schoolId_typeId_fkey` FOREIGN KEY (`schoolId`, `typeId`) REFERENCES `content_types`(`schoolId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contents` ADD CONSTRAINT `contents_schoolId_classId_fkey` FOREIGN KEY (`schoolId`, `classId`) REFERENCES `classes`(`schoolId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `homework` ADD CONSTRAINT `homework_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `homework` ADD CONSTRAINT `homework_schoolId_classId_fkey` FOREIGN KEY (`schoolId`, `classId`) REFERENCES `classes`(`schoolId`, `id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `homework` ADD CONSTRAINT `homework_schoolId_sectionId_fkey` FOREIGN KEY (`schoolId`, `sectionId`) REFERENCES `sections`(`schoolId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `homework` ADD CONSTRAINT `homework_schoolId_subjectId_fkey` FOREIGN KEY (`schoolId`, `subjectId`) REFERENCES `subjects`(`schoolId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `homework_submissions` ADD CONSTRAINT `homework_submissions_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `homework_submissions` ADD CONSTRAINT `homework_submissions_schoolId_homeworkId_fkey` FOREIGN KEY (`schoolId`, `homeworkId`) REFERENCES `homework`(`schoolId`, `id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `homework_submissions` ADD CONSTRAINT `homework_submissions_schoolId_studentId_fkey` FOREIGN KEY (`schoolId`, `studentId`) REFERENCES `students`(`schoolId`, `id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `school_events` ADD CONSTRAINT `school_events_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `books` ADD CONSTRAINT `books_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `library_members` ADD CONSTRAINT `library_members_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `book_issues` ADD CONSTRAINT `book_issues_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `book_issues` ADD CONSTRAINT `book_issues_schoolId_memberId_fkey` FOREIGN KEY (`schoolId`, `memberId`) REFERENCES `library_members`(`schoolId`, `id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `book_issues` ADD CONSTRAINT `book_issues_schoolId_bookId_fkey` FOREIGN KEY (`schoolId`, `bookId`) REFERENCES `books`(`schoolId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_categories` ADD CONSTRAINT `item_categories_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_stores` ADD CONSTRAINT `item_stores_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_suppliers` ADD CONSTRAINT `item_suppliers_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `items` ADD CONSTRAINT `items_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `items` ADD CONSTRAINT `items_schoolId_catId_fkey` FOREIGN KEY (`schoolId`, `catId`) REFERENCES `item_categories`(`schoolId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_stock` ADD CONSTRAINT `item_stock_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_stock` ADD CONSTRAINT `item_stock_schoolId_itemId_fkey` FOREIGN KEY (`schoolId`, `itemId`) REFERENCES `items`(`schoolId`, `id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_stock` ADD CONSTRAINT `item_stock_schoolId_supId_fkey` FOREIGN KEY (`schoolId`, `supId`) REFERENCES `item_suppliers`(`schoolId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_stock` ADD CONSTRAINT `item_stock_schoolId_storeId_fkey` FOREIGN KEY (`schoolId`, `storeId`) REFERENCES `item_stores`(`schoolId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_issues` ADD CONSTRAINT `item_issues_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_issues` ADD CONSTRAINT `item_issues_schoolId_itemId_fkey` FOREIGN KEY (`schoolId`, `itemId`) REFERENCES `items`(`schoolId`, `id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_issues` ADD CONSTRAINT `item_issues_schoolId_staffId_fkey` FOREIGN KEY (`schoolId`, `staffId`) REFERENCES `staff`(`schoolId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transport_routes` ADD CONSTRAINT `transport_routes_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vehicles` ADD CONSTRAINT `vehicles_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pickup_points` ADD CONSTRAINT `pickup_points_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `route_pickups` ADD CONSTRAINT `route_pickups_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `route_pickups` ADD CONSTRAINT `route_pickups_schoolId_routeId_fkey` FOREIGN KEY (`schoolId`, `routeId`) REFERENCES `transport_routes`(`schoolId`, `id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `route_pickups` ADD CONSTRAINT `route_pickups_schoolId_pickupId_fkey` FOREIGN KEY (`schoolId`, `pickupId`) REFERENCES `pickup_points`(`schoolId`, `id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vehicle_assignments` ADD CONSTRAINT `vehicle_assignments_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vehicle_assignments` ADD CONSTRAINT `vehicle_assignments_schoolId_routeId_fkey` FOREIGN KEY (`schoolId`, `routeId`) REFERENCES `transport_routes`(`schoolId`, `id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignment_vehicles` ADD CONSTRAINT `assignment_vehicles_schoolId_assignmentId_fkey` FOREIGN KEY (`schoolId`, `assignmentId`) REFERENCES `vehicle_assignments`(`schoolId`, `id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignment_vehicles` ADD CONSTRAINT `assignment_vehicles_schoolId_vehicleId_fkey` FOREIGN KEY (`schoolId`, `vehicleId`) REFERENCES `vehicles`(`schoolId`, `id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignment_vehicles` ADD CONSTRAINT `assignment_vehicles_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transport_fees` ADD CONSTRAINT `transport_fees_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transport_fees` ADD CONSTRAINT `transport_fees_schoolId_pickupId_fkey` FOREIGN KEY (`schoolId`, `pickupId`) REFERENCES `pickup_points`(`schoolId`, `id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transport_assignments` ADD CONSTRAINT `transport_assignments_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transport_assignments` ADD CONSTRAINT `transport_assignments_schoolId_studentId_fkey` FOREIGN KEY (`schoolId`, `studentId`) REFERENCES `students`(`schoolId`, `id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transport_assignments` ADD CONSTRAINT `transport_assignments_schoolId_routeId_fkey` FOREIGN KEY (`schoolId`, `routeId`) REFERENCES `transport_routes`(`schoolId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transport_assignments` ADD CONSTRAINT `transport_assignments_schoolId_pickupId_fkey` FOREIGN KEY (`schoolId`, `pickupId`) REFERENCES `pickup_points`(`schoolId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hostels` ADD CONSTRAINT `hostels_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `room_types` ADD CONSTRAINT `room_types_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rooms` ADD CONSTRAINT `rooms_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rooms` ADD CONSTRAINT `rooms_schoolId_hostelId_fkey` FOREIGN KEY (`schoolId`, `hostelId`) REFERENCES `hostels`(`schoolId`, `id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rooms` ADD CONSTRAINT `rooms_schoolId_typeId_fkey` FOREIGN KEY (`schoolId`, `typeId`) REFERENCES `room_types`(`schoolId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hostel_allocations` ADD CONSTRAINT `hostel_allocations_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hostel_allocations` ADD CONSTRAINT `hostel_allocations_schoolId_studentId_fkey` FOREIGN KEY (`schoolId`, `studentId`) REFERENCES `students`(`schoolId`, `id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hostel_allocations` ADD CONSTRAINT `hostel_allocations_schoolId_roomId_fkey` FOREIGN KEY (`schoolId`, `roomId`) REFERENCES `rooms`(`schoolId`, `id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `certificate_templates` ADD CONSTRAINT `certificate_templates_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `id_card_templates` ADD CONSTRAINT `id_card_templates_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alumni` ADD CONSTRAINT `alumni_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alumni_events` ADD CONSTRAINT `alumni_events_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `custom_fields` ADD CONSTRAINT `custom_fields_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `languages` ADD CONSTRAINT `languages_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `roles` ADD CONSTRAINT `roles_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `app_users` ADD CONSTRAINT `app_users_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `app_users` ADD CONSTRAINT `app_users_schoolId_role_fkey` FOREIGN KEY (`schoolId`, `role`) REFERENCES `roles`(`schoolId`, `name`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_logs` ADD CONSTRAINT `user_logs_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
