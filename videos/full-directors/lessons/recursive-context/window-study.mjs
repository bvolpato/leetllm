import assert from 'node:assert/strict';
import { firstFrameAt } from '../../../director-cuts/lesson-runtime/timeline.mjs';
import { characterPlan } from '../../../films/recursive-context/arithmetic.mjs';
import { C, footer, line, mono, rect, title, type } from './artwork.mjs';

const wide = characterPlan(512);
const narrow = characterPlan(256);
const mergeWindow = 64;
const digest = 16;
const mergeParts = [
  wide.minimumMerge - (2 * digest + 1) - wide.reserve,
  2 * digest + 1,
  wide.reserve,
];
const colors = [C.brass, C.mint, '#db9478'];
const left = 210;
const right = 897;
const sourceLeft = 54;
const sourceWidth = right - sourceLeft;
const rowHeight = 28;
const parentY = 250;
const childRows = [312, 366];
const recount = 'It takes thirty-two leaves and sixty-three requests';
const splitFrames = firstFrameAt(1.25);
const split = (length) => [Math.floor(length / 2), Math.ceil(length / 2)];
const sourceLayers = [[wide.source]];
for (let leaves = 1; leaves < narrow.leaves; leaves *= 2)
  sourceLayers.push(sourceLayers.at(-1).flatMap(split));
const wideDepth = Math.log2(wide.leaves);
const narrowDepth = Math.log2(narrow.leaves);
const wideChunk = sourceLayers[wideDepth].at(-1);
const childChunks = split(wideChunk);

function after(k, phrase, captionStart = phrase) {
  // Start the subtitle with the spoken clause and reveal the picture on its last word's end.
  k.reveal(phrase, 0, { captionStart });
  return firstFrameAt(k.elapsed) >= firstFrameAt(k.wordCue(phrase).end);
}

function leafState(k) {
  const early = k.beat.beatIndex === 0;
  const shrink = early ? 0 : k.reveal('Now halve the window too', 1.2);
  const window = wide.window + (narrow.window - wide.window) * shrink;
  const wideKnown = !early && after(k, 'Sixteen leaves yield thirty-one requests');
  const narrowKnown = !early && after(k, recount);
  const allowanceKnown = early
    ? after(k, 'Four hundred sixty-two source characters fit in a leaf')
    : shrink === 0 || after(k, 'The new source allowance is two hundred six');
  const splitProgress = narrowKnown
    ? Math.min(1, (firstFrameAt(k.elapsed) - firstFrameAt(k.wordCue(recount).end)) / splitFrames)
    : 0;
  const splitDepth = early ? 0 : k.reveal('Halve each slice until it fits', 1.35) * wideDepth;
  return {
    window,
    shrink,
    wideKnown,
    allowanceKnown,
    splitProgress,
    depth: splitDepth + splitProgress * (narrowDepth - wideDepth),
    instructionKnown: !early || after(k, 'spends eighteen on instructions', false),
    reserveKnown: !early || after(k, 'reserves thirty-two for output'),
    sourceKnown: !early || after(k, 'fifty-seven hundred source characters', false),
  };
}

function drawSource(c, depth, sourceKnown) {
  if (sourceKnown)
    mono(
      c,
      'Manual · ' + wide.source.toLocaleString('en-US') + ' source chars',
      sourceLeft,
      108,
      18,
      C.chalk,
    );
  const top = 122;
  const layer = sourceLayers[Math.floor(depth)];
  const partial = depth % 1;
  const at = (offset) => sourceLeft + (sourceWidth * offset) / wide.source;
  rect(c, sourceLeft, top, sourceWidth, 29, '#578681');
  let start = 0;
  for (const length of layer) {
    const end = start + length;
    const selected = depth >= wideDepth && start >= wide.source - wideChunk;
    if (selected) rect(c, at(start), top, at(end) - at(start), 29, C.mint);
    if (start > 0) line(c, at(start), top, at(start), top + 29, C.desk, 2);
    if (partial > 0) {
      const middle = at(start + split(length)[0]);
      line(c, middle, top, middle, top + 29 * partial, C.desk, 2);
    }
    start = end;
  }
}

