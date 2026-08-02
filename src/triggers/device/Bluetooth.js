import { isObject, isFunction } from '../../utils/type.js';
import engine from '../../engine/TriggerEngine.js';

let bluetoothDevice = null;
let bluetoothServer = null;
let bluetoothService = null;
let bluetoothCharacteristic = null;

const bluetoothHandler = async (context) => {
  const action = context.params[0] || 'scan';
  const config = context.config;

  if (!('bluetooth' in navigator)) {
    throw new Error('Web Bluetooth not supported in this browser');
  }

  switch (action) {
    case 'scan':
      return await scan(config);
    case 'connect':
      return await connect(config);
    case 'disconnect':
      return disconnect();
    case 'send':
      return await send(config);
    case 'receive':
      return await receive(config);
    default:
      return await scan(config);
  }
};

const scan = async (config = {}) => {
  try {
    const options = {
      acceptAllDevices: config.acceptAllDevices !== false,
      filters: config.filters || [],
      optionalServices: config.services || config.optionalServices || []
    };

    if (!options.acceptAllDevices && options.filters.length === 0) {
      options.acceptAllDevices = true;
    }

    bluetoothDevice = await navigator.bluetooth.requestDevice(options);

    if (config.onDiscover) {
      config.onDiscover({
        name: bluetoothDevice.name,
        id: bluetoothDevice.id,
        gatt: bluetoothDevice.gatt
      });
    }

    return {
      name: bluetoothDevice.name,
      id: bluetoothDevice.id,
      connected: bluetoothDevice.gatt.connected
    };
  } catch (error) {
    throw new Error(`Bluetooth scan failed: ${error.message}`);
  }
};

const connect = async (config = {}) => {
  if (!bluetoothDevice) {
    await scan(config);
  }

  try {
    bluetoothServer = await bluetoothDevice.gatt.connect();

    if (config.service) {
      bluetoothService = await bluetoothServer.getPrimaryService(config.service);
    }

    if (config.characteristic && bluetoothService) {
      bluetoothCharacteristic = await bluetoothService.getCharacteristic(config.characteristic);
    }

    if (config.onConnect) {
      config.onConnect({
        device: bluetoothDevice,
        server: bluetoothServer
      });
    }

    bluetoothDevice.addEventListener('gattserverdisconnected', () => {
      bluetoothServer = null;
      bluetoothService = null;
      bluetoothCharacteristic = null;
      if (config.onDisconnect) config.onDisconnect();
    });

    return {
      connected: true,
      device: bluetoothDevice.name,
      service: bluetoothService?.uuid,
      characteristic: bluetoothCharacteristic?.uuid
    };
  } catch (error) {
    throw new Error(`Bluetooth connect failed: ${error.message}`);
  }
};

const disconnect = () => {
  if (bluetoothDevice && bluetoothDevice.gatt.connected) {
    bluetoothDevice.gatt.disconnect();
  }
  bluetoothServer = null;
  bluetoothService = null;
  bluetoothCharacteristic = null;
  bluetoothDevice = null;
  return { connected: false };
};

const send = async (config = {}) => {
  if (!bluetoothCharacteristic) {
    if (config.service && config.characteristic) {
      await connect(config);
    } else {
      throw new Error('Not connected. Call connect() first or provide service/characteristic.');
    }
  }

  const data = config.data || config.value || '';
  let encoded;

  if (typeof data === 'string') {
    encoded = new TextEncoder().encode(data);
  } else if (data instanceof ArrayBuffer) {
    encoded = data;
  } else if (data instanceof Uint8Array) {
    encoded = data;
  } else {
    encoded = new TextEncoder().encode(String(data));
  }

  await bluetoothCharacteristic.writeValue(encoded);

  return {
    sent: true,
    bytes: encoded.byteLength
  };
};

const receive = async (config = {}) => {
  if (!bluetoothCharacteristic) {
    if (config.service && config.characteristic) {
      await connect(config);
    } else {
      throw new Error('Not connected. Call connect() first or provide service/characteristic.');
    }
  }

  const value = await bluetoothCharacteristic.readValue();
  const decoder = new TextDecoder('utf-8');
  const text = decoder.decode(value);

  if (config.onReceive) {
    config.onReceive({ value, text, bytes: value.byteLength });
  }

  return {
    value,
    text,
    bytes: value.byteLength
  };
};

engine.register('bluetooth', bluetoothHandler);

const bluetooth = {
  scan: (options = {}) => engine.execute('bluetooth', 'scan', isObject(options) ? options : {}),
  connect: (options = {}) => engine.execute('bluetooth', 'connect', isObject(options) ? options : {}),
  disconnect: () => engine.execute('bluetooth', 'disconnect', {}),
  send: (data, options = {}) => engine.execute('bluetooth', 'send', {
    ...(isObject(options) ? options : {}),
    data
  }),
  receive: (options = {}) => engine.execute('bluetooth', 'receive', isObject(options) ? options : {})
};

export { bluetooth };
export default bluetooth;