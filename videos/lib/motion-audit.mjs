import { resolveSceneCues } from './narration-cues.mjs';

export const MOTION_SAMPLE_PROGRESS = Object.freeze([0.12, 0.5, 0.88]);
export const MOTION_CHANNEL_DELTA = 12;
export const MOTION_MINIMUM_PIXELS = 32;
export const MOTION_SCOPE =
  'Pixel change inside an explicitly declared teaching region. This does not verify semantic correctness, causal explanation, meaningful object motion, or aesthetics.';

export function validateMotionCheck(value, width = 1920, height = 1080) {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.keys(value).some((key) => !['region', 'minimumChangedFraction'].includes(key))
  ) {
    throw new Error('motion_check must contain region and optional minimumChangedFraction');
  }
  if (![width, height].every((n) => Number.isInteger(n) && n > 0))
    throw new Error('Invalid motion canvas dimensions');
  const region = value.region;
  if (
    !Array.isArray(region) ||
    region.length !== 4 ||
    !Array.from(region).every(Number.isInteger)
  ) {
    throw new Error(
      'motion_check.region must be four integer pixel coordinates [x, y, width, height]',
    );
  }
  const [x, y, w, h] = region;
  if (x < 0 || y < 0 || w <= 0 || h <= 0 || x + w > width || y + h > height) {
    throw new Error(`motion_check.region must fit inside ${width}×${height}`);
  }
  const minimumChangedFraction =
    value.minimumChangedFraction === undefined ? 0.002 : value.minimumChangedFraction;
  if (
    !Number.isFinite(minimumChangedFraction) ||
    minimumChangedFraction <= 0 ||
    minimumChangedFraction > 1
  ) {
    throw new Error(
      'motion_check.minimumChangedFraction must be a number greater than zero and at most one',
    );
  }
  return { region: [...region], minimumChangedFraction };
}

function validateFrame(frame) {
  if (
    !frame ||
    ![frame.width, frame.height].every((n) => Number.isInteger(n) && n > 0) ||
    !(frame.data instanceof Uint8Array) ||
    frame.data.length !== frame.width * frame.height * 3
  ) {
    throw new Error(
      'Motion frames must contain complete RGB24 pixel data and positive integer dimensions',
    );
  }
}

export function compareMotionRegion(before, after, declaration) {
  validateFrame(before);
  validateFrame(after);
  if (before.width !== after.width || before.height !== after.height)
    throw new Error('Motion frame dimensions differ');
  const { region, minimumChangedFraction } = validateMotionCheck(
    declaration,
    before.width,
    before.height,
  );
  const [x, y, width, height] = region;
  let changedPixels = 0;
  for (let row = y; row < y + height; row++) {
    for (let column = x; column < x + width; column++) {
      const offset = (row * before.width + column) * 3;
      if (
        Math.abs(before.data[offset] - after.data[offset]) >= MOTION_CHANNEL_DELTA ||
        Math.abs(before.data[offset + 1] - after.data[offset + 1]) >= MOTION_CHANNEL_DELTA ||
        Math.abs(before.data[offset + 2] - after.data[offset + 2]) >= MOTION_CHANNEL_DELTA
      ) {
        changedPixels++;
      }
    }
  }
  const regionPixels = width * height,
    changedFraction = changedPixels / regionPixels;
  return {
    changedPixels,
    regionPixels,
    changedFraction,
    passed: changedPixels >= MOTION_MINIMUM_PIXELS && changedFraction >= minimumChangedFraction,
  };
}

export function evaluateMotionFrames(frames, declaration) {
  if (!Array.isArray(frames) || frames.length !== MOTION_SAMPLE_PROGRESS.length)
    throw new Error('A motion check requires exactly three sampled frames');
  const pairs = [
    [0, 1],
    [1, 2],
    [0, 2],
  ].map(([from, to]) => ({
    from,
    to,
    ...compareMotionRegion(frames[from], frames[to], declaration),
  }));
  return { passed: pairs.some((pair) => pair.passed), pairs };
}

const close = (a, b) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= 1e-7;
const owns = (value, key) => Object.hasOwn(value, key);

