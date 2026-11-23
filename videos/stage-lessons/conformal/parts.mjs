import { arrow, assertEqual, dot, dynamic, group, line, place, rect } from 'vizmatic/stage';
import { area, label, mono, note } from '../kit-narrated.mjs';
import {
  ACTUALS,
  DISPLAY_ORDER,
  PREDICTIONS,
  RESIDUALS,
  ROUTER,
  SCALES,
  TEST_OUTCOMES,
  TEST_PREDICTIONS,
  TEST_SCALES,
} from '../../films/conformal/fixtures.mjs';
import {
  classificationSet,
  correctedThreshold,
  exchangeabilityState,
  normalizedIntervalConstruction,
  routerState,
  validateModel,
} from '../../films/conformal/model.mjs';

export {
  ACTUALS,
  DISPLAY_ORDER,
  PREDICTIONS,
  RESIDUALS,
  ROUTER,
  SCALES,
  TEST_OUTCOMES,
  TEST_PREDICTIONS,
  TEST_SCALES,
  classificationSet,
  correctedThreshold,
  exchangeabilityState,
  normalizedIntervalConstruction,
  routerState,
};
validateModel();

// Cyan is a frozen prediction or model score. Green is an outcome or inclusion.
// Blue identifies short requests. Pink identifies long requests. Yellow marks
// the active threshold. Red marks a miss, wrong answer or rejected feedback.
export const COLOR = {
  prediction: 'cyan',
  outcome: 'green',
  short: 'blue',
  long: 'pink',
  threshold: 'yellow',
  failure: 'red',
  quiet: 'dim',
};
export const Q = correctedThreshold(RESIDUALS, 0.8);
export const CENTER = 40;
export const DEADLINE = 50;
assertEqual(CENTER - Q.threshold, 32, 'lower endpoint');
assertEqual(CENTER + Q.threshold, 48, 'upper endpoint');
assertEqual(Q.threshold * 2, 16, 'interval width');

export const [RAIL, RULER, FOOT] = area.rows([4, 3, 1], 'normal');
export const STATE = {
  intro: { center: CENTER, deadline: DEADLINE, radius: 0 },
  split: { fitted: 'frozen', calibration: 'independent', feedback: 'rejected' },
  scores: { order: DISPLAY_ORDER, radius: 0 },
  quantile: { order: RESIDUALS.map((_, i) => i), active: Q.index, radius: 0 },
  'index-contract': { sampleSizes: [9, 19], requiredRanks: [10, 19] },
  interval: { order: RESIDUALS.map((_, i) => i), radius: Infinity },
  exchangeability: { heldOut: 10, counted: 10, covered: 8 },
  'ties-bound': { picture: 'distinct future ranks', included: 8, excluded: 2 },
  coverage: { radius: Q.threshold, outcomes: [44, 48, 35, 52], covered: 4 },
  'classifier-score': { uniform: 1, cumulative: 0, crossing: 0, selected: 1 },
  'aps-inversion': { probabilities: [0.98, 0.01, 0.005, 0.005], direct: [] },
  'aps-crossing': { probabilities: [0.05, 0.55, 0.05, 0.35], direct: [1, 3], crossing: [1, 3, 0] },
  'subgroup-mix': { longShare: 0.5, aggregateVisible: true },
  'normalized-score': { normalized: 1, opening: 1, outcomes: 4 },
  shift: { longShare: 0.5, arrivals: 12, center: TEST_PREDICTIONS[3], radius: Q.threshold },
  'crc-loss': { lambda: 0.1, correctedResultVisible: false },
  'crc-threshold': { lambda: 1, fallbackLoss: 0 },
  'selected-error': { selected: 10, jointDenominator: 100, selectedDenominator: 10 },
  transfer: {
    center: CENTER,
    active: Q.index,
    changedC8: 9,
    radius: 9,
  },
  'fresh-deadline': { center: 52, radius: 8, lower: 44, upper: 60, outcome: 60, deadline: 55 },
};

const lerp = (a, b, t) => a + (b - a) * t;
export const number = (value, digits = 0) => (Number.isFinite(value) ? value.toFixed(digits) : '∞');

