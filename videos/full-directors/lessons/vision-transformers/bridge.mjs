import assert from 'node:assert/strict';
import { visionPrefixBudget } from '../../../films/vision-transformers/arithmetic.mjs';
import {
  C,
  inks,
  rect,
  line,
  arrow,
  text,
  mono,
  caption,
  title,
  vec,
  mix,
  range,
  sum,
  cue,
  grid,
  cell,
  screen,
} from './canvas.mjs';

const laneModels = {
  llava: { name: 'LLaVA', source: 'CLIP ViT-L/14', width: 1024 },
  qwen: { name: 'Qwen2.5-VL', source: 'Vision transformer', width: 1280 },
};
function gridCount(side, p, group = 1) {
  return (side / p / group) ** 2;
}
export function families(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b === 3) {
    title(c, 'Flamingo reads from a separate visual memory');
    caption(c, 'NFNet spatial features', 126, 245);
    grid(c, 130, 327, 7, 9, 54, (r, col) => ((r + col) % 3 ? C.plate : '#4b6d72'));
    arrow(c, 671, 516, 843, 516, C.cyan);
    grid(c, 897, 350, 8, 8, 43, () => C.cyan, 4);
    text(c, '64 learned queries', 878, 275, 45);
    text(c, '64 resampled latents', 873, 775, 43, C.cyan);
    arrow(c, 1305, 514, 1432, 514, C.cyan);
    text(c, 'Gated cross-', 1450, 485, 42);
    text(c, 'attention', 1450, 546, 42);
    line(c, 1387, 704, 1800, 704, C.blue, 9);
    caption(c, 'Language stream', 1415, 790);
    return;
  }
  const qwen = b >= 4,
    m = laneModels[qwen ? 'qwen' : 'llava'];
  const side = !qwen && cue(k, 2, 'three-hundred-thirty-six encoder crop') ? 336 : 224;
  const gridSide = side / 14,
    count = gridCount(side, 14);
  const pack = qwen ? cue(k, 4, 'Neighboring two-by-two groups') : 0,
    mapped = qwen ? cue(k, 4, 'yield sixty-four') : cue(k, 2, 'Its learned linear bridge');
  const group = pack ? 2 : 1,
    out = gridCount(side, 14, group);
  title(
    c,
    (side === 336 ? 'LLaVA 1.5' : m.name) +
      '   ' +
      (qwen ? 'Merge adjacent features' : 'Project each patch separately'),
  );
  text(c, m.source, 128, 247, 46, C.sub);
  mono(c, side + ' × ' + side, 134, 325, 45, C.ink);
  const p = 482 / gridSide;
  grid(c, 136, 400, gridSide, gridSide, p, (r, col) =>
    Math.floor(r / 2) % 2 === Math.floor(col / 2) % 2 ? '#487d89' : '#365765',
  );
  if (pack)
    for (let i = 0; i <= gridSide; i += 2) {
      line(c, 136 + i * p, 400, 136 + i * p, 882, C.gold, 3);
      line(c, 136, 400 + i * p, 618, 400 + i * p, C.gold, 3);
    }
  mono(c, count + ' × ' + m.width, 130, 953, 54, C.cyan);
  text(c, 'Selected patch states', 800, 356, 47, C.sub);
  mono(c, 'N = ' + count, 800, 458, 70, C.cyan);
  if (mapped) {
    arrow(c, 826, 566, 1605, 566, qwen ? C.gold : C.cyan, 7);
    text(c, qwen ? 'Pack 2 × 2, then project' : 'Same projection on every row', 800, 669, 46);
    mono(c, out + ' prefix slots', 800, 799, 68, C.green);
  }
  if (b === 5) caption(c, 'Vision attention uses local windows in 28 of 32 layers.', 800, 946);
}
const pink = '#eaa4cc',
  unit = 984 / 4608;
