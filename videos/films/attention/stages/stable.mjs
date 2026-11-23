import assert from 'node:assert/strict';
import { dot as mark, draw, fadeIn, line, rect, smoother, to } from 'vizmatic/stage';
import { sceneHeading } from '../../../stage-lessons/kit.mjs';
import {
  brief,
  fadeOut,
  arrive,
  pct,
  LEFT,
  prose,
  midProse,
  midMono,
  math,
  midMath,
} from '../defaults.mjs';
import { STABLE_SHARES, FP16_MAX } from '../model.mjs';

/** When the numbers overflow. */
export function buildStable(stage, narration, { show, leave, handOver }) {
  const stable = narration.scene('stable');
  sceneHeading(stage, stable, narration.title('stable'));
  const hugeExp = midMath('e^{1000}', 0, -40, 290, 'yellow');
  const toInfinity = midMath('=\\ \\infty', 300, -40, 230, 'red');
  const notNumber = midMath('\\frac{\\infty}{\\infty} = \\text{not a number}', 0, 320, 110, 'red');
  stable.at(0.1, () =>
    stage.play(
      fadeIn(hugeExp, {
        scale: 0.92,
      }),
      {
        duration: 0.45,
      },
    ),
  );
  const tooBig = midProse('Too big for standard floating point', 0, -340, 62, 'dim');
  show(stable, 'too-big', tooBig);
  stable.on('infinity', () =>
    stage.play(
      brief(
        to(hugeExp, (node) => node.shift(-340, 0)),
        0.5,
        0,
        smoother,
      ),
      brief(
        fadeIn(toInfinity, {
          shift: [0, 10],
        }),
        0.35,
        0.42,
      ),
      {
        duration: 0.8,
      },
    ),
  );
  show(stable, 'nan', notNumber);
  const STABLE_X = [-700, -330, 40],
    STABLE_ROWS = {
      raw: -325,
      shifted: -190,
      exponent: -65,
    },
    STABLE_BASE = 430,
    STABLE_H = 440;
  const rawScores = [1000, 1001, 999];
  const shifted = rawScores.map((x) => x - Math.max(...rawScores));
  assert.deepEqual(shifted, [-1, 0, -2]);
  const rawCells = rawScores.map((value, i) =>
    midMono(String(value), STABLE_X[i], STABLE_ROWS.raw, 76, i === 1 ? 'yellow' : 'ink'),
  );
  const shiftCells = shifted.map((value, i) =>
    midMono(String(value), STABLE_X[i], STABLE_ROWS.shifted, 80, i === 1 ? 'yellow' : 'ink'),
  );
  const expCells = shifted.map((value, i) =>
    midMath(`e^{${value}}`, STABLE_X[i], STABLE_ROWS.exponent, 72, 'teal'),
  );
  const stableBars = STABLE_SHARES.map((share, i) =>
    rect(300, share * STABLE_H, {
      radius: 8,
      fill: ['blue', 'yellow', 'teal'][i],
      stroke: null,
    })
      .at(STABLE_X[i], STABLE_BASE - (share * STABLE_H) / 2)
      .opacity(0.85),
  );
  const stablePct = STABLE_SHARES.map((share, i) =>
    midMono(pct(share), STABLE_X[i], STABLE_BASE - share * STABLE_H - 50, 72, 'ink'),
  );
  const stableTag = prose("The shares\ndon't change.", 290, -40, 60, 'green', {
    leading: 1.14,
  });
  const stableTop = math('\\text{Largest finite term: } e^{0} = 1', 290, 170, 46, 'yellow');
  const overflowParts = [tooBig, hugeExp, toInfinity, notNumber];
  stable.on('gaps', () =>
    stage.play(
      fadeOut(overflowParts, {
        duration: 0.16,
      }),
      arrive(fadeIn(rawCells)),
      {
        duration: 0.42,
      },
    ),
  );
  // Keep the inputs visible so the viewer can compare the same gaps in both rows.
  const offset = prose(`subtract ${Math.max(...rawScores)}`, 290, STABLE_ROWS.raw, 54, 'yellow');
  const stems = STABLE_X.map((x) =>
    line([x, STABLE_ROWS.raw + 48], [x, STABLE_ROWS.shifted - 51], {
      stroke: 'dim',
      width: 3,
    }),
  );
  stable.on('becomes', () =>
    stage.play(fadeIn(offset), ...stems.map((stem) => draw(stem)), { duration: 0.4 }),
  );
  stable.after('becomes', () =>
    stage.play(fadeIn(shiftCells), arrive(fadeIn(expCells), 0.24, 0.24), { duration: 0.48 }),
  );
  show(stable, 'cancels', stableTag);
  stable.after('stable-shares', () =>
    stage.play(fadeIn([...stableBars, ...stablePct]), {
      duration: 0.5,
    }),
  );
  show(stable, 'largest-term', stableTop);
  // A score that has already overflowed cannot be repaired by max shift.
  const fpAxis = line([-800, 100], [800, 100], {
    stroke: 'dim',
    width: 4,
  });
  const fpScale = (x) => -800 + (1600 * x) / 100000;
  const fpBand = rect(fpScale(100000) - fpScale(FP16_MAX), 90, {
    fill: 'red',
    stroke: null,
  })
    .at((fpScale(FP16_MAX) + fpScale(100000)) / 2, 100)
    .opacity(0.3);
  const fpTick = line([fpScale(FP16_MAX), 40], [fpScale(FP16_MAX), 160], {
    stroke: 'red',
    width: 5,
  });
  const fpMax = midMono(FP16_MAX.toLocaleString('en-US'), fpScale(FP16_MAX), 210, 60, 'red');
  const fpName = midProse(
    'FP16: two bytes, largest number',
    fpScale(FP16_MAX) - 270,
    -30,
    54,
    'dim',
  );
  const fpPoint = mark(16, 'yellow')
    .moveTo([fpScale(90000), 100])
    .glow(12);
  const fpValue = midMono('300 × 300 = 90,000', fpScale(90000) - 160, -120, 72, 'yellow');
  const fpInputs = midMono('300 × 300', fpScale(90000) - 160, -120, 72, 'yellow');
  const fpInfinity = midProse('Infinity, though both inputs are fine.', 0, -240, 66, 'red');
  const castLine = prose('Cast to 32 bits afterward: still infinity.', LEFT, 310, 60, 'red');
  const redoLine = prose(
    'Recompute the product in the wider type: 90,000.',
    LEFT,
    410,
    60,
    'green',
  );
  const shiftParts = [
    ...rawCells,
    ...stems,
    offset,
    ...shiftCells,
    ...expCells,
    ...stableBars,
    ...stablePct,
    stableTag,
    stableTop,
  ];
  const fpZero = midMono('0', fpScale(0), 210, 60, 'dim');
  const brokenTag = midProse("Subtracting can't repair an infinity.", 0, -240, 66, 'orange');
  // Old text leaves first, so nothing lands on it. The bars linger, so the frame is never empty.
  handOver(
    stable,
    'broken',
    shiftParts.filter((node) => !stableBars.includes(node)),
    () =>
      stage.play(draw(fpAxis), fadeIn([fpZero, brokenTag]), {
        duration: 0.35,
      }),
    0.15,
    0,
  );
  stable.on('broken', () =>
    stage.play(
      fadeOut(stableBars, {
        duration: 0.45,
      }),
    ),
  );
  stable.on('fp16', () =>
    stage.play(fadeIn(fpName), {
      duration: 0.4,
    }),
  );
  stable.on('largest', () =>
    stage.play(draw(fpTick), fadeIn([fpMax, fpBand]), {
      duration: 0.6,
    }),
  );
  stable.on('product', () =>
    stage.play(fadeIn(fpInputs), {
      duration: 0.6,
    }),
  );
  stable.after('overflows', () => {
    stage.play(fadeOut([brokenTag, fpInputs]), {
      duration: 0.2,
    });
    stage.play(fadeIn([fpPoint, fpValue, fpInfinity]), {
      duration: 0.35,
    });
  });
  show(stable, 'cast', castLine);
  show(stable, 'recompute', redoLine);
  leave(stable, [
    fpAxis,
    fpZero,
    fpBand,
    fpTick,
    fpMax,
    fpName,
    fpPoint,
    fpValue,
    fpInfinity,
    castLine,
    redoLine,
  ]);
}
