import {
  clamp,
  gradientFixture,
  keepMask,
  localMask,
  meanMask,
  mergeSummaries,
  phase,
  referenceCases,
  sum,
  summary,
  tileSummary,
} from './arithmetic.mjs';
import { ids, scores, values } from './fixtures.mjs';

// A held answer belongs to the completed spoken clause, including when frames are sampled out of order.
export function afterCue(state, beat, id) {
  if (state.beat !== beat) return state.beat > beat;
  return complete(state, id);
}
export function cueMotion(state, beat, id) {
  if (state.beat !== beat) return Number(state.beat > beat);
  return progress(state, id);
}

export const decodeValues = [10, 20, 30, 40, 50];
export const transferValues = [6, 12, 24];
export const transferQueries = 5;
const transferHeads = 4;
const scoreWidth = 4;
const scoreAllowance = 512;

export function fallbackScores(items) {
  const bytesPerItem = transferHeads * transferQueries * transferValues.length * scoreWidth;
  const scoreBytes = items * bytesPerItem;
  return {
    items,
    heads: transferHeads,
    scoreWidth,
    bytesPerItem,
    scoreBytes,
    scoreAllowance,
    fits: scoreBytes <= scoreAllowance,
  };
}

export function sampleOriginalModel(id, state) {
  const b = state.beat,
    q = phase(state.beatP);
  if (id === 'intro') {
    const n = b < 2 ? 8 : 32;
    const tilesAcross = n / 4;
    const tileCount = tilesAcross ** 2;
    let visits;
    if (b === 0) {
      // The shot opens during the fourth row of a scalar dot-product tile.
      const firstScore = clamp(0.25 + (state.t ?? state.beatP) * 1.5);
      visits = (12 + firstScore + 3 * cueMotion(state, 0, 'intro-first')) / 16;
    } else if (b === 1)
      visits = 1 + cueMotion(state, 1, 'intro-next') + 2 * cueMotion(state, 1, 'intro-rest');
    else visits = b === 2 ? 0 : tileCount * cueMotion(state, 3, 'intro-many');
    const scored = Math.min(n * n, visits * 16);
    const pairsVisited = Math.floor(scored);
    return {
      b,
      q,
      n,
      tileCount,
      tilesAcross,
      scored,
      pairsVisited,
      outputRows: 4 * Math.floor(pairsVisited / (tilesAcross * 16)),
      scores: n * n,
      scoreBytes: n * n * 2,
      tileBytes: 4 * 4 * 2,
    };
  }
  if (id === 'tiles') {
    const first = b > 0 || complete(state, 'tile-first', state.beatP >= 0.45 ? 1 : 0);
    const second =
      b > 1 || (b === 1 && complete(state, 'tile-second', state.beatP >= 0.45 ? 1 : 0));
    const count = second ? 4 : first ? 2 : 0;
    return {
      b,
      q,
      tile: b === 0 ? 0 : 1,
      count,
      finished: b === 2,
      ...summary(count),
    };
  }
  if (id === 'online') {
    const a = summary(2),
      tileB = tileSummary(2, 4),
      z = summary(4),
      merged = mergeSummaries(a, tileB);
    const rescaleProgress =
      b === 3 ? 1 : b === 2 ? (state.cues?.['online-rescale-old']?.progress ?? q) : 0;
    const rescaled = rescaleProgress === 1,
      alpha = Math.exp(-rescaleProgress),
      mergeProgress =
        b === 3
          ? (state.cues?.['online-merge-summary']?.progress ?? Math.max(0, Math.min(1, q / 0.5)))
          : 0;
    return {
      b,
      q,
      a,
      tileB,
      z,
      merged,
      rescaled,
      rescaleProgress,
      mergeProgress,
      alpha,
      oldL: a.l * alpha,
      oldU: a.u.map((v) => v * alpha),
    };
  }
  if (id === 'mask') {
    const repaired = afterCue(state, 2, 'mask-align'),
      mask = keepMask(2, 5, repaired ? 'right' : 'left'),
      means = meanMask(mask, decodeValues);
    return {
      b,
      q,
      repaired,
      mask,
      means,
    };
  }
  if (id === 'packed') {
    const cut = afterCue(state, 2, 'packed-admit') && !afterCue(state, 2, 'packed-restore') ? 4 : 3;
    return {
      b,
      q,
      cut,
      offsets: [0, cut, 5],
      membership: ['Birds', 'sing', 'softly', 'Rain', 'falls'].map((word, i) => ({
        word,
        owner: i < cut ? 'A' : 'B',
      })),
    };
  }
  if (id === 'backward') {
    const z = summary(4),
      count =
        b === 0
          ? 0
          : b === 1
            ? complete(state, 'fa-backward-second', q)
              ? 4
              : complete(state, 'fa-backward-first', q)
                ? 2
                : 0
            : 4,
      probabilities = scores.map((v, i) => (i < count ? Math.exp(v - z.lse) : 0));
    return {
      b,
      q,
      ...z,
      count,
      probabilities,
      mass: sum(probabilities),
      partial: [0, 1].map((d) => sum(probabilities.map((p, i) => p * values[i][d]))),
    };
  }
  if (id === 'contracts') {
    const gates = ['fa-contract-layout', 'fa-contract-rest', 'fa-contract-ready'].map(
      (id, i) => b === 2 || (b === 1 && complete(state, id, Math.max(0, (q - i * 0.2) / 0.4))),
    );
    return {
      b,
      q,
      gates,
      ready: gates.every(Boolean),
      fallbackGiB: (8 * 32 * 8192 ** 2 * 2) / 2 ** 30,
      budgetGiB: 16,
    };
  }
  const cases = referenceCases();
  const deviceStart = 1,
    deviceEnd = 41,
    enqueueEnd = 2;
  return {
    b,
    q,
    cases,
    passed: cases.filter((test) => test.passed).length,
    time:
      enqueueEnd * cueMotion(state, 1, 'trace-host') +
      (deviceEnd - enqueueEnd) * cueMotion(state, 2, 'trace-device'),
    deviceStart,
    deviceEnd,
    enqueueEnd,
  };
}
export function progress(state, id, fallback = state.beatP) {
  const cue = state.cues?.[id];
  return cue ? clamp(cue.progress) : clamp(fallback);
}
export function complete(state, id, fallback = state.beatP) {
  const cue = state.cues?.[id];
  return cue ? (cue.phase ? cue.phase === 'after' : cue.progress === 1) : clamp(fallback) === 1;
}
export function sampleModel(id, state) {
  if (ids.includes(id)) return sampleOriginalModel(id, state);
  const b = state.beat,
    p = progress(state, `fa-${id}-${b}`, phase(state.beatP)),
    done = (name) => complete(state, 'fa-' + name, p),
    part = (name) => progress(state, 'fa-' + name, p),
    g = gradientFixture();
  if (id === 'workspace-accounting')
    return {
      b,
      p,
      scoreBytes: 8 * 32 * 8192 ** 2 * 2,
      lseBytes: 8 * 32 * 8192 * 4,
      scoreReady: done('workspace-score'),
      lseReady: done('workspace-lse'),
    };
  if (id === 'recurrence-domain') {
    const first = summary(2),
      next = tileSummary(2, 4);
    const wrong = first.u.map((v, d) => (v + next.u[d]) / g.l);
    return {
      b,
      p,
      exact: g,
      wrong,
      ready: afterCue(state, 2, 'recurrence-result'),
      skip: afterCue(state, 3, 'recurrence-skip'),
      empty: afterCue(state, 3, 'recurrence-zero'),
    };
  }
  if (id === 'layout-heads') {
    const q = [0, 1, 2, 3, 4, 5],
      weights = [Math.E / (1 + Math.E), 1 / (1 + Math.E)];
    return {
      b,
      p,
      map: q.map((i) => Math.floor(i / 3)),
      headReady: done('head-map'),
      transpose: part('layout-transpose'),
      outputs: [weights.map((v) => v * 2), weights.toReversed().map((v) => v * 2)],
      outputReady: done('head-output'),
    };
  }
  if (id === 'window-empty') {
    const mask = b === 2 ? keepMask(5, 2, 'right') : localMask(2, 5, 1, 0);
    return {
      b,
      p,
      mask,
      means: meanMask(mask),
      first: done('window-first'),
      second: done('window-second'),
      empty: done('reverse-zero'),
    };
  }
  if (id === 'packed-page-contract') {
    const pages = [2, 0];
    const request = cueMotion(state, 1, 'page-b') > 0 ? 1 : 0;
    return { b, p, pages, request };
  }
  if (id === 'page-padding')
    return {
      b,
      p,
      pages: 3,
      pageSize: 256,
      used: 270,
      pad: 242,
      contaminated: b === 0 && done('padding-nan'),
      finite: b > 1 || (b === 1 && done('padding-finite')),
    };
  if (id === 'gradient-rule' || id === 'gradient-worked')
    return {
      ...g,
      b,
      p,
      probabilities: g.p,
      count: Math.min(4, Math.floor(p * 4 + 1e-9)),
      dPReady: done('gradient-dp'),
      DReady: done('gradient-scalar'),
      zeroReady: done('gradient-zero'),
      deposited: b > 2 || done('gradient-deposit'),
    };
  if (id === 'padding-polarity')
    return {
      b,
      p,
      wrong: done('padding-wrong'),
      right: done('padding-right'),
      keep: b === 1 && done('padding-right') ? [true, false] : [false, true],
    };
  if (id === 'mixed-shape-cache')
    return {
      b,
      p,
      signatures: [
        {
          Q: 128,
          KV: 2,
        },
        {
          Q: 64,
          KV: 1,
        },
      ],
      repaired: b === 2 || (b === 1 && done('cache-complete')),
      count: Math.min(4, Math.floor(p * 4 + 1e-9)),
    };
  if (id === 'fresh-dispatch') {
    const mask = keepMask(transferQueries, transferValues.length, 'right');
    let items = afterCue(state, 4, 'fresh-two-bytes') ? 2 : 3;
    if (afterCue(state, 4, 'fresh-release')) items = afterCue(state, 4, 'fresh-last') ? 1 : 0;
    return {
      b,
      p,
      mask,
      outputs: meanMask(mask, transferValues),
      buffer: fallbackScores(items),
    };
  }
  return {
    b,
    p,
    ready: done('return-three'),
    pair: done('return-pair'),
    error: done('dispatch-error'),
    dropout: done('dropout-zero'),
    sorted: done('timing-sort'),
  };
}
