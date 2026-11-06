# Phase 2 — Multi-Tenant Database Architecture (PostgreSQL variant)

> **Archived variant.** The active Phase 2 target is MySQL 8; see
> `docs/phase2-multi-tenant-database.md`. This document is retained for
> PostgreSQL deployments and uses paths under `prisma/postgres/`.

Status: **PostgreSQL schema and migration artifacts prepared; nothing applied to a database.**

This document describes the shared-database / shared-schema tenant model, the
constraints that enforce isolation, and the safe path for moving the existing
single-school MySQL installation to PostgreSQL without deleting records.

---

## 1. Target architecture

| Item | Value |
| --- | --- |
| Database | PostgreSQL 16+ |
| ORM | Prisma ORM 7.10.1 (`prisma-client` generator + driver adapter) |
| Tenancy model | Shared database, shared schema |
| Tenant key | `schoolId` on every school-owned table |
| Tenant resolution | Authenticated session membership (Phase 3/4), never request input |
| Legacy auth | `AppUser` retained for compatibility until the Better Auth migration |
| New identity | Better Auth `User`, `Session`, `Account`, `Verification` + `SchoolMembership` |

All tenant-owned rows have:

1. `schoolId` as a required column.
2. A foreign key `schoolId -> schools.id`.
3. A single-column index on `schoolId` (or a composite index/PK that starts
   with `schoolId`).
4. Composite foreign keys for every relation to another tenant-owned row:
   `[schoolId, <fk>] -> [<parent>.schoolId, <parent>.id]`.
5. A composite unique constraint `[schoolId, id]` when referenced by those
   composite foreign keys.
6. Uniqueness scoped per school instead of globally.

PostgreSQL therefore rejects a row that points at another school's record even
if application code has a bug. The application must still filter every query
by the authenticated `schoolId` (Phase 4).

---

## 2. New tables

### `schools` (`School`)

```
id                cuid primary key
name              varchar(150)
slug              varchar(80) unique
email             varchar(150) nullable
phone             varchar(40)  nullable
address           text         nullable
logo              text         nullable
status            varchar(20)  default "active"
subscriptionPlan  varchar(40)  default "free"
createdAt         timestamp
updatedAt         timestamp
```

`status` is intended to use `active`, `suspended`, `cancelled`. School deletion
is deliberately not part of normal APIs; tenancy offboarding should use
`status` and an explicit admin runbook.

### Better Auth core tables

Table names intentionally match Better Auth defaults: `user`, `session`,
`account`, `verification`.

| Table | Purpose |
| --- | --- |
| `user` | `id`, `name`, `email` (unique), `emailVerified`, `image`, timestamps |
| `session` | Session token, expiry, IP/user-agent, `userId` |
| `account` | Credentials and OAuth accounts; password hash lives here |
| `verification` | Email verification / password reset tokens |

`User` does **not** store a password. Credentials belong to `account`
(`providerId = "credential"`), as required by Better Auth.

### `school_memberships` (`SchoolMembership`)

```
id         cuid primary key
schoolId   -> schools.id
userId     -> user.id
role       varchar(40) default "member"
status     varchar(20) default "active"
createdAt  timestamp
updatedAt  timestamp

unique (schoolId, userId)
index  (schoolId, status)
index  (userId)
```

This is the server-side source of truth for "which school may this user
access". Better Auth's organization plugin tables can be layered on in Phase 3;
the requested `SchoolMembership` contract is already represented here.

---

## 3. Tenant tables

All 97 pre-existing models are tenant-owned. This includes lookup/settings
tables, logs, roles, languages and counters — they are configuration of one
school, not platform-wide data.

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

The legacy `id = 1` singleton pattern cannot work with multiple schools.

* `settings`, `admit_templates`, `mark_templates`, `id_card_templates`
  keep an auto-increment `id` primary key and add `schoolId String @unique`.
  One row per school is enforced by the unique `schoolId`.
* `counters` now has composite primary key `(schoolId, key)`, so each school
  has its own receipt/admission sequence.

### Tenant key immutability

A PostgreSQL trigger (`prevent_tenant_reassignment`) is attached to every table
with a `schoolId` column. Any `UPDATE` that changes `schoolId` raises
`42501` (insufficient privilege), including updates attempted outside the
application. Rows must be inserted with the correct school from the start.

### Referential actions

