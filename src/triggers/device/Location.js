import { isObject, isFunction } from '../../utils/type.js';
import engine from '../../engine/TriggerEngine.js';
import permissionEngine from '../../engine/PermissionEngine.js';

let watchId = null;

const locationHandler = async (context) => {
  const action = context.params[0] || 'get';
  const config = context.config;

  const permission = await permissionEngine.request('location', {
    highAccuracy: config.highAccuracy || false,
    timeout: config.timeout || 10000,
    maximumAge: config.maximumAge || 0
  });

  if (permission !== 'granted') {
    throw new Error('Location permission denied');
  }

  switch (action) {
    case 'get':
      return await getPosition(config);
    case 'watch':
      return await watchPosition(config);
    case 'stopWatch':
      return stopWatching();
    case 'distance':
      return calculateDistance(config);
    case 'speed':
      return await getSpeed(config);
    case 'heading':
      return await getHeading(config);
    default:
      return await getPosition(config);
  }
};

const getPosition = (config = {}) => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const result = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: position.coords.altitude,
          accuracy: position.coords.accuracy,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp
        };

        if (config.onPosition) config.onPosition(result);
        resolve(result);
      },
      (error) => {
        if (config.fallback === 'ip' && config.ipLookup) {
          resolve(config.ipLookup());
        } else {
          reject(error);
        }
      },
      {
        enableHighAccuracy: config.highAccuracy || false,
        timeout: config.timeout || 10000,
        maximumAge: config.maximumAge || 0
      }
    );
  });
};

const watchPosition = (config = {}) => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    stopWatching();

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        const result = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: position.coords.altitude,
          accuracy: position.coords.accuracy,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp
        };

        if (config.onPosition) config.onPosition(result);
        if (config.once) {
          stopWatching();
          resolve(result);
        }
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: config.highAccuracy || false,
        timeout: config.timeout || 10000,
        maximumAge: config.maximumAge || 0
      }
    );

    resolve({ watching: true, watchId });
  });
};

const stopWatching = () => {
  if (watchId !== null && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  return { watching: false };
};

const calculateDistance = (config = {}) => {
  const lat1 = config.lat1 || config.from?.latitude || 0;
  const lon1 = config.lon1 || config.from?.longitude || 0;
  const lat2 = config.lat2 || config.to?.latitude || 0;
  const lon2 = config.lon2 || config.to?.longitude || 0;
  const unit = config.unit || 'km';

  const R = unit === 'mi' ? 3958.8 : 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return {
    distance: Math.round(distance * 100) / 100,
    unit,
    from: { latitude: lat1, longitude: lon1 },
    to: { latitude: lat2, longitude: lon2 }
  };
};

const getSpeed = async (config = {}) => {
  const pos1 = await getPosition(config);
  const time1 = Date.now();

  await new Promise(resolve => setTimeout(resolve, config.sampleTime || 1000));

  const pos2 = await getPosition(config);
  const time2 = Date.now();

  if (pos1.speed !== null && pos2.speed !== null) {
    const avgSpeed = (pos1.speed + pos2.speed) / 2;
    return {
      speed: avgSpeed,
      unit: 'm/s',
      speedKmh: Math.round(avgSpeed * 3.6 * 100) / 100,
      speedMph: Math.round(avgSpeed * 2.23694 * 100) / 100
    };
  }

  const distance = calculateDistance({
    lat1: pos1.latitude,
    lon1: pos1.longitude,
    lat2: pos2.latitude,
    lon2: pos2.longitude,
    unit: 'km'
  });

  const timeHours = (time2 - time1) / 3600000;
  const speedKmh = distance.distance / timeHours;

  return {
    speed: speedKmh / 3.6,
    unit: 'm/s',
    speedKmh: Math.round(speedKmh * 100) / 100,
    speedMph: Math.round(speedKmh * 0.621371 * 100) / 100,
    calculated: true
  };
};

const getHeading = async (config = {}) => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    let headingWatchId;

    const handler = (position) => {
      if (position.coords.heading !== null) {
        navigator.geolocation.clearWatch(headingWatchId);
        resolve({
          heading: position.coords.heading,
          accuracy: position.coords.headingAccuracy,
          speed: position.coords.speed
        });
      }
    };

    headingWatchId = navigator.geolocation.watchPosition(
      handler,
      reject,
      { enableHighAccuracy: true }
    );

    setTimeout(() => {
      navigator.geolocation.clearWatch(headingWatchId);
      resolve({
        heading: null,
        accuracy: null,
        speed: null,
        reason: 'timeout'
      });
    }, config.timeout || 5000);
  });
};

const toRad = (deg) => (deg * Math.PI) / 180;

const getIPLocation = async () => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return {
      latitude: data.latitude,
      longitude: data.longitude,
      city: data.city,
      region: data.region,
      country: data.country_name,
      ip: data.ip,
      source: 'ip'
    };
  } catch (e) {
    return null;
  }
};

engine.register('location', locationHandler);

const location = {
  get: (options = {}) => engine.execute('location', 'get', isObject(options) ? options : {}),
  watch: (options = {}) => engine.execute('location', 'watch', isObject(options) ? options : {}),
  stopWatch: () => engine.execute('location', 'stopWatch', {}),
  distance: (from, to, options = {}) => engine.execute('location', 'distance', {
    ...options,
    from,
    to
  }),
  speed: (options = {}) => engine.execute('location', 'speed', isObject(options) ? options : {}),
  heading: (options = {}) => engine.execute('location', 'heading', isObject(options) ? options : {}),
  ip: getIPLocation
};

export { location };
export default location;