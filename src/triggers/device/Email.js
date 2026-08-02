import { isObject, isString } from '../../utils/type.js';
import engine from '../../engine/TriggerEngine.js';

const emailHandler = async (context) => {
  const params = context.params;
  const to = params[0];
  const config = context.config;

  if (!to && !config.to) {
    throw new Error('Email recipient required');
  }

  const recipient = to || config.to;
  const subject = config.subject || '';
  const body = config.body || config.text || '';
  const cc = config.cc || '';
  const bcc = config.bcc || '';

  let mailtoLink = `mailto:${encodeURIComponent(recipient)}`;
  const queryParams = [];

  if (subject) queryParams.push(`subject=${encodeURIComponent(subject)}`);
  if (body) queryParams.push(`body=${encodeURIComponent(body)}`);
  if (cc) queryParams.push(`cc=${encodeURIComponent(cc)}`);
  if (bcc) queryParams.push(`bcc=${encodeURIComponent(bcc)}`);

  if (queryParams.length > 0) {
    mailtoLink += `?${queryParams.join('&')}`;
  }

  try {
    window.location.href = mailtoLink;
    return { sent: true, to: recipient, subject, body };
  } catch (error) {
    throw new Error(`Email failed: ${error.message}`);
  }
};

engine.register('email', emailHandler);

const email = (to, options = {}) => {
  const config = isObject(options) ? options : {};
  if (isString(options)) {
    return engine.execute('email', to, { subject: options });
  }
  if (isString(to)) config.to = to;
  return engine.execute('email', to || config.to, config);
};

export { email };
export default email;