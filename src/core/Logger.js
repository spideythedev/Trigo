const LOG_LEVELS = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3,
  verbose: 4,
  debug: 5
};

let currentLevel = 'warn';
let prefix = '[Trigo]';
let customTransport = null;

const setLevel = (level) => {
  if (level in LOG_LEVELS) {
    currentLevel = level;
  }
};

const getLevel = () => currentLevel;

const setPrefix = (newPrefix) => {
  prefix = newPrefix;
};

const setTransport = (transport) => {
  customTransport = transport;
};

const shouldLog = (level) => {
  return LOG_LEVELS[level] <= LOG_LEVELS[currentLevel];
};

const formatMessage = (level, message, data) => {
  const timestamp = new Date().toISOString();
  const icon = {
    error: '❌',
    warn: '⚠️',
    info: 'ℹ️',
    verbose: '📋',
    debug: '🐛'
  }[level] || '';

  return {
    timestamp,
    level,
    icon,
    prefix,
    message,
    data
  };
};

const log = (level, message, data = null) => {
  if (!shouldLog(level)) return;

  const formatted = formatMessage(level, message, data);
  const logMessage = `${formatted.icon} ${formatted.prefix} ${formatted.message}`;

  if (customTransport) {
    customTransport(formatted);
    return;
  }

  switch (level) {
    case 'error':
      console.error(logMessage, data || '');
      break;
    case 'warn':
      console.warn(logMessage, data || '');
      break;
    case 'info':
      console.info(logMessage, data || '');
      break;
    case 'verbose':
      console.log(logMessage, data || '');
      break;
    case 'debug':
      console.debug(logMessage, data || '');
      if (data && typeof data === 'object') {
        console.debug(data);
      }
      break;
    default:
      console.log(logMessage, data || '');
  }
};

const error = (message, data = null) => log('error', message, data);
const warn = (message, data = null) => log('warn', message, data);
const info = (message, data = null) => log('info', message, data);
const verbose = (message, data = null) => log('verbose', message, data);
const debug = (message, data = null) => log('debug', message, data);

const unsupported = (trigger, deviceType, reason = null) => {
  const deviceInfo = deviceType || 'this device';
  const reasonInfo = reason ? ` ${reason}` : '';
  warn(`${trigger}() — Not supported on ${deviceInfo}.${reasonInfo}`);
};

const supported = (trigger) => {
  verbose(`${trigger}() — Supported.`);
};

const config = (key, value) => {
  debug(`Config changed: ${key} = ${JSON.stringify(value)}`);
};

const triggerStart = (trigger, config) => {
  debug(`${trigger}() started`, config);
};

const triggerEnd = (trigger, result) => {
  debug(`${trigger}() completed`, result);
};

const triggerError = (trigger, error) => {
  error(`${trigger}() failed`, error);
};

const fallback = (trigger, fallbackTrigger) => {
  warn(`${trigger}() failed — Falling back to ${fallbackTrigger}()`);
};

const permission = (permission, status) => {
  debug(`Permission "${permission}": ${status}`);
};

const retry = (trigger, attempt, maxAttempts) => {
  verbose(`${trigger}() — Retry ${attempt}/${maxAttempts}`);
};

const queue = (trigger, action) => {
  debug(`Queue ${action}: ${trigger}()`);
};

const condition = (trigger, conditionName, passed) => {
  const status = passed ? '✅ passed' : '❌ failed';
  debug(`Condition "${conditionName}" for ${trigger}(): ${status}`);
};

export {
  LOG_LEVELS,
  setLevel,
  getLevel,
  setPrefix,
  setTransport,
  shouldLog,
  log,
  error,
  warn,
  info,
  verbose,
  debug,
  unsupported,
  supported,
  config,
  triggerStart,
  triggerEnd,
  triggerError,
  fallback,
  permission,
  retry,
  queue,
  condition
};