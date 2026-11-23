import assert from 'node:assert/strict';
import { fade, fadeIn, fadeOut, indicate, morph, rect, text } from 'vizmatic/stage';
import { sceneHeading } from '../kit.mjs';
import { leftText } from '../../films/tokenization/defaults.mjs';
import { applyRules, RULES } from '../../films/tokenization/model.mjs';

// Keep the letters fixed. Only the borders change when two adjacent pieces become one.
function wordStrip(word, center, y, step, size) {
  const left = center - word.length * step / 2;
  const letters = [...word].map((ch, i) =>
    text(ch, { font: 'mono', size }).moveTo([left + (i + 0.5) * step, y]).zIndex(3),
  );
  const border = (start, end, color) =>
    rect((end - start) * step - 12, size * 1.45, {
      radius: 12, fill: 'surface', stroke: color, width: 4,
    }).moveTo([left + (start + end) * step / 2, y]);
  return { letters, boxes: letters.map((_, i) => border(i, i + 1, 'blue')), border };
}

export function buildUnseen(stage, narration, { clearAtEnd, replaceNote }, { recipeLines }) {
  const scene = narration.scene('unseen');
  sceneHeading(stage, scene, narration.title('unseen'));
  const word = 'rainly';
  const strip = wordStrip(word, 0, -215, 198, 113);
  const prefixes = RULES.map((_, index) => applyRules(word, RULES.slice(0, index + 1))[0]);
  assert.deepEqual(prefixes, ['ra', 'rai', 'rain']);
  const merged = prefixes.map((piece) => strip.border(0, piece.length, 'yellow'));
  const held = text('l and y stay separate', { size: 52, color: 'teal' }).moveTo([409, -58]);
  const replay = text('Saved rules', { size: 51, color: 'dim' }).moveTo([-535, 45]);
  const examples = ['rainy', 'rail'].map((input, i) =>
    leftText(`${input} → ${applyRules(input, RULES).join(' + ')}`, 58, 168 + i * 111, {
      size: 57, font: 'mono',
    }),
  );

  scene.on('rainly', () => stage.play(fadeIn([...strip.letters, ...strip.boxes]), { duration: 0.4 }));
  for (const [i, box] of merged.entries()) {
    const old = i ? merged[i - 1] : strip.boxes[0];
    scene.on(`replay-${i + 1}`, () => stage.play(
      morph([old, strip.boxes[i + 1]], box),
      indicate(recipeLines[i], { scale: 1.05, color: 'ink' }), { duration: 0.5 },
    ));
  }
  scene.on('leftovers', () => stage.play(fadeIn(held), { duration: 0.32 }));
  scene.on('no-count', () => stage.play(fadeIn(replay), { duration: 0.3 }));
  scene.after('rainy-result', () => stage.play(fadeIn(examples[0]), { duration: 0.3 }));
  scene.after('rail-result', () => stage.play(fadeIn(examples[1]), { duration: 0.3 }));

  const rules = [[['r', 'a'], ['a', 'i']], [['a', 'i'], ['r', 'a']]];
  const lanes = rules.map((order, index) => {
    const y = -150 + index * 310;
    const next = applyRules('rain', [order[0]]);
    assert.deepEqual(next, applyRules('rain', order));
    const joined = order[0].join('');
    const start = 'rain'.indexOf(joined);
    const word = wordStrip('rain', 353, y, 196, 89);
    const names = order.map(([a, b], rank) =>
      leftText(`${rank + 1}.   ${a} + ${b}`, -797, y - 54 + rank * 99,
        { font: 'mono', size: 59 }),
    );
    return {
      word, start, names,
      fused: word.border(start, start + joined.length, 'yellow'),
      reason: text(`a is inside ${joined}`, { size: 46, color: 'teal' }).moveTo([353, y + 111]),
    };
  });
  const [upper, lower] = lanes;
  const headings = [
    leftText('Saved order', -800, -348, { size: 51, color: 'dim' }),
    text('Same input in both runs', { size: 51, color: 'dim' }).moveTo([353, -348]),
  ];
  const firstPicture = [...strip.letters, merged.at(-1), ...strip.boxes.slice(4), ...recipeLines,
    held, replay, ...examples];
  scene.on('order', () => replaceNote(firstPicture,
    fadeIn([...headings, ...upper.names, ...upper.word.letters, ...upper.word.boxes])));
  const runFirst = (lane) => stage.play(
    morph(lane.word.boxes.slice(lane.start, lane.start + 2), lane.fused),
    indicate(lane.names[0], { scale: 1.04, color: 'yellow' }), { duration: 0.48 },
  );
  const skipSecond = (lane) => stage.play(
    fade(lane.names[1], 0.5), fadeIn(lane.reason), { duration: 0.36 },
  );
  scene.after('upper-merge', () => runFirst(upper));
  scene.after('upper-skip', () => skipSecond(upper));
  scene.on('reverse', () => stage.play(
    fadeIn([...lower.names, ...lower.word.letters, ...lower.word.boxes]), { duration: 0.45 },
  ));
  const question = text('Which letters join in the lower run?', {
    font: 'text-serif', size: 58, color: 'yellow',
  }).moveTo([0, 416]);
  scene.on('ask-order', () => stage.play(fadeIn(question), { duration: 0.3 }));
  scene.on('lower-merge', () => stage.play(fadeOut(question), { duration: 0.15 }));
  scene.after('lower-merge', () => runFirst(lower));
  scene.after('lower-skip', () => skipSecond(lower));
  const vocabulary = text('A new piece would need a trained row', { size: 51, color: 'teal' }).moveTo([0, 416]);
  scene.on('no-row', () => stage.play(fadeIn(vocabulary), { duration: 0.35 }));
  clearAtEnd(scene, [...headings, vocabulary, ...lanes.flatMap((lane) => [
    ...lane.names, ...lane.word.letters, lane.fused, lane.reason,
    ...lane.word.boxes.filter((_, i) => i < lane.start || i > lane.start + 1),
  ])]);
}
