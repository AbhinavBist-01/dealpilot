# 🤖 DealPilot — Agent Progress & State Log

> **Autonomous Deal-Hunting & Price-Monitoring Agent System**  
> **Last Updated**: 2026-10-21T00:23:00+05:30  
> **Status**: ✅ All 17 Milestones (M0–M17) Verified — Next.js 16.4.2 (Turbopack), React 19.3.1, Live PostgreSQL 16 & Redis 7 Docker Containers, Channel3 SDK 4.3.0, PayPal Agent Toolkit, AG Grid, Email Notification Service & 13/13 Passing Guardrail Tests

---

## 📌 Project Overview
DealPilot is an autonomous agentic shopping assistant that:
1. Normalizes and aggregates product deals from multiple sources (Channel3 + Retailers) with a universal data contract.
2. Evaluates deals deterministically and generates structured LLM justifications.
3. Monitors prices asynchronously via BullMQ + Redis background workers using adaptive polling (2h default, 30m when near target).
4. Dispatches price drop alerts via an atomic transactional outbox pattern to a dedicated Email Notification Service with responsive HTML templates.
5. Manages transactions autonomously via the official `@paypal/agent-toolkit`, revalidates live price/stock before checkout, and verifies PayPal Sandbox payments server-to-server.

---

## 🏛️ Codebase Organization & Modular Structure

The codebase is strictly organized with **only 2 subdirectories inside `src/`**:

```
dealpilot/
├── Dockerfile                   # Multi-stage production container build
├── docker-compose.yml           # PostgreSQL 16 + Redis 7 services with healthchecks
├── prisma/
│   └── schema.prisma            # 11 models synced to PostgreSQL 16
├── tests/
│   └── failure-paths.test.ts    # 13 automated guardrail failure-path test suites
│
└── src/                         # Strictly 2 subdirectories ONLY
    │
    ├── frontend/                # Complete client and App Router layer (Next.js 16)
    │   ├── app/                 # Next.js 16 App Router (pages, layout, styles, API routes)
    │   │   ├── layout.tsx & globals.css
    │   │   ├── page.tsx         # Dashboard view entrypoint
    │   │   └── api/             # REST endpoints (search, rules, orders, notifications, chat)
    │   ├── components/          # Header, DealCard, DealGrid, WatchesList, OutboxAlertsList, PayPalChatInterface
    │   ├── views/               # DashboardView
    │   ├── utils/               # Formatters and badge color helpers
    │   ├── next.config.js       # Turbopack and serverExternalPackages config
    │   └── index.ts             # Unified frontend export
    │
    └── backend/                 # Domain logic, queues, workers & utilities
        ├── adapters/            # MockCatalogAdapter & Channel3CatalogAdapter
        ├── contracts/           # Universal NormalizedOffer, Rules, & Evaluation schemas
        ├── engine/              # Deterministic deal rules, rubric scorer, freshness calculator
        ├── queue/               # BullMQ queues & resilient Redis connection (mock + real)
        ├── services/            # PayPal Sandbox, PayPal Agent Toolkit, Email Service, Outbox, LLM Explainer
        ├── workers/             # Discovery Worker, Monitoring Worker & Outbox Worker
        ├── utils/               # Prisma db client singleton & user session helpers
        └── index.ts             # Unified backend bootstrap entrypoint
```

---

## 🎯 Implementation Roadmap & Progress Tracker

