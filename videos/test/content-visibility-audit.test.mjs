import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  areaDownsampleGrayscale,
  evaluateGrayscaleVisibility,
  evaluateContentVisibility,
  sceneVisibilitySamples,
  classifyVisibilitySamples,
  preparedVisibilityBinding,
} from '../audit-content-visibility.mjs';
import { createHash } from 'node:crypto';
import { DecodedFrameAudit } from '../inspect.mjs';

const rgbaFrame = (width, height, gray = 16) => {
  const data = new Uint8Array(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = data[i + 1] = data[i + 2] = gray;
    data[i + 3] = 255;
  }
  return data;
};
const rect = (data, width, x, y, w, h, gray) => {
  for (let row = y; row < y + h; row++)
    for (let col = x; col < x + w; col++) {
      const i = (row * width + col) * 4;
      data[i] = data[i + 1] = data[i + 2] = gray;
    }
};

test('dark content and dim small glyphs fail the encoded foreground rule', () => {
  const data = rgbaFrame(1920, 1080);
  assert.equal(evaluateContentVisibility(data).belowEncodedThreshold, true);
  for (let i = 0; i < 15; i++) rect(data, 1920, 350 + i * 15, 400, 5, 12, 65);
  // Native glyph pixels are bright enough individually; area averaging makes
  // their small, dim footprint fall below the actual 320x180 foreground gate.
  const result = evaluateContentVisibility(data);
  assert.equal(result.belowEncodedThreshold, true);
  assert(result.foregroundFraction < 0.001);
});

test('area averaging rejects isolated bright native pixels instead of point-sampling them', () => {
  const data = rgbaFrame(1920, 1080);
  for (let y = 210; y < 900; y += 6)
    for (let x = 120; x < 1800; x += 6) rect(data, 1920, x, y, 1, 1, 255);
  const result = evaluateContentVisibility(data);
  assert.equal(result.foregroundPixels, 0);
  assert.equal(result.belowEncodedThreshold, true);
});

test('readable content clears the gate, while a bright heading alone does not', () => {
  const data = rgbaFrame(1920, 1080);
  rect(data, 1920, 100, 70, 1500, 55, 230);
  assert.equal(evaluateContentVisibility(data).belowEncodedThreshold, true);
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 15; col++) {
      rect(data, 1920, 420 + col * 24, 400 + row * 32, 12, 20, 220);
    }
  assert.equal(evaluateContentVisibility(data).belowEncodedThreshold, false);
});

test('fraction, strict gray threshold, ROI, and rounding match DecodedFrameAudit', () => {
  const pixels = new Uint8Array(320 * 180).fill(16);
  for (let x = 17; x < 80; x++) pixels[50 * 320 + x] = x < 35 ? 48 : 49;
  const result = evaluateGrayscaleVisibility(pixels);
  const audit = new DecodedFrameAudit({ fps: 30, scenes: [] });
  audit.observe(pixels);
  assert.equal(result.foregroundFraction, audit.metrics[0][3]);
  assert.equal(result.foregroundPixels, 45);
  assert.deepEqual(result.roi, { left: 16, right: 304, top: 33, bottom: 165 });
  assert.equal(result.belowEncodedThreshold, audit.metrics[0][3] < 0.001);
});

test('fractional area scales average covered pixels and malformed frames fail clearly', () => {
  const data = rgbaFrame(3, 1, 0);
  rect(data, 3, 1, 0, 1, 1, 240);
  assert.deepEqual([...areaDownsampleGrayscale(data, 3, 1, 2, 1)], [80, 80]);
  assert.throws(() => areaDownsampleGrayscale(data.subarray(1), 3, 1), /Invalid RGBA/);
  assert.throws(() => evaluateGrayscaleVisibility(new Uint8Array(1)), /Invalid grayscale/);
});

test('samples preserve scene entrance behavior and avoid both legitimate fades', () => {
  const samples = sceneVisibilitySamples({
    fps: 30,
    frames: 90,
    duration: 3,
    beats: [{ start: 0.4, until: 2.7 }],
  });
  assert.deepEqual(
    samples.map((sample) => sample.requestedTime),
    [0.5, 0.75, 1, 1.5, 2],
  );
  assert(samples.every((sample) => sample.time > 0.45 && 3 - sample.time > 0.35));
  assert.deepEqual(samples[0].knownTransitions, ['beat-0-start']);
  assert.deepEqual(sceneVisibilitySamples({ fps: 30, frames: 24, duration: 0.8, beats: [] }), []);
});

test('isolated and beat-transition misses advise; repeated neighboring non-transition misses block', () => {
  const miss = { belowEncodedThreshold: true, deficitPercent: 100, knownTransitions: [] };
  const visible = { belowEncodedThreshold: false, deficitPercent: 0, knownTransitions: [] };
  assert.equal(classifyVisibilitySamples([miss, visible, miss]).status, 'review-needed');
  assert.equal(
    classifyVisibilitySamples([{ ...miss, knownTransitions: ['beat-0-start'] }, miss]).status,
    'review-needed',
  );
  assert.equal(classifyVisibilitySamples([visible, miss, miss]).status, 'source-preflight-block');
  assert.equal(classifyVisibilitySamples([visible, visible]).status, 'sampled-visible');
});

test('prepared timing requires complete matching audio evidence; movie progress cannot stale that binding', () => {
  const bytes = Buffer.from(
    JSON.stringify({
      id: 'fixture',
      scenes: [
        { sounds: [{ key: 'speech', audioHash: 'audio-hash', boundariesHash: 'words-hash' }] },
      ],
    }),
  );
  const sha = createHash('sha256').update(bytes).digest('hex');
  const batch = {
    lessons: [
      {
        id: 'fixture',
        phases: {
          audio: {
            status: 'complete',
            evidence: {
              timeline: sha,
              files: { 'timeline.json': sha },
              sounds: [{ key: 'speech', audio: 'audio-hash', boundaries: 'words-hash' }],
            },
          },
          video: { status: 'running' },
        },
      },
    ],
  };
  const binding = preparedVisibilityBinding(batch, 'fixture', bytes);
  batch.lessons[0].phases.video.status = 'complete';
  assert.equal(
    preparedVisibilityBinding(batch, 'fixture', bytes).audioPhaseEvidenceSha256,
    binding.audioPhaseEvidenceSha256,
  );
  batch.lessons[0].phases.audio.evidence.sounds[0].boundaries = 'tampered';
  assert.throws(() => preparedVisibilityBinding(batch, 'fixture', bytes), /speech hashes differ/);
  batch.lessons[0].phases.audio.status = 'running';
  assert.throws(
    () => preparedVisibilityBinding(batch, 'fixture', bytes),
    /lacks a completed, matching timeline receipt/,
  );
});
