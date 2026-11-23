import { tracks } from './fixtures.mjs';
import { adam, phase, saved, stateLedger, sum, trajectory } from './arithmetic.mjs';
import { sentence } from './construction.mjs';
export function sampleModel(id, state) {
  const b = state.beat ?? tracks[id].sample(state).snapshot.b,
    q = phase(state.beatP),
    base = {
      b,
      q,
    };
  if (id === 'intro') {
    const gradient = sentence(state, id, 0, 1),
      optimizer = sentence(state, id, 1, 0),
      parts = [3, 3 * gradient, 6 * Math.min(3, Math.floor(optimizer * 3 + 1e-9))];
    return {
      ...base,
      parts,
      total: sum(parts),
    };
  }
  if (id === 'ownership') {
    if (state.cues) {
      const cue = (id) => state.cues[id],
        progress = (id) => cue(id)?.progress ?? 0;
      let from = 0,
        to = 1,
        t = progress('ownership-optimizer-partition');
      if (b === 1) {
        from = 1;
        to = 2;
        t = progress('ownership-gradient-partition');
        if (cue('ownership-weight-partition')?.phase !== 'before') {
          from = 2;
          to = 3;
          t = progress('ownership-weight-partition');
        }
      }
      if (b > 1) {
        from = 3;
        to = 3;
        t = 1;
      }
      const a = stateLedger(from),
        z = stateLedger(to),
        parts = a.parts.map((v, i) => v + (z.parts[i] - v) * t);
      return {
        ...base,
        stage: t > 0 ? to : from,
        parts,
        total: sum(parts),
      };
    }
    const stage = b === 0 ? 1 : b === 1 ? (q < 0.5 ? 2 : 3) : 3;
    return {
      ...base,
      stage,
      ...stateLedger(stage),
    };
  }
  if (id === 'reduce')
    return {
      ...base,
      gradient: 2,
      squareMean: 4,
      meanSquare: 5,
      update: adam([1, 0, 0], 2, 1),
    };
  if (id === 'accumulation') {
    const boundary = state.cues?.['accumulation-final-boundary'];
    const micro =
      b === 0
        ? Math.floor(q * 3)
        : b === 1
          ? 3 + Math.floor(q * 4)
          : boundary
            ? boundary.phase !== 'before'
              ? 8
              : 7
            : q < 0.2
              ? 7
              : 8;
    return {
      ...base,
      micro,
      updates: Math.floor(micro / 8),
      samples: 2 * 8 * 4,
    };
  }
  if (id === 'gather') {
    const firstProgress = b > 0 ? 1 : (state.cues?.['gather-layer-zero']?.progress ?? q);
    const nextProgress = sentence(state, id, 2, 0),
      nextAllocated = nextProgress > 0;
    const firstAllocated = b > 0 || firstProgress > 0,
      live = Number(firstAllocated) + Number(nextAllocated);
    const resident = 8,
      gathered = live * 8,
      firstCopied = Math.min(8, Math.floor(firstProgress * 8 + 1e-9));
    return {
      ...base,
      live,
      resident,
      gathered,
      total: resident + gathered,
      firstAllocated,
      firstProgress,
      firstCopied,
      nextProgress,
      nextAllocated,
    };
  }
  if (id === 'offload') {
    const time = b === 0 ? 2 * q : b === 1 ? 3 * q : 5 * q;
    return {
      ...base,
      time,
      transferred: Math.min(12, 6 * time),
      transferTime: 2,
      computeTime: 3,
      total: b === 2 ? 5 : 3,
      dependent: b === 2,
    };
  }
  if (id === 'checkpoint') {
    const full = adam(saved, 0.4, 6),
      weightsOnly = adam([saved[0], 0, 0], 0.4, 6),
      completed = b === 0 ? Math.floor(q * 5) : 5;
    return {
      ...base,
      saved,
      full,
      weightsOnly,
      completed,
      current: trajectory[completed],
      gap: Math.abs(full[0] - weightsOnly[0]),
    };
  }
  return {
    ...base,
    phase:
      b === 0
        ? 'Gather → compute'
        : b === 1
          ? 'Reduce → retain owned gradient'
          : 'Accumulation complete → update',
    ready: b > 0,
    boundary: b === 2,
    allowed: b === 2,
  };
}
