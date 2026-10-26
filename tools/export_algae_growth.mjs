import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.join(ROOT, 'algae-growth');
const DIST = path.join(SOURCE, 'dist');
const htmlPath = path.join(SOURCE, 'index.html');
const cssPath = path.join(SOURCE, 'growth.css');
const jsPath = path.join(SOURCE, 'growth.js');

async function resolveDownloads() {
  if (process.platform !== 'win32') return path.join(os.homedir(), 'Downloads');
  const result = execFileSync('powershell.exe', ['-NoProfile', '-Command',
    "(New-Object -ComObject Shell.Application).Namespace('shell:Downloads').Self.Path"], { encoding: 'utf8' }).trim();
  if (!result) throw new Error('Windows Downloads known folder could not be resolved');
  return result;
}

function inlineAssets(html, css, js) {
  return html
    .replace(/<link rel="stylesheet" href="growth\.css[^>]*>/, `<style>${css}</style>`)
    .replace(/<script src="growth\.js[^>]*><\/script>/, `<script>${js}</script>`);
}

function embedVoiceover(html, wav) {
  const encoded = wav.toString('base64');
  const preload = `<script>window.__ALGAE_VOICE_AUDIO__ = "data:audio/wav;base64,${encoded}";</script>`;
  return html.replace('<script>(() => {', `${preload}\n<script>(() => {`);
}

function psQuote(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

async function createVoiceoverWav(narration, output) {
  if (process.platform !== 'win32') return false;
  const transcript = `${output}.txt`;
  await fs.writeFile(transcript, narration.map((line, index) => `Scene ${index + 1}. ${line}`).join('\n\n'), 'utf8');
  const command = [
    "$ErrorActionPreference='Stop'",
    'Add-Type -AssemblyName System.Speech',
    '$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer',
    '$voice = $synth.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Culture.Name -match \'^en\' } | Select-Object -First 1',
    'if ($voice) { $synth.SelectVoice($voice.VoiceInfo.Name) }',
    // Keep the seven-scene narration inside the 46-second visual timeline.
    '$synth.Rate = 5',
    '$synth.Volume = 92',
    `$synth.SetOutputToWaveFile(${psQuote(output)})`,
    `$synth.Speak((Get-Content -LiteralPath ${psQuote(transcript)} -Raw))`,
    '$synth.Dispose()',
  ].join('; ');
  const result = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], { stdio: 'pipe' });
  await fs.rm(transcript, { force: true });
  if (result.status !== 0) {
    console.warn(`Voiceover export skipped: ${result.stderr?.toString() || 'Windows Speech synthesis failed'}`);
    return false;
  }
  return true;
}

async function capturePreview(url, output, audioPath) {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 1 });
    await page.goto(url, { waitUntil: 'networkidle' });
    const narration = await page.evaluate(() => window.__algaeGrowth.scenes.map((scene) => scene.voiceover));
    const base64 = await page.evaluate(async () => {
      const app = window.__algaeGrowth;
      if (!app || !HTMLCanvasElement.prototype.captureStream || !window.MediaRecorder) throw new Error('Canvas video capture is unavailable in this browser');
      app.state.elapsed = 0;
      app.state.playing = true;
      app.state.speed = 1;
      const stream = document.getElementById('growthCanvas').captureStream(20);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
      const chunks = [];
      const finished = new Promise((resolve, reject) => {
        recorder.addEventListener('dataavailable', (event) => { if (event.data.size) chunks.push(event.data); });
        recorder.addEventListener('error', () => reject(new Error('MediaRecorder failed')));
        recorder.addEventListener('stop', resolve, { once: true });
      });
      recorder.start(250);
      await new Promise((resolve) => setTimeout(resolve, 48000));
      recorder.stop();
      await finished;
      const buffer = await new Blob(chunks, { type: 'video/webm' }).arrayBuffer();
      let binary = '';
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
      return btoa(binary);
    });
    const webm = `${output}.webm`;
    await fs.writeFile(webm, Buffer.from(base64, 'base64'));
    const audioReady = await createVoiceoverWav(narration, audioPath);
    const ffmpeg = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
    const ffmpegArgs = ['-y', '-i', webm];
    if (audioReady) ffmpegArgs.push('-i', audioPath, '-map', '0:v:0', '-map', '1:a:0', '-c:a', 'aac', '-b:a', '128k', '-af', 'apad');
    ffmpegArgs.push('-t', '46', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', output);
    const result = spawnSync(ffmpeg, ffmpegArgs, { stdio: 'pipe' });
    await fs.rm(webm, { force: true });
    if (result.status !== 0) throw new Error(result.stderr?.toString() || 'FFmpeg failed to encode the preview');
    return true;
  } catch (error) {
    console.warn(`MP4 export skipped: ${error.message}`);
    return false;
  } finally {
    await browser?.close();
  }
}

