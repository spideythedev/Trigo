import { isFunction, isString } from '../utils/type.js';
import { permission as logPermission } from '../core/Logger.js';

const PERMISSION_MAP = {
  camera: 'camera',
  microphone: 'microphone',
  location: 'geolocation',
  notifications: 'notifications',
  midi: 'midi',
  push: 'push',
  bluetooth: 'bluetooth',
  nfc: 'nfc',
  usb: 'usb',
  clipboard: 'clipboard-read',
  fullscreen: 'fullscreen',
  persistentStorage: 'persistent-storage',
  accelerometer: 'accelerometer',
  gyroscope: 'gyroscope',
  magnetometer: 'magnetometer',
  ambientLightSensor: 'ambient-light-sensor',
  proximity: 'proximity'
};

class PermissionEngine {
  constructor() {
    this.permissionCache = new Map();
    this.defaultStrategy = 'auto';
  }

  async check(permissionName) {
    const apiName = PERMISSION_MAP[permissionName] || permissionName;

    if (this.permissionCache.has(apiName)) {
      return this.permissionCache.get(apiName);
    }

    if (!navigator.permissions) {
      return 'unknown';
    }

    try {
      const result = await navigator.permissions.query({ name: apiName });
      const state = result.state;
      this.permissionCache.set(apiName, state);

      result.addEventListener('change', () => {
        this.permissionCache.set(apiName, result.state);
        logPermission(apiName, result.state);
      });

      return state;
    } catch (e) {
      return 'unsupported';
    }
  }

  async request(permissionName, options = {}) {
    const apiName = PERMISSION_MAP[permissionName] || permissionName;
    const strategy = options.strategy || this.defaultStrategy;

    const currentState = await this.check(apiName);
    logPermission(apiName, `current: ${currentState}`);

    if (currentState === 'granted') {
      return 'granted';
    }

    if (currentState === 'denied' && !options.forceRequest) {
      if (options.onDenied) {
        options.onDenied(apiName);
      }
      return 'denied';
    }

    if (strategy === 'manual' && !options.forceRequest) {
      return currentState;
    }

    if (strategy === 'lazy' && !options.immediate) {
      return currentState;
    }

    switch (apiName) {
      case 'camera':
        return await this.requestCamera(options);
      case 'microphone':
        return await this.requestMicrophone(options);
      case 'camera,microphone':
        return await this.requestCameraAndMicrophone(options);
      case 'location':
        return await this.requestLocation(options);
      case 'notifications':
        return await this.requestNotifications(options);
      case 'midi':
        return await this.requestMIDI(options);
      case 'bluetooth':
        return await this.requestBluetooth(options);
      case 'clipboard-read':
      case 'clipboard':
        return await this.requestClipboard(options);
      default:
        return currentState;
    }
  }

