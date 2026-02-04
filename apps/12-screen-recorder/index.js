/**
 * App 12: Screen Recorder
 *
 * Demonstrates video recording using CDP:
 * - Start/stop video recording
 * - Capture frames via screencast
 * - Assemble frames into video (using ffmpeg if available)
 * - Record with timestamp overlay
 *
 * CDP Domains: Page, Tracing
 */

import { connectToFirstPage } from '../../shared/target-manager.js';
import { waitForNavigation, sleep } from '../../shared/wait-helpers.js';
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';

class ScreenRecorder {
  constructor(client) {
    this.client = client;
    this.frames = [];
    this.recording = false;
    this.frameCount = 0;
  }

  /**
   * Enable required CDP domains
   */
  async enable() {
    await this.client.send('Page.enable');
    console.log('[ScreenRecorder] Page domain enabled');
  }

  /**
   * Start recording via screencast
   * @param {object} options - Recording options
   */
  async startRecording(options = {}) {
    const {
      format = 'png',
      quality = 80,
      maxWidth = 1280,
      maxHeight = 720,
      everyNthFrame = 1
    } = options;

    this.frames = [];
    this.frameCount = 0;
    this.recording = true;

    // Set up frame handler
    this.frameHandler = (params) => {
      if (!this.recording) return;

      this.frameCount++;

      // Store frame data
      this.frames.push({
        data: params.data,
        timestamp: params.metadata.timestamp,
        frameNumber: this.frameCount
      });

      // Acknowledge frame to continue receiving
      this.client.send('Page.screencastFrameAck', {
        sessionId: params.sessionId
      });
    };

    this.client.on('Page.screencastFrame', this.frameHandler);

    // Start screencast
    await this.client.send('Page.startScreencast', {
      format,
      quality,
      maxWidth,
      maxHeight,
      everyNthFrame
    });

    console.log(`[ScreenRecorder] Started recording (${maxWidth}x${maxHeight})`);
  }

  /**
   * Stop recording
   * @returns {Promise<object>} - Recording stats
   */
  async stopRecording() {
    this.recording = false;

    await this.client.send('Page.stopScreencast');

    if (this.frameHandler) {
      this.client.off('Page.screencastFrame', this.frameHandler);
    }

    const stats = {
      frameCount: this.frames.length,
      duration: this.frames.length > 0 ?
        this.frames[this.frames.length - 1].timestamp - this.frames[0].timestamp :
        0
    };

    console.log(`[ScreenRecorder] Stopped recording (${stats.frameCount} frames)`);
    return stats;
  }

  /**
   * Save frames as individual images
   * @param {string} outputDir - Output directory
   * @returns {Promise<string[]>} - Array of saved file paths
   */
  async saveFrames(outputDir) {
    await fs.mkdir(outputDir, { recursive: true });

    const filePaths = [];

    for (let i = 0; i < this.frames.length; i++) {
      const frame = this.frames[i];
      const fileName = `frame-${String(i).padStart(5, '0')}.png`;
      const filePath = path.join(outputDir, fileName);

      const buffer = Buffer.from(frame.data, 'base64');
      await fs.writeFile(filePath, buffer);
      filePaths.push(filePath);
    }

    console.log(`[ScreenRecorder] Saved ${filePaths.length} frames to ${outputDir}`);
    return filePaths;
  }

  /**
   * Create video from frames using ffmpeg
   * @param {string} outputDir - Directory containing frames
   * @param {string} outputFile - Output video file path
   * @param {object} options - Video options
   * @returns {Promise<boolean>}
   */
  async createVideo(outputDir, outputFile, options = {}) {
    const {
      fps = 10,
      codec = 'libx264',
      crf = 23
    } = options;

    return new Promise((resolve, reject) => {
      const args = [
        '-y', // Overwrite output
        '-framerate', String(fps),
        '-i', path.join(outputDir, 'frame-%05d.png'),
        '-c:v', codec,
        '-crf', String(crf),
        '-pix_fmt', 'yuv420p',
        outputFile
      ];

      console.log(`[ScreenRecorder] Creating video with ffmpeg...`);

      const ffmpeg = spawn('ffmpeg', args);

      let stderr = '';
      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          console.log(`[ScreenRecorder] Video saved to: ${outputFile}`);
          resolve(true);
        } else {
          console.log(`[ScreenRecorder] ffmpeg failed (code ${code})`);
          console.log('[ScreenRecorder] Make sure ffmpeg is installed');
          resolve(false);
        }
      });

