import { C, at, base, box, line, dot, txt, mono, serif, screw, note, fmt } from './bench.mjs';
import { firstFrameAt, fps } from '../../../director-cuts/lesson-runtime/timeline.mjs';
import {
  plans,
  graphAt,
  numeric,
  numericInput,
  batchOK,
  exportFloor,
  referenceQuality,
  allowedDrop,
  latencyLimit,
  candidates,
  passesExport,
} from './examples.mjs';

function die(ctx, x, y, kind) {
  const color = kind === 'CPU' ? C.plum : C.green;
  box(ctx, x, y, 235, 121, color, 4);
  for (let i = 0; i < 14; i++) {
    box(ctx, x + 10 + 16 * i, y - 5, 7, 5, C.metal);
    box(ctx, x + 10 + 16 * i, y + 121, 7, 5, C.metal);
  }
  for (let j = 0; j < 4; j++)
    for (let i = 0; i < (kind === 'CPU' ? 5 : 12); i++) {
      const dx = kind === 'CPU' ? 43 : 18;
      box(
        ctx,
        x + 8 + i * dx,
        y + 7 + j * 27,
        dx - 4,
        22,
        kind === 'CPU' ? '#87769b' : '#4b9180',
        2,
      );
    }
  box(ctx, x + 8, y + 7, 58, 24, color, 2);
  txt(ctx, kind, x + 37, y + 19, 17, C.white, { align: 'center', weight: 600 });
}

function afterPhrase(c, phrase, captionStart = false) {
  if (captionStart) c.reveal(phrase, 0, { captionStart: phrase });
  return c.elapsed >= firstFrameAt(c.wordCue(phrase).end) / fps;
}

