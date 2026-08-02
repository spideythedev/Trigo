import { isFunction, isString, isNumber } from '../utils/type.js';
import { getEasing } from './EasingEngine.js';

class AnimationEngine {
  constructor() {
    this.animations = new Map();
    this.globalTime = 0;
    this.isRunning = false;
  }

  animate(options) {
    const {
      duration = 400,
      delay = 0,
      easing = 'ease-out',
      easingOptions = {},
      iterations = 1,
      direction = 'normal',
      yoyo = false,
      onStart = null,
      onUpdate = null,
      onComplete = null,
      onStop = null
    } = options;

    const id = `anim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const easeFn = getEasing(easing, easingOptions);

    const animation = {
      id,
      duration,
      delay,
      easing,
      easingOptions,
      easeFn,
      iterations,
      direction,
      yoyo,
      onStart,
      onUpdate,
      onComplete,
      onStop,
      startTime: null,
      currentIteration: 0,
      progress: 0,
      isPaused: false,
      isCompleted: false,
      isCancelled: false
    };

    this.animations.set(id, animation);
    this.startIfNeeded();

    return {
      id,
      pause: () => this.pause(id),
      resume: () => this.resume(id),
      stop: () => this.stop(id),
      cancel: () => this.cancel(id),
      getProgress: () => this.getProgress(id)
    };
  }

  startIfNeeded() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.loop();
    }
  }

  loop() {
    if (!this.isRunning) return;

    const now = performance.now();
    this.globalTime = now;
    let allCompleted = true;

    for (const [id, animation] of this.animations) {
      if (animation.isCompleted || animation.isCancelled) continue;
      
      allCompleted = false;

      if (animation.isPaused) continue;

      if (!animation.startTime) {
        animation.startTime = now;
        if (animation.onStart) animation.onStart();
      }

      const elapsed = now - animation.startTime - animation.delay;
      
      if (elapsed < 0) continue;

      let progress = Math.min(elapsed / animation.duration, 1);
      
      if (animation.direction === 'reverse') {
        progress = 1 - progress;
      } else if (animation.direction === 'alternate') {
        const iteration = Math.floor(elapsed / animation.duration);
        progress = iteration % 2 === 0 ? progress : 1 - progress;
      }

      progress = Math.max(0, Math.min(1, progress));
      
      const easedProgress = animation.easeFn(progress);
      animation.progress = easedProgress;

      if (animation.onUpdate) {
        animation.onUpdate(easedProgress, progress);
      }

      if (elapsed >= animation.duration) {
        animation.currentIteration++;

        if (animation.yoyo) {
          animation.direction = animation.direction === 'reverse' ? 'normal' : 'reverse';
        }

        if (animation.iterations === 'infinite' || animation.currentIteration < animation.iterations) {
          animation.startTime = now;
        } else {
          animation.isCompleted = true;
          if (animation.onComplete) animation.onComplete();
        }
      }
    }

    if (allCompleted) {
      this.isRunning = false;
    } else {
      requestAnimationFrame(() => this.loop());
    }
  }

  pause(id) {
    const animation = this.animations.get(id);
    if (animation) {
      animation.isPaused = true;
    }
  }

  resume(id) {
    const animation = this.animations.get(id);
    if (animation) {
      animation.isPaused = false;
      animation.startTime = performance.now() - (animation.progress * animation.duration);
      this.startIfNeeded();
    }
  }

  stop(id) {
    const animation = this.animations.get(id);
    if (animation) {
      animation.isCompleted = true;
      if (animation.onStop) animation.onStop();
      if (animation.onComplete) animation.onComplete();
    }
  }

  cancel(id) {
    const animation = this.animations.get(id);
    if (animation) {
      animation.isCancelled = true;
      this.animations.delete(id);
    }
  }

  getProgress(id) {
    const animation = this.animations.get(id);
    return animation ? animation.progress : 0;
  }

  cancelAll() {
    this.animations.clear();
    this.isRunning = false;
  }

  animateCSS(element, keyframes, options = {}) {
    const {
      duration = 400,
      delay = 0,
      easing = 'ease-out',
      iterations = 1,
      direction = 'normal',
      fill = 'both'
    } = options;

    const animOptions = {
      duration,
      delay,
      iterations,
      direction,
      fill,
      easing: easing.replace('ease-', '')
    };

    const animation = element.animate(keyframes, animOptions);

    return {
      animation,
      pause: () => animation.pause(),
      play: () => animation.play(),
      cancel: () => animation.cancel(),
      finish: () => animation.finish(),
      onFinish: (callback) => {
        animation.onfinish = callback;
      }
    };
  }

  timeline(animations) {
    let totalDuration = 0;
    const timeline = [];

    for (const anim of animations) {
      const delay = totalDuration + (anim.delay || 0);
      timeline.push({ ...anim, delay });
      totalDuration += (anim.duration || 400) + (anim.delay || 0);
    }

    return {
      totalDuration,
      play: () => {
        const controls = timeline.map(anim => this.animate(anim));
        return {
          pauseAll: () => controls.forEach(c => c.pause()),
          resumeAll: () => controls.forEach(c => c.resume()),
          stopAll: () => controls.forEach(c => c.stop())
        };
      }
    };
  }

  stagger(elements, animation, staggerDelay = 80) {
    const controls = [];
    elements.forEach((element, index) => {
      const config = {
        ...animation,
        delay: (animation.delay || 0) + (index * staggerDelay)
      };
      controls.push(this.animate({ ...config, element }));
    });
    return {
      controls,
      stopAll: () => controls.forEach(c => c.stop())
    };
  }
}

const animationEngine = new AnimationEngine();

export { AnimationEngine, animationEngine };
export default animationEngine;