function bank(c, y, name, data, known) {
  text(c, name, 106, y + 19, 44);
  const x = 550;
  rect(c, x, y - 12, data.text * unit, 64, C.blue);
  rect(c, x + data.text * unit, y - 12, data.visual * unit, 64, pink);
  mono(c, data.text + ' + ' + data.visual + ' = ' + data.total + ' slots', x, y + 104, 39, C.sub);
  mono(c, known ? data.mib + ' MiB' : '? MiB', 1793, y + 24, 54, known ? C.green : C.gold, 'right');
}
export function cache(c, k) {
  const b = k.beat.beatIndex + 1;
  if (b === 8) {
    const changed = cue(k, 8, 'Change the system prompt');
    title(c, 'Reuse the image features');
    screen(c, 117, 287, 1.04, { crop: true });
    text(c, 'Same crop, processor and encoder', 110, 802, 44, C.cyan);
    caption(c, 'Decoder prefix', 973, 289);
    const names = changed ? ['System B', 'Image', 'Question'] : ['System A', 'Image', 'Question'];
    names.forEach((n, i) =>
      cell(c, 973 + i * 280, 403, 263, 137, n, i ? C.cyan : changed ? C.gold : C.blue, 42),
    );
    line(c, 973, 619, 1795, 619, changed ? C.gold : C.green, 5);
    text(
      c,
      changed ? 'Recompute from System B' : 'Matching prefix',
      973,
      737,
      55,
      changed ? C.gold : C.green,
    );
    return;
  }
  const multi = b >= 5;
  title(c, multi ? 'Four images share one text prefix' : 'Raw decoder KV cache for one request');
  text(c, '512 text slots', 550, 222, 41, C.blue);
  text(c, 'Visual slots', 942, 222, 41, pink);
  if (!multi) {
    bank(c, 337, '224 × 224', visionPrefixBudget(224), !!cue(k, 2, 'first cache takes'));
    if (cue(k, 2, 'Double the image side'))
      bank(c, 535, '448 × 448', visionPrefixBudget(448), !!cue(k, 3, 'The second bar costs'));
    if (cue(k, 3, 'Double the side once more'))
      bank(
        c,
        735,
        '896 × 896',
        visionPrefixBudget(896),
        !!cue(k, 4, 'for five hundred seventy-six'),
      );
  } else {
    bank(c, 357, '4 × (448²)', visionPrefixBudget(448, 512, 4), true);
    if (cue(k, 5, 'Merge each group'))
      bank(
        c,
        586,
        '2 × 2 merger',
        visionPrefixBudget(448, 512, 4, 4),
        !!cue(k, 6, 'take one hundred ninety-two'),
      );
  }
  text(
    c,
    b === 7
      ? 'Flamingo keeps visual memory on its cross-attention path.'
      : 'Per slot     2 (K, V)  ×  32 layers  ×  8 KV heads  ×  128 entries  ×  2 B  =  128 KiB',
    110,
    976,
    39,
    C.sub,
  );
}
const groupRows = [
  [1, 0],
  [0, 2],
  [2, 0],
  [1, 2],
];
const widen = ([a, b]) => [a, b, a + b, a - b];
const compress = (packed) => [0, 1].map((j) => sum(range(4).map((i) => packed[2 * i + j])) / 4);
export function bridges(c, k) {
  const b = k.beat.beatIndex + 1,
    joined = cue(k, 2, 'Pack their coordinates', 2),
    wide = cue(k, 1, 'Widen each slot');
  const mixed = cue(k, 3, 'project the packed vector');
  title(
    c,
    b === 1
      ? 'Change width at each position'
      : b === 2
        ? 'Pack the four neighbors in raster order'
        : 'Project the packed neighbors into one slot',
  );
  if (b === 1) {
    groupRows.forEach((row, i) => {
      const y = 264 + i * 157,
        color = inks[i];
      text(c, 'ABCD'[i], 130, y + 47, 57, color);
      row.forEach((v, j) => cell(c, 296 + j * 137, y, 125, 101, v, color));
      if (wide) {
        arrow(c, 657, y + 50, 852, y + 50, color, 5);
        widen(row).forEach((v, j) => cell(c, 945 + j * 183, y, 166, 101, v, color));
      }
    });
    caption(c, 'Toy linear map   [a, b] → [a, b, a + b, a − b]', 130, 979);
    return;
  }
  groupRows.forEach((row, i) => {
    const x = mix(401 + (i % 2) * 561, 159 + i * 403, joined),
      y = mix(292 + Math.floor(i / 2) * 307, 425, joined);
    text(c, 'ABCD'[i], x, y - 49, 47, inks[i]);
    row.forEach((v, j) => cell(c, x + j * 142, y, 137, 122, v, inks[i], 57));
  });
  if (joined === 1) {
    line(c, 154, 629, 1650, 629, C.sub, 4);
    text(c, 'Eight coordinates', 158, 721, 45, C.sub);
    if (mixed) {
      mono(c, 'Mean of four pairs → ' + vec(compress(groupRows.flat())), 158, 846, 57, C.green);
      caption(c, 'This toy merger gives the decoder one slot.', 158, 957);
    } else mono(c, '[A, B, C, D]', 1030, 721, 56, C.cyan);
  }
}
export function checkBridge() {
  assert.equal(gridCount(224, 14), 256);
  assert.equal(gridCount(336, 14), 576);
  assert.equal(gridCount(224, 14, 2), 64);
  assert.deepEqual(
    [224, 448, 896].map((s) => visionPrefixBudget(s).mib),
    [96, 192, 576],
  );
  assert.equal(visionPrefixBudget(336, 256, 1, 4).mib, 50);
  assert.equal(visionPrefixBudget(448, 512, 4, 4).mib, 192);
  assert.equal(visionPrefixBudget(448).bytesPerSlot, 128 * 1024);
  assert.deepEqual(groupRows.map(widen)[3], [1, 2, 3, -1]);
  assert.deepEqual(compress(groupRows.flat()), [1, 1]);
}
