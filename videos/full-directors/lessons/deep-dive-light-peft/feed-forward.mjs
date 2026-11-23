import { C, smooth } from './drawing.mjs';
import {
  FFN,
  ff,
  ffPaths,
  survivingFF,
  dotFF,
  n1Gate,
  n1GatedActivation,
  fmt,
  localFF,
  globalFF,
  ffnLayers,
} from './examples.mjs';

function bands(p, t, track, estimating) {
  const { ctx } = p;
  const tones = [C.rust, C.blue, C.teal];
  ffPaths.forEach(({ id, activation, weight }, i) => {
    if (estimating && i > 0) return;
    const moves = !survivingFF.some((path) => path.id === id);
    const ux = 167 - (moves ? 106 * t : 0),
      dy = moves ? -108 * t : -45 * t;
    const y = 375 + i * 53 + dy;
    const cx = 552 + i * 65 - (moves ? 153 * t : 65 * t),
      cy = 234 - (moves ? 58 * t : 0);
    const radius = 44 + i * 24;
    ctx.save();
    ctx.lineCap = 'butt';
    ctx.strokeStyle = tones[i];
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.moveTo(ux + 91, y);
    ctx.lineTo(cx - radius, y);
    ctx.quadraticCurveTo(cx, y, cx, y - radius);
    ctx.lineTo(cx, cy + 66);
    ctx.stroke();
    ctx.restore();
    p.box(ux, y - 16, 43, 32, tones[i]);
    p.box(ux + 45, y - 16, 46, 32, tones[i]);
    p.mono(id, ux - 10, y, 16, tones[i], 'right');
    p.mono(fmt(activation), ux + 145, y, 15, C.white, 'center');
    if (estimating && p.cue(1, 'Its learned gate') && i === 0) {
      p.plate(365, y - 24, 97, 48, C.peach, C.rust, '× ' + fmt(n1Gate), 19);
      p.label('Learned gate', 414, y + 46, 17, C.rust, { align: 'center' });
      if (p.cue(1, 'Its down column')) p.mono(fmt(n1GatedActivation), 572, 328, 19, C.rust);
    }
    p.box(cx - 25, cy, 50, 33, tones[i]);
    p.box(cx - 25, cy + 35, 50, 31, tones[i]);
    p.mono(fmt(weight), cx, cy + 16, 19, C.white, 'center');
    p.mono(id, cx, cy - 17, 16, tones[i], 'center');
    if (moves && track > 0 && track < 1 && !t) {
      const straight = cx - radius - ux - 91,
        turnLength = (Math.PI * radius) / 2,
        up = y - radius - cy - 66;
      const d = track * (straight + turnLength + up);
      if (d < straight) p.bead(ux + 91 + d, y, 8);
      else if (d < straight + turnLength) {
        const phi = (((d - straight) / turnLength) * Math.PI) / 2;
        p.bead(cx - radius + radius * Math.sin(phi), y - radius + radius * Math.cos(phi), 8);
      } else p.bead(cx, y - radius - (d - straight - turnLength), 8);
    }
  });
}
export function feedForward(p) {
  const { b, cue, header, foot, box, line, label, mono, dot } = p;
  const selected = b === 1 && cue(1, 'Look inside layer zero');
  if (b === 0 || (b === 1 && !selected)) {
    header('Feed-forward gates  /  pooled across layers', 'Which two coordinates will leave?');
    const t = smooth(cue(0, 'Pool these five', 1.6));
    const sorted = [...FFN].sort((a, b) => a.score - b.score);
    label('Recorded order', 68, 166, 16, C.dim);
    FFN.forEach((row, i) => {
      const x = 65 + i * 222;
      mono(row.id, x + 81, 207, 19, row.layer ? C.teal : C.blue, 'center');
      p.plate(
        x,
        232,
        163,
        55,
        row.layer ? C.mint : C.ice,
        row.layer ? C.teal : C.blue,
        fmt(row.score),
        25,
      );
    });
    label('Ascending score', 68, 325, 16, C.dim);
    sorted.forEach((row, j) => {
      const x = 65 + j * 222;
      const rejected =
        b === 1 && !ff.kept.includes(FFN.indexOf(row)) && cue(1, 'falls below the line');
      line(
        [
          [x, 409],
          [x + 163, 409],
        ],
        C.fine,
      );
      if (t * 5 <= j) return;
      p.ctx.save();
      p.ctx.globalAlpha = Math.min(1, t * 5 - j);
      p.plate(
        x,
        350,
        163,
        56,
        rejected ? C.peach : C.white,
        rejected ? C.rust : C.fine,
        row.id + '  ' + fmt(row.score),
        16,
      );
      p.ctx.restore();
    });
    if (cue(0, 'It is point two four six')) {
      const cursor = 146 + 222 * 1.6;
      line(
        [
          [cursor, 412],
          [cursor, 453],
        ],
        C.rust,
        3,
      );
      dot(cursor, 412, 5, C.rust);
      mono('q = ' + fmt(ff.threshold), cursor, 482, 25, C.rust, 'center');
    }
    foot('Global quantile at position 0.4 × (5 − 1)    •    keep score > q');
    return;
  }
  if (b === 4) {
    header('A fresh pair of layers  /  cut 50%', 'Where do the two surviving coordinates land?');
    const global = cue(4, 'both survivors come from B'),
      local = cue(4, 'one survives in each');
    ['One pooled median', 'A median per layer'].forEach((s, k) => {
      const x = 76 + k * 561;
      label(s, x, 189, 24, C.ink, { bold: true });
      ffnLayers.forEach((layer, j) => {
        const y = 272 + j * 142;
        mono(j ? 'B' : 'A', x, y + 31, 28);
        layer.forEach((v, i) => {
          const visible = k === 0 ? global : local;
          const keep = k === 0 ? globalFF.kept.includes(j * 2 + i) : localFF[j].kept.includes(i);
          p.plate(
            x + 58 + i * 121,
            y,
            102,
            62,
            visible ? (keep ? C.mint : C.faint) : C.white,
            visible && keep ? C.teal : C.fine,
            fmt(v),
            25,
          );
        });
        if ((k === 0 && global) || (k === 1 && local)) {
          const count =
            k === 0
              ? globalFF.kept.filter((v) => Math.floor(v / 2) === j).length
              : localFF[j].kept.length;
          label(count + ' kept', x + 311, y + 33, 24, count ? C.teal : C.rust);
          mono(
            'q = ' + fmt(k === 0 ? globalFF.threshold : localFF[j].threshold),
            x + 61,
            y + 89,
            16,
            C.dim,
          );
        }
      });
    });
    foot(
      local
        ? 'A global cut can empty a layer. Compare its scales and check the resulting width.'
        : 'Both policies start from the same four scores and the same requested budget.',
    );
    return;
  }
  const estimating = b === 1 && !cue(1, 'Replay the same token');
  header(
    estimating ? 'Layer 0  /  estimation  /  L0-n1' : 'Layer 0  /  same-token replay  /  unit gates',
    estimating ? 'What reaches the down column?' : 'Follow one coordinate around the bend',
  );
  const t = smooth(cue(3, 'Lift both ends', 1.7)),
    track = cue(2, 'Follow the first activation', 2.5);
  const paired = t === 1;
  label('Up rows → activations', 64, 521, 19, C.blue);
  label(estimating ? 'Down column' : 'Down columns', estimating ? 552 : 620, 173, 19, C.blue, { align: 'center' });
  bands(p, t, track, estimating);
  if (paired) label('Removed together', 78, 220, 17, C.rust, { bold: true });
  line(
    [
      [787, 181],
      [787, 506],
    ],
    C.fine,
    1,
  );
  if (estimating) {
    label('L0-n1 on this token', 833, 197, 22, C.rust);
    label('Intermediate activation', 833, 254, 18, C.dim);
    mono(fmt(ffPaths[0].activation), 833, 289, 29);
    if (cue(1, 'Its down column')) {
      label('Input to the down column', 833, 347, 18, C.dim);
      mono(fmt(ffPaths[0].activation) + ' × ' + fmt(n1Gate) + ' = ' + fmt(n1GatedActivation),
        833, 383, 24, C.rust);
    }
    if (cue(1, 'so this path contributes')) {
      label('Contribution to output 1', 833, 442, 18, C.dim);
      mono(fmt(n1GatedActivation) + ' × ' + fmt(ffPaths[0].weight) + ' = ' +
        fmt(n1GatedActivation * ffPaths[0].weight), 833, 479, 24);
    }
    foot('During estimation, each intermediate coordinate has its own learned multiplier.', C.rust);
    return;
  }
  label('One token  ·  gates = 1', 833, 197, 22, C.dim);
  const ready = b > 1 || cue(1, 'They sum to nine'),
    answer = cue(3, 'The first output is seven');
  const paths = t === 0 ? ffPaths : survivingFF;
  if (t === 0 || paired) {
    paths.forEach((v, j) => {
      const y = 260 + j * 46;
      mono(v.id, 833, y, 18, v.id === 'n1' ? C.rust : C.teal);
      mono(
        fmt(v.activation) + ' × ' + fmt(v.weight) + ' = ' + fmt(v.activation * v.weight),
        898,
        y,
        19,
      );
    });
    if ((t === 0 && ready) || (paired && answer)) {
      line(
        [
          [834, 392],
          [1113, 392],
        ],
        C.fine,
        2,
      );
      label('Output', 834, 442, 21);
      mono(dotFF(paths), 1066, 441, 55, C.ink, 'center');
    }
  } else label('Slicing the pair…', 833, 315, 24, C.rust);
  if (t > 0) label('Before the cut   ' + dotFF(ffPaths), 834, 495, 17, C.dim);
  foot(
    b === 1
      ? 'Before slicing, replay all three paths with unit gates.'
      : b === 2
        ? 'If the up row leaves, which down column belongs with it?'
        : !paired
          ? 'The same intermediate feature owns both slices.'
          : 'Layer 0 keeps n2 and n3. Layer 1 keeps n2.',
    C.teal,
  );
}
