import { isObject, isString } from '../../utils/type.js';
import engine from '../../engine/TriggerEngine.js';

const clipboardHandler = async (context) => {
  const action = context.params[0] || 'copy';
  const config = context.config;

  if (!navigator.clipboard) {
    throw new Error('Clipboard API not supported');
  }

  switch (action) {
    case 'copy':
      return await copy(config);
    case 'paste':
      return await paste(config);
    case 'clear':
      return await clear(config);
    default:
      return await copy(config);
  }
};

const copy = async (config = {}) => {
  const text = config.text || config.data || '';
  const html = config.html || null;
  const image = config.image || null;

  try {
    if (html || image) {
      const items = [];
      
      if (html) {
        items.push(new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([text], { type: 'text/plain' })
        }));
      } else if (image) {
        const response = await fetch(image);
        const blob = await response.blob();
        items.push(new ClipboardItem({
          [blob.type]: blob
        }));
      } else {
        items.push(new ClipboardItem({
          'text/plain': new Blob([text], { type: 'text/plain' })
        }));
      }

      await navigator.clipboard.write(items);
    } else {
      await navigator.clipboard.writeText(String(text));
    }

    if (config.onCopy) {
      config.onCopy({ text, html, image });
    }

    return { copied: true, text: text.substring(0, 100) };
  } catch (error) {
    if (config.fallback === 'prompt') {
      return fallbackCopy(text);
    }
    throw new Error(`Clipboard copy failed: ${error.message}`);
  }
};

const paste = async (config = {}) => {
  try {
    if (config.html || config.image) {
      const items = await navigator.clipboard.read();
      const result = { items: [] };

      for (const item of items) {
        for (const type of item.types) {
          const blob = await item.getType(type);
          const entry = { type };

          if (type.startsWith('text/')) {
            entry.text = await blob.text();
          } else if (type.startsWith('image/')) {
            entry.url = URL.createObjectURL(blob);
            entry.blob = blob;
          }
          result.items.push(entry);
        }
      }

      if (config.onPaste) {
        config.onPaste(result);
      }

      return result;
    } else {
      const text = await navigator.clipboard.readText();
      
      if (config.onPaste) {
        config.onPaste({ text });
      }

      return { text };
    }
  } catch (error) {
    throw new Error(`Clipboard paste failed: ${error.message}`);
  }
};

const clear = async (config = {}) => {
  try {
    await navigator.clipboard.writeText('');
    
    if (config.onClear) {
      config.onClear();
    }

    return { cleared: true };
  } catch (error) {
    throw new Error(`Clipboard clear failed: ${error.message}`);
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
    return { copied: true, text: text.substring(0, 100), method: 'fallback' };
  } catch (error) {
    document.body.removeChild(textarea);
    return { copied: false, error: 'Fallback copy failed' };
  }
};

engine.register('clipboard', clipboardHandler);

const clipboard = {
  copy: (text, options = {}) => {
    const config = isObject(options) ? options : {};
    if (isString(text)) config.text = text;
    return engine.execute('clipboard', 'copy', config);
  },
  paste: (options = {}) => engine.execute('clipboard', 'paste', isObject(options) ? options : {}),
  clear: (options = {}) => engine.execute('clipboard', 'clear', isObject(options) ? options : {})
};

export { clipboard };
export default clipboard;