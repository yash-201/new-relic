'use strict';

const { runWorkflow, runStep, delay } = require('../tracing');

async function validateCartItems(items) {
  return runStep('order.validateCartItems', async () => {
    await delay(40);
    if (!items || items.length === 0) {
      const error = new Error('Cart is empty');
      error.code = 'CART_EMPTY';
      throw error;
    }
    return items.map((item) => ({ ...item, validated: true }));
  });
}

async function checkInventory(items) {
  return runStep('order.checkInventory', async () => {
    await delay(60);
    return runStep('order.checkInventory.reserveStock', async () => {
      await delay(50);
      return runStep('order.checkInventory.verifyWarehouse', async () => {
        await delay(30);
        const outOfStock = items.find((item) => item.sku === 'SKU-OUT-OF-STOCK');
        if (outOfStock) {
          const error = new Error(`Item out of stock: ${outOfStock.sku}`);
          error.code = 'OUT_OF_STOCK';
          throw error;
        }
        return items;
      });
    });
  });
}

async function calculatePricing(items) {
  return runStep('order.calculatePricing', async () => {
    await delay(35);
    return runStep('order.calculatePricing.applyDiscounts', async () => {
      await delay(25);
      return runStep('order.calculatePricing.computeTax', async () => {
        await delay(20);
        const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
        return { subtotal, tax: subtotal * 0.08, total: subtotal * 1.08 };
      });
    });
  });
}

async function chargePayment(pricing) {
  return runStep('order.chargePayment', async () => {
    await delay(80);
    return runStep('order.chargePayment.callPaymentGateway', async () => {
      await delay(70);
      return runStep('order.chargePayment.verifyTransaction', async () => {
        await delay(45);
        const error = new Error('Payment gateway declined: insufficient funds');
        error.code = 'PAYMENT_DECLINED';
        throw error;
      });
    });
  });
}

async function processOrder(orderId, items) {
  return runWorkflow('order', { orderId, itemCount: items?.length ?? 0 }, async () => {
    const validated = await validateCartItems(items);
    const inStock = await checkInventory(validated);
    const pricing = await calculatePricing(inStock);
    return chargePayment(pricing);
  });
}

module.exports = { processOrder };
