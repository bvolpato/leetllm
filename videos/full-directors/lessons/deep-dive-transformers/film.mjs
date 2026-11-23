import assert from 'node:assert/strict';
import * as ex from './examples.mjs';
import {
  C,
  type,
  rect,
  line,
  arrow,
  dot,
  path,
  bird,
  frame,
  footer,
  cell,
  row,
  caption,
  heading,
  cue,
  end,
  smooth,
  lerp,
  fade,
} from './art.mjs';

const title = 'Transformers and the Contracts Around a Checkpoint';
const labels = [
  'Chat replay',
  'Snapshot identity',
  'Class dispatch',
  'Input rendering',
  'Batch layout',
  'Causal loss',
  'Cache storage',
  'Generation replay',
];
const base = (c, k, h) => frame(c, labels[k.beat.chapterIndex], h);

function weights(c) {
  for (let j = 2; j >= 0; j--) rect(c, 101 + j * 8, 717 - j * 8, 303, 103, C.white, C.ink, 2, 8);
  type(c, 'Weights  W7', 253, 768, 38, { align: 'center', face: 'Mono' });
}
function conversation(c, k) {
  const b = k.beat.beatIndex;
  if (b === 3) {
    base(c, k, 'What goes into one forward pass?');
    const cols = [
      ['Configuration', 'LlamaConfig'],
      ['Modules', 'LlamaForCausalLM'],
      ['Parameters', 'W7'],
    ];
    cols.forEach(([name, val], i) => {
      caption(c, name, 105 + 570 * i, 345);
      cell(c, 100 + 570 * i, 389, 440, 140, val, { size: 42, color: i === 2 ? C.teal : C.blue });
      if (i === 0) arrow(c, 551, 458, 656, 458);
    });
    arrow(c, 1514, 543, 1146, 634, C.teal);
    arrow(c, 883, 543, 963, 634, C.blue);
    cell(c, 720, 651, 536, 131, 'Forward on PyTorch', { color: C.ink, fill: C.mint });
    cell(c, 97, 651, 435, 131, 'Conversation IDs', { color: C.blue });
    arrow(c, 547, 716, 706, 716);
    arrow(c, 1269, 716, 1386, 716);
    cell(c, 1400, 651, 412, 131, 'Next-token logits', { color: C.teal });
    footer(c, 'A release can change the input IDs while keeping the class and W7 fixed.');
    return;
  }
  const repair = smooth(cue(k, 2, 'Put the assistant prefix back', 0.85));
  base(
    c,
    k,
    repair === 1
      ? 'What can we compare once the IDs match?'
      : 'Where do the two clients first differ?',
  );
  bird(c, 251, 417, 1.22);
  line(c, 100, 480, 423, 480, C.ink, 3);
  heading(c, '“Why do birds sing?”', 95, 557, 435);
  weights(c);
  const start = 741,
    pitch = 258,
    yy = [432, 660];
  const found = cue(k, 1, 'The approved client', 0.55);
  const scan = cue(k, 0, 'Read the ends', 1.65);
  const ready = cue(k, 2, 'With the model class');
  const first = ex.firstDifference(ex.approved.ids, ex.truncated.ids);
  caption(c, 'Position in the rendered sequence', start, 299);
  for (let i = 0; i < 4; i++) caption(c, 5 + i, start + i * pitch + 119, 362, { align: 'center' });
  [ex.approved, ex.truncated].forEach((v, idx) => {
    type(c, idx ? 'Candidate' : 'Approved', 704, yy[idx] + 64, 39, {
      align: 'right',
      color: idx ? C.ink : C.blue,
    });
    for (let j = 5; j < 9; j++) {
      const x = start + (j - 5) * pitch,
        y = yy[idx],
        ref = idx === 0 || j < v.words.length ? v : ex.approved;
      const opacity = idx === 1 && j >= v.words.length ? repair : 1;
      rect(c, x, y, pitch - 12, 131, C.soft, C.faint, 2, 8);
      fade(c, opacity, () =>
        cell(c, x, y, pitch - 12, 131, ref.words[j], {
          detail: 'ID ' + ref.ids[j],
          color: idx ? C.teal : C.blue,
        }),
      );
    }
  });
  if (scan > 0 && repair === 0) {
    const x = start + (smooth(scan) + (first - 6) * smooth(found)) * pitch - 4;
    const moving = scan < 1 || (found > 0 && found < 1);
    if (moving) {
      line(c, x, 418, x + pitch - 4, 418, C.dim, 5);
      line(c, x, 806, x + pitch - 4, 806, C.dim, 5);
    } else rect(c, x, 418, pitch - 4, 388, null, found === 1 ? C.rust : C.dim, 5, 9);
    if (found === 1)
      caption(c, 'First difference', x + pitch / 2, 844, { align: 'center', color: C.rust });
  }
  footer(
    c,
    b === 0
      ? 'Read the two rows from left to right. Positions 0–4 match.'
      : ready
        ? 'IDs match again. Compare first-step logits under the same model and weights.'
        : repair > 0
          ? 'Restore the same assistant-turn prefix on the candidate.'
          : found === 1
            ? 'The candidate has ended. The reference opens the next turn at position 7.'
            : 'Compare the boundary after the user turn.',
  );
}

