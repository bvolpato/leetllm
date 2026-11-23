import assert from 'node:assert/strict';
import { arrow, draw, fade, fadeIn, fadeOut, group, lagged, polygon, rect, smoother, text, to } from 'vizmatic/stage';
import { chip, HEADING_LEFT, HEADING_Y, row as arrangeRow } from '../kit.mjs';
import { IDS_A, IDS_B, PIECES, SENTENCE, TABLE } from '../../films/tokenization/model.mjs';

export function buildHook(stage, narration, { clearAtEnd }) {
  const scene = narration.scene('hook');
  const sentence = text(narration.title('hook'), { font: 'text-serif', size: 58 })
    .moveTo([0, HEADING_Y]).alignTo([HEADING_LEFT, 0], 'left');

  const pieces = PIECES.map(([piece]) => piece);
  const decode = (ids, vocabulary) => {
    const inverse = new Map(Object.entries(vocabulary).map(([piece, id]) => [id, piece]));
    return ids.map((id) => inverse.get(id).replace('·', ' ')).join('');
  };
  const runs = [IDS_A, IDS_B].map((vocabulary) => pieces.map((piece) => vocabulary[piece]));
  assert.equal(decode(runs[0], IDS_A), SENTENCE);
  assert.equal(decode(runs[1], IDS_B), SENTENCE);
  const mismatch = runs[0].findIndex((id, i) => id !== runs[1][i]);
  const selected = runs[1][mismatch];
  const learned = pieces.find((piece) => IDS_A[piece] === selected);
  assert.deepEqual([pieces[mismatch], selected, learned], ['·falls', 1, '·soft']);

  const x = (i) => -350 + i * 315;
  const wordParts = pieces.slice(-2).map((piece) => piece.replace('·', ''));
  assert.equal(wordParts.join(''), SENTENCE.split(' ').at(-1));
  const letters = wordParts.map((part) => text(part, { font: 'mono', size: 254, color: 'surface' }));
  const advances = letters.map((label) => 2 * label.get('px'));
  const left = -(advances[0] + advances[1]) / 2 - 90;
  const right = -left;
  const seam = left + 90 + advances[0];
  const top = -190, bottom = 190;
  const teeth = Array.from({ length: 13 }, (_, i) => [
    seam + (i % 2 ? 8 : -8), top + (bottom - top) * i / 12,
  ]);
  const paper = [
    polygon([[left + 24, top], ...teeth, [left + 24, bottom], [left, bottom - 24], [left, top + 24]],
      { fill: 'ink', stroke: null }),
    polygon([...teeth, [right - 24, bottom], [right, bottom - 24], [right, top + 24], [right - 24, top]],
      { fill: 'blue', stroke: null }),
  ];
  const strips = paper.map((face, i) => group(face, letters[i].at(
    i === 0 ? seam - advances[i] / 2 : seam + advances[i] / 2, 0,
  )));
  const cutY = -216;
  const cuts = pieces.map((piece, i) =>
    chip(piece, { w: 280, h: 120, size: 66, color: 'blue' }).at(x(i), cutY),
  );
  const legend = text('·  marks a space', { size: 42, color: 'dim' }).at(0, -344);
  const rowY = [-37, 124];
  const labels = ['Training IDs', 'Replacement IDs'].map((name, i) =>
    text(name, { size: 46, color: 'dim' }).moveTo([-710, rowY[i]]),
  );
  const idRows = runs.map((run, j) => run.map((id, i) =>
    text(String(id), { font: 'mono', size: 96 }).moveTo([x(i), rowY[j]]),
  ));
  const question = text('Which piece first selects a different row?', {
    font: 'text-serif', size: 69, color: 'yellow',
  }).moveTo([0, 338]);
  const focus = rect(290, 472, { radius: 18, stroke: 'yellow', width: 5 })
    .moveTo([x(mismatch), -44]);
  const rowPointer = arrow([x(mismatch), 204], [x(mismatch), 265], {
    stroke: 'yellow', width: 5, tip: 19,
  });
  const vector = TABLE[selected].map((value) => value.toFixed(1)).join('    ');
  const rowLabels = arrangeRow([
    text(`Row ${selected}`, { font: 'mono', size: 54, color: 'yellow' }),
    text(learned, { font: 'mono', size: 54, color: 'yellow' }),
    text(`[ ${vector} ]`, { font: 'mono', size: 53 }),
  ], 330, 72);
  const rowFrame = rect(1380, 112, { radius: 10, stroke: 'yellow', fill: 'surface', width: 3 })
    .moveTo([0, 330]);
  const decoded = text(`Replacement decodes to “${decode(runs[1], IDS_B)}”`, {
    size: 46, color: 'teal',
  }).moveTo([0, 451]);

  scene.at(0, () => stage.add(sentence, ...strips));
  scene.on('split', () => stage.play(
    to(strips[0], (strip) => strip.shift(-58, 0)),
    to(strips[1], (strip) => strip.shift(76, 28)),
    { duration: 0.8, ease: smoother },
  ), -0.2);
  scene.on('cuts', () => {
    stage.play(fadeOut(strips), { duration: 0.16 });
    stage.play(lagged(cuts.map((node) => fadeIn(node, { shift: [0, 36] })), { lag: 0.14 }),
      { duration: 0.6 });
  });
  scene.on('space', () => stage.play(fadeIn(legend), { duration: 0.25 }));
  const showRun = (index) => stage.play(
    fadeIn(labels[index]),
    lagged(idRows[index].map((node) => fadeIn(node, { shift: [0, -26] })), { lag: 0.18 }),
    { duration: 0.7 },
  );
  scene.on('training', () => showRun(0));
  scene.on('replacement', () => showRun(1));
  scene.on('question', () => stage.play(fadeIn(question), { duration: 0.3 }));
  scene.after('first', () => stage.play(
    fadeOut(question), fadeIn(focus),
    fade([...cuts, ...idRows.flat()].filter((_, index) => index % pieces.length !== mismatch), 0.5),
    { duration: 0.35 },
  ));
  scene.on('follow', () => stage.play(draw(rowPointer), fadeIn([rowFrame, rowLabels[0]]), { duration: 0.55 }));
  scene.after('learned', () => stage.play(fadeIn(rowLabels.slice(1)), { duration: 0.32 }));
  scene.on('round-trip', () => stage.play(fadeIn(decoded), { duration: 0.32 }));
  clearAtEnd(scene, [sentence, ...cuts, legend, ...labels, ...idRows.flat(), focus, rowPointer, rowFrame, ...rowLabels, decoded]);
}
