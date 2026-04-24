# PayFear

A decentralized task marketplace with built-in escrow system on Base. Requesters fund tasks with ETH, executors complete work, and funds are released securely upon completion.

## ![PayFear Logo](https://via.placeholder.com/100x100/6366f1/ffffff?text=PF)

> **Trustless task marketplace powered by smart contract escrow**

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-blue.svg)](https://docs.soliditylang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org)
[![Express](https://img.shields.io/badge/Express.js-5-white.svg)](https://expressjs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org)
[![Base](https://img.shields.io/badge/Base-Sepolia-0052FF.svg)](https://base.org)

## Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Smart Contract](#smart-contract)
- [API Reference](#api-reference)
- [Frontend](#frontend)
- [Contributing](#contributing)
- [License](#license)

## About

PayFear is a decentralized marketplace where:

1. **Requesters** post tasks and deposit ETH into escrow
2. **Executors** complete the work and submit proof
3. **Smart Contract** releases funds securely to executor

The core philosophy: *"Keep smart contract simple. Complexity stays off-chain."*

All business logic (proof verification, disputes, reviews) lives off-chain in the API. The smart contract only handles value exchange.

## Features

- **Trustless Escrow** — ETH locked in smart contract, released only when work is completed
- **Low Fees** — Platform fee configurable (default 5%)
- **Wallet Auth** — Sign-In with Ethereum (SIWE) for native Web3 authentication
- **Task Marketplace** — Browse, create, and take on-chain verified tasks
- **Real-time Updates** — Live escrow status tracking

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19 |
| Styling | CSS Modules |
| Wallet | viem, window.ethereum |
| Backend | Express.js, TypeScript |
| Database | Prisma, SQLite (dev) |
| Auth | JWT, SIWE |
| Smart Contract | Solidity 0.8.24, Foundry |
| Chain | Base Sepolia (Chain ID: 84532) |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│                  (Next.js - Port 3000)                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────┐      │
│  │ Landing │  │Dashboard│  │ Tasks   │  │ My Tasks    │      │
│  └─────────┘  └─────────┘  └─────────┘  └─────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ REST API
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         API                                 │
│                  (Express.js - Port 3001)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │Auth Ctrl │  │Task Ctrl │  │Escrow Ctrl│ │User Ctrl │     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ JSON-RPC
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SMART CONTRACT                           │
│              PayFearEscrow (Base Sepolia)                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ fund(bytes32 taskId) → locks ETH                    │    │
│  │ release(bytes32 taskId, executor) → pays executor   │    │
│  │ refund(bytes32 taskId) → refunds requester         │    │
│  └─────────────────────────────────────────────────────┘    │
│  Contract: 0x6B5075137c32C39CB0c0385A23101260188e404d      │
└─────────────────────────────────────────────────────────────┘
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Foundry (for smart contracts)

### Installation

```bash
# Clone the repository
git clone https://github.com/raflimulyarahman/payFear
cd payFear

# Install all dependencies
cd app && npm install && cd ..
cd api && npm install && cd ..
```

### Running the Application

**Terminal 1 - Frontend:**

```bash
cd app
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Terminal 2 - API:**

```bash
cd api
npm install
npm run dev
```

API running at [http://localhost:3001](http://localhost:3001)

### Environment Variables

**Frontend** (`app/.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ESCROW_ADDRESS=0x6B5075137c32C39CB0c0385A23101260188e404d
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org
```

**API** (`api/.env`):

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET=your-secret-key
RPC_URL=https://sepolia.base.org
ESCROW_CONTRACT_ADDRESS=0x6B5075137c32C39CB0c0385A23101260188e404d
```

## Smart Contract

### Contract Address

```
Base Sepolia: 0x6B5075137c32C39CB0c0385A23101260188e404d
```

### Contract Source

Located at `contracts/src/PayFearEscrow.sol`

### Key Functions

| Function | Description |
|----------|-------------|
| `fund(bytes32 taskId)` | Requester deposits ETH for a task |
| `release(bytes32 taskId, address executor)` | Owner releases funds to executor |
| `refund(bytes32 taskId)` | Owner refunds requester |
| `getEscrow(bytes32 taskId)` | View escrow details |

### Escrow States

```
EMPTY → FUNDED → RELEASED
              → REFUNDED
```

### Platform Fee

- Default: 5% (500 basis points)
- Maximum: 10% (1000 basis points)
- Collected on release or refund

### Deployment

```bash
cd contracts
forge install
forge build
forge script script/DeployPayFearEscrow.s.sol:DeployPayFearEscrow --rpc-url base_sepolia --broadcast
```

## API Reference

### Base URL

```
http://localhost:3001/api
```

### Authentication

```bash
# Register
POST /auth/register
{ "email", "password", "walletAddress" }

# Login (returns JWT)
POST /auth/login
{ "email", "password" }

# SIWE nonce
GET /auth/nonce

# SIWE verify
POST /auth/verify
{ "message", "signature" }
```

### Tasks

```bash
# List tasks
GET /tasks

# Create task (requires auth)
POST /tasks
{ "title", "description", "budget", "riskLevel" }

# Get task by ID
GET /tasks/:id

# Take task (requires auth)
POST /tasks/:id/take
```

### Escrow

```bash
# Get escrow status
GET /escrow/:taskId

# Get user escrows
GET /escrow/user/:walletAddress
```

### Users

```bash
# Get profile
GET /users/me

# Update profile
PUT /users/me
{ "username", "bio" }
```

## Frontend

### Pages

| Path | Description |
|------|-------------|
| `/` | Landing page |
| `/login` | Login |
| `/signup` | Register |
| `/dashboard` | User dashboard |
| `/tasks/browse` | Browse all tasks |
| `/tasks/create` | Create new task |
| `/tasks/[id]` | Task details |
| `/my-tasks` | Tasks I've posted / taken |

### Components

- **ConnectWallet** — MetaMask integration
- **FundEscrow** — Deposit ETH for task
- **SettlementBadge** — Escrow status indicator
- **TaskCard** — Task preview card

## Contributing

Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) first.

```bash
# Fork and clone
git clone https://github.com/raflimulyarahman/payFear
cd payFear

# Create branch
git checkout -b feature/your-feature

# Commit and push
git commit -m "Add feature"
git push origin feature/your-feature

# Open PR
```

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built with 🔒 on [Base](https://base.org)

[GitHub](https://github.com/raflimulyarahman/payFear)

</div>