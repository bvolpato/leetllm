import assert from 'node:assert/strict';
import { arrow, draw, fadeIn, fadeOut, group, rect, smoother, text, to } from 'vizmatic/stage';
import { chip, sceneHeading } from '../kit.mjs';
import { dot, IDS_A, IDS_B, TABLE } from '../../films/tokenization/model.mjs';

const pieces = Object.keys(IDS_A);
function remap(table) {
  const result = [...table];
  for (const piece of pieces) result[IDS_B[piece]] = table[IDS_A[piece]];
  return result;
}
const input = remap(TABLE);
for (const piece of pieces) assert.deepEqual(input[IDS_B[piece]], TABLE[IDS_A[piece]]);

// Use the separate output weights from the lookup scene at a new, supplied hidden vector.
const output = TABLE.map(([a, b, c]) => [c, a, b]);
const hidden = [0, 0, 1];
function nextPiece(table, vocabulary) {
  const scores = table.map((weights) => dot(hidden, weights));
  const id = scores.indexOf(Math.max(...scores));
  return { id, scores, piece: pieces.find((piece) => vocabulary[piece] === id) };
}
const original = nextPiece(output, IDS_A);
const partial = nextPiece(output, IDS_B);
const fixed = nextPiece(remap(output), IDS_B);
const slots = [IDS_B['·falls'], IDS_B['·soft']];
const otherMax = Math.max(...partial.scores.filter((_, id) => !slots.includes(id)));
assert.equal(otherMax, 0.5);
assert.deepEqual([original.id, original.piece], [5, '·falls']);
assert.deepEqual([partial.id, partial.piece], [5, '·soft']);
assert.deepEqual([fixed.id, fixed.piece], [1, original.piece]);
assert.equal(partial.scores[partial.id], fixed.scores[fixed.id]);

export function buildClose(stage, narration, { clearAtEnd, replaceNote }) {
  const scene = narration.scene('close');
  sceneHeading(stage, scene, narration.title('close'));
  const slotX = (id) => slots.indexOf(id) === 0 ? -440 : 440;
  const sockets = slots.map((id) =>
    text(`ID ${id}`, { font: 'mono', size: 82 }).moveTo([slotX(id), 97]),
  );
  const decoder = slots.map((id) => {
    const piece = pieces.find((name) => IDS_B[name] === id);
    return chip(piece, { w: 338, h: 98, size: 68, color: 'blue' }).moveTo([slotX(id), 238]);
  });
  const decoderLabel = text('Replacement dictionary', { size: 40, color: 'dim' }).moveTo([0, 319]);
  const leads = slots.map((id) =>
    arrow([slotX(id), 143], [slotX(id), 174], { width: 4, stroke: 'dim', tip: 13 }));
  const mapName = text('Replacement dictionary', { font: 'text-serif', size: 75 }).moveTo([0, -210]);
  const inputNote = text('Input rows moved to match the IDs', { size: 52, color: 'teal' }).moveTo([0, -77]);
  const vector = text(`Hidden vector  [${hidden.join('  ')}]`, { font: 'mono', size: 48 }).moveTo([-440, -354]);
  const limit = text(`Best of six other rows   ${otherMax.toFixed(1)}`, {
    size: 43, color: 'dim',
  }).moveTo([440, -354]);

  const cardY = -60;
  // The score stays attached to its weight row during the permutation. IDs and decoded pieces stay put.
  const weights = slots.map((id) => group(
    rect(668, 144, { radius: 12, fill: 'surface', stroke: 'teal', width: 3 }),
    text(`[ ${output[id].map((n) => n.toFixed(1)).join('    ')} ]`, {
      font: 'mono', size: 49,
    }).moveTo([0, -23]),
  ).at(slotX(id), cardY));
  const scores = slots.map((id) => text(`score  ${partial.scores[id].toFixed(1)}`, {
    font: 'mono', size: 44, color: 'teal',
  }).moveTo([slotX(id), cardY + 40]));
  const question = text('Which piece will the replacement print?', {
    font: 'text-serif', size: 63, color: 'yellow',
  }).moveTo([0, 403]);
  const answer = (run) => {
    const x = slotX(run.id);
    return {
      ring: rect(364, 122, { radius: 14, stroke: 'yellow', width: 5 }).moveTo([x, 238]),
      route: arrow([x, 143], [x, 174], { width: 5, stroke: 'yellow', tip: 13 }),
      word: text(`Emitted piece   ${run.piece}`, { font: 'mono', size: 57, color: 'yellow' }).moveTo([0, 403]),
    };
  };
  const wrong = answer(partial), right = answer(fixed);
  const reveal = (result) => stage.play(draw(result.route), fadeIn(result.ring), fadeIn(result.word), { duration: 0.38 });
  const state = (name, color) => text(name, { size: 41, color }).moveTo([0, -177]);
  const stale = state('Untied output weights in training order', 'dim');
  // Hide the status while the weights are between slots.
  const repaired = state('Output weights moved to match the IDs', 'teal');

  scene.at(0.1, () => stage.play(fadeIn(mapName), { duration: 0.35 }));
  scene.on('map', () => stage.play(fadeIn([...sockets, ...leads, ...decoder]), { duration: 0.5 }));
  scene.on('input', () => stage.play(fadeIn(inputNote), { duration: 0.35 }));
  scene.on('output', () => replaceNote([mapName, inputNote], fadeIn([stale, ...weights, decoderLabel])));
  scene.on('hidden', () => stage.play(fadeIn(vector), { duration: 0.3 }));
  scene.on('dot', () => stage.play(fadeIn(scores), { duration: 0.3 }));
  scene.after('other-rows', () => stage.play(fadeIn(limit), { duration: 0.3 }));
  scene.on('predict', () => stage.play(fadeIn(question), { duration: 0.35 }));
  scene.on('printed', () => stage.play(fadeOut(question), { duration: 0.15 }));
  scene.after('printed', () => reveal(wrong));

  const move = (index, x, y) => [
    to(weights[index], (w) => w.at(x, y)),
    to(scores[index], (score) => score.moveTo([x, y + 40])),
  ];
  scene.on('swap', () => {
    stage.play(fadeOut([wrong.ring, wrong.word, wrong.route, stale]), { duration: 0.22 });
    stage.play(...move(0, slotX(slots[0]), -235), { duration: 0.35, ease: smoother });
    stage.play(...move(0, slotX(slots[1]), -235), ...move(1, slotX(slots[0]), cardY),
      { duration: 0.85, ease: smoother });
    stage.play(...move(0, slotX(slots[1]), cardY), { duration: 0.35, ease: smoother });
    stage.play(fadeIn(repaired), { duration: 0.25 });
  });
  scene.after('restored', () => reveal(right));
  clearAtEnd(scene, [vector, limit, repaired, ...weights, ...scores, ...sockets, ...leads,
    ...decoder, decoderLabel, right.route, right.ring, right.word]);
}
