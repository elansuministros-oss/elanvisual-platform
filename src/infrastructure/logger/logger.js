const LEVELS = Object.freeze({
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
});

function normalizeLevel(level) {
  return Object.prototype.hasOwnProperty.call(LEVELS, level) ? level : 'info';
}

export function createLogger({ namespace = 'elanvisual:v2', level = 'info' } = {}) {
  let currentLevel = normalizeLevel(level);

  const shouldLog = (messageLevel) => LEVELS[messageLevel] >= LEVELS[currentLevel];
  const write = (messageLevel, args) => {
    if (!shouldLog(messageLevel)) return;
    const method = messageLevel === 'debug' ? 'debug' : messageLevel;
    console[method](`[${namespace}]`, ...args);
  };

  return Object.freeze({
    setLevel(nextLevel) {
      currentLevel = normalizeLevel(nextLevel);
    },
    debug(...args) {
      write('debug', args);
    },
    info(...args) {
      write('info', args);
    },
    warn(...args) {
      write('warn', args);
    },
    error(...args) {
      write('error', args);
    },
  });
}

export const logger = createLogger();
