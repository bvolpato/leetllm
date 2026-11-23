import {
  clip,
  completedCue,
  cosine,
  dot,
  l2,
  normalized,
  robustUnit,
  scalarEncode,
} from './arithmetic.mjs';
import {
  AUTH,
  GRAPH,
  METRICS,
  PASSAGES,
  PQ_PAIRS,
  PQ_QUERY,
  PREFIX_DOCS,
  QUANTIZATION_FIXTURE,
  QUANTIZATION_RESULT,
} from './fixtures.mjs';
export function quantizationFrame(progress) {
  return QUANTIZATION_RESULT.map((row) => {
    const current = row.vector.map((value, i) => value + (row.code[i] - value) * progress);
    return {
      ...row,
      current,
      currentCosine: cosine(QUANTIZATION_FIXTURE.query, current),
    };
  });
}
export function magnitudeScale(beat, progress) {
  return beat > 0 ? 10 : 1 + 9 * clip((progress - 0.04) / 0.88);
}
export function normalizationFrame(beat, progress) {
  const mix = beat > 0 ? 1 : clip((progress * 14.304 - 1.25) / (6.1 - 1.25));
  return PASSAGES.map((row) => ({
    ...row,
    current: row.vector.map((value, i) => value + (normalized(row.vector)[i] - value) * mix),
    mix,
  }));
}
export function quantizationProgress(beat, progress) {
  return beat < 1 ? 0 : beat > 1 ? 1 : clip((progress - 0.24) / (0.45 - 0.24));
}
export function deploymentFrame(beat, progress, cues) {
  const filterCue = cues?.['deployment-retrieval-access-filter-b1-1'];
  const rankCue = cues?.['deployment-rank-eligible'];
  return {
    filter: beat > 0 ? 1 : filterCue ? filterCue.progress : clip((progress - 0.18) / 0.24),
    rank: beat > 0 ? 1 : rankCue ? rankCue.progress : clip((progress - 0.5) / 0.25),
    incoming: 3,
    eligible: 2,
  };
}
export function openingCandidates(beat, progress, cues) {
  const begun = (id, fallback) => (cues?.[id] ? cues[id].phase !== 'before' : fallback);
  const ranked = beat > 0 || begun('opening-nearest-candidates-b1-1', progress >= 0.5);
  const stored = ranked || begun('opening-stored-passages', progress >= 0.3);
  return {
    stored,
    ranked,
    rows: [...METRICS]
      .sort((a, b) => b.cosine - a.cosine)
      .map((row, i) => ({
        ...row,
        rank: i + 1,
      })),
  };
}
export function prefixResults(width = 4) {
  const docs = PREFIX_DOCS.map((v) => robustUnit(v.slice(0, width))),
    queries = PREFIX_DOCS.slice(1).map((v) => robustUnit(v.slice(0, width))),
    scores = queries.map((q) => docs.map((d) => dot(q, d))),
    winners = scores.map((row) => row.indexOf(Math.max(...row)));
  return {
    docs,
    queries,
    scores,
    winners,
    recall: winners.filter((v, i) => v === i + 1).length / 2,
  };
}
export function calibrationResult(bound) {
  const input = Array.from(
      {
        length: 101,
      },
      (_, i) => i / 50 - 1,
    ),
    output = input.map((v) => (scalarEncode(v, bound) * bound) / 127);
  return {
    input,
    output,
    mae: input.reduce((n, v, i) => n + Math.abs(v - output[i]), 0) / input.length,
    outlier: (scalarEncode(25, bound) * bound) / 127,
  };
}
export function pqTables() {
  return PQ_QUERY.map((q, i) =>
    [[0, 0], PQ_PAIRS[i]].map((c) => q.reduce((n, v, j) => n + (v - c[j]) ** 2, 0)),
  );
}
export function graphSearch(ef = 1) {
  const distance = (id) => l2(GRAPH.query, GRAPH.points[id]) ** 2,
    visited = new Set(['B']),
    pending = ['B'],
    events = [];
  let best = ['B'];
  while (pending.length) {
    pending.sort((a, b) => distance(a) - distance(b));
    best.sort((a, b) => distance(a) - distance(b));
    const id = pending.shift();
    if (distance(id) > distance(best.at(-1))) break;
    const admitted = [];
    for (const n of GRAPH.edges[id]) {
      if (visited.has(n)) continue;
      visited.add(n);
      if (best.length < ef || distance(n) < distance(best.at(-1))) {
        pending.push(n);
        best.push(n);
        best.sort((a, b) => distance(a) - distance(b));
        best = best.slice(0, ef);
        admitted.push(n);
      }
    }
    events.push({
      id,
      admitted,
      best: [...best],
      pending: [...pending],
    });
  }
  return {
    events,
    best,
    winner: best[0],
    distanceSquared: distance(best[0]),
    visited: [...visited],
  };
}
export function authorizedSearch(k = 1, prefilter = false) {
  const rows = AUTH.rows
      .map((r, i) => ({
        ...r,
        index: i,
        hamming: r.vector.filter((v, j) => v > 0 !== AUTH.query[j] > 0).length,
        cosine: dot(robustUnit(r.vector), robustUnit(AUTH.query)),
      }))
      .filter((r) => !prefilter || r.allow)
      .sort((a, b) => a.hamming - b.hamming || a.index - b.index)
      .slice(0, k),
    survivors = rows.filter((r) => r.allow).sort((a, b) => b.cosine - a.cosine);
  return {
    rows,
    survivors,
    winner: survivors[0]?.id ?? null,
  };
}
export function freshMetricVisibility(state) {
  return {
    dot: state.beat === 1 && completedCue(state, 'fresh-dot-complete'),
    cosine: state.beat === 1 && completedCue(state, 'fresh-cosine-complete'),
    l2: state.beat === 1 && completedCue(state, 'fresh-l2-complete'),
    unit: state.beat === 1 && completedCue(state, 'fresh-unit-complete'),
  };
}
export function calibrationRanking() {
  const original = [robustUnit([1, 0.05]), robustUnit([1, 0.04])],
    encode = (bound) =>
      original.map((row) => row.map((v) => (scalarEncode(v, bound) * bound) / 127)),
    coarse = encode(25),
    fine = encode(1),
    scores = (rows) => rows.map((row) => cosine([1, 0], row)),
    winner = (rows) => {
      const s = scores(rows);
      return s.indexOf(Math.max(...s));
    };
  return {
    original,
    coarse,
    fine,
    originalScores: scores(original),
    coarseScores: scores(coarse),
    fineScores: scores(fine),
    originalWinner: winner(original),
    coarseWinner: winner(coarse),
    fineWinner: winner(fine),
  };
}
export function calibrationRankingFrame(state) {
  const f = calibrationRanking(),
    started = (id) => state.cues?.[id] && state.cues[id].phase !== 'before',
    progress = (id) =>
      state.cues?.[id]?.phase === 'after' ? 1 : (state.cues?.[id]?.progress ?? 0),
    stage = started('calibration-direction-fine')
      ? 'fine'
      : started('calibration-direction-coarse')
        ? 'coarse'
        : 'original',
    p = stage === 'original' ? 1 : progress('calibration-direction-' + stage),
    count = stage === 'original' ? 4 : Math.min(4, Math.floor(p * 4)),
    start = stage === 'fine' ? f.coarse : f.original,
    target = f[stage],
    rows = start.map((row, i) => row.map((v, j) => (i * 2 + j < count ? target[i][j] : v))),
    scores = rows.map((row) => cosine([1, 0], row)),
    revealed = completedCue(state, 'calibration-direction-' + stage);
  return {
    ...f,
    stage,
    count,
    rows,
    scores,
    winner: revealed ? scores.indexOf(Math.max(...scores)) : null,
  };
}
