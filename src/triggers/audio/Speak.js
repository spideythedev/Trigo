import { isObject, isString, isNumber } from '../../utils/type.js';
import engine from '../../engine/TriggerEngine.js';

let currentUtterance = null;
let isSpeaking = false;
let isPaused = false;

const speakHandler = async (context) => {
  const action = context.params[0] || 'speak';
  const config = context.config;

  if (!('speechSynthesis' in window)) {
    throw new Error('Speech Synthesis not supported');
  }

  switch (action) {
    case 'speak':
      return await speak(config);
    case 'stop':
      return stopSpeaking();
    case 'pause':
      return pauseSpeaking();
    case 'resume':
      return resumeSpeaking();
    case 'voice':
      return getVoices(config);
    default:
      return await speak(config);
  }
};

const speak = (config = {}) => {
  return new Promise((resolve, reject) => {
    const text = config.text || config.message || '';
    
    if (!text) {
      reject(new Error('No text to speak'));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.rate = config.rate || 1;
    utterance.pitch = config.pitch || 1;
    utterance.volume = isNumber(config.volume) ? config.volume : 1;
    utterance.lang = config.lang || config.language || 'en-US';

    if (config.voice) {
      const voices = speechSynthesis.getVoices();
      const foundVoice = voices.find(v =>
        v.name === config.voice ||
        v.lang === config.voice ||
        v.name.includes(config.voice)
      );
      if (foundVoice) utterance.voice = foundVoice;
    }

    utterance.onstart = () => {
      isSpeaking = true;
      isPaused = false;
      currentUtterance = utterance;
      if (config.onStart) config.onStart();
    };

    utterance.onend = () => {
      isSpeaking = false;
      isPaused = false;
      currentUtterance = null;
      if (config.onEnd) config.onEnd();
      resolve({ spoken: true, text });
    };

    utterance.onpause = () => {
      isPaused = true;
      if (config.onPause) config.onPause();
    };

    utterance.onresume = () => {
      isPaused = false;
      if (config.onResume) config.onResume();
    };

    utterance.onerror = (event) => {
      isSpeaking = false;
      currentUtterance = null;
      if (config.onError) config.onError(event);
      reject(new Error(`Speech failed: ${event.error}`));
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  });
};

const stopSpeaking = () => {
  window.speechSynthesis.cancel();
  isSpeaking = false;
  isPaused = false;
  currentUtterance = null;
  return { stopped: true };
};

const pauseSpeaking = () => {
  window.speechSynthesis.pause();
  return { paused: true };
};

const resumeSpeaking = () => {
  window.speechSynthesis.resume();
  return { resumed: true };
};

const getVoices = (config = {}) => {
  const voices = window.speechSynthesis.getVoices();
  const filtered = config.lang
    ? voices.filter(v => v.lang.startsWith(config.lang))
    : voices;

  return filtered.map(v => ({
    name: v.name,
    lang: v.lang,
    default: v.default,
    localService: v.localService,
    voiceURI: v.voiceURI
  }));
};

engine.register('speak', speakHandler);

const speak = (text, options = {}) => {
  const config = isObject(options) ? options : {};
  if (isString(text)) config.text = text;
  return engine.execute('speak', 'speak', config);
};

speak.text = (text, options = {}) => {
  const config = isObject(options) ? options : {};
  if (isString(text)) config.text = text;
  return engine.execute('speak', 'speak', config);
};

speak.stop = () => engine.execute('speak', 'stop', {});
speak.pause = () => engine.execute('speak', 'pause', {});
speak.resume = () => engine.execute('speak', 'resume', {});
speak.voices = (lang) => engine.execute('speak', 'voice', { lang });
speak.rate = (rate, text, options = {}) => {
  const config = isObject(options) ? options : {};
  config.rate = rate;
  if (text) config.text = text;
  return engine.execute('speak', 'speak', config);
};
speak.pitch = (pitch, text, options = {}) => {
  const config = isObject(options) ? options : {};
  config.pitch = pitch;
  if (text) config.text = text;
  return engine.execute('speak', 'speak', config);
};
speak.volume = (volume, text, options = {}) => {
  const config = isObject(options) ? options : {};
  config.volume = volume;
  if (text) config.text = text;
  return engine.execute('speak', 'speak', config);
};
speak.isSpeaking = () => isSpeaking;
speak.isPaused = () => isPaused;

export { speak };
export default speak;