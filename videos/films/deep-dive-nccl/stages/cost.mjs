import { schedules } from '../arithmetic.mjs';
import { cueProgress, heard, sampleModel } from '../construction.mjs';

export function drawCost(ctx, scene, state, api) {
  const { C, focus } = api;
  const m = sampleModel('cost', state);
  const scale = 22;
  const startX = 430;
  const starts = cueProgress(state, 0, 'cost-starts');
  const large = m.bytes === 1000000;
  const middle = m.bytes === 200000;
  const totalKnown = large
    ? heard(state, 3, 'cost-result')
    : middle
      ? heard(state, 1, 'cost-tie')
      : heard(state, 0, 'cost-first');
  const units = (v) => (v >= 1e6 ? v / 1e6 + ' MB' : v / 1000 + ' kB');
  focus.target('cost-size', () => {
    api.text(ctx, 'Input per rank', 175, 254, 31, C.muted);
    api.text(ctx, units(m.bytes), 175, 322, 61, C.ink);
    api.text(ctx, 'Bytes moved in each schedule', 690, 254, 31, C.muted);
    api.text(ctx, '1.5 × ' + units(m.bytes) + ' = ' + units(1.5 * m.bytes), 690, 322, 54, C.ink);
  });
  focus.target('cost-tracks', () => {
    for (const [i, kind] of ['ring', 'tree'].entries()) {
      const ring = kind === 'ring';
      const { rounds, bandwidth } = schedules[kind];
      const result = m[kind];
      const y = 480 + 185 * i;
      const fill = large
        ? cueProgress(state, 3, ring ? 'cost-large' : 'cost-tree')
        : middle
          ? cueProgress(state, 1, 'cost-mid-fill')
          : cueProgress(state, 0, 'cost-small');
      focus.target(ring ? 'cost-ring' : 'cost-tree-track', () => {
        api.text(ctx, ring ? 'Ring' : 'Tree', 175, y, 52, C.ink);
        api.text(ctx, bandwidth + ' GB/s', 175, y + 52, 35, C.cyan);
        api.line(ctx, startX, y + 48, startX + 60 * scale, y + 48, C.muted, 2);
        for (let r = 0; r < rounds; r++) {
          const w = 2 * scale - 3;
          api.rect(
            ctx,
            startX + r * 2 * scale,
            y - 19,
            w,
            48,
            r < Math.ceil(rounds * starts) ? C.blue : C.panel,
            C.blue,
            4,
          );
        }
        if (fill > 0)
          api.rect(
            ctx,
            startX + result.startup * scale,
            y - 19,
            result.payload * scale * fill,
            48,
            C.cyan,
            undefined,
            2,
          );
        api.text(ctx, rounds + ' starts × 2 µs', startX, y - 48, 30, C.blue);
      });
      focus.target('cost-totals', () => {
        const format = (v) => Number(v.toFixed(2));
        const value = totalKnown
          ? format(result.startup) +
            ' + ' +
            format(result.payload) +
            ' = ' +
            format(result.total) +
            ' µs'
          : result.startup + ' µs + transfer time';
        api.text(ctx, value, startX + 625, y - 48, 33, totalKnown ? C.yellow : C.muted);
      });
    }
    for (let t = 0; t <= 60; t += 10) {
      const x = startX + t * scale;
      api.line(ctx, x, 770, x, 783, C.muted, 3);
      api.text(ctx, String(t), x, 827, 30, C.muted, 'center');
    }
    api.text(ctx, 'Elapsed time (µs)', 1090, 882, 33, C.muted, 'center');
  });
  const note =
    large && !totalKnown
      ? 'Transfer time in µs = moved kB ÷ rate in GB/s'
      : heard(state, 3, 'cost-rule')
        ? 'Time = rounds × startup per round + moved bytes / bandwidth'
        : 'Assumed schedules  ·  decimal bytes and rates';
  api.text(ctx, note, 960, 982, 38, large && !totalKnown ? C.yellow : C.ink, 'center');
}
export default {
  id: 'cost',
  draw: drawCost,
  cues: [
    'cost-starts',
    'cost-small',
    'cost-first',
    'cost-mid-size',
    'cost-mid-fill',
    'cost-tie',
    'cost-big-size',
    'cost-guess',
    'cost-large',
    'cost-tree',
    'cost-result',
    'cost-rule',
  ],
};
