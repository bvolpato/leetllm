import { chapterCard, text } from '../defaults.mjs';
import { documents, motion, passed, results } from '../ledger.mjs';

export function drawPrimitiveContract(ctx, scene, state, api) {
  const { C } = api;
  if (state.beat === 0) {
    const codes = Array.from(documents[0], (letter) => letter.codePointAt(0));
    const sum = codes.reduce((a, b) => a + b, 0);
    const others = motion(state, 'ray-feature-values', 0);
    const ready = passed(state, 'primitive-cache-remainder', 0) || others > 0;
    const seen = ready
      ? codes.length
      : Math.floor(motion(state, 'ray-primitive-contract-op-0', 0) * codes.length);
    api.focus.target('primitive-codes', () => {
      codes.forEach((code, i) => {
        const x = 185 + i * 181;
        text(ctx, api, documents[0][i], x + 72, 342, 67, C.ink, 'center');
        chapterCard(ctx, api, String(code), x, 388, 144, i < seen ? C.green : C.muted, 100, 40);
      });
      text(
        ctx,
        api,
        'partial sum ' + codes.slice(0, seen).reduce((a, b) => a + b, 0),
        619,
        600,
        63,
        C.green,
        'center',
      );
    });
    api.focus.target('primitive-cache', () => {
      text(ctx, api, 'Length      ' + codes.length, 1160, 353, 49);
      text(ctx, api, 'Remainder', 1160, 479, 39, C.muted);
      text(
        ctx,
        api,
        (seen === codes.length ? sum : '?') + ' − 4 × 101 = ' + (ready ? results[0][1] : '?'),
        1160,
        561,
        44,
        ready ? C.green : C.ink,
      );
    });
    api.line(ctx, 150, 682, 1760, 682, C.muted, 2);
    text(ctx, api, 'cache', 165, 778, 43);
    if (ready) text(ctx, api, '[' + results[0].join(', ') + ']', 165, 923, 49, C.green);
    api.focus.target('primitive-other-rows', () => {
      for (const [i, name] of documents.slice(1).entries()) {
        const x = 710 + i * 550;
        const letters = Math.floor(Math.max(0, Math.min(1, others * 2 - i)) * name.length);
        text(ctx, api, name, x, 778, 43);
        if (letters > 0) {
          const total = Array.from(name.slice(0, letters)).reduce(
            (n, c) => n + c.codePointAt(0),
            0,
          );
          text(ctx, api, 'partial sum ' + total, x, 844, 35, C.muted);
        }
        if (letters === name.length)
          text(ctx, api, '[' + results[i + 1].join(', ') + ']', x, 923, 49, C.green);
      }
    });
    return;
  }
  if (state.beat === 1) {
    const done = passed(state, 'ray-tuple-immutable', 1);
    const col = [175, 800, 1310];
    ['Task call', 'Driver’s handle', 'Result tuple'].forEach((v, i) =>
      text(ctx, api, v, col[i], 333, 43),
    );
    documents.forEach((word, i) => {
      const y = 474 + i * 143;
      text(ctx, api, 'features.remote("' + word + '")', col[0], y, 37, C.ink);
      api.focus.target('primitive-handles', () =>
        text(ctx, api, 'ObjectRef ' + String.fromCharCode(65 + i), col[1], y, 39, C.cyan),
      );
      api.focus.target('primitive-values', () =>
        text(
          ctx,
          api,
          done ? '(' + results[i].join(', ') + ')' : 'pending',
          col[2],
          y,
          42,
          done ? C.green : C.muted,
        ),
      );
    });
    return;
  }
  api.focus.target('primitive-queue', () => {
    text(ctx, api, 'Waiting calls from one submitter', 145, 357, 38);
    chapterCard(ctx, api, 'Read count', 147, 480, 340, C.cyan, 114, 36);
    chapterCard(ctx, api, 'Record batch', 525, 480, 360, C.cyan, 114, 36);
    api.arrow(ctx, 907, 537, 1070, 537, C.cyan, 4);
    api.rect(ctx, 1100, 398, 644, 373, C.panel, C.yellow, 14);
    text(ctx, api, 'Ledger process', 1422, 483, 45, C.yellow, 'center');
    text(ctx, api, '1 method running', 1422, 604, 53, C.ink, 'center');
    text(ctx, api, 'Other calls wait their turn', 1422, 690, 33, C.muted, 'center');
  });
}
export default {
  id: 'primitive-contract',
  draw: drawPrimitiveContract,
  cues: [
    'ray-primitive-contract-op-0',
    'primitive-cache-remainder',
    'ray-feature-values',
    'ray-primitive-contract-op-1',
    'ray-tuple-immutable',
    'ray-primitive-contract-op-2',
  ],
};
