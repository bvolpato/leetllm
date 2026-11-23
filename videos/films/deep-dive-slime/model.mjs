import {
  checkpoint,
  goal,
  lp,
  mask,
  old,
  provenance,
  segmentTerms,
  tokens,
  tracks,
} from './fixtures.mjs';
import { cueProgress, phase, sum, uninterrupted, update, xor } from './arithmetic.mjs';
import { applyPatch, patch, syncState, versionedPatch } from './protocols.mjs';
import { sampleSlimeChapter } from './construction.mjs';
import { smoothstep } from 'vizmatic';
export function segmentState(beat, beatP, splitProgress = beatP) {
  const movement = beat === 0 ? 0 : beat > 1 ? 1 : smoothstep(splitProgress);
  const boundary = 2 - movement,
    split = boundary >= 1.5 ? 2 : 1;
  const parts = [segmentTerms.slice(0, split), segmentTerms.slice(split)];
  const denominator = segmentTerms.length,
    contributions = parts.map((part) => sum(part) / denominator);
  return {
    terms: segmentTerms,
    movement,
    boundary,
    split,
    parts,
    denominator,
    contributions,
    result: sum(contributions),
    wrongIndependent: sum(parts.map((part) => sum(part) / part.length)),
    wrongHalved: sum(contributions) / 2,
  };
}
export function validateSample(masks) {
  return (
    masks.length === tokens.length &&
    masks.every((v, i) => v === (provenance[i] === 'observation' ? 0 : 1)) &&
    masks.some(Boolean) &&
    lp.length === tokens.length &&
    lp.every((v, i) => Number.isFinite(v) && v <= 0 && (masks[i] || v === 0))
  );
}
export function queueState(state) {
  const q = phase(state.beatP),
    first = cueProgress(state, 'queue-first-completion', 1, Math.min(1, q / 0.25)),
    second = cueProgress(
      state,
      'queue-second-completion',
      1,
      Math.max(0, Math.min(1, (q - 0.45) / 0.2)),
    );
  const groups = ['G1', 'G2', 'G3', 'G4', 'G5'].map((id, i) => {
    const progress = i < 3 ? 1 : i === 3 ? first : second;
    return {
      id,
      progress,
      status: progress === 1 ? 'queued' : 'running',
      x: 190 + i * 315,
      y: i < 3 ? 470 : 695 - progress * 225,
    };
  });
  const queued = groups.filter((g) => g.status === 'queued').map((g) => g.id),
    runningIds = groups.filter((g) => g.status === 'running').map((g) => g.id);
  return {
    groups,
    queued,
    runningIds,
    running: runningIds.length,
    threshold: 4,
    launch: queued.length < 4,
    submitted: groups.length,
  };
}
export function syncTeachingState(state, beat, q) {
  const pause = state.cues?.['sync-beat-2-focus-1'];
  const receipts = cueProgress(state, 'sync-beat-3-focus-2', 2, 1);
  const resume = cueProgress(state, 'sync-beat-3-focus-1', 2, 1);
  const time = beat === 0 ? q * 3 : beat === 1 ? 3 + q * 3 : 6 + 0.2 * receipts + 0.1 * resume;
  const sync = syncState(time);
  return {
    ...sync,
    paused: (pause ? pause.phase !== 'before' : time >= 3) && !sync.ready,
  };
}
export function sampleModel(id, state) {
  if (!tracks[id]) return sampleSlimeChapter(id, state);
  const { b } = tracks[id].sample(state).snapshot,
    q = phase(b > state.beat ? 0 : state.beatP),
    base = {
      b,
      q,
    };
  if (id === 'ledger') {
    const masks = b === 2 ? mask.slice(0, 4) : mask,
      valid = validateSample(masks);
    return {
      ...base,
      masks,
      valid,
      trainable: valid ? sum(masks) : null,
      nll: valid ? -sum(lp.filter((_, i) => masks[i])) / sum(masks) : null,
    };
  }
  if (id === 'segments')
    return {
      ...base,
      ...segmentState(b, state.beatP, cueProgress(state, 'segments-move-boundary', 1, state.beatP)),
    };
  if (id === 'placement') {
    const train = 12,
      inference = 10,
      live = b === 0 ? train + inference : b === 1 ? (q < 0.5 ? train : inference) : train;
    const devices = [
      {
        id: 'train',
        resident: train,
        capacity: 16,
      },
      {
        id: 'inference',
        resident: inference,
        capacity: 16,
      },
    ].map((device) => ({
      ...device,
      fits: device.resident <= device.capacity,
    }));
    const overlapProgress = cueProgress(state, 'placement-overlap', 2, q);
    return {
      ...base,
      train,
      inference,
      capacity: 16,
      live,
      shared: b < 2,
      fits: b === 2 ? devices.every((d) => d.fits) : live <= 16,
      active: b === 1 && q >= 0.5 ? 'Inference' : 'Training',
      devices,
      overlapProgress,
      intervals:
        overlapProgress > 0
          ? devices.map((device) => ({
              id: device.id,
              lane: device.id,
              start: 0,
              end: overlapProgress,
            }))
          : [],
    };
  }
  if (id === 'queue')
    return {
      ...base,
      ...queueState(state),
    };
  if (id === 'sync')
    return {
      ...base,
      ...syncTeachingState(state, b, q),
    };
  if (id === 'delta') {
    const initial = {
        version: 11,
        bytes: [...old],
      },
      once = applyPatch(initial, versionedPatch),
      retry = applyPatch(once.state, versionedPatch),
      twice = xor(once.state.bytes, patch),
      current = b === 1 ? twice : b === 2 ? retry.state.bytes : once.state.bytes;
    return {
      ...base,
      old,
      goal,
      patch,
      current,
      currentVersion: once.state.version,
      baseVersion: versionedPatch.baseVersion,
      destinationVersion: versionedPatch.destinationVersion,
      retry,
      duplicateRejected: !retry.applied && retry.reason === 'already applied',
      matches: current.every((v, i) => v === goal[i]),
    };
  }
  if (id === 'recovery') {
    const replayed = b === 0 ? 2 : b === 1 ? (q < 0.18 ? 0 : q < 0.4 ? 1 : 2) : 2,
      branch =
        b === 0
          ? uninterrupted
          : [0.2, -0.5].slice(0, replayed).reduce(update, {
              ...checkpoint,
            });
    return {
      ...base,
      checkpoint,
      uninterrupted,
      replayed,
      branch,
      matches: JSON.stringify(branch) === JSON.stringify(uninterrupted),
    };
  }
  return base;
}