  async requestCamera(options = {}) {
    try {
      const constraints = {
        video: options.video || { facingMode: options.facing || 'environment' }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (options.stopStream !== false) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (options.onStream) {
        options.onStream(stream);
      }
      this.permissionCache.set('camera', 'granted');
      logPermission('camera', 'granted');
      return 'granted';
    } catch (e) {
      this.permissionCache.set('camera', 'denied');
      logPermission('camera', `denied: ${e.message}`);
      return 'denied';
    }
  }

  async requestMicrophone(options = {}) {
    try {
      const constraints = {
        audio: options.audio || true
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (options.stopStream !== false) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (options.onStream) {
        options.onStream(stream);
      }
      this.permissionCache.set('microphone', 'granted');
      logPermission('microphone', 'granted');
      return 'granted';
    } catch (e) {
      this.permissionCache.set('microphone', 'denied');
      logPermission('microphone', `denied: ${e.message}`);
      return 'denied';
    }
  }

  async requestCameraAndMicrophone(options = {}) {
    try {
      const constraints = {
        video: options.video || { facingMode: options.facing || 'environment' },
        audio: options.audio || true
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (options.stopStream !== false) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (options.onStream) {
        options.onStream(stream);
      }
      this.permissionCache.set('camera', 'granted');
      this.permissionCache.set('microphone', 'granted');
      logPermission('camera,microphone', 'granted');
      return 'granted';
    } catch (e) {
      this.permissionCache.set('camera', 'denied');
      this.permissionCache.set('microphone', 'denied');
      logPermission('camera,microphone', `denied: ${e.message}`);
      return 'denied';
    }
  }

  async requestLocation(options = {}) {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve('unsupported');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.permissionCache.set('geolocation', 'granted');
          logPermission('geolocation', 'granted');
          if (options.onPosition) options.onPosition(position);
          resolve('granted');
        },
        (error) => {
          this.permissionCache.set('geolocation', 'denied');
          logPermission('geolocation', `denied: ${error.message}`);
          resolve('denied');
        },
        {
          timeout: options.timeout || 10000,
          maximumAge: options.maximumAge || 0,
          enableHighAccuracy: options.highAccuracy || false
        }
      );
    });
  }

  async requestNotifications(options = {}) {
    if (!('Notification' in window)) {
      return 'unsupported';
    }

    if (Notification.permission === 'granted') {
      this.permissionCache.set('notifications', 'granted');
      return 'granted';
    }

    try {
      const result = await Notification.requestPermission();
      this.permissionCache.set('notifications', result);
      logPermission('notifications', result);
      return result;
    } catch (e) {
      this.permissionCache.set('notifications', 'denied');
      logPermission('notifications', `denied: ${e.message}`);
      return 'denied';
    }
  }

  async requestMIDI(options = {}) {
    try {
      const access = await navigator.requestMIDIAccess();
      if (options.onAccess) options.onAccess(access);
      this.permissionCache.set('midi', 'granted');
      logPermission('midi', 'granted');
      return 'granted';
    } catch (e) {
      this.permissionCache.set('midi', 'denied');
      logPermission('midi', `denied: ${e.message}`);
      return 'denied';
    }
  }

  async requestBluetooth(options = {}) {
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: options.acceptAllDevices || true,
        filters: options.filters || [],
        optionalServices: options.services || []
      });
      if (options.onDevice) options.onDevice(device);
      this.permissionCache.set('bluetooth', 'granted');
      logPermission('bluetooth', 'granted');
      return 'granted';
    } catch (e) {
      this.permissionCache.set('bluetooth', 'denied');
      logPermission('bluetooth', `denied: ${e.message}`);
      return 'denied';
    }
  }

  async requestClipboard(options = {}) {
    try {
      if (options.write) {
        await navigator.clipboard.writeText(options.text || '');
      } else {
        await navigator.clipboard.readText();
      }
      this.permissionCache.set('clipboard-read', 'granted');
      logPermission('clipboard', 'granted');
      return 'granted';
    } catch (e) {
      this.permissionCache.set('clipboard-read', 'denied');
      logPermission('clipboard', `denied: ${e.message}`);
      return 'denied';
    }
  }

  async requestAll(permissions, options = {}) {
    const results = {};
    const sequential = options.sequential !== false;

    if (sequential) {
      for (const perm of permissions) {
        results[perm] = await this.request(perm, options);
      }
    } else {
      const promises = permissions.map(perm => this.request(perm, options));
      const outcomes = await Promise.allSettled(promises);
      permissions.forEach((perm, index) => {
        results[perm] = outcomes[index].status === 'fulfilled' 
          ? outcomes[index].value 
          : 'error';
      });
    }

    return results;
  }

  isGranted(permissionName) {
    const apiName = PERMISSION_MAP[permissionName] || permissionName;
    return this.permissionCache.get(apiName) === 'granted';
  }

  isDenied(permissionName) {
    const apiName = PERMISSION_MAP[permissionName] || permissionName;
    return this.permissionCache.get(apiName) === 'denied';
  }

  clearCache(permissionName) {
    if (permissionName) {
      const apiName = PERMISSION_MAP[permissionName] || permissionName;
      this.permissionCache.delete(apiName);
    } else {
      this.permissionCache.clear();
    }
  }

  setStrategy(strategy) {
    this.defaultStrategy = strategy;
  }
}

const permissionEngine = new PermissionEngine();

export { PermissionEngine, permissionEngine, PERMISSION_MAP };
export default permissionEngine;