//sms

import { isObject, isString } from '../../utils/type.js';
import engine from '../../engine/TriggerEngine.js';
import { isMobile } from '../../detect/Device.js';

const smsHandler = async (context) => {
  const params = context.params;
  const number = params[0];
  const body = params[1] || '';
  const config = context.config;

  if (!isMobile()) {
    throw new Error('SMS trigger only available on mobile devices');
  }

  if (!number) {
    throw new Error('Phone number required');
  }

  const cleanNumber = String(number).replace(/[^\d+]/g, '');
  const encodedBody = encodeURIComponent(body || config.body || '');
  let smsLink = `sms:${cleanNumber}`;

  if (encodedBody) {
    smsLink += `?body=${encodedBody}`;
  }

  try {
    window.location.href = smsLink;
    return { sent: true, number: cleanNumber, body: body || config.body };
  } catch (error) {
    throw new Error(`SMS failed: ${error.message}`);
  }
};

engine.register('sms', smsHandler);

const sms = (number, body, options = {}) => {
  const config = isObject(options) ? options : {};
  if (isString(body) && !config.body) config.body = body;
  return engine.execute('sms', number, body || config.body || '', config);
};

export { sms };
export default sms;