function ruler(c, max, window, bottom, changing = false) {
  const unit = (right - left) / max;
  const edge = left + window * unit;
  line(c, left, 208, right, 208, '#6f8886');
  for (let i = 0; i <= 4; i++) {
    const x = left + ((right - left) * i) / 4;
    line(c, x, 204, x, 213, C.soft);
    mono(c, (max * i) / 4, x, 232, 15, C.soft, 'center');
  }
  line(c, edge, 203, edge, 216, C.chalk, 2);
  line(c, edge, 239, edge, bottom, C.chalk, 2, [4, 3]);
  mono(c, changing ? 'Window' : window + ' char window', edge, 194, 17, C.chalk, 'right');
}

function request(c, y, label, parts, unit, sourceLabel = '') {
  type(c, label, sourceLeft, y + 20, 18, C.chalk, 'Sans', 600);
  rect(c, left, y, right - left, rowHeight, '#32494c');
  let x = left;
  for (const [i, length] of parts.entries()) {
    if (length > 0) rect(c, x, y, length * unit, rowHeight, colors[i]);
    if (i === 1 && sourceLabel) type(c, sourceLabel, x + 12, y + 20, 17, C.ink, 'Mono', 600);
    x += length * unit;
  }
}

function drawLeaves(c, k) {
  const s = leafState(k);
  title(c, 'Why does a smaller window need more calls?');
  drawSource(c, s.depth, s.sourceKnown);
  const unit = (right - left) / wide.window;
  const packed = s.depth >= wideDepth;
  const moving = s.shrink > 0 && s.shrink < 1;
  const shrinkDone = s.shrink === 1;
  let rowLabel = 'Leaf capacity';
  if (packed) rowLabel = shrinkDone ? 'Original request' : 'Leaf request';
  if (s.wideKnown && s.shrink > 0)
    mono(c, wide.window + ' chars · ' + wide.calls + ' requests', right, 108, 18, C.chalk, 'right');
  const oldParts = [
    s.instructionKnown ? wide.overhead : 0,
    packed ? wideChunk : s.allowanceKnown ? wide.allowance : 0,
    s.reserveKnown && s.allowanceKnown ? wide.reserve : 0,
  ];
  request(
    c,
    parentY,
    rowLabel,
    oldParts,
    unit,
    packed ? wideChunk + ' source chars' : '',
  );
  if (s.reserveKnown && !s.allowanceKnown && !packed)
    rect(c, right - wide.reserve * unit, parentY, wide.reserve * unit, rowHeight, colors[2]);

  if (s.splitProgress === 1) {
    childRows.forEach((y, i) =>
      request(
        c,
        y,
        'Half ' + (i + 1),
        [narrow.overhead, childChunks[i], narrow.reserve],
        unit,
        childChunks[i] + ' source chars',
      ),
    );
  } else if (s.splitProgress > 0) {
    const vertical = Math.min(1, 2 * s.splitProgress);
    const horizontal = Math.max(0, 2 * s.splitProgress - 1);
    childRows.forEach((y, i) => {
      const x = left + (wide.overhead + i * childChunks[0] * (1 - horizontal)) * unit;
      rect(c, x, parentY + (y - parentY) * vertical, childChunks[i] * unit, rowHeight, C.mint);
    });
  }
  ruler(c, wide.window, s.window, s.splitProgress > 0 ? 399 : 286, moving);

  const legendY = s.splitProgress > 0 ? 415 : 346;
  [
    [s.instructionKnown, wide.overhead + ' instruction chars'],
    [s.allowanceKnown, (shrinkDone ? narrow.allowance : wide.allowance) + ' source chars allowed'],
    [s.reserveKnown, wide.reserve + ' output chars reserved'],
  ].forEach(([show, label], i) => {
    if (!show || (moving && i === 1)) return;
    const x = sourceLeft + 287 * i;
    rect(c, x, legendY - 14, 8, 14, colors[i]);
    type(c, label, x + 15, legendY, 18, C.soft);
  });

  const total = s.splitProgress === 1 ? narrow : s.wideKnown && s.shrink === 0 ? wide : null;
  let message = 'Split each source slice until a full leaf request fits.';
  if (moving) message = 'The source, instructions and output reserve stay the same.';
  if (shrinkDone) message = 'The old request crosses the smaller window.';
  if (total)
    message =
      total.leaves +
      ' leaves + ' +
      (total.calls - total.leaves) +
      ' merges = ' +
      total.calls +
      ' requests';
  footer(c, message);
}

