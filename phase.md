# School ERP SaaS Multi-Tenant Migration — Implementation Tasks

## PHASE 1 — Analyze Existing Project Architecture

I have an existing, fully developed School ERP / School Management System.

I want to convert this existing application into a production-ready multi-tenant SaaS platform.

IMPORTANT:
- Do not rebuild the project.
- Do not remove existing features.
- Do not unnecessarily change the frontend UI.
- Do not break existing APIs.
- Preserve all existing modules and business logic.
- First understand the existing codebase.

Tasks:

1. Analyze the entire project structure.
2. Identify frontend and backend technologies.
3. Identify the database and ORM.
4. Analyze the existing authentication system.
5. Analyze all existing database tables and relationships.
6. Identify all APIs, routes, controllers and middleware.
7. Identify all existing user roles.
8. Identify every module that stores school-related data.
9. Identify existing relationships between students, fees, teachers, classes, attendance and other modules.

Create an architecture analysis document.

Identify which database tables need schoolId.

Do not implement changes yet.

Provide:
- Current architecture.
- Proposed multi-tenant architecture.
- Database migration plan.
- Authentication migration plan.
- API modification plan.
- Potential breaking changes.
- Implementation order.

Wait for approval before making changes.

---

## PHASE 2 — Design Multi-Tenant Database Architecture

Implement a Shared Database / Shared Schema multi-tenant architecture.

Requirements:

1. All schools must use one PostgreSQL database.
2. All schools must share the same database tables.
3. Every school must have a unique schoolId.
4. All school-specific records must be associated with schoolId.
5. Data belonging to one school must never be accessible by another school.

Create or modify the following entities according to the existing ORM:

School:
- id
- name
- slug
- email
- phone
- address
- logo
- status
- subscriptionPlan
- createdAt
- updatedAt

User:
- id
- name
- email
- password/authentication fields managed by Better Auth
- createdAt
- updatedAt

SchoolMembership:
- id
- schoolId
- userId
- role
- status
- createdAt
- updatedAt

Add schoolId to all existing school-specific tables.

Examples:
- Students
- Teachers
- Staff
- Classes
- Sections
- Subjects
- Attendance
- Fees
- Fee Payments
- Exams
- Results
- Expenses
- Homework
- Timetables
- Transport
- Library
- Notifications
- Reports

Important database rules:

- Add proper indexes on schoolId.
- Add composite unique constraints where necessary.
- Prevent duplicate records within the same school.
- Preserve existing primary keys where possible.
- Use appropriate foreign keys.
- Ensure related records cannot reference another school's records.
- Never trust schoolId provided by the frontend.
- Never allow users to change their schoolId through normal APIs.

Before applying migrations, prepare a safe migration strategy.

Do not delete existing records.

---

## PHASE 3 — Implement Better Auth

Replace or integrate the existing authentication system with Better Auth.

Requirements:

1. Install and configure Better Auth using the correct API for the installed version.
2. Use the official Better Auth organization plugin for school membership and organization management where appropriate.
3. Each school should function as an organization/tenant.
4. Users should be able to log in using email and password.
5. Support email verification.
6. Support forgot password.
7. Support session management.
8. Support secure logout.
9. Support multiple users belonging to different schools.
10. Support configurable organization roles and permissions.

Authentication flow:

- User logs in.
- Better Auth verifies credentials.
- Backend validates the session.
- Backend identifies the user's active school membership.
- Backend identifies the user's role.
- Backend loads the authorized school context.
- Backend allows access only to authorized resources.

Important:

- Never trust schoolId from request body, query parameters or headers.
- Never trust role information coming from the frontend.
- Validate membership and permissions on the backend.
- Use secure cookies and appropriate CORS configuration.
- Keep all authentication secrets in environment variables.
- Do not store plaintext passwords.
- Do not break existing login functionality until the migration is tested.

---

## PHASE 4 — Implement Role-Based Access Control (RBAC)

Create a centralized permission management system.

Initial roles:

1. SUPER_ADMIN
2. SCHOOL_OWNER
3. SCHOOL_ADMIN
4. STAFF
5. TEACHER
6. ACCOUNTANT

Create permissions such as:

- student.create
- student.read
- student.update
- student.delete
- teacher.create
- teacher.read
- teacher.update
- teacher.delete
- attendance.create
- attendance.read
- attendance.update
- fees.create
- fees.read
- fees.update
- fees.delete
- reports.read
- settings.update
- staff.manage

Permission requirements:

SUPER_ADMIN:
- Manage all schools.
- Manage subscriptions.
- Manage school owners.
- Access platform-wide analytics.
- Suspend and activate schools.

SCHOOL_OWNER:
- Full access to their own school.
- Manage school administrators.
- Manage staff and permissions.
- Manage school settings.

SCHOOL_ADMIN:
- Full operational access according to assigned permissions.
- Manage students, teachers, classes and school modules.

STAFF:
- Create and read permitted records.
- Cannot delete or perform unauthorized updates.

TEACHER:
- Access assigned classes.
- Read relevant student information.
- Manage permitted attendance and academic records.

ACCOUNTANT:
- Manage fees and payments.
- Access financial reports.
- Cannot access unauthorized administrative settings.

Create centralized middleware:

- authenticateUser
- requireSuperAdmin
- requireSchoolMembership
- requireRole
- requirePermission

Do not duplicate permission logic in every controller.

---

## PHASE 5 — Implement Tenant Isolation Middleware

This is the most important security task.

Create centralized tenant middleware.

For every authenticated school request:

1. Verify the Better Auth session.
2. Identify the authenticated user.
3. Identify the active school membership.
4. Verify that the membership is active.
5. Resolve the authorized schoolId from trusted server-side data.
6. Attach the school context to the request.
7. Reject unauthorized access.