function snapshot(c, k) {
  const b = k.beat.beatIndex;
  if (b >= 4) return offload(c, k);
  if (b === 3) {
    base(c, k, 'Where do the learned values go?');
    const tied = cue(k, 3, 'tie its input embeddings');
    const loaded = cue(k, 3, 'restores the saved tensors', 0.6);
    caption(c, 'Configuration', 104, 343);
    cell(c, 100, 397, 396, 130, 'width × vocabulary', { size: 37 });
    arrow(c, 506, 463, 627, 463);
    cell(c, 645, 363, 484, 108, 'Input embedding');
    cell(c, 645, 572, 484, 108, 'Output head');
    if (tied) {
      line(c, 1137, 417, 1224, 417);
      line(c, 1137, 626, 1224, 626);
      line(c, 1224, 417, 1224, 626, C.teal);
      arrow(c, 1224, 521, 1290, 521);
    }
    rect(c, 1310, 360, 455, 320, C.white, C.ink, 3, 9);
    caption(c, tied ? 'One shared parameter' : 'Parameter storage', 1538, 399, { align: 'center' });
    for (let i = 0; i < 8; i++)
      for (let j = 0; j < 4; j++) {
        const col =
          loaded > 0 ? ['#577b7a', '#acc0aa', '#27655f', '#749f98'][(i * 3 + j) % 4] : C.soft;
        rect(c, 1354 + i * 46, 453 + j * 45, 40, 37, col);
      }
    footer(
      c,
      loaded
        ? 'Restore named tensors. Record dtype, shape and any missing or unexpected keys.'
        : 'A family may tie two module weights to the same parameter storage.',
    );
    return;
  }
  base(c, k, 'Follow main to the files it names');
  const second = cue(k, 1, 'A new snapshot lands', 0.8);
  const move = smooth(cue(k, 1, 'Move main to R two', 0.8));
  const y0 = 419,
    y1 = 721;
  const current = move === 1 ? 1 : 0;
  const ss = ex.snapshots;
  // The two revision paths terminate at the same physical weight object.
  function link(x, y, X, Y, col) {
    path(
      c,
      [
        ['moveTo', x, y],
        ['bezierCurveTo', x + 145, y, X - 140, Y, X, Y],
      ],
      null,
      col,
      6,
    );
    dot(c, X, Y, 6, col);
  }
  caption(c, 'Branch', 94, 313);
  caption(c, 'Immutable snapshots', 550, 313);
  caption(c, 'Content store', 1350, 313);
  link(851, y0, 1339, 544, C.teal);
  link(851, y0, 1339, 383, C.blue);
  fade(c, second, () => {
    link(851, y1, 1339, 544, C.teal);
    link(851, y1, 1339, 755, C.blue);
  });
  [y0, y1].forEach((y, i) =>
    fade(c, i ? second : 1, () =>
      cell(c, 550, y - 58, 303, 116, ss[i].revision, { detail: 'snapshot', color: C.blue }),
    ),
  );
  [
    [383, 'Tokenizer', ss[0].tokenizer],
    [544, 'Weights', ss[0].weights],
    [755, 'Tokenizer', ss[1].tokenizer],
  ].forEach(([y, name, val], i) =>
    fade(c, i === 2 ? second : 1, () => {
      cell(c, 1350, y - 55, 450, 110, name + '  ' + val, {
        color: i === 1 ? C.teal : C.blue,
        fill: i === 1 ? C.mint : C.white,
      });
    }),
  );
  const selY = lerp(y0, y1, move);
  cell(c, 96, selY - 53, 248, 106, 'main', { color: C.ink });
  arrow(c, 355, selY, 533, selY, C.rust);
  const answer = cue(k, 2, 'Both links end');
  footer(
    c,
    answer
      ? ex.copies + ' physical copy of W7. Pin R2 to reproduce the T4 tokenizer.'
      : move > 0 && move < 1
        ? 'The branch reference moves. The snapshots stay in place.'
        : current
          ? 'R2 resolves T4. Trace its weights back to the content store.'
          : 'R1 resolves W7 and T3.',
  );
}

function offloadState(k) {
  const m = ex.memory;
  const x = 164, unit = 113;
  const fetch = smooth(cue(k, 4, 'a hook fetches', 1));
  const join = smooth(cue(k, 5, 'The peak is twelve', 0.85));
  const specs = [
    ['Weights', m.resident, C.blue],
    ['KV cache', m.cache, C.teal],
    ['Work', m.workspace, '#736044'],
    ['Layer', m.layer, C.rust],
  ];
  let total = 0;
  const blocks = specs.map(([name, size, color], i) => {
    const endX = x + total * unit;
    total += size;
    const layer = name === 'Layer';
    const startX = layer ? lerp(634, 1430, fetch) : endX + 48 * i;
    return { name, size, color, width: size * unit - 4, visible: !layer || fetch > 0,
      x: lerp(startX, endX, join), y: lerp(layer ? 356 : 517, 678, join) };
  });
  return { x, limitX: x + m.limit * unit, blocks, fetch, join,
    verdict: Boolean(cue(k, 5, 'The call exceeds')) };
}
function offload(c, k) {
  base(c, k, 'Will the layer fit on the execution GPU?');
  const m = ex.memory;
  const { x, limitX, blocks, fetch, join, verdict } = offloadState(k);
  caption(c, 'Storage between calls', x, 309);
  cell(c, x, 346, 440, 113, 'CPU layer', {
    detail: m.layer + ' GiB',
    color: C.rust,
    fill: C.peach,
  });
  fade(c, fetch * (1 - join), () => caption(c, 'Fetched to main GPU', 1400, 309));
  fade(c, 1 - join, () => caption(c, 'Other GPU allocations', x, 488));
  line(c, x, 802, limitX, 802, C.ink, 3);
  line(c, x, 791, x, 813, C.ink, 3);
  caption(c, '0 GiB', x, 849);
  for (const block of blocks) {
    if (!block.visible) continue;
    rect(c, block.x, block.y, block.width, 104, block.color, null, 0, 5);
    const center = block.x + block.width / 2;
    type(c, block.name, center, block.y + 27, 31, { color: C.white, align: 'center' });
    type(c, block.size + ' GiB', center, block.y + 73, 34, {
      color: C.white, face: 'Mono', align: 'center', width: block.width - 12,
    });
  }
  line(c, limitX, 661, limitX, 818, C.rust, 4, [11, 8]);
  caption(c, m.limit + ' GiB limit', limitX, 849, { align: 'center', color: C.rust });
  footer(
    c,
    verdict
      ? ex.peak +
          ' GiB at execution exceeds the ' +
          m.limit +
          ' GiB limit by ' +
          (ex.peak - m.limit) +
          ' GiB.'
      : join === 1
        ? 'The main GPU needs ' + ex.peak + ' GiB at the peak.'
        : 'Which allocations must fit on this GPU at the same time?',
  );
}

