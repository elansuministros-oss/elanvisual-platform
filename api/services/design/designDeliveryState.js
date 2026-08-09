import { findDesignRequestByCode } from './designPortalSupabaseAdapter.js';

async function getDesignDeliveryState(requestCode) {
  const stored = await findDesignRequestByCode({ requestCode: String(requestCode || '').trim().toUpperCase() });
  const primary = Array.isArray(stored?.result_files) ? stored.result_files[0] : null;
  const attempts = Number(primary?.deliveryAttempts || 0);
  const delivered = primary?.deliveredToWhatsApp === true;
  const errorCode = primary?.deliveryErrorCode || null;
  return {
    deliveryStatus: delivered ? 'delivered' : errorCode ? 'failed' : 'pending',
    deliveredToWhatsApp: delivered,
    deliveryPending: Boolean(primary) && !delivered && attempts < 3,
    deliveredAt: primary?.deliveredAt || null,
    deliveryAttempts: attempts,
    deliveryErrorCode: errorCode
  };
}

export { getDesignDeliveryState };
