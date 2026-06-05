# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GingXR Nexus is an internal company operating system (ICOS) that consolidates CRM, HRM, Recruitment/ATS, Operations, Project Management, Product Management, Bug Tracking, Release Management, Knowledge Base, and Asset Management into a single platform. Built for startups to replace multiple SaaS subscriptions.

## Tech Stack

- Next.js 15 (App Router, Server Components by default)
- TypeScript
- TailwindCSS 3
- shadcn/ui (New York style)
- Prisma ORM + PostgreSQL
- NextAuth.js v5 (Auth.js) with PrismaAdapter
- TanStack Query (React Query)
- Zustand (client state)
- Zod (validation)
- Server Actions (primary API layer)
- Vercel (deployment target)

## Common Commands

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start Next.js dev server |
| `pnpm build` | Production build |
| `pnpm lint` | Run ESLint (`next lint`) |
| `pnpm test` | Run Jest test suite |
| `pnpm test:watch` | Run Jest in watch mode |
| `pnpm db:migrate` | Create and apply Prisma migration (`prisma migrate dev`) |
| `pnpm db:generate` | Regenerate Prisma Client |
| `pnpm db:studio` | Open Prisma Studio GUI |
| `pnpm db:seed` | Run seed script (`tsx prisma/seed.ts`) |
| `pnpm db:reset` | Reset database and re-run migrations |
| `npx shadcn add <component>` | Add shadcn/ui component |

## Architecture

### Folder Structure

```
app/                          # Next.js App Router
├── (auth)/                   # Login, register, forgot-password
├── api/auth/[...all]/        # NextAuth API handler
├── dashboard/                # Dashboard home
├── crm/                      # CRM module
├── hrm/                      # HRM module
├── recruitment/              # ATS / Recruitment module
├── operations/               # Operations module
├── projects/                 # Project Management module
├── product/                  # Product Management module
├── bugs/                     # Bug Tracking module
├── releases/                 # Release Management module
├── knowledge-base/           # Knowledge Base module
├── assets/                   # Asset Management module
├── reports/                  # Reporting / Executive Dashboard
├── settings/                 # Settings & RBAC
├── layout.tsx                # Root layout with sidebar + top nav
└── page.tsx                  # Landing / redirect

components/
├── ui/                       # shadcn/ui components (auto-generated)
├── shared/                   # Reusable app-level components
│   ├── data-table.tsx
│   ├── kanban-board.tsx
│   ├── filter-bar.tsx
│   └── form-builder.tsx
└── [module]/                 # Module-specific components

lib/
├── prisma.ts                 # Prisma singleton (global in dev)
├── auth.ts                   # NextAuth configuration
├── utils.ts                  # `cn()` and generic helpers
├── validations/              # Zod schemas per module
├── hooks/                    # Shared TanStack Query hooks
└── stores/                   # Zustand stores

types/
└── index.ts                  # Shared TS types and interfaces

prisma/
├── schema.prisma             # Single schema with all modules
├── migrations/
└── seed.ts                   # Seed script for realistic demo data
```

### Database Conventions

- All tables use UUID primary keys (`@id @default(uuid())`).
- Every table must include:
  - `id`, `createdAt`, `updatedAt`
  - `createdById`, `updatedById` (foreign keys to `User`)
  - `deletedAt` (nullable DateTime for soft deletes)
- Use `@@map("snake_case")` for table names and `@map("snake_case")` for columns.
- Add indexes on:
  - Foreign keys
  - Frequently filtered fields (`status`, `deletedAt`)
  - Search fields (`email`, `name`)
- Normalize data. Avoid duplication.
- Prisma schema is organized by module with `// ── MODULE N: NAME ──` comments.
- Run `pnpm db:migrate` after any schema change.

### Component Conventions

- Use **Server Components by default**. Add `'use client'` only when interactivity (hooks, browser APIs) is required.
- Maximum **300 lines** per file. Split if larger.
- All components must be typed, accessible, and follow single responsibility.
- Use **only TailwindCSS + shadcn/ui**. Never inline styles.
- Import shadcn components from `@/components/ui/*`.

### API / Server Actions Conventions

