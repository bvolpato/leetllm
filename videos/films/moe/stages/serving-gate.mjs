import { spokenProgress } from '../construction.mjs';
import { moeServing } from '../model.mjs';
import { circle, line, text } from '../defaults.mjs';

const onScale = (ms) => 1015 + (ms - 40) * 24;

export function drawServingGate(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const tighten = spokenProgress(api, state, 'move-budget', 2, 0.05, 0.45);
  const limit = api.lerp(60, 50, tighten);
  const rows = moeServing(limit);
  const answer =
    beat === 1
      ? spokenProgress(api, state, 'first-decision', 1, 0.05, 0.35) === 1
      : beat >= 3 && spokenProgress(api, state, 'second-decision', 3, 0.05, 0.35) === 1;
  text(ctx, api, 'Synthetic serving comparison', 120, 240, 34, C.muted);
  text(ctx, api, 'Quality ≥ 0.82', 365, 360, 35, C.ink, 'center');
  text(ctx, api, 'Rate ≥ 1,000 tok/s', 730, 360, 35, C.ink, 'center');
  api.focus.target('latency-budget', () => {
    text(ctx, api, 'p95 latency (ms)', 1020, 360, 35, C.ink);
    const spans = [
      [448, 491],
      [555, 627],
      [691, 750],
    ];
    for (let ms = 40; ms <= 65; ms += 5) {
      const x = onScale(ms);
      for (const [y0, y1] of spans) line(ctx, api, x, y0, x, y1, '#40434b', 2);
      text(ctx, api, ms, x, 425, 29, C.muted, 'center', 'mono');
    }
    const x = onScale(limit);
    // Split the moving line at the two data rows so it never crosses a printed value.
    for (const [y0, y1] of spans) line(ctx, api, x, y0, x, y1, C.yellow, 5);
    text(ctx, api, limit.toFixed(0) + ' ms budget', x, 802, 34, C.yellow, 'center');
  });
  api.focus.target('serving-rows', () => {
    rows.forEach((row, i) => {
      const y = 528 + i * 136;
      const tone = i ? C.cyan : C.muted;
      text(ctx, api, row.id, 117, y + 12, 43, tone);
      text(ctx, api, row.quality.toFixed(2), 365, y + 12, 43, C.ink, 'center', 'mono');
      text(
        ctx,
        api,
        row.throughput.toLocaleString('en-US'),
        730,
        y + 12,
        43,
        C.ink,
        'center',
        'mono',
      );
      const x = onScale(row.latency);
      circle(ctx, api, x, y, 15, tone);
      text(ctx, api, row.latency + ' ms', x + 31, y + 13, 34, tone, 'left', 'mono');
    });
  });
  const dense = rows[0],
    moe = rows[1];
  if (answer) {
    const verdict =
      rows
        .filter((row) => row.accepted)
        .map((row) => row.id)
        .join(', ') || 'Neither';
    text(ctx, api, 'Meets all three: ' + verdict, 120, 967, 45, C.ink);
    const note =
      beat === 1
        ? '+' +
          (moe.latency - dense.latency) +
          ' ms p95    +' +
          ((moe.throughput / dense.throughput - 1) * 100).toFixed(1) +
          '% throughput'
        : 'Dense misses rate  ·  MoE misses p95';
    text(ctx, api, note, 1780, 968, 35, C.cyan, 'right');
  } else {
    text(ctx, api, 'Which model meets all three requirements?', 960, 972, 43, C.ink, 'center');
  }
}

export default {
  id: 'serving-gate',
  draw: drawServingGate,
  cues: ['read-results', 'first-decision', 'move-budget', 'second-decision'],
};
