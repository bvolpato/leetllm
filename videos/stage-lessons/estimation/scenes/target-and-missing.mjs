// Scene `target-and-missing`: what is estimated, and what missing labels do to the estimate.
//
// The picture: the covered queue, the tray of 100 labels, and the estimate at 16%. Four names land
// on their things. Then 20 labels of the tray lose their answer. As the unknown ones turn pink one
// by one, the estimate slides from 16% to 36% and leaves a bar of bounds. The fraction of the
// resolved labels alone stays at 20%.
import {
  assertEqual,
  beside,
  circle,
  column,
  dot,
  dynamic,
  grid,
  indicate,
  line,
  linear,
  place,
  row,
  tex,
  text,
} from 'vizmatic/stage';
import { missingLabelBounds, wilson } from '../../../films/estimation/model.mjs';
import { chip, chipRow, heading, label, mono, note } from '../../kit-narrated.mjs';
import {
  COLOR,
  HEAD_LEFT,
  LEFT_PANEL,
  POINT,
  READOUT,
  RIGHT_PANEL,
  SAMPLE,
  TRAY_HEAD,
  TRAY_GRID,
  labelOf,
  mark,
  percent,
  radiusOf,
  rateAxis,
  slots,
  weekQueue,
} from '../parts.mjs';

/** The labels of the tray that do not resolve, and the labels that are changed in the last picture. */
const UNRESOLVED = 20,
  CHANGED = 4;

