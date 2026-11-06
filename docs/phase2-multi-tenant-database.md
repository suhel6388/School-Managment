# Phase 2 — Multi-Tenant Database Architecture (MySQL)

Status: **MySQL schema and migrations prepared and verified on a temporary
database. The production `school_db` has not been touched.**

This is the active Phase 2 target. The original PostgreSQL design is retained in
`docs/phase2-postgresql-variant.md` and `prisma/postgres/`.

---

## 1. Target architecture

| Item | Value |
| --- | --- |
| Database | MySQL 8.0+ |
| ORM | Prisma 6.19.3 |
| Tenancy model | Shared database, shared schema |
| Tenant key | `schoolId` on every school-owned table |
| Tenant resolution | Authenticated session membership (Phase 3/4), never request input |
| Legacy auth | `AppUser` retained for compatibility until the Better Auth migration |
| New identity | Better Auth `User`, `Session`, `Account`, `Verification` + `SchoolMembership` |

All tenant-owned rows have:

1. `schoolId` as a required (`NOT NULL`) column.
2. A foreign key `schoolId -> schools.id`.
3. An index on `schoolId`.
4. Composite foreign keys for every relation to another tenant-owned row:
   `[schoolId, <fk>] -> [<parent>.schoolId, <parent>.id]`.
5. A composite unique constraint `[schoolId, id]` when referenced by those
   composite foreign keys.
6. Uniqueness scoped per school instead of globally.
7. A `BEFORE UPDATE` trigger that rejects changing `schoolId`.

MySQL therefore rejects a row that points at another school's record, and
rejects moving a row between schools, even if application code has a bug. The
application must still filter every query by the authenticated `schoolId`
(Phase 4).

---

## 2. New tables

### `schools` (`School`)

```
id                VARCHAR(191) primary key (cuid)
name              VARCHAR(150)
slug              VARCHAR(80) unique
email             VARCHAR(150) nullable
phone             VARCHAR(40)  nullable
address           TEXT         nullable
logo              TEXT         nullable
status            VARCHAR(20)  default 'active'
subscriptionPlan  VARCHAR(40)  default 'free'
createdAt         DATETIME(3)
updatedAt         DATETIME(3)
```

`status` is intended to use `active`, `suspended`, `cancelled`. School deletion
is deliberately not part of normal APIs; use `status` and an admin runbook.

### Better Auth core tables

Table names match Better Auth defaults: `user`, `session`, `account`,
`verification`.

| Table | Purpose |
| --- | --- |
| `user` | `id`, `name`, `email` (unique), `emailVerified`, `image`, timestamps |
| `session` | Session token, expiry, IP/user-agent, `userId` |
| `account` | Credentials and OAuth accounts; password hash lives here |
| `verification` | Email verification / password reset tokens |

`User` does not store a password. Credentials belong to `account`
(`providerId = "credential"`).

### `school_memberships` (`SchoolMembership`)

```
id         VARCHAR(191) primary key
schoolId   -> schools.id
userId     -> user.id
role       VARCHAR(40) default 'member'
status     VARCHAR(20) default 'active'
createdAt  DATETIME(3)
updatedAt  DATETIME(3)

unique (schoolId, userId)
index  (schoolId, status)
index  (userId)
```

---

## 3. Tenant tables

All 97 pre-existing models are tenant-owned, including configuration, logs,
roles, languages and counters.

```
settings, academic_sessions, classes, sections, class_sections, subjects,
subject_groups, subject_group_sections, subject_group_subjects,
student_categories, student_houses, disable_reasons, students, counters,
fee_groups, fee_types, fee_discounts, fee_masters, payments, carry_forwards,
bank_payments, fee_reminders, departments, designations, leave_types, staff,
staff_leaves, staff_ratings, payrolls, staff_attendance, student_attendance,
student_leaves, front_office_setup, enquiries, visitors, phone_calls,
postal_dispatch, postal_receive, complaints, online_admissions,
multi_class_students, expense_heads, expenses, exam_groups, exam_schedules,
exam_results, grades, divisions, admit_templates, mark_templates,
online_exams, questions, online_exam_results, lessons, topics, lesson_plans,
notices, email_templates, sms_templates, scheduled_messages, message_logs,
content_types, contents, homework, homework_submissions, school_events,
books, library_members, book_issues, item_categories, item_stores,
item_suppliers, items, item_stock, item_issues, transport_routes, vehicles,
pickup_points, route_pickups, vehicle_assignments, assignment_vehicles,
transport_fees, transport_assignments, hostels, room_types, rooms,
hostel_allocations, certificate_templates, id_card_templates, alumni,
alumni_events, custom_fields, languages, roles, app_users, audit_logs,
user_logs
```

