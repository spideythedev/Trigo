import { isObject, isFunction } from '../../utils/type.js';
import engine from '../../engine/TriggerEngine.js';
import permissionEngine from '../../engine/PermissionEngine.js';

let currentStream = null;
let currentFacing = 'environment';

const cameraHandler = async (context) => {
  const action = context.params[0] || 'open';
  const config = context.config;

  const permission = await permissionEngine.request('camera', {
    facing: config.facing || 'environment',
    stopStream: false
  });

  if (permission !== 'granted') {
    throw new Error('Camera permission denied');
  }

  switch (action) {
    case 'open':
      return await openCamera(config);
    case 'capture':
      return await capture(config);
    case 'record':
      return await record(config);
    case 'switch':
      return await switchCamera(config);
    case 'torch':
      return await torch(config);
    case 'zoom':
      return await zoom(config);
    case 'focus':
      return await focus(config);
    case 'scan':
      return await scan(config);
    case 'close':
      return closeCamera();
    default:
      return await openCamera(config);
  }
};

const openCamera = async (config = {}) => {
  const facing = config.facing || currentFacing;
  const videoElement = config.video || config.target || null;

  const constraints = {
    video: {
      facingMode: facing,
      width: config.width || { ideal: 1280 },
      height: config.height || { ideal: 720 },
      zoom: config.zoom || false,
      torch: config.torch || false
    },
    audio: config.audio || false
  };

  currentStream = await navigator.mediaDevices.getUserMedia(constraints);
  currentFacing = facing;

  if (videoElement && videoElement instanceof HTMLVideoElement) {
    videoElement.srcObject = currentStream;
    await videoElement.play();
  }

  if (config.onStream) {
    config.onStream(currentStream);
  }

  return {
    stream: currentStream,
    facing: currentFacing,
    tracks: currentStream.getTracks().map(t => ({
      kind: t.kind,
      label: t.label,
      settings: t.getSettings()
    }))
  };
};

const capture = async (config = {}) => {
  if (!currentStream) {
    await openCamera(config);
  }

  const videoTrack = currentStream.getVideoTracks()[0];
  const imageCapture = new ImageCapture(videoTrack);

  const blob = await imageCapture.takePhoto({
    imageWidth: config.width,
    imageHeight: config.height
  });

  const url = URL.createObjectURL(blob);

  if (config.onCapture) {
    config.onCapture({ blob, url });
  }

  if (config.download) {
    const a = document.createElement('a');
    a.href = url;
    a.download = config.filename || `capture_${Date.now()}.jpg`;
    a.click();
  }

  return { blob, url, size: blob.size };
};

const record = async (config = {}) => {
  if (!currentStream) {
    await openCamera({ ...config, audio: true });
  }

  const mediaRecorder = new MediaRecorder(currentStream, {
    mimeType: config.mimeType || 'video/webm'
  });

  const chunks = [];

  return new Promise((resolve, reject) => {
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
      const url = URL.createObjectURL(blob);

      if (config.onRecord) {
        config.onRecord({ blob, url, duration: Date.now() - startTime });
      }

      resolve({ blob, url, size: blob.size, duration: Date.now() - startTime });
    };

    mediaRecorder.onerror = reject;

    mediaRecorder.start(config.timeslice || 1000);
    const startTime = Date.now();

    if (config.duration) {
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, config.duration);
    }

    const stopRecording = () => {
      if (mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
    };

    if (config.returnControl) {
      config.returnControl(stopRecording);
    }
  });
};

const switchCamera = async (config = {}) => {
  const newFacing = currentFacing === 'environment' ? 'user' : 'environment';
  closeCamera();
  return await openCamera({ ...config, facing: newFacing });
};

const torch = async (config = {}) => {
  if (!currentStream) {
    await openCamera({ ...config, facing: 'environment' });
  }

  const videoTrack = currentStream.getVideoTracks()[0];
  const capabilities = videoTrack.getCapabilities();

  if (!capabilities.torch) {
    throw new Error('Torch not supported on this camera');
  }

  const enable = config.enable !== false;
  await videoTrack.applyConstraints({
    advanced: [{ torch: enable }]
  });

  return { torch: enable };
};

const zoom = async (config = {}) => {
  if (!currentStream) {
    await openCamera(config);
  }

  const videoTrack = currentStream.getVideoTracks()[0];
  const capabilities = videoTrack.getCapabilities();

  if (!capabilities.zoom) {
    throw new Error('Zoom not supported on this camera');
  }

  const zoomLevel = Math.min(
    Math.max(config.level || 1, capabilities.zoom.min),
    capabilities.zoom.max
  );

  await videoTrack.applyConstraints({
    advanced: [{ zoom: zoomLevel }]
  });

  return { zoom: zoomLevel, min: capabilities.zoom.min, max: capabilities.zoom.max };
};

const focus = async (config = {}) => {
  if (!currentStream) {
    await openCamera(config);
  }

  const videoTrack = currentStream.getVideoTracks()[0];
  const capabilities = videoTrack.getCapabilities();

  if (config.mode === 'auto') {
    await videoTrack.applyConstraints({
      advanced: [{ focusMode: 'continuous' }]
    });
  } else if (config.distance) {
    await videoTrack.applyConstraints({
      advanced: [{ focusMode: 'manual', focusDistance: config.distance }]
    });
  }

  const settings = videoTrack.getSettings();
  return { focusMode: settings.focusMode, focusDistance: settings.focusDistance };
};

const scan = async (config = {}) => {
  if (!currentStream) {
    await openCamera(config);
  }

  const videoTrack = currentStream.getVideoTracks()[0];

  if ('BarcodeDetector' in window) {
    const barcodeDetector = new BarcodeDetector({
      formats: config.formats || ['qr_code', 'ean_13', 'ean_8', 'code_128']
    });

    return new Promise((resolve) => {
      const scanFrame = async () => {
        if (!currentStream) return;

        const imageCapture = new ImageCapture(videoTrack);
        const bitmap = await imageCapture.grabFrame();
        const barcodes = await barcodeDetector.detect(bitmap);

        if (barcodes.length > 0) {
          if (config.onScan) config.onScan(barcodes);
          if (config.continuous !== true) {
            resolve({ barcodes, rawValue: barcodes[0].rawValue });
            return;
          }
        }

        if (config.continuous === true) {
          requestAnimationFrame(scanFrame);
        }
      };

      scanFrame();
    });
  }

  throw new Error('BarcodeDetector not supported');
};

const closeCamera = () => {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
    currentStream = null;
  }
  return { closed: true };
};

engine.register('camera', cameraHandler);

const camera = {
  open: (options = {}) => engine.execute('camera', 'open', isObject(options) ? options : {}),
  capture: (options = {}) => engine.execute('camera', 'capture', isObject(options) ? options : {}),
  record: (options = {}) => engine.execute('camera', 'record', isObject(options) ? options : {}),
  switch: (options = {}) => engine.execute('camera', 'switch', isObject(options) ? options : {}),
  torch: (options = {}) => engine.execute('camera', 'torch', isObject(options) ? options : {}),
  zoom: (options = {}) => engine.execute('camera', 'zoom', isObject(options) ? options : {}),
  focus: (options = {}) => engine.execute('camera', 'focus', isObject(options) ? options : {}),
  scan: (options = {}) => engine.execute('camera', 'scan', isObject(options) ? options : {}),
  close: () => engine.execute('camera', 'close', {})
};

export { camera };
export default camera;