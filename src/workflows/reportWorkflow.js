'use strict';

const { runWorkflow, runStep, delay } = require('../tracing');

async function fetchRawData(reportType) {
  return runStep('report.fetchRawData', async () => {
    await delay(50);
    return runStep('report.fetchRawData.queryPrimaryDb', async () => {
      await delay(80);
      return runStep('report.fetchRawData.queryReplicaDb', async () => {
        await delay(60);
        return { reportType, rows: [{ id: 1, value: 100 }, { id: 2, value: 200 }] };
      });
    });
  });
}

async function transformData(raw) {
  return runStep('report.transformData', async () => {
    await delay(35);
    return runStep('report.transformData.normalizeFields', async () => {
      await delay(25);
      return runStep('report.transformData.aggregateMetrics', async () => {
        await delay(40);
        const total = raw.rows.reduce((sum, row) => sum + row.value, 0);
        return { ...raw, total, rowCount: raw.rows.length };
      });
    });
  });
}

async function generateExport(transformed) {
  return runStep('report.generateExport', async () => {
    await delay(45);
    return runStep('report.generateExport.buildCsv', async () => {
      await delay(35);
      return runStep('report.generateExport.uploadToStorage', async () => {
        await delay(100);
        if (transformed.reportType === 'fail') {
          const error = new Error('S3 upload failed: access denied on bucket');
          error.code = 'STORAGE_ACCESS_DENIED';
          throw error;
        }
        return { url: 'https://storage.example.com/reports/demo.csv', size: 1024 };
      });
    });
  });
}

async function generateReport(reportType) {
  return runWorkflow('report', { reportType }, async () => {
    const raw = await fetchRawData(reportType);
    const transformed = await transformData(raw);
    return generateExport(transformed);
  });
}

module.exports = { generateReport };
