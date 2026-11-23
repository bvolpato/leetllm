import { bandwidthPoint, reservation } from './arithmetic.mjs';
import { GiB, bytesPerToken, hardware, pool, tracks } from './fixtures.mjs';
export const clamp = (value) => Math.max(0, Math.min(1, value));
export const progress = (p) => clamp((p - 0.15) / 0.6);
export function sampleModel(sceneId, state) {
  const { step } = tracks[sceneId].sample(state).snapshot;
  const p = progress(state.beatP ?? 0);
  if (sceneId === 'growth') {
    const construction = Math.min(1, p / 0.55),
      prompt = step === 2 ? 4096 + Math.round(12288 * construction) : 4096,
      output = step === 0 ? 0 : step === 1 ? Math.round(1024 * construction) : 1024;
    const request = reservation(prompt, output),
      capacity = Math.floor(pool / request.bytes);
    return {
      step,
      p,
      request,
      capacity,
      used: capacity * request.bytes,
      remaining: pool - capacity * request.bytes,
    };
  }
  if (sceneId === 'pages') {
    const rows = [4090, 4096, 4100].slice(0, step + 1).map((prompt, i) => ({
      id: `R${String.fromCharCode(65 + i)}`,
      ...reservation(prompt, 512),
    }));
    return {
      step,
      p,
      rows,
      slots: rows.reduce((sum, row) => sum + row.slots, 0),
      logical: rows.reduce((sum, row) => sum + row.logical, 0),
      waste: rows.reduce((sum, row) => sum + row.slots - row.logical, 0),
    };
  }
  if (sceneId === 'bandwidth') {
    const batch =
      step === 0 ? 1 : step === 1 ? 1 + Math.floor(7 * p + 1e-9) : 8 + Math.floor(16 * p + 1e-9);
    return {
      step,
      p,
      ...bandwidthPoint(batch),
    };
  }
  if (sceneId === 'operating-point') {
    const tested = step === 2 ? 5 : Math.floor(5 * Math.min(1, p / 0.65));
    const rows = [1, 8, 16, 24, 32].map((batch, index) => {
      const point = bandwidthPoint(batch);
      return {
        ...point,
        memoryPass: point.reserved <= pool,
        latencyPass: point.ms <= 40,
        memoryTested: step > 0 || index < tested,
        latencyTested: step === 2 || (step === 1 && index < tested),
      };
    });
    const selected =
      rows
        .filter(
          (row) =>
            row.memoryTested &&
            row.memoryPass &&
            (step === 0 || (row.latencyTested && row.latencyPass)),
        )
        .at(-1) ?? null;
    return {
      step,
      p,
      rows,
      tested,
      selected,
      costPerMillion: selected ? (2 / (selected.tps * 3600)) * 1e6 : null,
    };
  }
  const batch =
    sceneId === 'intro'
      ? step === 0
        ? 1 + Math.floor(3 * p)
        : step === 1
          ? 4 + Math.floor(12 * p)
          : 16
      : 16;
  const allocated = Math.min(1, p / 0.45);
  return {
    step,
    p,
    batch,
    ...bandwidthPoint(batch),
    payload: batch * 4096 * bytesPerToken,
    weights:
      sceneId === 'partition' && step === 0 ? Math.floor(12 * allocated) * GiB : hardware.weights,
    runtime:
      sceneId === 'partition'
        ? step === 0
          ? 0
          : step === 1
            ? Math.floor(4 * allocated) * GiB
            : hardware.runtime
        : hardware.runtime,
    allocatedPool:
      sceneId === 'partition' ? (step === 2 ? Math.floor(16 * allocated) * GiB : 0) : pool,
  };
}
export function capacityEvent(scene, state, name, beat) {
  const cue = state.cues?.['ic-' + scene.id + '-' + name];
  if (cue) return cue.phase === 'before' ? 0 : cue.phase === 'after' ? 1 : clamp(cue.progress ?? 0);
  return (state.beat ?? 0) < beat
    ? 0
    : (state.beat ?? 0) > beat
      ? 1
      : clamp(((state.beatP ?? 0) - 0.08) / 0.8);
}
