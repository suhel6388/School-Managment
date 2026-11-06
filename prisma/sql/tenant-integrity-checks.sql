-- Tenant isolation checks for the shared-schema PostgreSQL database.
-- Run after the baseline migration and again after data import.
-- These are diagnostics; the composite foreign keys are the primary guard.

-- 1. Every expected tenant table must have a schoolId column.
--    Update the list when new tenant tables are added.
WITH expected(model) AS (
  VALUES
    ('settings'), ('academic_sessions'), ('classes'), ('sections'),
    ('class_sections'), ('subjects'), ('subject_groups'),
    ('subject_group_sections'), ('subject_group_subjects'),
    ('student_categories'), ('student_houses'), ('disable_reasons'),
    ('students'), ('counters'), ('fee_groups'), ('fee_types'),
    ('fee_discounts'), ('fee_masters'), ('payments'), ('carry_forwards'),
    ('bank_payments'), ('fee_reminders'), ('departments'), ('designations'),
    ('leave_types'), ('staff'), ('staff_leaves'), ('staff_ratings'),
    ('payrolls'), ('staff_attendance'), ('student_attendance'),
    ('student_leaves'), ('front_office_setup'), ('enquiries'), ('visitors'),
    ('phone_calls'), ('postal_dispatch'), ('postal_receive'), ('complaints'),
    ('online_admissions'), ('multi_class_students'), ('expense_heads'),
    ('expenses'), ('exam_groups'), ('exam_schedules'), ('exam_results'),
    ('grades'), ('divisions'), ('admit_templates'), ('mark_templates'),
    ('online_exams'), ('questions'), ('online_exam_results'), ('lessons'),
    ('topics'), ('lesson_plans'), ('notices'), ('email_templates'),
    ('sms_templates'), ('scheduled_messages'), ('message_logs'),
    ('content_types'), ('contents'), ('homework'), ('homework_submissions'),
    ('school_events'), ('books'), ('library_members'), ('book_issues'),
    ('item_categories'), ('item_stores'), ('item_suppliers'), ('items'),
    ('item_stock'), ('item_issues'), ('transport_routes'), ('vehicles'),
    ('pickup_points'), ('route_pickups'), ('vehicle_assignments'),
    ('assignment_vehicles'), ('transport_fees'), ('transport_assignments'),
    ('hostels'), ('room_types'), ('rooms'), ('hostel_allocations'),
    ('certificate_templates'), ('id_card_templates'), ('alumni'),
    ('alumni_events'), ('custom_fields'), ('languages'), ('roles'),
    ('app_users'), ('audit_logs'), ('user_logs')
)
SELECT e.model AS missing_school_id
FROM expected e
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public'
 AND c.table_name = e.model
 AND c.column_name = 'schoolId'
WHERE c.column_name IS NULL
ORDER BY e.model;

-- 2. Foreign keys between tenant tables that do not include schoolId.
--    Every such FK is a cross-tenant leak risk; expected result: no rows.
WITH fk AS (
  SELECT
    c.oid,
    c.conname,
    c.conrelid,
    c.confrelid,
    ARRAY(
      SELECT a.attname
      FROM unnest(c.conkey) WITH ORDINALITY AS k(attnum, ord)
      JOIN pg_attribute a
        ON a.attrelid = c.conrelid AND a.attnum = k.attnum
      ORDER BY k.ord
    ) AS child_cols
  FROM pg_constraint c
  WHERE c.contype = 'f'
)
SELECT
  f.conrelid::regclass AS child_table,
  f.confrelid::regclass AS parent_table,
  f.conname AS constraint_name,
  f.child_cols
FROM fk f
JOIN pg_class parent ON parent.oid = f.confrelid
JOIN pg_namespace pns ON pns.oid = parent.relnamespace
WHERE pns.nspname = 'public'
  AND f.confrelid <> 'schools'::regclass
  AND f.conrelid <> 'school_memberships'::regclass
  AND f.confrelid NOT IN (
    'user'::regclass, 'session'::regclass,
    'account'::regclass, 'verification'::regclass
  )
  AND NOT ('schoolId' = ANY (f.child_cols))
ORDER BY 1, 2, 3;

-- 3. Tenant rows that point outside their own school.
--    The composite FKs should make these impossible; run as a post-import check.
SELECT 'students.classId' AS relation, COUNT(*) AS violations
FROM "students" s
JOIN "classes" c ON c."id" = s."classId"
WHERE c."schoolId" <> s."schoolId"
UNION ALL
SELECT 'students.sectionId', COUNT(*)
FROM "students" s
JOIN "sections" sec ON sec."id" = s."sectionId"
WHERE sec."schoolId" <> s."schoolId"
UNION ALL
SELECT 'payments.studentId', COUNT(*)
FROM "payments" p
JOIN "students" s ON s."id" = p."studentId"
WHERE s."schoolId" <> p."schoolId"
UNION ALL
SELECT 'exam_results.schedId', COUNT(*)
FROM "exam_results" r
JOIN "exam_schedules" e ON e."id" = r."schedId"
WHERE e."schoolId" <> r."schoolId"
UNION ALL
SELECT 'transport_assignments.routeId', COUNT(*)
FROM "transport_assignments" t
JOIN "transport_routes" r ON r."id" = t."routeId"
WHERE r."schoolId" <> t."schoolId";

-- 4. One school must not be able to read another school's settings/counters.
SELECT 'duplicate settings per school' AS check_name, COUNT(*) AS violations
FROM (
  SELECT "schoolId" FROM "settings" GROUP BY "schoolId" HAVING COUNT(*) > 1
) d
UNION ALL
SELECT 'counters without school scope', COUNT(*)
FROM "counters" WHERE "schoolId" IS NULL;

-- 5. Row-count reconciliation template (replace staging table names).
-- SELECT 'students' AS table_name,
--        (SELECT COUNT(*) FROM staging_students) AS source_rows,
--        (SELECT COUNT(*) FROM "students") AS target_rows;

-- 6. Tenant-key immutability triggers.
--    Expect school_id_tables = immutability_triggers and missing = NULL.
WITH tenant_tables AS (
  SELECT table_name
  FROM information_schema.columns
  WHERE table_schema = 'public' AND column_name = 'schoolId'
),
immutable_triggers AS (
  SELECT c.relname AS table_name
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND NOT t.tgisinternal
    AND t.tgname LIKE '%\_school\_id\_immutable' ESCAPE '\'
)
SELECT
  (SELECT COUNT(*) FROM tenant_tables) AS school_id_tables,
  (SELECT COUNT(*) FROM immutable_triggers) AS immutability_triggers,
  (SELECT string_agg(t.table_name, ', ' ORDER BY t.table_name)
   FROM tenant_tables t
   LEFT JOIN immutable_triggers g USING (table_name)
   WHERE g.table_name IS NULL) AS missing_trigger;