function dispatch(c, k) {
  const gpt = cue(k, 1, 'Change only the model type', 0.55),
    unknown = cue(k, 3, 'Try an unregistered family', 0.5);
  const family = unknown === 1 ? 'unknown' : gpt === 1 ? 'gpt2' : 'llama';
  const isMismatch = family !== 'llama' && family in ex.mapping;
  const reveal = cue(k, 2, 'The supplied tensors');
  base(c, k, 'Which class does the metadata select?');
  const routes = [
    ['llama', 'LlamaConfig', ex.mapping.llama],
    ['gpt2', 'GPT2Config', ex.mapping.gpt2],
  ];
  const xs = [100, 617, 1214],
    ws = [330, 440, 594];
  ['model_type', 'AutoConfig', 'AutoModelForCausalLM'].forEach((v, i) => caption(c, v, xs[i], 323));
  routes.forEach(([f, conf, model], idx) => {
    const y = 405 + idx * 169,
      active = f === family;
    [f, conf, model].forEach((val, i) => {
      cell(c, xs[i], y, ws[i], 111, val, {
        color: active ? C.teal : C.dim,
        fill: active ? C.mint : C.paper,
        outline: active,
        size: 43,
      });
      if (i < 2)
        arrow(
          c,
          xs[i] + ws[i] + 14,
          y + 55,
          xs[i + 1] - 15,
          y + 55,
          active ? C.teal : C.faint,
          active ? 6 : 3,
        );
    });
  });
  if (family === 'unknown') {
    cell(c, 100, 742, 330, 100, 'unknown', { color: C.rust, fill: C.peach });
    line(c, 440, 792, 563, 792, C.rust, 5, [8, 10]);
    type(c, 'No built-in mapping', 617, 792, 42, { color: C.rust });
  } else {
    caption(c, 'Supplied shards', 100, 798);
    cell(c, 432, 745, 386, 104, 'Llama · W7', { color: C.blue });
    if (isMismatch && reveal)
      type(c, '≠   GPT-2 family', 898, 798, 52, { face: 'Serif', color: C.rust });
  }
  footer(
    c,
    family === 'unknown'
      ? 'Register a compatible config and task class, then test checkpoint restoration.'
      : isMismatch && reveal
        ? 'Class lookup succeeded. Compare shard names, shapes and a known forward result.'
        : isMismatch
          ? 'The shards stayed on the bench. Can the new route restore them?'
          : 'Select the concrete class from configuration before restoring parameter bytes.',
  );
}

function rendering(c, k) {
  const b = k.beat.beatIndex;
  if (b >= 3) return pixels(c, k);
  base(c, k, 'Which step inserted a token?');
  bird(c, 165, 353, 0.54);
  heading(c, 'Why do birds sing?', 274, 354, 580);
  caption(c, 'Rendered suffix', 896, 352);
  type(c, 'END  BEGIN  assistant', 1236, 352, 40, { face: 'Mono', width: 555 });
  const insert = cue(k, 1, 'adds a beginning token', 0.7);
  const takeOut = cue(k, 2, 'Disable the second insertion', 0.75);
  const offset = smooth(insert) * (1 - smooth(takeOut));
  const gap = Math.min(1, offset / 0.75);
  const opacity = Math.max(0, (offset - 0.75) / 0.25);
  const bad = offset === 1;
  const marked = cue(k, 2, 'The reference has user') && bad;
  const data = bad ? ex.duplicate : ex.approved;
  const start = 228,
    pitch = 157,
    diff = ex.firstDifference(ex.approved.ids, data.ids);
  for (const [i, v] of [ex.approved, ex.approved].entries()) {
    const y = 475 + i * 224;
    caption(c, i ? 'Candidate' : 'Reference', 94, y - 40, { color: i ? C.teal : C.blue });
    if (i && opacity > 0)
      fade(c, opacity, () =>
        cell(c, start, y, pitch - 8, 115, ex.duplicate.words[0], {
          detail: 'ID ' + ex.duplicate.ids[0],
          size: 35,
          small: 27,
          color: C.teal,
          fill: C.mint,
        }),
      );
    v.words.forEach((word, j) => {
      const pos = j + (i ? gap : 0);
      cell(c, start + pos * pitch, y, pitch - 8, 115, word, {
        detail: 'ID ' + v.ids[j],
        size: 35,
        small: 27,
        color: i ? C.teal : C.blue,
        outline: marked && pos === diff,
        fill: marked && pos === diff ? C.peach : C.white,
      });
    });
  }
  if (marked)
    caption(c, 'First difference at position ' + diff, start + pitch, 855, { color: C.rust });
  footer(
    c,
    takeOut === 1
      ? 'The two ID sequences match again, including the assistant prefix.'
      : bad
        ? 'Compare position by position. A repeated BEGIN shifts the rest of the candidate.'
        : 'A chat template supplies role and boundary tokens. The tokenizer maps them to integers.',
  );
}

function pixels(c, k) {
  base(c, k, 'Can equal tensor shapes hide an input change?');
  rect(c, 98, 347, 528, 414, C.blueLight, C.ink, 4, 8);
  // The white sample sits in open sky above the bird. The image never changes.
  line(c, 99, 660, 622, 696, C.ink, 8);
  bird(c, 356, 602, 1.5);
  rect(c, 227, 421, 57, 57, '#ffffff', C.rust, 4);
  caption(c, 'Same raw image', 104, 807);
  line(c, 286, 447, 671, 447, C.rust, 3);
  line(c, 671, 447, 671, 673, C.rust, 3);
  const means = [0.5, 0],
    shows = [cue(k, 4, 'Subtracting zero'), cue(k, 4, 'The first divergent value')];
  means.forEach((m, j) => {
    const y = 390 + 242 * j;
    arrow(c, 671, y + 42, 784, y + 42, C.rust);
    caption(c, j ? 'Candidate processor' : 'Approved processor', 818, y - 33);
    type(c, '1 − ' + m + ' =', 817, y + 52, 64, { face: 'Mono' });
    const x = 1257,
      w = 434;
    rect(c, x, y + 21, w, 64, C.white, C.faint, 2, 4);
    if (shows[j]) {
      const v = ex.pixel(m);
      rect(c, x, y + 21, w * v, 64, j ? C.teal : C.blue);
      type(c, v, 1749, y + 53, 50, { face: 'Mono', align: 'center' });
    }
  });
  footer(
    c,
    shows[1]
      ? 'The first divergent value is in pixel_values. Compare preprocessing before logits.'
      : 'One image placeholder, the same white pixel, two normalization settings.',
  );
}

const paddingX = 318,
  paddingPitch = 317,
  shortY = 425,
  longY = 704;
