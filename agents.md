# 🤖 DealPilot — Agent Progress & State Log

> **Autonomous Deal-Hunting & Price-Monitoring Agent System**  
> **Last Updated**: 2026-10-18T01:42:00+05:30  
> **Status**: ✅ All 7 Milestones & Complete Architecture Implemented & Verified

---

## 📌 Project Overview
DealPilot is an autonomous agentic shopping assistant that:
1. Normalizes and aggregates product deals from multiple sources with a universal data contract.
2. Evaluates deals deterministically and generates structured LLM justifications.
3. Monitors prices asynchronously via BullMQ + Redis background workers using adaptive polling (2h default, 30m when near target).
4. Alerts users with deduplicated notifications via a transactional outbox pattern.
5. Revalidates live price and stock immediately prior to checkout and verifies PayPal Sandbox payments server-to-server.

---

## 🎯 Implementation Roadmap & Progress Tracker

| Milestone | Description | Status | Details |
|---|---|:---:|---|
| **M0: Foundation** | Project scaffolding, TypeScript, Next.js, Tailwind, Prisma, BullMQ, Vitest | ✅ Complete | Next.js 14, Tailwind, Prisma 6, SQLite / Postgres, Vitest. |
| **M1: Normalized Contract & Adapters** | Universal `NormalizedOffer` contract + Mock Retailer Catalog Adapter | ✅ Complete | `src/contracts/offer.ts`, `src/adapters/mock-catalog.ts`. |
| **M2: Database & Freshness Engine** | Prisma schema for users, products, offers, observations, rules, outbox | ✅ Complete | `prisma/schema.prisma` synced to `dev.db`, `src/engine/freshness.ts`. |
| **M3: Deterministic Rules & Deal Scoring** | Budget checks, target thresholds, rubric scoring & LLM explainer guardrails | ✅ Complete | `src/engine/deal-rules.ts`, `src/engine/deal-scorer.ts`, `src/services/llm.ts`. |
| **M4: BullMQ Workers & Adaptive Polling** | Discovery worker, monitoring worker, rate-limits & jitter backoff | ✅ Complete | `src/workers/discovery-worker.ts`, `src/workers/monitoring-worker.ts`. |
| **M5: Transactional Outbox & Alerts** | Atomic DB writes for alerts, deduplication keys (`rule+offer+event+obs`) | ✅ Complete | `src/services/outbox.ts` with deduplication constraints. |
| **M6: Pre-flight Revalidation & PayPal** | Live revalidation gatekeeper + PayPal Orders v2 Sandbox integration | ✅ Complete | `src/services/paypal.ts` with server-side capture verification. |
| **M7: Failure-Path Test Suite & Telemetry** | 10 automated test suites covering failure paths and edge cases | ✅ Complete | `tests/failure-paths.test.ts` (10/10 passing in 67ms). |

---

## 🧪 Automated Failure-Path Test Matrix

All 10 architectural guardrails are fully automated and verified via Vitest:
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

---

## 🚀 Interactive UI & API Capabilities
- **Web App (`/`)**: Natural language query search, deal score breakdown, active watches dashboard, outbox alerts, and PayPal Sandbox modal.
- **Test Lab (`/`)**: One-click simulations for price drops, merchant stock outages, and instant worker poll runs.
- **REST Endpoints**:
  - `POST /api/search` & `GET /api/search/[jobId]`
  - `POST /api/tracking-rules` & `GET /api/tracking-rules`
  - `PATCH /api/tracking-rules/[id]` & `DELETE /api/tracking-rules/[id]`
  - `GET /api/products/[id]/price-history`
  - `POST /api/orders`
  - `POST /api/orders/[id]/capture`
  - `GET /api/orders/[id]`
  - `POST /api/simulate`
