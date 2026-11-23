import { drawFrame } from './scene.mjs';
import { frameState } from './lesson.mjs';
import { createPaintedTextCapture } from './painted-text.mjs';

export const LABEL_SAMPLE_PROGRESS = Object.freeze([0.12, 0.5, 0.88]);
export const LABEL_COLLISION_RULE = Object.freeze({
  minimumAlpha: 0.25,
  minimumOverlapWidth: 2,
  minimumOverlapHeight: 2,
  minimumSmallerAreaFraction: 0.04,
  minimumInkAlpha: 64,
  identicalPositionTolerance: 1,
});
export const LABEL_COLLISION_SCOPE =
  'Current-source registered text-label intersections sampled at 12%, 50%, and 88% of each narrated beat on a native 1920x1080 canvas. When both labels have live glyph masks, candidates require shared glyph pixels; labels without both masks use the bounds-area threshold. Intersections are diagnostic candidates requiring visual judgment. This does not establish later raster occlusion, encoded-video quality, or every-frame coverage.';
export const LABEL_COLLISION_ALL_FRAME_SCOPE =
  'Current-source registered text-label intersections on every authored scene frame of a native 1920x1080 canvas. Coverage follows each reported measured or estimated timeline. Brand frames are excluded. When both labels have live glyph masks, candidates require shared glyph pixels; labels without both masks use the bounds-area threshold. Intersections are diagnostic candidates requiring visual judgment. This does not establish later raster occlusion or encoded-video quality.';

function visibleLabel(label) {
  if (!label || typeof label.text !== 'string') throw new Error('A registered label needs text');
  const alpha = label.alpha ?? 1;
  if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1)
    throw new Error('Label alpha must be between zero and one');
  if (!label.text.trim() || alpha <= LABEL_COLLISION_RULE.minimumAlpha) return null;
  for (const key of ['x', 'y', 'width', 'height']) {
    if (!Number.isFinite(label[key])) throw new Error(`Label ${key} must be finite`);
  }
  if (label.width <= 0 || label.height <= 0) return null;
  return {
    text: label.text,
    x: label.x,
    y: label.y,
    width: label.width,
    height: label.height,
    alpha,
    ...(label.ink === undefined ? {} : { ink: label.ink }),
    ...(label.order === undefined ? {} : { order: label.order }),
    ...(label.id === undefined ? {} : { id: label.id }),
  };
}

function usableInkMask(mask) {
  if (
    !mask ||
    !Number.isInteger(mask.width) ||
    mask.width < 1 ||
    !Number.isInteger(mask.height) ||
    mask.height < 1 ||
    !mask.data ||
    mask.data.length < mask.width * mask.height ||
    ![
      mask.origin?.x,
      mask.origin?.y,
      mask.axisX?.x,
      mask.axisX?.y,
      mask.axisY?.x,
      mask.axisY?.y,
    ].every(Number.isFinite)
  )
    return false;
  const determinant = mask.axisX.x * mask.axisY.y - mask.axisX.y * mask.axisY.x;
  return Number.isFinite(determinant) && determinant !== 0;
}

function inkAt(label, x, y) {
  const mask = label.ink,
    dx = x - mask.origin.x,
    dy = y - mask.origin.y;
  const determinant = mask.axisX.x * mask.axisY.y - mask.axisX.y * mask.axisY.x;
  const maskX = Math.floor((dx * mask.axisY.y - dy * mask.axisY.x) / determinant);
  const maskY = Math.floor((dy * mask.axisX.x - dx * mask.axisX.y) / determinant);
  return (
    maskX >= 0 &&
    maskY >= 0 &&
    maskX < mask.width &&
    maskY < mask.height &&
    mask.data[maskY * mask.width + maskX] >= LABEL_COLLISION_RULE.minimumInkAlpha
  );
}

function sharedInkPixels(a, b, bounds) {
  let pixels = 0;
  for (let pixelY = Math.floor(bounds.y); pixelY < Math.ceil(bounds.y + bounds.height); pixelY++) {
    const y = pixelY + 0.5;
    if (y < bounds.y || y >= bounds.y + bounds.height) continue;
    for (let pixelX = Math.floor(bounds.x); pixelX < Math.ceil(bounds.x + bounds.width); pixelX++) {
      const x = pixelX + 0.5;
      if (x >= bounds.x && x < bounds.x + bounds.width && inkAt(a, x, y) && inkAt(b, x, y))
        pixels++;
    }
  }
  return pixels;
}

function reportLabel({ ink, ...label }) {
  return label;
}