function batch(c, k) {
  const b = k.beat.beatIndex;
  if (b === 4) return training(c, k);
  base(c, k, 'Which token supplies the next-token scores?');
  const move = smooth(cue(k, 2, 'Slide the short prompt', 1.5));
  const inTransit = move > 0 && move < 1;
  const layout = ex.padding(move === 1);
  const src = ex.padding(false);
  const scoresRight = cue(k, 1, 'Greedy selection takes');
  const pickedRight = cue(k, 1, 'The longer prompt'),
    scoresLeft = cue(k, 3, 'The longer prompt'),
    pickedLong = cue(k, 1, 'This time');
  const readWindow = cue(k, 1, 'Follow the read window', 0.45);
  const xread = paddingX + 3 * paddingPitch;
  fade(c, readWindow, () =>
    caption(c, 'logits[:, −1, :]', xread + 149, 290, { align: 'center', color: C.rust }),
  );
  for (let j = 0; j < 4; j++)
    caption(c, 'pos ' + j, paddingX + j * paddingPitch + 147, 336, { align: 'center' });
  const drawWord = (x, y, word, mask) => {
    cell(c, x, y, 286, 109, word, {
      size: 51,
      color: mask ? C.blue : C.dim,
      fill: mask ? C.white : C.soft,
      detail: 'mask ' + mask,
      small: 26,
    });
  };
  type(c, 'Short', 105, shortY + 57, 43, { face: 'Serif' });
  type(c, 'Long', 105, longY + 57, 43, { face: 'Serif' });
  // Opposite arcs keep the real words and the pads readable as they swap sides.
  src[0].words.forEach((w, i) => {
    const real = Boolean(src[0].mask[i]);
    const slide = Math.max(0, Math.min(1, (move - 0.2) / 0.6));
    const lift = Math.min(1, move / 0.2, (1 - move) / 0.2);
    const col = i + (real ? 2 : -2) * smooth(slide);
    const dy = (real ? -1 : 1) * smooth(lift) * 65;
    drawWord(paddingX + col * paddingPitch, shortY + dy, w, src[0].mask[i]);
  });
  layout[1].words.forEach((w, i) => drawWord(paddingX + i * paddingPitch, longY, w, 1));
  fade(c, readWindow, () => rect(c, xread - 10, 381, 306, 456, null, C.rust, 6, 9));
  function choice(r, show) {
    if (!show) return;
    const y = (r ? longY : shortY) + 57;
    arrow(c, xread + 305, y, 1622, y, C.rust, 4);
    type(c, layout[r].pick, 1640, y, 47, { face: 'Serif', color: C.rust, width: 186 });
  }
  choice(0, (!inTransit && move === 0 && pickedRight) || scoresLeft);
  choice(1, pickedLong);
  if (!inTransit && ((move === 0 && scoresRight) || scoresLeft)) {
    const m = layout[0];
    type(
      c,
      'From ' + m.words.at(-1) + '    again ' + m.scores[0] + '     softly ' + m.scores[1],
      329,
      603,
      39,
      { face: 'Mono' },
    );
  }
  footer(
    c,
    inTransit
      ? 'The tokens move with their masks. The read window stays on position 3.'
      : move === 1
        ? 'The same read window now falls on the last real word in each prompt.'
        : readWindow
          ? 'A mask changes attention visibility. The decoder still reads column 3.'
          : 'Compare the two prompts under a decoder that reads the last position.',
  );
}
function training(c, k) {
  base(c, k, 'Which occurrence of ID 2 should lose its label?');
  const apply = cue(k, 4, 'Only the trailing pad');
  const x = 385,
    step = 330,
    ys = [423, 590, 754];
  ['Input', 'Attention', apply ? 'Loss labels' : 'Copied IDs'].forEach((v, i) =>
    type(c, v, 103, ys[i] + 35, 41, { face: 'Serif' }),
  );
  ex.training.forEach((t, i) => {
    const X = x + i * step;
    cell(c, X, ys[0] - 20, step - 18, 114, t.word, {
      detail: 'ID ' + t.id,
      color: t.mask ? C.blue : C.dim,
    });
    cell(c, X, ys[1] - 13, step - 18, 92, t.mask, { color: t.mask ? C.teal : C.dim });
    cell(c, X, ys[2] - 13, step - 18, 92, apply ? ex.targetId(t) : t.id, {
      color: apply && !t.mask ? C.rust : C.ink,
      fill: apply && !t.mask ? C.peach : C.white,
    });
  });
  footer(
    c,
    apply
      ? '“sing” predicts EOS (ID 2). The trailing PAD target is ignored.'
      : 'ID 2 has two roles in this sequence. Compare their positions and masks.',
  );
}

