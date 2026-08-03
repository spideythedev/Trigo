import { isObject } from '../../utils/type.js';
import engine from '../../engine/TriggerEngine.js';
import { isPWA } from '../../detect/Device.js';

let deferredPrompt = null;

const installHandler = async (context) => {
  const action = context.params[0] || 'prompt';
  const config = context.config;

  switch (action) {
    case 'prompt':
      return await promptInstall(config);
    case 'check':
      return checkInstalled(config);
    default:
      return await promptInstall(config);
  }
};

const promptInstall = async (config = {}) => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    deferredPrompt = null;
    
    if (config.onChoice) {
      config.onChoice(result);
    }

    return {
      installed: result.outcome === 'accepted',
      outcome: result.outcome
    };
  }

  if (isPWA()) {
    return { installed: true, already: true };
  }

  throw new Error('Install prompt not available');
};

const checkInstalled = (config = {}) => {
  const standalone = isPWA();

  return {
    installed: standalone,
    standalone
  };
};

const listenForInstall = () => {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
  });
};

if (typeof window !== 'undefined') {
  listenForInstall();
}

engine.register('install', installHandler);

const install = {
  prompt: (options = {}) => engine.execute('install', 'prompt', isObject(options) ? options : {}),
  check: (options = {}) => engine.execute('install', 'check', isObject(options) ? options : {}),
  get deferredPrompt() {
    return deferredPrompt;
  }
};

export { install };
export default install;