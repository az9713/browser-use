/**
 * App 26: Animation Controller
 *
 * Control and inspect animations using CDP:
 * - List all CSS animations and transitions
 * - Pause/play animations
 * - Set playback rate (slow motion, fast forward)
 * - Seek to specific time
 * - Inspect animation timing
 *
 * CDP Domains: Animation, Runtime, DOM
 */

import { connectToFirstPage } from '../../shared/target-manager.js';
import { waitForNavigation, sleep } from '../../shared/wait-helpers.js';

class AnimationController {
  constructor(client) {
    this.client = client;
    this.animations = new Map();
  }

  async enable() {
    await this.client.send('Animation.enable');
    await this.client.send('Runtime.enable');
    await this.client.send('DOM.enable');

    // Listen for animation events
    this.client.on('Animation.animationCreated', (event) => {
      console.log(`[Animation] Created: ${event.id}`);
    });

    this.client.on('Animation.animationStarted', (event) => {
      this.animations.set(event.animation.id, event.animation);
      console.log(`[Animation] Started: ${event.animation.id} (${event.animation.type})`);
    });

    this.client.on('Animation.animationCanceled', (event) => {
      this.animations.delete(event.id);
      console.log(`[Animation] Canceled: ${event.id}`);
    });

    console.log('[AnimController] Enabled and listening');
  }

  async listAnimations() {
    const animations = Array.from(this.animations.values());
    return animations.map(anim => ({
      id: anim.id,
      name: anim.name,
      type: anim.type,
      currentTime: anim.currentTime,
      playbackRate: anim.playbackRate,
      playState: anim.playState,
      startTime: anim.startTime,
      source: {
        delay: anim.source?.delay || 0,
        duration: anim.source?.duration || 0,
        iterations: anim.source?.iterations || 1,
        easing: anim.source?.easing || 'linear'
      }
    }));
  }

  async pauseAnimation(animationId) {
    await this.client.send('Animation.setPaused', {
      animations: [animationId],
      paused: true
    });
    console.log(`[AnimController] Paused: ${animationId}`);
  }

  async playAnimation(animationId) {
    await this.client.send('Animation.setPaused', {
      animations: [animationId],
      paused: false
    });
    console.log(`[AnimController] Playing: ${animationId}`);
  }

  async pauseAll() {
    const animIds = Array.from(this.animations.keys());
    if (animIds.length === 0) return;

    await this.client.send('Animation.setPaused', {
      animations: animIds,
      paused: true
    });
    console.log(`[AnimController] Paused all ${animIds.length} animation(s)`);
  }

  async playAll() {
    const animIds = Array.from(this.animations.keys());
    if (animIds.length === 0) return;

    await this.client.send('Animation.setPaused', {
      animations: animIds,
      paused: false
    });
    console.log(`[AnimController] Playing all ${animIds.length} animation(s)`);
  }

  async setPlaybackRate(animationId, rate) {
    await this.client.send('Animation.setPlaybackRate', {
      playbackRate: rate
    });
    console.log(`[AnimController] Set playback rate to ${rate}x`);
  }

  async seekTo(animationId, time) {
    await this.client.send('Animation.seekAnimations', {
      animations: [animationId],
      currentTime: time
    });
    console.log(`[AnimController] Seeked ${animationId} to ${time}ms`);
  }

  async releaseAnimations() {
    const animIds = Array.from(this.animations.keys());
    if (animIds.length === 0) return;

    await this.client.send('Animation.releaseAnimations', {
      animations: animIds
    });
    this.animations.clear();
    console.log(`[AnimController] Released all animations`);
  }

  async getCurrentTime(animationId) {
    const anim = this.animations.get(animationId);
    return anim ? anim.currentTime : null;
  }

