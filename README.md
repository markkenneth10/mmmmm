# Climate Action — Mobile & Web Climate Action Reporting and Information System

A civic environmental reporting and ecological governance application rewritten as a modern React application with TypeScript, Vite, Tailwind CSS, Leaflet GIS, and Lucide icons.

## Features

### 1. Citizen Incident Reporting & Spatial Geotagging
- File environmental hazard tickets with category classification (Improper waste disposal, Illegal tree cutting, Open burning, Water pollution, Flooding, Extreme heat, Water shortage, Air pollution).
- Set exact latitude and longitude using the interactive Leaflet GIS map picker.
- Select severity level (Critical, High, Moderate, Low).
- Government ID verification (PhilSys, Driver's License, UMID) enforcement for authentic reporting.
- Earn +10 Eco-Points upon lodging validated incident reports.

### 2. Interactive Municipal GIS Map
- High-contrast spatial map of Metro Verde sectors with color-coded incident pins based on severity.
- Filter by category, severity, status, and barangay.
- Interactive incident preview drawer with 1-click inspection modal.

### 3. Comprehensive Incident Lifecycle Tracking
- Full 5-stage progression stepper: *Submitted → Under Review → Verified → In Progress → Resolved*.
- Real-time audit trail and official CENRO field officer remarks.

### 4. Verified Climate Knowledge & Interactive Quiz
- Scientific articles covering Urban Heat Islands, Zero-Waste & Composting, Stormwater Resilience, Native Tree Species, Rooftop Solar, and Mangrove Conservation.
- Interactive Climate Awareness Quiz with question progression, instant feedback, explanations, and reward points.

### 5. Community Climate Restoration Activities
- Citizen volunteer drives (Bayanihan Mangrove Tree Planting, Coastal Beach Cleanups, E-Waste Drop-Off Drives).
- Registration and proof-of-attendance submission for bonus Eco-Points.

### 6. Citizen Profile & Eco-Points Progression
- Track accumulated Eco-Points, level progress (*Novice Citizen* to *Master Guardian*), and community merit badges.
- Government ID KYC submission workflow.
- Quick demo persona switcher (Citizen, Environmental Officer, CENRO Super Admin).

### 7. LGU CENRO Administrative Command Console
- Real-time municipal telemetry KPIs and resolution rates.
- Incident triage & dispatch control to update statuses, assign response officers, and log resolution evidence.
- Citizen KYC approval console.
- Municipal weather alert broadcaster (Heat Index advisories and color-coded alert levels).

## Tech Stack
- **Framework:** React 19 + TypeScript
- **Bundler:** Vite
- **Styling:** Tailwind CSS
- **Mapping:** Leaflet GIS
- **Icons:** Lucide React
- **Celebration Effects:** Canvas Confetti
