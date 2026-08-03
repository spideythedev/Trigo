import { isObject } from '../../utils/type.js';
import engine from '../../engine/TriggerEngine.js';

let usbDevice = null;

const usbHandler = async (context) => {
  const action = context.params[0] || 'connect';
  const config = context.config;

  if (!('usb' in navigator)) {
    throw new Error('WebUSB not supported');
  }

  switch (action) {
    case 'connect':
      return await connect(config);
    case 'send':
      return await send(config);
    case 'receive':
      return await receive(config);
    case 'disconnect':
      return disconnect();
    default:
      return await connect(config);
  }
};

const connect = async (config = {}) => {
  try {
    const filters = config.filters || [];
    usbDevice = await navigator.usb.requestDevice({ filters });

    await usbDevice.open();
    if (usbDevice.configuration === null) {
      await usbDevice.selectConfiguration(1);
    }
    await usbDevice.claimInterface(config.interface || 0);

    if (config.onConnect) config.onConnect(usbDevice);

    return {
      connected: true,
      device: usbDevice.productName || 'Unknown USB device'
    };
  } catch (error) {
    throw new Error(`USB connect failed: ${error.message}`);
  }
};

const send = async (config = {}) => {
  if (!usbDevice) throw new Error('No USB device connected');

  const data = config.data || '';
  const encoder = new TextEncoder();
  const buffer = encoder.encode(data);

  await usbDevice.transferOut(config.endpoint || 1, buffer);

  return { sent: true, bytes: buffer.byteLength };
};

const receive = async (config = {}) => {
  if (!usbDevice) throw new Error('No USB device connected');

  const result = await usbDevice.transferIn(config.endpoint || 1, config.length || 64);
  const decoder = new TextDecoder();
  const text = decoder.decode(result.data);

  if (config.onReceive) config.onReceive({ data: result.data, text });

  return { data: result.data, text };
};

const disconnect = () => {
  if (usbDevice) {
    usbDevice.close();
    usbDevice = null;
  }
  return { connected: false };
};

engine.register('usb', usbHandler);

const usb = {
  connect: (options = {}) => engine.execute('usb', 'connect', isObject(options) ? options : {}),
  send: (data, options = {}) => engine.execute('usb', 'send', { ...options, data }),
  receive: (options = {}) => engine.execute('usb', 'receive', isObject(options) ? options : {}),
  disconnect: () => engine.execute('usb', 'disconnect', {})
};

export { usb };
export default usb;