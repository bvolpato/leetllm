import assert from 'node:assert/strict';
import {
  draw,
  dynamic,
  fadeIn,
  indicate,
  line,
  linear,
  Node,
  rect,
  smoother,
  write,
} from 'vizmatic/stage';

/** Illustrative memory units, with the same payload and budget through each packing attempt. */
export function requestBudgetState(tailLeft = 1, squeeze = 1) {
  const allocated = [540, 580, 480];
  const tailPerRequest = 24;
  const budget = 960;
  const widths = allocated.map((width) => (width - tailPerRequest * (1 - tailLeft)) * squeeze);
  const total = widths.reduce((sum, width) => sum + width, 0);
  return { widths, total, budget, recovered: 1600 - total, over: Math.max(0, total - budget) };
}

export function buildBudgetRequests(
  stage,
  narration,
  shrink,
  { T, M, S, place, brief, fadeOut, bar, headingOf, arrive, clearFirst, handoff },
) {
  const heading1 = headingOf(narration.title('shrink')),
    heading2 = headingOf('Several GPUs'),
    heading3 = headingOf('Keep two names apart');
  shrink.at(0.15, () =>
    stage.play(write(heading1), {
      duration: 1,
    }),
  );
  // Three full requests end to end on one memory axis, so their total faces one budget. The sizes
  // are made up. The levers are tried on this bar: paging finds nothing, smaller blocks trim a
  // sliver, and the scheduler swaps the order while the total stays over.
  const RQ_X = -800,
    RQ_Y = -200,
    RQ_H = 100,
    RQ_LEN = [540, 580, 480],
    RQ_CELL = 120,
    RQ_TAIL = 24,
    RQ_COLOR = ['blue', 'orange', 'green'];
  assert.equal(
    RQ_LEN.reduce((a, b) => a + b),
    1600,
  );
  const BUDGET_X = 160;
  const squeeze = stage.value(1),
    tailLeft = stage.value(1),
    order = stage.value(0),
    scan = stage.value(0);
  const FIRST_ORDER = [0, 1, 2],
    NEXT_ORDER = [2, 0, 1];
  const state = () => requestBudgetState(tailLeft.value, squeeze.value);
  const widthOf = (i) => state().widths[i];
  const leftIn = (sequence, i) =>
    sequence.slice(0, sequence.indexOf(i)).reduce((sum2, j) => sum2 + widthOf(j), 0);
  const leftOf = (i) =>
    leftIn(FIRST_ORDER, i) + (leftIn(NEXT_ORDER, i) - leftIn(FIRST_ORDER, i)) * order.value;
  const totalNow = () => state().total;
  const overBy = () => RQ_X + totalNow() - BUDGET_X;
  const requestBars = RQ_LEN.map((_, i) =>
    dynamic(() => {
      // The third request lifts over the others on its way to the front.
      const y = RQ_Y - (i === 2 ? 80 * Math.sin(Math.PI * order.value) : 0),
        x = RQ_X + leftOf(i),
        width = widthOf(i),
        tail = RQ_TAIL * tailLeft.value * squeeze.value,
        full = width - tail - 3,
        cell = RQ_CELL * squeeze.value,
        node = new Node();
      node.add(bar(x, y, full, RQ_H, RQ_COLOR[i]));
      for (let step = cell; step < full - 2; step += cell)
        if (step > 250)
          node.add(
            line([x + step, y - RQ_H / 2], [x + step, y + RQ_H / 2], {
              stroke: 'bg',
              width: 2.5,
            }),
          );
      if (tail > 1)
        node.add(
          rect(tail, RQ_H, {
            radius: 4,
            fill: 'bg',
            stroke: RQ_COLOR[i],
            width: 2.5,
          }).at(x + full + tail / 2, y),
        );
      return node;
    }),
  );
  // The labels draw above the over-budget band, which would otherwise tint them.
  const requestLabels = RQ_LEN.map((_, i) =>
    dynamic(() => {
      const x = RQ_X + leftOf(i) + 16,
        label = place(
          M(`request ${i + 1}`, {
            size: 40,
            color: 'bg',
          }),
          x,
          RQ_Y - (i === 2 ? 80 * Math.sin(Math.PI * order.value) : 0),
        );
      const lineGap = Math.max(x - BUDGET_X, BUDGET_X - x - label.width) - 8;
      return label.opacity(
        Math.max(0, 1 - 40 * Math.sin(Math.PI * order.value)) *
          Math.min(1, Math.max(0, lineGap / 8)),
      );
    }).zIndex(2),
  );
  const overBand = dynamic(() =>
    overBy() < 1
      ? null
      : rect(overBy(), RQ_H, {
          radius: 4,
          fill: 'red',
          stroke: null,
        })
          .opacity(0.42)
          .at(BUDGET_X + overBy() / 2, RQ_Y),
  ).zIndex(1);
  const overMark = dynamic(() => {
    const over = overBy(),
      y = RQ_Y + RQ_H / 2 + 16;
    if (over < 60) return null;
    const node = new Node();
    node.add(
      line([BUDGET_X, y], [BUDGET_X + over, y], {
        stroke: 'red',
        width: 5,
      }),
      S('the total is over budget', {
        size: 44,
        color: 'red',
      }).at(BUDGET_X + over / 2, y + 40),
    );
    return node;
  }).zIndex(2);
  const budgetLine = line([BUDGET_X, -392], [BUDGET_X, RQ_Y + RQ_H / 2 + 34], {
    stroke: 'red',
    width: 7,
  }).zIndex(3);
  const budgetName = place(
    M('budget (illustrative)', {
      size: 42,
      color: 'red',
    }),
    BUDGET_X + 20,
    -372,
  );
  const axisName = place(
    M('one pool, all three requests', {
      size: 40,
      color: 'dim',
    }),
    RQ_X,
    -372,
  );
  const scanLine = dynamic(() => {
    if (scan.value <= 0 || scan.value >= 1) return null;
    const x = RQ_X + scan.value * totalNow();
    return line([x, RQ_Y - RQ_H / 2 - 36], [x, RQ_Y - RQ_H / 2 - 6], {
      stroke: 'yellow',
      width: 7,
      glow: 8,
    });
  }).zIndex(4);
  const fullLine = place(
    T('Three live contexts', {
      size: 64,
      color: 'ink',
    }),
    -800,
    -70,
  );
  shrink.at(0.05, () =>
    stage.play(fadeIn(requestBars), fadeIn(requestLabels), fadeIn(axisName), {
      duration: 0.45,
    }),
  );
  shrink.on('full', () =>
    stage.play(
      fadeIn(fullLine, {
        shift: [0, 10],
      }),
      {
        duration: 0.5,
      },
    ),
  );
  shrink.on('too-small', () =>
    stage.play(draw(budgetLine), fadeIn(budgetName), fadeIn(overBand), fadeIn(overMark), {
      duration: 0.6,
    }),
  );
  const leverRow = (name, verdict, color, y) => {
    const node = new Node();
    node.add(
      place(
        T(name, {
          size: 60,
          color,
        }),
        -800,
        y,
      ),
      place(
        T(verdict, {
          size: 60,
          color: 'ink',
        }),
        -140,
        y,
      ),
    );
    return node;
  };
  const levers = [
    leverRow('Paging', 'scan for unused reservations', 'blue', 55),
    leverRow('Smaller blocks', 'trim three partial tails', 'orange', 155),
    leverRow('Continuous batching', 'reorder the same requests', 'green', 255),
  ];
  const accounting = dynamic(() => {
    const { total, budget, recovered, over } = state();
    return new Node().add(
      place(
        M(`${Math.round(total)} / ${budget} units`, {
          size: 64,
          color: over > 0 ? 'red' : 'green',
        }),
        -800,
        365,
      ),
      place(M(`${Math.round(recovered)} recovered`, { size: 48, color: 'teal' }), 155, 365),
      place(
        S('Illustrative memory units. Filled payload stays live.', { size: 35, color: 'dim' }),
        -800,
        445,
      ),
    );
  });
  shrink.on('too-small', () => stage.play(fadeIn(accounting), { duration: 0.4 }));
  const tails = RQ_LEN.map((_, i) =>
    dynamic(() => {
      const width = RQ_TAIL * (1 - tailLeft.value);
      if (width < 0.5) return null;
      return bar(
        RQ_X + leftOf(i) + widthOf(i),
        RQ_Y + 105 + 38 * (1 - tailLeft.value),
        width,
        40,
        RQ_COLOR[i],
      );
    }),
  );
  const scanSpan = shrink.cue('smaller').start - shrink.cue('paging-try').start - 0.3;
  shrink.on('paging-try', () => {
    handoff(
      [fullLine],
      () =>
        arrive(
          fadeIn(levers[0], {
            shift: [12, 0],
          }),
          fadeIn(scanLine),
          {
            duration: 0.4,
          },
        ),
      clearFirst,
    );
    stage.play(scan.to(1), {
      duration: scanSpan,
      ease: linear,
    });
  });
  shrink.on('no-slot', () =>
    stage.play(
      indicate(levers[0], {
        color: 'blue',
        scale: 1.02,
      }),
      {
        duration: 0.6,
      },
    ),
  );
  shrink.on('smaller', () =>
    stage.play(
      fadeIn(tails),
      brief(
        fadeIn(levers[1], {
          shift: [12, 0],
        }),
        0.4,
      ),
      tailLeft.to(0),
      {
        duration: 1.2,
        ease: smoother,
      },
    ),
  );
  shrink.on('batching', () =>
    stage.play(
      brief(
        fadeIn(levers[2], {
          shift: [12, 0],
        }),
        0.4,
      ),
      order.to(1),
      {
        duration: 1.3,
        ease: smoother,
      },
    ),
  );
  const fewerName = place(
    T('Store fewer bytes.', {
      size: 54,
      color: 'yellow',
    }),
    -800,
    -372,
  );
  shrink.on('fewer', () =>
    stage.play(
      fadeOut(axisName, { duration: 0.15 }),
      brief(write(fewerName), 0.4, 0.15),
      squeeze.to((BUDGET_X - RQ_X - 30) / (1600 - 3 * RQ_TAIL)),
      {
        duration: 1.1,
        ease: smoother,
      },
    ),
  );
  const firstParts = [
    ...requestBars,
    ...requestLabels,
    overBand,
    overMark,
    budgetLine,
    budgetName,
    axisName,
    accounting,
    ...tails,
    ...levers,
    fewerName,
  ];
  return {
    heading1,
    heading2,
    heading3,
    RQ_X,
    firstParts,
  };
}
