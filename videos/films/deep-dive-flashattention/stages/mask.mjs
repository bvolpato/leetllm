import { afterCue, cueMotion, decodeValues, sampleModel } from '../construction.mjs';

export function drawMask(ctx, scene, state, api) {
  const { C, focus } = api;
  const s = sampleModel(scene.id, state);
  const label = (v, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, v, x, y, size, color, align);
  const cellX = (j) => 490 + 209 * j;
  const supplied = afterCue(state, 1, 'mask-left');
  focus.target('mask-positions', () => {
    label('Key position', 135, 345, 30, C.muted);
    label('Value', 135, 432, 36);
    decodeValues.forEach((v, j) => {
      const x = cellX(j);
      if (j >= 3) {
        label('query ' + (j - 3), x, 252, 31, C.yellow, 'center');
        api.line(ctx, x, 270, x, 303, C.yellow, 3);
      }
      label(j, x, 345, 32, C.muted, 'center');
      label(v, x, 440, 61, C.ink, 'center');
    });
  });
  const leftToRight = cueMotion(state, 2, 'mask-align');
  focus.target('mask-mixtures', () => {
    for (let r = 0; r < 2; r++) {
      const y = 510 + 166 * r;
      label('Query ' + r, 135, y + 67, 39, C.yellow);
      for (let j = 0; j < 5; j++) {
        const allowed = s.mask[r][j];
        const color = !supplied || !allowed ? C.muted : s.repaired ? C.cyan : C.pink;
        api.rect(
          ctx,
          cellX(j) - 88,
          y,
          176,
          96,
          allowed && supplied ? color + '28' : C.panel,
          color,
          3,
        );
        label(
          !supplied ? '?' : allowed ? decodeValues[j] : '×',
          cellX(j),
          y + 66,
          47,
          color,
          'center',
        );
      }
      if (supplied) {
        const stop = cellX(r + 3 * leftToRight) + 88;
        api.line(ctx, cellX(0) - 88, y + 108, stop, y + 108, C.yellow, 4);
        api.line(ctx, stop, y + 108, stop, y + 121, C.yellow, 4);
      }
    }
  });
  focus.target('mask-answers', () => {
    label('Mean', 1650, 459, 31, C.muted, 'center');
    for (let r = 0; r < 2; r++) {
      const ready = s.repaired
        ? afterCue(state, 2, r ? 'mask-last-answer' : 'mask-first-answer')
        : afterCue(state, 1, 'mask-wrong');
      const allowed = decodeValues.filter((_, j) => s.mask[r][j]);
      const sum = allowed.reduce((a, v) => a + v, 0);
      const y = 510 + 166 * r;
      label(
        ready ? s.means[r] : '?',
        1650,
        y + 65,
        58,
        ready ? (s.repaired ? C.green : C.pink) : C.muted,
        'center',
      );
      if (supplied) label(`${sum} ÷ ${allowed.length}`, 1650, y + 113, 29, C.muted, 'center');
    }
  });
  focus.target('mask-contracts', () => {
    const note =
      s.b === 3
        ? 'Reference for this tail: explicit lower-right causal mask'
        : s.repaired
          ? 'Last query and last key coincide'
          : supplied
            ? 'Supplied mask starts at key 0'
            : 'Which values belong in query 0’s average?';
    label(note, 960, 964, 38, C.ink, 'center');
  });
}

export default {
  id: 'mask',
  draw: drawMask,
  cues: [
    'mask-pin',
    'mask-left',
    'mask-wrong',
    'mask-align',
    'mask-first-answer',
    'mask-last-answer',
    'mask-contract',
  ],
};
