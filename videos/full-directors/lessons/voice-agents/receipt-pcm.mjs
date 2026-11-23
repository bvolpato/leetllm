import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {pcmEnvelope} from 'vizmatic';
import queue from './recorded-queue.json' with {type: 'json'};
import {interrupt} from '../../../films/voice-agents/fixtures.mjs';

// Only a pipeline that owns the scheduled take calls this optional hook.
export function prepareReceiptPicture(schedule) {
  const hotline = schedule.find(entry => entry.beat.id === 'receipt-hotline');
  if (!hotline?.audio) return undefined;
  assert.equal(hotline.beat.say, interrupt.retained + '.');
  assert.equal(queue.text, interrupt.discarded);
  const sampleRate = queue.sampleRate;
  const bytes = execFileSync('ffmpeg', ['-nostdin', '-v', 'error', '-xerror', '-i', hotline.audio,
    '-map', '0:a:0', '-ac', '1', '-ar', String(sampleRate), '-f', 's16le', '-']);
  const samples = Float32Array.from({length: bytes.length / 2}, (_, i) => bytes.readInt16LE(2*i) / 32768);
  const audible = sample => Math.abs(sample) >= queue.floor;
  const first = samples.findIndex(audible);
  const end = samples.findLastIndex(audible) + 1;
  assert.ok(first >= 0 && first < end, 'Expected recorded speech in the scheduled hotline take.');
  const speaker = pcmEnvelope(samples.subarray(first, end), {sampleRate, bins: Math.ceil((end - first) / 180)});
  return {first, end, sampleRate, speaker, queue};
}

export function drawReceiptPCM(ctx, picture, elapsed, left, edge, right, y) {
  const {first, end, sampleRate, speaker, queue} = picture;
  const played = Math.min(end - first, Math.max(0, elapsed * sampleRate - first));
  function drawPeaks(peaks, x, width, visible, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let i = 0; i < visible; i++) ctx.lineTo(x + (i + 0.5) * width / peaks.length, y - peaks[i].max * 65);
    for (let i = visible - 1; i >= 0; i--) ctx.lineTo(x + (i + 0.5) * width / peaks.length, y - peaks[i].min * 65);
    ctx.closePath();
    ctx.fill();
  }
  drawPeaks(speaker.bins, left, edge-left, speaker.bins.filter(bin => bin.endSample <= played).length, '#255770');
  drawPeaks(queue.peaks.map(([min,max]) => ({min:min/32768,max:max/32768})), edge+24, right-edge-24,
    queue.peaks.length, '#a393a0');
}
