// Scene `clamp-and-gradient`: a clamp that the encoder does not read back, and a gradient that
// sees the feature only when the residual is held.
//
// The picture, part 1: the lines of equal encoder output cross the plane at a slant. The clamp
// asks for 3 and lifts the dot by one along the column. The dot crosses the line of 3 and stops
// on the line of 4.
// The picture, part 2: an activation as a blue arrow plus a green residual. The latent wiggles.
// With a live residual, the green part turns and the dot stands still. With a held residual, the
// green part rides on the arrow and the dot moves.
import { dotProduct } from 'vizmatic';
import { assertEqual, column, decimal, indicate, line, place, row, tex } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { COLOR, SIDE, board, vec } from '../parts.mjs';

/** The clamp of the voice: the encoder, the activation, the unit column, and the value asked for. */
const CLAMP = { reader: [1, 2], x: [1, 0.5], column: [0, 1], asked: 3, sum: [1, 1] };
/** The gradient test of the voice: the latent, its column, the activation and the readout. */
const GRADIENT = { z: 1, column: [1, 0], x: [1, 0.1], readout: [3, 100] };

export default function clampAndGradient(s, c) {
  const b = board();
  const encode = (x) => Math.max(0, dotProduct(CLAMP.reader, x));
  const cached = encode(CLAMP.x);
  const edited = vec.add(CLAMP.x, vec.scale(CLAMP.column, CLAMP.asked - cached));
  assertEqual(
    [cached, edited, encode(edited)],
    [2, [1, 1.5], 4],
    'the clamp of the voice: 2, then [1, 1.5], then 4',
  );
  assertEqual(
    [dotProduct(CLAMP.sum, CLAMP.x), dotProduct(CLAMP.sum, edited)],
    [1.5, 2.5],
    'the sum readout before and after',
  );
  assertEqual(dotProduct(GRADIENT.readout, GRADIENT.x), 13, 'the readout of the gradient test');
  assertEqual(
    dotProduct(GRADIENT.readout, GRADIENT.column),
    3,
    'the derivative with the residual held',
  );

  const [formulaBand, factsBand, verdictBand] = SIDE.rows([3, 4, 2], 'normal');
  s.add(heading(c.title));
  c.take(b.plane);

  // Part 1. The clamp: the dot, the column, and the edit along the column.
  const share = s.value(0);
  const at = () => vec.add(CLAMP.x, vec.scale(CLAMP.column, (CLAMP.asked - cached) * share.value));
  const start = b.ringOf(CLAMP.x, 'faint', 15);
  const point = b.dotOf(at, COLOR.activation);
  const editArrow = b.arrowOf(CLAMP.x, at, COLOR.other);
  const columnArrow = b.arrowOf([0, 0], CLAMP.column, COLOR.other, { width: 6 });
  const clamp = tex("x' = x + (c - z_f)\\,d_f", { size: 52 });
  const keeps = tex("x = z_f\\,d_f + e \\quad\\Rightarrow\\quad x' = c\\,d_f + e", { size: 38 });
  place(column([clamp, keeps], { gap: 'wide', align: 'center' }), formulaBand);
  clamp.part('(c - z_f)\\,d_f').forEach((glyph) => glyph.color(COLOR.other));
  keeps.parts('e').forEach((glyphs) => glyphs.forEach((glyph) => glyph.color(COLOR.residual)));
  s.add(start, point);
  c.show('clamp-and-gradient-b0', clamp);
  c.show('clamp-add', columnArrow);
  c.show('clamp-error', keeps);

  // The lines of equal encoder output: the encoder reads x1 + 2 x2.
  const level = (value, color) => {
    // The two ends of the line inside the plane.
    const leftX = Math.max(-1.25, value - 1.85 * CLAMP.reader[1]);
    const ends = [
      [2.85, (value - 2.85) / CLAMP.reader[1]],
      [leftX, (value - leftX) / CLAMP.reader[1]],
    ];
    return line(b.P(ends[0]), b.P(ends[1]), { stroke: color, width: 3, dash: [12, 10] });
  };
  const levels = [2, 3, 4].map((value) => level(value, 'dim'));
  // Each name stands over its line, at a place that is free of the axes and of the path of the dot.
  const levelTags = [
    [2, 0.6, [-22, 46]],
    [3, 2.2, [22, -46]],
    [4, 2.0, [22, -70]],
  ].map(([value, x, lift]) =>
    b.tagOf([x, (value - x) / CLAMP.reader[1]], `z = ${value}`, 'dim', lift),
  );
  const notDual = place(label('the reader has its own direction'), factsBand, 'top');
  c.show('clamp-notdual', [...levels, notDual]);

  // The numbers of the voice.
  const reader = tex('z = \\max(0,\\ x_1 + 2\\,x_2)', { size: 48 });
  const decoder = tex('d_f = [\\,0,\\ 1\\,]', { size: 48 });
  place(column([reader, decoder], { gap: 'normal', align: 'center' }), formulaBand);
  c.swap('clamp-and-gradient-b1', [clamp, keeps, notDual], [reader, ...levelTags]);
  const here = b.tagOf(CLAMP.x, '[1, 0.5]', COLOR.activation, [-22, 62], { anchor: 'right' });
  const facts = [
    mono(`cached z = ${cached}`),
    mono(`asked c = ${CLAMP.asked}`, { color: COLOR.mark }),
    mono(`re-encoded = ${encode(edited)}`, { color: COLOR.mark }),
  ];
  place(column(facts, { gap: 'normal', align: 'center' }), factsBand, 'top');
  c.show('clamp-at', [here, facts[0]], { after: true });
  c.show('clamp-decoder', decoder);
  c.on('clamp-decoder', () => s.play(indicate(columnArrow, { color: COLOR.mark, scale: 1.1 })));
  // The edit: the dot rises by one, crosses the line of 3, and stops on the line of 4.
  const there = b.tagOf(edited, '[1, 1.5]', COLOR.activation, [24, -40], { anchor: 'left' });
  c.show('clamp-ask', facts[1]);
  const question = place(label('Encoder readback = ?', { color: COLOR.mark }), verdictBand);
  c.show('clamp-question', question);
  c.hide('clamp-move', question);
  c.show('clamp-move', editArrow, { lead: 0 });
  const cross = c.cue('clamp-cross').end;
  c.on('clamp-move', () =>
    s.play(share.to(0.5, { duration: cross - c.cue('clamp-move').start })),
  );
  c.after('clamp-cross', () =>
    s.play(share.to(1, { duration: c.cue('clamp-reencode').end - cross })),
  );
  c.show('clamp-reencode', [there, facts[2]], { after: true });
  c.after('clamp-reencode', () =>
    s.play(indicate(levelTags[2], { color: COLOR.wrong, scale: 1.3 })),
  );
  const sum = place(mono('sum readout: 1.5 → 2.5', { color: COLOR.mark }), verdictBand, 'top');
  c.show('clamp-sum-result', sum, { after: true });
  const precise = place(
    note('an exact edit, and the encoder reads another value'),
    verdictBand,
    'bottom',
  );
  c.show('clamp-precise', precise);

  // Part 2. The gradient: the latent wiggles, with the residual live and then held.
  const latent = s.value(GRADIENT.z);
  /** 0 while the residual is computed again from the latent, and 1 while it is held. */
  const held = s.value(0);
  const tail = () => vec.scale(GRADIENT.column, latent.value);
  const output = () =>
    vec.add(GRADIENT.x, vec.scale(GRADIENT.column, (latent.value - GRADIENT.z) * held.value));
  const score = () => dotProduct(GRADIENT.readout, output());
  const feature = b.arrowOf([0, 0], tail, COLOR.first);
  const residual = b.segmentOf(tail, output, COLOR.residual, { width: 9 });
  const result = b.dotOf(output, COLOR.activation, 9);
  const first = b.ringOf(GRADIENT.x, 'faint', 15);
  const forward = tex('y = z\\,d + e', { size: 54 });
  const setup = mono('z = 1   d = [1, 0]   x = [1, 0.1]', { size: 34 });
  place(column([forward, setup], { gap: 'wide', align: 'center' }), formulaBand);
  forward.part('z\\,d').forEach((glyph) => glyph.color(COLOR.first));
  forward.part('e').forEach((glyph) => glyph.color(COLOR.residual));
  const reading = [
    note('score = [3, 100] · y'),
    decimal(() => score(), { digits: 2, size: 110, color: COLOR.mark }),
  ];
  place(column(reading, { gap: 'tight', align: 'center' }), factsBand);
  c.swap(
    'clamp-and-gradient-b2',
    [
      start,
      point,
      columnArrow,
      editArrow,
      ...levels,
      ...levelTags,
      here,
      there,
      reader,
      decoder,
      ...facts,
      sum,
      precise,
    ],
    [first, feature, residual, result, forward],
  );
  c.show('grad-setup', setup);
  c.show('grad-thirteen', reading, { after: true });
  const wiggle = () => {
    s.play(latent.to(1.45, { duration: 0.9 }));
    s.play(latent.to(0.55, { duration: 1.3 }));
    s.play(latent.to(GRADIENT.z, { duration: 0.9 }));
  };
  // Two lines of result: the residual live, and the residual held.
  const live = [
    label('live residual', { color: COLOR.residual }),
    label('slope 0', { color: COLOR.wrong }),
  ];
  const hold = [
    label('held residual', { color: COLOR.residual }),
    label('slope 3', { color: COLOR.mark }),
  ];
  place(
    column([row(live, { gap: 'wide' }), row(hold, { gap: 'wide' })], {
      gap: 'normal',
      align: 'center',
    }),
    verdictBand,
  );
  c.show('grad-live-wiggle', live[0]);
  c.on('grad-live-wiggle', wiggle, 0.4);
  c.show('gradient-live', live[1]);
  c.show('grad-stop', hold[0]);
  c.on('grad-stop', () => s.play(held.to(1, { duration: 0.01 })));
  c.on('grad-stop', wiggle, 0.5);
  c.show('gradient-stopped', hold[1], { after: true });
  const undo = place(note('a residual computed again undoes the edit'), formulaBand, 'bottom');
  c.swap('grad-undo', setup, undo);
  const hooks = place(
    note('more hooks: keep the paths that the method names'),
    formulaBand,
    'bottom',
  );
  c.swap('grad-multi', undo, hooks);
  c.keep(b.plane);
}
