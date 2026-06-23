'use strict';

const { runWorkflow, runStep, delay } = require('../tracing');

async function loadUserProfile(userId) {
  return runStep('user.loadUserProfile', async () => {
    await delay(30);
    return runStep('user.loadUserProfile.fetchFromCache', async () => {
      await delay(20);
      return runStep('user.loadUserProfile.fetchFromDatabase', async () => {
        await delay(55);
        if (!userId) {
          const error = new Error('userId is required');
          error.code = 'USER_ID_REQUIRED';
          throw error;
        }
        return { userId, name: 'Demo User', tier: 'gold' };
      });
    });
  });
}

async function verifyPermissions(user) {
  return runStep('user.verifyPermissions', async () => {
    await delay(25);
    return runStep('user.verifyPermissions.checkRole', async () => {
      await delay(20);
      return runStep('user.verifyPermissions.checkFeatureFlags', async () => {
        await delay(15);
        return { ...user, permissions: ['read', 'write'] };
      });
    });
  });
}

async function syncPreferences(user) {
  return runStep('user.syncPreferences', async () => {
    await delay(40);
    return runStep('user.syncPreferences.mergeLocalSettings', async () => {
      await delay(30);
      return runStep('user.syncPreferences.pushToExternalService', async () => {
        await delay(90);
        const error = new Error('External preference service timeout after 30s');
        error.code = 'SYNC_TIMEOUT';
        throw error;
      });
    });
  });
}

async function onboardUser(userId) {
  return runWorkflow('user', { userId }, async () => {
    const profile = await loadUserProfile(userId);
    const authorized = await verifyPermissions(profile);
    return syncPreferences(authorized);
  });
}

module.exports = { onboardUser };