export function findLabelCollisions(labels) {
  if (!Array.isArray(labels)) throw new Error('Registered labels must be an array');
  const visible = labels.map(visibleLabel).filter(Boolean);
  const candidates = [];
  for (let i = 0; i < visible.length; i++) {
    for (let j = i + 1; j < visible.length; j++) {
      const a = visible[i],
        b = visible[j],
        rule = LABEL_COLLISION_RULE;
      if (
        a.text === b.text &&
        Math.abs(a.x - b.x) < rule.identicalPositionTolerance &&
        Math.abs(a.y - b.y) < rule.identicalPositionTolerance
      )
        continue;
      const x = Math.max(a.x, b.x),
        y = Math.max(a.y, b.y);
      const width = Math.min(a.x + a.width, b.x + b.width) - x;
      const height = Math.min(a.y + a.height, b.y + b.height) - y;
      if (width <= rule.minimumOverlapWidth || height <= rule.minimumOverlapHeight) continue;
      const area = width * height,
        smallerLabelArea = Math.min(a.width * a.height, b.width * b.height);
      const fraction = area / smallerLabelArea;
      const hasBothInkMasks = usableInkMask(a.ink) && usableInkMask(b.ink);
      const inkPixels = hasBothInkMasks ? sharedInkPixels(a, b, { x, y, width, height }) : null;
      if (hasBothInkMasks ? inkPixels === 0 : fraction <= rule.minimumSmallerAreaFraction) continue;
      candidates.push({
        type: 'label-intersection',
        labels: [reportLabel(a), reportLabel(b)],
        overlap: {
          x,
          y,
          width,
          height,
          area,
          smallerLabelArea,
          fraction,
          ...(hasBothInkMasks ? { inkPixels } : {}),
        },
      });
    }
  }
  return candidates;
}

export function findLabelCrowding(labels) {
  const pair = (candidate) =>
    JSON.stringify(
      candidate.labels
        .map((label) => JSON.stringify([label.text, label.x, label.y, label.width, label.height]))
        .sort(),
    );
  const intersections = new Set(findLabelCollisions(labels).map(pair));
  return findLabelCollisions(labels.map(({ ink, ...label }) => label))
    .filter((candidate) => !intersections.has(pair(candidate)))
    .map((candidate) => ({ ...candidate, type: 'label-crowding' }));
}

export function auditSceneLabels({
  canvas,
  lesson,
  scene,
  timing,
  draw,
  sceneIndex,
  sceneCount,
  allFrames = false,
  paintedText = false,
}) {
  if (
    canvas?.width !== 1920 ||
    canvas?.height !== 1080 ||
    typeof canvas.getContext !== 'function'
  ) {
    throw new Error('Label sampling requires a native 1920x1080 canvas');
  }
  if (
    !scene ||
    !timing ||
    typeof draw !== 'function' ||
    timing.beats?.length !== scene.beats?.length
  ) {
    throw new Error('A scene, matching beat timeline, and draw function are required');
  }
  if (
    allFrames &&
    (!Number.isInteger(timing.frames) ||
      timing.frames < 1 ||
      !Number.isFinite(timing.fps) ||
      timing.fps <= 0 ||
      !Number.isFinite(timing.duration) ||
      Math.abs(timing.frames / timing.fps - timing.duration) > 1e-7)
  ) {
    throw new Error(
      'Every-frame label inspection requires consistent frame count, duration and frame rate',
    );
  }
  const selections = allFrames
    ? Array.from({ length: timing.frames }, (_, frame) => ({
        frame,
        localTime: frame / timing.fps,
      }))
    : timing.beats.flatMap((beat, beatIndex) =>
        LABEL_SAMPLE_PROGRESS.map((progress) => ({
          beatIndex,
          progress,
          localTime: beat.start + (beat.until - beat.start) * progress,
        })),
      );
  const samples = [],
    warnings = [];
  const capture = paintedText ? createPaintedTextCapture(canvas.getContext('2d')) : null;
  for (const selection of selections) {
    const { localTime, frame } = selection;
    const state = frameState(timing, localTime, sceneIndex, sceneCount);
    const beatIndex = allFrames ? state.beat : selection.beatIndex;
    const progress = allFrames ? state.beatP : selection.progress;
    capture?.reset();
    const audit = drawFrame(
      capture?.context ?? canvas.getContext('2d'),
      lesson,
      scene,
      state,
      draw,
    );
    const labels = capture
      ? [...capture.labels, ...audit.labels.filter((label) => label.kind === 'math')]
      : audit.labels;
    const sample = {
      sampleId: allFrames
        ? `${scene.id}:f${frame}`
        : `${scene.id}:b${beatIndex + 1}:p${Math.round(progress * 100)}`,
      beat: beatIndex,
      progress,
      time: (timing.start ?? 0) + localTime,
      ...(allFrames ? { frame } : {}),
    };
    const candidates = [
      ...findLabelCollisions(labels),
      ...(capture ? findLabelCrowding(labels) : []),
      ...(capture?.issues ?? []),
    ];
    samples.push({ ...sample, registeredLabels: labels.length, candidates: candidates.length });
    warnings.push(...candidates.map((candidate) => ({ ...candidate, ...sample })));
  }
  return {
    scene: scene.id,
    coverage: allFrames ? 'all-authored-scene-frames' : 'sampled-authored-scene-frames',
    paintedText,
    ...(capture ? { captureCache: capture.cacheStats() } : {}),
    sampledFrames: samples.length,
    issueFrames: samples.filter((sample) => sample.candidates > 0).length,
    warnings,
    samples,
  };
}
