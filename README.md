# ICE School Manager

A complete institute-management system rebuilt from the original
`ICE20Manager.html` single-file app as a **Next.js App Router** project with
**Route Handlers**, **Prisma** and **MySQL**. The UI, menus and workflows match
the original, but every record is read from and written to MySQL through the
server. The browser never talks to the database directly.

## What is included

- **Front office** – enquiries, visitors, phone calls, postal dispatch/receive, complaints, front-office setup.
- **Students** – student directory and profile, guided admission, online-admission approval, disabled students, multi-class students, bulk delete, categories, houses, disable reasons.
- **Fees** – fee groups, types, discounts, masters, carry-forward, reminders, fee collection with printable receipts, receipt search/revert, due-fee search, offline bank payments with approval.
- **Expenses** – add expense, search expense, expense heads.
- **Attendance** – student and staff attendance entry, attendance register by date, student leave approval.
- **Examinations** – exam groups, schedules, marks entry, printable admit cards and marksheets, admit/marksheet design, grades, divisions, online exams and question bank.
- **Lessons** – lessons, topics, lesson plans, syllabus progress, copy lessons between classes.
- **HR** – staff directory, departments, designations, leave types, leave approval, ratings, payroll with payslips.
- **Communication** – notice board, email/SMS composer with templates and logs, WhatsApp links, fee reminders, credentials, scheduled messages.
- **Download centre** – content types, file uploads stored in MySQL, shared content.
- **Homework, library, inventory, transport, hostel, certificates, ID cards, alumni.**
- **Reports** – students, finance, attendance, exams, online exams, lessons, HR, homework, library, inventory, transport, hostel, alumni, user log, audit trail. CSV export and print.
- **Settings** – general, subscription, assistant, WhatsApp reminders, sessions, print header/footer, roles and permissions, languages, users, custom fields, captcha, student profile fields, file types, backup/restore/reset.

All money values are `Decimal(12,2)` in MySQL and serialized deliberately; no
floating-point arithmetic is used for stored fee, payment, payroll or expense
amounts.

## Requirements

- Node.js 20 or newer
- MySQL 8.0 (either the project-local instance described below or your existing server)
- npm (included with Node.js)

## 1. Install dependencies

```powershell
npm install
```

## 2. Choose a MySQL server

### Option A — project-local MySQL on port 3307 (recommended for a clean trial)

This repository was developed against a private MySQL instance under
`.mysql\data` that listens on **3307**, so it does not touch any existing MySQL
service on 3306. `.mysql\` is ignored by Git.

If the `.mysql` folder already exists on this machine, just run:

```powershell
npm run db:start
```

To recreate it from scratch on Windows:

```powershell
$mysql = "C:\Program Files\MySQL\MySQL Server 8.0\bin"
New-Item -ItemType Directory -Force .mysql | Out-Null
& "$mysql\mysqld.exe" --initialize-insecure --basedir="C:\Program Files\MySQL\MySQL Server 8.0" --datadir="$PWD\.mysql\data"
```

Create `.mysql\my.ini`:

```ini
[mysqld]
port=3307
basedir="C:/Program Files/MySQL/MySQL Server 8.0"
datadir="E:/institute ims/.mysql/data"
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci
mysqlx=0
skip-log-bin
default-storage-engine=InnoDB
max_connections=100
```

Start it, set a password and create the database:

```powershell
npm run db:start
& "$mysql\mysql.exe" -h 127.0.0.1 -P 3307 -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'ice20dev'; CREATE DATABASE IF NOT EXISTS ice20manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Stop it later with:

```powershell
npm run db:stop
```

### Option B — your existing MySQL on 3306

```sql
CREATE DATABASE ice20manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'iceuser'@'localhost' IDENTIFIED BY 'your-password';
GRANT ALL PRIVILEGES ON ice20manager.* TO 'iceuser'@'localhost';
FLUSH PRIVILEGES;
```

Then point `DATABASE_URL` at that server.

## 3. Configure environment variables

Copy `.env.example` to `.env` and edit it. `.env` and `.env.local` are ignored by
Git and must never be committed.

```ini
DATABASE_URL="mysql://root:ice20dev@127.0.0.1:3307/ice20manager"
AUTH_SECRET="a-long-random-secret"
```

**URL-encode special characters in the password**: `@` → `%40`, `:` → `%3A`,
`/` → `%2F`, `#` → `%23`. For example, a password `p@ss:word` becomes
`p%40ss%3Aword`.

Generate `AUTH_SECRET` with:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

`AUTH_SECRET` signs the HttpOnly `ice_session` cookie. A development fallback
exists, but production refuses to start without a real value.

## 4. Create the schema and demo data

```powershell
npx prisma migrate deploy
npx prisma generate
npm run db:seed
```

For local schema development, `npm run db:migrate` creates a new migration and
applies it.

The seed is deterministic and resets the demo dataset. It creates 48 students
plus demo classes, fees, payments, staff, exams, library/inventory/transport
records, settings, roles and users. `POST /api/system/reset` runs the same seed
from the UI.

## 5. Run the app

```powershell
npm run dev
```

Open <http://localhost:3000>.

### Demo accounts

