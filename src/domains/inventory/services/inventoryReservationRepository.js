import { createInventoryReservationModel } from '../models/inventoryReservationModel';

const STORAGE_KEY = 'elanvisual_v2_inventory_reservations';

function readReservations() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(createInventoryReservationModel) : [];
  } catch {
    return [];
  }
}

function writeReservations(reservations) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reservations));
}

export const InventoryReservationRepository = Object.freeze({
  list() {
    return readReservations();
  },

  getByWorkOrder(workOrderId) {
    return readReservations().find((reservation) => reservation.workOrderId === workOrderId) || null;
  },

  save(reservation) {
    const nextReservation = createInventoryReservationModel(reservation);
    const reservations = [
      nextReservation,
      ...readReservations().filter((item) => item.workOrderId !== nextReservation.workOrderId),
    ];
    writeReservations(reservations);
    return nextReservation;
  },
});
