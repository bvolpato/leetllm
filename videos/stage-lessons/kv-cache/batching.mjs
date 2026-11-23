import assert from 'node:assert/strict';
import { arrow, line, rect } from 'vizmatic/stage';
import { blocksFor } from '../../films/kv-cache/model.mjs';
import { left, picture, tile, words } from './picture.mjs';

const color = { A: 'blue', B: 'orange', C: 'green' };
const stepX = i => -320 + i * 214;
const label = (value, y, size = 52, ink = 'ink') => left(words(value, size, ink), -840, y);

function schedule(p) {
  const { clock, show, caption } = p;
  const rows = [-237, -132, 79, 184];
  const done = 2, steps = 6;
  const cell = (request, step, row) => tile(request, {
    w: 186, h: 83, size: 52, color: color[request], solid: true,
  }).at(stepX(step), rows[row]);
  const lane = (request, from, to, row) => Array.from({ length: to - from },
    (_, i) => cell(request, from + i, row));
  const empty = row => Array.from({ length: steps }, (_, i) =>
    rect(186, 83, { radius: 10, stroke: 'dim', width: 2 }).at(stepX(i), rows[row]));
  clock.at(0, () => show([
    label('Iteration', -344, 44, 'dim'),
    ...Array.from({ length: steps }, (_, i) => words(String(i + 1), 48, 'dim', 'mono').moveTo([stepX(i), -344])),
    label('Static batch', rows[0]), ...empty(0), ...empty(1),
    ...lane('A', 0, done, 0), ...lane('B', 0, steps, 1),
  ], 0));
  clock.on('waits', () => caption('C is waiting.', color.C));
  clock.on('idle', () => caption('A finishes at step 2. Its lane stays idle.'));
  clock.on('continuous', () => show([
    label('Continuous batch', rows[2], 48), ...empty(2), ...empty(3),
    ...lane('A', 0, done, 2), ...lane('B', 0, steps, 3),
  ]));
  const boundaryX = (stepX(done - 1) + stepX(done)) / 2;
  clock.on('boundary', () => show(line([boundaryX, rows[2] - 62], [boundaryX, rows[3] + 62],
    { stroke: 'yellow', width: 4 })));
  clock.on('ask', () => caption('When can C start?', 'yellow'));
  clock.after('join', () => {
    show(lane('C', done, steps, 2));
    caption('C enters the batch. B keeps its lane.');
  });
}

function pool(p, slotBlock) {
  const { clock, show, hide, clear, caption } = p;
  const slots = 4, xs = [-514, -176, 162, 500];
  const block = (index, count, ink) => slotBlock(slots, count, ink, {
    w: 232, h: 232, columns: 2,
  }).at(xs[index], -38);
  const owner = (name, index) => words(name, 60, color[name], 'mono').moveTo([xs[index], -230]);
  const allocation = (name, tokens, first) => Array.from({ length: blocksFor(tokens, slots) }, (_, i) =>
    block(first + i, Math.min(slots, tokens - i * slots), color[name]));
  const a = allocation('A', 8, 0), b = allocation('B', 5, a.length), c = allocation('C', 3, 0);
  const bCount = b.length, nextB = 6;
  const startTotal = a.length + bCount;
  const nextTotal = c.length + blocksFor(nextB, slots);
  assert.deepEqual([startTotal, bCount, nextTotal], [4, 2, 3]);
  const counter = n => words(n + ' blocks in use', 80, 'ink', 'mono').moveTo([0, 235]);
  const counts = [startTotal, bCount, nextTotal].map(counter);
  clock.on('pool', () => {
    clear();
    show([label('4 token positions per block', -350), ...xs.map((_, i) => block(i, 0, 'dim'))]);
    caption('End of step 2');
  });
  const aOwners = a.map((_, i) => owner('A', i));
  clock.on('a', () => show([...a, ...aOwners]));
  clock.on('b', () => show([...b, ...b.map((_, i) => owner('B', a.length + i))]));
  clock.after('four', () => show(counts[0]));
  clock.on('release', () => {
    hide([...a, ...aOwners, counts[0]]);
    show(counts[1]);
    caption('A releases two blocks. B keeps its history.');
  });
  clock.on('c', () => {
    hide(counts[1]);
    show([...c, owner('C', 0)]);
    caption('C fills three slots in a returned block.');
  });
  clock.on('six', () => {
    hide(b.at(-1));
    show(block(startTotal - 1, nextB - (bCount - 1) * slots, color.B));
  });
  clock.after('three', () => show(counts[2]));
  clock.on('scheduler', () => caption('The scheduler chose C. Paging supplied its block.'));
}