---

## 4. Per-school uniqueness

Global unique constraints were replaced with `(schoolId, ...)` constraints so
two schools can use the same natural identifiers.

| Table | Before | After |
| --- | --- | --- |
| `academic_sessions` | `name` | `(schoolId, name)` |
| `student_categories` | `name` | `(schoolId, name)` |
| `student_houses` | `name` | `(schoolId, name)` |
| `disable_reasons` | `name` | `(schoolId, name)` |
| `students` | `admNo` | `(schoolId, admNo)` |
| `fee_groups` | `name` | `(schoolId, name)` |
| `departments` | `name` | `(schoolId, name)` |
| `designations` | `name` | `(schoolId, name)` |
| `staff` | `empId` | `(schoolId, empId)` |
| `expense_heads` | `name` | `(schoolId, name)` |
| `item_categories` | `name` | `(schoolId, name)` |
| `room_types` | `name` | `(schoolId, name)` |
| `languages` | `code` | `(schoolId, code)` |
| `roles` | `name` | `(schoolId, name)` |
| `app_users` | `username` | `(schoolId, username)` |
| `payments` | `rc` | `(schoolId, rc)` |
| `vehicles` | `number` | `(schoolId, number)` |
| `library_members` | `card` | `(schoolId, card)` |
| `payrolls` | `(staffId, month)` | `(schoolId, staffId, month)` |
| `staff_attendance` | `(staffId, date)` | `(schoolId, staffId, date)` |
| `student_attendance` | `(studentId, date)` | `(schoolId, studentId, date)` |
| `multi_class_students` | `(studentId, classId)` | `(schoolId, studentId, classId)` |
| `exam_results` | `(schedId, studentId)` | `(schoolId, schedId, studentId)` |
| `homework_submissions` | `(homeworkId, studentId)` | `(schoolId, homeworkId, studentId)` |
| `route_pickups` | `(routeId, pickupId)` | `(schoolId, routeId, pickupId)` |
| `transport_fees` | `(pickupId)` | `(schoolId, pickupId)` |
| `transport_assignments` | `(studentId, pickupId)` | `(schoolId, studentId, pickupId)` |
| `rooms` | `(hostelId, roomNo)` | `(schoolId, hostelId, roomNo)` |
| `hostel_allocations` | `(studentId)` | `(schoolId, studentId)` |

Primary keys were preserved on all regular tables. `@@unique([schoolId, id])`
was added where needed to support composite foreign keys; it does not replace
the primary key.

### Restructured singleton tables

* `settings`, `admit_templates`, `mark_templates`, `id_card_templates` keep an
  auto-increment `id` primary key and add `schoolId` (`UNIQUE`). One row per
  school is enforced.
* `counters` now has composite primary key `(schoolId, key)`.

### MySQL-specific type changes

* `Session.token` uses `VARCHAR(255)` instead of `TEXT`, because MySQL cannot
  create a unique index on `TEXT` (the original P1012 error).
* Date defaults use `dbgenerated("(curdate())")` instead of PostgreSQL's
  `CURRENT_DATE`.
* `@db.Text` is retained only on non-indexed text columns.
* All per-school unique indexes fit inside MySQL's 3072-byte InnoDB limit with
  `utf8mb4`.

### Referential actions

Optional relations (`student.section`, `staff.department`, `item.supplier`,
etc.) previously used `ON DELETE SET NULL`. With composite tenant foreign keys,
`SET NULL` would also try to null `schoolId`, which is forbidden. These
relations now use `ON DELETE RESTRICT`; application code must detach the
reference by setting the optional FK column to `NULL` before deleting the
parent. Required relations keep their original `CASCADE`/`RESTRICT` semantics,
and `schools` deletion is `RESTRICT` for tenant data.

### Tenant key immutability

MySQL does not support a conditional trigger body without `BEGIN ... END` and
`DELIMITER`, which Prisma migrations cannot reliably carry. The baseline uses a
single-statement trigger per tenant table:

```sql
CREATE TRIGGER `students_school_id_immutable`
BEFORE UPDATE ON `students`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);
```

Changing `schoolId` assigns `NULL` to a `NOT NULL` column, so MySQL aborts the
update with `Column 'schoolId' cannot be null`. Keeping the same value is
allowed. There are 98 triggers (97 tenant tables + `school_memberships`).

