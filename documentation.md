# WorkHub - Technical Documentation

## 1. Project Overview & Architecture
**WorkHub** is an enterprise-grade Coworking Space Management Platform designed to handle dynamic floor mapping, real-time availability scrubbing, idempotent reservations, guest passes, and complex revenue analytics.

### System Architecture
The platform is organized into two primary applications running in a monorepo-style structure:
*   **Backend (`/api`)**: A robust REST API built on Node.js and Express, backed by MongoDB.
*   **Frontend (`/web`)**: A Single Page Application (SPA) built with React 18, Vite, and Tailwind CSS.

### Communication Flow
*   **REST API:** Standard HTTP requests for data fetching, auth, and mutations.
*   **WebSockets:** Socket.io is used for real-time, push-based communication to notify clients instantly when desks are booked or hardware (QR scanners) unlock a desk.

---

## 2. Technology Stack

### Backend Stack
*   **Node.js (v20+)** & **Express.js**: Core runtime and HTTP server.
*   **MongoDB & Mongoose**: NoSQL database and Object Data Modeling (ODM).
*   **Socket.IO**: Real-time event broadcasting.
*   **Authentication**: JSON Web Tokens (JWT) for stateless authentication. `bcryptjs` for secure password hashing.
*   **Validation**: `zod` for strict runtime payload validation.
*   **Security**: `helmet` (HTTP headers) and `express-rate-limit` (DDoS protection).
*   **Logging**: `pino` for fast, JSON-based logging.

### Frontend Stack
*   **React 18 & Vite**: Component-based UI and blazing-fast build tooling.
*   **TypeScript**: Static typing for reliability.
*   **Tailwind CSS**: Utility-first styling. The UI heavily leverages a custom **Glassmorphism** design system with frosted glass effects (`backdrop-blur`), dynamic mesh gradients, and rich shadows.
*   **React Query (`@tanstack/react-query`)**: Server state management, caching, and background data synchronization.
*   **Socket.io-client**: Listening to live floor updates.
*   **Lucide React**: Clean, modern SVG icons.

---

## 3. Core Database Models (Schema Design)

The system revolves around several highly-relational MongoDB collections:

1.  **Members (`members`)**: 
    - Users of the system.
    - Fields: `name`, `email`, `passwordHash`, `role` (`member`, `manager`), `deviceTokens` (for push notifications).
2.  **Spaces (`spaces`)**: 
    - Physical resources to be booked (Desks, Meeting Rooms, Team Rooms).
    - Fields: `capacity`, `hourlyRate`, `features`, and `layout` (X/Y/W/H coordinates for the frontend SVG map).
3.  **Bookings (`bookings`)**: 
    - The core reservation ledger.
    - Fields: `resource`, `member`, `start`, `end`, `slotKeys` (time intervals), `status`, `qrToken`.
4.  **Passes (`passes`)**: 
    - Subscriptions (e.g., `hot_desk_monthly`, `day_pass`) that grant members free/discounted bookings.
5.  **Guests (`guests`)**: 
    - Tokenized guest passes linked to a parent Booking (e.g. inviting an external client to a meeting room).
6.  **Transactions (`transactions`)**: 
    - Immutable financial ledger tracking pass renewals and booking payments.

---

## 4. The Concurrency Engine (Zero Double-Booking)

The flagship engineering achievement of WorkHub is its database-layer collision prevention, guaranteeing that simultaneous booking requests never conflict.

### The Problem
Traditional application-level locking (mutexes, semaphores) is slow and prone to race conditions in distributed API environments. Two users booking the same desk at the same millisecond could result in a double-booking.

### The Solution: Time Discretization & Partial Compound Indexes
1.  **Time Discretization:** The system breaks time down into discrete 30-minute intervals called `slotKeys` (e.g., `["2026-10-05T10:00", "2026-10-05T10:30"]`).
2.  **Atomic Database Lock:** In MongoDB, the Booking schema defines a unique partial compound index:
    ```javascript
    BookingSchema.index(
      { resource: 1, slotKeys: 1 }, 
      { unique: true, partialFilterExpression: { holding: true } }
    );
    ```
3.  **The Result:** When Node.js attempts to insert a new booking, MongoDB evaluates the `slotKeys`. If *any* of the requested 30-minute blocks for that specific `resource` already exist in the database where `holding` is true, MongoDB rejects the write at the C++ engine layer (Error `11000`). The API instantly catches this and returns a `409 SLOT_TAKEN` error to the user.

### Concurrency Testing
The suite includes `tests/concurrency/doubleBooking.test.js` which fires 20 simultaneous HTTP POST requests at the exact same millisecond for the same desk. The system guarantees exactly 1 success (`201 Created`) and 19 rejections (`409 Conflict`).