- Server Actions are the primary API layer. Place them in `app/[module]/actions.ts` or `lib/actions/[module].ts`.
- Validate every input with Zod before touching the database.
- Enforce RBAC server-side in every action. Never trust client input.
- Return typed responses (`ApiResponse<T>`).
- Handle failures gracefully with specific error messages.

### Auth & RBAC

- NextAuth.js v5 handles authentication. The `User` model includes `role` (enum: `FOUNDER`, `ADMIN`, `HR`, `SALES`, `DEVELOPER`, `PRODUCT_MANAGER`, `EMPLOYEE`, `INTERN`).
- Permissions are role-based. Check `user.role` in Server Actions.
- Every record tracks `createdById` / `updatedById`. Populate these via Server Actions before calling Prisma.

## Design System

Colors (Tailwind theme configured in `tailwind.config.ts`):

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#7C83FD` | Buttons, links, active states |
| `secondary` | `#B8A8FF` | Highlights, chips |
| `accent` | `#B8F2D0` | Success badges, positive indicators |
| `success` | `#A8E6A1` | Confirmations |
| `warning` | `#FFE5A3` | Warnings |
| `danger` / `destructive` | `#FFB5B5` | Errors, deletes |
| `background` | `#FAFAFC` | App background |
| `card` | `#FFFFFF` | Cards, panels |
| `foreground` | `#1A1A1A` | Primary text |
| `muted` | `#F4F4F6` | Subtle backgrounds |
| `muted-foreground` | `#6B7280` | Secondary text |
| `border` / `input` | `#EAEAEA` | Borders, dividers |

Style direction: Modern SaaS, Apple-inspired, minimalistic, pastel themed, generous whitespace, no enterprise clutter.

## Modules

1. **CRM** — Lead pipeline: `New → Qualified → Meeting Scheduled → Proposal Sent → Negotiation → Won / Lost`. Kanban + table views, activity log, follow-ups.
2. **HRM** — Employee directory, attendance, leave requests (Casual / Sick / Earned / WFH), holiday calendar, org chart.
3. **Recruitment** — ATS pipeline: `Applied → Screening → Interview → Technical Round → Assignment → Offer → Hired / Rejected`. Scorecards, interview scheduling.
4. **Operations** — Investor, grant, partnership, and vendor management with timeline and calendar views.
5. **Projects** — Jira-like task management with sprints, kanban, calendar, subtasks, dependencies, comments, attachments.
6. **Product** — Feature matrix across platforms (`iOS`, `Android`, `Website`, `API`, `Backend`). Tracks features, sub-features, and per-platform status (`Not Started → Planned → In Progress → Testing → Blocked → Done`).
7. **Bugs** — Linear-style issue tracker. Severity: `Critical / Major / Minor / Trivial`. Status: `Open → Investigating → In Progress → Testing → Resolved → Closed`.
8. **Releases** — Version tracking linked to features, tasks, and bugs. Auto-generated changelogs via `ReleaseNote`.
9. **Knowledge Base** — Internal wiki with rich text articles, categories, version history (`ArticleVersion`).
10. **Assets** — Company asset tracking (domains, servers, licenses, accounts) with expiry alerts and employee assignments.

Global features: AI Assistant panel, Global Search, Notifications (in-app + email), Reporting dashboard.

## Cross-Module Awareness

Before modifying any module, check impact on all others. Maintain consistency in:
- Data models (always use base entity fields)
- UI patterns (tables, kanban, forms, filters)
- Permission checks
- Activity logs / notifications

## Performance Guidelines

- Prefer Server Components and Server Actions.
- Use pagination for all tables and lists.
- Lazy-load heavy client components (`next/dynamic`).
- Cache aggressively with React Server Components and appropriate `revalidate` patterns.
- Avoid N+1 queries; use Prisma `include` / `select` carefully.

## Testing

- Every feature requires unit tests and integration tests.
- A feature is **not complete** until tests pass.
- Use Jest + React Testing Library (already configured).

## Git Commits

Format: `module: short description`

Examples:
- `crm: add lead pipeline`
- `hrm: implement leave approvals`
- `product: add platform tracking`
- `bugs: add issue lifecycle`

Never bundle unrelated changes.
