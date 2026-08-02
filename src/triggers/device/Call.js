import { isObject, isString } from '../../utils/type.js';
import engine from '../../engine/TriggerEngine.js';
import { isMobile } from '../../detect/Device.js';

const callHandler = async (context) => {
  const number = context.params[0];
  const config = context.config;

  if (!isMobile()) {
    throw new Error('Call trigger only available on mobile devices');
  }

  if (!number) {
    throw new Error('Phone number required');
  }

  const cleanNumber = String(number).replace(/[^\d+]/g, '');
  const telLink = `tel:${cleanNumber}`;

  try {
    window.location.href = telLink;
    return { called: true, number: cleanNumber };
  } catch (error) {
    throw new Error(`Call failed: ${error.message}`);
  }
};

engine.register('call', callHandler);

const call = (number, options = {}) => {
  const config = isObject(options) ? options : {};
  if (isString(number)) {
    return engine.execute('call', number, config);
  }
  return engine.execute('call', number, config);
};

export { call };
export default call;