// The nine residual sticks retain their identity while their positions change.
// The empty tenth slot is the future position in the corrected rank argument.
export function scoreRail(s, { order = RESIDUALS.map((_, i) => i) } = {}) {
  const slots = RAIL.inset('tight').columns(10, 'tight');
  const baseline = RAIL.bottom - 90;
  const unit = (baseline - RAIL.top - 160) / Math.max(...RESIDUALS);
  const positions = RESIDUALS.map((_, i) => s.value(order.indexOf(i)));
  const reveal = s.value(1);
  const zero = s.value(0),
    active = s.value(-1);
  const extras = RESIDUALS.map((v) => s.value(v));
  const names = s.value(1);
  const x = (slot) => slots[0].cx + slot * (slots[1].cx - slots[0].cx);
  const frame = group(
    ...slots.map((slot) =>
      line([slot.left, RAIL.top + 135], [slot.left, baseline + 12], { stroke: 'faint', width: 2 }),
    ),
    line([slots[0].left, baseline], [slots.at(-1).right, baseline], { stroke: 'dim', width: 3 }),
    ...slots.map((slot, i) =>
      mono(String(i + 1), { color: 'dim', size: 34 }).moveTo([slot.cx, baseline + 78]),
    ),
  );
  const sticks = dynamic(() =>
    RESIDUALS.flatMap((_, i) => {
      const v = extras[i].value * (1 - zero.value);
      const height = Math.max(1, v * unit);
      const center = x(positions[i].value);
      const color = Math.round(active.value) === i ? 'yellow' : 'cyan';
      return [
        rect(38, height, { fill: color, stroke: null, radius: 3 }).moveTo([
          center,
          baseline - height / 2,
        ]),
        label('C' + (i + 1), { size: 34, color })
          .moveTo([center, baseline + 35])
          .opacity(names.value),
        ...(reveal.value > 0.01
          ? [
              mono(number(v), { size: 34, color })
                .moveTo([center, baseline - height - 30])
                .opacity(reveal.value * names.value),
            ]
          : []),
      ];
    }),
  );
  const future = place(note('new', { color: 'dim', size: 34 }), slots.at(-1), 'top');
  return {
    frame,
    sticks,
    future,
    positions,
    reveal,
    zero,
    active,
    extras,
    names,
    slots,
    baseline,
    unit,
    x,
  };
}

