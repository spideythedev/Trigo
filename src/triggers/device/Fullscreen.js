import { isObject, isElement, isString } from '../../utils/type.js';
import engine from '../../engine/TriggerEngine.js';

const fullscreenHandler = async (context) => {
  const action = context.params[0] || 'enter';
  const config = context.config;
  const element = config.element || config.target || document.documentElement;

  switch (action) {
    case 'enter':
      return enter(element, config);
    case 'exit':
      return exit(config);
    case 'toggle':
      return toggle(element, config);
    default:
      return enter(element, config);
  }
};

const enter = async (element, config = {}) => {
  const el = resolveElement(element);

  if (!el) {
    throw new Error('No element provided for fullscreen');
  }

  try {
    if (el.requestFullscreen) {
      await el.requestFullscreen(config.options);
    } else if (el.webkitRequestFullscreen) {
      await el.webkitRequestFullscreen(config.options);
    } else if (el.mozRequestFullScreen) {
      await el.mozRequestFullScreen(config.options);
    } else if (el.msRequestFullscreen) {
      await el.msRequestFullscreen(config.options);
    } else {
      throw new Error('Fullscreen API not supported');
    }

    if (config.onEnter) config.onEnter();

    return {
      fullscreen: true,
      element: el
    };
  } catch (error) {
    throw new Error(`Fullscreen enter failed: ${error.message}`);
  }
};

const exit = async (config = {}) => {
  try {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }

    if (config.onExit) config.onExit();

    return { fullscreen: false };
  } catch (error) {
    throw new Error(`Fullscreen exit failed: ${error.message}`);
  }
};

const toggle = async (element, config = {}) => {
  const isFullscreen = getFullscreenElement();
  
  if (isFullscreen) {
    return await exit(config);
  } else {
    return await enter(element, config);
  }
};

const getFullscreenElement = () => {
  return (
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );
};

const isFullscreen = () => {
  return !!getFullscreenElement();
};

const onChange = (callback) => {
  const handler = () => {
    const element = getFullscreenElement();
    callback({ fullscreen: !!element, element });
  };

  document.addEventListener('fullscreenchange', handler);
  document.addEventListener('webkitfullscreenchange', handler);
  document.addEventListener('mozfullscreenchange', handler);
  document.addEventListener('MSFullscreenChange', handler);

  return () => {
    document.removeEventListener('fullscreenchange', handler);
    document.removeEventListener('webkitfullscreenchange', handler);
    document.removeEventListener('mozfullscreenchange', handler);
    document.removeEventListener('MSFullscreenChange', handler);
  };
};

const resolveElement = (element) => {
  if (isElement(element)) return element;
  if (isString(element)) return document.querySelector(element);
  return document.documentElement;
};

engine.register('fullscreen', fullscreenHandler);

const fullscreen = {
  enter: (element, options = {}) => {
    const config = isObject(options) ? options : {};
    if (isElement(element) || isString(element)) config.element = element;
    return engine.execute('fullscreen', 'enter', config);
  },
  exit: (options = {}) => engine.execute('fullscreen', 'exit', isObject(options) ? options : {}),
  toggle: (element, options = {}) => {
    const config = isObject(options) ? options : {};
    if (isElement(element) || isString(element)) config.element = element;
    return engine.execute('fullscreen', 'toggle', config);
  },
  isFullscreen,
  getElement: getFullscreenElement,
  onChange
};

export { fullscreen };
export default fullscreen;