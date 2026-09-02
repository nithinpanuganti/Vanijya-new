# Vanijya (वाणिज्य) — Complete API Reference & Endpoints
**Base URL:** `http://localhost:4000/api` | **Interactive Swagger UI:** `http://localhost:4000/api/docs`

---

## 1. Authentication, Registration & Security Verification

| Method | Endpoint | Description | Content-Type / Body | Role / Auth |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/auth/captcha` | **Visual Alphanumeric CAPTCHA:** Generates distorted SVG security image + challenge ID | JSON | Public |
| `POST` | `/auth/register` | **Multipart Registration:** Register Farmer or Buyer with binary profile photo, live GPS, and state/district | `multipart/form-data` | Public |
| `POST` | `/auth/login` | Authenticate with phone/email, password, and CAPTCHA challenge answer $\rightarrow$ returns JWT (blocked if `PENDING` / `REJECTED`) | `application/json` | Public |
| `GET` | `/auth/me` | Fetch authenticated user profile and verification status | JSON | Bearer JWT |
| `GET` | `/users/me` | Retrieve profile details and credentials | JSON | Bearer JWT |
| `PATCH` | `/users/me` | Update name, district, state, location, crops | `application/json` | Bearer JWT |
| `GET` | `/users/me/completion` | Dynamic profile completion score (0-100%) and missing fields checklist | JSON | Bearer JWT |
| `GET` | `/users/:id/public` | Privacy-masked public profile (village, district, state only; GPS coordinates masked) | JSON | Public |

---

## 2. Admin Verification & Registration Approval

| Method | Endpoint | Description | Role / Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/admin/registrations` | List registration requests with role, status, and state filters | `ADMIN` |
| `GET` | `/admin/registrations/:id` | Full applicant dossier (photo, GPS, KCC/APMC or GSTIN/FSSAI) | `ADMIN` |
| `PATCH` | `/admin/users/:id/approve` | Approve registration $\rightarrow$ marks `APPROVED`, `VERIFIED`, unlocks login | `ADMIN` |
| `PATCH` | `/admin/users/:id/reject` | Reject registration with required `rejectionReason` $\rightarrow$ marks `REJECTED` | `ADMIN` |
| `GET` | `/admin/dashboard` | Admin dashboard stats including pending registrations KPI counts | `ADMIN` |

---

## 3. Uploads & Media Storage

| Method | Endpoint | Description | Content-Type | Role / Auth |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/uploads/profile-photo/file` | Upload binary profile photo (JPG/PNG/WebP, max 5MB) | `multipart/form-data` | Bearer JWT / Public |
| `GET` | `/uploads/profile-photos/:filename` | Serve stored photo with SVG avatar fallback | Binary Image / SVG | Public |

---

## 4. Commodities & Markets

| Method | Endpoint | Description | Role / Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/crops` | List agricultural commodities (Tomato, Onion, Paddy, Wheat, etc.) | Public |
| `GET` | `/markets` | List APMC mandis with GPS coordinates and state | Public |

---

## 5. Market Intelligence & Mandi Prices

| Method | Endpoint | Description | Role / Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/prices` | Query mandi prices with crop, district, and state filters | Public |
| `GET` | `/prices/latest` | Deduplicated latest benchmark rates per crop/mandi | Public |
| `GET` | `/prices/trends` | 7-day Simple Moving Average (SMA), trend direction, volatility | Public |
| `GET` | `/prices/compare` | Haversine distance, transport offset, and optimal nearby APMC | Public |
| `GET` | `/prices/dashboard` | **Hero Dashboard:** Today's rate, SMA, trend, and Best Selling Window | Public |

---

## 6. Crop Lots Management

| Method | Endpoint | Description | Role / Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/lots` | Query crop lots with crop, farmer, quality, status (`OPEN`, `BIDDING`, `SOLD`) | Public |
| `GET` | `/lots/:id` | Get lot specifications, farmer credentials, and bids | Public |
| `POST` | `/lots` | Publish a new crop lot | `FARMER` |
| `PATCH` | `/lots/:id` | Update lot status or price | `FARMER` |
| `DELETE` | `/lots/:id` | Cancel lot listing | `FARMER` |

---

## 7. Bidding & Negotiations

| Method | Endpoint | Description | Role / Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/bids/my` | List all bids submitted by buyer or received by farmer | Bearer JWT |
| `GET` | `/lots/:id/bids` | List all incoming bids on a specific crop lot | `FARMER` / `BUYER` |
| `POST` | `/lots/:id/bids` | Submit a direct sourcing offer on a lot | `BUYER` |
| `PATCH` | `/bids/:id/quantity` | **Modify Quantity:** Adjust sourcing quantity on a pending bid | `BUYER` / `ADMIN` |
| `PATCH` | `/bids/:id/cancel` | **Cancel Bid:** Withdraw a pending bid (`PENDING` $\rightarrow$ `WITHDRAWN`) | `BUYER` / `ADMIN` |
| `PATCH` | `/bids/:id/accept` | Accept winning bid (atomically marks lot `SOLD` and creates transaction) | `FARMER` |
| `PATCH` | `/bids/:id/reject` | Decline incoming bid | `FARMER` |

---

## 8. Settlements & Audit Trail

| Method | Endpoint | Description | Role / Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/transactions` | List all finalized trades with escrow/settlement status | Bearer JWT |
| `POST` | `/payments/simulate-upi` | Execute direct UPI/NEFT transfer to farmer bank account | `BUYER` |
| `GET` | `/audit` | View chronological system audit trail | `ADMIN` |
| `GET` | `/notifications` | View in-app alerts and notifications | Bearer JWT |
| `PATCH` | `/notifications/:id/read` | Mark alert as read | Bearer JWT |
