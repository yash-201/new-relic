# New Relic Error-Only Tracing Example

A Node.js + Express demo that records **only failed workflows** in New Relic — not every successful request. Nested function steps are tracked in memory and sent to New Relic **only when an error occurs**, reducing storage usage.

## How it works

| Request result | What gets stored in New Relic |
|----------------|-------------------------------|
| **Success** | Nothing (`setIgnoreTransaction`) |
| **Error** | Error event + execution path breadcrumb + optional error transaction trace |

On error, each nested step is attached as `executionPath` on the error:

```json
[
  {"step":"report.fetchRawData","status":"ok","durationMs":50},
  {"step":"report.transformData","status":"ok","durationMs":35},
  {"step":"report.generateExport.uploadToStorage","status":"failed","error":"S3 upload failed..."}
]
```

## Where to check in New Relic

1. **Errors inbox** → open an error → see `executionPath`, `failedStep`, `workflow`, `traceId`
2. **Logs** → filter `level:ERROR` → see workflow failure messages with execution path
3. **NRQL**:
   ```sql
   SELECT failedStep, workflow, executionPath FROM TransactionError SINCE 1 hour ago
   ```
4. **Trace** (only for errors): Errors inbox → **View trace** — transaction trace is recorded because `record_errors: true`

## Prerequisites

- Node.js 18+
- A [New Relic account](https://newrelic.com/signup) with a **License key**
- An APM application (created automatically on first agent connection)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment file and add your license key:

   ```bash
   copy .env.example .env
   ```

   Edit `.env`:

   ```
   NEW_RELIC_LICENSE_KEY=your_actual_license_key
   NEW_RELIC_APP_NAME=newrelic-example
   ```

3. Start the server:

   ```bash
   npm start
   ```

## Generate Traces

Hit these endpoints (each creates a transaction with nested segments):

| Endpoint | Workflow | Error thrown at |
|----------|----------|-----------------|
| `GET /api/order` | Order processing | `order.chargePayment.verifyTransaction` |
| `GET /api/user` | User onboarding | `user.syncPreferences.pushToExternalService` |
| `GET /api/report?reportType=fail` | Report generation | `report.generateExport.uploadToStorage` |

Example:

```bash
curl http://localhost:3000/api/order
curl http://localhost:3000/api/user
curl http://localhost:3000/api/report?reportType=fail
```

## What You'll See in New Relic

1. Go to **APM & Services** → your app (`newrelic-example`)
2. Open **Transactions** — look for `GET /api/order`, `GET /api/user`, `GET /api/report`
3. Click a slow or errored transaction → **Trace details**
4. You should see a nested waterfall like:

   ```
   GET /api/order
   └── order.processOrder
       ├── order.validateCartItems
       ├── order.checkInventory
       │   ├── order.checkInventory.reserveStock
       │   └── order.checkInventory.verifyWarehouse
       ├── order.calculatePricing
       │   ├── order.calculatePricing.applyDiscounts
       │   └── order.calculatePricing.computeTax
       └── order.chargePayment
           ├── order.chargePayment.callPaymentGateway
           └── order.chargePayment.verifyTransaction  ← error here
   ```

5. Check **Errors inbox** for `PAYMENT_DECLINED`, `SYNC_TIMEOUT`, and `STORAGE_ACCESS_DENIED` with custom attributes.

## How Tracing Works

- `require('newrelic')` is the **first line** in `index.js` (required by the agent)
- Express routes create **transactions** automatically
- Each nested function uses `newrelic.startSegment()` via the `traceStep()` helper in `src/tracing.js`
- `newrelic.noticeError()` records errors with custom attributes at the failure point

## Project Structure

```
├── index.js                    # Express server + routes
├── newrelic.js                 # Agent configuration
├── src/
│   ├── tracing.js              # traceStep() helper
│   └── workflows/
│       ├── orderWorkflow.js    # 3-level nested order flow
│       ├── userWorkflow.js     # 3-level nested user flow
│       └── reportWorkflow.js   # 3-level nested report flow
```
