export function emitEvent(
  eventName,
  payload = {}
) {
  window.dispatchEvent(
    new CustomEvent(eventName, {
      detail: payload,
    })
  );
}

export function listenEvent(
  eventName,
  callback
) {
  window.addEventListener(
    eventName,
    callback
  );

  return () => {
    window.removeEventListener(
      eventName,
      callback
    );
  };
}

export function notify(
  message,
  type = 'info'
) {
  emitEvent('elan-notify', {
    message,
    type,
  });
}