| Milestone | Description | Status | Details |
|---|---|:---:|---|
| **M0: Foundation** | Project scaffolding, TypeScript, Next.js, Tailwind, Prisma, BullMQ, Vitest | ✅ Complete | Next.js 16, React 19, Tailwind, Prisma 6, PostgreSQL, Vitest. |
| **M1: Normalized Contract & Adapters** | Universal `NormalizedOffer` contract + Mock Retailer Catalog Adapter | ✅ Complete | `src/backend/contracts/offer.ts`, `src/backend/adapters/mock-catalog.ts`. |
| **M2: Database & Freshness Engine** | Prisma schema for users, products, offers, observations, rules, outbox | ✅ Complete | `prisma/schema.prisma` synced to PostgreSQL, `src/backend/engine/freshness.ts`. |
| **M3: Deterministic Rules & Deal Scoring** | Budget checks, target thresholds, rubric scoring & LLM explainer guardrails | ✅ Complete | `src/backend/engine/deal-rules.ts`, `src/backend/engine/deal-scorer.ts`, `src/backend/services/llm.ts`. |
| **M4: BullMQ Workers & Adaptive Polling** | Discovery worker, monitoring worker, rate-limits & jitter backoff | ✅ Complete | `src/backend/workers/discovery-worker.ts`, `src/backend/workers/monitoring-worker.ts`. |
| **M5: Transactional Outbox & Alerts** | Atomic DB writes for alerts, deduplication keys (`rule+offer+event+obs`) | ✅ Complete | `src/backend/services/outbox.ts` with deduplication constraints. |
| **M6: Pre-flight Revalidation & PayPal** | Live revalidation gatekeeper + PayPal Orders v2 Sandbox integration | ✅ Complete | `src/backend/services/paypal.ts` with server-side capture verification. |
| **M7: Failure-Path Test Suite & Telemetry** | 10 automated test suites covering failure paths and edge cases | ✅ Complete | `tests/failure-paths.test.ts` (10/10 passing in 148ms). |
| **M8: AG Grid Comparison Dashboard** | Interactive comparison grid with column sorting, filters, and dark quartz theme | ✅ Complete | `src/frontend/components/DealGrid.tsx` with toggle in `DashboardView`. |
| **M9: Channel3 Commerce Adapter** | Channel3 skill & SDK 4.3.0 integrated with live API key for multi-merchant product discovery | ✅ Complete | `.agents/skills/channel3-api`, `src/backend/adapters/channel3-catalog.ts` via `@channel3/sdk`. |
| **M10: APIMatic OpenAPI Specification** | OpenAPI 3.1 specification for client SDK generation | ✅ Complete | `src/backend/contracts/dealpilot-openapi.json`. |
| **M11: Payment Idempotency Key Guard** | `Idempotency-Key` header enforcement for order creation & capture | ✅ Complete | `src/backend/services/paypal.ts` & verified in `tests/failure-paths.test.ts` Test 11. |
| **M12: Deal Intelligence & Specs Presentation** | Deal score, lowest recorded price, AI specs summary, product condition, and seller ratings | ✅ Complete | `DealCard.tsx`, `DealGrid.tsx`, `schema.prisma`, `discovery-worker.ts`, `llm.ts`. |
| **M13: OpenAI Model Integration & LLM Explainer** | OpenAI API support with `gpt-6-luna`, 3s timeout, and deterministic fallback guardrail | ✅ Complete | `src/backend/services/llm.ts`, `.env.example`, verified by Test 6. |
| **M14: Interactive Price History Charts & Multi-Merchant Trend Analysis** | Interactive SVG bezier price trajectory chart, statistical aggregates (all-time low/high, average, savings, drop %), 7D/14D/30D/ALL toggles, and multi-merchant breakdown modal | ✅ Complete | `PriceHistoryModal.tsx`, `route.ts`, integrated into `DealCard.tsx`, `DealGrid.tsx`, and `DashboardView.tsx`. |
| **M15: Upgrade to Next.js 16+ & React 19** | Upgraded to Next.js 16.4.2 (Turbopack) & React 19.3.1 with async route params | ✅ Complete | `package.json`, `next.config.js`, all dynamic API routes migrated to `Promise<{ id }>`. |
| **M16: Price-Drop Email Notification Service** | Transactional outbox worker, responsive dark-quartz HTML email templates, savings metrics, and live in-app preview/test sandbox | ✅ Complete | `src/backend/services/email.ts`, `src/backend/workers/outbox-worker.ts`, `OutboxAlertsList.tsx`, `/api/notifications/test-email`, verified in Test 12. |
| **M17: PayPal Agent Toolkit Integration** | Official `@paypal/agent-toolkit` (OpenAI tools: `create_order`, `get_order`, `pay_order`) + interactive chat testing interface | ✅ Complete | `src/backend/services/paypal-agent.ts`, `/api/chat`, `PayPalChatInterface.tsx`, verified in Test 13. |

---

## 🐳 Docker Services (`docker-compose.yml`)

Run PostgreSQL and Redis with a single command:
```bash
# Start PostgreSQL (5432) and Redis (6379)
pnpm docker:up
# Or: docker compose up -d

# Check service logs
pnpm docker:logs

# Stop services
pnpm docker:down
```

---

## 🧪 Automated Failure-Path Test Matrix

All 13 architectural guardrails are fully automated and verified via Vitest (`pnpm test`):
- ✅ **Test 1: Target Match**: Price equal to or below target triggers configured rule.
- ✅ **Test 2: Variant Guard**: Refurbished or mismatched variant rejected deterministically.
- ✅ **Test 3: Stale Protection**: Stale offer cannot trigger checkout.
- ✅ **Test 4: Deduplication**: Repeated worker executions produce identical deduplication keys and avoid duplicate alerts.
- ✅ **Test 5: Source Outage**: Network timeout preserves last observation as stale without crashing.
- ✅ **Test 6: LLM Outage Guardrail**: Deterministic target detection functions normally when LLM is unavailable.
- ✅ **Test 7: Double-Capture Guard**: Repeated capture calls return idempotent response without duplicating charges.
- ✅ **Test 8: Client-Side Spoofing**: Fake client redirect cannot mark an order paid without server verification.
- ✅ **Test 9: Multi-Tenant Isolation**: User A cannot modify or delete User B's tracking rule.
- ✅ **Test 10: Price Shift at Checkout**: Changed price immediately before checkout aborts order creation for user re-review.
- ✅ **Test 11: Payment Idempotency Guard**: Concurrent duplicate checkout order creation and payment captures return identical cached responses without duplicating charges.
- ✅ **Test 12: Price-Drop Email Notification & Outbox Dispatch**: Price drop triggers transactional outbox event, generates responsive HTML email, and marks notification sent with deduplication guard.
- ✅ **Test 13: PayPal Agent Toolkit Integration**: Toolkit initializes with sandbox context, exposes order tools (`create_order`, `get_order`, `pay_order`), and executes actions.

---

## 🗄️ Active Services & Infrastructure
- **Next.js 16.4.2 & React 19.3.1**: Powered by Turbopack and React 19.
- **PostgreSQL 16**: Running in container `dealpilot-postgres` on port `5432`; schema synced via `prisma db push`.
- **Redis 7**: Running in container `dealpilot-redis` on port `6379`; `USE_MOCK_REDIS="false"`.
- **Channel3 Universal Commerce**: Connected via official `@channel3/sdk` 4.3.0 and authenticated via `CHANNEL3_API_KEY`.
- **PayPal Agent Toolkit**: Integrated via official `@paypal/agent-toolkit/openai` in Sandbox mode.
- **Frontend & App Router**: Strictly encapsulated in `src/frontend/` with AG Grid dark quartz table view.
- **Backend Domain Logic**: Strictly encapsulated in `src/backend/` (BullMQ workers, PayPal sandbox, outbox, email service, scoring).