export function validateMotionTimeline(lesson, timeline) {
  const fail = (detail) => {
    throw new Error(`${lesson.id}: stale or invalid measured timeline: ${detail}`);
  };
  if (
    timeline?.id !== lesson.id ||
    timeline.width !== 1920 ||
    timeline.height !== 1080 ||
    !Number.isInteger(timeline.fps) ||
    timeline.fps < 1 ||
    timeline.fps > 60 ||
    !Array.isArray(timeline.scenes) ||
    timeline.scenes.length !== lesson.scenes.length
  )
    fail('lesson identity or native geometry differs');
  let cursor = 0,
    frames = 0,
    narratedBeats = 0;
  if (timeline.intro) {
    const intro = timeline.intro;
    if (
      intro.start !== 0 ||
      intro.fps !== timeline.fps ||
      !Number.isInteger(intro.frames) ||
      intro.frames <= 0 ||
      !close(intro.duration, intro.frames / timeline.fps)
    )
      fail('invalid intro');
    cursor = intro.duration;
    frames += intro.frames;
  }
  const checks = [];
  for (const [sceneIndex, timing] of timeline.scenes.entries()) {
    const scene = lesson.scenes[sceneIndex];
    if (scene.beats.some((beat) => beat.visual_cues?.length)) {
      const resolved = resolveSceneCues(scene, timing);
      if (
        timing.cueTiming !== 'provider-words' ||
        JSON.stringify(timing.visualCues) !== JSON.stringify(resolved)
      )
        fail(`${scene.id}: narration cue bindings differ`);
    }
    if (
      timing.id !== scene.id ||
      timing.fps !== timeline.fps ||
      !close(timing.start, cursor) ||
      !Number.isInteger(timing.frames) ||
      timing.frames <= 0 ||
      !close(timing.duration, timing.frames / timeline.fps) ||
      !Array.isArray(timing.beats) ||
      timing.beats.length !== scene.beats.length
    )
      fail(`${scene.id}: scene geometry differs`);
    let previousUntil = 0;
    for (const [beatIndex, voice] of timing.beats.entries()) {
      const beat = scene.beats[beatIndex],
        hold = beat.hold ?? 0.45;
      if (
        voice.say !== beat.say ||
        (voice.hold ?? 0.45) !== hold ||
        ![voice.start, voice.end, voice.until, voice.duration].every(Number.isFinite) ||
        voice.start < previousUntil ||
        voice.end <= voice.start ||
        voice.until > timing.duration ||
        !close(voice.duration, voice.end - voice.start) ||
        !close(voice.until, voice.end + hold)
      )
        fail(`${scene.id}/${beatIndex}: narration or beat timing differs`);
      previousUntil = voice.until;
      narratedBeats++;
      const declared = owns(beat, 'motion_check'),
        recorded = owns(voice, 'motion_check');
      const check = declared ? validateMotionCheck(beat.motion_check) : null;
      const recordedCheck = recorded ? validateMotionCheck(voice.motion_check) : null;
      if (declared !== recorded || JSON.stringify(check) !== JSON.stringify(recordedCheck))
        fail(`${scene.id}/${beatIndex}: motion declaration differs`);
      if (check) {
        const samples = MOTION_SAMPLE_PROGRESS.map((progress) => {
          const requestedTime = timing.start + voice.start + progress * (voice.until - voice.start);
          const frame = Math.round(requestedTime * timeline.fps);
          return { progress, requestedTime, frame, time: frame / timeline.fps };
        });
        checks.push({ scene: scene.id, sceneIndex, beat: beatIndex, ...check, samples });
      }
    }
    cursor += timing.duration;
    frames += timing.frames;
  }
  if (!close(timeline.duration, cursor) || !close(timeline.duration * timeline.fps, frames))
    fail('total duration or frame count differs');
  if (
    checks.some((check) =>
      check.samples.some((sample) => sample.frame < 0 || sample.frame >= frames),
    )
  )
    fail('sample lies outside movie');
  return { checks, narratedBeats, frames };
}

export function validateMotionReceipt(
  lesson,
  timeline,
  receipt,
  { movieSha256, timelineSha256, frames },
) {
  const fail = () => {
    throw new Error(`${lesson.id}: missing, stale, or mismatched movie verification receipt`);
  };
  const sha = (value) => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
  const fps =
    typeof receipt?.fps === 'number'
      ? receipt.fps
      : /^\d+\/\d+$/.test(receipt?.fps ?? '')
        ? receipt.fps
            .split('/')
            .map(Number)
            .reduce((a, b) => a / b)
        : NaN;
  if (
    receipt?.id !== lesson.id ||
    receipt.source !== lesson.source ||
    receipt.fullDecode !== 'passed' ||
    receipt.width !== timeline.width ||
    receipt.height !== timeline.height ||
    fps !== timeline.fps ||
    !Number.isFinite(receipt.duration) ||
    Math.abs(receipt.duration - timeline.duration) > 0.15 ||
    receipt.scenes !== timeline.scenes.length ||
    receipt.frameAudit?.passed !== true ||
    receipt.frameAudit.frames !== frames ||
    !sha(movieSha256) ||
    !sha(timelineSha256) ||
    !sha(receipt.fingerprint) ||
    receipt.sha256 !== movieSha256 ||
    receipt.artifactSha256?.[`${lesson.id}.mp4`] !== movieSha256 ||
    receipt.artifactSha256?.['timeline.json'] !== timelineSha256
  )
    fail();
}