---

## 5. Generated artifacts

| File | Purpose |
| --- | --- |
| `prisma/schema.prisma` | Active MySQL 8 multi-tenant schema (103 models) |
| `prisma/migrations/20261106000000_init_mysql_multitenant/migration.sql` | 103 tables, 184 foreign keys |
| `prisma/migrations/20261106000001_tenant_school_id_immutable/migration.sql` | 98 `schoolId` immutability triggers |
| `prisma/migrations/migration_lock.toml` | `provider = "mysql"` |
| `prisma/migrations-mysql-archive/` | Original single-tenant MySQL migration, preserved |
| `prisma/schema.mysql.legacy.prisma` | Original single-tenant schema, used by the current app |
| `prisma/sql/tenant-integrity-checks.sql` | MySQL post-import isolation checks |
| `prisma/postgres/` | Archived PostgreSQL schema, migrations and checks |
| `docs/phase2-postgresql-variant.md` | PostgreSQL design document |

The baseline is an **empty-database baseline**. It is not an in-place upgrade of
the existing `school_db`.

---

## 6. Safe migration strategy

The existing installation already contains records that must not be deleted.
The only safe path is a **new MySQL database + verified data copy + cutover**.

### Phase A — Freeze and back up

1. Announce a maintenance window; stop application writes.
2. Take a full MySQL backup:
   `mysqldump --single-transaction --routines --triggers --events school_db > backup-before-mt.sql`
3. Record row counts for every table.
4. Keep the backup read-only until verification passes.

### Phase B — Create a new database

1. Create a fresh database, for example `school_db_mt`.
2. Point a staging/runtime `DATABASE_URL` at it:
   `mysql://USER:PASSWORD@localhost:3306/school_db_mt`
3. Do not point the new schema at `school_db`.

### Phase C — Apply and verify the empty schema

```powershell
$env:DATABASE_URL = "mysql://USER:PASSWORD@localhost:3306/school_db_mt"
npx prisma migrate deploy
```

Do **not** use `prisma migrate dev` against `school_db`; it can prompt for a
reset. `migrate deploy` only applies the two committed migrations.

Verify:

1. 103 tables, 184 foreign keys and 98 triggers exist.
2. `prisma/sql/tenant-integrity-checks.sql` returns:
   * no missing/nulled `schoolId` columns,
   * no tenant FK without `schoolId`,
   * trigger count 98 / 98 with no missing table.

### Phase D — Create the legacy tenant

The current installation becomes exactly one school:

```sql
INSERT INTO `schools` (`id`, `name`, `slug`, `email`, `phone`, `address`,
                       `status`, `subscriptionPlan`, `createdAt`, `updatedAt`)
VALUES ('legacy', 'ICE School', 'ice-school', '<email>', '<phone>', '<address>',
        'active', 'legacy', NOW(3), NOW(3));
```

Every imported row uses `schoolId = 'legacy'`.

### Phase E — Copy data (no deletion)

Recommended approach: stage the old rows, then transform into the new schema.

1. Export each source table to CSV/TSV in FK-safe order.
2. Load the exports into staging tables in `school_db_mt`.
3. Insert into the final tables with an explicit constant `schoolId`:

```sql
INSERT INTO `students` (`id`, `schoolId`, `admNo`, ...)
SELECT `id`, 'legacy', `admNo`, ... FROM staging_students;
```

4. Fix the restructured tables:
   * `settings`, `admit_templates`, `mark_templates`, `id_card_templates`:
     set `schoolId = 'legacy'` and keep the existing row.
   * `counters`: insert `('legacy', key, value)`.
   * `roles` / `app_users`: keep names/usernames, scoped to `'legacy'`.
   * Date values imported from MySQL remain ordinary `DATE` values.
5. Preserve every primary key; all legacy ids are already unique.
6. The four auto-increment tables receive explicit `id = 1`. MySQL advances the
   counter after an explicit insert, but confirm it before go-live:

```sql
SELECT AUTO_INCREMENT FROM information_schema.tables
WHERE table_schema = 'school_db_mt'
  AND table_name IN ('settings','admit_templates','mark_templates','id_card_templates');
```

7. Import parent tables before children (see order below). Never drop or
   truncate source tables.
8. Insert every row with its final `schoolId`. Do **not** copy first and then
   `UPDATE ... SET schoolId = ...`; the immutability trigger blocks it.

Suggested import order:

