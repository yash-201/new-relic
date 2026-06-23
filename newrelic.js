'use strict';

/**
 * New Relic agent configuration — optimized for error-only tracing.
 * Successful requests are ignored in code; only failures are reported.
 * @see https://docs.newrelic.com/docs/apm/agents/nodejs-agent/installation-configuration/nodejs-agent-configuration
 */
exports.config = {
  app_name: [process.env.NEW_RELIC_APP_NAME || 'newrelic-example'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY || 'YOUR_LICENSE_KEY_HERE',
  logging: {
    level: process.env.NEW_RELIC_LOG_LEVEL || 'info',
  },
  distributed_tracing: {
    enabled: true,
  },
  transaction_tracer: {
    enabled: true,
    record_sql: 'off',
    top_n: 5,
    // Very high threshold: skip slow-request traces; errors still recorded via record_errors
    transaction_threshold: 9999,
    record_errors: true,
  },
  transaction_events: {
    max_samples_stored: 200,
  },
  span_events: {
    max_samples_stored: 0,
  },
  error_collector: {
    enabled: true,
    capture_events: true,
  },
  application_logging: {
    enabled: true,
    forwarding: {
      enabled: true,
      max_samples_stored: 10000,
    },
    local_decorating: {
      enabled: false,
    },
  },
  allow_all_headers: true,
  attributes: {
    include: ['request.parameters.*'],
  },
};
