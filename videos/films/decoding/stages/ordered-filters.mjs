import { STATUS_ROW } from '../fixtures.mjs';
import { decodeSoftmax, decodeSupport } from '../arithmetic.mjs';
import { coreText } from '../defaults.mjs';
import { probabilityStrip, stripMarker, stripWidth, stripX } from '../probability-strip.mjs';
import { heard, movement } from '../spoken.mjs';

const names = ['A', 'B', 'C', 'D'];
const row = [0.45, 0.3, 0.15, 0.1];
const k = decodeSupport(row, 'k', 3);
const kp = decodeSupport(k.values, 'p', 0.8);
const p = decodeSupport(row, 'p', 0.8);
const pk = decodeSupport(p.values, 'k', 3);

function cutoff(ctx, api, { values, y, heading, note, result, retained }) {
  coreText(ctx, api, heading, stripX, y - 77, 40, api.C.ink, 'left');
  stripMarker(ctx, api, 0.8, y, '80%');
  const shares = names.map(
    (name, i) => name + ' · ' + (values[i] ? (100 * values[i]).toFixed(1) + '%' : 'removed'),
  );
  probabilityStrip(ctx, api, { values, names: shares, y, kept: retained, percent: false });
  coreText(ctx, api, note, stripX, y + 225, 32, api.C.ink, 'left');
  if (result) coreText(ctx, api, result, stripX + stripWidth, y + 225, 33, api.C.green, 'right');
}

export function drawOrderedFilters(ctx, scene, state, api) {
  const beat = state.beat ?? 0;
  if (beat === 4) {
    api.focus.target('filter-comparison', () => {
      [1, 1.5].forEach((T, i) => {
        const values = decodeSoftmax(STATUS_ROW.map(Math.log), T);
        const support = decodeSupport(values, 'p', 0.9);
        const visible = i === 0 || heard(state, 'filter-hot-status', 4, 0.7);
        const y = 410 + i * 350;
        coreText(ctx, api, 'Status tokens at T = ' + T, stripX, y - 68, 40, api.C.ink, 'left');
        stripMarker(ctx, api, 0.9, y, '90%');
        let start = stripX;
        values.forEach((v, j) => {
          api.rect(
            ctx,
            start,
            y,
            v * stripWidth,
            65,
            visible && support.ids.includes(j) ? api.C.blue : api.C.muted,
            undefined,
            0,
          );
          if (j) api.line(ctx, start, y, start, y + 65, api.C.bg, 3);
          start += v * stripWidth;
        });
        coreText(
          ctx,
          api,
          visible
            ? support.ids.length + ' of 12 tokens retained'
            : 'How many tokens reach the mark?',
          stripX,
          y + 136,
          36,
          api.C.ink,
          'left',
        );
      });
    });
    return;
  }
  const cut = heard(state, 'filter-trim', 0, 0.49);
  const stretch = movement(state, 'filter-rescale', 0, 0.58, 0.81);
  const upper = cut
    ? row.map((v, i) => (k.ids.includes(i) ? v + (k.values[i] - v) * stretch : 0))
    : row;
  const upperDone = heard(state, 'dec-filters-kp', 1, 0.4);
  const lowerDone = heard(state, 'dec-filters-pk', 3, 0.4);
  api.focus.target('filter-comparison', () => {
    cutoff(ctx, api, {
      values: upper,
      y: 365,
      heading: 'Top-k first   ·   k = 3',
      note: !cut
        ? 'Original mass = 1.00'
        : stretch < 1
          ? 'Mass retained by top-k = 0.90'
          : 'A + B = 0.75 / 0.90 ≈ 83.3%',
      retained: upperDone ? kp.ids : undefined,
      result: upperDone ? 'Keep ' + kp.ids.map((i) => names[i]).join(' + ') : '',
    });
    if (beat >= 2) {
      cutoff(ctx, api, {
        values: row,
        y: 755,
        heading: 'Top-p first   ·   p = 0.80',
        note: lowerDone ? 'A + B + C = 0.90' : 'A + B = 0.75',
        retained: lowerDone ? pk.ids : undefined,
        result: lowerDone ? 'Keep ' + pk.ids.map((i) => names[i]).join(' + ') : '',
      });
    } else {
      coreText(
        ctx,
        api,
        beat === 0 ? 'Which token crosses the 80% mark?' : 'Top-p reads the rescaled strip.',
        960,
        812,
        46,
        api.C.ink,
      );
    }
  });
}
export default {
  id: 'ordered-filters',
  draw: drawOrderedFilters,
  cues: [
    'filter-trim',
    'filter-rescale',
    'dec-filters-kp',
    'filter-reverse',
    'dec-filters-pk',
    'filter-hot-status',
  ],
};
