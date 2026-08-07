import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { spawn } from 'child_process';
import fs from 'fs';
import fsp from 'fs/promises';
import os from 'os';
import path from 'path';

dotenv.config();

// IMPORTANT (proot-distro): bind to all interfaces explicitly.
// Binding to 'localhost' or '127.0.0.1' can resolve to an unexpected
// loopback/ipv6 address inside proot distro and reject connections.
const HOST = process.env.VISUALIZER_HOST || '0.0.0.0';
const PORT = Number(process.env.VISUALIZER_PORT || 8080);

const FFMPEG = process.env.FFMPEG_PATH || '/usr/bin/ffmpeg';
const FFPROBE = process.env.FFPROBE_PATH || '/usr/bin/ffprobe';

// Target total video size. Telegram's multipart upload cap for sendVideo is
// 50 MB; this budget leaves a healthy margin while allowing high quality.
const MAX_FILE_BYTES = 43 * 1024 * 1024;

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[VISUALIZER] ${req.method} ${req.url}`);
  next();
});

async function downloadFile(url: string, dest: string): Promise<void> {
  const response = await axios({
    method: 'get',
    url,
    responseType: 'arraybuffer',
    timeout: 120000,
  });
  await fsp.writeFile(dest, Buffer.from(response.data));
}

function getDuration(file: string): Promise<number> {
  return new Promise((resolve) => {
    const proc = spawn(FFPROBE, [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'csv=p=0',
      file,
    ], { stdio: ['ignore', 'pipe', 'ignore'] });
    let out = '';
    proc.stdout?.on('data', (chunk) => { out += chunk.toString(); });
    proc.on('close', () => {
      const d = parseFloat(out.trim());
      resolve(Number.isFinite(d) && d > 0 ? d : 0);
    });
    proc.on('error', () => resolve(0));
  });
}

// Pick an encode profile that keeps the total file under MAX_FILE_BYTES for
// ANY audio length, while giving the highest quality the budget supports:
// up to 1080p/30fps with a high bitrate on short clips and normal songs,
// gracefully downscaling only for very long audio.
function buildEncodePlan(durationSec: number) {
  const audioKbps = 192;
  const fps = 30;
  const duration = durationSec > 0 ? durationSec : 240;

  let videoKbps =
    (MAX_FILE_BYTES * 8 - audioKbps * 1000 * duration) / (duration * 1000);
  videoKbps = Math.max(900, Math.min(12000, videoKbps));

  let width = 1920;
  let height = 1080;
  if (videoKbps < 7000) { width = 1280; height = 720; }
  if (videoKbps < 2200) { width = 960; height = 540; }
  if (videoKbps < 1300) { width = 854; height = 480; }
  if (videoKbps < 900) { width = 640; height = 360; }

  return {
    width,
    height,
    fps,
    videoKbps: Math.round(videoKbps),
    audioKbps,
  };
}

function runFfmpeg(
  inputPath: string,
  outputPath: string,
  plan: ReturnType<typeof buildEncodePlan>,
): Promise<void> {
  return new Promise((resolve, reject) => {
const { width, height, fps, videoKbps, audioKbps } = plan;
    const size = `${width}x${height}`;
    const args = [
      '-y',
      '-i', inputPath,
      '-filter_complex',
      `color=c=#000011:r=${fps}:s=${size}:d=1[bg];` +
        `[0:a]showwaves=s=${size}:mode=cline:rate=${fps}:colors=0x4da6ff[fg];` +
        '[bg][fg]overlay=shortest=0:format=auto[out]',
      '-map', '[out]',
      '-map', '0:a',
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-b:v', `${videoKbps}k`,
      '-maxrate', `${Math.round(videoKbps * 1.15)}k`,
      '-bufsize', `${Math.round(videoKbps * 1.5)}k`,
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', `${audioKbps}k`,
      '-shortest',
      outputPath,
    ];

    const proc = spawn(FFMPEG, args, { stdio: ['ignore', 'inherit', 'pipe'] });
    let errLog = '';
    proc.stderr?.on('data', (chunk) => {
      errLog += chunk.toString();
    });
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`ffmpeg exited with code ${code}: ${errLog.slice(-2000)}`));
      }
    });
    proc.on('error', (err) => reject(err));
  });
}

app.post('/generate', async (req: any, res: any) => {
  const { audioUrl, chatId } = req.body || {};

  if (!audioUrl || typeof audioUrl !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "audioUrl" in JSON body.' });
  }

  const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'vis-'));
  const inputPath = path.join(tmpDir, 'input.bin');
  const outputPath = path.join(tmpDir, 'output.mp4');

  try {
    console.log(`Downloading audio for chat ${chatId}: ${audioUrl}`);
    await downloadFile(audioUrl, inputPath);

    if (chatId != null) console.log(`Rendering visualization for chat ${chatId}`);
    const duration = await getDuration(inputPath);
    const plan = buildEncodePlan(duration);
    console.log(`[${String(chatId ?? '')}] duration=${duration}s → ` +
      `${plan.width}x${plan.height}@${plan.fps}fps ${plan.videoKbps}kbps`);
    await runFfmpeg(inputPath, outputPath, plan);

    const stat = await fsp.stat(outputPath);
    // Telegram caps multipart uploads at 50 MB; stay well under it.
    if (stat.size > 48 * 1024 * 1024) {
      const msg = 'Visualization exceeds Telegram\'s 50 MB upload limit. Audio is too long.';
      return res.status(413).json({ error: msg });
    }

    res.set({
      'Content-Type': 'video/mp4',
      'Content-Length': stat.size,
      'X-Visualizer-Chat': String(chatId ?? ''),
    });
    fs.createReadStream(outputPath).pipe(res);
  } catch (error: any) {
    console.error('[VISUALIZER] Generate error:', error?.message || error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate visualization.' });
    } else {
      res.end();
    }
  } finally {
    fsp.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
});

app.listen(PORT, HOST, () => {
  console.log(`Visualizer API listening on ${HOST}:${PORT}`);
});