// A prediction interval, outcome and deadline share one ruler in milliseconds.
export function latencyRuler(
  s,
  {
    region = RULER,
    center = CENTER,
    radius = 0,
    deadline = DEADLINE,
    min = 20,
    max = 80,
    outcome = null,
  } = {},
) {
  const box = region.inset('wide');
  const y = box.cy;
  const x = (v) => box.left + ((v - min) / (max - min)) * box.width;
  const prediction = s.value(center),
    q = s.value(radius === Infinity ? max - min : radius);
  const infinite = s.value(radius === Infinity ? 1 : 0),
    seen = s.value(radius > 0 ? 1 : 0);
  const observed = s.value(outcome ?? center),
    observedOn = s.value(outcome === null ? 0 : 1);
  const outcomeLabelOn = s.value(1);
  const endpointOn = s.value(0),
    deadlineOn = s.value(1);
  const centerLabelOn = s.value(1);
  const ticks = Array.from({ length: 7 }, (_, i) => min + ((max - min) * i) / 6);
  const frame = group(
    line([box.left, y], [box.right, y], { stroke: 'dim', width: 3 }),
    ...ticks.flatMap((v) => [
      line([x(v), y + 12], [x(v), y + 23], { stroke: 'dim', width: 2 }),
      mono(number(v), { size: 34, color: 'dim' }).moveTo([x(v), y + 52]),
    ]),
    place(note('latency · ms'), region, 'bottom left'),
  );
  const interval = dynamic(() => {
    if (seen.value < 0.01) return [];
    const low = infinite.value > 0.5 ? min : Math.max(min, prediction.value - q.value);
    const high = infinite.value > 0.5 ? max : Math.min(max, prediction.value + q.value);
    const result = [
      rect(Math.max(1, x(high) - x(low)), 22, { fill: 'yellow', stroke: null, radius: 5 })
        .moveTo([x((low + high) / 2), y])
        .opacity(seen.value),
    ];
    if (infinite.value > 0.5) {
      result.push(
        arrow([box.left + 30, y], [box.left - 30, y], { stroke: 'yellow', width: 5, pad: 0 }),
        arrow([box.right - 30, y], [box.right + 30, y], { stroke: 'yellow', width: 5, pad: 0 }),
      );
    }
    if (endpointOn.value > 0.01) {
      result.push(
        ...[low, high].map((v) =>
          mono(number(v), { size: 34, color: 'yellow' })
            .moveTo([x(v), y - 44])
            .opacity(endpointOn.value),
        ),
      );
    }
    return result;
  });
  interval.zIndex(-1);
  const point = dynamic(() => [
    dot(13, 'cyan').moveTo([x(prediction.value), y]),
    mono('prediction ' + number(prediction.value), { size: 34, color: 'cyan' })
      .moveTo([x(prediction.value), y + 102])
      .opacity(centerLabelOn.value),
  ]);
  const limit = group(
    line([x(deadline), y - 60], [x(deadline), y + 8], { stroke: 'pink', width: 4 }),
    mono('deadline ' + deadline, { size: 34, color: 'pink' }).moveTo([x(deadline), y - 104]),
  );
  const actual = dynamic(() => {
    if (observedOn.value < 0.01) return [];
    const hit =
      infinite.value > 0.5 || Math.abs(observed.value - prediction.value) <= q.value + 1e-9;
    return [
      dot(15, hit ? 'green' : 'red').moveTo([x(observed.value), y]),
      mono('outcome ' + number(observed.value), { size: 34, color: hit ? 'green' : 'red' })
        .moveTo([x(observed.value), y - 145])
        .opacity(outcomeLabelOn.value),
    ];
  });
  return {
    frame,
    interval,
    point,
    limit,
    actual,
    prediction,
    q,
    infinite,
    seen,
    observed,
    observedOn,
    outcomeLabelOn,
    endpointOn,
    deadlineOn,
    centerLabelOn,
    x,
    y,
    box,
  };
}

export function testIntervals(s, { compareScales = false } = {}) {
  const [head, body, foot] = area.inset('normal').rows([0.85, 5, 0.55], 'normal');
  const [facts, plot] = body.columns([2, 5], 'wide');
  const rows = body.rows(4, 'normal');
  const inner = plot.inset('normal');
  const x = (v) => inner.left + ((v - 24) * inner.width) / 42;
  const opening = s.value(compareScales ? 1 : 0);
  const adapted = rows.map(() => s.value(0));
  const observations = s.value(compareScales ? 4 : 0);
  const tally = s.value(0);
  const fourth = s.value(TEST_OUTCOMES[3]);
  const pendingFourth = s.value(0);
  const scalesOn = s.value(0);
  const calibrated = rows.map((_, i) => normalizedIntervalConstruction(i, 1));
  const radius = (i) => opening.value * lerp(Q.threshold, calibrated[i].radius, adapted[i].value);
  const outcome = (i) => (i === 3 ? fourth.value : TEST_OUTCOMES[i]);
  const covered = (i) => Math.abs(outcome(i) - TEST_PREDICTIONS[i]) <= radius(i);
  const frame = group(
    place(note('Latency (ms)'), foot, 'left'),
    ...[25, 30, 35, 40, 45, 50, 55, 60, 65].map((ms) =>
      mono(String(ms), { size: 32, color: 'dim' }).moveTo([x(ms), foot.cy]),
    ),
  );
  const drawing = dynamic(() => {
    const marks = [];
    for (const [i, row] of rows.entries()) {
      const center = TEST_PREDICTIONS[i];
      const r = radius(i);
      const y = row.cy;
      const low = center - r;
      const high = center + r;
      const a = adapted[i].value;
      marks.push(
        label('T' + (i + 1) + ' · forecast ' + center, { size: 37, color: 'cyan' }).moveTo([
          facts.cx,
          y - (scalesOn.value ? 24 : 0),
        ]),
        line([inner.left, y], [inner.right, y], { stroke: 'faint', width: 3 }),
      );
      if (scalesOn.value) {
        const scale = TEST_SCALES[i];
        const caption =
          a === 1
            ? calibrated[i].radius / scale + ' × ' + scale + ' = ' + r + ' ms'
            : 'scale ' + scale + ' ms';
        marks.push(
          mono(caption, { size: 33, color: a === 1 ? 'yellow' : 'dim' }).moveTo([facts.cx, y + 27]),
        );
      }
      if (r > 0) {
        marks.push(
          rect(x(high) - x(low), 16, { fill: 'yellow', stroke: null }).moveTo([x(center), y]),
        );
        for (const ms of [low, high]) {
          marks.push(line([x(ms), y - 13], [x(ms), y + 13], { stroke: 'yellow', width: 4 }));
          if (opening.value === 1 && (a === 0 || a === 1))
            marks.push(mono(number(ms), { size: 32, color: 'yellow' }).moveTo([x(ms), y - 36]));
        }
      }
      marks.push(dot(11, 'cyan').moveTo([x(center), y]));
      if (observations.value >= i + 1) {
        const color = i === 3 && pendingFourth.value ? 'ink' : covered(i) ? 'green' : 'red';
        const ms = outcome(i);
        marks.push(
          dot(13, color).moveTo([x(ms), y]),
          mono(String(ms), { size: 33, color }).moveTo([x(ms), y + 37]),
        );
      }
    }
    if (tally.value) {
      const count = rows.filter((_, i) => i < observations.value && covered(i)).length;
      marks.push(
        place(mono(count + '/' + observations.value + ' covered', { color: 'ink' }), head, 'right'),
      );
    }
    return marks;
  });
  return {
    frame,
    drawing,
    head,
    opening,
    adapted,
    observations,
    tally,
    fourth,
    pendingFourth,
    scalesOn,
  };
}

