# WorkHub — Coworking Space Management Platform

WorkHub is an enterprise-grade coworking platform with zero-double-booking atomic concurrency, a real-time availability scrubbing engine, JWT role-based access control, QR desk unlock verification, and database-side aggregation analytics.

---

## 🏛️ Quick Start

### 1. Requirements
- Node.js >= 20.x
- MongoDB (Running on `localhost:27017` or configured via `MONGO_URI`)

### 2. Installation & Database Seeding
```bash
# In the api directory
cd api
npm run seed
```

This seeds:
- **Manager**: `manager@workhub.io` / `Password123!`
- **Member 1**: `sarah@cyberdyne.io` / `Password123!` (Active Hot Desk Monthly Pass)
- **Member 2**: `alex@acme.com` / `Password123!` (Meeting room booking with guest)
- **Spaces**: 24 Desks with floor layout coordinates (`x, y, w, h`), 2 Meeting Rooms, 1 Team Room
- **Amenities, Passes, and Public Guest Pass**

### 3. Start the API Server
```bash
npm run dev
# Server listening on http://localhost:4000
# Interactive Swagger Documentation: http://localhost:4000/api/docs
```

---

## 🧪 Viva Demonstration & Test Suite

Run the complete test suite including the flagship 20-thread concurrency collision test:

```bash
npm test
```

### 🏎️ Concurrency Demonstration Test
```bash
npm run test:concurrency
```
**Output:**
```
🏎️ Concurrency Test Result: 1 Winner, 19 Rejected (SLOT_TAKEN)
PASS tests/concurrency/doubleBooking.test.js
✓ exactly 1 request wins (201) and 19 fail with SLOT_TAKEN (409)
```

**How it works:**
1. 20 parallel HTTP requests fire at the exact same millisecond for the identical desk and slot.
2. A unique partial compound index on `{ resource: 1, slotKeys: 1 }` where `{ holding: true }` guarantees atomic database-level collision prevention.
3. Exactly one write commits (201 Created); the other 19 fail with MongoDB error `11000`, mapped to HTTP 409 `SLOT_TAKEN`.

---

## 🔑 Key Endpoints

| Group | Method & Path | Access | Description |
|---|---|---|---|
| **Auth** | `POST /api/v1/auth/register` | Public | Register new member |
| **Auth** | `POST /api/v1/auth/login` | Public | Return JWT tokens |
| **Auth** | `POST /api/v1/auth/refresh` | Public | Refresh token rotation |
| **Members** | `GET /api/v1/members/me` | Member | Profile & active pass |
| **Members** | `PATCH /api/v1/members/me/device` | Member | Register FCM token |
| **Spaces** | `GET /api/v1/spaces` | Member | List workspaces |
| **Spaces ★** | `GET /api/v1/spaces/availability` | Member | Per-space booked slot indices & operating window |
| **Bookings** | `POST /api/v1/bookings` | Member | Book slot with `Idempotency-Key` support |
| **Bookings** | `GET /api/v1/bookings` | Role-aware | List own or all bookings |
| **Bookings** | `DELETE /api/v1/bookings/:id` | Member/Mgr | Soft cancel & policy refund |
| **QR Scan** | `GET /api/v1/qr/check-in/:id?token=` | Scanner/Staff | Unlocks desk & emits socket event |
| **Guests ★** | `GET /api/v1/guests/pass/:token` | **Public** | Public tokenised guest pass card |
| **Reports ★** | `GET /api/v1/reports/heatmap` | Manager | 7x24 weekday × hour density grid |
| **Reports** | `GET /api/v1/reports/utilization` | Manager | Capacity utilization rates |
| **Reports** | `GET /api/v1/reports/revenue` | Manager | Daily ledger aggregates |
