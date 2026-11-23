import { spokenCue } from '../construction.mjs';
import { box, drawExtendedText, drawExtendedTitle } from '../defaults.mjs';

function drawHistory(ctx, scene, state, api) {
  const { C } = api;
  const limit = spokenCue(scene, state, 'history-limit');
  const unit = 190;
  const left = 605;
  drawExtendedTitle(ctx, api, 'Same scored text: a·a     ·     Each dot marks a space');
  [
    ['a', ' a'],
    ['a', ' ', 'a'],
  ].forEach((pieces, row) => {
    const y = 425 + row * 280;
    const color = row === 0 ? C.blue : C.cyan;
    const cut = spokenCue(scene, state, row === 0 ? 'joined-cut' : 'separate-cut').progress;
    const keep = pieces.slice(-2).join('').length;
    const excluded = pieces.join('').length - keep;
    api.focus.target(row === 0 ? 'joined-history' : 'separate-history', () => {
      drawExtendedText(
        ctx,
        api,
        row === 0 ? 'Joined space' : 'Separate space',
        155,
        y + 62,
        42,
        color,
      );
      api.rect(ctx, left, y, 3 * unit, 100, C.panel, C.muted, 2);
      let offset = 0;
      pieces.forEach((piece, i) => {
        for (const letter of piece) {
          const faded = limit.phase === 'after' && offset < excluded;
          drawExtendedText(
            ctx,
            api,
            letter === ' ' ? '·' : letter,
            left + (offset + 0.5) * unit,
            y + 70,
            55,
            faded ? C.muted : C.ink,
            'center',
          );
          offset++;
        }
        if (i < pieces.length - 1 && cut > 0)
          api.line(
            ctx,
            left + offset * unit,
            y + 100,
            left + offset * unit,
            y + 100 * (1 - cut),
            color,
            4,
          );
      });
      if (cut === 1) {
        const start = left + limit.progress * excluded * unit;
        api.line(ctx, start, y + 125, left + 3 * unit, y + 125, color, 5);
        const label = limit.phase === 'after' ? keep + ' bytes in view' : pieces.length + ' tokens';
        drawExtendedText(ctx, api, label, 1485, y + 63, 40, color, 'center');
      }
    });
  });
  if (limit.phase === 'after')
    drawExtendedText(
      ctx,
      api,
      'Both models can read two tokens of history.',
      960,
      1010,
      40,
      C.ink,
      'center',
    );
}