export const CONFIDENT = [0.98, 0.01, 0.005, 0.005];
export const UNIFORM = [0.25, 0.25, 0.25, 0.25];
export const CALIBRATION_CLASS_ZERO = Array.from(
  { length: RESIDUALS.length },
  (_, i) => 0.55 + i * 0.05,
);
const LABEL_Q = {
  individual: correctedThreshold(
    CALIBRATION_CLASS_ZERO.map((p) => 1 - p),
    0.8,
  ).threshold,
  cumulative: correctedThreshold(CALIBRATION_CLASS_ZERO, 0.8).threshold,
};
assertEqual(Number(LABEL_Q.individual.toFixed(1)), 0.4, 'individual-score threshold');
assertEqual(Number(LABEL_Q.cumulative.toFixed(1)), 0.9, 'cumulative-score threshold');
assertEqual(
  CONFIDENT.reduce((a, b) => a + b),
  1,
  'confident probabilities',
);
assertEqual(
  UNIFORM.reduce((a, b) => a + b),
  1,
  'uniform probabilities',
);

// The individual rule tests each probability against one horizontal scale.
export function labelScores(s) {
  const [plot, tray] = area.inset('normal').rows([4, 1], 'wide');
  const [names, bars, values] = plot.columns([1.6, 5.2, 1.3], 'wide');
  const rows = bars.rows(4, 'wide');
  const uniform = s.value(0);
  const thresholdOn = s.value(0);
  const setOn = s.value(0);
  const scoreOn = s.value(0);
  const cutoff = 1 - LABEL_Q.individual;
  const x = (p) => bars.left + p * bars.width;
  const drawing = dynamic(() => {
    const probabilities = CONFIDENT.map((p, i) => lerp(p, UNIFORM[i], uniform.value));
    const chosen = classificationSet(probabilities, 'softmax', LABEL_Q.individual);
    const marks = rows.flatMap((r, i) => {
      const p = probabilities[i];
      const fill = setOn.value && chosen.includes(i) ? 'green' : 'cyan';
      return [
        label('Class ' + i, { size: 40 }).moveTo([names.cx, r.cy]),
        line([bars.left, r.cy], [bars.right, r.cy], { stroke: 'faint', width: 3 }),
        rect(Math.max(1, p * bars.width), 28, { fill, stroke: null }).moveTo([x(p / 2), r.cy]),
        mono('p = ' + Number(p.toFixed(3)), { size: 34, color: 'cyan' }).moveTo([
          bars.cx,
          r.cy - 45,
        ]),
        ...(thresholdOn.value
          ? [line([x(cutoff), r.cy - 23], [x(cutoff), r.cy + 23], { stroke: 'yellow', width: 5 })]
          : []),
        ...(scoreOn.value
          ? [mono(Number((1 - p).toFixed(3)).toString(), { size: 38 }).moveTo([values.cx, r.cy])]
          : []),
      ];
    });
    if (scoreOn.value) marks.push(note('1 − p').moveTo([values.cx, plot.top - 8]));
    if (thresholdOn.value)
      marks.push(
        mono('p ≥ ' + cutoff.toFixed(1), { size: 34, color: 'yellow' }).moveTo([
          x(cutoff),
          plot.bottom + 12,
        ]),
      );
    if (setOn.value)
      marks.push(
        place(
          label(
            chosen.length ? 'Candidate set   { ' + chosen.join(', ') + ' }' : 'Candidate set   ∅',
            { size: 47 },
          ),
          tray,
        ),
      );
    return marks;
  });
  return { drawing, uniform, thresholdOn, scoreOn, setOn };
}

