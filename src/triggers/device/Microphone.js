import { isObject, isFunction } from '../../utils/type.js';
import engine from '../../engine/TriggerEngine.js';
import permissionEngine from '../../engine/PermissionEngine.js';

let micStream = null;
let audioContext = null;
let analyser = null;
let micRecorder = null;

const microphoneHandler = async (context) => {
  const action = context.params[0] || 'record';
  const config = context.config;

  const permission = await permissionEngine.request('microphone', {
    stopStream: false
  });

  if (permission !== 'granted') {
    throw new Error('Microphone permission denied');
  }

  switch (action) {
    case 'record':
      return await record(config);
    case 'stream':
      return await getStream(config);
    case 'level':
      return await getLevel(config);
    case 'stop':
      return stopMic();
    default:
      return await record(config);
  }
};

const record = async (config = {}) => {
  micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  
  micRecorder = new MediaRecorder(micStream, {
    mimeType: config.mimeType || 'audio/webm'
  });

  const chunks = [];

  return new Promise((resolve, reject) => {
    micRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };

    micRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: micRecorder.mimeType });
      const url = URL.createObjectURL(blob);

      if (config.onRecord) {
        config.onRecord({ blob, url, size: blob.size, duration: Date.now() - startTime });
      }

      resolve({ blob, url, size: blob.size, duration: Date.now() - startTime });
    };

    micRecorder.onerror = reject;
    micRecorder.start(config.timeslice || 1000);
    const startTime = Date.now();

    if (config.duration) {
      setTimeout(() => {
        if (micRecorder.state === 'recording') micRecorder.stop();
      }, config.duration);
    }

    if (config.returnControl) {
      config.returnControl(() => {
        if (micRecorder.state === 'recording') micRecorder.stop();
      });
    }
  });
};

const getStream = async (config = {}) => {
  micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

  if (config.onStream) {
    config.onStream(micStream);
  }

  if (config.audioElement) {
    config.audioElement.srcObject = micStream;
  }

  return {
    stream: micStream,
    tracks: micStream.getAudioTracks().map(t => ({
      label: t.label,
      settings: t.getSettings()
    }))
  };
};

const getLevel = async (config = {}) => {
  if (!micStream) {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  }

  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const source = audioContext.createMediaStreamSource(micStream);
  analyser = audioContext.createAnalyser();
  analyser.fftSize = config.fftSize || 256;
  source.connect(analyser);

  const dataArray = new Uint8Array(analyser.frequencyBinCount);

  if (config.continuous) {
    const loop = () => {
      if (!analyser) return;
      analyser.getByteTimeDomainData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += Math.abs(dataArray[i] - 128);
      }
      const level = sum / dataArray.length;
      if (config.onLevel) config.onLevel(level);
      requestAnimationFrame(loop);
    };
    loop();
  } else {
    analyser.getByteTimeDomainData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += Math.abs(dataArray[i] - 128);
    }
    const level = sum / dataArray.length;
    return { level, maxLevel: 128 };
  }
};

const stopMic = () => {
  if (micRecorder && micRecorder.state === 'recording') {
    micRecorder.stop();
  }
  if (micStream) {
    micStream.getTracks().forEach(track => track.stop());
    micStream = null;
  }
  if (audioContext) {
    audioContext.close();
    audioContext = null;
    analyser = null;
  }
  return { stopped: true };
};

engine.register('microphone', microphoneHandler);

const microphone = {
  record: (options = {}) => engine.execute('microphone', 'record', isObject(options) ? options : {}),
  stream: (options = {}) => engine.execute('microphone', 'stream', isObject(options) ? options : {}),
  level: (options = {}) => engine.execute('microphone', 'level', isObject(options) ? options : {}),
  stop: () => engine.execute('microphone', 'stop', {})
};

export { microphone };
export default microphone;