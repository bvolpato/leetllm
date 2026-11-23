import { drawFrame } from './scene.mjs';
import { frameState } from './lesson.mjs';

export const REVEAL_SAMPLE_PROGRESS = Object.freeze([0.12, 0.5, 0.88]);
export const REVEAL_AUDIT_RULE = 'repeated-native-fillText-zero-globalAlpha';
export const REVEAL_AUDIT_SCOPE =
  'Draw-time native fillText calls sampled at 12%, 50%, and 88% of every narrated beat. Flags stable exact text seen at least three sampled frames across at least two beats when every captured globalAlpha is zero. This diagnostic does not inspect raster visibility, math paths, SVG, strokeText, later occlusion, or encoded video.';

export function captureFillText(ctx) {
  if (!ctx || typeof ctx.fillText !== 'function')
    throw new Error('A native 2D canvas context is required');
  let current = null;
  const methods = new Map();
  const fillText = (...args) => {
    const text = String(args[0] ?? '');
    const alpha = Number(Reflect.get(ctx, 'globalAlpha', ctx));
    if (current) current.push({ text, globalAlpha: Number.isFinite(alpha) ? alpha : null });
    return Reflect.get(ctx, 'fillText', ctx).apply(ctx, args);
  };
  const proxy = new Proxy(ctx, {
    get(target, key) {
      if (key === 'fillText') return fillText;
      const value = Reflect.get(target, key, target);
      if (typeof value !== 'function') return value;
      if (!methods.has(key)) methods.set(key, (...args) => value.apply(target, args));
      return methods.get(key);
    },
    set(target, key, value) {
      return Reflect.set(target, key, value, target);
    },
  });
  return {
    ctx: proxy,
    beginFrame() {
      current = [];
    },
    finishFrame() {
      if (current === null) throw new Error('beginFrame must be called before finishFrame');
      const calls = current;
      current = null;
      return calls;
    },
  };
}

function stableText(text) {
  return text.replace(/\s+/g, ' ').trim();
}

export function summarizeRevealSamples(samples, { minimumSamples = 3, minimumBeats = 2 } = {}) {
  if (
    !Number.isInteger(minimumSamples) ||
    minimumSamples < 1 ||
    !Number.isInteger(minimumBeats) ||
    minimumBeats < 1
  ) {
    throw new Error('Reveal thresholds must be positive integers');
  }
  const groups = new Map();
  for (const sample of samples) {
    for (const call of sample.calls) {
      const text = stableText(call.text);
      if (!text) continue;
      let group = groups.get(text);
      if (!group) {
        group = {
          text,
          calls: 0,
          samples: new Set(),
          beats: new Set(),
          zeroAlphaSamples: new Set(),
          nonzeroAlphaSamples: new Set(),
        };
        groups.set(text, group);
      }
      group.calls++;
      group.samples.add(sample.sampleId);
      group.beats.add(sample.beat);
      if (call.globalAlpha === 0) group.zeroAlphaSamples.add(sample.sampleId);
      else group.nonzeroAlphaSamples.add(sample.sampleId);
    }
  }
  const warnings = [...groups.values()]
    .filter(
      (group) =>
        group.samples.size >= minimumSamples &&
        group.beats.size >= minimumBeats &&
        group.nonzeroAlphaSamples.size === 0 &&
        group.zeroAlphaSamples.size === group.samples.size,
    )
    .map((group) => ({
      type: 'text-never-visible-at-samples',
      text: group.text,
      occurrences: group.calls,
      sampledFrames: group.samples.size,
      sampledBeats: group.beats.size,
      sampleIds: [...group.samples],
      globalAlpha: 0,
    }));
  const lowAlphaCandidates = samples
    .filter((sample) => sample.progress >= 0.5)
    .flatMap((sample) => {
      const dim = sample.calls.filter(
        (call) => stableText(call.text) && call.globalAlpha > 0 && call.globalAlpha < 0.25,
      );
      if (new Set(dim.map((call) => stableText(call.text))).size < 3) return [];
      return [
        {
          type: 'low-alpha-text-cluster',
          sampleId: sample.sampleId,
          beat: sample.beat,
          progress: sample.progress,
          time: sample.time,
          labels: dim.map((call) => ({
            text: stableText(call.text),
            globalAlpha: call.globalAlpha,
          })),
        },
      ];
    });
  return {
    sampledFrames: samples.length,
    fillTextCalls: samples.reduce((sum, sample) => sum + sample.calls.length, 0),
    distinctStableText: groups.size,
    warnings,
    lowAlphaCandidates,
  };
}

export function auditSceneReveals({
  canvas,
  lesson,
  scene,
  timing,
  draw,
  sceneIndex,
  sceneCount,
  sampleProgress = REVEAL_SAMPLE_PROGRESS,
  sceneStart = timing.start ?? 0,
}) {
  if (!canvas?.getContext || !scene || !timing || typeof draw !== 'function')
    throw new Error('A canvas, scene, timing, and draw function are required');
  if (!Array.isArray(timing.beats) || timing.beats.length !== scene.beats?.length)
    throw new Error(`${scene.id}: timing beats differ from the lesson`);
  if (
    !Array.isArray(sampleProgress) ||
    sampleProgress.some((value) => !Number.isFinite(value) || value < 0 || value > 1)
  ) {
    throw new Error('Sample progress values must be finite numbers from 0 through 1');
  }
  const capture = captureFillText(canvas.getContext('2d'));
  const samples = [];
  for (const [beatIndex, beat] of timing.beats.entries()) {
    for (const progress of sampleProgress) {
      const localTime = beat.start + (beat.until - beat.start) * progress;
      const state = frameState(timing, localTime, sceneIndex, sceneCount);
      capture.beginFrame();
      drawFrame(capture.ctx, lesson, scene, state, draw);
      samples.push({
        sampleId: `${scene.id}:b${beatIndex + 1}:p${Math.round(progress * 100)}`,
        beat: beatIndex,
        progress,
        time: sceneStart + localTime,
        calls: capture.finishFrame(),
      });
    }
  }
  const summary = summarizeRevealSamples(samples);
  return {
    scene: scene.id,
    timingSource: timing.timingSource,
    ...summary,
    samples: samples.map(({ calls, ...sample }) => ({ ...sample, fillTextCalls: calls.length })),
  };
}