Optional relations (`student.section`, `staff.department`, `item.supplier`,
etc.) previously used `ON DELETE SET NULL`. With composite tenant foreign keys,
`SET NULL` would also try to null `schoolId`, which is forbidden. These
relations now use `ON DELETE RESTRICT`; application code must detach the
reference by setting the optional FK column to `NULL` before deleting the
parent. Required relations keep their original `CASCADE`/`RESTRICT` semantics,
and `schools` deletion is `RESTRICT` for tenant data.

---

## 5. Generated artifacts

| File | Purpose |
| --- | --- |
| `prisma/postgres/schema.prisma` | PostgreSQL multi-tenant schema (103 models) |
| `prisma/postgres/migrations/20261106000000_init_postgresql_multitenant/migration.sql` | Baseline DDL generated from the schema (96 KB, 184 FKs) |
| `prisma/postgres/migrations/20261106000001_tenant_school_id_immutable/migration.sql` | Trigger that blocks changing `schoolId` on all 98 tenant tables |
| `prisma/postgres/migrations/migration_lock.toml` | `provider = "postgresql"` |
| `prisma/migrations-mysql-archive/` | Original MySQL migration preserved unchanged |
| `prisma/schema.mysql.legacy.prisma` | Pre-migration MySQL schema kept for transition/rollback |
| `prisma/postgres/sql/tenant-integrity-checks.sql` | Post-import isolation/coverage checks |

The baseline is an **empty-database baseline**. It is not an in-place upgrade
for the existing MySQL schema.

---

## 6. Safe migration strategy

The existing installation already contains records that must not be deleted.
The only safe path is a **parallel PostgreSQL database + verified data copy +
cutover**, not an in-place provider switch.

### Phase A — Freeze and back up

1. Announce a maintenance window; stop application writes.
2. Take a full MySQL backup:
   `mysqldump --single-transaction --routines --triggers --events <db> > backup-before-pg.sql`
3. Record row counts for every table.
4. Keep the backup read-only until PostgreSQL verification passes.

### Phase B — Provision PostgreSQL

1. Install PostgreSQL 16+; create a dedicated role and database.
2. Store credentials only in the runtime environment:
   `POSTGRES_DATABASE_URL="postgresql://.../ice_school?schema=public"`
3. Ensure UTF-8 encoding and a timezone policy (`UTC` recommended).
4. Do not enable `schoolId` defaults and do not create a wildcard tenant.

### Phase C — Build and verify the empty schema

1. On a staging PostgreSQL database:
   `npx prisma migrate deploy --config prisma.postgres.config.ts`
2. Confirm 103 tables, 184 foreign keys, and 98 immutability triggers exist.
3. Run `prisma/postgres/sql/tenant-integrity-checks.sql`; the FK-coverage query must
   return no rows and the trigger check must report 98 / 98 with no missing
   table.
4. Run the application test suite against staging once Phase 3/4 code exists.

### Phase D — Create the legacy tenant

The current installation becomes exactly one school. Choose a stable id (a
cuid or a fixed value such as `legacy`), and insert it before importing any
tenant rows:

```sql
INSERT INTO "schools" ("id", "name", "slug", "email", "phone", "address",
                       "status", "subscriptionPlan", "createdAt", "updatedAt")
VALUES ('legacy', 'ICE School', 'ice-school', '<email>', '<phone>', '<address>',
        'active', 'legacy', now(), now());
```

Every imported row uses `schoolId = 'legacy'`.

### Phase E — Copy data (no deletion)

Recommended approach: stage the old rows, then transform into the new schema.

1. Export each MySQL table to CSV/TSV in FK-safe order.
2. Create temporary staging tables in PostgreSQL that mirror the MySQL columns.
3. `COPY` the exports into staging tables.
4. Insert into the final tables with an explicit constant `schoolId`:

```sql
INSERT INTO "students" ("id", "schoolId", "admNo", ...)
SELECT "id", 'legacy', "admNo", ... FROM staging_students;
```

5. Fix the restructured tables:
   * `settings`, `admit_templates`, `mark_templates`, `id_card_templates`:
     set `schoolId = 'legacy'` and keep the existing row as the school's row.
   * `counters`: insert `('legacy', key, value)`; sequences continue per school.
   * `roles` / `app_users`: keep names/usernames, scoped to `'legacy'`.
   * `students.admDate`, `bank_payments.date` and other MySQL `curdate()`
     defaults are ordinary date values after import.
6. Preserve every primary key. Do not regenerate ids unless a collision is
   proven; all legacy ids are already unique.
7. Reset sequences for the four auto-increment tables after importing explicit
   ids, otherwise the next insert collides with `id = 1`:

