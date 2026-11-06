-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "schools" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "email" VARCHAR(150),
    "phone" VARCHAR(40),
    "address" TEXT,
    "logo" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "subscriptionPlan" VARCHAR(40) NOT NULL DEFAULT 'free',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(180) NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" VARCHAR(64),
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" VARCHAR(180) NOT NULL,
    "providerId" VARCHAR(80) NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" VARCHAR(255) NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_memberships" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" VARCHAR(40) NOT NULL DEFAULT 'member',
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" SERIAL NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "address" TEXT,
    "phone" VARCHAR(40),
    "email" VARCHAR(150),
    "session" VARCHAR(20) NOT NULL DEFAULT '2026-27',
    "headerText" VARCHAR(150),
    "footerText" TEXT,
    "captcha" BOOLEAN NOT NULL DEFAULT false,
    "waMessage" TEXT,
    "fileTypes" TEXT,
    "planName" VARCHAR(60),
    "planExpires" DATE,
    "profilePhone" BOOLEAN NOT NULL DEFAULT true,
    "profileAddr" BOOLEAN NOT NULL DEFAULT true,
    "profileEmail" BOOLEAN NOT NULL DEFAULT true,
    "profilePhoto" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_sessions" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" VARCHAR(20) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academic_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sections" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" VARCHAR(30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_sections" (
    "classId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "class_sections_pkey" PRIMARY KEY ("classId","sectionId")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "code" VARCHAR(20),
    "type" VARCHAR(20) NOT NULL DEFAULT 'Theory',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject_groups" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "classId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subject_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject_group_sections" (
    "groupId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "subject_group_sections_pkey" PRIMARY KEY ("groupId","sectionId")
);

-- CreateTable
CREATE TABLE "subject_group_subjects" (
    "groupId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "subject_group_subjects_pkey" PRIMARY KEY ("groupId","subjectId")
);

-- CreateTable
CREATE TABLE "student_categories" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "desc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_houses" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "desc" TEXT,

    CONSTRAINT "student_houses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disable_reasons" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "desc" TEXT,

    CONSTRAINT "disable_reasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "admNo" VARCHAR(32) NOT NULL,
    "rollNo" VARCHAR(20),
    "name" VARCHAR(120) NOT NULL,
    "gender" VARCHAR(16) NOT NULL DEFAULT 'Male',
    "classId" TEXT,
    "sectionId" TEXT,
    "dob" DATE,
    "admDate" DATE NOT NULL DEFAULT CURRENT_DATE,
    "categoryId" TEXT,
    "houseId" TEXT,
    "disReasonId" TEXT,
    "father" VARCHAR(120),
    "mother" VARCHAR(120),
    "phone" VARCHAR(20),
    "email" VARCHAR(150),
    "address" TEXT,
    "photo" TEXT,
    "status" VARCHAR(16) NOT NULL DEFAULT 'active',
    "portalPassword" VARCHAR(60),
    "custom" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "counters" (
    "schoolId" TEXT NOT NULL,
    "key" VARCHAR(30) NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "counters_pkey" PRIMARY KEY ("schoolId","key")
);

