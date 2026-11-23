import { bpeState } from '../arithmetic.mjs';
import { sceneCues } from '../picture.mjs';

const before = bpeState(0);
const after = bpeState(1);
const target = before.selected.split('|').join('');

export function drawPretraining(ctx, scene, state, api) {
  const { C } = api;
  const cue = sceneCues(scene, state);
  api.focus.target('pretraining-mechanism', () => {
    if (state.beat < 3) {
      api.text(ctx, 'Word frequency', 135, 300, 32, C.muted);
      api.text(ctx, 'Token pieces', 550, 300, 32, C.muted);
      const join = cue.progress('bpe-join');
      before.rows.forEach((row, i) => {
        const y = 406 + 147 * i;
        const selected =
          i === 0 ? 0 : row.tokens.findIndex((v, j) => v + row.tokens[j + 1] === target);
        const lit = cue.started(['bpe-key', 'bpe-stale', 'bpe-rotation'][i]);
        const color = i === 0 ? C.blue : C.yellow;
        api.text(ctx, row.word + '  ×  ' + row.frequency, 135, y + 17, 42, C.ink);
        row.tokens.forEach((token, j) => {
          const paired = i > 0 && (j === selected || j === selected + 1);
          const shift = i > 0 && j > selected ? 84 * join : 0;
          const x = 610 + 151 * j - shift;
          const merged = i > 0 && j === selected && join === 1;
          if (join === 1 && i > 0 && j === selected + 1) return;
          const highlighted = lit && (paired || (i === 0 && j < 2));
          const isClosing = paired && join > 0 && join < 1;
          if (!isClosing)
            api.rect(
              ctx,
              x - 53,
              y - 47,
              merged ? 173 : 106,
              92,
              C.panel,
              highlighted ? color : C.muted,
              10,
            );
          else if (j === selected)
            api.rect(ctx, x - 53, y - 47, 257 - 84 * join, 92, C.panel, color, 10);
          api.text(
            ctx,
            merged ? target : token,
            merged ? x + 33 : x,
            y + 19,
            49,
            highlighted ? color : C.ink,
            'center',
          );
        });
      });
      if (cue.started('bpe-stale')) {
        const operands = cue.started('bpe-rotation')
          ? before.rows[1].frequency + ' + ' + before.rows[2].frequency
          : before.rows[1].frequency;
        api.text(
          ctx,
          't + a    ' + operands + (cue.after('bpe-winner') ? ' = ' + before.selectedCount : ''),
          510,
          885,
          44,
          C.yellow,
          'center',
        );
      }
      if (cue.started('bpe-key'))
        api.text(
          ctx,
          'k + e    ' + new Map(before.counts).get('k|e'),
          1330,
          885,
          44,
          C.blue,
          'center',
        );
      return;
    }
    const pieces = after.rows.find((r) => r.word === 'rotation').tokens;
    api.text(ctx, 'rotation', 135, 325, 45, C.ink);
    pieces.forEach((token, i) => {
      const x = 550 + 169 * i;
      const observed = i === 2 && cue.after('bpe-target');
      api.rect(ctx, x, 258, 118, 100, C.panel, observed ? C.yellow : C.muted, 10);
      api.text(
        ctx,
        i === 2 && !observed ? '?' : token,
        x + 59,
        326,
        42,
        observed ? C.yellow : C.ink,
        'center',
      );
    });
    api.text(ctx, 'Probability assigned to “ta”', 135, 505, 36, C.muted);
    api.text(ctx, 'Loss on that token', 1320, 505, 36, C.muted);
    [0.2, 0.8].forEach((prob, i) => {
      if (i && !cue.after('bpe-high')) return;
      const y = 635 + i * 150;
      api.text(ctx, prob.toFixed(1), 140, y, 49, C.ink);
      api.rect(ctx, 350, y - 49, 875 * prob, 50, i ? C.cyan : C.blue, undefined, 6);
      if (cue.after(i ? 'bpe-high-loss' : 'bpe-low')) {
        api.text(
          ctx,
          (i ? after.lossHigh : after.lossLow).toFixed(3) + ' nats',
          1320,
          y,
          44,
          C.ink,
        );
      }
    });
    api.text(
      ctx,
      'Loss = −ln(probability of the observed token)',
      960,
      957,
      39,
      C.yellow,
      'center',
    );
  });
}
export default {
  id: 'pretraining',
  draw: drawPretraining,
  cues: [
    'bpe-stale',
    'bpe-rotation',
    'bpe-key',
    'bpe-winner',
    'bpe-join',
    'bpe-target',
    'bpe-low',
    'bpe-high',
    'bpe-high-loss',
  ],
};