```sql
SELECT setval(pg_get_serial_sequence('"settings"', 'id'),
              COALESCE((SELECT MAX("id") FROM "settings"), 1), true);
SELECT setval(pg_get_serial_sequence('"admit_templates"', 'id'),
              COALESCE((SELECT MAX("id") FROM "admit_templates"), 1), true);
SELECT setval(pg_get_serial_sequence('"mark_templates"', 'id'),
              COALESCE((SELECT MAX("id") FROM "mark_templates"), 1), true);
SELECT setval(pg_get_serial_sequence('"id_card_templates"', 'id'),
              COALESCE((SELECT MAX("id") FROM "id_card_templates"), 1), true);
```

8. Import parent tables before children (see order below) or defer constraint
   validation with a reviewed script. Never drop/truncate source tables.
9. Insert every row with its final `schoolId`. Do **not** copy first and then
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

1. Compare source and target row counts per table; store the results.
2. Run `prisma/postgres/sql/tenant-integrity-checks.sql`.
3. Confirm every tenant table has exactly one `schoolId` value (`legacy`).
4. Spot-check money totals: payments, expenses, payroll, fee masters.
5. Spot-check high-value relationships: student → class/section, payment →
   student, exam result → schedule/student, transport assignment → route/pickup.
6. Run the application's read paths and a small write/rollback test against
   staging.

### Phase G — Cutover and rollback

1. Stop the old application; keep MySQL available read-only.
2. Point `DATABASE_URL` at PostgreSQL.
3. Start the new build; run smoke tests (login, dashboard, student list,
   receipt generation, attendance, exam result, report export).
4. Rollback = stop PostgreSQL-backed app, restore the previous build and the
   unchanged MySQL `DATABASE_URL`. No source data is modified by the copy, so
   rollback does not require a restore.
5. Retain the MySQL backup for the agreed retention period.

### Guardrails

* Never run `prisma migrate reset`, `db:seed`, `truncateAll`, or
  `system/reset` against production.
* Never run the new baseline against the existing MySQL database.
* Never import with a client-supplied `schoolId`; import uses the fixed legacy
  tenant id.
* Do not drop global unique indexes until the data copy has been validated.

---

## 7. Application follow-up (Phases 3–4)

During the transition window the application keeps running against the legacy
MySQL client. The target client is not generated by default until cutover:

```powershell
# current app against MySQL (transition only)
npm run db:generate:legacy

# collection of the PostgreSQL target client, at cutover
npm run db:generate:postgres
```

The schema is intentionally stricter than the current application code. Until
the next phases land:

* Existing queries using global keys (`where: { name }`, `where: { admNo }`,
  `where: { key }`, `where: { id: 1 }`) no longer type-check against the
  generated client.
* `setting`, `admitTemplate`, `markTemplate`, `idCardTemplate` now require the
  school scope; the legacy `id` remains for compatibility but must not be used
  as the tenant selector.
* `schoolId` must be derived from `SchoolMembership`/session on the server.
  Reject or ignore any `schoolId` in body, query string or headers.
* The generic resource engine (`src/lib/resources.ts`) must inject `schoolId`
  into every `where`, `create`, `update`, `delete`, count, group and relation
  filter. `schoolId` must be removed from writable fields.
* `system/reset`, backup/restore and seeding must become tenant-scoped.
* Better Auth routes and the core tables are ready for Phase 3; existing
  `AppUser` login stays in place until the migration is tested.

---

## 8. Verification performed in Phase 2

| Check | Result |
| --- | --- |
| `prisma validate` against PostgreSQL | Passed |
| `prisma format` | Passed |
| `prisma generate` (target PostgreSQL schema) | Passed |
| `prisma generate` (legacy MySQL schema, transition client) | Passed |
| `tsc --noEmit` | Passed against the legacy transition client |
| `next build` | Passed against the legacy transition client |
| Baseline SQL generation (`migrate diff --from-empty`) | Passed, 96 KB |
| Baseline applied to a live PostgreSQL | **Not run** — no PostgreSQL server is installed locally |
| Data migration / cutover | **Not run** — requires a PostgreSQL server and approved window |

The local machine currently runs MySQL 80 only. `.env` was deliberately left
unchanged; run Prisma commands with a PostgreSQL `DATABASE_URL` override until
cutover. The build passes because the local Prisma client is generated from
`prisma/schema.mysql.legacy.prisma`; running `npm run db:generate` switches the
client to the target schema and will surface the expected Phase 3/4 type errors.
