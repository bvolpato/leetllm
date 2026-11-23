import assert from 'node:assert/strict';
import { adam } from '../../../films/deep-dive-deepspeed/arithmetic.mjs';
import { base, label, rect, chip, socket, cells, row, line, note, event, range, blue, mid, mint, orange, plum, gold, ink, fmt } from './bench.mjs';

const checkpointShape = [3, 4];
const coordinates = range(checkpointShape[0] * checkpointShape[1]);
const coord = i => 'w' + Math.floor(i / 4) + (i % 4);
function partitions(values, count) {
  return range(count).map(i => values.slice(i * values.length / count, (i + 1) * values.length / count));
}

export function engine(g, k) {
  const b = k.beat.beatIndex;
  base(g, 'Source tour  ·  c455031', ['Which code handles this operation?', 'Can the layer use W7 now?', 'Which wrapper receives this configuration?'][b]);
  if (b === 0) {
    const paths = [
      ['__init__.py', 'Select engine and data groups', 'Start at initialization'],
      ['runtime/engine.py', 'Backward, accumulation, step, save and load', 'Follow a backward'],
      ['runtime/zero/stage_1_and_2.py', 'Manage gradient and optimizer ownership', 'stage-one-and-two code'],
      ['runtime/zero/stage3.py', 'Coordinate sharded parameters', 'Stage three also'],
      ['runtime/zero/partition_parameters.py', 'Partition, gather and release the full view', 'Partition parameters'],
    ];
    paths.forEach(([file, job, phrase], i) => {
      const y = 286 + i * 105, active = i === 0 || event(k, 0, phrase);
      line(g, 110, y - 24, 110, y + 77, '#bcc3b9');
      rect(g, 99, y + 12, 24, 24, active ? mint : '#bcc3b9');
      label(g, file, 155, y + 40, 35, active ? ink : mid, { font: 'Mono', width: 895 });
      if (active) label(g, job, 1060, y + 40, 34, mint, { width: 730 });
    });
    note(g, 'Paths relative to deepspeed/   ·   functions share responsibility for a training step');
    return;
  }
  if (b === 1) {
    const released = !!event(k, 1, 'can be released');
    const available = !!event(k, 1, 'to available') && !released;
    const flying = !!event(k, 1, 'to in flight') && !available && !released;
    const status = released ? 'Released' : available ? 'Available' : flying ? 'In flight' : 'Unavailable';
    row(g, 342, 'On the owner', ['W7 shard'], { w: 387, color: blue });
    label(g, 'Layer view', 100, 538, 35, ink, { bold: true });
    if (available) chip(g, 585, 474, 852, 106, 'W7   /   full view', mint);
    else if (flying) socket(g, 585, 474, 852, 106, 'Gather in progress');
    else label(g, 'Full view is absent', 585, 544, 38, mid);
    label(g, status, 100, 749, 57, available ? mint : orange, { font: 'Serif' });
    label(g, available ? 'The layer can read W7.' : 'The shard stays resident.', 585, 744, 37);
    const offload = event(k, 1, 'Offload staging');
    note(g, offload ? 'Staging → runtime/swap_tensor/     ·     Pipeline schedule → runtime/pipe/engine.py' :
      event(k, 1, 'early optimizer update') ? 'Early update → inspect the accumulation boundary in runtime/engine.py' : 'Gather status → runtime/zero/partition_parameters.py');
    return;
  }
  label(g, 'Requested   /   ZeRO stage 3', 100, 319, 44);
  row(g, 401, 'PipelineEngine', ['August pin', event(k, 2, 'rejects ZeRO') ? 'Rejects stages 2 and 3' : 'Checking'], { w: 545, color: i => i ? orange : blue });
  row(g, 559, 'AutoTP training', ['Training guide', event(k, 2, 'describes stages') ? 'Stages 0–3, by model' : 'Checking'], { w: 545, color: i => i ? mint : blue });
  note(g, 'Check the selected path, model partition rules, loss parity and fresh restore.');
}