---

## 5. End-to-End Application Flows

### 5.1. Desk Booking Flow (Frontend to Backend)
1.  **Fetch Data:** Frontend calls `GET /api/v1/spaces/availability`. Returns all spaces and an array of `bookedSlotIndices` indicating which blocks are occupied.
2.  **UI Scrubbing:** As the user drags the TimeRail slider, the SVG Floor Map (`FloorCanvas.tsx`) re-renders locally at 60fps, visually masking out desks that are taken at that specific time.
3.  **Checkout & Idempotency:** The user selects a desk and confirms the booking. The API request includes an `Idempotency-Key` header (e.g., `idem_userid_timestamp`). This prevents accidental double-charges if the mobile network drops and the client retries the request.
4.  **Real-Time Broadcast:** The API saves the booking, then triggers a Socket.IO broadcast (`availability:update`). All other active users on the frontend instantly see the desk turn "Taken" without refreshing the page.

### 5.2. QR Check-In & Hardware Flow
1.  After booking, the API generates a cryptographically signed QR Token (a JWT containing the `bookingId`).
2.  The user arrives at the physical office and scans the QR code at the desk's scanner.
3.  The hardware scanner sends a request to `GET /api/v1/qr/check-in/:id?token=...`.
4.  The API verifies the JWT signature and expiration.
5.  If valid, the API emits a Socket.io event (`desk:unlocked`) directly to the user's phone/browser, displaying a success animation, and marks the booking as `checked_in`.

### 5.3. Manager Analytics Flow
Managers have access to role-protected `/reports` endpoints.
*   **Heatmap (`/api/v1/reports/heatmap`)**: Uses MongoDB Aggregation Pipelines to build a 7x24 density grid of the busiest hours and days.
*   **Utilization (`/api/v1/reports/utilization`)**: Calculates capacity utilization rates.
*   **Revenue (`/api/v1/reports/revenue`)**: Groups and sums `transactions` to provide daily/monthly ledger aggregates.

---

## 6. Edge Cases & Resilience Handled

| Scenario | System Defense / Handling |
| :--- | :--- |
| **Network retries charge user twice** | Solved using the `Idempotency-Key` header. The API catches duplicate keys and returns the cached success response instead of charging again. |
| **User books a past time slot** | API logic validates `start` date > `Date.now()`. Returns `PAST_TIME`. |
| **User books when office is closed** | API validates request against the space's `operatingHours` (e.g., 08:00 - 20:00). Returns `OUTSIDE_HOURS`. |
| **User doesn't show up** | A `node-cron` background job periodically sweeps Bookings. If `now > start + NO_SHOW_GRACE_MINUTES` and status is not `checked_in`, it sets `status = no_show` and sets `holding = false`, freeing the desk for others. |
| **Guest invites exceeding capacity** | API enforces `capacity` limits (e.g., Meeting room cap is 12, cannot invite 15 guests). Returns `GUEST_LIMIT`. |
| **Expired QR Code** | JWT Tokens in QR codes are tightly scoped and set to expire shortly after the booking ends, preventing unauthorized future access. |

---

## 7. Frontend Architecture (UI/UX)

*   **SVG Floor Map (`FloorCanvas.tsx`)**: The entire office layout is rendered via an interactive, zoomable/pannable SVG grid. The `layout` coordinates (`x, y, w, h`) from the database map directly to SVG `<rect>` elements.
*   **Glassmorphism Engine**: The UI utilizes Tailwind's `backdrop-blur` and heavy `rgba` transparency (`bg-surface/50`) over top of a fixed CSS radial mesh gradient to simulate frosted glass.
*   **Command Palette (`CommandBar.tsx`)**: A `⌘K` spotlight search interface allowing power-users to instantly find and book spaces via keyboard.
*   **TimeRail Scrubber (`TimeRail.tsx`)**: A bottom-anchored timeline slider that allows users to scrub through the day's hours to visualize occupancy fluctuations over time.

---

## 8. Setup & Development Guide

### Installation
```bash
# Terminal 1: Backend
cd api
npm install
npm run seed  # Purges DB, seeds Manager, Members, Spaces, Passes, Bookings
npm run dev   # Starts Express on :4000

# Terminal 2: Frontend
cd web
npm install
npm run dev   # Starts Vite on :3000
```

### Running the Flagship Test
To verify the zero-double-booking atomic engine:
```bash
cd api
npm run test:concurrency
```
*Expected Output: Exactly 1 request wins (201) and 19 fail with SLOT_TAKEN (409).*
