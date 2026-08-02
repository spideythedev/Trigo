import config from './Config.js';
import middleware from './Middleware.js';
import { globalEvents } from './Events.js';
import { globalState } from './State.js';
import engine from '../engine/TriggerEngine.js';
import animationEngine from '../engine/AnimationEngine.js';
import permissionEngine from '../engine/PermissionEngine.js';
import fallbackEngine from '../engine/FallbackEngine.js';
import { getInfo, isMobile, isDesktop, isIOS, isAndroid, isOnline } from '../detect/Device.js';
import { can, has, getSupport } from '../detect/Capabilities.js';
import { setLevel, setPrefix, setTransport } from './Logger.js';

import { vibrate } from '../triggers/device/Vibrate.js';
import { haptic } from '../triggers/device/Haptic.js';
import { flashlight } from '../triggers/device/Flashlight.js';
import { camera } from '../triggers/device/Camera.js';
import { microphone } from '../triggers/device/Microphone.js';
import { location } from '../triggers/device/Location.js';
import { nfc } from '../triggers/device/NFC.js';
import { bluetooth } from '../triggers/device/Bluetooth.js';
import { clipboard } from '../triggers/device/Clipboard.js';
import { share } from '../triggers/device/Share.js';
import { call } from '../triggers/device/Call.js';
import { sms } from '../triggers/device/SMS.js';
import { email } from '../triggers/device/Email.js';
import { fullscreen } from '../triggers/device/Fullscreen.js';
import { wakelock } from '../triggers/device/WakeLock.js';
import { install } from '../triggers/device/Install.js';
import { notify } from '../triggers/notification/Notify.js';
import { speak } from '../triggers/audio/Speak.js';
import { listen } from '../triggers/audio/Listen.js';
import { beep } from '../triggers/audio/Beep.js';
import { fade } from '../triggers/visual/Fade.js';
import { blink } from '../triggers/visual/Blink.js';
import { flash } from '../triggers/visual/Flash.js';
import { pulse } from '../triggers/visual/Pulse.js';
import { shake } from '../triggers/visual/Shake.js';
import { glow } from '../triggers/visual/Glow.js';
import { slide } from '../triggers/visual/Slide.js';
import { zoom } from '../triggers/visual/Zoom.js';
import { spin } from '../triggers/visual/Spin.js';
import { bounce } from '../triggers/visual/Bounce.js';
import { reveal } from '../triggers/visual/Reveal.js';
import { parallax } from '../triggers/visual/Parallax.js';
import { holographic } from '../triggers/visual/Holographic.js';
import { ripple } from '../triggers/visual/Ripple.js';
import { typewriter } from '../triggers/visual/Typewriter.js';
import { scramble } from '../triggers/visual/Scramble.js';
import { gradient } from '../triggers/visual/Gradient.js';
import { confetti } from '../triggers/canvas/Confetti.js';
import { particles } from '../triggers/canvas/Particles.js';
import { snow } from '../triggers/canvas/Snow.js';
import { fire } from '../triggers/canvas/Fire.js';

const VERSION = '1.0.0';

class Trigo {
  constructor() {
    this.version = VERSION;
    this.config = config;
    this.middleware = middleware;
    this.events = globalEvents;
    this.state = globalState;
    this.engine = engine;
    this.animation = animationEngine;
    this.permission = permissionEngine;
    this.fallback = fallbackEngine;

    this.device = {
      info: getInfo,
      isMobile,
      isDesktop,
      isIOS,
      isAndroid,
      isOnline
    };

    this.can = can;
    this.has = has;
    this.support = getSupport;

    this.vibrate = vibrate;
    this.haptic = haptic;
    this.flashlight = flashlight;
    this.camera = camera;
    this.microphone = microphone;
    this.location = location;
    this.nfc = nfc;
    this.bluetooth = bluetooth;
    this.clipboard = clipboard;
    this.share = share;
    this.call = call;
    this.sms = sms;
    this.email = email;
    this.fullscreen = fullscreen;
    this.wakelock = wakelock;
    this.install = install;
    this.notify = notify;
    this.speak = speak;
    this.listen = listen;
    this.beep = beep;

    this.fade = fade;
    this.blink = blink;
    this.flash = flash;
    this.pulse = pulse;
    this.shake = shake;
    this.glow = glow;
    this.slide = slide;
    this.zoom = zoom;
    this.spin = spin;
    this.bounce = bounce;
    this.reveal = reveal;
    this.parallax = parallax;
    this.holographic = holographic;
    this.ripple = ripple;
    this.typewriter = typewriter;
    this.scramble = scramble;
    this.gradient = gradient;

    this.confetti = confetti;
    this.particles = particles;
    this.snow = snow;
    this.fire = fire;

    this.is = {
      get mobile() { return isMobile(); },
      get desktop() { return isDesktop(); },
      get ios() { return isIOS(); },
      get android() { return isAndroid(); },
      get online() { return isOnline(); },
      get offline() { return !isOnline(); }
    };

    globalState.set('ready', true);
  }

  configure(options) {
    this.config.set(options);
    return this;
  }

  preset(name, presetConfig) {
    this.config.preset(name, presetConfig);
    return this;
  }

  use(presetName) {
    this.config.applyPreset(presetName);
    return this;
  }

  define(triggerName, handler) {
    this.engine.register(triggerName, handler);
    return this;
  }

  plugin(name, pluginConfig) {
    if (pluginConfig && pluginConfig.install) {
      pluginConfig.install(this);
    }
    return this;
  }

  on(event, handler) {
    return this.events.on(event, handler);
  }

  once(event, handler) {
    return this.events.once(event, handler);
  }

  off(event, handler) {
    this.events.off(event, handler);
    return this;
  }

  emit(event, ...args) {
    this.events.emit(event, ...args);
    return this;
  }

  sequence(triggers) {
    return this.engine.executeSequence(triggers);
  }

  parallel(triggers) {
    return this.engine.executeParallel(triggers);
  }

  race(triggers) {
    return this.engine.executeRace(triggers);
  }

  when(condition, thenTrigger, elseTrigger) {
    if (typeof condition === 'function' ? condition() : condition) {
      return thenTrigger ? thenTrigger() : null;
    }
    return elseTrigger ? elseTrigger() : null;
  }

  log(level, message, data) {
    setLevel(level);
    if (message) {
      const { log } = require('./Logger.js');
      log(level, message, data);
    }
    return this;
  }

  cancelAll() {
    this.engine.cancelAll();
    return this;
  }

  destroy() {
    this.cancelAll();
    this.events.removeAll();
    this.state.reset();
    this.middleware.clear();
  }
}

const trigo = new Trigo();

if (typeof window !== 'undefined') {
  window.Trigo = trigo;
  window.trigo = trigo;
}

export { Trigo, trigo };
export default trigo;