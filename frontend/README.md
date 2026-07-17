# SkillTrack - Enterprise Skill and Learning Tracker

SkillTrack is a production-ready enterprise Skill and Learning Hours Tracking platform. It enables organizations to track employee upskilling, log learning activities, verify skills competencies, and analyze capability gaps using a modular monolithic architecture.

---

## 🏗️ Architecture & Folder Structure

SkillTrack is built on top of **Next.js 15 (App Router)** and **React 19**, using **Material UI v9**, **TanStack Query**, **React Hook Form**, and **Zod**. The backend utilizes **Prisma ORM** connecting to **PostgreSQL**, with security handled via **NextAuth Credentials & RBAC Middleware**.

The project conforms to a clean, decoupled modular monolith pattern:

```
src/
├── app/                     # Next.js Page Router (Page layout shells, API routing endpoints, Server Actions)
│   ├── api/                 # REST interfaces (dashboards, matrices, talent discovery, Udemy syncs)
│   ├── auth/                # Login, Forgot & Reset Password templates
│   ├── dashboard/           # Role-based dashboard widgets and charts
│   ├── skills/              # Skills directory & Custom Request controls
│   ├── learning/            # Historical learning logs & approvals panels
│   ├── skill-matrix/        # Employee-skill horas competency matrix
│   ├── talent-discovery/    # advanced capability discovery filters
│   ├── analytics/           # Deep chart analytics & gap analysis tables
│   ├── reports/             # CSV/Excel/PDF file reports compiler
│   └── udemy/               # Udemy Business analytics & progress dashboards
├── components/              # Shared presentational UI shells (Layout, Theme, Skeletons)
├── services/                # Business logic services (UserService, LearningService, UdemyService, AnalyticsService)
├── repositories/            # Database query layers (UserRepository, SkillRepository, LearningRepository)
├── lib/                     # Singletons (prisma client, NextAuth configuration)
├── types/                   # TypeScript schemas and interface configurations
└── middleware.ts            # NextAuth RBAC request interceptor
```

---

## 🚀 Getting Started

### 1. Requirements
* Node.js v20+
* NPM v10+
* Docker Desktop (optional, for local database container)

### 2. Environment Setup
Copy or edit the `.env` file in the root directory:
```env
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/skilltrack?schema=public"
NEXTAUTH_SECRET="enterpriseproductionreadysecretkey12345"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Spin Up PostgreSQL (Docker)
Start the database service:
```bash
docker-compose up -d postgres
```

### 4. Database Setup & Seeding
Run Prisma migrations and populate the database with the preloaded 300+ skills and reporting structure (Tower Head -> Manager -> Dev):
```bash
# Apply schema
npx prisma db push --schema=src/prisma/schema.prisma

# Seed 300+ skills and mock users
npx prisma db seed
```

### 5. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to access the app.

---

## 👥 Seeding Accounts & Roles

The seeding script populates standard accounts (password for all is `password123`):

1. **Tower Head**: `th.manager@skilltrack.com`
   * Can create Reporting Managers, manage global skills, trigger Udemy configurations, and run organization-wide gap analysis.
2. **Reporting Manager**: `rm.lead@skilltrack.com`
   * Can create Team Members, assess skill proficiencies, approve logs, and track team matrices.
3. **Team Member**: `tm.dev@skilltrack.com`
   * Can log learning hours, submit custom skill requests, and configure individual learning goals.

---

## 📡 Core API Routess

All endpoints check credentials session and return `401 Unauthorized` or `403 Forbidden` if roles are violated:

* **Dashboard (`GET /api/dashboard`)**:
  * Returns role-specific summaries (Widgets & Charts) depending on JWT.
* **Skills Directory (`GET /api/skills`)**:
  * Lists all preloaded skills. Query parameters: `?search=X&category=Y`.
* **Approvals (`GET /api/learning/approvals`)**:
  * Lists pending requests. Query parameter: `?pending=true|false`.
* **Competency Matrix (`GET /api/learning/matrix`)**:
  * Resolves employee rows against skills columns, showing hours spent and proficiency level.
* **Talent Discovery (`GET /api/learning/talent`)**:
  * Filters employees by skillset, minimum logged hours, and proficiency level. Query parameters: `?skillQuery=Python&minHours=50&level=EXPERT`.
* **Udemy Business Sync (`GET /api/udemy`)**:
  * Returns courses, progress tracker, certificates, sync logs history, and config status depending on query `?type=dashboard|courses|progress|certifications|logs|config`.

---

## 🧪 Testing

### 1. Unit Tests (Jest)
Run unit tests for repository query validations and service workflows:
```bash
npm run test
```

### 2. End-to-End Tests (Playwright)
Run integration test suites:
```bash
npx playwright test
```

---

## 🐳 Docker Production Deployment

Build and start the full stack including Next.js and PostgreSQL:
```bash
docker-compose up --build
```
The Next.js container utilizes a multi-stage production build which compiles assets and serves the app on port `3000`.