export function graph(ctx, c) {
  const beat = c.beat.id;
  const splitSetup = beat === 'split';
  const row = beat === 'cpu' ? 0 : beat === 'whole' ? 2 : 1;
  const plan = plans[row];
  const handoffs = plan.spans.filter((s) => s.device === 'boundary');
  const finalSum = plan.spans.at(-1);
  const handoffTime = handoffs.reduce((total, s) => total + s.end - s.start, 0);
  const resultPhrase = {
    cpu: 'two in thirteen milliseconds',
    cross: 'twenty-one milliseconds with the same answer',
    whole: 'two and a half milliseconds and still gives two',
  }[beat];
  const settled = resultPhrase && afterPhrase(c, resultPhrase, true);
  let ms = 0;
  if (settled) ms = plan.total;
  else if (beat === 'cpu') ms = finalSum.start * c.reveal('Run all three on the CPU', 2.1);
  else if (beat === 'whole') ms = finalSum.start * c.reveal('Follow the pair', 2.1);
  else if (beat === 'cross') {
    const outward = 'Follow the pair across';
    const returning = 'and back';
    const returnStart = c.wordCue(returning).start;
    const outwardTime = returnStart - c.wordCue(outward).start;
    const returnTime = c.wordCue('The operations take').start - returnStart;
    const atCpu = handoffs[1].start;
    ms =
      atCpu * c.reveal(outward, outwardTime, { captionStart: false }) +
      (finalSum.start - atCpu) * c.reveal(returning, returnTime, { captionStart: false });
  }
  const st = graphAt(plan, ms);
  base(ctx, 'Where does the pair spend its time?', 'HANDHELD LOGIC BOARD');
  const cpuPlacementKnown = !splitSetup || afterPhrase(c, 'middle operation to the CPU');
  const operations = plan.spans.filter((s) => s.device !== 'boundary');
  operations.forEach((op, j) => {
    const x = 53 + j * 303;
    const name = op.name === 'Output' ? 'Final sum' : op.name;
    const device = j === 1 && !cpuPlacementKnown ? '' : op.device.toUpperCase();
    const active = ms > 0 && op.start <= ms && ms < op.end;
    const color = op.device === 'cpu' ? C.plum : C.green;
    box(ctx, x, 100, 248, 38, active ? color : C.paper, 5, device ? color : C.metal);
    txt(ctx, name, x + 13, 119, 19, active ? C.white : C.ink);
    if (device) mono(ctx, device, x + 232, 119, 17, active ? C.white : color, 'right');
    if (j < operations.length - 1) mono(ctx, '→', x + 275, 119, 21, C.muted, 'center');
  });

  box(ctx, 53, 148, 854, 147, '#c7c8b3', 12, '#abb49f');
  screw(ctx, 64, 159);
  screw(ctx, 895, 284);
  for (let j = 0; j < 12; j++) {
    const y = 174 + j * 8;
    line(
      ctx,
      [
        [307, y],
        [360, y],
        [392, y + (j - 6) * 2],
        [561, y + (j - 6) * 2],
        [593, y],
        [646, y],
      ],
      j % 2 ? '#aca378' : '#b2986a',
      1.7,
    );
  }
  die(ctx, 84, 159, 'CPU');
  die(ctx, 641, 159, 'NPU');
  const crossing = handoffs.findIndex((s) => s.start <= ms && ms < s.end);
  if (crossing >= 0) {
    const from = plan.placement[crossing].toUpperCase();
    const to = plan.placement[crossing + 1].toUpperCase();
    box(ctx, 362, 159, 236, 31, C.paper, 4);
    txt(ctx, 'Handoff ' + (crossing + 1) + '   ' + from + ' → ' + to, 480, 175, 18, C.ink, {
      align: 'center',
      weight: 600,
    });
  }
  const x = 201 + (758 - 201) * st.position;
  box(ctx, x - 78, 206, 156, 49, C.paper, 6, C.ink, 2);
  mono(ctx, '[' + st.values.map(fmt).join(', ') + ']', x, 230, 25, C.ink, 'center');

  const left = 161;
  const scale = 30;
  const axisX = left + scale * plans[1].total;
  const cpuFinishX = left + scale * plans[0].total;
  if (row > 0) {
    txt(ctx, 'CPU finish', cpuFinishX, 311, 16, C.muted, { align: 'center' });
    line(
      ctx,
      [[cpuFinishX, 324], [cpuFinishX, 352 + 43 * row]],
      C.metal,
      2,
    );
  }
  txt(ctx, 'Time', 839, 311, 16, C.muted, { align: 'center' });
  txt(ctx, 'Output', 904, 311, 16, C.muted, { align: 'center' });
  for (let j = 0; j <= row; j++) {
    const p = plans[j];
    const end = j === row ? ms : p.total;
    const y = 326 + j * 43;
    txt(ctx, ['CPU only', 'Split run', 'NPU only'][j], 51, y + 13, 19);
    line(
      ctx,
      [
        [left, y + 12],
        [axisX, y + 12],
      ],
      C.grid,
      1,
    );
    p.spans.forEach((s) => {
      const w = Math.max(0, Math.min(s.end, end) - s.start) * scale;
      if (w <= 0) return;
      const sx = left + s.start * scale;
      box(
        ctx,
        sx,
        y,
        Math.max(0.1, w - 0.8),
        25,
        s.device === 'boundary' ? C.copper : s.device === 'cpu' ? C.plum : C.green,
        1,
      );
      if (s.device === 'boundary' && end >= s.end)
        txt(ctx, 'Handoff · ' + (s.end - s.start) + ' ms', sx + w / 2, y + 13, 18, C.ink, {
          align: 'center',
        });
    });
    if (end === p.total) {
      mono(ctx, fmt(p.total) + ' ms', 839, y + 13, 18, C.ink, 'center');
      box(ctx, 883, y - 1, 42, 28, C.screen, 4);
      mono(ctx, String(p.output), 904, y + 13, 19, C.dark, 'center');
    }
  }

  let summary = 'Projection [a − b, (a + b) / 2]     →     ReLU     →     a / 2 + b';
  if (cpuPlacementKnown && splitSetup) {
    const cost = handoffs[0].end - handoffs[0].start;
    summary = afterPhrase(c, 'costs eight milliseconds here')
      ? 'Each handoff costs ' + cost + ' ms. Can this route beat the CPU?'
      : 'The activation runs on the CPU. Where does the pair have to cross?';
  }
  if (beat === 'cross' && afterPhrase(c, 'operations take five milliseconds between them')) {
    summary = 'Operations ' + (plan.total - handoffTime) + ' ms';
    if (afterPhrase(c, 'Two handoffs add sixteen')) summary += '  +  handoffs ' + handoffTime + ' ms';
    if (settled) summary += '  =  ' + plan.total + ' ms';
  }
  if (beat === 'whole' && settled)
    summary = 'All three operations stay on the NPU. The output is still ' + plan.output + '.';
  note(ctx, summary);
}

