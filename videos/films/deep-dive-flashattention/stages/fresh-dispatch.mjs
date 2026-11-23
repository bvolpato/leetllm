import {
  afterCue,
  cueMotion,
  fallbackScores,
  sampleModel,
  transferQueries,
  transferValues,
} from '../construction.mjs';

export function drawFreshDispatch(ctx, scene, state, api) {
  const { C, focus } = api;
  const s = sampleModel(scene.id, state);
  const label = (v, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, v, x, y, size, color, align);
  const pos = (r) => 520 + 276 * r;
  const offset = transferQueries - transferValues.length;
  const dealing = s.b >= 2;
  const stripY = dealing ? 260 : 370;
  focus.target('fresh-strip', () => {
    label('Query row', 145, stripY, 36);
    label('Key value', 145, stripY + 115, 36);
    for (let r = 0; r < transferQueries; r++) {
      label(r, pos(r), stripY, 46, C.yellow, 'center');
    }
    const aligned = cueMotion(state, 0, 'fresh-align');
    transferValues.forEach((v, i) => {
      const cx = pos(i + offset * aligned);
      api.rect(ctx, cx - 84, stripY + 43, 168, 98, C.panel, C.cyan, 5);
      label(v, cx, stripY + 112, 50, C.cyan, 'center');
    });
  });
  const ready = (r) =>
    afterCue(state, 1, ['fresh-empty', 'fresh-empty', 'fresh-one', 'fresh-two', 'fresh-three'][r]);
  focus.target('fresh-outputs', () => {
    if (!dealing) {
      label('Allowed keys', 145, stripY + 226, 33, C.muted);
      s.mask.forEach((row, r) => {
        const count = row.filter(Boolean).length;
        label(ready(r) ? count : '?', pos(r), stripY + 226, 39, C.muted, 'center');
      });
    }
    const y = stripY + (dealing ? 226 : 350);
    label('Output', 145, y, 36, C.green);
    s.outputs.forEach((v, r) =>
      label(ready(r) ? v : '?', pos(r), y, 57, ready(r) ? C.green : C.muted, 'center'),
    );
  });
  if (!dealing) {
    label(
      s.b === 0
        ? 'Which rows are empty? What is the last output?'
        : 'Equal scores give each allowed value an equal share.',
      960,
      938,
      38,
      C.ink,
      'center',
    );
    return;
  }
  const { buffer } = s;
  const known = afterCue(state, 3, 'fresh-three-bytes');
  const admitted = buffer.fits && afterCue(state, 4, 'fresh-pair');
  const x = (bytes) => 200 + bytes * 1.89;
  // This ruler counts the score tensor alone. Every item uses the same four-head shape.
  focus.target('fresh-memory', () => {
    label('FP32 scores per item', 145, 604, 35);
    label(
      `${buffer.heads} heads × ${transferQueries} rows × ${transferValues.length} keys × ${buffer.scoreWidth} bytes`,
      675,
      604,
      35,
      C.cyan,
    );
    const limit = x(buffer.scoreAllowance);
    label(buffer.scoreAllowance + ' B available', limit, 682, 35, C.yellow, 'center');
    api.line(ctx, x(0), 810, x(760), 810, C.muted, 3);
    api.line(ctx, limit, 693, limit, 707, C.yellow, 4);
    const width = x(buffer.bytesPerItem) - x(0);
    const itemsDrawn = known ? buffer.items : cueMotion(state, 2, 'fresh-slab') > 0 ? 1 : 0;
    for (let item = 0; item < itemsDrawn; item++) {
      const cx = x(0) + item * width;
      const c = item === 2 && !buffer.fits ? C.pink : C.blue;
      api.rect(ctx, cx, 720, width - 6, 72, c + '30', c, 3);
      const number = admitted && buffer.items === 1 ? 3 : item + 1;
      const size = afterCue(state, 3, 'fresh-item-bytes') ? ' · ' + buffer.bytesPerItem + ' B' : '';
      label('Item ' + number + size, cx + width / 2, 770, 34, c, 'center');
    }
    api.line(ctx, limit, 799, limit, 832, C.yellow, 4);
    label(
      admitted && buffer.items === 1
        ? `Peak across both calls: ${fallbackScores(2).scoreBytes} B`
        : known
          ? buffer.scoreBytes +
            ' B for ' +
            (buffer.items === 1 ? 'one item' : buffer.items + ' items')
          : 'Three items requested',
      145,
      915,
      40,
    );
  });
  focus.target('fresh-decision', () => {
    let message = 'Does the score buffer fit?';
    if (afterCue(state, 3, 'fresh-block') && !buffer.fits) message = 'Hold the batch of three';
    if (!admitted && cueMotion(state, 3, 'fresh-retry') > 0)
      message = 'Would the first two fit together?';
    if (admitted)
      message = ['Buffer released', 'Run item 3 after release', 'Run items 1 and 2'][buffer.items];
    label(message, 1760, 915, 41, admitted ? C.green : C.yellow, 'right');
  });
}

export default {
  id: 'fresh-dispatch',
  draw: drawFreshDispatch,
  cues: [
    'fresh-align',
    'fresh-empty',
    'fresh-one',
    'fresh-two',
    'fresh-three',
    'fresh-slab',
    'fresh-item-bytes',
    'fresh-three-bytes',
    'fresh-block',
    'fresh-retry',
    'fresh-two-bytes',
    'fresh-pair',
    'fresh-release',
    'fresh-last',
  ],
};