const [html, css, js] = await Promise.all([
  fs.readFile(htmlPath, 'utf8'),
  fs.readFile(cssPath, 'utf8'),
  fs.readFile(jsPath, 'utf8'),
]);
const standalone = inlineAssets(html, css, js);
const downloads = await resolveDownloads();
await fs.mkdir(DIST, { recursive: true });
await fs.mkdir(downloads, { recursive: true });

const repoHtml = path.join(DIST, 'orr-biologicals-algae-growth.html');
const downloadHtml = path.join(downloads, 'Orr-Biologicals-Algae-Growth.html');
await Promise.all([fs.writeFile(repoHtml, standalone), fs.writeFile(downloadHtml, standalone)]);

const downloadProject = path.join(downloads, 'Orr-Biologicals-Algae-Growth');
const projectDist = path.join(downloadProject, 'dist');
await fs.mkdir(projectDist, { recursive: true });
await Promise.all([
  fs.writeFile(path.join(downloadProject, 'index.html'), html),
  fs.writeFile(path.join(downloadProject, 'growth.css'), css),
  fs.writeFile(path.join(downloadProject, 'growth.js'), js),
  fs.copyFile(path.join(SOURCE, 'README.md'), path.join(downloadProject, 'README.md')),
  fs.writeFile(path.join(projectDist, 'orr-biologicals-algae-growth.html'), standalone),
]);

const repoMp4 = path.join(DIST, 'orr-biologicals-algae-growth.mp4');
const repoWav = path.join(DIST, 'orr-biologicals-algae-growth-voiceover.wav');
const downloadMp4 = path.join(downloads, 'Orr-Biologicals-Algae-Growth.mp4');
const downloadWav = path.join(downloads, 'Orr-Biologicals-Algae-Growth-Voiceover.wav');
const serverUrl = 'http://127.0.0.1:8080/algae-growth/';
const encoded = await capturePreview(serverUrl, repoMp4, repoWav);
if (encoded) await fs.copyFile(repoMp4, downloadMp4);
if (await fs.stat(repoWav).then(() => true).catch(() => false)) await fs.copyFile(repoWav, downloadWav);
if (encoded) await fs.copyFile(repoMp4, path.join(projectDist, 'orr-biologicals-algae-growth.mp4'));
if (await fs.stat(repoWav).then(() => true).catch(() => false)) await fs.copyFile(repoWav, path.join(projectDist, 'orr-biologicals-algae-growth-voiceover.wav'));

if (await fs.stat(repoWav).then(() => true).catch(() => false)) {
  const audioStandalone = embedVoiceover(standalone, await fs.readFile(repoWav));
  await Promise.all([
    fs.writeFile(repoHtml, audioStandalone),
    fs.writeFile(downloadHtml, audioStandalone),
    fs.writeFile(path.join(projectDist, 'orr-biologicals-algae-growth.html'), audioStandalone),
  ]);
}

console.log(`Standalone HTML: ${repoHtml}`);
console.log(`Downloads HTML: ${downloadHtml}`);
console.log(`Downloads source bundle: ${downloadProject}`);
if (encoded) console.log(`MP4 preview: ${downloadMp4}`);
