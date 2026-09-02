# Vanijya (वाणिज्य) — Smart India Hackathon Demo Guide
**Problem Statement 26132:** Strengthening Market Linkages & Price Discovery for Farmers

---

## 1. System Launch & Preparation

### 1-Click Launch (Windows)
Double-click:
```bat
start-vanijya.bat
```
*Automatically clears port locks, starts Backend API on port 4000, starts Unified Web Portal on port 3000, and opens the browser.*

---

## 2. Pre-Configured Demo Credentials & Visual Security Verification

On the unified login page ([`http://localhost:3000/login`](http://localhost:3000/login)):
1. Select a role tab to auto-fill demo credentials.
2. Enter the visual alphanumeric security code (e.g. `K7P4X` shown in the distorted security box, or click `↻` to generate a fresh one).
3. Click **"Sign In to Vanijya"**.

| Persona | Name / Entity | Mobile / Email | Password | Location | Verification Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Farmer (किसान)** | Ramesh Patel | `9876543210` / `ramesh@farmer.in` | `farmer123` / `Farmer@123` | Nashik, Maharashtra | 🟢 **Approved (Verified)** |
| **Farmer (किसान)** | Gurpreet Singh | `9876543211` / `gurpreet@farmer.in` | `farmer123` / `Farmer@123` | Ludhiana, Punjab | 🟢 **Approved (Verified)** |
| **Farmer (किसान)** | Kailash Choudhary | `9876543212` / `kailash@farmer.in` | `farmer123` / `Farmer@123` | Jaipur, Rajasthan | 🟡 **Pending (KYC Queue)** |
| **Buyer (व्यापारी)** | FreshCart Agro Ltd. | `9876543220` / `buyer@freshcart.com` | `buyer123` / `Buyer@123` | Navi Mumbai, Maharashtra | 🟢 **Approved (Verified)** |
| **Buyer (व्यापारी)** | GreenSpire Foods | `9876543221` / `procurement@greenspire.in` | `buyer123` / `Buyer@123` | Azadpur, North Delhi | 🟢 **Approved (Verified)** |
| **Buyer (व्यापारी)** | AgroPure Commodities | `9876543222` / `procure@agropure.com` | `buyer123` / `Buyer@123` | Bengaluru, Karnataka | 🟡 **Pending (KYC Queue)** |
| **Admin (व्यवस्थापक)** | Vanijya System Admin | `9876543230` / `admin@vanijya.gov.in` | `admin@123` / `Admin@123` | Krishi Bhawan, New Delhi | 🟢 **Approved (Admin Desk)** |

---

## 3. The 6-Step Golden Demo Flow

### Step 1: Self-Registration & Multipart Photo Upload (`/signup`)
1. Click **"Register"** or visit [`http://localhost:3000/signup`](http://localhost:3000/signup).
2. Choose **🌾 Farmer Producer** or **🏢 Commercial Buyer**.
3. Fill credentials:
   - State: *Maharashtra* (from 36 Indian States/UTs master dataset).
   - District: *Nashik* (dependent dropdown).
   - Click **"📍 Use My Current Location"** $\rightarrow$ verifies live GPS coordinates.
   - Click **"📸 Take Photo"** or **"📁 Upload Photo"** $\rightarrow$ client previews photo instantly via `URL.createObjectURL` without Base64 overhead.
4. Review summary and click **"Submit Registration"**:
   - Submits as clean `multipart/form-data` with binary image file.
   - Screen displays **🟡 Pending Admin Approval** status.
   - User attempts to log in immediately $\rightarrow$ system cleanly blocks with *"Your registration is awaiting admin approval"*.

---

### Step 2: Admin Review & One-Click Approval (`/admin/registrations`)
1. Sign in as **Admin** (`admin@vanijya.gov.in` / `admin@123` + CAPTCHA).
2. Open **"Registration Requests"** desk.
3. Review applicant dossier: live photo, GPS coordinates, KCC/APMC or GSTIN/FSSAI credentials.
4. Click **[ Approve ]** $\rightarrow$ applicant is approved and verified.
5. Sign out, and sign in with the new Farmer/Buyer account $\rightarrow$ login succeeds immediately with verified badge.

---

### Step 3: Public Price Discovery (No Login Required — `/prices`)
1. Navigate to [`http://localhost:3000/prices`](http://localhost:3000/prices).
2. Point out **Today's Benchmark Rate (₹2,233/Qtl)**, **7-Day Moving Average (₹2,213/Qtl)**, and the **Lasalgaon Market Arbitrage (+₹96/Qtl Net Gain)**.
3. Highlight the **Best Selling Window** advisory ("Sell within next 24-48 Hours").

---

### Step 4: Farmer Produce Listing & Categories (`/my-lots`)
1. Sign in as **Farmer** (`9876543210` + CAPTCHA).
2. Point out the **6 Real KPI Cards** on the Farmer Dashboard (*Active Bidding*, *Sold*, *Pending Bids*, *Open Lots*, *Total Sales*, *Pending Payments*).
3. Click **"Publish New Crop Lot"** (`/create-lot`):
   - *Crop:* Tomato | *Quantity:* 100 Quintals | *Expected Price:* ₹2,200/Qtl | *Grade:* Grade A.
4. Go to **"My Lots"** (`/my-lots`):
   - Demonstrate the **Category Tabs**: `All`, `Active Bidding (🔥)`, `Sold (✅)`, `Open (📋)`, `Cancelled (❌)`.

---

### Step 5: Buyer Sourcing & Bid Lifecycle (`/browse-lots`, `/my-bids`)
1. Sign in as **Buyer** (`buyer@freshcart.com` / `asdfcv321` + CAPTCHA).
2. Open the Tomato lot in the **Marketplace** (`/browse-lots`).
3. Submit a bid of **₹2,200/Qtl for 100 Qtl**.
4. Open **"My Bids"** (`/my-bids`):
   - **Modify Quantity:** Click Modify $\rightarrow$ change from 100 to 80 Quintals $\rightarrow$ instant recalculation.
   - **Cancel Bid:** Click Cancel $\rightarrow$ status safely transitions to `WITHDRAWN`.

---

### Step 6: Atomic Settlement & Bank Transfer (`/transactions`)
1. Farmer logs in and clicks **"Accept Bid"** on winning offer.
2. Lot automatically marks `SOLD`, creating an atomic transaction.
3. Buyer executes direct UPI/NEFT transfer with instant digital confirmation.