function lossScene(c, k) {
  const b = k.beat.beatIndex;
  if (b === 3) return modelOutput(c, k);
  if (b === 4) return cpu(c, k);
  base(c, k, 'Which prediction loses its target?');
  const masked = Boolean(cue(k, 2, 'The prediction at position'));
  const form = Boolean(cue(k, 0, 'The model pairs')),
    meanReady = masked ? Boolean(cue(k, 2, 'The input word')) : Boolean(cue(k, 1, 'Now suppose'));
  const m = ex.loss(masked),
    left = 301,
    pitch = 378;
  caption(c, 'position', 96, 319);
  ['Input & logits', 'Labels'].forEach((s, i) =>
    type(c, s, 88, i ? 681 : 405, 32, { face: 'Sans', width: 199 }),
  );
  ex.sentence.forEach((w, i) => {
    const x = left + pitch * i;
    caption(c, i, x + 137, 319, { align: 'center' });
    cell(c, x, 352, 278, 112, w, { color: C.blue, detail: 'mask 1' });
    const ignore = m.labels[i] === -100;
    cell(c, x, 624, 278, 112, m.labels[i], {
      color: ignore ? C.rust : C.teal,
      detail: i === 0 ? 'unpaired' : ignore ? 'ignored' : 'target',
      fill: ignore ? C.peach : C.white,
    });
  });
  if (form)
    m.terms.forEach((t) => {
      const x = left + pitch * t.source + 172,
        X = left + pitch * (t.source + 1) + 101;
      const active = t.label !== -100;
      line(c, x, 470, X, 614, active ? C.teal : C.faint, 5, active ? [] : [11, 9]);
      if (active) arrow(c, X - 23, 602, X, 614, C.teal);
      const cx = (x + X) / 2;
      rect(c, cx - 83, 511, 166, 67, C.paper);
      type(c, active ? 'p = ' + t.p : 'omit', cx, 545, 33, {
        face: 'Mono',
        color: active ? C.teal : C.rust,
        align: 'center',
      });
    });
  if (meanReady || masked) {
    const probs = m.active.map((t) => t.p).join(' × ');
    type(
      c,
      '−ln(' + probs + ') / ' + m.active.length + (meanReady ? '  ≈  ' + m.mean.toFixed(4) : ''),
      961,
      827,
      46,
      { face: 'Mono', align: 'center' },
    );
  }
  footer(
    c,
    masked
      ? '“at” remains in the input and can contribute to the prediction of “dawn.”'
      : 'Each link runs from logit t to label t + 1. The caller supplies unshifted labels.',
  );
}
function modelOutput(c, k) {
  base(c, k, 'What does slot zero contain?');
  const added = Boolean(cue(k, 3, 'Add labels'));
  const fields = ['loss', 'logits', 'hidden_states'];
  const m = ex.outputTuple(added);
  fields.forEach((f, i) => {
    const x = 264 + 494 * i;
    caption(c, f, x + 180, 354, { align: 'center' });
    cell(c, x, 413, 360, 129, m.fields[f] ?? 'None', { color: f === 'logits' ? C.teal : C.dim });
    if (m.fields[f]) {
      const pos = m.tuple.indexOf(m.fields[f]);
      arrow(c, x + 180, 550, 430 + 453 * pos, 678, f === 'logits' ? C.teal : C.dim, 4);
    }
  });
  caption(c, 'to_tuple()', 71, 750, { width: 173 });
  m.tuple.forEach((v, i) =>
    cell(c, 277 + i * 453, 698, 304, 118, v, {
      color: v === 'L' ? C.teal : C.ink,
      detail: 'slot ' + i,
    }),
  );
  footer(
    c,
    'output.logits returns L in both calls. Slot 0 currently holds ' +
      (added ? 'the loss scalar.' : 'the logits tensor.'),
  );
}
function cpu(c, k) {
  base(c, k, 'What did the CPU experiment establish?');
  caption(c, 'Article fixture  ·  seed 7  ·  random two-layer Llama', 99, 309);
  row(c, ex.cpuIds, 100, 398, 178, 104, { color: C.blue, face: 'Mono' });
  caption(c, 'Fixed input IDs', 99, 546);
  arrow(c, 998, 447, 1127, 447);
  cell(c, 1147, 389, 620, 126, '1 × 5 × 32', {
    detail: 'batch × positions × vocabulary',
    color: C.teal,
  });
  const checks = [
    ['masked loss', 'explicit shifted cross-entropy', 'Its masked'],
    ['tied parameter', 'gradient reaches embedding', 'Gradients reach'],
    ['local reload', 'fixed-input logits match', 'local reload'],
    ['future edit', 'earlier causal logits match', 'Changing a future token'],
  ];
  checks.forEach(([name, result, phrase], i) => {
    if (!cue(k, 4, phrase)) return;
    const x = 102 + (i % 2) * 910,
      y = 655 + Math.floor(i / 2) * 120;
    dot(c, x + 10, y, 8, C.teal);
    caption(c, name, x + 35, y - 10, { color: C.teal });
    type(c, result, x + 35, y + 36, 38, { face: 'Serif' });
  });
  footer(
    c,
    'Reported CPU checks use reference logits. Held-out quality and GPU latency need separate evidence.',
  );
}