export const GROUPS = { total: 1000, shortRate: 0.96, longRate: 0.54, initialLong: 0.25 };
assertEqual(GROUPS.total * 0.75 * GROUPS.shortRate, 720, 'covered short requests');
assertEqual(GROUPS.total * 0.25 * GROUPS.longRate, 135, 'covered long requests');
assertEqual((0.75 * GROUPS.shortRate + 0.25 * GROUPS.longRate) * 100, 85.5, 'initial aggregate');
assertEqual((0.5 * GROUPS.shortRate + 0.5 * GROUPS.longRate) * 100, 75, 'changed aggregate');

export function mixture(
  s,
  {
    region = area,
    share = GROUPS.initialLong,
    gap = 'wide',
    caption = 'covered requests / all arrivals',
  } = {},
) {
  const [rates, bar, meter, foot] = region.rows([2, 2, 3, 1], gap);
  const columns = rates.columns(2, 'wide');
  const long = s.value(share),
    countOn = s.value(0),
    meterOn = s.value(0);
  const frame = group(
    place(label('short · 96%', { color: 'blue' }), columns[0]),
    place(label('long · 54%', { color: 'pink' }), columns[1]),
    line([meter.left, meter.cy], [meter.right, meter.cy], { stroke: 'dim', width: 3 }),
    line(
      [meter.left + meter.width * 0.8, meter.cy - 35],
      [meter.left + meter.width * 0.8, meter.cy + 35],
      { stroke: 'yellow', width: 3 },
    ),
    mono('target 80%', { size: 34, color: 'yellow' }).moveTo([
      meter.left + meter.width * 0.8,
      meter.bottom + 32,
    ]),
    place(note(caption), foot, 'left'),
  );
  const drawing = dynamic(() => {
    const short = 1 - long.value;
    const aggregate = short * GROUPS.shortRate + long.value * GROUPS.longRate;
    const split = bar.left + bar.width * short;
    return [
      rect(bar.width * short, bar.height * 0.5, { fill: 'blue', stroke: null }).moveTo([
        bar.left + (bar.width * short) / 2,
        bar.cy,
      ]),
      rect(bar.width * long.value, bar.height * 0.5, { fill: 'pink', stroke: null }).moveTo([
        split + (bar.width * long.value) / 2,
        bar.cy,
      ]),
      mono(number(short * 100) + '%', { color: 'blue', size: 36 }).moveTo([
        bar.left + (bar.width * short) / 2,
        bar.bottom + 5,
      ]),
      mono(number(long.value * 100) + '%', { color: 'pink', size: 36 }).moveTo([
        split + (bar.width * long.value) / 2,
        bar.bottom + 5,
      ]),
      ...(meterOn.value > 0.5
        ? [
            rect(Math.max(1, meter.width * aggregate), 28, {
              fill: aggregate >= 0.8 ? 'green' : 'red',
              stroke: null,
            }).moveTo([meter.left + (meter.width * aggregate) / 2, meter.cy]),
          ]
        : []),
      ...(countOn.value > 0.5
        ? [
            mono(number(aggregate * 100, 1) + '%', {
              size: 52,
              color: aggregate >= 0.8 ? 'green' : 'red',
            }).moveTo([meter.cx, meter.top - 10]),
          ]
        : []),
    ];
  });
  return { frame, drawing, long, countOn, meterOn, rates, bar, meter, foot };
}