Example conceptual request context:

req.user = authenticatedUser

req.school = {
  id: authorizedSchoolId,
  role: membershipRole
}

All school-related database queries must automatically include the authorized schoolId.

Example:

Incorrect:

Student.findMany()

Correct:

Student.findMany({
  where: {
    schoolId: req.school.id
  }
})

Important:

- Never use frontend-provided schoolId as authorization.
- Never allow one school to read another school's records.
- Never allow cross-school updates or deletes.
- Validate schoolId on related records.
- Handle background jobs with explicit school context.
- Apply tenant isolation to exports, reports, search, file uploads and notifications too.

---

## PHASE 6 — Migrate Existing APIs

Analyze every existing API endpoint and update it for multi-tenancy.

Use the following permission model:

SUPER_ADMIN:
- Platform-level operations.

SCHOOL_OWNER:
- Full CRUD access within their school.

SCHOOL_ADMIN:
- Configurable CRUD access within their school.

STAFF:
- Create and read permitted records.
- No update or delete unless explicitly authorized.

TEACHER:
- Access assigned classes and authorized academic operations.

ACCOUNTANT:
- Access financial modules according to permissions.

For every endpoint:

1. Verify authentication.
2. Verify school membership.
3. Verify permissions.
4. Apply schoolId filtering.
5. Validate related records belong to the same school.
6. Return only authorized data.

Update:
- GET
- POST
- PATCH
- PUT
- DELETE

Do not modify existing response structures unnecessarily.

Do not introduce duplicate API endpoints if existing endpoints can be safely extended.

---

## PHASE 7 — School Registration and Onboarding

Implement SaaS school onboarding.

Flow:

1. A school owner registers.
2. Create the school record.
3. Create the Better Auth organization.
4. Associate the owner with the school.
5. Assign SCHOOL_OWNER role.
6. Initialize school settings.
7. Create default academic session if applicable.
8. Redirect the owner to their school dashboard.

Important:

- School creation and owner membership must be handled safely.
- Avoid duplicate school creation.
- Use database transactions where appropriate.
- Validate email and school information.
- Generate unique school slugs.
- Prevent unauthorized users from creating privileged roles.

---

## PHASE 8 — School Staff Management

Implement staff management inside each school's dashboard.

School Owner/Admin should be able to:

- Invite staff through email.
- Create staff accounts using a secure invitation flow.
- Assign roles.
- Configure permissions.
- Activate or deactivate staff.
- Remove staff access.
- View staff activity.

A staff member must only access the school they belong to.

If a user belongs to multiple schools, provide an authorized school-switching mechanism.

Changing schools must change the server-validated tenant context.

Never allow a user to access a school simply by changing a URL or request parameter.

---

## PHASE 9 — Super Admin Dashboard

Create a platform-level Super Admin dashboard.

Features:

- Total schools.
- Active schools.
- Suspended schools.
- Total users.
- Total students across the platform.
- School registration analytics.
- Subscription management.
- School details.
- Create school.
- Activate/deactivate school.
- Manage school owners.
- Manage subscriptions.

SUPER_ADMIN must be separate from normal school-level roles.

Do not expose platform-wide data to SCHOOL_OWNER or SCHOOL_ADMIN.

---

## PHASE 10 — Migrate Existing School Data

I already have existing school records in my database.

Create a safe migration process.

Requirements:

1. Create a default school for existing records.
2. Assign the existing records to the correct schoolId.
3. Associate existing administrators with that school.
4. Preserve student IDs.
5. Preserve payment history.
6. Preserve attendance records.
7. Preserve teacher and staff records.
8. Preserve all existing relationships.
9. Verify record counts before and after migration.

Do not truncate tables.

Do not delete production records.

Use backup and rollback procedures.

Do not make schoolId nullable permanently unless a genuine business requirement exists.

---

## PHASE 11 — Security and Cross-Tenant Testing

Create automated integration tests for tenant isolation.

Test scenarios:

1. School A cannot read School B students.
2. School A cannot update School B students.
3. School A cannot delete School B students.
4. School A cannot access School B payments.
5. School A cannot access School B attendance.
6. School A cannot access School B teachers.
7. Staff cannot access unauthorized modules.
8. Teacher cannot access unassigned classes.
9. Accountant cannot manage unauthorized settings.
10. Suspended school users cannot access protected resources.
11. A user cannot escalate their role by modifying API requests.
12. A user cannot change schoolId to access another tenant.
13. Cross-school relationships are rejected.
14. Reports and exports contain only authorized school data.

Test all existing modules.

Fix security issues before proceeding.

---

## PHASE 12 — Production Readiness

Prepare the application for production SaaS deployment.

Requirements:

- Secure Better Auth configuration.
- Correct session expiration.
- Secure cookies.
- Rate limiting.
- Input validation.
- Database indexes.
- Database connection pooling.
- Error handling.
- Audit logs.
- Backup strategy.
- Database migrations.
- Subscription enforcement.
- School suspension handling.
- Secure file storage.
- API documentation.
- Automated integration tests.

Check performance with multiple schools and large datasets.

Avoid loading all tenants' records into memory.

Ensure every school-related query is tenant-scoped.

---

## FINAL REQUIREMENT

This is an existing production-ready School ERP that needs SaaS architecture, not a new application.

Preserve all existing modules, UI, APIs and business logic wherever possible.

Use one shared database with schoolId-based tenant isolation.

Use Better Auth for authentication and school membership.

Use centralized RBAC and backend authorization.

Implement each phase incrementally.

After each phase:

1. Explain files created and modified.
2. Explain database changes.
3. Run relevant tests.
4. Report any breaking changes.
5. Provide manual testing steps.
6. Wait for approval before proceeding to the next phase.

Never claim that a feature is complete without implementing and testing it.