      ffmpeg.on('error', (err) => {
        console.log(`[ScreenRecorder] ffmpeg not found. Install ffmpeg to create videos.`);
        resolve(false);
      });
    });
  }

  /**
   * Create a GIF from frames using ffmpeg
   * @param {string} outputDir - Directory containing frames
   * @param {string} outputFile - Output GIF file path
   * @param {object} options - GIF options
   */
  async createGif(outputDir, outputFile, options = {}) {
    const {
      fps = 5,
      width = 640
    } = options;

    return new Promise((resolve) => {
      const args = [
        '-y',
        '-framerate', String(fps),
        '-i', path.join(outputDir, 'frame-%05d.png'),
        '-vf', `scale=${width}:-1:flags=lanczos`,
        outputFile
      ];

      console.log(`[ScreenRecorder] Creating GIF with ffmpeg...`);

      const ffmpeg = spawn('ffmpeg', args);

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          console.log(`[ScreenRecorder] GIF saved to: ${outputFile}`);
          resolve(true);
        } else {
          console.log(`[ScreenRecorder] ffmpeg failed (code ${code})`);
          resolve(false);
        }
      });

      ffmpeg.on('error', () => {
        console.log(`[ScreenRecorder] ffmpeg not found. Install ffmpeg to create GIFs.`);
        resolve(false);
      });
    });
  }

  /**
   * Get frame at specific index
   * @param {number} index - Frame index
   * @returns {Buffer|null}
   */
  getFrame(index) {
    if (index < 0 || index >= this.frames.length) {
      return null;
    }
    return Buffer.from(this.frames[index].data, 'base64');
  }

  /**
   * Get recording duration
   * @returns {number} - Duration in seconds
   */
  getDuration() {
    if (this.frames.length < 2) return 0;
    return this.frames[this.frames.length - 1].timestamp - this.frames[0].timestamp;
  }

  /**
   * Clear recorded frames
   */
  clearFrames() {
    this.frames = [];
    this.frameCount = 0;
    console.log('[ScreenRecorder] Frames cleared');
  }

  /**
   * Take a single screenshot during recording
   * @returns {Promise<Buffer>}
   */
  async captureFrame() {
    const result = await this.client.send('Page.captureScreenshot', {
      format: 'png'
    });
    return Buffer.from(result.data, 'base64');
  }
}

// Demo
async function main() {
  console.log('=== CDP Screen Recorder Demo ===\n');

  try {
    // Connect to browser
    const { client } = await connectToFirstPage();
    const recorder = new ScreenRecorder(client);

    // Enable domains
    await recorder.enable();

    // Navigate to a page
    console.log('\n--- Navigating to example.com ---');
    const navPromise = waitForNavigation(client);
    await client.send('Page.navigate', { url: 'https://example.com' });
    await navPromise;
    await sleep(500);

    // Start recording
    console.log('\n--- Starting Recording ---');
    await recorder.startRecording({
      maxWidth: 800,
      maxHeight: 600,
      quality: 80,
      everyNthFrame: 1
    });

    // Perform some actions to record
    console.log('\n--- Performing actions ---');

    // Wait and scroll
    await sleep(1000);
    await client.send('Runtime.evaluate', {
      expression: 'window.scrollBy(0, 100)'
    });
    await sleep(500);

    // Navigate to another page
    await client.send('Page.navigate', { url: 'https://httpbin.org/html' });
    await sleep(1500);

    // Scroll some more
    await client.send('Runtime.evaluate', {
      expression: 'window.scrollBy(0, 200)'
    });
    await sleep(500);

    // Stop recording
    console.log('\n--- Stopping Recording ---');
    const stats = await recorder.stopRecording();
    console.log(`  Captured ${stats.frameCount} frames`);
    console.log(`  Duration: ${stats.duration.toFixed(2)}s`);

    // Save frames
    console.log('\n--- Saving Frames ---');
    const outputDir = 'recording-frames';
    await recorder.saveFrames(outputDir);

    // Try to create video
    console.log('\n--- Creating Video ---');
    const videoCreated = await recorder.createVideo(
      outputDir,
      'recording.mp4',
      { fps: 10 }
    );

    if (!videoCreated) {
      console.log('  (Video creation skipped - ffmpeg not available)');
    }

    // Try to create GIF
    console.log('\n--- Creating GIF ---');
    const gifCreated = await recorder.createGif(
      outputDir,
      'recording.gif',
      { fps: 5, width: 400 }
    );

    if (!gifCreated) {
      console.log('  (GIF creation skipped - ffmpeg not available)');
    }

    console.log('\n=== Demo Complete ===');
    console.log('\nOutput files:');
    console.log(`  - ${outputDir}/ (frame images)`);
    if (videoCreated) console.log('  - recording.mp4');
    if (gifCreated) console.log('  - recording.gif');

    client.close();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

export { ScreenRecorder };
