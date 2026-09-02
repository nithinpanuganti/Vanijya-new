# 🌾 Vanijya (वाणिज्य • వాణిజ్య)

> **National Agricultural Price Discovery, Spatial Arbitrage Intelligence & Direct Farm-Gate Linkages Portal**  
> *Smart India Hackathon 2026 | Problem Statement: SIH 26132 | Digital Agriculture Mission*

---

[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=for-the-badge)](https://github.com/nithinpanuganti/Vanijya-new)
[![Tests](https://img.shields.io/badge/Tests-97%2F97%20Passing-brightgreen?style=for-the-badge)](https://github.com/nithinpanuganti/Vanijya-new)
[![Languages](https://img.shields.io/badge/Languages-English%20%7C%20%E0%A4%B9%E0%A4%BF%E0%A4%82%E0%A4%A6%E0%A4%80%20%7C%20%E0%B0%A4%E0%B1%86%E0%B0%B2%E0%B1%81%E0%B0%97%E0%B1%81-yellow?style=for-the-badge&color=f59e0b)](https://github.com/nithinpanuganti/Vanijya-new)
[![Security](https://img.shields.io/badge/CAPTCHA-Visual%20Alphanumeric%20SVG-orange?style=for-the-badge&logo=shield)](https://github.com/nithinpanuganti/Vanijya-new)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%20%2B%20Prisma-blue?style=for-the-badge&logo=postgresql)](https://github.com/nithinpanuganti/Vanijya-new)
[![Theme](https://img.shields.io/badge/Theme-Golden%20Yellow-amber?style=for-the-badge&color=f59e0b)](https://github.com/nithinpanuganti/Vanijya-new)

---

## 📑 Table of Contents

1. [Executive Summary & Problem Statement](#-executive-summary--problem-statement)
2. [High-Level System Architecture](#-high-level-system-architecture)
3. [Complete Multilingual Localization Engine (EN • HI • TE)](#-complete-multilingual-localization-engine-en--hi--te)
4. [Deep-Dive Feature Breakdown & User Workflows](#-deep-dive-feature-breakdown--user-workflows)
   - [Public Price Discovery & Spatial Arbitrage (`/prices`)](#1-public-price-discovery--spatial-arbitrage-prices)
   - [5-Step Farmer & Buyer Registration (`/signup`)](#2-5-step-farmer--buyer-registration-signup)
   - [Visual Alphanumeric CAPTCHA Security](#3-visual-alphanumeric-captcha-security)
   - [Admin Verification Desk & KYC Dossiers (`/admin/registrations`)](#4-admin-verification-desk--kyc-dossiers-adminregistrations)
   - [Farmer Command Hub & Produce Management (`/my-lots`, `/create-lot`)](#5-farmer-command-hub--produce-management-my-lots-create-lot)
   - [Buyer Procurement Desk & Bid Lifecycle (`/browse-lots`, `/my-bids`)](#6-buyer-procurement-desk--bid-lifecycle-browse-lots-my-bids)
   - [Digital Contracts & Bank Settlement (`/transactions`)](#7-digital-contracts--bank-settlement-transactions)
   - [User Profile, Completion Score & Privacy Masking (`/profile`)](#8-user-profile-completion-score--privacy-masking-profile)
5. [Monorepo Project Structure](#-monorepo-project-structure)
6. [Complete Route & API Endpoint Directory](#-complete-route--api-endpoint-directory)
7. [Security, Privacy & Audit Trail Architecture](#-security-privacy--audit-trail-architecture)
8. [Installation, Setup & Testing Guide](#-installation-setup--testing-guide)

---

## 🎯 Executive Summary & Problem Statement

### The Problem (SIH 26132)
Indian smallholder farmers face severe information asymmetry and market inefficiencies:
- **Price Disparity & Distress Selling:** Farmers often sell at distress prices due to a lack of awareness of real-time modal rates in nearby APMC mandis.
- **Intermediary Leakages:** Multiple layers of commission agents (arhtiyas) and middlemen extract 10–18% of the produce value without adding tangible post-harvest value.
- **Logistical Arbitrage Blindspots:** Transporting produce to a distant mandi with higher rates often fails if logistical transport costs exceed the price difference.
- **Trust & Verification Gaps:** Sourcing institutional buyers struggle with crop quality grading, KYC authenticity, and secure settlement timelines.

### The Vanijya Solution
**Vanijya (वाणिज्य • వాణిజ్య)** is a unified national digital agricultural marketplace engineered to eliminate middlemen and empower farmers through:
1. **Real-Time Price Discovery:** Agmarknet modal price feeds and 7-day Simple Moving Average (SMA) trend analysis.
2. **Spatial Arbitrage Intelligence:** Algorithmic net gain calculator deducting real transport costs ($NetGain = ModalPrice_{Nearby} - ModalPrice_{Local} - TransportCost$).
3. **0% Middleman Commission:** Direct farm-gate listings and transparent institutional bidding.
4. **100% Trilingual Accessibility:** Instant zero-reload switching across **English**, **Hindi (हिंदी)**, and **Telugu (తెలుగు)**.
5. **Government Mission Compliance:** Integrates Kisan Credit Card (KCC) verification, APMC IDs, and FSSAI/GSTIN validation.

---

## 🏗️ High-Level System Architecture

```mermaid
flowchart TD
    subgraph ClientLayer["Frontend Presentation Layer (Next.js 14 App Router)"]
        UI["Unified Web Portal (Port 3000)"]
        I18N["Centralized i18n Engine (EN • HI • TE)"]
        AUTH_CTX["Role-Aware AuthContext (JWT & Permissions)"]
        CAPTCHA_UI["Visual Alphanumeric CAPTCHA Component"]
    end

    subgraph APILayer["Backend Core Layer (NestJS Modular REST API)"]
        API_GATEWAY["NestJS Core API Gateway (Port 4000)"]
        PRICE_ENGINE["Agmarknet & Arbitrage Analytics Engine"]
        AUTH_SERVICE["Auth & Registration Service (Argon2 / SHA-256)"]
        MARKET_SERVICE["Produce Lots & Direct Bidding Engine"]
        SETTLE_SERVICE["Digital Contracts & UPI Escrow Settlement"]
        ADMIN_SERVICE["Admin Verification & Governance Engine"]
        AUDIT_STREAM["Real-Time AuditLog & Activity Logger"]
    end

    subgraph DataLayer["Persistence & Storage Layer"]
        PG["PostgreSQL Database (Prisma ORM)"]
        UPLOADS["Local Storage (/uploads/profile-photos)"]
        FALLBACK["In-Memory Resilient Data Store (Offline Mode)"]
    end

    UI --> I18N
    UI --> AUTH_CTX
    UI --> CAPTCHA_UI
    UI -->|REST / JSON| API_GATEWAY

    API_GATEWAY --> PRICE_ENGINE
    API_GATEWAY --> AUTH_SERVICE
    API_GATEWAY --> MARKET_SERVICE
    API_GATEWAY --> SETTLE_SERVICE
    API_GATEWAY --> ADMIN_SERVICE
    API_GATEWAY --> AUDIT_STREAM

    PRICE_ENGINE --> PG
    AUTH_SERVICE --> PG
    MARKET_SERVICE --> PG
    SETTLE_SERVICE --> PG
    ADMIN_SERVICE --> PG
    AUDIT_STREAM --> PG
    AUTH_SERVICE --> UPLOADS
    PG -.->|Fallback if Offline| FALLBACK
```

---

## 🌐 Complete Multilingual Localization Engine (EN • HI • TE)

Vanijya features a centralized, type-safe i18n architecture ensuring that **100% of visible UI elements** update instantaneously without reloading the page.

### 1. Architectural Principles
- **Zero Hardcoding**: All labels, headings, buttons, validation hints, status badges, and dialogue messages are referenced through translation keys.
- **Preservation of Raw Figures**: Real numerical quantities, prices (`₹2,233`), distances (`24 km`), dates, and user names remain untranslated while their surrounding units and descriptive labels localize dynamically.
- **Multi-Script Font System**: Preloaded Google Fonts ensure crisp typography across scripts:
  - **Latin**: `Noto_Sans`
  - **Devanagari (Hindi)**: `Noto_Sans_Devanagari`
  - **Telugu**: `Noto_Sans_Telugu`
- **Instant Response Time**: Translations are stored in memory and resolved via React memoization in `<50ms`.

### 2. Language Priority Resolution
```mermaid
flowchart LR
    A[App Initialization] --> B{1. localStorage: vanijya_unified_language}
    B -- Found --> E[Load Selected Language]
    B -- Not Found --> C{2. navigator.language Locale Check}
    C -- hi / te --> E[Load Hindi or Telugu]
    C -- Other / Denied --> D[3. Default: English 'en']
    D --> E
```

### 3. File Structure
```
apps/web/src/i18n/
├── types.ts          # UnifiedTranslations contract (~230 strictly typed keys)
├── en.ts             # English translation dictionary
├── hi.ts             # Authentic Hindi (हिंदी) dictionary
├── te.ts             # Authentic Telugu (తెలుగు) dictionary
├── crops.ts          # Agricultural produce localization map & helper
├── provider.tsx      # LanguageProvider context & hook
└── index.ts          # Consolidated exports & useLanguage hook
```

### 4. Agricultural Produce Translation Mapping (`crops.ts`)
| Standard Key | English | Hindi (हिंदी) | Telugu (తెలుగు) |
| :--- | :--- | :--- | :--- |
| `Tomato` | Tomato | टमाटर | టమాటా |
| `Onion` | Onion | प्याज | ఉల్లిపాయ |
| `Potato` | Potato | आलू | బంగాళాదుంప |
| `Wheat` | Wheat | गेहूं | గోధుమలు |
| `Paddy` | Paddy / Rice | धान / चावल | వరి / బియ్యం |
| `Maize` | Maize / Corn | मक्का | మొక్కజొన్న |
| `Cotton` | Cotton | कपास | పత్తి |
| `Chilli` | Red Chilli | लाल मिर्च | ఎర్ర మిరపకాయలు |
| `Soybean` | Soybean | सोयाबीन | సోయాబీన్ |
| `Mustard` | Mustard | सरसों | ఆవాలు |
| `Turmeric` | Turmeric | हल्दी | పసుపు |
| `Groundnut` | Groundnut | मूंगफली | వేరుశనగ |

---

## 🔍 Deep-Dive Feature Breakdown & User Workflows

---

### 1. Public Price Discovery & Spatial Arbitrage (`/prices`)
*Accessible publicly to all farmers and traders with zero login or barrier.*

- **Real-Time Agmarknet Feed:** Displays live modal, minimum, and maximum prices alongside daily mandi arrival quantities.
- **7-Day Price Trend & SMA:** Interactive SVG chart displaying price movements against the 7-day Simple Moving Average.
- **Optimal Selling Window Recommendation:** Algorithmic recommendation scoring market momentum (e.g., *"Sell within next 24-48 Hours"* with High/Medium confidence).
- **Nearby APMC Spatial Arbitrage Calculator:**
  $$\text{Net Arbitrage Benefit} = \text{Modal Price}_{\text{Nearby APMC}} - \text{Modal Price}_{\text{Local APMC}} - \text{Logistics Transport Cost}$$
  *Example:* Nashik APMC is ₹2,233/Qtl, Lasalgaon APMC is ₹2,380/Qtl. Deducting ₹12/Qtl transport gives a **+₹96/Qtl net profit gain**.

---

### 2. 5-Step Farmer & Buyer Registration (`/signup`)
*Structured self-registration preventing duplicate registrations and securing KYC.*

```mermaid
sequenceDiagram
    autonumber
    actor User as Farmer / Buyer
    participant UI as /signup Wizard
    participant Geolocation as Browser GPS
    participant API as Backend Auth Controller
    participant Storage as File Storage / DB
    actor Admin as Agri Administrator

    User->>UI: 1. Select Role (Farmer or Buyer)
    User->>UI: 2. Enter Full Name, Phone, Email & Password
    User->>UI: 3. Select State, District, Village & Capture Live GPS
    Geolocation-->>UI: Return Latitude & Longitude
    User->>UI: 4. Capture Selfie via Camera or Upload Photo (<5MB)
    User->>UI: 5. Complete Visual CAPTCHA & Submit Application
    UI->>API: POST /api/auth/register (Dossier Payload)
    API->>Storage: Save Photo & Create Record (status: PENDING)
    API-->>UI: Registration Successful (Login Locked)
    Admin->>UI: Review Dossier at /admin/registrations
    Admin->>API: PATCH /api/admin/users/:id/approve
    API-->>User: Account Verified (Login Unlocked)
```

1. **Step 1 — Role Selection & Fast-Fill Demo:** Select between `🌾 Farmer` and `🏢 Buyer`. Includes instant 1-click demo autofill buttons (`Fill Demo Farmer`, `Fill Demo Buyer`) for rapid evaluator onboarding. Public registration for `ADMIN` is strictly blocked.
2. **Step 2 — Personal Credentials:** Legal full name, 10-digit mobile number, email, and interactive password strength meter with confirmation check.
3. **Step 3 — 4-Tier Location Hierarchy & Agricultural Details:**
   - **Dependent Searchable Selects:** Real data cascading across all 36 Indian States & UTs: **State $\rightarrow$ District $\rightarrow$ Tehsil / Taluka / Mandal $\rightarrow$ Village / Town**.
   - **High-Precision GPS Acquisition:** Live browser geolocation with latitude/longitude accuracy validation and coordinate display.
   - **Farmer Specifics:** Primary crop, secondary crops, farm size (in acres), irrigation type (Rainfed, Borewell, Canal, Drip), Kisan Credit Card (KCC) identifier, and nearest APMC Mandi ID.
   - **Buyer Specifics:** Organization name, contact person designation, business category (Wholesaler, Food Processor, Exporter, Retailer, FPO), GSTIN (15-digit), FSSAI license (14-digit), and warehouse storage capacity.
4. **Step 4 — Smart Photo Verification & Client Compression:**
   - **Dual Capture Mode:** Live webcam selfie capture with camera preview or local photo upload (`image/jpeg`, `image/png`, `image/webp`).
   - **Client-Side Canvas Compression:** Integrated HTML5 Canvas image compressor automatically resizes images to max 1200px width/height and compresses to 82% quality JPEG/WebP (<1MB payload), ensuring lightning-fast uploads over 2G/3G rural cellular networks.
5. **Step 5 — Review Dossier & Visual Alphanumeric CAPTCHA:** Complete application summary review, profile completion score meter (0–100%), and distorted alphanumeric SVG CAPTCHA verification.

---

### 3. Visual Alphanumeric CAPTCHA Security
- **Dynamic Distortion Engine:** Generates random 5–6 character alphanumeric strings with rotation, variable font size, overlapping background noise dots, and Bézier interference curves.
- **Cryptographic Challenge Integrity:**
  - Salted SHA-256 hash generation on the backend.
  - 5-minute single-use expiration.
  - Automatic invalidation after 5 failed attempts to prevent brute-force attacks.

---

### 4. Admin Verification Desk & KYC Dossiers (`/admin/registrations`)
*Government administrators oversee participant verification to protect the marketplace.*

- **KPI Metric Counters:** *Pending Review*, *Pending Farmers*, *Pending Buyers*, and *Approved Participants*.
- **Multi-Filter & Search:** Filter by role (`Farmer` / `Buyer`), status (`Pending` / `Verified` / `Rejected`), and search by phone, district, or name.
- **Full Dossier Inspection:** View applicant photo, phone number, GPS coordinates, KCC card number, GSTIN, and FSSAI license.
- **One-Click Approval:** `PATCH /api/admin/users/:id/approve` instantaneously activates the account.
- **Mandatory Rejection Reason:** `PATCH /api/admin/users/:id/reject` requires a documented audit reason (e.g., *"Blurry photo"* or *"Invalid GSTIN"*), which is visible to the applicant upon login.

---

### 5. Farmer Command Hub & Produce Management (`/my-lots`, `/create-lot`)
*Direct farm-gate listing without commission deductions.*

- **Publishing Produce (`/create-lot`):** Select crop, quantity (Quintals/Kg/Tonnes), expected price (₹/unit), quality grade (Grade A Premium, Grade B Standard, Grade C Processing), and farm pickup location.
- **Category Tabs (`/my-lots`):**
  - **All Listings:** Complete historical view of all published lots.
  - **Active Bidding (🔥):** Real-time counter of incoming buyer bids, top offer comparison, and 1-tap accept button.
  - **Sold (✅):** Finalized sale contracts with buyer name, contract total, and live payment settlement status.
  - **Open (📋):** Lots waiting for incoming bids.
  - **Cancelled (❌):** Withdrawn listings.

---

### 6. Buyer Procurement Desk & Bid Lifecycle (`/browse-lots`, `/my-bids`)
*Institutional buyers can source verified produce directly from farm-gates.*

```mermaid
stateDiagram-v2
    [*] --> OPEN : Farmer publishes produce lot
    OPEN --> BIDDING : Buyer places first bid
    BIDDING --> PENDING : Bid awaiting Farmer decision
    
    state PENDING {
        [*] --> ActivePending
        ActivePending --> Modified : Buyer modifies quantity
        ActivePending --> Withdrawn : Buyer cancels bid
    }
    
    PENDING --> REJECTED : Farmer declines offer
    PENDING --> ACCEPTED : Farmer accepts offer
    ACCEPTED --> SOLD : Transaction contract generated
    SOLD --> PAID : Buyer completes bank settlement
    PAID --> [*] : Trade Complete
```

- **Live Marketplace (`/browse-lots`):** Crop filters, search bar, quality grade badges, and distance indicators.
- **Bidding Console (`/browse-lots/[id]`):** Enter proposed price per quintal and requested quantity with real-time total order calculation.
- **Bid Quantity Modification:** Self-service modification of pending bid quantities ($0 < \text{newQuantity} \le \text{lot.quantity}$) with automatic total recomputation.
- **Bid Cancellation:** Self-service withdrawal of bids (`PENDING` $\rightarrow$ `WITHDRAWN`) with confirmation modal and safety checks.

---

### 7. Digital Contracts & Bank Settlement (`/transactions`)
- **Legally Binding Contracts:** Generated automatically upon bid acceptance with unique contract IDs, farmer details, buyer details, agreed price, and total commitment value.
- **Zero Commission Guarantee:** Platform fee is explicitly displayed as **₹0 (0% Cut)**.
- **Payment Lifecycle:**
  1. `PENDING`: Contract generated.
  2. `INITIATED`: Buyer marks payment dispatched and enters Bank UTR / UPI reference number.
  3. `PAID`: Payment verified and funds released directly to the farmer's bank account.

---

### 8. User Profile, Completion Score & Privacy Masking (`/profile`)
- **Dynamic Completion Meter (0–100%):** Evaluates profile completeness and lists missing fields.
- **Editable Information:** Update farm addresses, warehouse locations, and contact details.
- **Privacy Masking:** Public APIs (`/api/users/:id/public`) return only broad location details (village, district, state) and hide precise GPS coordinates and raw phone numbers from unverified actors.

---

## 📂 Monorepo Project Structure

```
Vanijya/
├── apps/
│   ├── backend/                      # NestJS REST API Server (Port 4000)
│   │   ├── prisma/                   # PostgreSQL Schema & Seed Scripts
│   │   │   ├── schema.prisma         # Database schema definition
│   │   │   └── seed.ts               # Seed data for mandis, crops & users
│   │   └── src/
│   │       ├── admin/                # Admin governance & verification module
│   │       ├── auth/                 # Authentication, JWT & CAPTCHA generator
│   │       ├── bids/                 # Bidding engine & modification handler
│   │       ├── crops/                # Crop master data & category endpoints
│   │       ├── lots/                 # Farm-gate produce listings module
│   │       ├── payments/             # Transaction settlements & UTR tracking
│   │       ├── prices/               # Agmarknet prices & spatial arbitrage engine
│   │       └── users/                # User profile & registration dossiers
│   │
│   └── web/                          # Next.js 14 Web Application (Port 3000)
│       └── src/
│           ├── app/                  # Next.js App Router (18 routes)
│           │   ├── admin/            # Admin review desk & registrations queue
│           │   ├── browse-lots/      # Marketplace & lot detail bidding console
│           │   ├── create-lot/       # Produce publication form
│           │   ├── dashboard/        # Unified role-aware dashboard
│           │   ├── login/            # Unified login with CAPTCHA
│           │   ├── my-bids/          # Buyer bid desk (modify/cancel bids)
│           │   ├── my-lots/          # Farmer produce tabs (All, Bidding, Sold)
│           │   ├── prices/           # Public price discovery & arbitrage
│           │   ├── profile/          # User profile & KYC verification
│           │   ├── signup/           # 5-step registration wizard
│           │   ├── transactions/     # Legal contracts & payment settlement
│           │   ├── layout.tsx        # Multi-script Google Fonts & providers
│           │   └── page.tsx          # Homepage with live mandi tickers
│           ├── components/
│           │   ├── security/         # Visual CAPTCHA component
│           │   └── ui/               # TopNav, LanguageSelector, StatusBadge, Charts
│           ├── i18n/                 # Trilingual dictionaries (en, hi, te, crops)
│           └── lib/                  # AuthContext, API client & Toast context
│
└── packages/
    ├── shared-types/                 # Shared TypeScript interfaces & DTOs
    └── shared-utils/                 # Currency formatting (INR), math & date utils
```

---

## 🗺️ Complete Route & API Endpoint Directory

### Web Application Routes (`apps/web` on `:3000`)
| Route | Access Level | Description |
| :--- | :--- | :--- |
| `/` | Public | Homepage with live mandi highlights, 4-step guide & benefits |
| `/prices` | Public | Live APMC mandi prices, 7-day trend charts & spatial arbitrage |
| `/browse-lots` | Public | Marketplace with crop filters, search & listing cards |
| `/browse-lots/[id]` | Public / Buyer | Produce details & interactive bidding desk |
| `/signup` | Public | 5-step registration wizard with GPS capture & photo upload |
| `/login` | Public | Unified login with visual alphanumeric CAPTCHA |
| `/dashboard` | Authenticated | Smart command center tailored to Farmer, Buyer, or Admin |
| `/my-lots` | Farmer / Admin | Produce management with categories (All, Bidding, Sold, Open, Cancelled) |
| `/my-lots/[id]` | Farmer / Admin | Produce detail with incoming buyer offers & 1-tap accept |
| `/create-lot` | Farmer / Admin | Form to publish new farm-gate produce listings |
| `/my-bids` | Buyer / Admin | Sourcing bids with self-service quantity modification & cancellation |
| `/transactions` | Buyer / Farmer | Legally binding purchase contracts & payment settlement |
| `/admin/registrations` | Admin Only | Verification queue with applicant dossiers & approve/reject modals |
| `/profile` | Authenticated | User verification status, completion score & location settings |

### Core Backend API Endpoints (`apps/backend` on `:4000`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/auth/captcha` | Generates visual SVG CAPTCHA & cryptographic challenge hash |
| `POST` | `/api/auth/register` | 5-step self-registration dossier submission |
| `POST` | `/api/auth/login` | Authenticate with credentials, role check & CAPTCHA validation |
| `GET` | `/api/prices/dashboard` | Agmarknet prices, 7-day SMA, selling window & spatial arbitrage |
| `GET` | `/api/prices/trends` | 7-day historical price points for SVG trend rendering |
| `GET` | `/api/crops` | List of supported agricultural crops |
| `GET` | `/api/lots` | List active marketplace produce lots with filters |
| `POST` | `/api/lots` | Create and publish a new farm-gate produce lot |
| `GET` | `/api/lots/:id` | Detailed view of a single produce lot |
| `POST` | `/api/lots/:id/bids` | Submit a direct procurement bid on a produce lot |
| `GET` | `/api/bids/my` | Retrieve all bids submitted by the logged-in buyer |
| `PATCH` | `/api/bids/:id/quantity` | Self-service modification of pending bid quantity |
| `PATCH` | `/api/bids/:id/cancel` | Self-service cancellation of pending bid (`WITHDRAWN`) |
| `PATCH` | `/api/bids/:id/accept` | Farmer 1-tap acceptance (generates transaction & closes lot) |
| `PATCH` | `/api/bids/:id/reject` | Farmer rejection of a buyer offer |
| `GET` | `/api/transactions` | Retrieve purchase contracts & settlement milestones |
| `PATCH` | `/api/payments/:id/status` | Update payment status (`INITIATED`, `PAID`) with bank UTR |
| `GET` | `/api/admin/registrations` | Fetch pending/verified/rejected user registration dossiers |
| `PATCH` | `/api/admin/registrations/:id/approve` | Approve applicant and grant platform access |
| `PATCH` | `/api/admin/registrations/:id/reject` | Reject applicant with mandatory audit reason |
| `GET` | `/api/admin/dashboard` | Platform-wide KPIs (GMV, active lots, bids, settlements) |
| `GET` | `/api/docs` | Interactive Swagger API documentation |

---

## 🔒 Security, Privacy & Audit Trail Architecture

1. **Authentication & Password Hashing:** User passwords are encrypted using **Argon2 / Bcrypt** with cryptographic salting.
2. **Session Integrity:** Stateless **JWT tokens** carrying cryptographically signed role claims (`FARMER`, `BUYER`, `ADMIN`).
3. **Location Privacy Protection:** Public APIs (`/api/users/:id/public`) mask exact GPS coordinates and exact street addresses, exposing only general village and district info to prevent unsolicited farm intrusions.
4. **Audit Logging (`AuditLog`):** Every administrative approval, rejection, lot creation, bid modification, cancellation, and payment status update is logged with timestamps, actor IDs, and metadata.

---

## 🚀 Installation, Setup & Testing Guide

### Prerequisites
- **Node.js**: v18.17.0 or higher
- **npm**: v9.0.0 or higher
- **PostgreSQL**: v14 or higher (or use the built-in offline resilient in-memory store)

### Step 1: Clone and Install Dependencies
```powershell
# Clone the repository
git clone https://github.com/nithinpanuganti/Vanijya-new.git
cd Vanijya-new

# Install all monorepo workspace dependencies
npm.cmd install
```

### Step 2: Environment Configuration
Create a `.env` file in `apps/backend/`:
```env
PORT=4000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/vanijya_db?schema=public"
JWT_SECRET="vanijya-super-secret-security-key-2026"
CAPTCHA_SECRET="vanijya-captcha-cryptographic-salt"
NODE_ENV="development"
```

### Step 3: Initialize Database Schema
```powershell
# Generate Prisma Client
npm.cmd run prisma:generate

# Run migrations and seed data
npm.cmd run prisma:migrate
npm.cmd run prisma:seed
```

### Step 4: Run Automated Test Suites
```powershell
# Run all 97 unit and integration tests across monorepo packages
npm.cmd test
```

### Step 5: Build and Start Development Servers
```powershell
# Build all packages and applications
npm.cmd run build

# Start both Backend (:4000) and Web Frontend (:3000) concurrently
npm.cmd run dev
```

The portal will be live at:
- **Frontend Web Portal:** [http://localhost:3000](http://localhost:3000)
- **Backend API & Swagger:** [http://localhost:4000/api/docs](http://localhost:4000/api/docs)

---

## 👥 Pre-Configured Accounts & User Directory

Vanijya comes pre-seeded with realistic agricultural personas across India representing active and pending Farmers, wholesale Buyers, and national Administrators:

### 1. 🌾 Farmer Accounts
| Farmer Name | Mobile Number | Email | Password | Location / District | State | Primary Crop | Farm Size | KCC / APMC ID | Verification Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Ramesh Patel** | `9876543210` | `ramesh@farmer.in` | `farmer123` / `Farmer@123` | Village Pimpalgaon, Niphad | Maharashtra | 🍅 Tomato | 4.5 Acres | `KCC-MH-2024-8891`<br>`APMC-NSK-4421` | 🟢 **VERIFIED (Approved)** |
| **Gurpreet Singh** | `9876543211` | `gurpreet@farmer.in` | `farmer123` / `Farmer@123` | Samrala Road, Khanna | Punjab | 🌾 Wheat | 8.0 Acres | `KCC-PB-2023-1102`<br>`APMC-LDH-0982` | 🟢 **VERIFIED (Approved)** |
| **Kailash Choudhary** | `9876543212` | `kailash@farmer.in` | `farmer123` / `Farmer@123` | Chomu Mandi Link Road | Rajasthan | 🟡 Mustard | 6.2 Acres | `KCC-RJ-2024-5512`<br>`APMC-JPR-7781` | 🟡 **PENDING (Under Review)** |

---

### 2. 🏢 Institutional Buyer Accounts
| Organization Name | Mobile Number | Email | Password | Contact Person | Business Type | State & Hub | GSTIN & FSSAI | Verification Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FreshCart Agro Ltd.** | `9876543220` | `buyer@freshcart.com` | `buyer123` / `Buyer@123` | Vikram Joshi | Wholesaler & Distributor | Navi Mumbai, Maharashtra | `27AABCF1234F1Z5`<br>`11521018000234` | 🟢 **VERIFIED (Approved)** |
| **GreenSpire Foods** | `9876543221` | `procurement@greenspire.in` | `buyer123` / `Buyer@123` | Anjali Sharma | Food Processor & Exporter | Azadpur, North Delhi | `07AAECG5678P1ZQ`<br>`10019011000543` | 🟢 **VERIFIED (Approved)** |
| **AgroPure Commodities** | `9876543222` | `procure@agropure.com` | `buyer123` / `Buyer@123` | Siddharth Rao | Agro-Processing Unit | Peenya, Bengaluru Urban | `29AABCA9876F1Z2`<br>`11223019000876` | 🟡 **PENDING (Under Review)** |

---

### 3. 🏛️ System Administrator Accounts
| Administrator Name | Phone / Login | Official Email | Password | Office Location | Designation | System Capabilities |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Vanijya System Admin** | `9876543230` | `admin@vanijya.gov.in` | `admin@123` / `Admin@123` | Krishi Bhawan, New Delhi | National Governance Desk | Approve/Reject KYC dossiers, monitor real-time trade GMV, oversee Agmarknet pricing feeds, audit bid logs |

---

### ⚡ Quick-Fill Credentials on Sign In Screen (`/login`)
The unified login page (`/login`) includes **1-Click Fast-Fill Buttons** for:
- 🌾 **Farmer Demo:** Autofills `9876543210` / `farmer123`
- 🏢 **Buyer Demo:** Autofills `9876543220` / `buyer123`
- 🏛️ **Admin Demo:** Autofills `admin@vanijya.gov.in` / `admin@123`

---

## 📜 License & Compliance

Distributed under the **MIT License**. Compliant with **e-NAM guidelines**, **Agmarknet standards**, and the **National Digital Agriculture Mission (NDAM)**.