function mergeState(k) {
  const showWindow = after(k, 'Now try a sixty-four-character window');
  const showParts = after(k, 'instruction and the output reserve', false);
  const showTotal = after(k, 'Together they need eighty-nine characters');
  const rejected = after(k, 'Reject this configuration before the first call');
  return { showWindow, showParts, showTotal, rejected };
}

function drawMerge(c, k) {
  const s = mergeState(k);
  const max = mergeWindow * 2;
  const unit = (right - left) / max;
  const mergeY = 250;
  title(c, 'Can the smallest merge fit?');
  mono(c, 'Merge request · expanded character scale', sourceLeft, 108, 18, C.soft);
  request(c, mergeY, 'Minimum merge', s.showParts ? mergeParts : [], unit);
  if (s.showWindow) ruler(c, max, mergeWindow, 287);
  if (s.showParts)
    ['instruction chars', 'digest & separator chars', 'output chars reserved'].forEach(
      (label, i) => {
        const x = sourceLeft + 287 * i;
        rect(c, x, 343, 8, 15, colors[i]);
        type(c, mergeParts[i] + ' ' + label, x + 15, 357, 18, C.soft);
      },
    );
  if (s.showTotal) {
    const edge = left + mergeWindow * unit;
    const end = left + wide.minimumMerge * unit;
    mono(c, wide.minimumMerge + ' needed', end + 12, mergeY + 20, 17, C.chalk);
    line(c, edge, 305, end, 305, C.lightThread, 2);
    line(c, edge, 299, edge, 311, C.lightThread, 2);
    line(c, end, 299, end, 311, C.lightThread, 2);
    mono(
      c,
      wide.minimumMerge - mergeWindow + ' chars over',
      (edge + end) / 2,
      330,
      16,
      C.lightThread,
      'center',
    );
  }
  footer(
    c,
    s.rejected
      ? 'The merge exceeds the window. Stop before the first call.'
      : 'A merge needs both digests, instructions and room for the reply.',
  );
}

export function windowStudy(c, k) {
  if (k.beat.beatIndex === 2) drawMerge(c, k);
  else drawLeaves(c, k);
}

export function checkWindowStudy() {
  assert.deepEqual(
    [wide, narrow].map(({ allowance, leaves, calls, minimumMerge }) => [allowance, leaves, calls, minimumMerge]),
    [[462, 16, 31, 89], [206, 32, 63, 89]],
  );
  for (const plan of [wide, narrow]) {
    const layer = sourceLayers[Math.log2(plan.leaves)];
    assert.equal(layer.reduce((sum, length) => sum + length, 0), plan.source);
    assert.equal(Math.max(...layer), plan.largestSource);
    assert(plan.largestSource <= plan.allowance);
    assert(Math.min(...sourceLayers[Math.log2(plan.leaves) - 1]) > plan.allowance);
  }
  assert(wideChunk > narrow.allowance);
  assert.deepEqual(childChunks, [178, 179]);
  assert.deepEqual(mergeParts, [24, 33, 32]);
  assert.equal(mergeParts.reduce((sum, length) => sum + length, 0), wide.minimumMerge);
  assert.equal(wide.minimumMerge - mergeWindow, 25);
  assert.throws(() => characterPlan(mergeWindow), /merge cannot fit/);
}
