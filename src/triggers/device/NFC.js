import { isObject, isFunction } from '../../utils/type.js';
import engine from '../../engine/TriggerEngine.js';
import { isAndroid } from '../../detect/Device.js';

let nfcReader = null;

const nfcHandler = async (context) => {
  const action = context.params[0] || 'read';
  const config = context.config;

  if (!isAndroid()) {
    throw new Error('NFC is only supported on Android');
  }

  if (!('NDEFReader' in window)) {
    throw new Error('Web NFC not supported in this browser');
  }

  switch (action) {
    case 'read':
      return await readNFC(config);
    case 'write':
      return await writeNFC(config);
    case 'scan':
      return await scanNFC(config);
    default:
      return await readNFC(config);
  }
};

const readNFC = async (config = {}) => {
  try {
    nfcReader = new NDEFReader();
    await nfcReader.scan();

    return new Promise((resolve, reject) => {
      nfcReader.onreading = (event) => {
        const { message, serialNumber } = event;
        const records = [];

        for (const record of message.records) {
          records.push({
            recordType: record.recordType,
            mediaType: record.mediaType,
            data: record.data,
            encoding: record.encoding,
            lang: record.lang,
            text: record.recordType === 'text'
              ? new TextDecoder(record.encoding || 'utf-8').decode(record.data)
              : null,
            url: record.recordType === 'url'
              ? new TextDecoder().decode(record.data)
              : null
          });
        }

        const result = { serialNumber, records, message };

        if (config.onRead) {
          config.onRead(result);
        }

        if (!config.continuous) {
          nfcReader = null;
        }

        resolve(result);
      };

      nfcReader.onerror = (error) => {
        reject(error);
      };

      if (config.timeout) {
        setTimeout(() => {
          resolve({ cancelled: true, reason: 'timeout' });
        }, config.timeout);
      }
    });
  } catch (error) {
    throw new Error(`NFC read failed: ${error.message}`);
  }
};

const writeNFC = async (config = {}) => {
  try {
    nfcReader = new NDEFReader();
    await nfcReader.scan();

    return new Promise(async (resolve, reject) => {
      nfcReader.onreading = async (event) => {
        const records = [];

        if (config.text) {
          records.push({
            recordType: 'text',
            data: config.text,
            encoding: config.encoding || 'utf-8',
            lang: config.lang || 'en'
          });
        }

        if (config.url) {
          records.push({
            recordType: 'url',
            data: config.url
          });
        }

        if (config.records) {
          records.push(...config.records);
        }

        if (records.length === 0) {
          reject(new Error('No records to write'));
          return;
        }

        try {
          await nfcReader.write({ records });
          if (config.onWrite) config.onWrite({ records });
          resolve({ written: true, records });
        } catch (writeError) {
          reject(writeError);
        }
      };

      nfcReader.onerror = reject;

      if (config.timeout) {
        setTimeout(() => {
          resolve({ cancelled: true, reason: 'timeout' });
        }, config.timeout);
      }
    });
  } catch (error) {
    throw new Error(`NFC write failed: ${error.message}`);
  }
};

const scanNFC = async (config = {}) => {
  return await readNFC({ ...config, continuous: false });
};

const stopNFC = () => {
  nfcReader = null;
  return { stopped: true };
};

engine.register('nfc', nfcHandler);

const nfc = {
  read: (options = {}) => engine.execute('nfc', 'read', isObject(options) ? options : {}),
  write: (data, options = {}) => {
    const config = isObject(options) ? options : {};
    if (typeof data === 'string') {
      config.text = data;
    } else if (isObject(data)) {
      Object.assign(config, data);
    }
    return engine.execute('nfc', 'write', config);
  },
  scan: (options = {}) => engine.execute('nfc', 'scan', isObject(options) ? options : {}),
  stop: stopNFC
};

export { nfc };
export default nfc;