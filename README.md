<div align="center">

<img src="docs/logo.png" alt="PayFear Logo" width="200" />

# PayFear

### Trustless Task Marketplace with On-Chain Escrow

*Delegate uncomfortable tasks. Get paid for completing them. Settled on Base.*

[![Live on Base Sepolia](https://img.shields.io/badge/🔵_Base_Sepolia-Live-0052FF?style=for-the-badge)](https://sepolia.basescan.org/address/0x6B5075137c32C39CB0c0385A23101260188e404d)
[![Tests](https://img.shields.io/badge/Forge_Tests-33%2F33_✓-22c55e?style=for-the-badge)](contracts/test/)
[![License: MIT](https://img.shields.io/badge/License-MIT-a855f7?style=for-the-badge)](LICENSE)

[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636?logo=solidity&logoColor=white)](contracts/src/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?logo=typescript&logoColor=white)](api/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)](app/)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](api/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)](api/prisma/)
[![Foundry](https://img.shields.io/badge/Foundry-forge-DEA584)](contracts/)

---

[Features](#-features) · [Architecture](#-architecture) · [Quick Start](#-quick-start) · [Smart Contract](#-smart-contract) · [API Reference](#-api-reference) · [Deploy](#-deployment)

</div>

---

## 🎯 What is PayFear?

> *"I need to cancel my gym membership, but I hate making that phone call."*

PayFear is a marketplace where **Requesters** post awkward, tedious, or uncomfortable tasks — and **Executors** get paid to handle them. Every payment is secured by a smart contract escrow on **Base**.

```
Requester posts task → Funds ETH in escrow → Executor completes work → Proof submitted → Requester approves → Funds released on-chain
```

**Core principle:** *Keep smart contract simple. Complexity stays off-chain.*

---

## ✨ Features

### For Users
| Feature | Description |
|---------|-------------|
| 🔒 **Trustless Escrow** | ETH locked in smart contract — funds are released only when work is verified |
| 🛡️ **Safety Engine** | AI-powered content screening blocks illegal, harmful, or coercive task requests |
| ⭐ **Reputation System** | Trust scores, ratings, and completion stats for both requesters and executors |
| 📸 **Proof of Completion** | Screenshot, photo, or text proof required before payment release |
| ⚖️ **Dispute Resolution** | Admin-mediated disputes with on-chain refund capability |
| 👛 **SIWE Authentication** | Sign-In with Ethereum — no email required, wallet-first onboarding |

### For Developers
| Feature | Description |
|---------|-------------|
| 🧱 **Idempotent Settlement** | Double-click safe — reads on-chain state before every write |
| 🔐 **Atomic DB Transactions** | Prisma `$transaction` locks prevent race conditions during approval/dispute |
| 📡 **Dual Status Reporting** | Every escrow query returns both off-chain (DB) and on-chain (contract) state |
| 🔄 **Graceful Degradation** | System works without contract configured — falls back to off-chain-only mode |
| 📧 **Notification Stubs** | Ready for Resend/SendGrid — covers all 7 lifecycle events |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js 16)                        │
│  ┌───────────┐ ┌──────────┐ ┌───────────┐ ┌──────────────────────┐   │
│  │  Landing   │ │Dashboard │ │Task Detail│ │  Escrow Components   │   │
│  │  Page      │ │  + Stats │ │ + Actions │ │ ConnectWallet        │   │
│  │           │ │          │ │ + Proofs  │ │ FundEscrow           │   │
│  │           │ │          │ │ + Reviews │ │ SettlementBadge      │   │
│  └───────────┘ └──────────┘ └───────────┘ └──────────────────────┘   │
└──────────────────────────────┬───────────────────────────────────────┘
                               │ REST API (JWT)
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        API (Express 5 + TypeScript)                   │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌───────┐ ┌──────────────┐    │
│  │  Auth   │ │  Tasks  │ │  Escrow  │ │ SIWE  │ │   Admin      │    │
│  │  + JWT  │ │  CRUD   │ │  Service │ │ Auth  │ │   + Dispute  │    │
│  │  + SIWE │ │  + FSM  │ │  + viem  │ │       │ │   + Flags    │    │
│  └─────────┘ └─────────┘ └────┬─────┘ └───────┘ └──────────────┘    │
│                               │                                      │
│  ┌─────────────────────┐  ┌───┴────────────┐  ┌──────────────────┐   │
│  │  Safety Engine      │  │  Notification  │  │   Audit Logger   │   │
│  │  (content filter)   │  │  Service       │  │   (full trace)   │   │
│  └─────────────────────┘  └────────────────┘  └──────────────────┘   │
└──────────────────────────────┬───────────────────────────────────────┘
                               │ viem (JSON-RPC)
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    SMART CONTRACT (Base Sepolia)                      │
│                                                                      │
│    PayFearEscrow.sol — 0x6B5075137c32C39CB0c0385A23101260188e404d    │
│                                                                      │
│    fund(bytes32 taskId)  →  locks ETH from requester                │
│    release(taskId, exec) →  pays executor (minus 5% fee)            │
│    refund(bytes32 taskId) → returns ETH to requester                │
│                                                                      │
│    States: EMPTY → FUNDED → RELEASED / REFUNDED                     │
│    Tests:  33/33 ✓  (+ 256 fuzz runs)                               │
└──────────────────────────────────────────────────────────────────────┘
```

### Task Lifecycle (State Machine)

```
DRAFT → OPEN → ACCEPTED → IN_PROGRESS → PROOF_SUBMITTED → COMPLETED
                                              ↓
                                          DISPUTED → REFUNDED
         ↓
     CANCELLED
```

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | 18+ | Runtime |
| **PostgreSQL** | 14+ | Database |
| **Foundry** | latest | Smart contract tooling |

### 1. Clone & Install

```bash
git clone https://github.com/raflimulyarahman/payFear.git
cd payFear

# Install API dependencies
cd api && npm install && cd ..

# Install frontend dependencies
cd app && npm install && cd ..

# Install Foundry (if not installed)
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### 2. Configure Environment

**API** (`api/.env`):

```env
# Server
NODE_ENV=development
PORT=3001
API_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/payfear?schema=public

# Auth
JWT_SECRET=your_secret_key_minimum_32_characters_long
JWT_EXPIRES_IN=7d

# SIWE
SIWE_DOMAIN=localhost

# Blockchain (Base Sepolia)
RPC_URL=https://sepolia.base.org
CHAIN_ID=84532
ESCROW_CONTRACT_ADDRESS=0x6B5075137c32C39CB0c0385A23101260188e404d
RELAYER_PRIVATE_KEY=0x_your_relayer_private_key
```

**Frontend** (`app/.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/v1
NEXT_PUBLIC_ESCROW_ADDRESS=0x6B5075137c32C39CB0c0385A23101260188e404d
```

### 3. Setup Database

```bash
cd api
npx prisma migrate dev --name init
npx prisma db seed    # seeds demo users
```

### 4. Run

```bash
# Terminal 1 — API
cd api && npm run dev

# Terminal 2 — Frontend
cd app && npm run dev
```

Open **http://localhost:3000** 🎉

---

## 📜 Smart Contract

### Deployed Contract

| Network | Address | Explorer |
|---------|---------|----------|
| **Base Sepolia** | `0x6B5075137c32C39CB0c0385A23101260188e404d` | [BaseScan ↗](https://sepolia.basescan.org/address/0x6B5075137c32C39CB0c0385A23101260188e404d) |

### Functions

```solidity
// Requester locks ETH for a task
function fund(bytes32 taskId) external payable;

// Backend releases funds to executor (minus platform fee)
function release(bytes32 taskId, address executor) external onlyOwner;

// Backend refunds requester (full amount)
function refund(bytes32 taskId) external onlyOwner;

// View escrow data
function getEscrow(bytes32 taskId) external view returns (Escrow memory);
function getStatus(bytes32 taskId) external view returns (Status);
```

### Fee Structure

- **Platform fee**: 5% (500 basis points), configurable up to 10%
- Fee collected from escrow balance on `release()`
- Full refund on `refund()` — no fee charged

### Testing

```bash
cd contracts
forge test -vv          # run all 33 tests
forge test --gas-report # with gas analysis
```

### Deploy Your Own

```bash
cd contracts
DEPLOYER_PRIVATE_KEY=0x... forge script script/DeployPayFearEscrow.s.sol \
  --rpc-url https://sepolia.base.org \
  --broadcast --verify
```

---

## 📡 API Reference

**Base URL:** `http://localhost:3001/v1`

All authenticated routes require `Authorization: Bearer <token>` header.

### Auth

| Method | Route | Auth | Description |
|--------|-------|:----:|-------------|
| `POST` | `/auth/register` | — | Register with email/password |
| `POST` | `/auth/login` | — | Login, returns JWT |
| `GET` | `/auth/me` | ✓ | Current user profile |
| `POST` | `/auth/logout` | ✓ | Invalidate session |

### SIWE (Wallet Auth)

| Method | Route | Auth | Description |
|--------|-------|:----:|-------------|
| `GET` | `/siwe/nonce` | — | Get one-time nonce (5min TTL) |
| `POST` | `/siwe/verify` | — | Verify signature, returns JWT |

### Tasks

| Method | Route | Auth | Description |
|--------|-------|:----:|-------------|
| `GET` | `/tasks` | ✓ | List tasks (filter by status, category) |
| `POST` | `/tasks` | ✓ | Create task (DRAFT) |
| `GET` | `/tasks/:id` | ✓ | Get task details |
| `PATCH` | `/tasks/:id` | ✓ | Update task |
| `DELETE` | `/tasks/:id` | ✓ | Delete draft task |
| `POST` | `/tasks/:id/publish` | ✓ | Publish (DRAFT → OPEN) |
| `POST` | `/tasks/:id/accept` | ✓ | Accept task (OPEN → ACCEPTED) |
| `POST` | `/tasks/:id/start` | ✓ | Start work (ACCEPTED → IN_PROGRESS) |
| `POST` | `/tasks/:id/cancel` | ✓ | Cancel task |

### Proofs & Reviews

| Method | Route | Auth | Description |
|--------|-------|:----:|-------------|
| `POST` | `/tasks/:id/proofs` | ✓ | Submit proof of completion |
| `GET` | `/tasks/:id/proofs` | ✓ | List proofs |
| `POST` | `/tasks/:id/reviews/approve` | ✓ | Approve + release escrow |
| `POST` | `/tasks/:id/reviews/dispute` | ✓ | Dispute submission |
| `POST` | `/tasks/:id/reviews` | ✓ | Submit rating/review |

### Escrow

| Method | Route | Auth | Description |
|--------|-------|:----:|-------------|
| `GET` | `/escrow/:taskId` | ✓ | Both on-chain + off-chain status |

**Response includes:**
```json
{
  "escrowEnabled": true,
  "settlementState": "funded",
  "offchain": { "status": "FUNDED", "amount": 50, "txHash": null },
  "onchain": { "status": "FUNDED", "amount": "0.05", "requester": "0x..." }
}
```

Settlement states: `not_configured` · `not_funded` · `funded` · `pending` · `confirmed` · `failed` · `refunded`

### Wallet

| Method | Route | Auth | Description |
|--------|-------|:----:|-------------|
| `GET` | `/wallet` | ✓ | List linked wallets |
| `POST` | `/wallet/link` | ✓ | Link wallet address |
| `DELETE` | `/wallet/:id` | ✓ | Unlink wallet |

### Admin

| Method | Route | Auth | Description |
|--------|-------|:----:|-------------|
| `GET` | `/admin/dashboard` | Admin | Platform stats + escrow totals |
| `POST` | `/admin/disputes/:id/resolve` | Admin | Resolve dispute + on-chain settle |
| `GET` | `/admin/flags` | Admin | List moderation flags |

---

## 🌍 Deployment

### Option A: Railway (Recommended — Easiest)

Railway handles PostgreSQL, environment variables, and auto-deploy from GitHub.

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Initialize project
cd payFear
railway init

# 4. Add PostgreSQL
railway add --plugin postgresql

# 5. Deploy API
cd api
railway up

# 6. Deploy Frontend
cd ../app
railway up
```

Set environment variables in Railway dashboard → Variables tab.

### Option B: Vercel (Frontend) + Railway (API)

```bash
# Frontend → Vercel
cd app
npx vercel --prod

# API → Railway
cd ../api
railway up
```

Set `NEXT_PUBLIC_API_URL` in Vercel to your Railway API URL.

### Option C: VPS (Full Control)

```bash
# On your VPS (Ubuntu 22.04+)

# 1. Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 2. Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib
sudo -u postgres createuser payfear --createdb
sudo -u postgres psql -c "ALTER USER payfear PASSWORD 'your_password';"
sudo -u postgres createdb payfear -O payfear

# 3. Clone & build
git clone https://github.com/raflimulyarahman/payFear.git
cd payFear

# 4. Build API
cd api
npm ci
cp .env.example .env   # edit with production values
npx prisma migrate deploy
npm run build

# 5. Build Frontend
cd ../app
npm ci
cp .env.local.example .env.local  # edit with production API URL
npm run build

# 6. Run with PM2
npm install -g pm2
cd ../api && pm2 start dist/index.js --name payfear-api
cd ../app && pm2 start npm --name payfear-app -- start

# 7. Nginx reverse proxy
sudo apt install nginx
```

**Nginx config** (`/etc/nginx/sites-available/payfear`):

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API
    location /v1/ {
        proxy_pass http://localhost:3001/v1/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site & SSL
sudo ln -s /etc/nginx/sites-available/payfear /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET` (64+ chars random)
- [ ] Set `CORS_ORIGINS` to your production domain
- [ ] Set `SIWE_DOMAIN` to your production domain
- [ ] Ensure `RELAYER_PRIVATE_KEY` wallet has ETH for gas
- [ ] Enable HTTPS (Certbot / Cloudflare)
- [ ] Set up database backups
- [ ] Configure rate limiting for production load

---

## 🗂️ Project Structure

```
payFear/
├── api/                          # Backend (Express 5 + TypeScript)
│   ├── src/
│   │   ├── config/               # env, database, logger
│   │   ├── controllers/          # route handlers
│   │   ├── middleware/           # auth, rate-limit, audit
│   │   ├── routes/              # REST endpoints
│   │   ├── services/
│   │   │   ├── escrow/          # viem integration
│   │   │   ├── notifications/   # email stubs
│   │   │   └── safety/          # content screening
│   │   └── utils/               # errors, response helpers
│   └── prisma/
│       ├── schema.prisma        # 9 models, 8 enums
│       └── seed.ts              # demo data
│
├── app/                          # Frontend (Next.js 16)
│   └── src/
│       ├── app/                 # pages (App Router)
│       ├── components/
│       │   ├── common/          # UIAtoms, Layout
│       │   ├── escrow/          # ConnectWallet, FundEscrow, SettlementBadge
│       │   └── task/            # TaskCard, RiskPill
│       ├── context/             # Auth, Toast providers
│       └── lib/                 # API client (30+ endpoints)
│
├── contracts/                    # Smart Contracts (Foundry)
│   ├── src/
│   │   └── PayFearEscrow.sol    # escrow contract
│   ├── test/
│   │   └── PayFearEscrow.t.sol  # 33 tests + fuzz
│   └── script/
│       └── DeployPayFearEscrow.s.sol
│
└── docs/                         # documentation + assets
```

---

## 🧪 Testing

```bash
# Smart Contract (33/33 + 256 fuzz runs)
cd contracts && forge test -vv

# API TypeScript check
cd api && npx tsc --noEmit

# Smoke test (requires running servers)
curl http://localhost:3001/health
```

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/awesome`)
3. Commit your changes (`git commit -m 'Add awesome feature'`)
4. Push to the branch (`git push origin feature/awesome`)
5. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with 🔒 on [Base](https://base.org)**

[View Contract on BaseScan ↗](https://sepolia.basescan.org/address/0x6B5075137c32C39CB0c0385A23101260188e404d)

*© 2026 PayFear — Trustless Task Settlement*

</div>