export function convert(g, k) {
  const b = k.beat.beatIndex, source = partitions(coordinates, 4);
  const fromX = i => 100 + (i % 3) * 127;
  const fromY = i => 345 + Math.floor(i / 3) * 104;
  const gridX = i => 700 + (i % 4) * 116, gridY = i => 376 + Math.floor(i / 4) * 107;
  const t = event(k, 0, 'can be reconstructed', 2), u = event(k, 1, 'repartition the same named tensor', 2);
  const toX = i => 1230 + (i % 3) * 132;
  const toY = i => 330 + Math.floor(i / 6) * 240 + Math.floor((i % 6) / 3) * 79;
  base(g, 'Checkpoint conversion', b ? 'Which tensor survives a repartition?' : 'What materializes in host memory?');
  label(g, 'Four source shards', 100, 289, 36, ink, { bold: true });
  label(g, 'W   [3, 4]   FP32', 695, 289, 39, ink, { font: 'Mono' });
  if (b) label(g, 'Two target shards', 1230, 289, 36, ink, { bold: true });
  const palette = [blue, mint, plum, gold];
  source.forEach((part, rank) => {
    part.forEach(i => chip(g, fromX(i), fromY(i), 119, 69, coord(i), palette[rank], { size: 29 }));
    label(g, 'R' + rank, 493, fromY(part[0]) + 45, 28, mid);
  });
  // Write each coordinate into its actual row and column. The source stays readable.
  coordinates.forEach(i => {
    const gx = gridX(i), gy = gridY(i), color = palette[Math.floor(i / 3)];
    socket(g, gx, gy, 110, 72);
    if (i < Math.floor(t * coordinates.length)) chip(g, gx, gy, 110, 72, coord(i), color, { size: 29 });
    if (b) {
      if (i < Math.floor(u * coordinates.length)) chip(g, toX(i), toY(i), 119, 69, coord(i), color, { size: 29 });
      else socket(g, toX(i), toY(i), 119, 69);
    }
  });
  if (b) partitions(coordinates, 2).forEach((part, i) => label(g, 'R' + i, 1640, toY(part[0]) + 58, 29, mid));
  label(g, b ? 'Each coordinate keeps its row and column in W.' : t===1 ? '12 coordinates × 4 bytes = 48 bytes for this dense tensor' : 'Shard colors follow the values into the dense tensor.', 105, 797, 34);
  const native = event(k, 1, 'For partition-native AutoEP');
  note(g, b === 2 ? 'Fresh workers   ·   load the target layout and compare the next update with the reference' :
    native ? 'Partition-native AutoEP → ds_to_universal.py   ·   dense zero_to_fp32.py cannot read it' :
    b ? 'A supported topology change preserves tensor names and shapes.' :
    'Dense ZeRO reconstruction   ·   lazy materialization defers the host allocation.');
}

const faults = [
  {rank: 2, time: 1.2, message: 'W7 unavailable at external read'},
  ...[0, 1, 3].map(rank => ({rank, time: 1.8, message: 'Collective timeout'})),
];
export function investigate(g, k) {
  const b = k.beat.beatIndex;
  base(g, 'Project evidence', b ? 'Which event would you reproduce first?' : 'Which revision describes this project?');
  if (!b) {
    label(g, 'DeepSpeed   /   source snapshot', 105, 342, 53, ink, { font: 'Serif' });
    label(g, 'c455031   ·   6 August 2026', 105, 421, 39, blue, { font: 'Mono' });
    row(g, 492, 'ZeRO paper', ['Microsoft authors'], { w: 710, color: blue });
    if (event(k, 0, 'Technical Steering Committee')) row(g, 612, 'Project charter', ['TSC', 'LF AI & Data'], { w: 405, color: mint });
    note(g, event(k, 0, 'Its code license') ? 'Code   Apache-2.0     ·     Contributions   DCO sign-off     ·     Documentation   CC BY 4.0' : 'Use the dated committer roster for affiliations at that revision.');
    return;
  }
  const first = !!event(k, 1, 'Rank two recorded'), peers = !!event(k, 1, 'Peers timed out'), chosen = b === 2;
  const x = time => 420 + 635 * time;
  for (const rank of range(4)) {
    const y = 342 + 98 * rank, f = faults.find(f => f.rank === rank);
    label(g, 'Rank ' + rank, 110, y + 13, 37, ink, { bold: true });
    line(g, x(0), y, x(2.05), y, '#bbc5b9', 3);
    if (f.rank === 2 ? first : peers) {
      const fx = x(f.time), color = f.rank === 2 ? orange : mid;
      rect(g, fx - 7, y - 20, 14, 40, color);
      label(g, f.message, fx - 22, y - 12, 30, color, { align: 'right', bold: chosen && f.rank === 2 });
    }
  }
  for (const f of [faults[0], faults[1]]) {
    const px = x(f.time); line(g, px, 680, px, 699);
    label(g, f.time.toFixed(1) + ' s', px, 753, 35, ink, { align: 'center', font: 'Mono' });
  }
  note(g, chosen ? 'Reproduce the rank 2 read   ·   save the revision, resolved config, group sizes and input order' :
    'Four data ranks   ·   matched clocks   ·   same training step');
}

