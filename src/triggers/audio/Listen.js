import { isObject, isFunction } from '../../utils/type.js';
import engine from '../../engine/TriggerEngine.js';
import permissionEngine from '../../engine/PermissionEngine.js';

let recognition = null;
let isListening = false;

const listenHandler = async (context) => {
  const action = context.params[0] || 'start';
  const config = context.config;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    throw new Error('Speech Recognition not supported');
  }

  switch (action) {
    case 'start':
      return await startListening(config);
    case 'stop':
      return stopListening();
    default:
      return await startListening(config);
  }
};

const startListening = (config = {}) => {
  return new Promise(async (resolve, reject) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();

    recognition.continuous = config.continuous !== false;
    recognition.interimResults = config.interimResults !== false;
    recognition.lang = config.lang || config.language || 'en-US';
    recognition.maxAlternatives = config.maxAlternatives || 1;

    recognition.onstart = () => {
      isListening = true;
      if (config.onStart) config.onStart();
    };

    recognition.onresult = (event) => {
      const results = [];
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        results.push({
          transcript: result[0].transcript,
          confidence: result[0].confidence,
          isFinal: result.isFinal,
          alternatives: Array.from(result).map(alt => ({
            transcript: alt.transcript,
            confidence: alt.confidence
          }))
        });
      }

      if (config.onResult) config.onResult(results);

      if (!config.continuous && results.some(r => r.isFinal)) {
        stopListening();
        resolve({
          text: results.map(r => r.transcript).join(' '),
          results,
          final: true
        });
      }
    };

    recognition.onerror = (event) => {
      if (config.onError) config.onError(event);
      reject(new Error(`Speech recognition error: ${event.error}`));
    };

    recognition.onend = () => {
      isListening = false;
      if (config.onEnd) config.onEnd();
      
      if (config.continuous && recognition) {
        resolve({ continuous: true, stopped: true });
      }
    };

    try {
      recognition.start();
    } catch (error) {
      reject(error);
    }
  });
};

const stopListening = () => {
  if (recognition) {
    recognition.stop();
    recognition = null;
    isListening = false;
  }
  return { stopped: true };
};

engine.register('listen', listenHandler);

const listen = (options = {}) => {
  return engine.execute('listen', 'start', isObject(options) ? options : {});
};

listen.start = (options = {}) => {
  return engine.execute('listen', 'start', isObject(options) ? options : {});
};

listen.stop = () => {
  return engine.execute('listen', 'stop', {});
};

listen.continuous = (options = {}) => {
  const config = isObject(options) ? options : {};
  config.continuous = true;
  return engine.execute('listen', 'start', config);
};

listen.language = (lang, options = {}) => {
  const config = isObject(options) ? options : {};
  config.lang = lang;
  return engine.execute('listen', 'start', config);
};

listen.isListening = () => isListening;

export { listen };
export default listen;