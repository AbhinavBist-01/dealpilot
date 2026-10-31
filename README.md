# 🎯 DealPilot

<div align="center">

> **Autonomous Deal-Hunting, Live Price-Monitoring & Verified Agentic Checkout**

[![Next.js 16](https://img.shields.io/badge/Next.js-16.4.2%20(Turbopack)-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.3.1-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis)](https://redis.io/)
[![BullMQ](https://img.shields.io/badge/BullMQ-6.3-orange?style=for-the-badge)](https://bullmq.io/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![PayPal Agent](https://img.shields.io/badge/PayPal-Agent%20Toolkit-00457C?style=for-the-badge&logo=paypal)](https://developer.paypal.com/)
[![Tests Passing](https://img.shields.io/badge/Tests-39%2F39%20Passing-brightgreen?style=for-the-badge)](https://vitest.dev/)

</div>

---

## 📑 Table of Contents

- [Executive Summary](#-executive-summary)
- [System Architecture](#-system-architecture)
- [Core Architectural Workflows](#-core-architectural-workflows)
  - [1. Multi-Merchant Discovery & Product Verification](#1-multi-merchant-discovery--product-verification)
  - [2. Deterministic Scoring & Fact-Grounded LLM Explainer](#2-deterministic-scoring--fact-grounded-llm-explainer)
  - [3. Adaptive Polling & BullMQ Task Queue](#3-adaptive-polling--bullmq-task-queue)
  - [4. Transactional Outbox & Responsive Email Dispatch](#4-transactional-outbox--responsive-email-dispatch)
  - [5. Pre-Flight Revalidation & PayPal Idempotent Checkout](#5-pre-flight-revalidation--paypal-idempotent-checkout)
  - [6. Autonomous Buy Directives ("Buy Now" & "Leave")](#6-autonomous-buy-directives-buy-now--leave)
  - [7. Interactive Comparison Grid & Price History Trajectories](#7-interactive-comparison-grid--price-history-trajectories)
- [Codebase Architecture & Directory Layout](#-codebase-architecture--directory-layout)
- [Data Model & Prisma Schema](#-data-model--prisma-schema)
- [API Reference](#-api-reference)
- [Automated Guardrails & Failure-Path Test Suite](#-automated-guardrails--failure-path-test-suite)
- [Environment Configuration](#-environment-configuration)
- [Quickstart Guide](#-quickstart-guide)
  - [Option A: Docker Services (Recommended)](#option-a-docker-services-recommended)
  - [Option B: Zero-Dependency Local Dev (SQLite + Mock Redis)](#option-b-zero-dependency-local-dev-sqlite--mock-redis)
  - [Option C: Multi-Stage Production Container](#option-c-multi-stage-production-container)
- [Operational Runbooks & Worker Deployment](#-operational-runbooks--worker-deployment)
- [Security & Compliance Safeguards](#-security--compliance-safeguards)

---

## 💡 Executive Summary

Online shoppers constantly face artificially inflated original prices ("anchor fraud"), out-of-sync inventory across merchant tabs, aggressive flash sale windows, and cumbersome multi-step checkouts.

**DealPilot** is an enterprise-grade autonomous shopping assistant and price-monitoring agent system that eliminates these pain points:

1. **Autonomous Domestic Discovery**: Integrates with the official **Channel3 SDK (v4.3.0)** to query real-time merchant feeds, normalize heterogeneous product attributes into a unified schema, and automatically filter out misleading accessories (cases, cables, cushions).
2. **Deterministic Deal Rubric Engine**: Computes objective mathematical deal scores (0–100) using 30-day moving averages, historical lows, and verified seller reputations. An LLM explainer (`gpt-6-luna` with a strict 3-second timeout and hard fallback) generates structured justifications **without ever being permitted to calculate prices or invent discounts**.
3. **Adaptive Monitoring Background Workers**: BullMQ-powered workers continuously monitor tracked prices with dynamic polling cadence (2h baseline, accelerating to 30m when $\le 5\%$ from target) and exponential jitter backoff to respect merchant rate limits.
4. **Transactional Outbox Delivery**: Price-drop notifications are committed in the same database transaction as the observation trigger, ensuring zero lost alerts and strict deduplication (`rule_id + offer_id + event + obs_id`). Alerts are dispatched via responsive HTML email templates with savings metrics.
5. **Pre-Flight Verified Checkout**: Autonomous purchases are guarded by a live pre-flight revalidation check that verifies active stock, seller standing, and exact price immediately prior to order generation.
6. **PayPal Agent Toolkit & Server-to-Server Capture**: Powered by the official `@paypal/agent-toolkit/openai` in Sandbox mode, enforcing idempotency keys on order creation and captures to prevent duplicate charges or double captures.
7. **Better Auth & Modern UI**: Complete user identity via Better Auth (Google & GitHub OAuth), interactive AG Grid comparison tables with dark quartz styling, and SVG bezier price history trajectories with multi-range filters.

---

## 🏗️ System Architecture

```mermaid
flowchart TB
    subgraph Client["Presentation Layer (Next.js 16 + React 19)"]
        UI["DealPilot Web Dashboard<br/>Search · Budget Filters · AG Grid Table<br/>Price History Modal · Watchlist · Outbox Feed"]
        RADAR["Autonomous Buy Directive Modal<br/>Action Commands: 'Buy Now' | 'Leave'"]
        CHAT["PayPal Agent Chat Interface<br/>Natural Language Order Assistant"]
        AUTH["Better Auth Client<br/>Google & GitHub OAuth"]
    end

    subgraph API["Next.js App Router API Handlers (/api/*)"]
        SEARCH_API["/api/search & /api/search/[jobId]<br/>Zod Input Validation"]
        RULES_API["/api/tracking-rules & /api/tracking-rules/[id]<br/>Multi-Tenant Rule Enforcement"]
        ORDERS_API["/api/orders & /api/orders/[id]/capture<br/>Pre-Flight Guard & Idempotency Key"]
        AGENT_API["/api/agent/watch & /api/chat<br/>Directive Dispatch & Tool Execution"]
        WEBHOOK_API["/api/webhooks/merchants<br/>Signature Verification & Ingestion"]
        AUTH_API["/api/auth/[...all]<br/>Better Auth Route Handler"]
    end

    subgraph Workers["Asynchronous Distributed Engine (BullMQ + Redis 7)"]
        DISC_W["Discovery Worker<br/>Channel3 Commerce Ingestion"]
        MON_W["Adaptive Monitoring Worker<br/>Dynamic Polling Cadence"]
        OUT_W["Transactional Outbox Worker<br/>Deduplicated HTML Email Dispatcher"]
    end

    subgraph Engine["Deterministic & Agentic Decision Core"]
        VERIFY["Product Verification Engine<br/>Spec Extractor & Accessory Guard"]
        RUBRIC["Deterministic Deal Scorer<br/>30D Moving Avg · Historic Low · Rubric v1"]
        FRESH["Data Freshness Engine<br/>Fresh · Stale · Unavailable State Machine"]
        LLM_EXP["LLM Deal Explainer<br/>OpenAI gpt-6-luna (3s Timeout + Hard Fallback)"]
        PP_AGENT["PayPal Agent Toolkit<br/>create_order · get_order · pay_order"]
    end

    subgraph Data["Persistence & Storage Layer"]
        PG[("PostgreSQL 16 (Prisma ORM)<br/>Users · Sessions · Accounts<br/>Products · Offers · Price Observations<br/>Tracking Rules · Outbox · Orders · Transactions")]
        REDIS[("Redis 7 (BullMQ)<br/>Job Queues · Rate Limit Semaphores")]
    end

    subgraph External["External Commerce & Payment Providers"]
        CHANNEL3["Channel3 Universal Commerce API"]
        PAYPAL_SB["PayPal Orders v2 Sandbox API"]
        OPENAI_API["OpenAI API Service"]
        RESEND_API["Resend Email API / Local Mailer"]
    end

    %% Client to API
    UI --> SEARCH_API
    UI --> RULES_API
    UI --> ORDERS_API
    RADAR --> AGENT_API
    CHAT --> AGENT_API
    AUTH --> AUTH_API

    %% API to DB & Queues
    SEARCH_API --> PG
    SEARCH_API --> REDIS
    RULES_API --> PG
    ORDERS_API --> PG
    AGENT_API --> PG
    WEBHOOK_API --> PG

    %% Workers
    REDIS <--> DISC_W
    REDIS <--> MON_W
    REDIS <--> OUT_W

    %% Worker Execution
    DISC_W --> CHANNEL3
    DISC_W --> VERIFY
    DISC_W --> RUBRIC
    DISC_W --> LLM_EXP
    DISC_W --> PG

    MON_W --> CHANNEL3
    MON_W --> FRESH
    MON_W --> PG
    MON_W --> OUT_W

    OUT_W --> PG
    OUT_W --> RESEND_API

    %% Orders & Agent
    ORDERS_API --> FRESH
    ORDERS_API --> PAYPAL_SB
    AGENT_API --> PP_AGENT
    PP_AGENT --> PAYPAL_SB
    PP_AGENT <--> OPENAI_API
```

---

## 🔄 Core Architectural Workflows

### 1. Multi-Merchant Discovery & Product Verification

1. The user enters a natural language query (e.g., *"Sony WH-1000XM5 under ₹25,000"*).
2. The endpoint invokes the `ProductVerifier` to extract canonical model signatures, color variants, and storage options.
3. The **Accessory Exclusion Guard** deterministically rejects cables, ear cushions, and carrying cases matching blacklist tokens to eliminate false deals.
4. The Channel3 adapter queries domestic merchant feeds via `@channel3/sdk`, standardizing merchant names, availability status, domestic currency, and direct offer links into a universal `NormalizedOffer`.

### 2. Deterministic Scoring & Fact-Grounded LLM Explainer

```mermaid
flowchart LR
    A["Raw Product Offer\n(Price, Merchant, Stock, History)"] --> B["Deterministic Deal Rules\n(Budget & Target Ceiling Checks)"]
    B --> C["Rubric Scorer (v1.0)\n(30D Delta, Historical Low, Seller Rating)"]
    C -->|Numeric Score 0-100| D["LLM Explainer Guardrail\n(OpenAI gpt-6-luna / 3s Timeout)"]
    D -->|Failure / Timeout| E["Deterministic Rule Fallback Summary"]
    D -->|Success| F["Fact-Grounded Structured Summary"]
    E --> G["Normalized Deal Card & AG Grid Presentation"]
    F --> G
```

- **Zero Hallucination Policy**: The LLM is never allowed to calculate final prices, compute discounts, or determine historical lows. All numbers are calculated by the deterministic rules engine before passing to the explainer.
- **Circuit Breaker**: If OpenAI times out after 3,000ms or fails with an API error, DealPilot seamlessly falls back to a deterministic template without impacting user response times.

### 3. Adaptive Polling & BullMQ Task Queue

Price tracking uses dynamic scheduling rather than inefficient fixed intervals:
- **Default State**: Background check every 2 to 4 hours.
- **Near-Target Acceleration**: When the current price comes within $\le 5\%$ of the user's target threshold, the polling cadence dynamically tightens to **30 minutes**.
- **Jittered Backoff**: If merchant rate limits (HTTP 429) are encountered, exponential backoff with pseudo-random jitter is applied to prevent thundering herd problems.

### 4. Transactional Outbox & Responsive Email Dispatch

Alerts use the **Transactional Outbox Pattern** to prevent dropped notifications during worker crashes:
1. When a price drop satisfies an active rule, the observation record and an outbox event are committed within a single atomic database transaction:
   ```sql
   INSERT INTO notification_outbox (tracking_rule_id, deduplication_key, payload, status)
   VALUES ($ruleId, $dedupKey, $payload, 'pending');
   ```
2. The deduplication key prevents repeated alerts for identical price drops:
   $$\text{Key} = \text{rule\_id} + \text{offer\_id} + \text{event\_type} + \text{observation\_id}$$
3. The `OutboxWorker` renders a responsive, dark-quartz HTML email with price delta statistics, savings calculations, and direct revalidation checkout links.
4. If `RESEND_API_KEY` is provided, emails are delivered via Resend; otherwise, DealPilot uses its built-in simulated testable mailer with zero external dependencies.

### 5. Pre-Flight Revalidation & PayPal Idempotent Checkout

```mermaid
sequenceDiagram
    autonumber
    actor User as Shopper
    participant UI as Next.js Web App
    participant API as /api/orders
    participant Gate as Pre-Flight Gatekeeper
    participant PP as PayPal Sandbox API
    participant DB as PostgreSQL 16

    User->>UI: Click "Buy Now" on Deal
    UI->>API: POST /api/orders (offerId, Idempotency-Key)
    API->>Gate: Execute Pre-Flight Revalidation
    Gate->>Gate: Re-fetch live stock & price from merchant
    alt Price shifted or Out of Stock
        Gate-->>UI: 400 Bad Request (PRICE_SHIFTED / OUT_OF_STOCK)
        UI-->>User: Display updated price for confirmation
    else Offer Validated
        Gate-->>API: Offer Confirmed Fresh
        API->>PP: Create PayPal Order v2 (Intent: CAPTURE)
        PP-->>API: Return paypalOrderId & Approval URL
        API->>DB: Insert Order (Status: created)
        API-->>UI: Return checkout payload & approval URL
        UI->>User: Launch PayPal Sandbox Approval Modal
        User->>PP: Authenticate & Approve Transaction
        PP-->>UI: Return onApprove (orderId)
        UI->>API: POST /api/orders/:id/capture (Idempotency-Key)
        API->>PP: Execute Server-to-Server Capture
        PP-->>API: Confirm Payment Status (COMPLETED)
        API->>DB: Transition Order to "paid" & Log Transaction
        API-->>UI: Order Receipt & Authoritative Confirmation
        UI-->>User: Display Success Screen with Receipt
    end
```

### 6. Autonomous Buy Directives ("Buy Now" & "Leave")

Users can command the autonomous agent to monitor specific target prices via natural language directives (e.g., *"Find Sony XM5 under ₹18,000 and notify me"*):
- The agent tracks the target price in the background.
- When an offer matches the directive, the UI displays a focused decision card with strictly **two deterministic actions**:
  1. **Buy Now**: Triggers pre-flight validation and initiates PayPal checkout.
  2. **Leave**: Dismisses the match and continues autonomous monitoring.

### 7. Interactive Comparison Grid & Price History Trajectories

- **AG Grid Dark Quartz View**: Switch between visual deal cards and an enterprise comparison table featuring column sorting, merchant filters, stock indicators, and direct checkout buttons.
- **Interactive Price Trajectory**: Visualizes all historical observations as a smooth SVG bezier curve with statistical metrics:
  - All-time Low and All-time High
  - 30-Day Moving Average
  - Total Savings & Drop Percentage
  - Dynamic Timeframe Selectors: `7D`, `14D`, `30D`, and `ALL`
  - Multi-Merchant Price Comparison breakdown table

---

## 🏛️ Codebase Architecture & Directory Layout

The codebase strictly enforces modular separation with **only two subdirectories inside `src/`**:

```
dealpilot/
├── Dockerfile                      # Multi-stage production container build (Node 22 Alpine)
├── docker-compose.yml              # PostgreSQL 16 + Redis 7 services with healthchecks
├── package.json                    # Dependencies, scripts (Turbopack, Vitest, Prisma)
├── tsconfig.json                   # Strict TypeScript compiler options
├── vitest.config.ts                # Unit and integration test configuration
├── prisma/
│   └── schema.prisma               # 11 relational models synced to PostgreSQL 16
│
├── tests/
│   ├── failure-paths.test.ts       # 17 automated architectural guardrail tests
│   └── system-evals.test.ts        # 22 comprehensive end-to-end subsystem evaluations
│
└── src/                            # Strictly 2 subdirectories ONLY
    │
    ├── frontend/                   # Next.js 16 App Router layer (client & routes)
    │   ├── app/                    # Next.js App Router
    │   │   ├── layout.tsx          # Root layout with dark quartz theme
    │   │   ├── globals.css         # Tailwind CSS styling and AG Grid quartz overrides
    │   │   ├── page.tsx            # Main dashboard entrypoint
    │   │   ├── auth/page.tsx       # Authentication view
    │   │   └── api/                # REST API route handlers
    │   │       ├── agent/watch/    # Autonomous buy directive endpoint
    │   │       ├── auth/[...all]/  # Better Auth OAuth handlers
    │   │       ├── chat/           # PayPal Agent Toolkit interactive endpoint
    │   │       ├── notifications/  # Notification outbox & test email triggers
    │   │       ├── orders/         # Pre-flight order creation & server capture
    │   │       ├── products/       # Price history and statistical analytics
    │   │       ├── search/         # Asynchronous Channel3 search & worker query
    │   │       ├── tracking-rules/ # Price watch CRUD & multi-tenant isolation
    │   │       └── webhooks/       # Merchant incoming price update webhooks
    │   ├── components/             # Reusable UI component library
    │   │   ├── Header.tsx          # Navigation, status badges & auth trigger
    │   │   ├── DealCard.tsx        # Visual deal card with rubric badges & specs
    │   │   ├── DealGrid.tsx        # AG Grid comparison table with sorting & filters
    │   │   ├── WatchesList.tsx     # Active tracking rules with pause/resume
    │   │   ├── OutboxAlertsList.tsx# Transactional outbox email dispatch history
    │   │   ├── PriceHistoryModal.tsx# SVG bezier trajectory chart & stats
    │   │   ├── AgentBuyDirectiveModal.tsx # Autonomous "Buy Now" | "Leave" modal
    │   │   ├── PayPalChatInterface.tsx # Conversational PayPal agent assistant
    │   │   └── UserAuthButton.tsx  # Google/GitHub Better Auth login button
    │   ├── views/                  # Composed page views (DashboardView.tsx)
    │   ├── utils/                  # UI formatting helpers & color token resolvers
    │   └── next.config.js          # Turbopack & serverExternalPackages configuration
    │
    └── backend/                    # Domain logic, queues, workers & utilities
        ├── adapters/               # Retailer feeds & Channel3 SDK 4.3.0 adapter
        │   ├── channel3-catalog.ts # Official Channel3 commerce client
        │   └── mock-catalog.ts     # Resilient seed catalog adapter
        ├── contracts/              # Universal TypeScript data schemas
        │   ├── offer.ts            # NormalizedOffer, PriceRecord & Condition
        │   ├── rules.ts            # TrackingRule, Strategy & Freshness
        │   └── dealpilot-openapi.json # APIMatic OpenAPI 3.1 specification
        ├── engine/                 # Deterministic business logic & verification
        │   ├── deal-rules.ts       # Budget checks & target threshold evaluator
        │   ├── deal-scorer.ts      # Rubric v1 numeric deal quality scorer (0-100)
        │   ├── freshness.ts        # Freshness state machine & revalidation
        │   └── product-verifier.ts # Spec extractor & accessory exclusion guard
        ├── queue/                  # Distributed queuing infrastructure
        │   ├── connection.ts       # Resilient Redis connection (mock + real)
        │   └── deal-queue.ts       # BullMQ discovery & monitoring queue wrappers
        ├── services/               # External provider integrations & services
        │   ├── paypal.ts           # PayPal Orders v2 Sandbox & capture verification
        │   ├── paypal-agent.ts     # Official @paypal/agent-toolkit tools
        │   ├── email.ts            # Responsive dark-quartz HTML email service
        │   ├── outbox.ts           # Atomic transactional outbox logger
        │   ├── llm.ts              # OpenAI deal explainer with 3s fallback guard
        │   └── agent-fallback.ts   # Exponential jitter retries & circuit breakers
        ├── workers/                # BullMQ asynchronous background processes
        │   ├── discovery-worker.ts # Multi-merchant ingestion worker
        │   ├── monitoring-worker.ts# Adaptive cadence price monitoring worker
        │   └── outbox-worker.ts    # Transactional outbox email dispatch worker
        └── utils/                  # Shared database singletons & auth helpers
            ├── db.ts               # PrismaClient singleton with connection pooling
            └── auth.ts             # Better Auth server configuration
```

---

## 🗄️ Data Model & Prisma Schema

DealPilot utilizes 11 relational models in PostgreSQL via Prisma:

| Model | Table | Purpose |
|---|---|---|
| `User` | `users` | User identity, preferences, currency settings, and active session link. |
| `Session` | `sessions` | Active Better Auth session tokens and expiration timestamps. |
| `Account` | `accounts` | OAuth credentials (Google, GitHub) managed securely by Better Auth. |
| `Verification` | `verifications` | One-time verification tokens and email challenges. |
| `Product` | `products` | Canonical catalog item with standardized brand, model, and taxonomy. |
| `Offer` | `offers` | Merchant-specific listing linked to a product with price, URL, stock, and seller rating. |
| `PriceObservation` | `price_observations` | Historical time-series record of observed prices for trend calculations. |
| `TrackingRule` | `tracking_rules` | User-defined watch with target price, strategy, deadline, and notification settings. |
| `DealEvaluation` | `deal_evaluations` | Audit trail of rubric scores, confidence levels, and LLM justifications. |
| `NotificationOutbox`| `notification_outbox`| Transactional outbox table with unique deduplication constraint. |
| `Order` | `orders` | Purchase checkout record with locked price, approval status, and PayPal order ID. |
| `Transaction` | `transactions` | Authoritative payment capture record verified server-to-server with PayPal. |

---

## 🔌 API Reference

All mutating endpoints enforce validation via **Zod** schemas and verify user session ownership.

### Discovery & Search

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/search` | Dispatches an asynchronous multi-merchant discovery job. |
| `GET` | `/api/search/:jobId` | Polls the status and normalized results of a search job. |
| `POST` | `/api/agent/watch` | Creates an autonomous buy directive and returns matched offers. |

### Price Tracking & Rules

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/tracking-rules` | Lists all active and paused tracking rules for the current user. |
| `POST` | `/api/tracking-rules` | Creates a new tracking rule with a target price and strategy. |
| `PATCH` | `/api/tracking-rules/:id` | Updates target price or toggles active/paused status. |
| `DELETE` | `/api/tracking-rules/:id` | Deactivates and deletes a tracking rule (enforces user isolation). |
| `GET` | `/api/products/:id/price-history` | Returns historical price records, moving averages, and highs/lows. |

### Checkout & Payments

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/orders` | Executes pre-flight revalidation and creates a PayPal Sandbox order. |
| `GET` | `/api/orders/:id` | Returns authoritative order details, line items, and payment state. |
| `POST` | `/api/orders/:id/capture` | Captures approved PayPal payment server-to-server with idempotency. |

### Agent Assistant & Webhooks

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/chat` | Interacts with the PayPal Agent Toolkit for conversational order operations. |
| `POST` | `/api/webhooks/merchants` | Ingests incoming price update webhooks from merchants. |
| `POST` | `/api/notifications/test-email` | Dispatches a test price-drop HTML email through the outbox engine. |

---

## 🛡️ Automated Guardrails & Failure-Path Test Suite

DealPilot enforces **39 fully automated tests** spanning 17 architectural guardrails and 22 comprehensive system functionality evaluations via Vitest (`pnpm test`):

```
✓ tests/failure-paths.test.ts (17 tests passed)
  ✓ 1. Target Match: Target price equal to or below threshold triggers rule
  ✓ 2. Variant Guard: Refurbished or mismatched variant rejected deterministically
  ✓ 3. Stale Protection: Stale offer cannot trigger checkout without revalidation
  ✓ 4. Deduplication: Repeated worker executions produce identical deduplication keys
  ✓ 5. Source Outage: Network timeout preserves last observation as stale without crashing
  ✓ 6. LLM Outage Guardrail: Deterministic target detection functions when LLM fails
  ✓ 7. Double-Capture Guard: Repeated capture calls return idempotent response
  ✓ 8. Client-Side Spoofing: Fake client redirect cannot mark an order paid without server verification
  ✓ 9. Multi-Tenant Isolation: User A cannot modify or delete User B's tracking rule
  ✓ 10. Price Shift at Checkout: Price increase aborts order creation for user re-review
  ✓ 11. Payment Idempotency: Duplicate order creations return cached responses without double-charging
  ✓ 12. Transactional Outbox: Price drop emits atomic outbox event & responsive HTML email
  ✓ 13. PayPal Agent Toolkit: Initializes with sandbox context and executes order actions
  ✓ 14. Stock Depletion: Out-of-stock offer aborts checkout immediately
  ✓ 15. Invalid Strategy Parameter: Unsupported strategy rejected by Zod validation
  ✓ 16. Mismatched PayPal Order ID: Spoofed PayPal order ID is rejected and throws
  ✓ 17. Unauthenticated Rule Modification: Anonymous rule deletion rejected with 401/403

✓ tests/system-evals.test.ts (22 tests passed)
  ✓ Eval 1: Source Adapters & Normalization (Channel3 SDK 4.3.0 & Mock Catalog)
  ✓ Eval 2: Product Verification & Intent Guard (Spec extraction & accessory blacklist)
  ✓ Eval 3: Deterministic Deal Rules & Rubric Scorer (Budget, target, score 0-100)
  ✓ Eval 4: Transactional Outbox & Email Notification Service (Atomic DB writes, HTML templates)
  ✓ Eval 5: Pre-Flight Revalidation & PayPal Idempotency (Stock verification, server capture)
  ✓ Eval 6: Official PayPal Agent Toolkit Integration (Autonomous tool calling with retries)
  ✓ Eval 7: User Authentication & Security (Better Auth session verification)
```

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env` and configure your credentials:

```bash
cp .env.example .env
```

| Variable | Required | Default | Description |
|---|:---:|---|---|
| `DATABASE_URL` | **Yes** | `postgresql://dealpilot:dealpilot_password@localhost:5432/dealpilot?schema=public` | PostgreSQL connection string (or `file:./dev.db` for SQLite). |
| `REDIS_HOST` | **Yes** | `127.0.0.1` | Redis host for BullMQ queues. |
| `REDIS_PORT` | **Yes** | `6379` | Redis port. |
| `USE_MOCK_REDIS` | No | `false` | Set to `true` to run BullMQ with an in-memory mock Redis (no Docker needed). |
| `OPENAI_API_KEY` | Optional | `""` | OpenAI API key for deal explainer and PayPal agent tool calling. |
| `OPENAI_MODEL` | No | `gpt-6-luna` | Model identifier for LLM summaries. |
| `CHANNEL3_API_KEY`| Optional | `""` | Channel3 API key for live multi-merchant product discovery. |
| `PAYPAL_MODE` | No | `sandbox` | `sandbox` or `live`. |
| `PAYPAL_CLIENT_ID`| Optional | `mock_paypal_client_id` | PayPal Developer Sandbox Client ID. |
| `PAYPAL_CLIENT_SECRET` | Optional | `mock_paypal_client_secret` | PayPal Developer Sandbox Secret. |
| `BETTER_AUTH_SECRET` | **Yes** | (min 32 chars) | Secret key for signing Better Auth sessions and cookies. |
| `BETTER_AUTH_URL` | **Yes** | `http://localhost:3000` | Canonical public URL of your application. |
| `GOOGLE_CLIENT_ID` | Optional | `""` | Google OAuth Client ID for social login. |
| `GITHUB_CLIENT_ID` | Optional | `""` | GitHub OAuth Client ID for social login. |
| `RESEND_API_KEY` | Optional | `""` | Resend API key for live email delivery (falls back to local simulated mailer). |
| `EMAIL_FROM` | No | `alerts@dealpilot.ai` | From address for price drop email notifications. |

---

## 🚀 Quickstart Guide

### Prerequisites
- **Node.js**: v20.x or v22.x LTS
- **pnpm**: v10+ (`corepack enable && corepack prepare pnpm@latest --activate`)
- **Docker & Docker Compose**: (Recommended for PostgreSQL 16 & Redis 7)

---

### Option A: Docker Services (Recommended)

1. **Clone and Install Dependencies**:
   ```bash
   git clone https://github.com/dealpilot/dealpilot.git
   cd dealpilot
   pnpm install
   ```

2. **Start Infrastructure Services (PostgreSQL 16 & Redis 7)**:
   ```bash
   pnpm docker:up
   ```
   *PostgreSQL will be running on port `5432` and Redis on port `6379` with automatic healthchecks.*

3. **Synchronize Database Schema**:
   ```bash
   pnpm db:push
   ```

4. **Launch the Next.js Web Dashboard**:
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Start the Background Worker Engine** (in a separate terminal):
   ```bash
   pnpm worker
   ```

---

### Option B: Zero-Dependency Local Dev (SQLite + Mock Redis)

For quick offline development without Docker:
1. In your `.env` file, configure:
   ```env
   DATABASE_URL="file:./dev.db"
   USE_MOCK_REDIS="true"
   ```
2. Push the SQLite schema:
   ```bash
   pnpm db:push
   ```
3. Run the development server:
   ```bash
   pnpm dev
   ```

---

### Option C: Multi-Stage Production Container

Build and run the complete containerized stack using the production `Dockerfile`:

```bash
# Build the production image
docker build -t dealpilot:latest .

# Run the container
docker run -p 3000:3000 \
  --env-file .env \
  --name dealpilot-app \
  dealpilot:latest
```

---

## 🧪 Testing & Verification

Run the entire test suite covering all 39 guardrails and system evaluations:

```bash
# Run all 39 failure-path and system evaluation tests
pnpm test

# Run tests in interactive watch mode
pnpm test:watch

# Execute only the end-to-end system evaluations
pnpm eval

# Perform strict TypeScript type checking
pnpm typecheck

# Verify the Next.js production build
pnpm build
```

---

## ⚙️ Operational Runbooks & Worker Deployment

In production environments, the Next.js web application and the background workers should be operated as decoupled processes:

```mermaid
flowchart LR
    A["Web App Instances\n(Next.js App Router)"] -->|Enqueue Jobs| B[("Redis 7 Cluster\n(BullMQ)")]
    B -->|Consume Jobs| C["Worker Process 1\n(Discovery Worker)"]
    B -->|Consume Jobs| D["Worker Process 2\n(Monitoring Worker)"]
    B -->|Consume Jobs| E["Worker Process 3\n(Outbox Email Worker)"]
    C & D & E --> F[("PostgreSQL 16\n(Connection Pool)")]
```

- **Process Supervision**: In standard Linux or containerized environments, run `pnpm worker` under a process supervisor such as `systemd`, `pm2`, or as a dedicated Kubernetes Deployment.
- **Graceful Shutdown**: The worker engine listens for `SIGTERM` and `SIGINT` signals, draining active BullMQ queue jobs before terminating database connections.
- **Connection Pooling**: PostgreSQL connection strings should include pool sizing parameters (e.g., `?connection_limit=20&pool_timeout=10`) when scaling worker replicas.

---

## 🔒 Security & Compliance Safeguards

- **Strict Server-to-Server Payment Verification**: Client-side PayPal redirects are treated as untrusted hints. Orders are transitioned to `paid` **strictly** after the backend verifies the capture directly with PayPal Orders v2.
- **Multi-Tenant Authorization**: All tracking rule queries enforce compound predicates: `WHERE id = $id AND user_id = $sessionUserId`.
- **Payment Idempotency**: Order creation and payment captures enforce unique `Idempotency-Key` headers to guarantee zero double captures during network retries.
- **Prompt Injection Defense**: Merchant listing titles and product descriptions are treated as raw un-executable strings and escaped prior to passing to LLM contexts.
- **Zero Hallucination Scoring**: Deal scores, savings amounts, and percentage drops are calculated via deterministic TypeScript math functions; the LLM is restricted to qualitative, fact-grounded explanations.

---

<div align="center">

**DealPilot** — *Built for trustworthy, autonomous shopping intelligence.*

</div>