export function drawNormalization(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cue = (id) => spokenCue(scene, state, id);
  {
    if (currentBeat === 0) {
      const raw = ['Ａ  a', 'A a', 'a a'];
      const widths = raw.map((s) => s.normalize('NFKC'));
      const folded = widths.map((s) => s.toLowerCase());
      const output = folded[0].replace(/ +/g, ' ');
      const display = (s) => s.replaceAll(' ', '·');
      const xs = [175, 595, 1015, 1450];
      const ys = [455, 655, 855];
      const headings = ['Raw text', 'NFKC', 'Fold case', 'Collapse spaces'];
      const ids = ['norm-input', 'norm-width', 'norm-case', 'norm-output'];
      const branches = [
        1,
        cue('normalizer-other-inputs').progress,
        cue('normalizer-last').progress,
      ];
      const stages = [
        1,
        cue('normalizer-width').progress,
        cue('normalizer-case').progress,
        cue('normalizer-spaces').progress,
      ];
      drawExtendedTitle(ctx, api, 'Each dot marks one space');
      for (let col = 0; col < 4; col++) {
        api.focus.target(ids[col], () => {
          const x = xs[col];
          drawExtendedText(
            ctx,
            api,
            headings[col],
            x + 125,
            370,
            36,
            col === 0 ? themeColors.muted : themeColors.ink,
            'center',
          );
          if (col === 3) {
            if (stages[col] >= 1)
              box(ctx, api, display(output), x, ys[1], 250, 90, themeColors.cyan, 48);
          } else {
            const values = [raw, widths, folded][col];
            values.forEach((value, i) => {
              if (col === 0 || (branches[i] === 1 && stages[col] === 1))
                box(ctx, api, display(value), x, ys[i], 250, 90, themeColors.blue, 48);
            });
          }
          if (col < 3 && stages[col] === 1) {
            const firstLetter = [raw, widths, folded][col][0].codePointAt(0);
            const hex = firstLetter.toString(16).toUpperCase().padStart(4, '0');
            drawExtendedText(
              ctx,
              api,
              'U+' + hex,
              x + 125,
              ys[0] + 135,
              29,
              themeColors.muted,
              'center',
            );
          }
          if (col === 0) return;
          for (let i = 0; i < 3; i++) {
            const travel = Math.min(stages[col], branches[i]);
            if (travel <= 0) continue;
            const x1 = xs[col - 1] + 260,
              x2 = x - 12;
            const y1 = ys[i] + 45,
              y2 = (col === 3 ? ys[1] : ys[i]) + 45;
            api.line(
              ctx,
              x1,
              y1,
              api.lerp(x1, x2, travel),
              api.lerp(y1, y2, travel),
              themeColors.muted,
              3,
            );
          }
        });
      }
    } else if (currentBeat === 3) {
      drawHistory(ctx, scene, state, api);
    } else {
      const raw = Buffer.from('Ａ  a');
      const kept = Buffer.from('a a');
      const total = 1.2;
      drawExtendedTitle(ctx, api, 'Prediction of “a·a”  ·  total loss 1.2 nats');
      [raw, kept].forEach((bytes, i) => {
        const y = 442 + i * 285;
        const color = i === 0 ? themeColors.blue : themeColors.cyan;
        const rate = total / (bytes.length * Math.LN2);
        const rateCue = i === 0 ? 'normalized-bpb' : 'retained-bpb';
        api.focus.target('raw-bytes', () => {
          drawExtendedText(ctx, api, i === 0 ? 'Original text' : 'Scored text', 175, y, 41, color);
          drawExtendedText(
            ctx,
            api,
            bytes.length + ' UTF-8 bytes',
            175,
            y + 65,
            33,
            themeColors.muted,
          );
          bytes.forEach((byte, j) =>
            box(
              ctx,
              api,
              byte.toString(16).toUpperCase().padStart(2, '0'),
              520 + j * 125,
              y - 61,
              110,
              96,
              color,
              39,
            ),
          );
        });
        api.focus.target('norm-units', () => {
          const chosen = i === 1 && currentBeat === 2 && cue('choose-normalized').phase === 'after';
          api.focus.target(i === 1 ? 'scored-rate' : 'raw-rate', () => {
            drawExtendedText(
              ctx,
              api,
              'bits / ' + (i === 0 ? 'raw byte' : 'scored byte'),
              1560,
              y - 46,
              33,
              themeColors.muted,
              'center',
            );
            drawExtendedText(
              ctx,
              api,
              cue(rateCue).phase === 'after' ? rate.toFixed(3) : '…',
              1560,
              y + 32,
              57,
              color,
              'center',
            );
            if (chosen) api.line(ctx, 1460, y + 58, 1660, y + 58, color, 5);
          });
        });
      });
      if (currentBeat === 2 && cue('choose-normalized').phase === 'after')
        drawExtendedText(
          ctx,
          api,
          'Lowercase benchmark: compare both models on the same three bytes.',
          960,
          965,
          47,
          themeColors.ink,
          'center',
        );
    }
    return;
  }
}
export default {
  id: 'normalization',
  draw: drawNormalization,
  cues: [
    'normalizer-width',
    'normalizer-case',
    'normalizer-spaces',
    'normalizer-last',
    'normalizer-output',
    'normalizer-other-inputs',
    'raw-byte-count',
    'normalized-bpb',
    'retained-bpb',
    'choose-normalized',
    'joined-cut',
    'separate-cut',
    'history-limit',
  ],
};
