'use strict';

// Load .env before the agent so NEW_RELIC_* vars are available
require('dotenv').config();

// New Relic MUST be required before Express and other app modules
require('newrelic');

const express = require('express');
const { processOrder } = require('./src/workflows/orderWorkflow');
const { onboardUser } = require('./src/workflows/userWorkflow');
const { generateReport } = require('./src/workflows/reportWorkflow');
const { ignoreSuccessfulTransaction, buildErrorResponse } = require('./src/tracing');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'newrelic-example', mode: 'error-only-tracing' });
});

app.get('/api/order', async (req, res) => {
  const orderId = req.query.orderId || 'ORD-DEMO-001';
  const items = [
    { sku: 'SKU-001', price: 29.99, qty: 2 },
    { sku: 'SKU-002', price: 14.5, qty: 1 },
  ];

  try {
    const result = await processOrder(orderId, items);
    ignoreSuccessfulTransaction();
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json(buildErrorResponse(error));
  }
});

app.get('/api/user', async (req, res) => {
  const userId = req.query.userId || 'USR-DEMO-001';

  try {
    const result = await onboardUser(userId);
    ignoreSuccessfulTransaction();
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json(buildErrorResponse(error));
  }
});

app.get('/api/report', async (req, res) => {
  const reportType = req.query.reportType || 'fail';

  try {
    const result = await generateReport(reportType);
    ignoreSuccessfulTransaction();
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json(buildErrorResponse(error));
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('Error-only tracing enabled — only failed requests are sent to New Relic');
  console.log(`  GET http://localhost:${PORT}/api/order`);
  console.log(`  GET http://localhost:${PORT}/api/user`);
  console.log(`  GET http://localhost:${PORT}/api/report?reportType=fail`);
});