export default function targetAndMissing(s, c) {
  const axis = rateAxis(s);
  const selected = SAMPLE.length,
    specialists = SAMPLE.filter((message) => message.specialist).length;
  const bounds = missingLabelBounds(selected, selected - UNRESOLVED, specialists);
  const rate = specialists / selected;

  // The labels that do not resolve: the last 20 regular ones. The changed ones: the first 4 pink ones.
  const regular = SAMPLE.map((message, index) => (message.specialist ? -1 : index)).filter(
    (index) => index >= 0,
  );
  const unknownRank = new Map(regular.slice(-UNRESOLVED).map((index, rank) => [index, rank]));
  const changedSet = new Set(
    SAMPLE.map((message, index) => (message.specialist ? index : -1))
      .filter((index) => index >= 0)
      .slice(0, CHANGED),
  );

  // The values of the scene.
  const lost = s.value(0); // the labels that lost their answer
  const flipped = s.value(0); // the unknown labels that count as specialist cases now
  const completed = s.value(0); // retain the completed bounds when the labels return
  const dropped = s.value(0); // the unknown labels are left out
  const changed = s.value(0); // the number of labels changed to match a prediction
  const swept = s.value(0); // the counting sweep follows the numerator and denominator
  const review = s.value(0); // blind answers stay covered until the comparison
  const flippedCount = () => Math.max(0, Math.min(UNRESOLVED, Math.floor(flipped.value + 1e-6)));
  const corruptCount = () => Math.floor(changed.value + 1e-6);
  const changedRank = new Map([...changedSet].map((index, rank) => [index, rank]));

  const places = slots(selected, 10),
    radius = radiusOf(10);
  const tray = dynamic(() =>
    SAMPLE.flatMap((message, index) => {
      const rank = unknownRank.get(index);
      if (rank !== undefined && rank < lost.value) {
        if (rank < flippedCount()) return [mark('specialist', radius).at(places[index])];
        return [mark('unknown', radius, 1 - 0.8 * dropped.value).at(places[index])];
      }
      if (changedSet.has(index) && changedRank.get(index) < corruptCount())
        return [
          mark('regular', radius).at(places[index]),
          circle(radius + 4, { stroke: COLOR.failure, width: 4, fill: null }).at(places[index]),
        ];
      return [mark(labelOf(message), radius).at(places[index])];
    }),
  );
  const trayName = place(label('100 selected', { color: COLOR.sample }), TRAY_HEAD);

  // The queue, covered, with its name.
  // The queue leaves a line under it for the name of what we want to know about it.
  const [queueRoom, queueFoot] = LEFT_PANEL.rows([5, 1], 'tight');
  const queue = weekQueue(s, { region: queueRoom });
  const queueName = label('the queue');
  const population = chip('population', { color: COLOR.mark });
  place(row([queueName, population], { gap: 'tight' }), HEAD_LEFT, 'left');

  // The estimate on the axis: it follows the unknown labels that count as specialist cases.
  const awaitingBounds = () => lost.value > 0 && completed.value < 0.5;
  const now = () => (specialists - corruptCount() + flippedCount()) / selected;
  const estimate = dynamic(() => {
    if (awaitingBounds()) return [];
    const at = axis.x(now());
    const color = corruptCount() ? COLOR.failure : COLOR.sample;
    return [
      line([at, axis.rowY(0)], [at, axis.y], { stroke: color, width: 3, opacity: 0.5 }),
      dot(POINT, color).at(at, axis.rowY(0)),
    ];
  });
  const range = axis.bar(
    () =>
      flippedCount() > 0 || completed.value > 0.5
        ? {
            low: rate,
            high: rate + (completed.value > 0.5 ? UNRESOLVED : flippedCount()) / selected,
          }
        : null,
    { color: COLOR.mark },
  );
  const estimateName = beside(
    row([chip('estimate', { color: COLOR.mark }), mono(percent(rate), { color: COLOR.sample })], {
      gap: 'tight',
    }),
    [axis.x(rate), axis.rowY(0)],
    'left',
    'wide',
  );
  const estimand = place(
    row(
      [
        chip('estimand', { color: COLOR.mark }),
        label('its specialist share: ?', { color: COLOR.specialist }),
      ],
      { gap: 'tight' },
    ),
    queueFoot,
    'left',
  );

  // The right panel, beat by beat: the estimator, the two fractions, and the report.
  const estimator = chip('estimator', { color: COLOR.mark });
  const rule = tex('\\frac{\\text{count}}{\\text{sample size}}', { size: 56 });
  const flagged = tex('\\frac{\\text{abusive, of the flagged}}{\\text{flagged signups}}', {
    size: 44,
  });
  const precision = label('review precision', { color: COLOR.accepted });
  const others = note('recall and false-positive rate: not this');
  place(
    column([estimator, [rule, flagged], precision], { gap: 'normal', align: 'center' }),
    RIGHT_PANEL.inset('none', 'normal'),
    'top',
  );
  place(others, RIGHT_PANEL.inset('none', 'normal'), 'bottom');

  const resolvedCount = mono(`${specialists} / ${selected - UNRESOLVED}`, {
      color: COLOR.sample,
    }),
    resolvedRate = mono(`= ${percent(bounds.resolvedRate)}`, { color: COLOR.sample });
  const allCount = mono('00 / 100'),
    allRange = mono(`${percent(bounds.low)} to ${percent(bounds.high)}`, { color: COLOR.mark });
  const names = [note('resolved cases only'), note('all selected cases')];
  place(
    grid([names[0], null, resolvedCount, resolvedRate, names[1], null, allCount, allRange], {
      columns: 2,
      gap: ['normal', 'tight'],
    }),
    RIGHT_PANEL.inset('none', 'normal'),
    'top left',
  );
  const liveAll = dynamic(() =>
    text(`${awaitingBounds() ? '?' : specialists + flippedCount()} / ${selected}`, {
      font: 'mono',
      size: 40,
    }).at(allCount.get('x'), allCount.get('y')),
  );
  const resolvedPoint = dynamic(() =>
    dot(POINT - 2, dropped.value > 0.5 ? COLOR.failure : COLOR.sample).at(
      axis.x(bounds.resolvedRate),
      axis.rowY(1),
    ),
  );
  const resolvedNameSlot = beside(
    note('resolved cases only'),
    [axis.x(bounds.resolvedRate), axis.rowY(1)],
    'right',
    'normal',
  );
  const resolvedOffset = resolvedNameSlot.get('x') - axis.x(bounds.resolvedRate);
  const resolvedName = dynamic(() =>
    note('resolved cases only').at(
      axis.x(bounds.resolvedRate) + resolvedOffset,
      resolvedNameSlot.get('y'),
    ),
  );
  const ends = [bounds.low, bounds.high].map((end) =>
    dynamic(() =>
      text(percent(end), { size: 40, font: 'mono', color: COLOR.mark }).at(
        axis.x(end),
        axis.rowY(0) - 48,
      ),
    ),
  );
  // Sampling uncertainty has its own row. Its endpoints use the two extreme completed counts.
  const lowest = wilson(specialists, selected).low,
    highest = wilson(specialists + UNRESOLVED, selected).high;
  const extra = [
    axis.bar(() => ({ low: lowest, high: highest }), { row: 2, weight: 6 }),
    place(
      note('sampling uncertainty', { color: COLOR.accepted }),
      LEFT_PANEL.inset('none', 'normal'),
      'bottom left',
    ),
    ...[lowest, highest].map((end) =>
      dynamic(() =>
        axis.inside(end)
          ? text(percent(end, 1), { size: 34, font: 'mono', color: COLOR.accepted }).at(
              axis.x(end),
              axis.rowY(2) + 35,
            )
          : [],
      ),
    ),
  ];

  const counts = place(
    grid(
      [
        mono(String(selected)),
        label('selected'),
        mono(String(selected - UNRESOLVED), { color: COLOR.sample }),
        label('resolved'),
        mono(String(UNRESOLVED), { color: 'dim' }),
        label('unresolved'),
      ],
      { columns: 2, gap: 'tight', align: ['right', 'left'] },
    ),
    READOUT,
    'top',
  );
  const rubric = place(
    chipRow(['one fixed rubric', 'blind to the model'], { maxWidth: RIGHT_PANEL.width }),
    RIGHT_PANEL.inset('none', 'normal'),
    'bottom left',
  );
  const reviewedName = place(label('100 reviewed', { color: COLOR.sample }), TRAY_HEAD);
  const reviewRoom = RIGHT_PANEL.inset('none', 'normal').rows([5, 1], 'normal');
  const table = reviewRoom[0].rows(5, 'tight');
  const headings = ['same cases', 'blind A', 'blind B'];
  const reviewHeads = headings.map((name, index) =>
    place(note(name), table[0].columns(3, 'normal')[index]),
  );
  const reviewIDs = SAMPLE.slice(0, 4).map((message, index) =>
    place(mono(message.id, { size: 34 }), table[index + 1].columns(3, 'normal')[0]),
  );
  const reviews = dynamic(() =>
    SAMPLE.slice(0, 4).flatMap((message, index) => {
      const first = table[index + 1].columns(3, 'normal')[1];
      const second = table[index + 1].columns(3, 'normal')[2];
      const answerA = labelOf(message);
      const answerB = index === 2 ? 'specialist' : answerA;
      return [
        mark(review.value > 0.5 ? answerA : 'unknown', 16).at(first.cx, first.cy),
        mark(review.value > 0.5 ? answerB : 'unknown', 16).at(second.cx, second.cy),
        ...(index === 2 && review.value > 0.5
          ? [circle(23, { stroke: COLOR.failure, width: 3, fill: null }).at(second.cx, second.cy)]
          : []),
      ];
    }),
  );
  assertEqual(4 - 1, 3, 'three of four blind answers agree');
  const agreement = place(note('3 of 4 agree'), reviewRoom[1], 'left');
  const biased = () => wilson(specialists - corruptCount(), selected);
  const narrow = axis.bar(() => (corruptCount() ? biased() : null), { color: COLOR.failure });
  const narrowName = beside(
    note('changed labels: the wrong center', { color: COLOR.failure }),
    [axis.x(wilson(specialists - CHANGED, selected).high), axis.rowY(1)],
    'right',
    'wide',
  );
  const corruptSlot = place(mono('16 / 100 = 16%', { size: 44 }), RIGHT_PANEL, 'top');
  const corruptReadout = dynamic(() =>
    text(`${specialists - corruptCount()} / ${selected} = ${percent(now())}`, {
      size: 44,
      font: 'mono',
      color: corruptCount() ? COLOR.failure : COLOR.sample,
    }).at(corruptSlot.get('x'), corruptSlot.get('y')),
  );
  const sweep = dynamic(() => {
    const index = Math.min(selected - 1, Math.floor(swept.value));
    if (swept.value <= 0 || swept.value >= selected) return [];
    return circle(radius + 4, { stroke: COLOR.mark, width: 4, fill: null }).at(places[index]);
  });
  const sweepSlot = place(mono('16 / 100 = 16%', { size: 42 }), READOUT, 'top');
  const sweepReadout = dynamic(() => {
    const n = Math.floor(swept.value);
    const k = SAMPLE.slice(0, n).filter((message) => message.specialist).length;
    return text(`${k} / ${n}${n ? ' = ' + percent(k / n) : ''}`, {
      size: 42,
      font: 'mono',
      color: COLOR.sample,
    }).at(sweepSlot.get('x'), sweepSlot.get('y'));
  });

  // The first picture: the queue, the tray, and the estimate on the axis.
  s.add(heading(c.title), queue.cells, queueName, tray, trayName, range, estimate);
  c.take([axis.rule, axis.title]);
  s.add(axis.threshold);
  c.keep([axis.rule]);

  // Four names, each on its thing.
  c.show('name-population', population);
  c.show('name-estimand', estimand);
  c.show('name-estimator', [estimator, rule, sweep, sweepReadout]);
  c.on('name-estimator', () =>
    s.play(
      swept.to(selected, {
        duration: c.cue('name-estimator').end - c.cue('name-estimator').start,
        ease: linear,
      }),
    ),
  );
  c.show('name-estimate', estimateName);
  c.swap('target-flagged-comparison', rule, flagged);
  c.show('precision', precision);
  c.show('not-recall', others);

  // 20 labels do not resolve.
  c.hide('incomplete', [
    population,
    estimand,
    estimator,
    flagged,
    precision,
    others,
    estimateName,
    sweep,
    sweepReadout,
  ]);
  c.on('resolved', () => s.play(lost.to(UNRESOLVED, { duration: 1, ease: linear })));
  c.show('resolved', [names[0], resolvedCount], { after: true });
  c.show('unresolved', counts);
  c.show('resolved-rate', [resolvedRate, resolvedPoint, resolvedName], { after: true });
  // The unknown labels count as specialist cases, one by one: the estimate slides to its upper bound.
  c.show('possible-range', [names[1], liveAll]);
  c.after('possible-range', () => {
    completed.set(1);
    const available = c.cue('additional').start - c.cue('possible-range').end;
    const duration = Math.min(2, available - 0.2);
    assertEqual(duration > 0, true, 'the bounds move finishes before sampling uncertainty');
    s.play(flipped.to(UNRESOLVED, { duration: duration * 0.6, ease: linear }));
    s.wait(duration * 0.15);
    s.play(flipped.to(0, { duration: duration * 0.25, ease: linear }));
  });
  c.show('possible-range', [allRange, ...ends], { after: true });
  c.show('additional', extra, { after: true });
  c.on('additional', () => s.play(axis.max.to(0.5, { duration: 1 })));

  // The report, and what an interval cannot repair.
  c.on('difficult', () => s.play(dropped.to(1, { duration: 0.6 })));
  c.hide('rubric', [
    counts,
    names[0],
    names[1],
    resolvedCount,
    resolvedRate,
    resolvedPoint,
    resolvedName,
    liveAll,
    allRange,
    ...ends,
    ...extra,
  ]);
  c.on('rubric', () => {
    lost.set(0);
    flipped.set(0);
    completed.set(0);
    dropped.set(0);
    s.play(axis.max.to(0.4, { duration: 1 }));
  });
  c.swap('rubric', trayName, reviewedName);
  c.show('rubric', rubric);
  c.hide('blind-reviews', rubric);
  c.show('blind-reviews', [...reviewHeads, ...reviewIDs, reviews], { lead: -0.3 });
  c.after('reviewer-agreement', () => s.play(review.to(1, { duration: 0.3 })));
  c.show('reviewer-agreement', agreement, { after: true });
  c.hide('narrower', [...reviewHeads, ...reviewIDs, reviews, agreement]);
  c.show('narrower', [narrow, corruptReadout], { lead: -0.3 });
  c.show('corrupt-labels', narrowName, { lead: -0.3 });
  c.on('corrupt-labels', () => s.play(changed.to(CHANGED, { duration: 0.8, ease: linear })));
  c.on('report-counts', () =>
    s.play(...counts.nodes.map((node) => indicate(node, { color: COLOR.mark }))),
  );
}
