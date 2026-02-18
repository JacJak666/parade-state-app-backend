# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server with hot-reload (tsx watch)
npm run build        # Compile TypeScript to dist/
npm start            # Run compiled output (requires build first)

npm run db:migrate   # Run Prisma migrations (creates/updates dev.db)
npm run db:seed      # Seed 50 recruits + sample statuses
npm run db:generate  # Regenerate Prisma client (after schema changes)
npm run db:reset     # Drop and re-migrate (destroys data)
```

> **npm installs**: If you get EACCES errors on `~/.npm`, use `--cache /tmp/npm-cache`.

## Architecture

**Stack**: Fastify v5 + Prisma v7 + SQLite (better-sqlite3) + TypeScript (ESM/NodeNext)

### Key Prisma v7 Constraints

- **Do not add `url` to `prisma/schema.prisma`** — Prisma v7 removed datasource `url` from schema files. The database URL is configured in `prisma.config.ts` only.
- The generated client lives at `prisma/generated/prisma/` (not the default location). Imports use `../../prisma/generated/prisma/client.js`.
- `@prisma/adapter-better-sqlite3` is required; the PrismaClient is instantiated with an adapter in `src/lib/prisma.ts`.

### Request Flow

```
HTTP Request
  → Fastify route handler (src/routes/)
  → try/catch in each handler (returns explicit HTTP codes)
  → Service function (src/services/)
  → Prisma (src/lib/prisma.ts)
```

**Important**: Fastify's global `setErrorHandler` (in `src/app.ts`) does NOT reliably catch errors from encapsulated route plugins. Every route handler must have its own `try/catch` that returns the correct HTTP status code.

### Data Model

**Recruit ID format**: 4-digit string `PSBB`
- P = platoon (digit 1, non-zero)
- S = section (digit 2, non-zero)
- BB = bed (digits 3–4, non-zero as a number)
- Example: `"1203"` → Platoon 1, Section 2, Bed 03

`parseRecruitId()` in `src/utils/recruitId.ts` derives platoon/section/bed from the ID.

**StatusType enum**: `MC | LD | EX | SEND_OUT_URGENT | SEND_OUT_NON_URGENT | REPORTING_SICK | OTHERS`
- `RIB` was intentionally removed — do not add it back.

### Out-of-Camp Rules (in `paradeStateService.ts`)

| Status | Out of camp? |
|--------|-------------|
| MC | Always |
| SEND_OUT_URGENT | Always |
| SEND_OUT_NON_URGENT | Always |
| EX | Only if remark contains "STAY OUT" (case-insensitive) |
| All others | No (in-camp) |

### Parade State Output Format

`formatService.ts` produces per-platoon text blocks. Section order within each block:

```
Platoon X: {inCamp}/{totalStrength}     ← zero-padded to 2 digits
Out of Camp: {count}

EX STAY IN: {stayInCount}/{totalExCount}
{id} ({DDMMYY}-{DDMMYY})

MC: {count}
{id} - {N}D MC {remark} ({DDMMYY}-{DDMMYY})

Status: {unique}/{unique}               ← same number both sides

LD: {count}
EX: {count}                             ← full detail with remark
RS: {count}
OTHERS: {count}                         ← includes SEND_OUT_* types
```

- Dates in `DDMMYY` format (e.g., `180226` = 18 Feb 2026)
- Duration `{N}D` = `differenceInDays(end, start) + 1`
- endDate is **inclusive** — a status with endDate 18 Feb is active on 18 Feb and auto-deleted at 19 Feb 0000 UTC

### Auto-Delete

`deleteExpiredStatuses()` in `src/services/statusService.ts` deletes records where `endDate < today midnight UTC`. It runs on server startup and daily at midnight UTC via `scheduleDailyMidnightUTC()` in `src/server.ts`.

### Frontend

Single-page `public/index.html` served by `@fastify/static`. Three tabs: Parade State (with dynamic platoon checkboxes), Recruits, Statuses. No build step — plain HTML/JS.

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/recruits` | Create recruit `{ id: string }` |
| GET | `/recruits` | List all recruits |
| GET | `/recruits/:id` | Get single recruit |
| POST | `/status` | Create status record |
| GET | `/status/active?date=YYYY-MM-DD` | Active statuses for date |
| DELETE | `/status/:id` | Delete status by UUID |
| GET | `/parade-state/platoons` | Available platoon numbers |
| GET | `/parade-state?date=YYYY-MM-DD&platoon=1,2` | Generate parade state |