export function exportTests(ctx, c) {
  if (['gates', 'candidate'].includes(c.beat.id)) return gates(ctx, c);
  const clamped = c.beat.id === 'clamp' && at(c, 'The clipped row');
  const scored = c.beat.id === 'clamp' && at(c, 'Class zero');
  const shape = c.beat.id === 'clamp' && at(c, 'nine is outside');
  base(ctx, 'What will the saved router accept?', 'CPU EXPORT');
  txt(ctx, 'Clamp each input to [−1, 1], then score both classes.', 45, 126, 22);
  ['Input row', 'Clipped row', 'Class scores'].forEach((s, i) =>
    txt(ctx, s, 52 + 310 * i, 190, 20, C.muted),
  );
  function tiles(x, arr) {
    arr.forEach((v, i) => {
      box(ctx, x + i * 78, 219, 70, 63, C.screen, 6, C.metal);
      mono(ctx, fmt(v), x + i * 78 + 35, 251, 23, C.ink, 'center');
    });
  }
  tiles(51, numericInput);
  if (clamped) tiles(360, numeric.clamped);
  if (scored) tiles(672, numeric.logits);
  txt(ctx, '[−sum, +sum]', 673, 304, 18, C.muted);
  if (scored) txt(ctx, 'Class ' + numeric.class, 673, 351, 24, C.green, { weight: 700 });
  line(
    ctx,
    [
      [49, 392],
      [911, 392],
    ],
    C.metal,
    1,
  );
  txt(ctx, 'Batch of 9 rows   ·   declared export domain [1, 8]', 52, 425, 20);
  note(
    ctx,
    shape
      ? 'Eager runs nine rows. The reloaded export ' +
          (batchOK(9) ? 'accepts' : 'rejects') +
          ' nine.'
      : 'The output and the allowed input shape are separate checks.',
  );
}
function gates(ctx, c) {
  const ready = c.beat.id === 'candidate' && at(c, 'export qualifies');
  base(ctx, 'Which export clears both limits?', 'PAIRED EVALUATION');
  txt(
    ctx,
    'Quality ≥ ' +
      referenceQuality +
      ' − ' +
      allowedDrop +
      '      ·      p95 latency ≤ ' +
      latencyLimit +
      ' ms',
    47,
    125,
    23,
  );
  ['Export', 'Quality', 'Latency', 'Trial decision'].forEach((s, i) =>
    txt(ctx, s, [66, 278, 487, 694][i], 188, 18, C.muted),
  );
  candidates.forEach((r, i) => {
    const y = 247 + i * 75;
    line(
      ctx,
      [
        [46, y - 37],
        [912, y - 37],
      ],
      C.grid,
      1,
    );
    mono(ctx, r[0], 68, y, 27);
    txt(ctx, r[1].toFixed(3), 278, y, 23, ready && r[1] < exportFloor ? C.pink : C.ink);
    txt(ctx, r[2] + ' ms', 487, y, 23, ready && r[2] > latencyLimit ? C.pink : C.ink);
    if (ready)
      txt(
        ctx,
        passesExport(r) ? 'Eligible' : r[2] > latencyLimit ? 'Too slow' : 'Quality drop',
        694,
        y,
        22,
        passesExport(r) ? C.green : C.pink,
      );
  });
  note(
    ctx,
    ready
      ? 'INT8 clears both gates. INT4 is faster and loses too much quality.'
      : 'Compare held-out citations after conversion and quantization.',
  );
}
