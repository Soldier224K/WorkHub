# WorkHub Architecture Documentation

WorkHub is an enterprise-grade coworking space management system built on Node.js, Express, MongoDB (Mongoose), Socket.IO, and Zod.

---

## 1. Architectural Philosophy & Layered Monorepo

The backend adheres strictly to a **4-tier layered architecture organized by feature**:

```
Routes  ──▶  Controller  ──▶  Service  ──▶  Model (Mongoose)
```

- **Routes (`*.routes.js`)**: Declare HTTP verbs, attach rate limits, authenticate Bearer JWTs, authorize roles (`authorize('manager')`), and bind Zod validation middleware.
- **Controllers (`*.controller.js`)**: Never execute business logic or interact with the database. They extract parameters and headers (such as `Idempotency-Key`), delegate to services, and format outputs using standard response helpers (`respond.js`).
- **Services (`*.service.js`)**: Encapsulate all business rules, mathematical calculations, slot allocations, pricing pass deductions, and transactional state changes.
- **Models (`*.model.js`)**: Define Mongoose schemas, field types, and database indexes.

---

## 2. Zero-Double-Booking Concurrency Engine

The core technical differentiator is WorkHub's atomic collision prevention without distributed locking bottlenecks.

### 30-Minute Slot Keys
Every booking request is validated against strict 30-minute boundaries (`00` or `30` minutes, zero seconds). The reservation is decomposed into an array of ISO string slot keys:

$$\text{Slot Key} = \text{YYYY-MM-DDTHH:mm}$$

For example, a booking from `10:00` to `12:00` produces:
`["2026-10-04T10:00", "2026-10-04T10:30", "2026-10-04T11:00", "2026-10-04T11:30"]`

### MongoDB Unique Partial Index
The `Booking` collection enforces a unique partial compound index on the resource and the `slotKeys` array where `holding: true`:

```javascript
bookingSchema.index(
  { resource: 1, slotKeys: 1 },
  {
    unique: true,
    partialFilterExpression: { holding: true },
    name: 'unique_resource_holding_slotkeys',
  }
);
```

When 20 parallel requests arrive for the exact same desk and time slot:
1. Exactly one insert commits first and sets `holding: true`.
2. The remaining 19 parallel writes trigger MongoDB duplicate key error code `11000`.
3. The centralized `errorHandler` translates code `11000` to HTTP `409 Conflict` with stable error code `SLOT_TAKEN`.
4. Result: **1 Winner (201 Created), 19 Rejections (409 Conflict), 0 corrupted double bookings.**

---

## 3. Booking State Machine

WorkHub enforces an explicit state transition graph in `booking.state.js`. Illegal transitions are rejected with HTTP `409` (`INVALID_STATE_TRANSITION`):

```
       pending
       /     \
[approve]   [reject]
     ▼         ▼
 confirmed  rejected (releases holding)
   /     \
[scan]   [cancel]
  ▼         ▼
checked_in  cancelled (releases holding + partial/full refund)
  │
[end]
  ▼
completed (releases holding)
```

- `no_show`: Background sweeper transitions unscanned confirmed reservations past the 15-minute grace window to `no_show` and releases `holding: false`.

---

## 4. Idempotency & Financial Ledger

### Double-Click Prevention
Every booking request accepts an `Idempotency-Key` HTTP header. Replaying the identical request returns the established booking with HTTP `200 OK` rather than duplicating the booking or debiting the member twice.

### Double-Charge Prevention for Pass Renewals
The transaction ledger enforces a unique partial compound index on pass reference and renewal period:

```javascript
transactionSchema.index(
  { 'refs.pass': 1, period: 1 },
  {
    unique: true,
    partialFilterExpression: {
      'refs.pass': { $exists: true },
      period: { $type: 'string' },
    },
    name: 'unique_pass_renewal_period',
  }
);
```
Even if cron sweepers run concurrently, double renewal within the same month is mathematically impossible at the database level.

---

## 5. Real-time Presences & WebSockets

The Socket.IO server establishes JWT handshake authentication and segments clients into location rooms:
- `loc:<location>`: Receives `availability:update { spaceId, slotKeys, held }` whenever a desk is reserved, cancelled, or freed.
- `member:<memberId>`: Receives private events:
  - `booking:status`
  - `desk:unlocked` (triggered upon QR check-in scan)
  - `pass:renewed`

---

## 6. Database-side Aggregation Pipelines

Reports do not pull raw documents into Node.js memory. All calculations run on MongoDB server-side:
- **Heatmap (`GET /api/v1/reports/heatmap`)**: Uses `$project` with `$dayOfWeek` and `$hour`, followed by `$group` to produce a 7x24 density matrix.
- **Utilization (`GET /api/v1/reports/utilization`)**: Matches booking ranges, sums booked minutes per space, and computes capacity utilization against operating hours.
- **Revenue (`GET /api/v1/reports/revenue`)**: Groups transactions by date and type (`booking_payment`, `booking_refund`, `pass_renewal`, `amenity_charge`) to yield net daily summaries.
