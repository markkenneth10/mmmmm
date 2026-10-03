# Climate Action — Mobile & Web Climate Action Reporting and Information System

A full-stack municipal environmental reporting, ecological governance, and climate action portal for Metro Verde. Architected with high-performance Node.js, WebAssembly SQLite relational database persistence, citizen GIS spatial tracking, and dedicated LGU CENRO administrative command infrastructure.

> **Status:** The production Node.js + SQLite relational database architecture is permanently maintained.

## Core Architecture & Portals

### 1. Citizen Portal (`/` -> `public/index.html`, `public/app.js`)
- **GIS Incident Reporting & Geotagging:** Interactive Leaflet GIS map picker, category classification (waste, tree cutting, open burning, water pollution, flooding, heat, air pollution), photo evidence, and severity rating.
- **Incident Lifecycle Stepper:** 5-stage tracking (*Submitted -> Under Review -> Verified -> In Progress -> Resolved*) with official audit trail.
- **Citizen KYC & ID Verification:** PhilSys, Driver's License, and UMID government ID submission with administrative verification workflow.
- **Eco-Points & Community Activities:** Earn points for filing reports, participating in community restoration drives, and taking the interactive climate quiz.
- **Real-Time Climate Advisories:** Heat index gauges, PAGASA weather bulletins, and emergency hotline directory.

### 2. CENRO Administrative Command Console (`/admin` -> `admin/index.html`, `admin/admin.js`)
- **Session-Based Multi-Role Governance:** Super Admin and Sub-Admin accounts with role-based access control.
- **Incident Triage & Officer Dispatch:** Update statuses, assign field response units, and attach official resolution evidence.
- **Citizen KYC Approvals:** Inspect submitted identity documents and manage citizen standing.
- **Municipal Weather Alert Broadcaster:** Update municipal heat index, typhoon signals, and broadcast advisories.
- **CMS & Website Configuration:** Full content management for hotline directories, educational cards, and brand logos.
- **Relational Database Telemetry:** Live table row monitoring, SQLite database binary export (`.sqlite`), and force synchronization.

### 3. Data Persistence & Permanent Database Engine
- **Relational Database:** WebAssembly SQLite database engine (`db.cjs` -> `climate_database.sqlite`) with schema tables for admins, users, reports, website config, emergency hotlines, weather advisories, announcements, user guides, activities, participations, sessions, and media uploads.
- **Permanent Backups:** Redundant persistence via local disk, `/tmp/climate_database.sqlite`, `db_backups/climate_database_permanent_backup.sqlite`, and synchronous JSON fallback stores.

## Server Commands
- **Start / Dev:** `npm run dev` (runs `node server.cjs`)
- **Build / Verification:** `npm run build` (runs database & server integrity checks)
- **Port:** Default port `3000` (or `APP_PORT` / `PORT`)