  async injectTestAnimations() {
    await this.client.send('Runtime.evaluate', {
      expression: `
        (function() {
          // Remove existing test animations
          const existing = document.getElementById('cdp-anim-test');
          if (existing) existing.remove();

          const container = document.createElement('div');
          container.id = 'cdp-anim-test';
          container.innerHTML = \`
            <style>
              @keyframes slide {
                from { transform: translateX(0); }
                to { transform: translateX(300px); }
              }
              @keyframes rotate {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
              @keyframes pulse {
                0%, 100% { opacity: 1; scale: 1; }
                50% { opacity: 0.5; scale: 1.2; }
              }
              .anim-box {
                width: 100px;
                height: 100px;
                margin: 20px;
                border-radius: 10px;
              }
              .slide-box {
                background: #ff6b6b;
                animation: slide 3s ease-in-out infinite alternate;
              }
              .rotate-box {
                background: #4ecdc4;
                animation: rotate 4s linear infinite;
              }
              .pulse-box {
                background: #ffe66d;
                animation: pulse 2s ease-in-out infinite;
              }
              .transition-box {
                background: #95e1d3;
                transition: all 1s ease-in-out;
              }
              .transition-box:hover {
                transform: scale(1.5) rotate(45deg);
                background: #f38181;
              }
            </style>
            <div style="position:fixed;top:100px;left:50px;z-index:999999;">
              <div class="anim-box slide-box"></div>
              <div class="anim-box rotate-box"></div>
              <div class="anim-box pulse-box"></div>
              <div class="anim-box transition-box"></div>
            </div>
          \`;
          document.body.appendChild(container);
          console.log('[Test] Animations injected');
        })()
      `
    });
    console.log('[AnimController] Test animations injected');
  }

  async removeTestAnimations() {
    await this.client.send('Runtime.evaluate', {
      expression: `
        const el = document.getElementById('cdp-anim-test');
        if (el) el.remove();
      `
    });
  }

  async getAnimationTimeline() {
    const anims = await this.listAnimations();
    const timeline = anims.map(anim => {
      const duration = anim.source.duration;
      const current = anim.currentTime;
      const progress = duration > 0 ? (current / duration * 100).toFixed(1) : 0;

      return {
        id: anim.id,
        name: anim.name,
        type: anim.type,
        progress: `${progress}%`,
        timeline: this.createProgressBar(progress)
      };
    });

    return timeline;
  }

  createProgressBar(percent, width = 30) {
    const filled = Math.floor(percent / 100 * width);
    const empty = width - filled;
    return '[' + '█'.repeat(filled) + '░'.repeat(empty) + ']';
  }
}

async function main() {
  console.log('=== CDP Animation Controller Demo ===\n');

  try {
    const { client } = await connectToFirstPage();
    const controller = new AnimationController(client);

    await controller.enable();

    console.log('\n--- Navigating to page ---');
    const navPromise = waitForNavigation(client);
    await client.send('Page.navigate', { url: 'https://example.com' });
    await navPromise;
    await sleep(500);

    console.log('\n--- Injecting test animations ---');
    await controller.injectTestAnimations();
    await sleep(2000);

    console.log('\n--- Listing animations ---');
    let animations = await controller.listAnimations();
    console.log(`  Active animations: ${animations.length}`);
    animations.forEach(anim => {
      console.log(`  - ${anim.name || anim.id} (${anim.type})`);
      console.log(`    Duration: ${anim.source.duration}ms`);
      console.log(`    Iterations: ${anim.source.iterations}`);
      console.log(`    Easing: ${anim.source.easing}`);
    });

    if (animations.length > 0) {
      console.log('\n--- Animation Timeline ---');
      const timeline = await controller.getAnimationTimeline();
      timeline.forEach(item => {
        console.log(`  ${item.name || item.id}`);
        console.log(`    ${item.timeline} ${item.progress}`);
      });

      await sleep(2000);

      console.log('\n--- Pausing all animations ---');
      await controller.pauseAll();
      await sleep(2000);

      console.log('\n--- Slow motion (0.25x speed) ---');
      await controller.setPlaybackRate(animations[0].id, 0.25);
      await controller.playAll();
      await sleep(3000);

      console.log('\n--- Fast forward (2x speed) ---');
      await controller.setPlaybackRate(animations[0].id, 2.0);
      await sleep(2000);

      console.log('\n--- Normal speed (1x) ---');
      await controller.setPlaybackRate(animations[0].id, 1.0);
      await sleep(2000);

      console.log('\n--- Pausing all ---');
      await controller.pauseAll();
      await sleep(1000);
    }

    console.log('\n--- Cleaning up ---');
    await controller.removeTestAnimations();
    await controller.releaseAnimations();

    console.log('\n=== Demo Complete ===');
    client.close();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

export { AnimationController };
