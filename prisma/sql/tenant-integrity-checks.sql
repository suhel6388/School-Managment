-- Tenant isolation checks for the shared-schema MySQL database.
-- Run after the baseline migration and again after data import.
-- These are diagnostics; the composite foreign keys and triggers are the
-- primary guard.

-- 1. Every tenant table must have a NOT NULL schoolId column.
SELECT t.table_name AS missing_school_id
FROM information_schema.tables t
LEFT JOIN information_schema.columns c
  ON c.table_schema = t.table_schema
 AND c.table_name = t.table_name
 AND c.column_name = 'schoolId'
WHERE t.table_schema = DATABASE()
  AND t.table_type = 'BASE TABLE'
  AND t.table_name NOT IN ('schools', 'user', 'session', 'account', 'verification')
  AND c.column_name IS NULL
ORDER BY t.table_name;

SELECT table_name AS nullable_school_id
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND column_name = 'schoolId'
  AND is_nullable = 'YES'
ORDER BY table_name;

-- 2. Foreign keys between tenant tables that do not include schoolId.
--    Every such FK is a cross-tenant leak risk; expected result: no rows.
SELECT
  k.table_name AS child_table,
  k.referenced_table_name AS parent_table,
  k.constraint_name,
  GROUP_CONCAT(k.column_name ORDER BY k.ordinal_position) AS child_cols
FROM information_schema.key_column_usage k
WHERE k.table_schema = DATABASE()
  AND k.referenced_table_schema = DATABASE()
  AND k.referenced_table_name IS NOT NULL
  AND k.referenced_table_name NOT IN
      ('schools', 'user', 'session', 'account', 'verification')
GROUP BY k.table_name, k.referenced_table_name, k.constraint_name
HAVING child_cols NOT LIKE 'schoolId%'
ORDER BY 1, 2, 3;

-- 3. Tenant rows that point outside their own school.
--    The composite FKs should make these impossible; run as a post-import check.
SELECT 'students.classId' AS relation, COUNT(*) AS violations
FROM `students` s
JOIN `classes` c ON c.`id` = s.`classId`
WHERE c.`schoolId` <> s.`schoolId`
UNION ALL
SELECT 'students.sectionId', COUNT(*)
FROM `students` s
JOIN `sections` sec ON sec.`id` = s.`sectionId`
WHERE sec.`schoolId` <> s.`schoolId`
UNION ALL
SELECT 'payments.studentId', COUNT(*)
FROM `payments` p
JOIN `students` s ON s.`id` = p.`studentId`
WHERE s.`schoolId` <> p.`schoolId`
UNION ALL
SELECT 'exam_results.schedId', COUNT(*)
FROM `exam_results` r
JOIN `exam_schedules` e ON e.`id` = r.`schedId`
WHERE e.`schoolId` <> r.`schoolId`
UNION ALL
SELECT 'transport_assignments.routeId', COUNT(*)
FROM `transport_assignments` t
JOIN `transport_routes` r ON r.`id` = t.`routeId`
WHERE r.`schoolId` <> t.`schoolId`;

-- 4. One settings row per school and no unscoped counters.
SELECT 'duplicate settings per school' AS check_name, COUNT(*) AS violations
FROM (
  SELECT `schoolId` FROM `settings` GROUP BY `schoolId` HAVING COUNT(*) > 1
) d
UNION ALL
SELECT 'counters without school scope', COUNT(*)
FROM `counters` WHERE `schoolId` IS NULL;

-- 5. Tenant-key immutability triggers.
--    Expect school_id_tables = immutability_triggers and missing_trigger = NULL.
SELECT
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE() AND column_name = 'schoolId')
    AS school_id_tables,
  (SELECT COUNT(*) FROM information_schema.triggers
   WHERE trigger_schema = DATABASE())
    AS immutability_triggers,
  (SELECT GROUP_CONCAT(t.table_name ORDER BY t.table_name)
   FROM information_schema.tables t
   LEFT JOIN information_schema.triggers g
     ON g.trigger_schema = t.table_schema
    AND g.event_object_table = t.table_name
   WHERE t.table_schema = DATABASE()
     AND t.table_type = 'BASE TABLE'
     AND EXISTS (
       SELECT 1 FROM information_schema.columns c
       WHERE c.table_schema = t.table_schema
         AND c.table_name = t.table_name
         AND c.column_name = 'schoolId'
     )
     AND g.trigger_name IS NULL)
    AS missing_trigger;

-- 6. Row-count reconciliation template (replace staging table names).
-- SELECT 'students' AS table_name,
--        (SELECT COUNT(*) FROM staging_students) AS source_rows,
--        (SELECT COUNT(*) FROM `students`) AS target_rows;
