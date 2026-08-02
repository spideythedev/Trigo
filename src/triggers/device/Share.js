import { isObject, isString } from '../../utils/type.js';
import engine from '../../engine/TriggerEngine.js';
import { isMobile } from '../../detect/Device.js';

const shareHandler = async (context) => {
  const action = context.params[0] || 'url';
  const config = context.config;

  if (!navigator.share && !config.forceFallback) {
    throw new Error('Web Share API not supported');
  }

  switch (action) {
    case 'url':
      return await shareUrl(config);
    case 'text':
      return await shareText(config);
    case 'image':
      return await shareImage(config);
    case 'file':
      return await shareFile(config);
    default:
      return await shareUrl(config);
  }
};

const shareUrl = async (config = {}) => {
  const shareData = {
    title: config.title || document.title,
    text: config.text || '',
    url: config.url || window.location.href
  };

  return await executeShare(shareData, config);
};

const shareText = async (config = {}) => {
  const shareData = {
    title: config.title || '',
    text: config.text || config.data || ''
  };

  return await executeShare(shareData, config);
};

const shareImage = async (config = {}) => {
  try {
    let files = [];

    if (config.image) {
      const response = await fetch(config.image);
      const blob = await response.blob();
      const ext = blob.type.split('/')[1] || 'png';
      const file = new File([blob], config.filename || `image.${ext}`, {
        type: blob.type
      });
      files.push(file);
    }

    if (config.files) {
      files = [...files, ...config.files];
    }

    const shareData = {
      title: config.title || '',
      text: config.text || '',
      files
    };

    return await executeShare(shareData, config);
  } catch (error) {
    throw new Error(`Image share failed: ${error.message}`);
  }
};

const shareFile = async (config = {}) => {
  try {
    let files = [];

    if (config.url) {
      const response = await fetch(config.url);
      const blob = await response.blob();
      const file = new File([blob], config.filename || 'file', {
        type: config.type || blob.type
      });
      files.push(file);
    }

    if (config.files) {
      files = [...files, ...config.files];
    }

    const shareData = {
      title: config.title || '',
      text: config.text || '',
      files
    };

    return await executeShare(shareData, config);
  } catch (error) {
    throw new Error(`File share failed: ${error.message}`);
  }
};

const executeShare = async (shareData, config = {}) => {
  try {
    if (navigator.share) {
      await navigator.share(shareData);
      if (config.onShare) config.onShare(shareData);
      return { shared: true, method: 'native', data: shareData };
    }

    if (navigator.clipboard && config.fallback === 'clipboard') {
      const text = shareData.url || shareData.text || '';
      await navigator.clipboard.writeText(text);
      return { shared: false, method: 'clipboard', text };
    }

    if (config.fallback === 'copy') {
      const text = shareData.url || shareData.text || '';
      return fallbackCopy(text);
    }

    throw new Error('Share not available');
  } catch (error) {
    if (error.name === 'AbortError') {
      return { shared: false, reason: 'cancelled' };
    }
    throw error;
  }
};

const fallbackCopy = (text) => {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();

  try {
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return { shared: false, method: 'fallback-copy', text };
  } catch (error) {
    document.body.removeChild(textarea);
    return { shared: false, error: 'Copy fallback failed' };
  }
};

engine.register('share', shareHandler);

const share = {
  url: (options = {}) => {
    const config = isObject(options) ? options : {};
    if (isString(options)) config.url = options;
    return engine.execute('share', 'url', config);
  },
  text: (text, options = {}) => {
    const config = isObject(options) ? options : {};
    if (isString(text)) config.text = text;
    return engine.execute('share', 'text', config);
  },
  image: (image, options = {}) => {
    const config = isObject(options) ? options : {};
    if (isString(image)) config.image = image;
    return engine.execute('share', 'image', config);
  },
  file: (file, options = {}) => {
    const config = isObject(options) ? options : {};
    if (file) config.url = file;
    return engine.execute('share', 'file', config);
  }
};

export { share };
export default share;