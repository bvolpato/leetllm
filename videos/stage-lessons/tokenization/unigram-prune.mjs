import assert from 'node:assert/strict';
import { draw, fade, fadeIn, fadeOut, group, lagged, line, rect, text } from 'vizmatic/stage';
import { chip, sceneHeading } from '../kit.mjs';
import { CANDIDATES, LATTICE_PROBS } from '../../films/tokenization/model.mjs';

const routes = [['▁rain'], ['▁', 'rain'], ['▁', 'ra', 'in']];
const scores = routes.map((pieces) => pieces.reduce((p, piece) => p * LATTICE_PROBS[piece], 1));
function trial(removed) {
  const live = scores.filter((_, i) => !routes[i].includes(removed));
  return { best: Math.max(...live), total: live.reduce((sum, p) => sum + p, 0) };
}
const base = trial(null);
const short = trial('in');
const whole = trial('▁rain');
assert.deepEqual([base, short, whole].map((t) => t.total.toFixed(5)), ['0.31509', '0.31500', '0.01509']);
assert.equal(base.best, short.best);
assert.equal(base.best / whole.best, 20);
assert.equal(Math.log(base.best / whole.best).toFixed(2), '3.00');
assert.equal((100 * whole.total / base.total).toFixed(1), '4.8');
assert(short.total > whole.total);
for (const route of routes) assert.equal(route.join(''), '▁rain');