function cacheScene(c, k) {
  const b = k.beat.beatIndex;
  if (b === 3) return hybrid(c, k);
  if (b >= 4) return forks(c, k);
  if (b === 0) {
    base(c, k, 'How many bytes follow one token?');
    const perHead = 64 * 2,
      perLayer = 2 * 4 * perHead;
    caption(c, 'One layer  ·  bf16  ·  one sequence', 111, 329);
    [
      ['K', C.blue],
      ['V', C.teal],
    ].forEach(([n, col], r) => {
      const y = 423 + r * 180;
      type(c, n, 115, y + 55, 70, { color: col, face: 'Serif' });
      for (let h = 0; h < 4; h++) {
        const x = 239 + h * 218;
        rect(c, x, y, 193, 106, C.white, col, 2, 5);
        for (let v = 0; v < 16; v++)
          line(c, x + 11 + v * 11, y + 12, x + 11 + v * 11, y + 43, col, 3);
        type(c, '64 × 2 B', x + 96, y + 76, 29, { face: 'Mono', align: 'center' });
      }
    });
    const known = cue(k, 0, 'The sixteen query heads');
    for (let l = 15; l >= 0; l--) {
      const x = 1257 + l * 8,
        y = 434 - l * 6;
      rect(c, x, y, 425, 254, l ? C.soft : C.white, C.teal, 2, 6);
    }
    caption(c, 'PER TOKEN', 1470, 487, { align: 'center', color: C.teal });
    type(c, known ? '16 KiB' : '16 layers', 1470, 577, 75, { face: 'Serif', align: 'center' });
    if (known) caption(c, '16 × ' + perLayer + ' bytes', 1470, 652, { align: 'center' });
    footer(
      c,
      'Full-attention K/V payload = 2 × layers × batch × length × KV heads × width × dtype bytes.',
    );
    return;
  }
  base(c, k, 'How much of the allocation holds useful state?');
  const staticOn = Boolean(cue(k, 1, 'Reserve four thousand'));
  const grow = smooth(cue(k, 2, 'Fill those slots', 1.8));
  const slots = 512 + Math.round((4096 - 512) * grow);
  const dyn = ex.cache(slots, slots),
    stat = ex.cache(slots, 4096);
  const settled = Boolean(cue(k, 2, 'Eight live'));
  const x = 361,
    w = 1236;
  caption(c, 'Same full-attention decoder   ·   batch 1   ·   16 KiB per token', 100, 322);
  function bar(label, y, payload, showUnused) {
    type(c, label, 100, y + 53, 44, { face: 'Serif' });
    rect(c, x, y, w, 106, C.paper, C.faint, 2);
    const occupied = (w * payload.live) / 64,
      alloc = (w * payload.allocated) / 64;
    rect(c, x, y, occupied, 106, C.teal);
    if (alloc > occupied) {
      rect(c, x + occupied, y, alloc - occupied, 106, C.soft);
      c.save();
      c.beginPath();
      c.rect(x + occupied, y, alloc - occupied, 106);
      c.clip();
      for (let j = -110; j < w; j += 20) line(c, x + j, y + 108, x + j + 109, y - 1, '#a7b0a4', 2);
      c.restore();
    }
    rect(c, x, y, alloc, 106, null, C.ink, 3);
    caption(
      c,
      payload.allocated.toFixed(Number.isInteger(payload.allocated) ? 0 : 2) + ' MiB',
      1650,
      y + 50,
      { color: C.ink },
    );
    const positions =
      slots + ' live' + (label === 'Static' ? ' / 4096 allocated slots' : ' positions');
    caption(
      c,
      positions +
        (showUnused ? '    ·    ' + Number(payload.unused.toFixed(2)) + ' MiB unused' : ''),
      x,
      y + 148,
    );
  }
  bar('Dynamic', 417, dyn, false);
  if (staticOn) bar('Static', 674, stat, settled);
  footer(
    c,
    grow === 1
      ? 'At 4,096 positions both store 64 MiB of live keys and values.'
      : settled
        ? 'Unused static slots occupy storage until the live prefix grows into them.'
        : 'The hatched part, when allocated, is reserved for future positions.',
  );
}
function hybrid(c, k) {
  base(c, k, 'What changes when two layers have windows?');
  const summed = Boolean(cue(k, 3, 'Three independent'));
  const tripled = Boolean(cue(k, 3, 'Extra beams'));
  caption(
    c,
    'One 100-token sequence  ·  two KV heads  ·  width 8  ·  two bytes per value',
    104,
    319,
  );
  ex.layerLengths.forEach((n, i) => {
    const y = 390 + i * 112;
    type(c, i < 2 ? 'Full ' + (i + 1) : 'Window ' + (i - 1), 105, y + 32, 37, { face: 'Mono' });
    rect(c, 400, y, 789, 67, C.soft);
    rect(c, 400, y, (789 * n) / 100, 67, i < 2 ? C.blue : C.teal);
    type(c, n, 422, y + 32, 36, { color: C.white, face: 'Mono' });
  });
  caption(c, 'K and V per layer position', 1250, 462);
  type(c, ex.layerBytes + ' B', 1250, 561, 81, { face: 'Serif', color: C.teal });
  if (summed)
    type(c, '1 copy   ' + ex.hybrid(1).toLocaleString('en-US') + ' B', 1250, 683, 40, {
      face: 'Mono',
      width: 550,
    });
  if (tripled)
    type(c, '3 copies ' + ex.hybrid(3).toLocaleString('en-US') + ' B', 1250, 774, 40, {
      face: 'Mono',
      width: 550,
    });
  footer(
    c,
    'Sum retained lengths across layers, then multiply by the number of independent sequences.',
  );
}
function forks(c, k) {
  base(c, k, 'Which cache can the second request extend?');
  const first = Boolean(cue(k, 4, 'The first request now appends'));
  const copied = Boolean(cue(k, 4, 'make a separate copy'));
  const second = Boolean(cue(k, 5, 'Its new tail'));
  const st = ex.forked(second, first),
    sharedY = 433,
    copyY = 661,
    x = 681,
    step = 202;
  caption(c, 'Two independent continuations of A B C', 101, 319);
  cell(c, 100, 515, 326, 134, 'A  B  C', { detail: 'original prefix', color: C.ink });
  path(
    c,
    [
      ['moveTo', 427, 583],
      ['bezierCurveTo', 560, 583, 515, sharedY + 61, 655, sharedY + 61],
    ],
    null,
    C.blue,
    5,
  );
  if (copied)
    path(
      c,
      [
        ['moveTo', 427, 583],
        ['bezierCurveTo', 560, 583, 515, copyY + 61, 655, copyY + 61],
      ],
      null,
      C.teal,
      5,
    );
  [st.shared, st.saved].forEach((arr, i) => {
    if (i && !copied) return;
    const y = i ? copyY : sharedY;
    caption(c, i ? 'Separate copy' : 'First request', x, y - 43, { color: i ? C.teal : C.blue });
    row(c, arr, x, y, step, 118, { color: i ? C.teal : C.blue, fill: i ? C.mint : C.blueLight });
    if (arr.length === 3) rect(c, x + 3 * step, y, step - 10, 118, null, C.faint, 2, 8);
  });
  if (first) cell(c, 1554, (sharedY + copyY) / 2, 244, 118, 'Y', { detail: 'desired tail', color: C.ink });
  footer(
    c,
    second
      ? 'Both branches now match their own full-forward prefixes. The first still ends in X.'
      : 'Keep the model, positions and masks fixed. Compare the actual prefix IDs before appending.',
  );
}

