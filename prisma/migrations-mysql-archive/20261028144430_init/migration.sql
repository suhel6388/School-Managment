-- CreateTable
CREATE TABLE `settings` (
    `id` INTEGER NOT NULL DEFAULT 1,
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

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `academic_sessions` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(20) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `academic_sessions_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `classes` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(60) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `classes_order_idx`(`order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sections` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(30) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `class_sections` (
    `classId` VARCHAR(191) NOT NULL,
    `sectionId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`classId`, `sectionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subjects` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `code` VARCHAR(20) NULL,
    `type` VARCHAR(20) NOT NULL DEFAULT 'Theory',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subject_groups` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `classId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subject_group_sections` (
    `groupId` VARCHAR(191) NOT NULL,
    `sectionId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`groupId`, `sectionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subject_group_subjects` (
    `groupId` VARCHAR(191) NOT NULL,
    `subjectId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`groupId`, `subjectId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_categories` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(60) NOT NULL,
    `desc` TEXT NULL,

    UNIQUE INDEX `student_categories_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_houses` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(60) NOT NULL,
    `desc` TEXT NULL,

    UNIQUE INDEX `student_houses_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `disable_reasons` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `desc` TEXT NULL,

    UNIQUE INDEX `disable_reasons_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `students` (
    `id` VARCHAR(191) NOT NULL,
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
    `photo` LONGTEXT NULL,
    `status` VARCHAR(16) NOT NULL DEFAULT 'active',
    `portalPassword` VARCHAR(60) NULL,
    `custom` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `students_admNo_key`(`admNo`),
    INDEX `students_classId_sectionId_status_idx`(`classId`, `sectionId`, `status`),
    INDEX `students_name_idx`(`name`),
    INDEX `students_phone_idx`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `counters` (
    `key` VARCHAR(30) NOT NULL,
    `value` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fee_groups` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `desc` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `fee_groups_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fee_types` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `code` VARCHAR(20) NULL,
    `desc` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fee_discounts` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(20) NULL,
    `type` VARCHAR(12) NOT NULL DEFAULT 'Fixed',
    `amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fee_masters` (
    `id` VARCHAR(191) NOT NULL,
    `groupId` VARCHAR(191) NOT NULL,
    `typeId` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,
    `label` VARCHAR(80) NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `due` DATE NULL,
    `fine` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `fee_masters_classId_idx`(`classId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` VARCHAR(191) NOT NULL,
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

    UNIQUE INDEX `payments_rc_key`(`rc`),
    INDEX `payments_studentId_feeKey_idx`(`studentId`, `feeKey`),
    INDEX `payments_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `carry_forwards` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `fromSession` VARCHAR(20) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `due` DATE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `carry_forwards_studentId_idx`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bank_payments` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `bank` VARCHAR(120) NULL,
    `ref` VARCHAR(80) NOT NULL,
    `date` DATE NOT NULL DEFAULT (curdate()),
    `status` VARCHAR(20) NOT NULL DEFAULT 'Pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `bank_payments_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fee_reminders` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `kind` VARCHAR(20) NOT NULL,
    `days` INTEGER NOT NULL DEFAULT 0,
    `sms` BOOLEAN NOT NULL DEFAULT true,
    `email` BOOLEAN NOT NULL DEFAULT false,
    `wa` BOOLEAN NOT NULL DEFAULT false,
    `active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `departments` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `desc` TEXT NULL,

    UNIQUE INDEX `departments_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `designations` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `desc` TEXT NULL,

    UNIQUE INDEX `designations_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leave_types` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `days` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `staff` (
    `id` VARCHAR(191) NOT NULL,
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

    UNIQUE INDEX `staff_empId_key`(`empId`),
    INDEX `staff_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `staff_leaves` (
    `id` VARCHAR(191) NOT NULL,
    `staffId` VARCHAR(191) NOT NULL,
    `typeId` VARCHAR(191) NULL,
    `from` DATE NOT NULL,
    `to` DATE NOT NULL,
    `reason` TEXT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'Pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `staff_leaves_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `staff_ratings` (
    `id` VARCHAR(191) NOT NULL,
    `staffId` VARCHAR(191) NOT NULL,
    `rating` INTEGER NOT NULL,
    `by` VARCHAR(80) NULL,
    `comment` TEXT NULL,
    `date` DATE NOT NULL DEFAULT (curdate()),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payrolls` (
    `id` VARCHAR(191) NOT NULL,
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

    UNIQUE INDEX `payrolls_staffId_month_key`(`staffId`, `month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `staff_attendance` (
    `id` VARCHAR(191) NOT NULL,
    `staffId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'Present',
    `note` TEXT NULL,

    INDEX `staff_attendance_date_idx`(`date`),
    UNIQUE INDEX `staff_attendance_staffId_date_key`(`staffId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_attendance` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'Present',
    `note` TEXT NULL,

    INDEX `student_attendance_date_idx`(`date`),
    UNIQUE INDEX `student_attendance_studentId_date_key`(`studentId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_leaves` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `from` DATE NOT NULL,
    `to` DATE NOT NULL,
    `reason` TEXT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'Pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `student_leaves_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `front_office_setup` (
    `id` VARCHAR(191) NOT NULL,
    `kind` VARCHAR(20) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `desc` TEXT NULL,

    INDEX `front_office_setup_kind_idx`(`kind`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `enquiries` (
    `id` VARCHAR(191) NOT NULL,
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

    INDEX `enquiries_status_follow_idx`(`status`, `follow`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visitors` (
    `id` VARCHAR(191) NOT NULL,
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

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `phone_calls` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `date` DATE NOT NULL DEFAULT (curdate()),
    `type` VARCHAR(20) NOT NULL DEFAULT 'Incoming',
    `desc` TEXT NULL,
    `follow` DATE NULL,
    `duration` VARCHAR(40) NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `postal_dispatch` (
    `id` VARCHAR(191) NOT NULL,
    `toTitle` VARCHAR(120) NOT NULL,
    `refNo` VARCHAR(60) NULL,
    `address` TEXT NULL,
    `fromTitle` VARCHAR(120) NULL,
    `date` DATE NOT NULL DEFAULT (curdate()),
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `postal_receive` (
    `id` VARCHAR(191) NOT NULL,
    `fromTitle` VARCHAR(120) NOT NULL,
    `refNo` VARCHAR(60) NULL,
    `address` TEXT NULL,
    `toTitle` VARCHAR(120) NULL,
    `date` DATE NOT NULL DEFAULT (curdate()),
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `complaints` (
    `id` VARCHAR(191) NOT NULL,
    `typeId` VARCHAR(191) NULL,
    `by` VARCHAR(120) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `date` DATE NOT NULL DEFAULT (curdate()),
    `desc` TEXT NULL,
    `action` TEXT NULL,
    `note` TEXT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'Pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `complaints_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `online_admissions` (
    `id` VARCHAR(191) NOT NULL,
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

    INDEX `online_admissions_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `multi_class_students` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,
    `sectionId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `multi_class_students_studentId_classId_key`(`studentId`, `classId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expense_heads` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `desc` TEXT NULL,

    UNIQUE INDEX `expense_heads_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expenses` (
    `id` VARCHAR(191) NOT NULL,
    `headId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `invoice` VARCHAR(60) NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `date` DATE NOT NULL,
    `mode` VARCHAR(30) NOT NULL DEFAULT 'Cash',
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `expenses_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_groups` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `session` VARCHAR(20) NOT NULL,
    `desc` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_schedules` (
    `id` VARCHAR(191) NOT NULL,
    `groupId` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,
    `subjectId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `time` VARCHAR(5) NULL,
    `room` VARCHAR(60) NULL,
    `max` INTEGER NOT NULL DEFAULT 50,
    `pass` INTEGER NOT NULL DEFAULT 17,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `exam_schedules_groupId_classId_idx`(`groupId`, `classId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_results` (
    `id` VARCHAR(191) NOT NULL,
    `schedId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `marks` DECIMAL(6, 2) NOT NULL DEFAULT 0,
    `absent` BOOLEAN NOT NULL DEFAULT false,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `exam_results_schedId_studentId_key`(`schedId`, `studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `grades` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(10) NOT NULL,
    `from` DECIMAL(5, 2) NOT NULL,
    `to` DECIMAL(5, 2) NOT NULL,
    `point` INTEGER NOT NULL DEFAULT 0,
    `remark` VARCHAR(120) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `divisions` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(40) NOT NULL,
    `from` DECIMAL(5, 2) NOT NULL,
    `to` DECIMAL(5, 2) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admit_templates` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `title` VARCHAR(80) NOT NULL DEFAULT 'ADMIT CARD',
    `exam` VARCHAR(150) NULL,
    `instructions` TEXT NULL,
    `sign` VARCHAR(80) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mark_templates` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `title` VARCHAR(80) NOT NULL DEFAULT 'REPORT CARD',
    `remarks` TEXT NULL,
    `signL` VARCHAR(80) NULL,
    `signR` VARCHAR(80) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `online_exams` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,
    `subjectId` VARCHAR(191) NOT NULL,
    `start` DATE NULL,
    `end` DATE NULL,
    `duration` INTEGER NOT NULL DEFAULT 10,
    `passPct` INTEGER NOT NULL DEFAULT 40,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `questions` (
    `id` VARCHAR(191) NOT NULL,
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

    INDEX `questions_classId_subjectId_idx`(`classId`, `subjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `online_exam_results` (
    `id` VARCHAR(191) NOT NULL,
    `examId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `score` INTEGER NOT NULL DEFAULT 0,
    `total` INTEGER NOT NULL DEFAULT 0,
    `pct` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `date` DATE NOT NULL DEFAULT (curdate()),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lessons` (
    `id` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,
    `subjectId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `lessons_classId_subjectId_idx`(`classId`, `subjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `topics` (
    `id` VARCHAR(191) NOT NULL,
    `lessonId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `planDate` DATE NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'Pending',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lesson_plans` (
    `id` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,
    `subjectId` VARCHAR(191) NOT NULL,
    `lessonId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `teacherId` VARCHAR(191) NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notices` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `msg` TEXT NOT NULL,
    `date` DATE NOT NULL DEFAULT (curdate()),
    `audience` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_templates` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `body` TEXT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sms_templates` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `body` TEXT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `scheduled_messages` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `channel` VARCHAR(20) NOT NULL,
    `audience` VARCHAR(40) NOT NULL,
    `date` DATE NOT NULL,
    `time` VARCHAR(5) NULL,
    `msg` TEXT NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'Scheduled',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `message_logs` (
    `id` VARCHAR(191) NOT NULL,
    `time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `channel` VARCHAR(20) NOT NULL,
    `to` VARCHAR(180) NOT NULL,
    `phone` VARCHAR(180) NULL,
    `subject` VARCHAR(200) NULL,
    `body` TEXT NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'Logged',

    INDEX `message_logs_time_idx`(`time`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `content_types` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `desc` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contents` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `typeId` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NULL,
    `date` DATE NOT NULL DEFAULT (curdate()),
    `valid` DATE NULL,
    `url` VARCHAR(500) NULL,
    `file` LONGTEXT NULL,
    `fileName` VARCHAR(200) NULL,
    `desc` TEXT NULL,
    `shared` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `homework` (
    `id` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,
    `sectionId` VARCHAR(191) NULL,
    `subjectId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL DEFAULT (curdate()),
    `due` DATE NOT NULL,
    `desc` TEXT NOT NULL,
    `max` INTEGER NOT NULL DEFAULT 10,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `homework_submissions` (
    `id` VARCHAR(191) NOT NULL,
    `homeworkId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `done` BOOLEAN NOT NULL DEFAULT false,
    `marks` INTEGER NULL,

    UNIQUE INDEX `homework_submissions_homeworkId_studentId_key`(`homeworkId`, `studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `school_events` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `date` DATE NOT NULL,
    `time` VARCHAR(5) NULL,
    `place` VARCHAR(150) NULL,
    `note` TEXT NULL,

    INDEX `school_events_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `books` (
    `id` VARCHAR(191) NOT NULL,
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

    INDEX `books_title_idx`(`title`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `library_members` (
    `id` VARCHAR(191) NOT NULL,
    `kind` VARCHAR(16) NOT NULL,
    `refId` VARCHAR(40) NOT NULL,
    `card` VARCHAR(40) NOT NULL,

    UNIQUE INDEX `library_members_card_key`(`card`),
    INDEX `library_members_kind_refId_idx`(`kind`, `refId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `book_issues` (
    `id` VARCHAR(191) NOT NULL,
    `memberId` VARCHAR(191) NOT NULL,
    `bookId` VARCHAR(191) NOT NULL,
    `issue` DATE NOT NULL,
    `due` DATE NOT NULL,
    `ret` DATE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `book_issues_bookId_ret_idx`(`bookId`, `ret`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `item_categories` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `desc` TEXT NULL,

    UNIQUE INDEX `item_categories_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `item_stores` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(20) NULL,
    `desc` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `item_suppliers` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `contact` VARCHAR(120) NULL,
    `phone` VARCHAR(20) NULL,
    `address` TEXT NULL,
    `desc` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `items` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `catId` VARCHAR(191) NOT NULL,
    `unit` VARCHAR(30) NULL,
    `desc` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `item_stock` (
    `id` VARCHAR(191) NOT NULL,
    `itemId` VARCHAR(191) NOT NULL,
    `supId` VARCHAR(191) NULL,
    `storeId` VARCHAR(191) NULL,
    `qty` INTEGER NOT NULL DEFAULT 0,
    `price` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `date` DATE NOT NULL DEFAULT (curdate()),
    `purchaseNo` VARCHAR(60) NULL,
    `desc` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `item_stock_itemId_idx`(`itemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `item_issues` (
    `id` VARCHAR(191) NOT NULL,
    `itemId` VARCHAR(191) NOT NULL,
    `staffId` VARCHAR(191) NULL,
    `qty` INTEGER NOT NULL,
    `issue` DATE NOT NULL,
    `ret` DATE NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'Issued',
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `item_issues_itemId_status_idx`(`itemId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transport_routes` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `desc` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vehicles` (
    `id` VARCHAR(191) NOT NULL,
    `number` VARCHAR(40) NOT NULL,
    `model` VARCHAR(80) NULL,
    `year` VARCHAR(10) NULL,
    `driver` VARCHAR(120) NULL,
    `phone` VARCHAR(20) NULL,
    `licence` VARCHAR(40) NULL,
    `capacity` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `vehicles_number_key`(`number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pickup_points` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(150) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `route_pickups` (
    `id` VARCHAR(191) NOT NULL,
    `routeId` VARCHAR(191) NOT NULL,
    `pickupId` VARCHAR(191) NOT NULL,
    `time` VARCHAR(5) NULL,

    UNIQUE INDEX `route_pickups_routeId_pickupId_key`(`routeId`, `pickupId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vehicle_assignments` (
    `id` VARCHAR(191) NOT NULL,
    `routeId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assignment_vehicles` (
    `assignmentId` VARCHAR(191) NOT NULL,
    `vehicleId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`assignmentId`, `vehicleId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transport_fees` (
    `id` VARCHAR(191) NOT NULL,
    `pickupId` VARCHAR(191) NOT NULL,
    `monthlyFee` DECIMAL(12, 2) NOT NULL,
    `months` INTEGER NOT NULL DEFAULT 10,
    `fine` DECIMAL(12, 2) NOT NULL DEFAULT 0,

    UNIQUE INDEX `transport_fees_pickupId_key`(`pickupId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transport_assignments` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `routeId` VARCHAR(191) NOT NULL,
    `pickupId` VARCHAR(191) NOT NULL,
    `due` DATE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `transport_assignments_studentId_pickupId_key`(`studentId`, `pickupId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hostels` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `type` VARCHAR(20) NULL,
    `address` VARCHAR(200) NULL,
    `intake` INTEGER NOT NULL DEFAULT 0,
    `desc` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `room_types` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(60) NOT NULL,
    `desc` TEXT NULL,

    UNIQUE INDEX `room_types_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rooms` (
    `id` VARCHAR(191) NOT NULL,
    `hostelId` VARCHAR(191) NOT NULL,
    `typeId` VARCHAR(191) NOT NULL,
    `roomNo` VARCHAR(30) NOT NULL,
    `beds` INTEGER NOT NULL DEFAULT 1,
    `cost` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `desc` TEXT NULL,

    UNIQUE INDEX `rooms_hostelId_roomNo_key`(`hostelId`, `roomNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hostel_allocations` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `roomId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL DEFAULT (curdate()),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `hostel_allocations_studentId_key`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `certificate_templates` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `body` TEXT NOT NULL,
    `foot` VARCHAR(80) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `id_card_templates` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `color` VARCHAR(20) NOT NULL DEFAULT '#1d3a8a',
    `validity` VARCHAR(80) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `alumni` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `year` VARCHAR(10) NULL,
    `occupation` VARCHAR(120) NULL,
    `phone` VARCHAR(20) NULL,
    `email` VARCHAR(150) NULL,
    `address` TEXT NULL,
    `note` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `alumni_events` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `from` DATE NOT NULL,
    `to` DATE NULL,
    `place` VARCHAR(150) NULL,
    `note` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `custom_fields` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `for` VARCHAR(30) NOT NULL DEFAULT 'Student',
    `type` VARCHAR(20) NOT NULL DEFAULT 'Text',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `languages` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(60) NOT NULL,
    `code` VARCHAR(10) NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `languages_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Role` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(40) NOT NULL,
    `perms` JSON NOT NULL,

    UNIQUE INDEX `Role_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `app_users` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `username` VARCHAR(64) NOT NULL,
    `passwordHash` VARCHAR(200) NOT NULL,
    `role` VARCHAR(40) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `app_users_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(191) NOT NULL,
    `time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `user` VARCHAR(64) NOT NULL,
    `act` VARCHAR(40) NOT NULL,
    `entity` VARCHAR(80) NOT NULL,
    `description` TEXT NULL,

    INDEX `audit_logs_time_idx`(`time`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_logs` (
    `id` VARCHAR(191) NOT NULL,
    `time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `user` VARCHAR(64) NOT NULL,
    `act` VARCHAR(80) NOT NULL,

    INDEX `user_logs_time_idx`(`time`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `class_sections` ADD CONSTRAINT `class_sections_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_sections` ADD CONSTRAINT `class_sections_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `sections`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subject_groups` ADD CONSTRAINT `subject_groups_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subject_group_sections` ADD CONSTRAINT `subject_group_sections_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `subject_groups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subject_group_sections` ADD CONSTRAINT `subject_group_sections_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `sections`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subject_group_subjects` ADD CONSTRAINT `subject_group_subjects_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `subject_groups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subject_group_subjects` ADD CONSTRAINT `subject_group_subjects_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `sections`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `student_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_houseId_fkey` FOREIGN KEY (`houseId`) REFERENCES `student_houses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_disReasonId_fkey` FOREIGN KEY (`disReasonId`) REFERENCES `disable_reasons`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_masters` ADD CONSTRAINT `fee_masters_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `fee_groups`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_masters` ADD CONSTRAINT `fee_masters_typeId_fkey` FOREIGN KEY (`typeId`) REFERENCES `fee_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_masters` ADD CONSTRAINT `fee_masters_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `carry_forwards` ADD CONSTRAINT `carry_forwards_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bank_payments` ADD CONSTRAINT `bank_payments_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staff` ADD CONSTRAINT `staff_desigId_fkey` FOREIGN KEY (`desigId`) REFERENCES `designations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staff` ADD CONSTRAINT `staff_deptId_fkey` FOREIGN KEY (`deptId`) REFERENCES `departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staff_leaves` ADD CONSTRAINT `staff_leaves_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staff_leaves` ADD CONSTRAINT `staff_leaves_typeId_fkey` FOREIGN KEY (`typeId`) REFERENCES `leave_types`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staff_ratings` ADD CONSTRAINT `staff_ratings_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payrolls` ADD CONSTRAINT `payrolls_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staff_attendance` ADD CONSTRAINT `staff_attendance_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_attendance` ADD CONSTRAINT `student_attendance_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_leaves` ADD CONSTRAINT `student_leaves_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `enquiries` ADD CONSTRAINT `enquiries_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `enquiries` ADD CONSTRAINT `enquiries_sourceId_fkey` FOREIGN KEY (`sourceId`) REFERENCES `front_office_setup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visitors` ADD CONSTRAINT `visitors_purposeId_fkey` FOREIGN KEY (`purposeId`) REFERENCES `front_office_setup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `complaints` ADD CONSTRAINT `complaints_typeId_fkey` FOREIGN KEY (`typeId`) REFERENCES `front_office_setup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `online_admissions` ADD CONSTRAINT `online_admissions_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `multi_class_students` ADD CONSTRAINT `multi_class_students_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `multi_class_students` ADD CONSTRAINT `multi_class_students_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `multi_class_students` ADD CONSTRAINT `multi_class_students_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `sections`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_headId_fkey` FOREIGN KEY (`headId`) REFERENCES `expense_heads`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_schedules` ADD CONSTRAINT `exam_schedules_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `exam_groups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_schedules` ADD CONSTRAINT `exam_schedules_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_schedules` ADD CONSTRAINT `exam_schedules_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_results` ADD CONSTRAINT `exam_results_schedId_fkey` FOREIGN KEY (`schedId`) REFERENCES `exam_schedules`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_results` ADD CONSTRAINT `exam_results_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `online_exams` ADD CONSTRAINT `online_exams_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `online_exams` ADD CONSTRAINT `online_exams_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questions` ADD CONSTRAINT `questions_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questions` ADD CONSTRAINT `questions_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `online_exam_results` ADD CONSTRAINT `online_exam_results_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `online_exams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `online_exam_results` ADD CONSTRAINT `online_exam_results_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lessons` ADD CONSTRAINT `lessons_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lessons` ADD CONSTRAINT `lessons_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `topics` ADD CONSTRAINT `topics_lessonId_fkey` FOREIGN KEY (`lessonId`) REFERENCES `lessons`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lesson_plans` ADD CONSTRAINT `lesson_plans_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lesson_plans` ADD CONSTRAINT `lesson_plans_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lesson_plans` ADD CONSTRAINT `lesson_plans_lessonId_fkey` FOREIGN KEY (`lessonId`) REFERENCES `lessons`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lesson_plans` ADD CONSTRAINT `lesson_plans_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contents` ADD CONSTRAINT `contents_typeId_fkey` FOREIGN KEY (`typeId`) REFERENCES `content_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contents` ADD CONSTRAINT `contents_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `homework` ADD CONSTRAINT `homework_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `homework` ADD CONSTRAINT `homework_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `sections`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `homework` ADD CONSTRAINT `homework_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `homework_submissions` ADD CONSTRAINT `homework_submissions_homeworkId_fkey` FOREIGN KEY (`homeworkId`) REFERENCES `homework`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `homework_submissions` ADD CONSTRAINT `homework_submissions_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `book_issues` ADD CONSTRAINT `book_issues_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `library_members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `book_issues` ADD CONSTRAINT `book_issues_bookId_fkey` FOREIGN KEY (`bookId`) REFERENCES `books`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `items` ADD CONSTRAINT `items_catId_fkey` FOREIGN KEY (`catId`) REFERENCES `item_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_stock` ADD CONSTRAINT `item_stock_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_stock` ADD CONSTRAINT `item_stock_supId_fkey` FOREIGN KEY (`supId`) REFERENCES `item_suppliers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_stock` ADD CONSTRAINT `item_stock_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `item_stores`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_issues` ADD CONSTRAINT `item_issues_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_issues` ADD CONSTRAINT `item_issues_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `route_pickups` ADD CONSTRAINT `route_pickups_routeId_fkey` FOREIGN KEY (`routeId`) REFERENCES `transport_routes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `route_pickups` ADD CONSTRAINT `route_pickups_pickupId_fkey` FOREIGN KEY (`pickupId`) REFERENCES `pickup_points`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vehicle_assignments` ADD CONSTRAINT `vehicle_assignments_routeId_fkey` FOREIGN KEY (`routeId`) REFERENCES `transport_routes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignment_vehicles` ADD CONSTRAINT `assignment_vehicles_assignmentId_fkey` FOREIGN KEY (`assignmentId`) REFERENCES `vehicle_assignments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignment_vehicles` ADD CONSTRAINT `assignment_vehicles_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `vehicles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transport_fees` ADD CONSTRAINT `transport_fees_pickupId_fkey` FOREIGN KEY (`pickupId`) REFERENCES `pickup_points`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transport_assignments` ADD CONSTRAINT `transport_assignments_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transport_assignments` ADD CONSTRAINT `transport_assignments_routeId_fkey` FOREIGN KEY (`routeId`) REFERENCES `transport_routes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transport_assignments` ADD CONSTRAINT `transport_assignments_pickupId_fkey` FOREIGN KEY (`pickupId`) REFERENCES `pickup_points`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rooms` ADD CONSTRAINT `rooms_hostelId_fkey` FOREIGN KEY (`hostelId`) REFERENCES `hostels`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rooms` ADD CONSTRAINT `rooms_typeId_fkey` FOREIGN KEY (`typeId`) REFERENCES `room_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hostel_allocations` ADD CONSTRAINT `hostel_allocations_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hostel_allocations` ADD CONSTRAINT `hostel_allocations_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `rooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `app_users` ADD CONSTRAINT `app_users_role_fkey` FOREIGN KEY (`role`) REFERENCES `Role`(`name`) ON DELETE RESTRICT ON UPDATE CASCADE;
