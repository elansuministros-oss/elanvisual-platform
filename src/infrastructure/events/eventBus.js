export function createEventBus({ logger } = {}) {
  const listeners = new Map();
  const history = [];

  function getListeners(eventName) {
    return listeners.get(eventName) || new Set();
  }

  function on(eventName, listener) {
    if (!eventName || typeof listener !== 'function') {
      throw new Error('eventBus.on requires an event name and listener.');
    }

    const eventListeners = getListeners(eventName);
    eventListeners.add(listener);
    listeners.set(eventName, eventListeners);

    return () => off(eventName, listener);
  }

  function off(eventName, listener) {
    const eventListeners = listeners.get(eventName);
    if (!eventListeners) return false;

    const removed = eventListeners.delete(listener);
    if (eventListeners.size === 0) listeners.delete(eventName);
    return removed;
  }

  function emit(eventName, payload = {}, source = 'system') {
    if (!eventName) throw new Error('eventBus.emit requires an event name.');

    const event = Object.freeze({
      name: eventName,
      source,
      payload,
      emittedAt: new Date().toISOString(),
    });

    history.push(event);
    getListeners(eventName).forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        logger?.error?.('Event listener failed', eventName, error);
      }
    });

    return event;
  }

  function clear(eventName) {
    if (eventName) {
      listeners.delete(eventName);
      return;
    }

    listeners.clear();
  }

  return Object.freeze({
    on,
    off,
    emit,
    clear,
    listenerCount(eventName) {
      return getListeners(eventName).size;
    },
    getHistory() {
      return [...history];
    },
  });
}