| Username   | Password     | Role        |
| ---------- | ------------ | ----------- |
| `admin`    | `admin123`   | Admin       |
| `teacher`  | `teacher123` | Teacher     |
| `accounts` | `acc123`     | Accountant  |

Change these passwords (or create real users under **System Setting → Users**)
before using the system for real data.

## Production build

```powershell
npm run build
npm run start
```

Set `DATABASE_URL`, `AUTH_SECRET` and `NODE_ENV=production` in the server
environment. Run `npx prisma migrate deploy` on every deployment, never
`migrate dev`.

## Useful scripts

| Script             | Purpose                                            |
| ------------------ | -------------------------------------------------- |
| `npm run dev`      | Start Next.js in development mode                  |
| `npm run build`    | Production build                                   |
| `npm run start`    | Serve the production build                         |
| `npm run typecheck`| TypeScript check (`tsc --noEmit`)                  |
| `npm run db:start` | Start the project-local MySQL on port 3307         |
| `npm run db:stop`  | Stop the project-local MySQL                       |
| `npm run db:validate` | Validate `prisma/schema.prisma`                |
| `npm run db:migrate`  | Create/apply a development migration           |
| `npm run db:generate` | Regenerate Prisma Client                       |
| `npm run db:seed`     | Load the deterministic demo dataset            |
| `npm run db:reset`    | Drop, recreate and re-seed the database         |

## How the project is organised

```
prisma/
  schema.prisma          # ~70 models, indexes, FKs, Decimal money, @db.Date
  migrations/            # applied SQL migrations
  seed.ts                # CLI seed wrapper around src/lib/seed.ts
src/app/
  (app)/                 # authenticated shell + catch-all page renderer
  login/                 # login screen
  api/                   # Route Handlers (all server-side)
src/components/
  pages/                 # page renderer, generic configs, custom workflows
  crud/                  # reusable table/form CRUD component
  AppShell.tsx           # sidebar, top bar, search, alerts, assistant
  DynamicForm.tsx        # schema-driven form fields
src/lib/
  auth.ts                # signed cookie sessions, roles, permissions
  resources.ts           # metadata-driven CRUD registry and validation
  fees.ts                # fee engine, collection, receipts, approvals
  exams.ts               # results, marksheets, rank, admit cards
  attendance.ts          # attendance entry and reports
  reports.ts             # report builders
  communications.ts      # recipients, templates, message log
  settings.ts            # school settings and document templates
  backup.ts              # backup/restore
  seed.ts                # shared demo-data generator
```

### API surface

All endpoints are under `/api` and require an authenticated session; most also
check a module permission.

- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `GET /api/auth/captcha`
- `GET|POST /api/resources/[resource]`, `GET|PATCH|DELETE /api/resources/[resource]/[id]`
- `GET /api/lookups`, `GET /api/search`, `GET /api/dashboard`, `GET /api/alerts`, `POST /api/assistant`
- `GET /api/fees/student/[id]`, `POST /api/fees/collect`, `POST /api/fees/collect-all`, `GET /api/fees/due`, `GET /api/fees/pending`, `DELETE /api/fees/payments/[id]`, `POST /api/fees/bank/[id]`
- `GET|POST /api/attendance`, `GET /api/attendance/report`
- `GET /api/exams/results`, `POST /api/exams/results/save`, `GET /api/exams/marksheets`, `GET /api/exams/admit-card`
- `GET /api/lessons/syllabus`
- `GET /api/reports/[type]`
- `GET /api/settings`, `PATCH /api/settings`, `GET|PATCH /api/templates`
- `GET /api/communications/recipients`, `POST /api/communications/send`, `POST /api/communications/reminders`, `POST /api/communications/credentials`, `POST /api/communications/schedule/[id]/send`
- `POST /api/certificates`
- `POST /api/actions/[action]` – bulk delete, payroll generate/pay, book return, leave status, student/staff status, lesson copy, online-admission approval/rejection, change password
- `GET /api/system/backup`, `POST /api/system/restore`, `POST /api/system/reset`, `GET /api/system/stats`

## Backup and restore

**System Setting → Backup & Reset** downloads a JSON snapshot of school data
(students, fees, staff, attendance, exams, library, inventory, transport,
hostel, certificates, settings). User accounts, roles and audit logs are
deliberately excluded so a restore does not overwrite the people who can log
in. The same JSON can be pasted back or loaded from a file.

## Notes and troubleshooting

- **`P1001: Can't reach database server`** – start MySQL (`npm run db:start` for
  3307) and check the host/port in `DATABASE_URL`.
- **`P1000: Authentication failed`** – the password in `DATABASE_URL` is wrong
  or not URL-encoded.
- **`P1010: User was denied access`** – grant the user privileges on the
  `ice20manager` schema.
- **`AUTH_SECRET must be configured in production`** – set a real random secret
  in `.env`/the host environment.
- **Port 3000 already in use** – run `npm run dev -- -p 3001`.
- **Demo data looks stale** – run `npm run db:seed` or use **Backup & Reset → Reset to demo data**.
- **Printing receipts/documents** – print from the document modal; the print
  stylesheet hides the app chrome and prints only the document.
- The original `ICE20Manager.html` is kept in the repository as the reference
  for the UI and business rules; it is not used at runtime.