```
schools
user, session, account, verification, school_memberships
settings, academic_sessions, classes, sections, class_sections, subjects,
student_categories, student_houses, disable_reasons, counters,
fee_groups, fee_types, fee_discounts, fee_masters,
departments, designations, leave_types, staff,
students, staff_leaves, staff_ratings, payrolls, staff_attendance,
student_attendance, student_leaves, front_office_setup, enquiries,
visitors, phone_calls, postal_dispatch, postal_receive, complaints,
online_admissions, multi_class_students, expense_heads, expenses,
exam_groups, exam_schedules, exam_results, grades, divisions,
admit_templates, mark_templates, online_exams, questions,
online_exam_results, lessons, topics, lesson_plans, notices,
email_templates, sms_templates, scheduled_messages, message_logs,
content_types, contents, homework, homework_submissions, school_events,
books, library_members, book_issues, item_categories, item_stores,
item_suppliers, items, item_stock, item_issues, transport_routes,
vehicles, pickup_points, route_pickups, vehicle_assignments,
assignment_vehicles, transport_fees, transport_assignments, hostels,
room_types, rooms, hostel_allocations, certificate_templates,
id_card_templates, alumni, alumni_events, custom_fields, languages,
roles, app_users, audit_logs, user_logs
```

### Phase F — Verify before cutover

1. Compare source and target row counts per table.
2. Run `prisma/sql/tenant-integrity-checks.sql`.
3. Confirm every tenant table has exactly one `schoolId` value (`legacy`).
4. Spot-check money totals: payments, expenses, payroll, fee masters.
5. Spot-check relationships: student → class/section, payment → student,
   exam result → schedule/student, transport assignment → route/pickup.
6. Run the application read paths and a small write/rollback test against
   staging.

### Phase G — Cutover and rollback

1. Stop the old application; keep `school_db` available read-only.
2. Point `DATABASE_URL` at `school_db_mt`.
3. Regenerate the Prisma client for the new schema (`npm run db:generate`) and
   deploy the tenant-aware application build (Phase 3/4).
4. Smoke-test login, dashboard, students, receipts, attendance, exams, reports.
5. Rollback = restore the old build + old `DATABASE_URL` pointing at the
   untouched `school_db`.
6. Retain the `mysqldump` backup for the agreed retention period.

### Guardrails

* Never run `prisma migrate reset`, `db:seed`, `truncateAll`, or `system/reset`
  against production.
* Never apply the new baseline to the legacy `school_db`.
* Never import with a client-supplied `schoolId`; import uses the fixed legacy
  tenant id.
* Do not disable the immutability triggers outside an audited admin procedure.

---

## 7. Application follow-up (Phases 3–4)

During the transition the current application still uses the single-tenant
MySQL client and schema:

```powershell
# current app against the legacy single-tenant schema
npm run db:generate:legacy

# multi-tenant MySQL client, at cutover
npm run db:generate
```

The multi-tenant schema is intentionally stricter than the current code. Until
Phases 3–4 land:

* Existing queries using global keys (`where: { name }`, `where: { admNo }`,
  `where: { key }`, `where: { id: 1 }`) do not type-check against the new
  client.
* `schoolId` must be derived from `SchoolMembership`/session on the server.
  Reject or ignore any `schoolId` in body, query string or headers.
* The generic resource engine (`src/lib/resources.ts`) must inject `schoolId`
  into every `where`, `create`, `update`, `delete`, count, group and relation
  filter. `schoolId` must be removed from writable fields.
* `system/reset`, backup/restore and seeding must become tenant-scoped.
* Better Auth core tables are ready for Phase 3; existing `AppUser` login stays
  in place until the migration is tested.

---

## 8. Verification performed

| Check | Result |
| --- | --- |
| `prisma validate` (MySQL) | Passed |
| `prisma format` | Passed |
| Baseline SQL generation | Passed, 103 tables / 184 FKs |
| Baseline applied to a temporary MySQL database | Passed |
| 98 immutability triggers applied | Passed |
| Cross-school `students.classId` insert | Blocked by composite FK |
| Same-school insert/update | Passed |
| Changing `schoolId` on an existing row | Blocked by trigger |
| `tsc --noEmit` | Passed against the legacy transition client |
| `next build` | Passed against the legacy transition client |
| Applied to production `school_db` | **Not run** — intentionally untouched |

The temporary databases used for verification were dropped afterwards.
`prisma migrate status` now reports MySQL (no more P3019), but it still refers to
the legacy `school_db`; the new migrations are pending there by design.
