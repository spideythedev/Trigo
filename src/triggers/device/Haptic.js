import { isObject } from '../../utils/type.js';
import engine from '../../engine/TriggerEngine.js';
import { isIOS } from '../../detect/Device.js';

const haptic = {};

const checkHapticSupport = () => {
  return isIOS() && typeof navigator !== 'undefined' && 'userActivation' in navigator;
};

const hapticHandler = (context) => {
  const style = context.params[0] || 'medium';
  const config = context.config;

  if (!checkHapticSupport()) {
    throw new Error('Haptic feedback not supported on this device');
  }

  const styles = {
    light: { intensity: 0.3, sharpness: 0.3 },
    medium: { intensity: 0.5, sharpness: 0.5 },
    heavy: { intensity: 1, sharpness: 1 },
    rigid: { intensity: 0.5, sharpness: 1 },
    soft: { intensity: 0.5, sharpness: 0.3 },
    selection: { intensity: 0.3, sharpness: 0.3 },
    success: { intensity: 0.5, sharpness: 0.5 },
    warning: { intensity: 0.7, sharpness: 0.7 },
    error: { intensity: 1, sharpness: 1 }
  };

  const hapticStyle = styles[style] || styles.medium;

  try {
    if (window.navigator && window.navigator.vibrate) {
      const intensity = hapticStyle.intensity;
      const duration = Math.floor(intensity * 50);
      window.navigator.vibrate(duration);
    }
  } catch (e) {}

  return {
    style,
    intensity: hapticStyle.intensity,
    sharpness: hapticStyle.sharpness
  };
};

engine.register('haptic', hapticHandler);

haptic.light = (options = {}) => engine.execute('haptic', 'light', isObject(options) ? options : {});
haptic.medium = (options = {}) => engine.execute('haptic', 'medium', isObject(options) ? options : {});
haptic.heavy = (options = {}) => engine.execute('haptic', 'heavy', isObject(options) ? options : {});
haptic.rigid = (options = {}) => engine.execute('haptic', 'rigid', isObject(options) ? options : {});
haptic.soft = (options = {}) => engine.execute('haptic', 'soft', isObject(options) ? options : {});
haptic.selection = (options = {}) => engine.execute('haptic', 'selection', isObject(options) ? options : {});
haptic.success = (options = {}) => engine.execute('haptic', 'success', isObject(options) ? options : {});
haptic.warning = (options = {}) => engine.execute('haptic', 'warning', isObject(options) ? options : {});
haptic.error = (options = {}) => engine.execute('haptic', 'error', isObject(options) ? options : {});
haptic.custom = (intensity, sharpness, options = {}) => {
  const config = isObject(options) ? options : {};
  config.intensity = intensity;
  config.sharpness = sharpness;
  return engine.execute('haptic', 'custom', config);
};

export { haptic };
export default haptic;