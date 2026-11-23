// Scene `selection`: a rule chooses the support, and a silent slot is not a dead one.
//
// The picture: five candidates stand in the strip, and the plane adds their arrows tip to tail.
// TopK cuts the three smallest: their bars keep an outline, and the rebuilt point moves a little.
// A threshold line rises and cuts by height, so the count depends on the input. Then contexts
// pass: a tally under each slot counts when it fires, a rare context wakes a slot, and the
// residual casts a shadow on the columns that stayed silent.
import {
  arrow,
  assertEqual,
  boxOf,
  column,
  dot,
  dynamic,
  fade,
  place,
  rect,
  row,
  tex,
  text,
} from 'vizmatic/stage';
import { selectionHistory } from '../../../films/sparse-autoencoders/construction.mjs';
import { OBSERVATION_CONTEXTS, candidates } from '../../../films/sparse-autoencoders/fixtures.mjs';
import { topK } from '../../../films/sparse-autoencoders/model.mjs';
import { chip, heading, label, mono, note } from '../../kit-narrated.mjs';
import {
  COLOR,
  NUMBER_SIZE,
  SIDE,
  SLOT_COLOR,
  board,
  dictionary,
  strip,
  target,
  vec,
} from '../parts.mjs';

/** The order in which the plane adds the arrows: the two strongest candidates first. */
const ORDER = [1, 3, 2, 0, 4];
/** The thresholds of the scene: a low one, one between the fourth values of two contexts, and the one of the window. */
const THETA = { low: 0.2, between: 1.65, window: 2 };