function lifecycle(k) {
  const forward = event(k, 0, 'Gather the full view');
  const release = event(k, 0, 'and release it');
  const backward = event(k, 0, 'Gather for backward');
  const gradient = event(k, 0, 'The reduction returns');
  const boundary = !!event(k, 1, 'last microstep closes');
  const written = !!event(k, 1, 'Then update');
  const count=boundary?8:gradient?7:6;
  const accumulated=count*(1+3)/2/8;
  return {
    fullView: Boolean((forward && !release) || (backward && !gradient)),
    ownedGradient: Boolean(gradient), boundary, written, count, accumulated,
    state: written ? adam([1, 0, 0], accumulated, 1) : [1, 0, 0],
  };
}
export function synthesis(g, k) {
  const s = lifecycle(k);
  base(g, 'One ZeRO-3 update', 'What can rank 0 do with W[0] now?');
  label(g, 'Rank inputs   1 and 3   ·   equal weights   ·   accumulation window of 8', 100, 306, 35);
  row(g, 363, 'Owner keeps', ['W[0]', 'm[0]', 'v[0]'], { w: 236, color: blue });
  label(g, 'Layer view', 100, 521, 35, ink, { bold: true });
  if (s.fullView) cells(g, 585, 466, range(4).map(i => 'W[' + i + ']'), { w: 173, h: 75, color: mint });
  else label(g, 'Released / unavailable', 585, 516, 36, mid);
  label(g, 'Owned accumulator', 100, 624, 35, ink, { bold: true });
  chip(g,585,569,402,75,'g[0] = '+fmt(s.accumulated),s.ownedGradient?mint:blue);
  label(g, 'Window   ' + s.count + ' / 8', 1105, 618, 40, s.boundary ? mint : orange, { font: 'Mono' });
  const [w, m, v] = s.state;
  label(g, 'w = ' + w.toFixed(2) + '       m = ' + fmt(m) + '       v = ' + fmt(v), 102, 771, 48, ink, { font: 'Mono' });
  note(g, s.written ? 'One completed update   ·   compare this owned state with the uninterrupted reference' :
    s.ownedGradient ? s.boundary ? 'The last contribution closed the window. The owner can update.' : 'Reduced slice arrived   ·   the accumulation boundary is still ahead' : 'Local ownership stays fixed as the full parameter view comes and goes.');
}

export function checkTraces() {
  assert.deepEqual(partitions(coordinates, 4).map(s => s.length), [3, 3, 3, 3]);
  assert.deepEqual(partitions(coordinates, 2).flat().map(coord), ['w00','w01','w02','w03','w10','w11','w12','w13','w20','w21','w22','w23']);
  assert.equal(coordinates.length * Float32Array.BYTES_PER_ELEMENT, 48);
  assert.equal(faults.toSorted((a,b) => a.time - b.time)[0].rank, 2);
  const clock = (beatIndex, phrases = []) => ({ beat: { beatIndex }, reveal: phrase => Number(phrases.includes(phrase)) });
  assert.equal(lifecycle(clock(0, ['Gather the full view'])).fullView, true);
  assert.equal(lifecycle(clock(0, ['Gather the full view','and release it'])).fullView, false);
  const held = lifecycle(clock(1));
  assert.equal(lifecycle(clock(0)).accumulated,1.5);
  assert.equal(held.accumulated,1.75);
  assert.equal(held.ownedGradient, true);
  assert.deepEqual(held.state, [1, 0, 0]);
  const done = lifecycle(clock(2));
  assert.equal(done.boundary, true);
  assert.equal(done.accumulated,2);
  assert.deepEqual(done.state, adam(held.state, 2, 1));
}
