import { cueProgress } from '../construction.mjs';
import { corpus, score } from '../neighborhood.mjs';
import { POINTS, QUERY } from '../fixtures.mjs';
import { exact, partition, probe, recall, releasePredictionState } from '../model.mjs';
import { text } from '../defaults.mjs';

export const SECOND_QUERY = { x: 7.6, y: 5.4 };
const queries = [QUERY, SECOND_QUERY];
const floor = 0.90, ceilingMs = 20;

// The two p95 values are supplied workload inputs, independent of the six-point distance counts.
export function releaseRows() {
  return [8, 18].map((p95, i) => {
    const overlaps = queries.map((q) => recall(probe(i + 1, q).result, exact(POINTS, 2, q)));
    const mean = (overlaps[0] + overlaps[1]) / 2;
    return { probes: i + 1, overlaps, mean, p95, passes: mean >= floor && p95 <= ceilingMs };
  });
}

export default {
  id: 'earned-transfer',
  cues: ['earned-transfer-b1', 'earned-transfer-result', 'new-query', 'show-right-scores', 'new-pair', 'compare-runs', 'choose-budget', 'recover-border', 'latency-margin'],
  draw(ctx, scene, state, api) {
    const { C } = api;
    if (state.beat < 2) {
      const result = releasePredictionState(state);
      api.focus.target('earned-transfer-mechanism', () => {
        text(ctx, api, 'Recall floor 90%     •     Time limit 20 ms', 960, 293, 40, C.ink, 'center');
        text(ctx, api, 'Exact top five', 135, 506, 35, C.muted);
        text(ctx, api, 'Returned IDs', 135, 702, 35, C.muted);
        const reference = [10, 21, 34, 55, 89], returned = [10, 21, 34, 55, 3];
        reference.forEach((id, i) => {
          const x = 540 + i * 275;
          const good = id === returned[i];
          const color = result.revealed ? (good ? C.green : C.red) : C.ink;
          api.circle(ctx, x, 486, 53, C.panel);
          text(ctx, api, String(id), x, 505, 48, C.ink, 'center');
          api.circle(ctx, x, 682, 53, result.revealed ? color : C.panel);
          text(ctx, api, String(returned[i]), x, 701, 48, result.revealed ? C.panel : C.ink, 'center');
        });
        text(ctx, api, result.revealed ? '4 / 5 = 80% · HOLD' : '12 ms for this query. Does the run pass?', 960, 923, 46, result.revealed ? C.red : C.yellow, 'center');
      });
      return;
    }
    if (state.beat < 4) {
      const moved = cueProgress(state, 'new-query');
      const q = moved === 1 ? SECOND_QUERY : {
        x: api.lerp(QUERY.x, SECOND_QUERY.x, moved), y: api.lerp(QUERY.y, SECOND_QUERY.y, moved),
      };
      const revealed = state.cues?.['new-pair']?.phase === 'after';
      const scored = cueProgress(state, 'show-right-scores');
      const right = exact(probe(1, SECOND_QUERY).examined, 3, SECOND_QUERY);
      const nearestLeft = exact(POINTS.filter((p) => !partition(p)), 1, SECOND_QUERY)[0];
      api.focus.target('new-query-map', () => corpus(ctx, api, {
        query: q, lists: true, scanned: scored > 0 ? right.map((p) => p.id) : [],
        identified: revealed ? exact(POINTS, 2, q).map((p) => p.id) : [],
      }));
      api.focus.target('second-query-scores', () => {
        text(ctx, api, 'Right list · squared distance', 1210, 282, 36, C.pink);
        right.forEach((p, i) => {
          text(ctx, api, p.id, 1240, 390 + i * 94, 42, C.pink);
          text(ctx, api, scored > i / 3 ? score(p, SECOND_QUERY) : '?', 1695, 390 + i * 94, 42, C.ink, 'right');
        });
        text(ctx, api, 'Closest in the left list', 1210, 698, 34, C.blue);
        text(ctx, api, nearestLeft.id, 1240, 786, 42, C.blue);
        text(ctx, api, scored === 1 ? score(nearestLeft, SECOND_QUERY) : '?', 1695, 786, 42, C.ink, 'right');
      });
      text(ctx, api, revealed ? 'One list recovers both slots here.' : 'Would opening the left list change the top two?',
        1775, 971, 37, C.yellow, 'right');
      return;
    }
    const rows = releaseRows();
    const reveal = state.cues?.['choose-budget']?.phase === 'after';
    const recovery = cueProgress(state, 'recover-border');
    const margin = state.cues?.['latency-margin']?.phase === 'after';
    const winner = rows.find((r) => r.passes);
    const xs = [230, 555, 890, 1245, 1605];
    api.focus.target('release-comparison', () => {
      ['Lists opened', 'Border query', 'Query near D', 'Mean recall@2', 'Workload p95'].forEach((label, i) =>
        text(ctx, api, label, xs[i], 380, 34, C.muted, 'center'));
      rows.forEach((r, i) => {
        const y = 532 + i * 165;
        const values = [String(r.probes), ...r.overlaps.map((v) => (2 * v) + ' / 2'), (100 * r.mean) + '%', r.p95 + ' ms'];
        const color = reveal ? (r.passes ? C.green : C.muted) : C.ink;
        values.forEach((v, j) => text(ctx, api, v, xs[j], y, 53, color, 'center'));
        if (reveal && r.passes) api.line(ctx, 127, y + 36, 1760, y + 36, color, 5);
      });
      if (recovery > 0) {
        api.line(ctx, xs[1] - 69, 717, xs[1] - 69 + 138 * recovery, 717, C.green, 4);
      }
      text(ctx, api, 'Two-query recall floor 90%     •     Workload p95 limit 20 ms', 960, 842, 36, C.ink, 'center');
      let decision = reveal ? 'Choose two lists for this trial.' : 'Which setting clears both limits?';
      if (recovery === 1) {
        const pairs = rows.map((r) => probe(r.probes, QUERY).result.map((p) => p.id).join(', '));
        decision = 'At the border     ' + pairs.join('   →   ');
      }
      if (margin) decision = ceilingMs + ' ms − ' + winner.p95 + ' ms = ' + (ceilingMs - winner.p95) + ' ms under budget';
      text(ctx, api, decision,
        960, 267, 48, reveal ? C.green : C.yellow, 'center');
    });
  },
};