function generationState(k) {
  const prefill = cue(k, 0, 'Prefill the five words', 0.85);
  const near = end(k, 0);
  const nearForward = cue(k, 1, 'select “home”');
  const home = cue(k, 1, 'Now forward');
  const homeForward = cue(k, 1, 'select a period');
  const period = cue(k, 1, 'Stop after');
  const travel = cue(k, 2, 'Forward the period once', 0.8);
  const count = period ? 3 : home ? 2 : near ? 1 : 0;
  const n = homeForward ? 7 : nearForward ? 6 : Math.floor(prefill * ex.prompt.length);
  const selected = ex.decode(count, n);
  const sending = Boolean(cue(k, 2, 'Send just the period'));
  const input = sending ? ex.resumeInput(selected) : null;
  const state = travel === 1 ? ex.forwardPending(selected, input) : selected;
  return {
    ...state,
    travel,
    input,
    forwards: Math.max(0, state.cached.length - ex.prompt.length + 1),
  };
}
function generation(c, k) {
  const b = k.beat.beatIndex;
  if (b === 3 || b === 4) return policy(c, k);
  if (b === 5 || b === 6) return release(c, k);
  if (b >= 7) return practice(c, k);
  base(c, k, 'What has the model actually processed?');
  const s = generationState(k),
    x = 304,
    step = 187,
    wy = 425,
    cy = 652;
  caption(c, 'Zero-based position', 99, 322);
  for (let i = 0; i < 8; i++) {
    const X = x + i * step;
    caption(c, i, X + 83, 360, { align: 'center' });
    rect(c, X, wy, step - 10, 111, C.soft, null, 0, 6);
    rect(c, X, cy, step - 10, 111, C.paper, C.faint, 3, 6);
  }
  type(c, 'Sequence', 86, wy + 56, 37, { face: 'Serif' });
  type(c, 'KV cache', 86, cy + 56, 37, { face: 'Serif' });
  row(c, s.sequence, x, wy, step, 111, {
    size: 41,
    item: (w, i) => ({ color: i < 5 ? C.blue : C.rust, fill: i < 5 ? C.blueLight : C.peach }),
  });
  row(c, s.cached, x, cy, step, 111, { color: C.teal, fill: C.mint, size: 41 });
  if (s.count >= 1) caption(c, 'Returned ' + s.sequence.length, x, 843, { color: C.ink });
  if (s.cached.length) caption(c, 'Cached ' + s.cached.length, 833, 843, { color: C.teal });
  if (s.input) {
    const Px = x + step * s.input.position + 88;
    caption(
      c,
      'position ' + s.input.position + '  ·  attention_mask [' + s.input.mask.join(' ') + ']',
      1036,
      564,
      { align: 'center', color: C.ink },
    );
    if (s.travel < 1) {
      line(c, Px, 539, Px, 643, C.rust, 3, [6, 7]);
      if (s.travel > 0) {
        const writeY = lerp(wy + 115, cy + 24, smooth(s.travel));
        cell(c, Px - 58, writeY, 116, 62, s.sequence[s.input.position], {
          color: C.teal,
          fill: C.mint,
          size: 36,
        });
      } else {
        dot(c, Px, 546, 12, C.rust);
      }
    }
  }
  const written = s.input && s.travel === 1;
  const logits = written && cue(k, 2, 'The new logits are available');
  if (written) caption(c, 'Forwards ' + s.forwards, 1442, 843, { color: C.teal });
  if (logits) caption(c, 'New logits   ·   no ninth token selected', 1776, 322, {
    align: 'right',
    color: C.teal,
  });
  if (b < 2) {
    footer(c, b === 1
      ? 'A selection extends the sequence. A forward writes keys and values for its input.'
      : 'Ordinary greedy decode   ·   five prompt tokens   ·   no eviction');
  }
}
function policy(c, k) {
  base(c, k, 'What did the caller override?');
  const applied = Boolean(cue(k, 3, 'The caller switches'));
  const requested = Boolean(cue(k, 3, 'asks for four new tokens'));
  const mode = Boolean(cue(k, 4, 'beam search here'));
  const join = smooth(cue(k, 4, 'four new ones', 0.7));
  const width = join === 1;
  const prompt = ex.beamPrompt.length, count = ex.maxNewTokens;
  const settings = applied ? ex.resolved : ex.savedPolicy;
  const show = (v) => (typeof v === 'boolean' ? (v ? 'True' : 'False') : v);
  ['Setting', 'Saved', 'At this call'].forEach((v, i) => caption(c, v, [113, 735, 1239][i], 327));
  Object.keys(ex.savedPolicy).forEach((name, i) => {
    const a = show(ex.savedPolicy[name]),
      z = show(settings[name]);
    const y = 414 + i * 132;
    type(c, name, 111, y + 40, 48, { face: 'Mono' });
    cell(c, 720, y - 14, 278, 108, a, { color: C.blue });
    arrow(c, 1022, y + 40, 1193, y + 40, C.dim);
    cell(c, 1221, y - 14, 278, 108, z, {
      color: i && applied ? C.rust : C.teal,
      outline: i && applied,
    });
  });
  const x = 486,
    step = 145,
    nextX = lerp(1233, x + prompt * step, join);
  if (width) caption(c, 'Returned positions', 92, 745);
  else caption(c, 'Prompt IDs', x, 662, { color: C.blue });
  row(c, ex.beamPrompt, x, 697, step, 87, { size: 37, color: C.blue, fill: C.blueLight });
  caption(c, prompt + ' prompt tokens', x, 836);
  if (requested) {
    if (!width) caption(c, 'Requested new positions', nextX, 662, { color: C.rust });
    for (let i = 0; i < count; i++)
      cell(c, nextX + i * step, 697, step - 10, 87, 'N' + (i + 1), {
        size: 35,
        color: C.rust,
        fill: width ? C.peach : C.paper,
      });
    caption(c, width ? count + ' new if no earlier stop' : 'max_new_tokens = ' + count, nextX, 836);
  }
  footer(
    c,
    mode
      ? ex.policyMode +
          (width
            ? '  ·  ' + (prompt + count) + ' returned positions.'
            : ' with three retained candidates.')
      : 'Resolve the saved settings and explicit overrides before comparing token choices.',
  );
}
function release(c, k) {
  base(c, k, 'Is this release ready for the workload?');
  const passed = Boolean(cue(k, 6, 'numerical replay passes'));
  const failed = Boolean(cue(k, 6, 'quality gate fails'));
  const pending = Boolean(cue(k, 6, 'latency is pending'));
  const r = ex.release,
    x = 661,
    w = 868;
  const ys = [421, 602, 786];
  ['Logit replay', 'Held-out quality', 'Workload latency'].forEach((v, i) =>
    type(c, v, 104, ys[i], 44, { face: 'Serif' }),
  );
  type(c, '|Δ| = ' + r.logitDelta + '     tolerance ' + r.tolerance, x, ys[0], 38, {
    face: 'Mono',
    width: w,
  });
  if (failed) {
    rect(c, x, ys[1] - 31, w, 58, C.soft);
    rect(c, x, ys[1] - 31, (w * r.accepted) / r.total, 58, C.blue);
    type(c, r.accepted + ' / ' + r.total, x + 24, ys[1] - 1, 34, { face: 'Mono', color: C.white });
    const cut = x + (w * r.required) / r.total;
    line(c, cut, ys[1] - 50, cut, ys[1] + 48, C.rust, 5);
    caption(c, 'floor ' + r.required, cut, ys[1] + 82, { align: 'center', color: C.rust });
  } else {
    type(c, r.accepted + ' / ' + r.total + ' accepted     floor ' + r.required + ' / ' + r.total,
      x, ys[1], 38, { face: 'Mono', width: w });
  }
  type(c, 'No target-load sample', x, ys[2], 43, { face: 'Serif', color: C.dim });
  const visible = [passed, failed, pending];
  ex.decisions.forEach((v, i) => {
    if (visible[i]) type(c, v, 1805, ys[i], 46, { align: 'right', color: [C.teal, C.rust, C.dim][i] });
  });
  footer(
    c,
    pending
      ? 'Reproduce the numeric result, assess the task, and measure serving at the intended load.'
      : 'The release requires all three kinds of evidence. Read each result against its own gate.',
  );
}
function practiceReplay(k) {
  if (k.beat.beatIndex < 8) return { stale: false, replaying: false, sweep: 0, rebuilt: false };
  const replayPhrase = 'Replay all eleven supplied tokens on the edited request';
  const resultPhrase = 'Now “mate” is in the rebuilt cache';
  const replay = k.wordCue(replayPhrase);
  const result = k.wordCue(resultPhrase);
  const sweep = k.reveal(replayPhrase, replay.end - replay.start, { captionStart: replayPhrase });
  const rebuilt =
    k.reveal(resultPhrase, result.end - result.start, { captionStart: resultPhrase }) === 1;
  const started = Boolean(k.reveal(replayPhrase, 0, { captionStart: false }));
  return {
    stale: Boolean(k.reveal('Forwarding only “mate”', 0)) && !started,
    replaying: started && !rebuilt,
    sweep,
    rebuilt,
  };
}

