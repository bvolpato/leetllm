import { attendedMean, makeAttentionMasks } from './arithmetic.mjs';
import { packed, packedLengths } from './fixtures.mjs';
import { clamp, cueProgress, done, ease, mix } from './construction.mjs';
export function packingActors(progress) {
  const placements = [];
  for (const [row, sources] of packed.contents.entries()) {
    let column = 0;
    for (const source of sources) {
      for (let i = 0; i < packedLengths[source]; i++)
        placements.push({
          id: `${'ABCD'[source]}${i}`,
          source,
          index: i,
          row,
          column: column + i,
        });
      column += packedLengths[source];
    }
  }
  return placements.map((o) => {
    const p = clamp(progress * 4 - o.source),
      a = ease(p),
      source = {
        x: 180 + o.index * 42,
        y: 410 + o.source * 112,
      },
      target = {
        x: 1100 + o.column * 42,
        y: 475 + o.row * 170,
      };
    let position = {
      x: mix(source.x, target.x, a),
      y: mix(source.y, target.y, a) + Math.sin(Math.PI * a) * (o.source % 2 ? 70 : -70),
    };
    if (o.source === 1 || o.source === 3) {
      const lane = o.source === 1 ? 345 : 830,
        points = [
          source,
          {
            x: source.x,
            y: lane,
          },
          {
            x: target.x,
            y: lane,
          },
          target,
        ],
        lengths = points.slice(1).map((v, i) => Math.hypot(v.x - points[i].x, v.y - points[i].y));
      let distance = a * lengths.reduce((sum, v) => sum + v, 0);
      for (let i = 0; i < lengths.length; i++) {
        if (distance <= lengths[i]) {
          const q = lengths[i] ? distance / lengths[i] : 1;
          position = {
            x: mix(points[i].x, points[i + 1].x, q),
            y: mix(points[i].y, points[i + 1].y, q),
          };
          break;
        }
        distance -= lengths[i];
        position = points[i + 1];
      }
    }
    return {
      ...o,
      progress: p,
      ...position,
      placed: p === 1,
    };
  });
}
export function packingFrame(state) {
  const progress = cueProgress(state, 'packing-placement', 0),
    actors = packingActors(progress),
    counts = packedLengths.map((_v, i) => actors.filter((o) => o.source === i && o.placed).length),
    bins = packed.contents.map((s) => s.reduce((n, i) => n + counts[i], 0));
  return {
    actors,
    counts,
    bins,
    placed: counts.reduce((s, n) => s + n, 0),
    capacity: 32,
    occupancy: counts.reduce((s, n) => s + n, 0) / 32,
    separateOccupancy: 27 / 64,
    packed: actors.every((o) => o.placed),
  };
}
export function attentionFrame(state) {
  const { causal, isolated } = makeAttentionMasks(),
    values = [1, 2, 3, 10, 20, 30];
  return {
    values,
    causal,
    isolated,
    mask: isolated,
    ordinary: attendedMean(causal, 4, values),
    restricted: attendedMean(isolated, 4, values),
    maskProgress: cueProgress(state, 'im-isolate-mask', 0),
    ordinaryProgress: cueProgress(state, 'im-ordinary-values', 1),
    ordinaryRevealed: done(state, 'im-ordinary-result', 1),
    isolatedProgress: cueProgress(state, 'attention-beat-2-focus-1', 1),
    isolatedRevealed: done(state, 'im-isolated-result', 1),
  };
}
export function budgetRepairFrame(state) {
  const progress = cueProgress(state, 'im-fresh-budget-repair', 2),
    committed = progress === 1,
    prompt = committed ? 925 : 970;
  return {
    progress,
    committed,
    prompt,
    total: prompt + 96,
    exchangeTokens: 45,
    limit: 1024,
  };
}
export function modelSnapshot(scene, state) {
  if (scene === 'packing') return packingFrame(state);
  if (scene === 'attention') return attentionFrame(state);
  if (scene === 'boundary')
    return {
      crossBoundaryTargetEnabled: !done(state, 'boundary-beat-1-focus-2', 0),
      values: [1, 2, 3].map((v) => v + 1000 * cueProgress(state, 'boundary-beat-2-focus-2', 1)),
      output: 15,
    };
  return null;
}
