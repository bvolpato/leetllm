import { cueAmount } from '../construction.mjs';
import { TARGET_PROBS } from '../fixtures.mjs';
import { card, target, text } from '../defaults.mjs';

export function drawPooledEvaluation(ctx, scene, state, api) {
  const { C } = api,
    beat = state.beat ?? 0;
  if (beat < 2) {
    const fill = cueAmount(state, 0, 'pool-batches', 0.17, 0.48);
    const showLoss = cueAmount(state, 0, 'pool-bits', 0.55, 0.85);
    const answer = cueAmount(state, 1, 'pool-mean', 0.09, 0.4);
    const rows = [
      [0.5, null, null],
      [0.125, 0.125, 0.125],
    ];
    const probs = rows.flat().filter((v) => v !== null);
    const bits = probs.reduce((sum, p) => sum - Math.log2(p), 0);
    const mean = bits / probs.length;
    for (const [i, row] of rows.entries()) {
      const y = 350 + i * 255;
      text(ctx, api, 'Batch ' + (i ? 'B' : 'A'), 155, y + 54, 45, C.ink);
      target(ctx, api, i ? 'batch-b' : 'batch-a', () => {
        row.forEach((p, j) => {
          const x = 490 + 405 * j,
            show = fill > (i * 3 + j) / 6;
          card(
            ctx,
            api,
            show ? (p === null ? 'padding' : 'p = ' + p) : '?',
            x,
            y,
            335,
            85,
            p === null ? C.muted : i ? C.green : C.blue,
            36,
          );
          if (p !== null && showLoss > (i * 3 + j) / 6) {
            const count = -Math.log2(p);
            for (let k = 0; k < count; k++)
              api.rect(ctx, x + k * 75, y + 107, 65, 35, i ? C.green : C.blue);
            text(ctx, api, count + (count === 1 ? ' bit' : ' bits'), x, y + 188, 31, C.ink);
          }
        });
      });
    }
    target(ctx, api, 'pool-equation', () => {
      text(
        ctx,
        api,
        answer === 1
          ? bits + ' bits ÷ ' + probs.length + ' targets = ' + mean + ' bits per target'
          : 'Which positions enter the average?',
        155,
        931,
        41,
        C.ink,
      );
      if (answer === 1)
        text(ctx, api, 'PPL  ' + (2 ** mean).toFixed(3), 1640, 932, 48, C.yellow, 'right');
    });
  } else if (beat === 2) {
    const slide = cueAmount(state, 2, 'pool-stride', 0.17, 0.57);
    const windows = [
      [0, 1, 2, 3, 4],
      [3, 4, 5, 6, 7],
      [6, 7, 8, 9],
    ];
    const seen = new Set();
    target(ctx, api, 'pool-windows', () => {
      for (const [r, window] of windows.entries()) {
        if (r > Math.ceil(slide * 2)) break;
        window.forEach((pos) => {
          const context = seen.has(pos),
            x = 150 + pos * 163,
            y = 320 + r * 188;
          card(ctx, api, String(pos), x, y, 141, 75, context ? C.muted : C.green, 39);
          text(
            ctx,
            api,
            context ? 'context' : 'score',
            x + 70,
            y + 122,
            30,
            context ? C.muted : C.green,
            'center',
          );
          seen.add(pos);
        });
      }
    });
    text(ctx, api, seen.size + ' distinct scored targets', 150, 965, 45, C.ink);
  } else {
    const sample = 'The cat sat';
    const nll = -TARGET_PROBS.reduce((sum, p) => sum + Math.log(p), 0);
    const bytes = new TextEncoder().encode(sample);
    const measure = cueAmount(state, 3, 'pool-bytes', 0.18, 0.55);
    const result = cueAmount(state, 3, 'pool-bpb', 0.65, 0.83);
    text(ctx, api, 'Same text and stop rule in both scores', 170, 285, 37, C.muted);
    target(ctx, api, 'pool-byte-row', () => {
      for (const [i, byte] of bytes.entries()) {
        const x = 170 + 139 * i;
        card(ctx, api, byte === 32 ? '␣' : String.fromCharCode(byte), x, 368, 118, 96, C.cyan, 47);
        if (measure > i / bytes.length)
          text(
            ctx,
            api,
            '0x' + byte.toString(16).toUpperCase(),
            x + 59,
            523,
            31,
            C.muted,
            'center',
          );
      }
      if (measure === 1) text(ctx, api, bytes.length + ' UTF-8 bytes', 170, 620, 44, C.cyan);
    });
    text(ctx, api, nll.toFixed(3) + ' nats for the text and end token', 170, 749, 41, C.ink);
    target(ctx, api, 'pool-common-unit', () => {
      const left = 'Total nats ÷ ln 2 ÷ ' + bytes.length + ' bytes';
      const right =
        result === 1 ? ' = ' + (nll / Math.LN2 / bytes.length).toFixed(3) + ' bits per byte' : '';
      text(ctx, api, left + right, 170, 894, 46, C.yellow);
    });
  }
}

export default {
  id: 'pooled-evaluation',
  draw: drawPooledEvaluation,
  cues: ['pool-batches', 'pool-bits', 'pool-mean', 'pool-stride', 'pool-bytes', 'pool-bpb'],
};
