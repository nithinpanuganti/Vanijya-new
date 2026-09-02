# Vanijya (वाणिज्य) — Production Deployment & Cloud Guide
**SIH Problem Statement 26132 — Strengthening Market Linkages & Price Discovery for Farmers**

---

## 1. Cloud Deployment Architectures

### Option A: Single-Host Production Deployment (Node.js & PM2)
Recommended for Hackathon live staging and pilot validation.

1. **Host Setup (AWS EC2 / Ubuntu Linux):**
   - Recommended: AWS EC2 `t3.medium` (2 vCPU, 4GB RAM) with Ubuntu 22.04 LTS & Node.js 20.
   - Open Inbound Ports: `80` (HTTP), `443` (HTTPS), `3000` (Unified Web Portal), `4000` (Backend API).

2. **Clone & Build:**
   ```bash
   git clone https://github.com/your-org/vanijya.git
   cd vanijya
   npm install
   npm run build:packages
   npx prisma generate --schema=apps/backend/prisma/schema.prisma
   npm run build
   ```

3. **Database Seed & Initialize:**
   ```bash
   npx prisma db push --schema=apps/backend/prisma/schema.prisma
   npx prisma db seed --schema=apps/backend/prisma/schema.prisma
   ```

4. **Launch with PM2 / Process Manager:**
   ```bash
   npm install -g pm2
   pm2 start apps/backend/dist/main.js --name "vanijya-backend"
   pm2 start "npm run start --workspace=apps/web" --name "vanijya-web"
   pm2 save
   ```

---

### Option B: Cloud-Native Managed Deployment
- **Backend & Database:** Render / Railway / AWS ECS connecting to Managed PostgreSQL.
- **Frontend Portal:** Vercel / AWS Amplify (`apps/web` on `https://vanijya.gov.in` or `https://vanijya.app`).
  - Set Environment Variable `NEXT_PUBLIC_API_URL=https://api.vanijya.app/api`.

---

## 2. Environment Variables Reference

| Variable | Service | Template Default | Description |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Backend | `postgresql://vanijya_user:vanijya_pass@localhost:5432/vanijya_db?schema=public` | PostgreSQL Connection String |
| `JWT_SECRET` | Backend | `vanijya_super_secret_jwt_key_sih2024` | Cryptographic JWT signing secret |
| `JWT_EXPIRES_IN`| Backend | `7d` | Session expiration window |
| `PORT` | Backend | `4000` | HTTP listening port |
| `MARKET_DATA_PROVIDER`| Backend | `mock` (or `government`) | Price adapter mode |
| `GOV_MARKET_API_KEY` | Backend | `""` | Optional data.gov.in Agmarknet API key |
| `PRICE_CACHE_TTL_MS` | Backend | `300000` | In-memory price cache TTL (5 minutes) |
| `NEXT_PUBLIC_API_URL`| Web | `http://localhost:4000/api` | Backend API endpoint |
| `PORT` | Web | `3000` | Web portal port |