export function router(s, { lambda = 0 } = {}) {
  const [plot, stats] = area.rows([5, 2], 'loose');
  const slots = plot.inset('normal').columns(9, 'tight');
  const gate = s.value(lambda),
    resultOn = s.value(0),
    names = s.value(1);
  const criterionOn = s.value(1);
  const axis = plot.cy;
  const x = (v) =>
    slots[0].cx +
    ((v - ROUTER[0].score) / (ROUTER.at(-1).score - ROUTER[0].score)) *
      (slots.at(-1).cx - slots[0].cx);
  const frame = group(
    note('accepted: score > λ').moveTo([plot.left + 210, axis - 210]),
    note('rejected: score ≤ λ').moveTo([plot.left + 210, axis + 240]),
    line([plot.left, axis], [plot.right, axis], { stroke: 'dim', width: 3 }),
    ...ROUTER.flatMap((r, i) => [
      mono(number(r.score, 1), { size: 34, color: 'dim' }).moveTo([slots[i].cx, axis + 65]),
      label(r.id, { size: 34, color: 'dim' }).moveTo([slots[i].cx, plot.bottom - 12]),
    ]),
  );
  const drawing = dynamic(() =>
    ROUTER.flatMap((r, i) => {
      const accepted = r.score > gate.value + 1e-9;
      const y = accepted ? axis - 100 : axis + 140;
      return [
        dot(22, r.wrong ? 'red' : 'green').moveTo([slots[i].cx, y]),
        label(r.wrong ? 'wrong' : 'right', {
          size: 34,
          color: accepted ? (r.wrong ? 'red' : 'green') : 'dim',
        })
          .moveTo([slots[i].cx, y + (accepted ? -49 : 49)])
          .opacity(names.value),
      ];
    }),
  );
  const threshold = dynamic(() => [
    line(
      [Math.max(plot.left, Math.min(plot.right, x(gate.value))), axis - 55],
      [Math.max(plot.left, Math.min(plot.right, x(gate.value))), axis + 12],
      { stroke: 'yellow', width: 4 },
    ),
    mono(names.value > 0.5 ? 'λ = ' + number(gate.value, 1) : 'λ', {
      size: 38,
      color: 'yellow',
    }).moveTo([plot.cx, plot.top + 100]),
  ]);
  const readout = dynamic(() => {
    if (resultOn.value < 0.5) return [];
    const state = routerState(gate.value);
    const regions = stats.columns(3, 'wide');
    return [
      place(mono(state.mistakes + '/9', { color: 'red', size: 48 }), regions[0], 'top'),
      place(note('joint error'), regions[0], 'bottom'),
      place(
        mono(state.selective === null ? 'none' : state.mistakes + '/' + state.accepted.length, {
          color: 'red',
          size: 48,
        }),
        regions[1],
        'top',
      ),
      place(note('selected error'), regions[1], 'bottom'),
      ...(criterionOn.value > 0.5
        ? [
            place(
              mono(
                criterionOn.value > 1.5
                  ? String(state.mistakes)
                  : number(state.corrected * 100) + '%',
                {
                  color: state.passes ? 'green' : 'red',
                  size: 48,
                },
              ),
              regions[2],
              'top',
            ),
          ]
        : []),
      place(
        note(criterionOn.value > 1.5 ? 'fallback loss' : 'corrected criterion'),
        regions[2],
        'bottom',
      ),
    ];
  });
  return {
    frame,
    drawing,
    threshold,
    readout,
    gate,
    resultOn,
    criterionOn,
    names,
    plot,
    stats,
    slots,
  };
}