-- CreateTable
CREATE TABLE "fee_groups" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "desc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fee_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_types" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "code" VARCHAR(20),
    "desc" TEXT,

    CONSTRAINT "fee_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_discounts" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(20),
    "type" VARCHAR(12) NOT NULL DEFAULT 'Fixed',
    "amount" DECIMAL(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT "fee_discounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_masters" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "typeId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "label" VARCHAR(80),
    "amount" DECIMAL(12,2) NOT NULL,
    "due" DATE,
    "fine" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fee_masters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "rc" VARCHAR(32) NOT NULL,
    "studentId" TEXT NOT NULL,
    "feeKey" VARCHAR(80) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "fine" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "mode" VARCHAR(30) NOT NULL,
    "date" DATE NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carry_forwards" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "fromSession" VARCHAR(20) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "due" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "carry_forwards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_payments" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "bank" VARCHAR(120),
    "ref" VARCHAR(80) NOT NULL,
    "date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "status" VARCHAR(20) NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_reminders" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "kind" VARCHAR(20) NOT NULL,
    "days" INTEGER NOT NULL DEFAULT 0,
    "sms" BOOLEAN NOT NULL DEFAULT true,
    "email" BOOLEAN NOT NULL DEFAULT false,
    "wa" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "fee_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "desc" TEXT,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "designations" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "desc" TEXT,

    CONSTRAINT "designations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_types" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "days" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "leave_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "empId" VARCHAR(32) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "desigId" TEXT,
    "deptId" TEXT,
    "gender" VARCHAR(16),
    "phone" VARCHAR(20),
    "email" VARCHAR(150),
    "joinDate" DATE,
    "basic" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" VARCHAR(16) NOT NULL DEFAULT 'active',
    "address" TEXT,
    "qual" VARCHAR(120),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_leaves" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "typeId" TEXT,
    "from" DATE NOT NULL,
    "to" DATE NOT NULL,
    "reason" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_leaves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_ratings" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "by" VARCHAR(80),
    "comment" TEXT,
    "date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payrolls" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "month" VARCHAR(7) NOT NULL,
    "basic" DECIMAL(12,2) NOT NULL,
    "allow" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "deduct" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "net" DECIMAL(12,2) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'Generated',
    "paidDate" DATE,
    "mode" VARCHAR(30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payrolls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_attendance" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'Present',
    "note" TEXT,

    CONSTRAINT "staff_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_attendance" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'Present',
    "note" TEXT,

    CONSTRAINT "student_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_leaves" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "from" DATE NOT NULL,
    "to" DATE NOT NULL,
    "reason" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_leaves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "front_office_setup" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "kind" VARCHAR(20) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "desc" TEXT,

    CONSTRAINT "front_office_setup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enquiries" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "email" VARCHAR(150),
    "address" TEXT,
    "desc" TEXT,
    "classId" TEXT,
    "sourceId" TEXT,
    "date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "follow" DATE,
    "note" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitors" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "purposeId" TEXT,
    "name" VARCHAR(120) NOT NULL,
    "phone" VARCHAR(20),
    "idCard" VARCHAR(60),
    "persons" INTEGER NOT NULL DEFAULT 1,
    "date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "inTime" VARCHAR(5),
    "outTime" VARCHAR(5),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phone_calls" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "type" VARCHAR(20) NOT NULL DEFAULT 'Incoming',
    "desc" TEXT,
    "follow" DATE,
    "duration" VARCHAR(40),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phone_calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postal_dispatch" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "toTitle" VARCHAR(120) NOT NULL,
    "refNo" VARCHAR(60),
    "address" TEXT,
    "fromTitle" VARCHAR(120),
    "date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "postal_dispatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postal_receive" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "fromTitle" VARCHAR(120) NOT NULL,
    "refNo" VARCHAR(60),
    "address" TEXT,
    "toTitle" VARCHAR(120),
    "date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "postal_receive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaints" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "typeId" TEXT,
    "by" VARCHAR(120) NOT NULL,
    "phone" VARCHAR(20),
    "date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "desc" TEXT,
    "action" TEXT,
    "note" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "complaints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "online_admissions" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "classId" TEXT,
    "gender" VARCHAR(16),
    "dob" DATE,
    "father" VARCHAR(120),
    "phone" VARCHAR(20) NOT NULL,
    "email" VARCHAR(150),
    "address" TEXT,
    "date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "status" VARCHAR(20) NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "online_admissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "multi_class_students" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "sectionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "multi_class_students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_heads" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "desc" TEXT,

    CONSTRAINT "expense_heads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "headId" TEXT NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "invoice" VARCHAR(60),
    "amount" DECIMAL(12,2) NOT NULL,
    "date" DATE NOT NULL,
    "mode" VARCHAR(30) NOT NULL DEFAULT 'Cash',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_groups" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "session" VARCHAR(20) NOT NULL,
    "desc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_schedules" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "time" VARCHAR(5),
    "room" VARCHAR(60),
    "max" INTEGER NOT NULL DEFAULT 50,
    "pass" INTEGER NOT NULL DEFAULT 17,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_results" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "schedId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "marks" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "absent" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grades" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" VARCHAR(10) NOT NULL,
    "from" DECIMAL(5,2) NOT NULL,
    "to" DECIMAL(5,2) NOT NULL,
    "point" INTEGER NOT NULL DEFAULT 0,
    "remark" VARCHAR(120),

    CONSTRAINT "grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "divisions" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" VARCHAR(40) NOT NULL,
    "from" DECIMAL(5,2) NOT NULL,
    "to" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "divisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admit_templates" (
    "id" SERIAL NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" VARCHAR(80) NOT NULL DEFAULT 'ADMIT CARD',
    "exam" VARCHAR(150),
    "instructions" TEXT,
    "sign" VARCHAR(80),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admit_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mark_templates" (
    "id" SERIAL NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" VARCHAR(80) NOT NULL DEFAULT 'REPORT CARD',
    "remarks" TEXT,
    "signL" VARCHAR(80),
    "signR" VARCHAR(80),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mark_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "online_exams" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "start" DATE,
    "end" DATE,
    "duration" INTEGER NOT NULL DEFAULT 10,
    "passPct" INTEGER NOT NULL DEFAULT 40,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "online_exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "a" VARCHAR(255) NOT NULL,
    "b" VARCHAR(255) NOT NULL,
    "c" VARCHAR(255),
    "d" VARCHAR(255),
    "ans" VARCHAR(1) NOT NULL,
    "marks" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "online_exam_results" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "pct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "date" DATE NOT NULL DEFAULT CURRENT_DATE,

    CONSTRAINT "online_exam_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topics" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "planDate" DATE,
    "status" VARCHAR(20) NOT NULL DEFAULT 'Pending',

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_plans" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "teacherId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notices" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "msg" TEXT NOT NULL,
    "date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "audience" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_templates" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "body" TEXT NOT NULL,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sms_templates" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "body" TEXT NOT NULL,

    CONSTRAINT "sms_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_messages" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "channel" VARCHAR(20) NOT NULL,
    "audience" VARCHAR(40) NOT NULL,
    "date" DATE NOT NULL,
    "time" VARCHAR(5),
    "msg" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'Scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scheduled_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_logs" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "channel" VARCHAR(20) NOT NULL,
    "to" VARCHAR(180) NOT NULL,
    "phone" VARCHAR(180),
    "subject" VARCHAR(200),
    "body" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'Logged',

    CONSTRAINT "message_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_types" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "desc" TEXT,

    CONSTRAINT "content_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contents" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "typeId" TEXT NOT NULL,
    "classId" TEXT,
    "date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "valid" DATE,
    "url" VARCHAR(500),
    "file" TEXT,
    "fileName" VARCHAR(200),
    "desc" TEXT,
    "shared" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homework" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "sectionId" TEXT,
    "subjectId" TEXT NOT NULL,
    "date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "due" DATE NOT NULL,
    "desc" TEXT NOT NULL,
    "max" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "homework_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homework_submissions" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "homeworkId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "marks" INTEGER,

    CONSTRAINT "homework_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_events" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "date" DATE NOT NULL,
    "time" VARCHAR(5),
    "place" VARCHAR(150),
    "note" TEXT,

    CONSTRAINT "school_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "books" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "no" VARCHAR(40),
    "isbn" VARCHAR(40),
    "publisher" VARCHAR(120),
    "author" VARCHAR(120),
    "subject" VARCHAR(80),
    "rack" VARCHAR(20),
    "qty" INTEGER NOT NULL DEFAULT 1,
    "price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "date" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_members" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "kind" VARCHAR(16) NOT NULL,
    "refId" VARCHAR(40) NOT NULL,
    "card" VARCHAR(40) NOT NULL,

    CONSTRAINT "library_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_issues" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "issue" DATE NOT NULL,
    "due" DATE NOT NULL,
    "ret" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "book_issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_categories" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "desc" TEXT,

    CONSTRAINT "item_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_stores" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(20),
    "desc" TEXT,

    CONSTRAINT "item_stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_suppliers" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "contact" VARCHAR(120),
    "phone" VARCHAR(20),
    "address" TEXT,
    "desc" TEXT,

    CONSTRAINT "item_suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "catId" TEXT NOT NULL,
    "unit" VARCHAR(30),
    "desc" TEXT,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_stock" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "supId" TEXT,
    "storeId" TEXT,
    "qty" INTEGER NOT NULL DEFAULT 0,
    "price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "purchaseNo" VARCHAR(60),
    "desc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_issues" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "staffId" TEXT,
    "qty" INTEGER NOT NULL,
    "issue" DATE NOT NULL,
    "ret" DATE,
    "status" VARCHAR(20) NOT NULL DEFAULT 'Issued',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_routes" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "desc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transport_routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "number" VARCHAR(40) NOT NULL,
    "model" VARCHAR(80),
    "year" VARCHAR(10),
    "driver" VARCHAR(120),
    "phone" VARCHAR(20),
    "licence" VARCHAR(40),
    "capacity" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pickup_points" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" VARCHAR(150) NOT NULL,

    CONSTRAINT "pickup_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_pickups" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "pickupId" TEXT NOT NULL,
    "time" VARCHAR(5),

    CONSTRAINT "route_pickups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_assignments" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,

    CONSTRAINT "vehicle_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment_vehicles" (
    "assignmentId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "assignment_vehicles_pkey" PRIMARY KEY ("assignmentId","vehicleId")
);

-- CreateTable
CREATE TABLE "transport_fees" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "pickupId" TEXT NOT NULL,
    "monthlyFee" DECIMAL(12,2) NOT NULL,
    "months" INTEGER NOT NULL DEFAULT 10,
    "fine" DECIMAL(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT "transport_fees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_assignments" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "pickupId" TEXT NOT NULL,
    "due" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transport_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostels" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "type" VARCHAR(20),
    "address" VARCHAR(200),
    "intake" INTEGER NOT NULL DEFAULT 0,
    "desc" TEXT,

    CONSTRAINT "hostels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_types" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "desc" TEXT,

    CONSTRAINT "room_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "typeId" TEXT NOT NULL,
    "roomNo" VARCHAR(30) NOT NULL,
    "beds" INTEGER NOT NULL DEFAULT 1,
    "cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "desc" TEXT,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel_allocations" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hostel_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificate_templates" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "body" TEXT NOT NULL,
    "foot" VARCHAR(80),

    CONSTRAINT "certificate_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "id_card_templates" (
    "id" SERIAL NOT NULL,
    "schoolId" TEXT NOT NULL,
    "color" VARCHAR(20) NOT NULL DEFAULT '#1d3a8a',
    "validity" VARCHAR(80),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "id_card_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alumni" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "year" VARCHAR(10),
    "occupation" VARCHAR(120),
    "phone" VARCHAR(20),
    "email" VARCHAR(150),
    "address" TEXT,
    "note" TEXT,

    CONSTRAINT "alumni_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alumni_events" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "from" DATE NOT NULL,
    "to" DATE,
    "place" VARCHAR(150),
    "note" TEXT,

    CONSTRAINT "alumni_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_fields" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "for" VARCHAR(30) NOT NULL DEFAULT 'Student',
    "type" VARCHAR(20) NOT NULL DEFAULT 'Text',

    CONSTRAINT "custom_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "languages" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" VARCHAR(40) NOT NULL,
    "perms" JSONB NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_users" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "username" VARCHAR(64) NOT NULL,
    "passwordHash" VARCHAR(200) NOT NULL,
    "role" VARCHAR(40) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user" VARCHAR(64) NOT NULL,
    "act" VARCHAR(40) NOT NULL,
    "entity" VARCHAR(80) NOT NULL,
    "description" TEXT,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_logs" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user" VARCHAR(64) NOT NULL,
    "act" VARCHAR(80) NOT NULL,

    CONSTRAINT "user_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "schools_slug_key" ON "schools"("slug");

-- CreateIndex
CREATE INDEX "schools_status_idx" ON "schools"("status");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "account_providerId_accountId_key" ON "account"("providerId", "accountId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE INDEX "school_memberships_schoolId_status_idx" ON "school_memberships"("schoolId", "status");

-- CreateIndex
CREATE INDEX "school_memberships_userId_idx" ON "school_memberships"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "school_memberships_schoolId_userId_key" ON "school_memberships"("schoolId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "settings_schoolId_key" ON "settings"("schoolId");

-- CreateIndex
CREATE INDEX "academic_sessions_schoolId_idx" ON "academic_sessions"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "academic_sessions_schoolId_name_key" ON "academic_sessions"("schoolId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "academic_sessions_schoolId_id_key" ON "academic_sessions"("schoolId", "id");

-- CreateIndex
CREATE INDEX "classes_schoolId_idx" ON "classes"("schoolId");

-- CreateIndex
CREATE INDEX "classes_order_idx" ON "classes"("order");

-- CreateIndex
CREATE UNIQUE INDEX "classes_schoolId_id_key" ON "classes"("schoolId", "id");

-- CreateIndex
CREATE INDEX "sections_schoolId_idx" ON "sections"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "sections_schoolId_id_key" ON "sections"("schoolId", "id");

-- CreateIndex
CREATE INDEX "class_sections_schoolId_idx" ON "class_sections"("schoolId");

-- CreateIndex
CREATE INDEX "subjects_schoolId_idx" ON "subjects"("schoolId");

-- CreateIndex
CREATE INDEX "subjects_schoolId_name_idx" ON "subjects"("schoolId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_schoolId_id_key" ON "subjects"("schoolId", "id");

-- CreateIndex
CREATE INDEX "subject_groups_schoolId_idx" ON "subject_groups"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "subject_groups_schoolId_id_key" ON "subject_groups"("schoolId", "id");

-- CreateIndex
CREATE INDEX "subject_group_sections_schoolId_idx" ON "subject_group_sections"("schoolId");

-- CreateIndex
CREATE INDEX "subject_group_subjects_schoolId_idx" ON "subject_group_subjects"("schoolId");

-- CreateIndex
CREATE INDEX "student_categories_schoolId_idx" ON "student_categories"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "student_categories_schoolId_name_key" ON "student_categories"("schoolId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "student_categories_schoolId_id_key" ON "student_categories"("schoolId", "id");

-- CreateIndex
CREATE INDEX "student_houses_schoolId_idx" ON "student_houses"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "student_houses_schoolId_name_key" ON "student_houses"("schoolId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "student_houses_schoolId_id_key" ON "student_houses"("schoolId", "id");

-- CreateIndex
CREATE INDEX "disable_reasons_schoolId_idx" ON "disable_reasons"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "disable_reasons_schoolId_name_key" ON "disable_reasons"("schoolId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "disable_reasons_schoolId_id_key" ON "disable_reasons"("schoolId", "id");

-- CreateIndex
CREATE INDEX "students_schoolId_idx" ON "students"("schoolId");

-- CreateIndex
CREATE INDEX "students_schoolId_status_idx" ON "students"("schoolId", "status");

-- CreateIndex
CREATE INDEX "students_classId_sectionId_status_idx" ON "students"("classId", "sectionId", "status");

-- CreateIndex
CREATE INDEX "students_name_idx" ON "students"("name");

-- CreateIndex
CREATE INDEX "students_phone_idx" ON "students"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "students_schoolId_admNo_key" ON "students"("schoolId", "admNo");

-- CreateIndex
CREATE UNIQUE INDEX "students_schoolId_id_key" ON "students"("schoolId", "id");

-- CreateIndex
CREATE INDEX "fee_groups_schoolId_idx" ON "fee_groups"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "fee_groups_schoolId_name_key" ON "fee_groups"("schoolId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "fee_groups_schoolId_id_key" ON "fee_groups"("schoolId", "id");

-- CreateIndex
CREATE INDEX "fee_types_schoolId_idx" ON "fee_types"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "fee_types_schoolId_id_key" ON "fee_types"("schoolId", "id");

-- CreateIndex
CREATE INDEX "fee_discounts_schoolId_idx" ON "fee_discounts"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "fee_discounts_schoolId_id_key" ON "fee_discounts"("schoolId", "id");

-- CreateIndex
CREATE INDEX "fee_masters_schoolId_idx" ON "fee_masters"("schoolId");

-- CreateIndex
CREATE INDEX "fee_masters_classId_idx" ON "fee_masters"("classId");

-- CreateIndex
CREATE UNIQUE INDEX "fee_masters_schoolId_id_key" ON "fee_masters"("schoolId", "id");

-- CreateIndex
CREATE INDEX "payments_schoolId_idx" ON "payments"("schoolId");

-- CreateIndex
CREATE INDEX "payments_schoolId_date_idx" ON "payments"("schoolId", "date");

-- CreateIndex
CREATE INDEX "payments_studentId_feeKey_idx" ON "payments"("studentId", "feeKey");

-- CreateIndex
CREATE INDEX "payments_date_idx" ON "payments"("date");

-- CreateIndex
CREATE UNIQUE INDEX "payments_schoolId_rc_key" ON "payments"("schoolId", "rc");

-- CreateIndex
CREATE UNIQUE INDEX "payments_schoolId_id_key" ON "payments"("schoolId", "id");

-- CreateIndex
CREATE INDEX "carry_forwards_schoolId_idx" ON "carry_forwards"("schoolId");

-- CreateIndex
CREATE INDEX "carry_forwards_studentId_idx" ON "carry_forwards"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "carry_forwards_schoolId_id_key" ON "carry_forwards"("schoolId", "id");

-- CreateIndex
CREATE INDEX "bank_payments_schoolId_idx" ON "bank_payments"("schoolId");

-- CreateIndex
CREATE INDEX "bank_payments_status_idx" ON "bank_payments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "bank_payments_schoolId_id_key" ON "bank_payments"("schoolId", "id");

-- CreateIndex
CREATE INDEX "fee_reminders_schoolId_idx" ON "fee_reminders"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "fee_reminders_schoolId_id_key" ON "fee_reminders"("schoolId", "id");

-- CreateIndex
CREATE INDEX "departments_schoolId_idx" ON "departments"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "departments_schoolId_name_key" ON "departments"("schoolId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "departments_schoolId_id_key" ON "departments"("schoolId", "id");

-- CreateIndex
CREATE INDEX "designations_schoolId_idx" ON "designations"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "designations_schoolId_name_key" ON "designations"("schoolId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "designations_schoolId_id_key" ON "designations"("schoolId", "id");

-- CreateIndex
CREATE INDEX "leave_types_schoolId_idx" ON "leave_types"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "leave_types_schoolId_id_key" ON "leave_types"("schoolId", "id");

-- CreateIndex
CREATE INDEX "staff_schoolId_idx" ON "staff"("schoolId");

-- CreateIndex
CREATE INDEX "staff_status_idx" ON "staff"("status");

-- CreateIndex
CREATE UNIQUE INDEX "staff_schoolId_empId_key" ON "staff"("schoolId", "empId");

-- CreateIndex
CREATE UNIQUE INDEX "staff_schoolId_id_key" ON "staff"("schoolId", "id");

-- CreateIndex
CREATE INDEX "staff_leaves_schoolId_idx" ON "staff_leaves"("schoolId");

-- CreateIndex
CREATE INDEX "staff_leaves_status_idx" ON "staff_leaves"("status");

-- CreateIndex
CREATE UNIQUE INDEX "staff_leaves_schoolId_id_key" ON "staff_leaves"("schoolId", "id");

-- CreateIndex
CREATE INDEX "staff_ratings_schoolId_idx" ON "staff_ratings"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "staff_ratings_schoolId_id_key" ON "staff_ratings"("schoolId", "id");

-- CreateIndex
CREATE INDEX "payrolls_schoolId_idx" ON "payrolls"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "payrolls_schoolId_staffId_month_key" ON "payrolls"("schoolId", "staffId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "payrolls_schoolId_id_key" ON "payrolls"("schoolId", "id");

-- CreateIndex
CREATE INDEX "staff_attendance_schoolId_idx" ON "staff_attendance"("schoolId");

-- CreateIndex
CREATE INDEX "staff_attendance_date_idx" ON "staff_attendance"("date");

-- CreateIndex
CREATE UNIQUE INDEX "staff_attendance_schoolId_staffId_date_key" ON "staff_attendance"("schoolId", "staffId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "staff_attendance_schoolId_id_key" ON "staff_attendance"("schoolId", "id");

-- CreateIndex
CREATE INDEX "student_attendance_schoolId_idx" ON "student_attendance"("schoolId");

-- CreateIndex
CREATE INDEX "student_attendance_date_idx" ON "student_attendance"("date");

-- CreateIndex
CREATE UNIQUE INDEX "student_attendance_schoolId_studentId_date_key" ON "student_attendance"("schoolId", "studentId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "student_attendance_schoolId_id_key" ON "student_attendance"("schoolId", "id");

-- CreateIndex
CREATE INDEX "student_leaves_schoolId_idx" ON "student_leaves"("schoolId");

-- CreateIndex
CREATE INDEX "student_leaves_status_idx" ON "student_leaves"("status");

-- CreateIndex
CREATE UNIQUE INDEX "student_leaves_schoolId_id_key" ON "student_leaves"("schoolId", "id");

-- CreateIndex
CREATE INDEX "front_office_setup_schoolId_idx" ON "front_office_setup"("schoolId");

-- CreateIndex
CREATE INDEX "front_office_setup_kind_idx" ON "front_office_setup"("kind");

-- CreateIndex
CREATE UNIQUE INDEX "front_office_setup_schoolId_id_key" ON "front_office_setup"("schoolId", "id");

-- CreateIndex
CREATE INDEX "enquiries_schoolId_idx" ON "enquiries"("schoolId");

-- CreateIndex
CREATE INDEX "enquiries_status_follow_idx" ON "enquiries"("status", "follow");

-- CreateIndex
CREATE UNIQUE INDEX "enquiries_schoolId_id_key" ON "enquiries"("schoolId", "id");

-- CreateIndex
CREATE INDEX "visitors_schoolId_idx" ON "visitors"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "visitors_schoolId_id_key" ON "visitors"("schoolId", "id");

-- CreateIndex
CREATE INDEX "phone_calls_schoolId_idx" ON "phone_calls"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "phone_calls_schoolId_id_key" ON "phone_calls"("schoolId", "id");

-- CreateIndex
CREATE INDEX "postal_dispatch_schoolId_idx" ON "postal_dispatch"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "postal_dispatch_schoolId_id_key" ON "postal_dispatch"("schoolId", "id");

-- CreateIndex
CREATE INDEX "postal_receive_schoolId_idx" ON "postal_receive"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "postal_receive_schoolId_id_key" ON "postal_receive"("schoolId", "id");

-- CreateIndex
CREATE INDEX "complaints_schoolId_idx" ON "complaints"("schoolId");

-- CreateIndex
CREATE INDEX "complaints_status_idx" ON "complaints"("status");

-- CreateIndex
CREATE UNIQUE INDEX "complaints_schoolId_id_key" ON "complaints"("schoolId", "id");

-- CreateIndex
CREATE INDEX "online_admissions_schoolId_idx" ON "online_admissions"("schoolId");

-- CreateIndex
CREATE INDEX "online_admissions_status_idx" ON "online_admissions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "online_admissions_schoolId_id_key" ON "online_admissions"("schoolId", "id");

-- CreateIndex
CREATE INDEX "multi_class_students_schoolId_idx" ON "multi_class_students"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "multi_class_students_schoolId_studentId_classId_key" ON "multi_class_students"("schoolId", "studentId", "classId");

-- CreateIndex
CREATE UNIQUE INDEX "multi_class_students_schoolId_id_key" ON "multi_class_students"("schoolId", "id");

-- CreateIndex
CREATE INDEX "expense_heads_schoolId_idx" ON "expense_heads"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "expense_heads_schoolId_name_key" ON "expense_heads"("schoolId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "expense_heads_schoolId_id_key" ON "expense_heads"("schoolId", "id");

-- CreateIndex
CREATE INDEX "expenses_schoolId_idx" ON "expenses"("schoolId");

-- CreateIndex
CREATE INDEX "expenses_date_idx" ON "expenses"("date");

-- CreateIndex
CREATE UNIQUE INDEX "expenses_schoolId_id_key" ON "expenses"("schoolId", "id");

-- CreateIndex
CREATE INDEX "exam_groups_schoolId_idx" ON "exam_groups"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "exam_groups_schoolId_id_key" ON "exam_groups"("schoolId", "id");

-- CreateIndex
CREATE INDEX "exam_schedules_schoolId_idx" ON "exam_schedules"("schoolId");

-- CreateIndex
CREATE INDEX "exam_schedules_groupId_classId_idx" ON "exam_schedules"("groupId", "classId");

-- CreateIndex
CREATE UNIQUE INDEX "exam_schedules_schoolId_id_key" ON "exam_schedules"("schoolId", "id");

-- CreateIndex
CREATE INDEX "exam_results_schoolId_idx" ON "exam_results"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "exam_results_schoolId_schedId_studentId_key" ON "exam_results"("schoolId", "schedId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "exam_results_schoolId_id_key" ON "exam_results"("schoolId", "id");

-- CreateIndex
CREATE INDEX "grades_schoolId_idx" ON "grades"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "grades_schoolId_id_key" ON "grades"("schoolId", "id");

-- CreateIndex
CREATE INDEX "divisions_schoolId_idx" ON "divisions"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "divisions_schoolId_id_key" ON "divisions"("schoolId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "admit_templates_schoolId_key" ON "admit_templates"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "mark_templates_schoolId_key" ON "mark_templates"("schoolId");

-- CreateIndex
CREATE INDEX "online_exams_schoolId_idx" ON "online_exams"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "online_exams_schoolId_id_key" ON "online_exams"("schoolId", "id");

-- CreateIndex
CREATE INDEX "questions_schoolId_idx" ON "questions"("schoolId");

-- CreateIndex
CREATE INDEX "questions_classId_subjectId_idx" ON "questions"("classId", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "questions_schoolId_id_key" ON "questions"("schoolId", "id");

-- CreateIndex
CREATE INDEX "online_exam_results_schoolId_idx" ON "online_exam_results"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "online_exam_results_schoolId_id_key" ON "online_exam_results"("schoolId", "id");

-- CreateIndex
CREATE INDEX "lessons_schoolId_idx" ON "lessons"("schoolId");

-- CreateIndex
CREATE INDEX "lessons_classId_subjectId_idx" ON "lessons"("classId", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "lessons_schoolId_id_key" ON "lessons"("schoolId", "id");

-- CreateIndex
CREATE INDEX "topics_schoolId_idx" ON "topics"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "topics_schoolId_id_key" ON "topics"("schoolId", "id");

-- CreateIndex
CREATE INDEX "lesson_plans_schoolId_idx" ON "lesson_plans"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_plans_schoolId_id_key" ON "lesson_plans"("schoolId", "id");

-- CreateIndex
CREATE INDEX "notices_schoolId_idx" ON "notices"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "notices_schoolId_id_key" ON "notices"("schoolId", "id");

-- CreateIndex
CREATE INDEX "email_templates_schoolId_idx" ON "email_templates"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_schoolId_id_key" ON "email_templates"("schoolId", "id");

-- CreateIndex
CREATE INDEX "sms_templates_schoolId_idx" ON "sms_templates"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "sms_templates_schoolId_id_key" ON "sms_templates"("schoolId", "id");

-- CreateIndex
CREATE INDEX "scheduled_messages_schoolId_idx" ON "scheduled_messages"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "scheduled_messages_schoolId_id_key" ON "scheduled_messages"("schoolId", "id");

-- CreateIndex
CREATE INDEX "message_logs_schoolId_idx" ON "message_logs"("schoolId");

-- CreateIndex
CREATE INDEX "message_logs_time_idx" ON "message_logs"("time");

-- CreateIndex
CREATE UNIQUE INDEX "message_logs_schoolId_id_key" ON "message_logs"("schoolId", "id");

-- CreateIndex
CREATE INDEX "content_types_schoolId_idx" ON "content_types"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "content_types_schoolId_id_key" ON "content_types"("schoolId", "id");

-- CreateIndex
CREATE INDEX "contents_schoolId_idx" ON "contents"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "contents_schoolId_id_key" ON "contents"("schoolId", "id");

-- CreateIndex
CREATE INDEX "homework_schoolId_idx" ON "homework"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "homework_schoolId_id_key" ON "homework"("schoolId", "id");

-- CreateIndex
CREATE INDEX "homework_submissions_schoolId_idx" ON "homework_submissions"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "homework_submissions_schoolId_homeworkId_studentId_key" ON "homework_submissions"("schoolId", "homeworkId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "homework_submissions_schoolId_id_key" ON "homework_submissions"("schoolId", "id");

-- CreateIndex
CREATE INDEX "school_events_schoolId_idx" ON "school_events"("schoolId");

-- CreateIndex
CREATE INDEX "school_events_date_idx" ON "school_events"("date");

-- CreateIndex
CREATE UNIQUE INDEX "school_events_schoolId_id_key" ON "school_events"("schoolId", "id");

-- CreateIndex
CREATE INDEX "books_schoolId_idx" ON "books"("schoolId");

-- CreateIndex
CREATE INDEX "books_title_idx" ON "books"("title");

-- CreateIndex
CREATE UNIQUE INDEX "books_schoolId_id_key" ON "books"("schoolId", "id");

-- CreateIndex
CREATE INDEX "library_members_schoolId_idx" ON "library_members"("schoolId");

-- CreateIndex
CREATE INDEX "library_members_kind_refId_idx" ON "library_members"("kind", "refId");

-- CreateIndex
CREATE UNIQUE INDEX "library_members_schoolId_card_key" ON "library_members"("schoolId", "card");

-- CreateIndex
CREATE UNIQUE INDEX "library_members_schoolId_id_key" ON "library_members"("schoolId", "id");

-- CreateIndex
CREATE INDEX "book_issues_schoolId_idx" ON "book_issues"("schoolId");

-- CreateIndex
CREATE INDEX "book_issues_bookId_ret_idx" ON "book_issues"("bookId", "ret");

-- CreateIndex
CREATE UNIQUE INDEX "book_issues_schoolId_id_key" ON "book_issues"("schoolId", "id");

-- CreateIndex
CREATE INDEX "item_categories_schoolId_idx" ON "item_categories"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "item_categories_schoolId_name_key" ON "item_categories"("schoolId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "item_categories_schoolId_id_key" ON "item_categories"("schoolId", "id");

-- CreateIndex
CREATE INDEX "item_stores_schoolId_idx" ON "item_stores"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "item_stores_schoolId_id_key" ON "item_stores"("schoolId", "id");

-- CreateIndex
CREATE INDEX "item_suppliers_schoolId_idx" ON "item_suppliers"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "item_suppliers_schoolId_id_key" ON "item_suppliers"("schoolId", "id");

-- CreateIndex
CREATE INDEX "items_schoolId_idx" ON "items"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "items_schoolId_id_key" ON "items"("schoolId", "id");

-- CreateIndex
CREATE INDEX "item_stock_schoolId_idx" ON "item_stock"("schoolId");

-- CreateIndex
CREATE INDEX "item_stock_itemId_idx" ON "item_stock"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "item_stock_schoolId_id_key" ON "item_stock"("schoolId", "id");

-- CreateIndex
CREATE INDEX "item_issues_schoolId_idx" ON "item_issues"("schoolId");

-- CreateIndex
CREATE INDEX "item_issues_itemId_status_idx" ON "item_issues"("itemId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "item_issues_schoolId_id_key" ON "item_issues"("schoolId", "id");

-- CreateIndex
CREATE INDEX "transport_routes_schoolId_idx" ON "transport_routes"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "transport_routes_schoolId_id_key" ON "transport_routes"("schoolId", "id");

-- CreateIndex
CREATE INDEX "vehicles_schoolId_idx" ON "vehicles"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_schoolId_number_key" ON "vehicles"("schoolId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_schoolId_id_key" ON "vehicles"("schoolId", "id");

-- CreateIndex
CREATE INDEX "pickup_points_schoolId_idx" ON "pickup_points"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "pickup_points_schoolId_id_key" ON "pickup_points"("schoolId", "id");

-- CreateIndex
CREATE INDEX "route_pickups_schoolId_idx" ON "route_pickups"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "route_pickups_schoolId_routeId_pickupId_key" ON "route_pickups"("schoolId", "routeId", "pickupId");

-- CreateIndex
CREATE UNIQUE INDEX "route_pickups_schoolId_id_key" ON "route_pickups"("schoolId", "id");

-- CreateIndex
CREATE INDEX "vehicle_assignments_schoolId_idx" ON "vehicle_assignments"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_assignments_schoolId_id_key" ON "vehicle_assignments"("schoolId", "id");

-- CreateIndex
CREATE INDEX "assignment_vehicles_schoolId_idx" ON "assignment_vehicles"("schoolId");

-- CreateIndex
CREATE INDEX "transport_fees_schoolId_idx" ON "transport_fees"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "transport_fees_schoolId_pickupId_key" ON "transport_fees"("schoolId", "pickupId");

-- CreateIndex
CREATE UNIQUE INDEX "transport_fees_schoolId_id_key" ON "transport_fees"("schoolId", "id");

-- CreateIndex
CREATE INDEX "transport_assignments_schoolId_idx" ON "transport_assignments"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "transport_assignments_schoolId_studentId_pickupId_key" ON "transport_assignments"("schoolId", "studentId", "pickupId");

-- CreateIndex
CREATE UNIQUE INDEX "transport_assignments_schoolId_id_key" ON "transport_assignments"("schoolId", "id");

-- CreateIndex
CREATE INDEX "hostels_schoolId_idx" ON "hostels"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "hostels_schoolId_id_key" ON "hostels"("schoolId", "id");

-- CreateIndex
CREATE INDEX "room_types_schoolId_idx" ON "room_types"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "room_types_schoolId_name_key" ON "room_types"("schoolId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "room_types_schoolId_id_key" ON "room_types"("schoolId", "id");

-- CreateIndex
CREATE INDEX "rooms_schoolId_idx" ON "rooms"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_schoolId_hostelId_roomNo_key" ON "rooms"("schoolId", "hostelId", "roomNo");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_schoolId_id_key" ON "rooms"("schoolId", "id");

-- CreateIndex
CREATE INDEX "hostel_allocations_schoolId_idx" ON "hostel_allocations"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "hostel_allocations_schoolId_studentId_key" ON "hostel_allocations"("schoolId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "hostel_allocations_schoolId_id_key" ON "hostel_allocations"("schoolId", "id");

-- CreateIndex
CREATE INDEX "certificate_templates_schoolId_idx" ON "certificate_templates"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "certificate_templates_schoolId_id_key" ON "certificate_templates"("schoolId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "id_card_templates_schoolId_key" ON "id_card_templates"("schoolId");

-- CreateIndex
CREATE INDEX "alumni_schoolId_idx" ON "alumni"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "alumni_schoolId_id_key" ON "alumni"("schoolId", "id");

-- CreateIndex
CREATE INDEX "alumni_events_schoolId_idx" ON "alumni_events"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "alumni_events_schoolId_id_key" ON "alumni_events"("schoolId", "id");

-- CreateIndex
CREATE INDEX "custom_fields_schoolId_idx" ON "custom_fields"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "custom_fields_schoolId_id_key" ON "custom_fields"("schoolId", "id");

-- CreateIndex
CREATE INDEX "languages_schoolId_idx" ON "languages"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "languages_schoolId_code_key" ON "languages"("schoolId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "languages_schoolId_id_key" ON "languages"("schoolId", "id");

-- CreateIndex
CREATE INDEX "roles_schoolId_idx" ON "roles"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "roles_schoolId_name_key" ON "roles"("schoolId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "roles_schoolId_id_key" ON "roles"("schoolId", "id");

-- CreateIndex
CREATE INDEX "app_users_schoolId_idx" ON "app_users"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "app_users_schoolId_username_key" ON "app_users"("schoolId", "username");

-- CreateIndex
CREATE UNIQUE INDEX "app_users_schoolId_id_key" ON "app_users"("schoolId", "id");

-- CreateIndex
CREATE INDEX "audit_logs_schoolId_idx" ON "audit_logs"("schoolId");

-- CreateIndex
CREATE INDEX "audit_logs_time_idx" ON "audit_logs"("time");

-- CreateIndex
CREATE UNIQUE INDEX "audit_logs_schoolId_id_key" ON "audit_logs"("schoolId", "id");

-- CreateIndex
CREATE INDEX "user_logs_schoolId_idx" ON "user_logs"("schoolId");

-- CreateIndex
CREATE INDEX "user_logs_time_idx" ON "user_logs"("time");

-- CreateIndex
CREATE UNIQUE INDEX "user_logs_schoolId_id_key" ON "user_logs"("schoolId", "id");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_memberships" ADD CONSTRAINT "school_memberships_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_memberships" ADD CONSTRAINT "school_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_sessions" ADD CONSTRAINT "academic_sessions_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_sections" ADD CONSTRAINT "class_sections_schoolId_classId_fkey" FOREIGN KEY ("schoolId", "classId") REFERENCES "classes"("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_sections" ADD CONSTRAINT "class_sections_schoolId_sectionId_fkey" FOREIGN KEY ("schoolId", "sectionId") REFERENCES "sections"("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_sections" ADD CONSTRAINT "class_sections_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_groups" ADD CONSTRAINT "subject_groups_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_groups" ADD CONSTRAINT "subject_groups_schoolId_classId_fkey" FOREIGN KEY ("schoolId", "classId") REFERENCES "classes"("schoolId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_group_sections" ADD CONSTRAINT "subject_group_sections_schoolId_groupId_fkey" FOREIGN KEY ("schoolId", "groupId") REFERENCES "subject_groups"("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_group_sections" ADD CONSTRAINT "subject_group_sections_schoolId_sectionId_fkey" FOREIGN KEY ("schoolId", "sectionId") REFERENCES "sections"("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_group_sections" ADD CONSTRAINT "subject_group_sections_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_group_subjects" ADD CONSTRAINT "subject_group_subjects_schoolId_groupId_fkey" FOREIGN KEY ("schoolId", "groupId") REFERENCES "subject_groups"("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_group_subjects" ADD CONSTRAINT "subject_group_subjects_schoolId_subjectId_fkey" FOREIGN KEY ("schoolId", "subjectId") REFERENCES "subjects"("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_group_subjects" ADD CONSTRAINT "subject_group_subjects_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_categories" ADD CONSTRAINT "student_categories_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_houses" ADD CONSTRAINT "student_houses_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disable_reasons" ADD CONSTRAINT "disable_reasons_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_schoolId_classId_fkey" FOREIGN KEY ("schoolId", "classId") REFERENCES "classes"("schoolId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_schoolId_sectionId_fkey" FOREIGN KEY ("schoolId", "sectionId") REFERENCES "sections"("schoolId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_schoolId_categoryId_fkey" FOREIGN KEY ("schoolId", "categoryId") REFERENCES "student_categories"("schoolId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_schoolId_houseId_fkey" FOREIGN KEY ("schoolId", "houseId") REFERENCES "student_houses"("schoolId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_schoolId_disReasonId_fkey" FOREIGN KEY ("schoolId", "disReasonId") REFERENCES "disable_reasons"("schoolId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counters" ADD CONSTRAINT "counters_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_groups" ADD CONSTRAINT "fee_groups_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_types" ADD CONSTRAINT "fee_types_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_discounts" ADD CONSTRAINT "fee_discounts_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_masters" ADD CONSTRAINT "fee_masters_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_masters" ADD CONSTRAINT "fee_masters_schoolId_groupId_fkey" FOREIGN KEY ("schoolId", "groupId") REFERENCES "fee_groups"("schoolId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_masters" ADD CONSTRAINT "fee_masters_schoolId_typeId_fkey" FOREIGN KEY ("schoolId", "typeId") REFERENCES "fee_types"("schoolId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_masters" ADD CONSTRAINT "fee_masters_schoolId_classId_fkey" FOREIGN KEY ("schoolId", "classId") REFERENCES "classes"("schoolId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_schoolId_studentId_fkey" FOREIGN KEY ("schoolId", "studentId") REFERENCES "students"("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carry_forwards" ADD CONSTRAINT "carry_forwards_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carry_forwards" ADD CONSTRAINT "carry_forwards_schoolId_studentId_fkey" FOREIGN KEY ("schoolId", "studentId") REFERENCES "students"("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_payments" ADD CONSTRAINT "bank_payments_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_payments" ADD CONSTRAINT "bank_payments_schoolId_studentId_fkey" FOREIGN KEY ("schoolId", "studentId") REFERENCES "students"("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_reminders" ADD CONSTRAINT "fee_reminders_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "designations" ADD CONSTRAINT "designations_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_types" ADD CONSTRAINT "leave_types_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_schoolId_desigId_fkey" FOREIGN KEY ("schoolId", "desigId") REFERENCES "designations"("schoolId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_schoolId_deptId_fkey" FOREIGN KEY ("schoolId", "deptId") REFERENCES "departments"("schoolId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_leaves" ADD CONSTRAINT "staff_leaves_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_leaves" ADD CONSTRAINT "staff_leaves_schoolId_staffId_fkey" FOREIGN KEY ("schoolId", "staffId") REFERENCES "staff"("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_leaves" ADD CONSTRAINT "staff_leaves_schoolId_typeId_fkey" FOREIGN KEY ("schoolId", "typeId") REFERENCES "leave_types"("schoolId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_ratings" ADD CONSTRAINT "staff_ratings_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_ratings" ADD CONSTRAINT "staff_ratings_schoolId_staffId_fkey" FOREIGN KEY ("schoolId", "staffId") REFERENCES "staff"("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_schoolId_staffId_fkey" FOREIGN KEY ("schoolId", "staffId") REFERENCES "staff"("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_attendance" ADD CONSTRAINT "staff_attendance_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_attendance" ADD CONSTRAINT "staff_attendance_schoolId_staffId_fkey" FOREIGN KEY ("schoolId", "staffId") REFERENCES "staff"("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_attendance" ADD CONSTRAINT "student_attendance_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_attendance" ADD CONSTRAINT "student_attendance_schoolId_studentId_fkey" FOREIGN KEY ("schoolId", "studentId") REFERENCES "students"("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_leaves" ADD CONSTRAINT "student_leaves_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_leaves" ADD CONSTRAINT "student_leaves_schoolId_studentId_fkey" FOREIGN KEY ("schoolId", "studentId") REFERENCES "students"("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "front_office_setup" ADD CONSTRAINT "front_office_setup_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_schoolId_classId_fkey" FOREIGN KEY ("schoolId", "classId") REFERENCES "classes"("schoolId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_schoolId_sourceId_fkey" FOREIGN KEY ("schoolId", "sourceId") REFERENCES "front_office_setup"("schoolId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitors" ADD CONSTRAINT "visitors_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitors" ADD CONSTRAINT "visitors_schoolId_purposeId_fkey" FOREIGN KEY ("schoolId", "purposeId") REFERENCES "front_office_setup"("schoolId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phone_calls" ADD CONSTRAINT "phone_calls_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postal_dispatch" ADD CONSTRAINT "postal_dispatch_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postal_receive" ADD CONSTRAINT "postal_receive_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_schoolId_typeId_fkey" FOREIGN KEY ("schoolId", "typeId") REFERENCES "front_office_setup"("schoolId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "online_admissions" ADD CONSTRAINT "online_admissions_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "online_admissions" ADD CONSTRAINT "online_admissions_schoolId_classId_fkey" FOREIGN KEY ("schoolId", "classId") REFERENCES "classes"("schoolId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "multi_class_students" ADD CONSTRAINT "multi_class_students_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "multi_class_students" ADD CONSTRAINT "multi_class_students_schoolId_studentId_fkey" FOREIGN KEY ("schoolId", "studentId") REFERENCES "students"("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "multi_class_students" ADD CONSTRAINT "multi_class_students_schoolId_classId_fkey" FOREIGN KEY ("schoolId", "classId") REFERENCES "classes"("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "multi_class_students" ADD CONSTRAINT "multi_class_students_schoolId_sectionId_fkey" FOREIGN KEY ("schoolId", "sectionId") REFERENCES "sections"("schoolId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_heads" ADD CONSTRAINT "expense_heads_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_schoolId_headId_fkey" FOREIGN KEY ("schoolId", "headId") REFERENCES "expense_heads"("schoolId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_groups" ADD CONSTRAINT "exam_groups_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_schedules" ADD CONSTRAINT "exam_schedules_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_schedules" ADD CONSTRAINT "exam_schedules_schoolId_groupId_fkey" FOREIGN KEY ("schoolId", "groupId") REFERENCES "exam_groups"("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_schedules" ADD CONSTRAINT "exam_schedules_schoolId_classId_fkey" FOREIGN KEY ("schoolId", "classId") REFERENCES "classes"("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_schedules" ADD CONSTRAINT "exam_schedules_schoolId_subjectId_fkey" FOREIGN KEY ("schoolId", "subjectId") REFERENCES "subjects"("schoolId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_schoolId_schedId_fkey" FOREIGN KEY ("schoolId", "schedId") REFERENCES "exam_schedules"("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_schoolId_studentId_fkey" FOREIGN KEY ("schoolId", "studentId") REFERENCES "students"("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "divisions" ADD CONSTRAINT "divisions_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admit_templates" ADD CONSTRAINT "admit_templates_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mark_templates" ADD CONSTRAINT "mark_templates_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "online_exams" ADD CONSTRAINT "online_exams_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "online_exams" ADD CONSTRAINT "online_exams_schoolId_classId_fkey" FOREIGN KEY ("schoolId", "classId") REFERENCES "classes"("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "online_exams" ADD CONSTRAINT "online_exams_schoolId_subjectId_fkey" FOREIGN KEY ("schoolId", "subjectId") REFERENCES "subjects"("schoolId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_schoolId_classId_fkey" FOREIGN KEY ("schoolId", "classId") REFERENCES "classes"("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_schoolId_subjectId_fkey" FOREIGN KEY ("schoolId", "subjectId") REFERENCES "subjects"("schoolId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "online_exam_results" ADD CONSTRAINT "online_exam_results_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "online_exam_results" ADD CONSTRAINT "online_exam_results_schoolId_examId_fkey" FOREIGN KEY ("schoolId", "examId") REFERENCES "online_exams"("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "online_exam_results" ADD CONSTRAINT "online_exam_results_schoolId_studentId_fkey" FOREIGN KEY ("schoolId", "studentId") REFERENCES "students"("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_schoolId_classId_fkey" FOREIGN KEY ("schoolId", "classId") REFERENCES "classes"("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_schoolId_subjectId_fkey" FOREIGN KEY ("schoolId", "subjectId") REFERENCES "subjects"("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topics" ADD CONSTRAINT "topics_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topics" ADD CONSTRAINT "topics_schoolId_lessonId_fkey" FOREIGN KEY ("schoolId", "lessonId") REFERENCES "lessons"("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_plans" ADD CONSTRAINT "lesson_plans_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_plans" ADD CONSTRAINT "lesson_plans_schoolId_classId_fkey" FOREIGN KEY ("schoolId", "classId") REFERENCES "classes"("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_plans" ADD CONSTRAINT "lesson_plans_schoolId_subjectId_fkey" FOREIGN KEY ("schoolId", "subjectId") REFERENCES "subjects"("schoolId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_plans" ADD CONSTRAINT "lesson_plans_schoolId_lessonId_fkey" FOREIGN KEY ("schoolId", "lessonId") REFERENCES "lessons"("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_plans" ADD CONSTRAINT "lesson_plans_schoolId_teacherId_fkey" FOREIGN KEY ("schoolId", "teacherId") REFERENCES "staff"("schoolId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notices" ADD CONSTRAINT "notices_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sms_templates" ADD CONSTRAINT "sms_templates_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_messages" ADD CONSTRAINT "scheduled_messages_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_logs" ADD CONSTRAINT "message_logs_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_types" ADD CONSTRAINT "content_types_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contents" ADD CONSTRAINT "contents_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contents" ADD CONSTRAINT "contents_schoolId_typeId_fkey" FOREIGN KEY ("schoolId", "typeId") REFERENCES "content_types"("schoolId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contents" ADD CONSTRAINT "contents_schoolId_classId_fkey" FOREIGN KEY ("schoolId", "classId") REFERENCES "classes"("schoolId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homework" ADD CONSTRAINT "homework_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homework" ADD CONSTRAINT "homework_schoolId_classId_fkey" FOREIGN KEY ("schoolId", "classId") REFERENCES "classes"("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homework" ADD CONSTRAINT "homework_schoolId_sectionId_fkey" FOREIGN KEY ("schoolId", "sectionId") REFERENCES "sections"("schoolId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homework" ADD CONSTRAINT "homework_schoolId_subjectId_fkey" FOREIGN KEY ("schoolId", "subjectId") REFERENCES "subjects"("schoolId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homework_submissions" ADD CONSTRAINT "homework_submissions_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homework_submissions" ADD CONSTRAINT "homework_submissions_schoolId_homeworkId_fkey" FOREIGN KEY ("schoolId", "homeworkId") REFERENCES "homework"("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homework_submissions" ADD CONSTRAINT "homework_submissions_schoolId_studentId_fkey" FOREIGN KEY ("schoolId", "studentId") REFERENCES "students"("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_events" ADD CONSTRAINT "school_events_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "books" ADD CONSTRAINT "books_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_members" ADD CONSTRAINT "library_members_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_issues" ADD CONSTRAINT "book_issues_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_issues" ADD CONSTRAINT "book_issues_schoolId_memberId_fkey" FOREIGN KEY ("schoolId", "memberId") REFERENCES "library_members"("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_issues" ADD CONSTRAINT "book_issues_schoolId_bookId_fkey" FOREIGN KEY ("schoolId", "bookId") REFERENCES "books"("schoolId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_categories" ADD CONSTRAINT "item_categories_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_stores" ADD CONSTRAINT "item_stores_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_suppliers" ADD CONSTRAINT "item_suppliers_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_schoolId_catId_fkey" FOREIGN KEY ("schoolId", "catId") REFERENCES "item_categories"("schoolId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_stock" ADD CONSTRAINT "item_stock_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_stock" ADD CONSTRAINT "item_stock_schoolId_itemId_fkey" FOREIGN KEY ("schoolId", "itemId") REFERENCES "items"("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_stock" ADD CONSTRAINT "item_stock_schoolId_supId_fkey" FOREIGN KEY ("schoolId", "supId") REFERENCES "item_suppliers"("schoolId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_stock" ADD CONSTRAINT "item_stock_schoolId_storeId_fkey" FOREIGN KEY ("schoolId", "storeId") REFERENCES "item_stores"("schoolId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_issues" ADD CONSTRAINT "item_issues_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_issues" ADD CONSTRAINT "item_issues_schoolId_itemId_fkey" FOREIGN KEY ("schoolId", "itemId") REFERENCES "items"("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_issues" ADD CONSTRAINT "item_issues_schoolId_staffId_fkey" FOREIGN KEY ("schoolId", "staffId") REFERENCES "staff"("schoolId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_routes" ADD CONSTRAINT "transport_routes_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pickup_points" ADD CONSTRAINT "pickup_points_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_pickups" ADD CONSTRAINT "route_pickups_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_pickups" ADD CONSTRAINT "route_pickups_schoolId_routeId_fkey" FOREIGN KEY ("schoolId", "routeId") REFERENCES "transport_routes"("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_pickups" ADD CONSTRAINT "route_pickups_schoolId_pickupId_fkey" FOREIGN KEY ("schoolId", "pickupId") REFERENCES "pickup_points"("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_assignments" ADD CONSTRAINT "vehicle_assignments_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_assignments" ADD CONSTRAINT "vehicle_assignments_schoolId_routeId_fkey" FOREIGN KEY ("schoolId", "routeId") REFERENCES "transport_routes"("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_vehicles" ADD CONSTRAINT "assignment_vehicles_schoolId_assignmentId_fkey" FOREIGN KEY ("schoolId", "assignmentId") REFERENCES "vehicle_assignments"("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_vehicles" ADD CONSTRAINT "assignment_vehicles_schoolId_vehicleId_fkey" FOREIGN KEY ("schoolId", "vehicleId") REFERENCES "vehicles"("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_vehicles" ADD CONSTRAINT "assignment_vehicles_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_fees" ADD CONSTRAINT "transport_fees_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_fees" ADD CONSTRAINT "transport_fees_schoolId_pickupId_fkey" FOREIGN KEY ("schoolId", "pickupId") REFERENCES "pickup_points"("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_assignments" ADD CONSTRAINT "transport_assignments_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_assignments" ADD CONSTRAINT "transport_assignments_schoolId_studentId_fkey" FOREIGN KEY ("schoolId", "studentId") REFERENCES "students"("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_assignments" ADD CONSTRAINT "transport_assignments_schoolId_routeId_fkey" FOREIGN KEY ("schoolId", "routeId") REFERENCES "transport_routes"("schoolId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_assignments" ADD CONSTRAINT "transport_assignments_schoolId_pickupId_fkey" FOREIGN KEY ("schoolId", "pickupId") REFERENCES "pickup_points"("schoolId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostels" ADD CONSTRAINT "hostels_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_types" ADD CONSTRAINT "room_types_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_schoolId_hostelId_fkey" FOREIGN KEY ("schoolId", "hostelId") REFERENCES "hostels"("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_schoolId_typeId_fkey" FOREIGN KEY ("schoolId", "typeId") REFERENCES "room_types"("schoolId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_allocations" ADD CONSTRAINT "hostel_allocations_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_allocations" ADD CONSTRAINT "hostel_allocations_schoolId_studentId_fkey" FOREIGN KEY ("schoolId", "studentId") REFERENCES "students"("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_allocations" ADD CONSTRAINT "hostel_allocations_schoolId_roomId_fkey" FOREIGN KEY ("schoolId", "roomId") REFERENCES "rooms"("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_templates" ADD CONSTRAINT "certificate_templates_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "id_card_templates" ADD CONSTRAINT "id_card_templates_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alumni" ADD CONSTRAINT "alumni_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alumni_events" ADD CONSTRAINT "alumni_events_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_fields" ADD CONSTRAINT "custom_fields_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "languages" ADD CONSTRAINT "languages_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_users" ADD CONSTRAINT "app_users_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_users" ADD CONSTRAINT "app_users_schoolId_role_fkey" FOREIGN KEY ("schoolId", "role") REFERENCES "roles"("schoolId", "name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_logs" ADD CONSTRAINT "user_logs_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