function practice(c, k) {
  const edited = Boolean(cue(k, 7, 'edits the third prompt'));
  const { stale, replaying, sweep, rebuilt } = practiceReplay(k);
  base(
    c,
    k,
    rebuilt
      ? 'Which history does the rebuilt cache contain?'
      : replaying
        ? 'Replay the edited sequence'
        : 'Can the saved cache accept “mate”?',
  );
  const req = edited ? ex.editedWords : ex.returnedWords;
  const old = ex.savedPrefix;
  const diff = ex.firstDifference(old, req.slice(0, old.length));
  const cached = rebuilt ? req : replaying ? [] : old;
  const x = 115,
    step = 155,
    sequenceY = 399,
    cacheY = 676,
    height = 111;
  caption(
    c,
    edited ? 'Edited prompt + reply from the prior run' : 'Original prompt + selected reply',
    x,
    312,
  );
  req.forEach((_, i) =>
    caption(c, i, x + i * step + (step - 10) / 2, 366, { align: 'center' }),
  );
  row(c, req, x, sequenceY, step, height, {
    size: 36,
    item: (_, i) => ({
      color: i < ex.shortPrompt.length ? C.blue : C.rust,
      fill: i < ex.shortPrompt.length ? C.blueLight : C.peach,
      outline: i === diff,
    }),
  });
  type(
    c,
    rebuilt
      ? 'Recomputed K/V   ·   ' + cached.length + ' positions'
      : replaying
        ? 'New cache slots'
        : 'Saved K/V',
    x,
    622,
    37,
    { face: 'Mono', color: C.dim },
  );
  req.forEach((_, i) => {
    const invalid = stale && i >= diff;
    cell(c, x + i * step, cacheY, step - 10, height, cached[i], {
      size: 36,
      color: invalid ? C.rust : C.teal,
      fill: i >= cached.length ? C.paper : invalid ? C.peach : C.mint,
      outline: (stale && i === diff) || (rebuilt && i === old.length),
    });
  });
  if (stale) {
    const first = x + diff * step;
    const prefixEnd = first - 10;
    const last = x + old.length * step - 10;
    const center = first + (step - 10) / 2;
    line(c, center, sequenceY + height + 8, center, cacheY - 9, C.rust, 4, [7, 7]);
    line(c, x, 815, prefixEnd, 815, C.teal, 4);
    line(c, first, 815, last, 815, C.rust, 4);
    type(c, 'Matching prefix', (x + prefixEnd) / 2, 851, 33, {
      align: 'center',
      color: C.teal,
      face: 'Mono',
    });
    type(c, 'Stale K/V from position ' + diff + ' onward', (first + last) / 2, 851, 37, {
      align: 'center',
      color: C.rust,
      face: 'Mono',
    });
  }
  if (replaying) {
    const width = req.length * step - 10;
    line(c, x, 540, x + width, 540, C.faint, 5);
    line(c, x, 540, x + width * sweep, 540, C.teal, 5);
    dot(c, x + width * sweep, 540, 9, C.teal);
    type(c, 'One forward on the supplied tokens', x, 576, 36, {
      color: C.teal,
      face: 'Mono',
    });
  }
  footer(
    c,
    rebuilt
      ? '“mate” now has K/V from the same forward as the edited prefix.'
      : replaying
        ? 'The reply tokens are supplied as inputs to the replay.'
        : stale
          ? 'Later positions can depend on the old token even when their own IDs match.'
          : edited
            ? 'Compare the cached words with the requested prefix at the same positions.'
            : 'The reply ends at “mate.” Its own K/V slot is still empty.',
  );
}

const painters = [
  conversation,
  snapshot,
  dispatch,
  rendering,
  batch,
  lossScene,
  cacheScene,
  generation,
];
function draw(c, k) {
  painters[k.beat.chapterIndex](c, k);
}
function check() {
  ex.checkExamples();
  const clock = (b, active = [], finished = false) => ({
    beat: { beatIndex: b },
    elapsed: finished ? 2 : 0,
    speechDuration: 1,
    reveal: (phrase) => (active.includes(phrase) ? 1 : 0),
  });
  const staged = offloadState(clock(4, ['a hook fetches']));
  assert.deepEqual(staged.blocks.filter((b) => b.visible).map((b) => b.size), [6, 3, 1, 2]);
  assert(staged.blocks[3].y + 104 < staged.blocks[0].y);
  assert.equal(staged.verdict, false);
  const joined = offloadState(clock(5, ['The peak is twelve', 'The call exceeds']));
  assert(joined.verdict);
  for (const [i, block] of joined.blocks.entries()) {
    assert.equal(block.y, joined.blocks[0].y);
    if (i) assert.equal(block.x, joined.blocks[i - 1].x + joined.blocks[i - 1].width + 4);
  }
  assert.equal(joined.blocks[3].x, joined.limitX);
  for (const [k, seq, cached] of [
    [clock(0), 5, 0],
    [clock(0, ['Prefill the five words'], true), 6, 5],
    [clock(1, ['select “home”']), 6, 6],
    [clock(1, ['select “home”', 'Now forward']), 7, 6],
    [clock(1, ['select “home”', 'Now forward', 'select a period']), 7, 7],
    [clock(1, ['select “home”', 'Now forward', 'select a period', 'Stop after']), 8, 7],
    [clock(2, ['Send just the period']), 8, 7],
    [clock(2, ['Send just the period', 'Forward the period once']), 8, 8],
  ]) {
    const s = generationState(k);
    assert.equal(s.sequence.length, seq);
    assert.equal(s.cached.length, cached);
    assert.deepEqual(s.cached, s.sequence.slice(0, cached));
  }
  return true;
}
export default { title, draw, check };