export function buildUnigramPrune(stage, narration, { clearAtEnd, replaceNote }) {
  const scene = narration.scene('unigram-prune');
  sceneHeading(stage, scene, narration.title('unigram-prune'));

  // Each row spans the same five characters. Removing a piece breaks its entire route.
  const left = -820, step = 194;
  const routeY = (index) => -200 + index * 132;
  const strips = routes.map((pieces, r) => {
    let boundary = 0;
    return pieces.map((piece) => {
      const x = left + (boundary + piece.length / 2) * step;
      boundary += piece.length;
      return chip(piece, { w: piece.length * step - 12, h: 96, size: 56, color: 'blue' })
        .moveTo([x, routeY(r)]);
    });
  });
  const headers = [
    text('Three cuts of the same word', { size: 49, color: 'dim' }).moveTo([left + 2.5 * step, -338]),
    text('Path probability', { size: 49, color: 'dim' }).moveTo([545, -338]),
  ];
  const values = scores.map((score, i) =>
    text(score.toFixed(5), { font: 'mono', size: 66 }).moveTo([545, routeY(i)]),
  );
  const cells = strips.map((tiles, i) => [...tiles, values[i]]);
  const rule = line([-835, 157], [835, 157], { stroke: 'grid', width: 3 });
  const label = (content, x, y) => text(content, { size: 42, color: 'dim' }).moveTo([x, y]);
  const amount = (value, x, y, color = 'ink') =>
    text(value, { font: 'mono', size: 59, color }).moveTo([x, y]);
  const baseline = [label('All three paths', -645, 237), amount(base.total.toFixed(5), -265, 237)];
  const liveLabel = label('Surviving total', 157, 237);
  const current = [base, short, whole].map((test) => amount(test.total.toFixed(5), 598, 237, 'teal'));
  const pending = () => amount('?', 598, 237, 'yellow');
  const pendingShort = pending(), pendingWhole = pending();
  const mark = (tile) => {
    const { x, y, width, height } = tile.bounds();
    const stroke = { stroke: 'red', width: 6 };
    return group(
      line([-19, -19], [19, 19], stroke),
      line([-19, 19], [19, -19], stroke),
    ).moveTo([x + width - 46, y + height / 2]).zIndex(3);
  };
  const shortCut = mark(strips[2][2]), wholeCut = mark(strips[0][0]);
  const guide = (tile) => {
    const { x, y, width, height } = tile.bounds();
    return line([x + 8, y + height + 7], [x + width - 8, y + height + 7], { stroke: 'yellow', width: 4 });
  };
  const candidates = [guide(strips[2][2]), guide(strips[0][0])];
  const question = text('Drop in or ▁rain? Which keeps more probability?', {
    font: 'mono', size: 51, color: 'yellow',
  }).moveTo([0, 390]);
  const record = (piece, probability, x) =>
    group(
      rect(750, 134, { radius: 12, stroke: 'teal', fill: 'surface', width: 3 }),
      text(`Drop ${piece} → ${probability.toFixed(5)}`, { font: 'mono', size: 46, color: 'teal' })
        .moveTo([0, -24]),
      text(`${Number((100 * probability / base.total).toFixed(2))}% of original total`, { size: 38, color: 'dim' })
        .moveTo([0, 33]),
    ).at(x, 385);
  const shortRecord = record('in', short.total, -430);
  const wholeRecord = record('▁rain', whole.total, 430);
  const bestChoice = rect(774, 154, { radius: 14, stroke: 'yellow', width: 5 }).moveTo([-430, 385]);

  scene.at(0.12, () => stage.play(fadeIn(headers), fadeIn(strips.flat()), { duration: 0.4 }));
  scene.after('restore-score', () => stage.play(fadeIn(values[0]), { duration: 0.28 }));
  scene.on('other-cuts', () => stage.play(lagged(values.slice(1).map((v) => fadeIn(v)), { lag: 0.4 }), { duration: 0.55 }));
  scene.on('add', () => stage.play(draw(rule), { duration: 0.5 }));
  scene.after('sum', () => stage.play(fadeIn([...baseline, liveLabel, current[0]]), { duration: 0.35 }));
  scene.on('consider-short', () => stage.play(draw(candidates[0]), { duration: 0.35 }));
  scene.on('consider-whole', () => stage.play(draw(candidates[1]), { duration: 0.35 }));
  scene.on('which', () => stage.play(fadeIn(question), { duration: 0.4 }));
  scene.on('remove-short', () => stage.play(
    fadeOut([question, ...candidates, current[0]]), draw(shortCut), fade(cells[2], 0.42), fadeIn(pendingShort),
    { duration: 0.4 },
  ));
  scene.after('short-total', () => replaceNote(pendingShort, fadeIn(current[1]), fadeIn(shortRecord)));
  scene.on('reset', () => {
    stage.play(fadeOut([shortCut, current[1]]), fade(cells[2], 1), { duration: 0.25 });
    stage.play(fadeIn(current[0]), { duration: 0.22 });
  });
  scene.on('remove-whole', () => stage.play(
    fadeOut(current[0]), draw(wholeCut), fade(cells[0], 0.42), fadeIn(pendingWhole),
    { duration: 0.4 },
  ));
  const bestPathRing = rect(400, 96, { radius: 12, stroke: 'yellow', width: 4 })
    .moveTo([545, routeY(1)]);
  const ratio = base.best / whole.best;
  const bestRatio = text(`${base.best.toFixed(2)} ÷ ${whole.best} = ${ratio}`, {
    font: 'mono', size: 44, color: 'yellow',
  }).moveTo([430, 355]);
  const logDrop = text(`ln(${ratio}) ≈ ${Math.log(ratio).toFixed(2)} nats`, {
    font: 'mono', size: 42, color: 'dim',
  }).moveTo([430, 419]);
  scene.after('best-left', () => stage.play(fadeIn(bestPathRing), { duration: 0.3 }));
  scene.after('best-ratio', () => stage.play(fadeIn(bestRatio), { duration: 0.25 }));
  scene.after('log-drop', () => stage.play(fadeIn(logDrop), { duration: 0.25 }));
  scene.after('whole-total', () => replaceNote([pendingWhole, bestRatio, logDrop], fadeIn(current[2]), fadeIn(wholeRecord)));
  scene.after('choice', () => stage.play(fadeIn(bestChoice), { duration: 0.3 }));

  // This shelf shows the size of a separate illustrative vocabulary over successive rounds.
  const required = CANDIDATES.filter((piece) => [...piece].length === 1).length;
  const initial = CANDIDATES.length;
  const sizes = [initial];
  while (sizes.at(-1) > 21) sizes.push(Math.round(sizes.at(-1) * 0.8));
  assert.deepEqual(sizes, [41, 33, 26, 21]);
  assert(required < sizes.at(-1));
  const slotWidth = 39;
  const shelf = Array.from({ length: initial }, (_, i) =>
    rect(slotWidth - 5, 112, {
      radius: 5, stroke: i < required ? 'green' : 'teal',
      fill: i < required ? 'green' : 'surface', width: 3,
    }).moveTo([(i - (initial - 1) / 2) * slotWidth, 28]),
  );
  const title = text('Candidate pieces in the vocabulary', { font: 'text-serif', size: 72 }).moveTo([0, -260]);
  const counts = sizes.map((n) =>
    text(`${n} pieces`, { font: 'mono', size: 85 }).moveTo([0, -114]),
  );
  const alphabet = label('Required characters', -(initial - required) * slotWidth / 2, 159);
  const bracket = line([-(initial * slotWidth) / 2, 111], [(required - initial / 2) * slotWidth, 111],
    { stroke: 'green', width: 5 });
  const fit = text('Fit probabilities across the corpus', { size: 49, color: 'teal' }).moveTo([0, 338]);
  const keep = text('Keep about 80% each round', { size: 49, color: 'teal' }).moveTo([0, 338]);
  const board = [...headers, ...cells.flat(), rule, ...baseline, liveLabel, current[2], wholeCut,
    bestPathRing, shortRecord, wholeRecord, bestChoice];
  scene.on('vocabulary', () => replaceNote(board, fadeIn([title, ...shelf, counts[0], alphabet, bracket])));
  scene.on('fit', () => stage.play(fadeIn(fit), { duration: 0.4 }));
  scene.on('fraction', () => replaceNote(fit, fadeIn(keep)));
  for (const [index, cue] of ['round-one', 'round-two', 'round-three'].entries()) {
    scene.after(cue, () => {
      stage.play(fadeOut([counts[index], ...shelf.slice(sizes[index + 1], sizes[index])]), { duration: 0.22 });
      stage.play(fadeIn(counts[index + 1]), { duration: 0.22 });
    });
  }
  clearAtEnd(scene, [title, ...shelf.slice(0, sizes.at(-1)), counts.at(-1), alphabet, bracket, keep]);
}
