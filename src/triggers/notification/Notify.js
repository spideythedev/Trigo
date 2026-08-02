import { isObject, isString, isFunction } from '../../utils/type.js';
import engine from '../../engine/TriggerEngine.js';

let activeNotifications = new Map();
let notificationCount = 0;

const notifyHandler = async (context) => {
  const action = context.params[0] || 'show';
  const config = context.config;

  if (!('Notification' in window)) {
    throw new Error('Notifications not supported');
  }

  switch (action) {
    case 'show':
      return await showNotification(config);
    case 'close':
      return closeNotification(config);
    case 'clearAll':
      return clearAll(config);
    default:
      return await showNotification(config);
  }
};

const showNotification = async (config = {}) => {
  if (Notification.permission === 'denied') {
    if (config.fallback === 'alert') {
      alert(config.body || config.message || '');
      return { shown: false, method: 'alert' };
    }
    throw new Error('Notification permission denied');
  }

  if (Notification.permission !== 'granted') {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      if (config.fallback === 'alert') {
        alert(config.body || config.message || '');
        return { shown: false, method: 'alert' };
      }
      throw new Error('Notification permission not granted');
    }
  }

  const title = config.title || 'Notification';
  const options = {
    body: config.body || config.message || '',
    icon: config.icon || '',
    image: config.image || '',
    badge: config.badge || '',
    tag: config.tag || '',
    dir: config.dir || 'auto',
    lang: config.lang || 'en',
    renotify: config.renotify || false,
    requireInteraction: config.requireInteraction || false,
    silent: config.silent || false,
    vibrate: config.vibrate || null,
    data: config.data || {},
    actions: config.actions || [],
    timestamp: config.timestamp || Date.now()
  };

  try {
    const notification = new Notification(title, options);

    notification.onclick = (event) => {
      if (config.onClick) config.onClick(event, notification);
      if (config.focusOnClick !== false) {
        window.focus();
      }
    };

    notification.onclose = (event) => {
      activeNotifications.delete(notification.tag || notificationCount);
      if (config.onClose) config.onClose(event, notification);
    };

    notification.onerror = (event) => {
      if (config.onError) config.onError(event, notification);
    };

    notification.onshow = (event) => {
      if (config.onShow) config.onShow(event, notification);
    };

    const id = notification.tag || ++notificationCount;
    activeNotifications.set(id, notification);

    if (config.timeout && config.timeout > 0) {
      setTimeout(() => {
        notification.close();
        activeNotifications.delete(id);
      }, config.timeout);
    }

    return {
      shown: true,
      id,
      title,
      tag: notification.tag
    };
  } catch (error) {
    throw new Error(`Notification failed: ${error.message}`);
  }
};

const closeNotification = (config = {}) => {
  const tag = config.tag;

  if (tag && activeNotifications.has(tag)) {
    const notification = activeNotifications.get(tag);
    notification.close();
    activeNotifications.delete(tag);
    return { closed: true, tag };
  }

  return { closed: false };
};

const clearAll = (config = {}) => {
  for (const [id, notification] of activeNotifications) {
    notification.close();
  }
  activeNotifications.clear();
  notificationCount = 0;
  return { cleared: true };
};

const requestPermission = async () => {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return await Notification.requestPermission();
};

const getPermission = () => {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
};

engine.register('notify', notifyHandler);

const notify = (title, options = {}) => {
  const config = isObject(options) ? options : {};
  if (isString(title)) config.title = title;
  if (isString(options)) config.body = options;
  return engine.execute('notify', 'show', config);
};

notify.show = (title, options = {}) => {
  const config = isObject(options) ? options : {};
  if (isString(title)) config.title = title;
  return engine.execute('notify', 'show', config);
};

notify.close = (tag) => {
  return engine.execute('notify', 'close', { tag });
};

notify.clearAll = () => {
  return engine.execute('notify', 'clearAll', {});
};

notify.schedule = (title, time, options = {}) => {
  const config = isObject(options) ? options : {};
  if (isString(title)) config.title = title;

  const now = new Date();
  let target;

  if (isString(time)) {
    const [hours, minutes] = time.split(':');
    target = new Date();
    target.setHours(hours, minutes, 0, 0);
    if (target < now) target.setDate(target.getDate() + 1);
  } else if (time instanceof Date) {
    target = time;
  } else {
    target = new Date(now.getTime() + time);
  }

  const delay = target - now;
  const timerId = setTimeout(() => notify.show(config.title, config), delay);

  return {
    scheduled: true,
    time: target,
    delay,
    cancel: () => {
      clearTimeout(timerId);
      return { cancelled: true };
    }
  };
};

notify.badge = (count) => {
  if (navigator.setAppBadge) {
    navigator.setAppBadge(count);
  }
};

notify.clearBadge = () => {
  if (navigator.clearAppBadge) {
    navigator.clearAppBadge();
  }
};

notify.requestPermission = requestPermission;
notify.getPermission = getPermission;
notify.count = () => activeNotifications.size;

export { notify };
export default notify;