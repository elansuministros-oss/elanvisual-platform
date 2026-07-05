import { createPurchaseRequestModel } from '../models/purchaseRequestModel';

const STORAGE_KEY = 'elanvisual_v2_purchase_requests';

function readPurchaseRequests() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(createPurchaseRequestModel) : [];
  } catch {
    return [];
  }
}

function writePurchaseRequests(purchaseRequests) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(purchaseRequests));
}

export const PurchaseRequestRepository = Object.freeze({
  list() {
    return readPurchaseRequests();
  },

  getByReservation(reservationId) {
    return readPurchaseRequests().find((purchaseRequest) => purchaseRequest.reservationId === reservationId) || null;
  },

  save(purchaseRequest) {
    const nextPurchaseRequest = createPurchaseRequestModel(purchaseRequest);
    const purchaseRequests = [
      nextPurchaseRequest,
      ...readPurchaseRequests().filter((item) => item.reservationId !== nextPurchaseRequest.reservationId),
    ];
    writePurchaseRequests(purchaseRequests);
    return nextPurchaseRequest;
  },
});