export default function selection(s, c) {
  const b = board();
  const kept = topK(candidates, 2);
  assertEqual(kept, [0, 2.4, 0, 1.7, 0], 'TopK keeps the two largest candidates at full size');
  const history = selectionHistory({
    'selection-rare-context': { phase: 'after' },
    'selection-auxiliary-signal': { phase: 'after' },
  });
  assertEqual(history.counts, [0, 3, 0, 0, 1], 'the times that each slot fires in the window');
  const [first, second] = OBSERVATION_CONTEXTS.map((context) => context.pre);
  assertEqual(
    [first, second].map((pre) => pre.filter((value) => value > THETA.between).length),
    [2, 1],
    'one threshold keeps two entries of one input and one entry of another',
  );

  const [stripBand, lower] = SIDE.rows([5, 4], 'normal');
  const [tallyBand, ruleBand, factBand, noteBand] = lower.rows([2, 2, 2, 2], 'tight');
  // One live rule supplies the bar fill, vector sum, and active count.
  const mode = s.value(0);
  let z;
  const support = () => {
    const values = z.z.map((v) => v.value);
    if (mode.value < 0.5) return values.map((v) => v > 0);
    if (mode.value < 1.5) return topK(values, 2).map((v) => v > 0);
    if (mode.value < 2.5) return values.map((v) => v > z.threshold.value);
    return values.map(() => false);
  };
  z = strip(s, stripBand, {
    max: 3.2,
    colors: SLOT_COLOR,
    start: candidates,
    digits: 2,
    numbersOnTop: true,
    readKeep: (i) => (support()[i] ? 1 : 0),
  });
  const value = (i) => (support()[i] ? Math.max(0, z.z[i].value) : 0);

  // The plane: the arrows of the kept candidates, tip to tail, and the point that they rebuild.
  const startOf = (k) =>
    ORDER.slice(0, k).reduce((sum, i) => vec.add(sum, vec.scale(dictionary[i], value(i))), [0, 0]);
  const chain = ORDER.map((i, k) =>
    b.arrowOf(
      () => startOf(k),
      () => startOf(k + 1),
      SLOT_COLOR[i],
      { width: 7 },
    ),
  );
  const rebuilt = b.ringOf(() => startOf(ORDER.length), COLOR.activation, 22);
  s.add(heading(c.title), chain, rebuilt, z.rail, z.glyphs, z.bars, z.numbers);
  c.take(b.plane);

  // Beat 0. TopK: the three smallest candidates leave, and the two largest keep their size.
  const active = dynamic(() => {
    const count = dictionary.filter((_, i) => value(i) > 1e-6).length;
    return text(`active: ${count} of ${dictionary.length}`, { size: 40, color: COLOR.mark }).at(
      factBand.cx,
      factBand.cy,
    );
  });
  const rule = place(label('Keep up to 2 positive coefficients', { size: 36 }), ruleBand);
  const fullSize = place(note('kept at full size'), noteBand);
  c.show('sel-topk', rule);
  const slotIds = dictionary.map((_, i) => mono(String(i + 1), { size: 30 }).at(z.x(i), tallyBand.cy));
  const question = place(label('Which slots will write?', { color: COLOR.mark }), noteBand);
  c.show('sel-question', [slotIds, question]);
  c.hide('selection-b1-1', question);
  c.show('selection-b1-1', active, { after: true });
  c.after('selection-b1-1', () => s.play(mode.to(1, { duration: 0.01 })));
  c.show('sel-original', fullSize);
  const underCap = place(note('1 positive coefficient, 2 places available'), noteBand);
  // A candidate that is not positive is not kept, so the support can be under the cap.
  c.hide('sel-fewer', fullSize);
  c.show('sel-cap', underCap);
  c.on(
    'sel-fewer',
    () => s.play(...z.z.map((v, i) => v.to(i === 1 ? candidates[i] : -0.05, { duration: 1 }))),
    0.4,
  );

  // Beat 1. A threshold: all five candidates come back, and a line cuts them by height.
  const thresholdRule = place(
    row(
      [
        label('threshold'),
        dynamic(() =>
          text(`θ = ${z.threshold.value.toFixed(2)}`, {
            size: 40,
            font: 'mono',
            color: COLOR.mark,
          }),
        ),
      ],
      { gap: 'normal' },
    ),
    ruleBand,
  );
  c.onBeat(2, () =>
    s.play(
      mode.to(2, { duration: 0.01 }),
      ...first.map((pre, i) => z.z[i].to(pre, { duration: 0.5 })),
      z.threshold.to(THETA.low, { duration: 0.5 }),
    ),
  );
  c.swap('sel-threshold', [rule, underCap, ...slotIds], [thresholdRule, z.cut]);
  c.on('selection-b2-1', () => {
    s.play(z.threshold.to(0.45, { duration: 0.7 }));
    s.play(z.threshold.to(THETA.between, { duration: 1.3 }));
  });
  c.on('sel-varies', () => s.play(...second.map((pre, i) => z.z[i].to(pre, { duration: 0.8 }))));
  const jump = place(
    tex('\\text{JumpReLU:}\\quad z = u \\cdot [\\,u > \\theta\\,]', { size: 40 }),
    noteBand,
  );
  const estimator = place(note('a step has no slope: θ needs its own estimator'), noteBand);
  c.show('sel-jump', jump);
  c.swap('sel-estimator', jump, estimator);

  // Beat 2. A window of contexts: a tally under each slot counts the times that it fires.
  const counts = dictionary.map(() => s.value(0));
  const tally = dynamic(() =>
    counts.flatMap((count, i) =>
      Array.from({ length: Math.round(count.value) }, (_, k) =>
        dot(9, SLOT_COLOR[i]).at(
          z.x(i) + (k - (Math.round(count.value) - 1) / 2) * 26,
          tallyBand.top + 18,
        ),
      ),
    ),
  );
  const context = s.value(0);
  const sentence = dynamic(() =>
    text(`“${OBSERVATION_CONTEXTS[Math.round(context.value)].text}”`, { size: 40 }).at(
      ruleBand.cx,
      ruleBand.cy,
    ),
  );
  const columns = dictionary.map((d, i) =>
    b.arrowOf([0, 0], d, () => (counts[i].value > 0.5 ? SLOT_COLOR[i] : 'faint'), { width: 6 }),
  );
  const feed = (index) => {
    const pre = OBSERVATION_CONTEXTS[index].pre;
    s.play(
      context.to(index, { duration: 0.01 }),
      ...pre.map((u, i) => z.z[i].to(u, { duration: 0.35 })),
    );
    const fired = pre.findIndex((u) => u > THETA.window);
    s.play(counts[fired].to(counts[fired].value + 1, { duration: 0.2 }));
  };
  c.swap(3, [thresholdRule, estimator, active, ...chain, rebuilt], [...columns, sentence]);
  c.onBeat(3, () => s.play(z.threshold.to(THETA.window, { duration: 0.35 })));
  const tallyName = place(note('times that a slot fired in this window'), tallyBand, 'bottom');
  c.show('selection-b3-1', [tally, tallyName]);
  c.on('selection-b3-1', () => {
    feed(0);
    s.wait(0.35);
    feed(1);
    s.wait(0.35);
    feed(2);
  });
  const silent = place(note('silent so far: slots 1, 3, 4 and 5'), noteBand);
  c.show('selection-b3-1', silent, { after: true, lead: -1.2 });
  const awake = place(
    label('Slot 5 fires for the windmill sentence', { size: 35, color: COLOR.mark }),
    noteBand,
  );
  c.on('selection-rare-context', () => feed(3), 0.8);
  c.swap('selection-rare-context', silent, awake, { lead: -1.6 });

  // The auxiliary signal: the residual casts a shadow on each column that stayed silent.
  const residual = b.arrowOf([0, 0], history.residual, COLOR.residual, { width: 8 });
  const quiet = history.counts.map((count, i) => (count === 0 ? i : -1)).filter((i) => i >= 0);
  const shadows = quiet
    .filter((i) => history.signals[i] > 0)
    .map((i) => b.shadowOf(history.residual, dictionary[i], COLOR.mark, 9));
  const signal = dictionary.map(() => s.value(0));
  const auxBars = dynamic(() =>
    signal.flatMap((share, i) => {
      const height = history.signals[i] * share.value * z.perUnit;
      if (height < 1) return [];
      return [
        rect(z.barWidth, height, { fill: null, stroke: COLOR.mark, width: 4, radius: 6 }).at(
          z.x(i),
          z.base - height / 2,
        ),
      ];
    }),
  );
  const auxNumbers = quiet
    .filter((i) => history.signals[i] > 0)
    .map((i) =>
      text(history.signals[i].toFixed(1), {
        size: NUMBER_SIZE,
        font: 'mono',
        color: COLOR.mark,
      }).at(z.x(i), z.base - history.signals[i] * z.perUnit - 26),
    );
  const residualTag = b.tagOf(history.residual, 'residual', COLOR.residual, [-10, 44], {
    font: undefined,
    size: 36,
  });
  const aux = place(label('a signal for the silent slots', { color: COLOR.mark }), ruleBand);
  c.swap(
    'selection-auxiliary-signal',
    [sentence, awake],
    [residual, residualTag, ...shadows, auxBars, aux],
  );
  c.on(
    'selection-auxiliary-signal',
    () =>
      s.play(
        mode.to(3, { duration: 0.01 }),
        ...signal.map((share) => share.to(1, { duration: 0.9 })),
      ),
    0.5,
  );
  c.show('selection-auxiliary-signal', auxNumbers, { after: true });
  // A drop line of the residual passes over a number of the axes, so the numbers leave while it shows.
  c.on('selection-auxiliary-signal', () => s.play(fade(b.plane.numbers, 0, { duration: 0.3 })));
  c.on('sel-resample', () => s.play(fade(b.plane.numbers, 1, { duration: 0.3 })), 0.5);
  const auxk = place(label('AuxK: silent slots rebuild the residual', { size: 36 }), factBand);
  c.show('sel-auxk', auxk);
  const settings = [
    chip('window: 10 million tokens', { color: COLOR.other, stroke: COLOR.other }),
    chip('weight: 1/32', { color: COLOR.other, stroke: COLOR.other }),
  ];
  place(row(settings, { gap: 'normal' }), noteBand);
  c.show('sel-window', settings[0]);
  c.show('sel-weight', settings[1]);
  // Resampling points a silent column at a sampled high-loss input.
  const aim = s.value(0);
  const sampledInput = target;
  const unitInput = vec.scale(sampledInput, 1 / vec.length(sampledInput));
  const resetDirection = () => {
    const angle = Math.atan2(unitInput[1], unitInput[0]) * aim.value;
    return [Math.cos(angle), Math.sin(angle)];
  };
  const reset = b.arrowOf([0, 0], resetDirection, COLOR.first, { width: 6 });
  const glyphBox = boxOf(z.glyphs[0]);
  const resetGlyph = dynamic(() => {
    const d = resetDirection(),
      reach = glyphBox.width / 2;
    return arrow(
      [glyphBox.cx - d[0] * reach, glyphBox.cy + d[1] * reach],
      [glyphBox.cx + d[0] * reach, glyphBox.cy - d[1] * reach],
      { stroke: COLOR.first, width: 5, tip: 16 },
    );
  });
  const samplePoint = b.dotOf(sampledInput, COLOR.activation);
  const sampleTag = b.tagOf(sampledInput, 'sampled high-loss input', COLOR.activation, [0, -48], {
    size: 34,
    font: undefined,
  });
  const aimLine = b.segmentOf(resetDirection, sampledInput, 'dim', { dash: [10, 9], width: 3 });
  const resample = place(label('resampling: reset a silent column'), ruleBand);
  const spike = place(label('a loss spike can follow', { color: COLOR.wrong }), factBand);
  c.swap(
    'sel-resample',
    [aux, columns[0], z.glyphs[0], residual, residualTag, ...shadows, auxBars, ...auxNumbers],
    [resample, reset, resetGlyph, samplePoint, sampleTag, aimLine],
  );
  c.hide('sel-resample', [auxk, ...settings, z.cut]);
  c.on('sel-resample', () => s.play(aim.to(1, { duration: 1.8 })), 0.6);
  c.show('sel-spike', spike);
  c.keep(b.plane);
}
