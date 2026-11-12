# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

BIRAS — Bullying Incident Reporting & Assessment System. An Express 5 + SQLite app with a public anonymous reporting portal and a session-authenticated admin console.

All code lives in [bullying-report-system/](bullying-report-system/) — the repo root is just a wrapper. Run every command from inside that directory.

## Commands

```powershell
cd bullying-report-system
npm install
npm start        # node server.js
npm run dev      # nodemon server.js
npm run seed     # inserts admin/admin123 into the admins table, then closes the DB
```

Server listens on `PORT` from `.env` (default 3000). There are no tests, linter, or build step — verify changes by running the server and exercising the pages.

`.env` holds `PORT`, `SESSION_SECRET`, and `GEMINI_API_KEY`. The Gemini key and the `@google/generative-ai` dependency are currently unused by any code — no AI severity/category classification is wired up, despite the `severity_level`/`category` columns defaulting to `'Pending Assessment'`/`'Uncategorized'`.

## Architecture

Classic layered Express: `server.js` → `routes/` → `controllers/` → `config/db.js`. Everything is callback-style `sqlite3` (no promises, no ORM).

**Rendering model.** There is no template engine. Routes `res.sendFile()` static HTML from `views/`, and each page fetches its own JSON from the API on load. So server-side route handlers never inject data — if a page needs data, add an API endpoint and a `fetch` in the HTML. Views are self-contained: Tailwind via CDN (`@tailwindcss/browser@4`), Font Awesome via CDN, and all CSS/JS inlined in `<style>`/`<script>` blocks. There is no shared layout, component, or stylesheet — changes to nav/branding must be repeated across files. Views are large (25–57KB each).

**Route layout.**
- [routes/reports.js](bullying-report-system/routes/reports.js) mounted at `/` — public pages (`/`, `/submit-report`, `/track-report`, `/report-success`), `POST /submit-report`, and `GET /api/track/:token`.
- [routes/admin.js](bullying-report-system/routes/admin.js) mounted at `/admin` — login/logout, protected HTML views, and the `/admin/api/*` JSON endpoints. Every route except `GET|POST /admin/login` is gated by `isAuthenticated`.
- [server.js](bullying-report-system/server.js) also registers `GET /api/reports/:token` directly (this is the endpoint `track-report.html` actually calls; `/api/track/:token` in the reports router is an unused duplicate of the same controller).

**Auth.** Session-cookie only, no JWT. [middleware/auth.js](bullying-report-system/middleware/auth.js) checks `req.session.isAdminLoggedIn === true` and *redirects* unauthorized requests to `/admin/login` rather than returning 401 — so an expired-session `fetch()` from an admin page receives the login HTML with a 200, not an error. Handle that when writing new admin front-end code.

**Database.** [config/db.js](bullying-report-system/config/db.js) is the single connection module; requiring it creates `database.db` (committed to the repo), runs `CREATE TABLE IF NOT EXISTS` for `reports` and `admins`, and auto-seeds `admin`/`admin123` whenever the `admins` table is empty. Because it is `CREATE TABLE IF NOT EXISTS`, adding a column to the schema in this file has no effect on an existing `database.db` — you must migrate manually or delete the DB file.

The `admins` table uses `password_hash`; [controllers/authController.js](bullying-report-system/controllers/authController.js) falls back to a legacy `password` column. Hashing is `bcryptjs` (`bcrypt` is also installed but unused).

**Tracking tokens.** Generated in [controllers/reportController.js](bullying-report-system/controllers/reportController.js) as `DG-` + 3 random bytes hex, uppercased. Only 6 hex chars — collisions are possible and the `INSERT` has no retry, so a collision surfaces as a `UNIQUE` constraint 500. Lookups uppercase and trim the input token.

**File uploads.** The live multer config is defined inline in [routes/reports.js](bullying-report-system/routes/reports.js): 5MB cap, jpg/jpeg/png/pdf by extension *and* mimetype, written to `public/uploads/` (created at require time), stored in the DB as `/uploads/<filename>`. Served because `public/` is `express.static`. Note `.gitignore` ignores `uploads/*`, not `public/uploads/*`, so uploaded evidence is currently tracked by git.

## Known dead code

Don't extend these; they are stale and not wired into anything:
- [models/Report.js](bullying-report-system/models/Report.js) — requires a nonexistent `config/database`, and its schema (`tracking_code`, `location`, `is_anonymous`, `image_path`) does not match the actual `reports` table. It would throw if ever required. No controller uses a model layer; controllers write SQL directly.
- [middleware/upload.js](bullying-report-system/middleware/upload.js) — a second multer config targeting `./uploads/` with different allowed types. Unused; the empty top-level `uploads/` dir is its leftover.
- `express-rate-limit` is installed but never applied — `POST /submit-report` and `POST /admin/login` are both unthrottled.

## Client/server mismatches to be aware of

Several admin pages send query params the server ignores, then filter client-side after fetching everything:
- `dashboard.html` requests `/admin/api/reports?limit=5`; `getAllReports` returns all rows.
- `analytics.html` requests `/admin/api/analytics-data?range=...`; the handler always returns an ungrouped-by-date `category, COUNT(*)` aggregate.

If you add filtering/pagination, add it to the handler in [controllers/adminController.js](bullying-report-system/controllers/adminController.js) (or the inline `/api/analytics-data` handler in `routes/admin.js`) rather than growing the client-side workaround.

`report-detail.html` derives the report id from the last URL path segment, so `/admin/reports/:id` must stay a path param.

## Conventions

- CommonJS (`"type": "commonjs"`), 4-space indent, `exports.name = (req, res) => {}` in controllers.
- Always use parameterized SQL (`?` placeholders) — existing bulk delete builds placeholders from the array length, follow that pattern.
- Controllers log errors to console and return `{ error: '...' }` JSON with 4xx/5xx; page routes redirect instead.
- Public form posts are `application/x-www-form-urlencoded` and end in a `res.redirect`; admin API calls are JSON `fetch`.
- Several handlers still contain `console.log` diagnostic blocks (upload payload in `submitReport`, the full admin DB row in `loginAdmin` — that one prints the password hash). Strip them if you touch those functions.