function prefill(p) {
  const { clock, show, clear, caption, finish } = p;
  const budget = 4, promptTokens = 6, perChunk = budget - 1;
  assert.equal(promptTokens / perChunk, 2);
  const tokenX = i => -272 + i * 265;
  const rows = [-140, 42];
  clock.on('prompt', () => {
    clear();
    show([label('Prompt', -265), ...Array.from({ length: promptTokens }, (_, i) =>
      tile('P' + (i + 1), { w: 139, h: 99, size: 46, color: 'yellow' }).at(-380 + i * 203, -265))]);
  });
  clock.on('queue', () => show(tile('Queue', { w: 325, h: 132, size: 54, color: 'dim' }).at(-635, 65)));
  clock.on('prefill', () => show([
    arrow([-465, 65], [-335, 65], { stroke: 'dim', width: 4, tip: 20 }),
    tile('Prefill', { w: 515, h: 132, size: 54, color: 'yellow' }).at(-65, 65),
  ]));
  clock.on('first-token', () => show([
    arrow([204, 65], [334, 65], { stroke: 'teal', width: 4, tip: 20 }),
    tile('First token', { w: 450, h: 132, size: 54, color: 'teal' }).at(575, 65),
  ]));
  clock.on('chunk', () => {
    clear();
    show([label('4 tokens per iteration', -330),
      ...rows.flatMap((y, r) => [
        label('Iteration ' + (r + 1), y),
        ...Array.from({ length: budget }, (_, i) =>
          rect(233, 108, { radius: 10, stroke: 'dim', width: 2 }).at(tokenX(i), y)),
      ]),
    ]);
  });
  const entry = (text, ink, i, row) => tile(text, {
    w: 233, h: 108, size: 45, color: ink, solid: true,
  }).at(tokenX(i), rows[row]);
  clock.on('decode', () => show(rows.map((_, r) => entry('B', color.B, 0, r))));
  clock.on('first-chunk', () => show(Array.from({ length: perChunk }, (_, i) =>
    entry('P' + (i + 1), 'yellow', i + 1, 0))));
  clock.on('last-chunk', () => show(Array.from({ length: perChunk }, (_, i) =>
    entry('P' + (i + perChunk + 1), 'yellow', i + 1, 1))));
  clock.on('scores', () => caption('P6 supplies the scores for the first answer token.'));
  clock.on('latency', () => caption('Compare time to first token and the gap between B’s tokens.'));
  clock.on('separate', () => {
    clear();
    show([tile('Prefill GPU', { w: 510, h: 192, size: 62, color: 'yellow' }).at(-535, -56),
      tile('Decode GPU', { w: 510, h: 192, size: 62, color: 'blue' }).at(535, -56)]);
  });
  clock.on('transfer', () => show([
    arrow([-269, -56], [269, -56], { stroke: 'teal', width: 6, tip: 23 }),
    words('Prompt K/V', 54, 'teal').moveTo([0, -136]),
  ]));
  finish();
}

export function buildBatching(stage, narration, { slotBlock }) {
  const p = picture(stage, narration, 'batching');
  schedule(p);
  pool(p, slotBlock);
  prefill(p);
}
