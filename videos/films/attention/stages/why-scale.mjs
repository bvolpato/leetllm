import assert from 'node:assert/strict';
import {
  axes,
  dot as mark,
  draw,
  dynamic,
  fadeIn,
  line,
  polyline,
  rect,
  smoother,
} from 'vizmatic/stage';
import { sceneHeading } from '../../../stage-lessons/kit.mjs';
import {
  LINEAR,
  brief,
  fadeOut,
  arrive,
  f2,
  pct,
  LEFT,
  prose,
  midProse,
  midMono,
  math,
  midMath,
  waiting,
  dimIn,
  lit,
} from '../defaults.mjs';
import { softmax, WEIGHTS, close, UNSCALED_WEIGHTS, TIED_SLOPE } from '../model.mjs';

/** Why divide by the square root?. */
export function buildWhyScale(stage, narration, { show, leave }) {
  const why = narration.scene('why-scale');
  sceneHeading(stage, why, narration.title('why-scale'));
  const RIGHT_X = 70;
  const distPlot = axes({
    x: [-60, 60],
    y: [0, 0.45],
    width: 860,
    height: 620,
    xStep: 20,
    yStep: 0.45,
    labelSize: 34,
    tips: false,
  }).at(-440, 100);
  // Six x labels, since the axes skip zero, and one y label that means nothing here.
  distPlot.numbers.children.forEach((node, i) => (i < 6 ? node.shift(0, 14) : node.opacity(0)));
  const widthNow = stage.value(2),
    dividedBy = stage.value(0);
  const spreadNow = () => Math.sqrt(widthNow.value) * (1 - dividedBy.value) + dividedBy.value;
  const pdf = (x, sd) => Math.exp(-0.5 * (x / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI));
  const bell = dynamic(() => {
    const sd = spreadNow(),
      points = [];
    for (let i = 0; i <= 480; i++) {
      const x = -60 + (120 * i) / 480;
      points.push(distPlot.world(x, Math.min(pdf(x, sd), 0.45)));
    }
    return polyline(points, {
      stroke: 'yellow',
      width: 5,
      glow: 8,
    });
  });
  const spreadRead = dynamic(() =>
    midMono(`d = ${Math.round(widthNow.value)}`, -660, -260, 56, 'ink'),
  );
  const axisName = midProse('raw score', -440, 497, 44, 'dim');
  const barely = [
    prose('With a width of two:', RIGHT_X, -260, 62, 'dim'),
    prose(
      `Without the division: ${pct(UNSCALED_WEIGHTS[0])} and ${pct(UNSCALED_WEIGHTS[1])}`,
      RIGHT_X,
      -160,
      52,
    ),
    prose(
      `With the division: ${pct(WEIGHTS[1][0])} and ${pct(WEIGHTS[1][1])}`,
      RIGHT_X,
      -70,
      52,
      'yellow',
    ),
  ];
  waiting(barely);
  why.at(0.1, () =>
    stage.play(
      draw(distPlot.lines),
      fadeIn(distPlot.numbers),
      fadeIn([bell, spreadRead, axisName]),
      ...dimIn(barely),
      {
        duration: 0.45,
      },
    ),
  );
  why.on('barely', () =>
    stage.play(...lit(barely), {
      duration: 0.5,
    }),
  );
  const modelTag = prose(
    'Simple model: each number random,\nindependent, mean 0, variance 1.',
    RIGHT_X,
    -240,
    48,
    'dim',
    {
      leading: 1.14,
    },
  );
  const varOne = math('\\text{Var}(q_i k_i) = 1', RIGHT_X, -70, 84);
  const varD = math('\\text{Var}(q \\cdot k) = d', RIGHT_X, 50, 84);
  const stdD = math('\\text{std}(q \\cdot k) = \\sqrt{d}', RIGHT_X, 170, 84, 'yellow');
  why.on('simple-model', () =>
    stage.play(
      fadeOut(barely, {
        duration: 0.16,
      }),
      arrive(fadeIn(modelTag)),
      {
        duration: 0.42,
      },
    ),
  );
  show(why, 'each-product', varOne);
  show(why, 'add-up', varD);
  show(why, 'root-d', stdD);
  const std64 = math('d = 64:\\ \\text{std} = 8', RIGHT_X, 290, 72, 'yellow');
  const std512 = math('d = 512:\\ \\text{std} \\approx 23', RIGHT_X, 390, 72, 'orange');
  why.after('w64', () => stage.play(fadeIn(std64), { duration: 0.25 }));
  why.on('w64', () =>
    stage.play(
      widthNow.to(64, {
        duration: 1.2,
        ease: smoother,
      }),
      {
        duration: 1.2,
      },
    ),
  );
  why.after('w512', () => stage.play(fadeIn(std512), { duration: 0.25 }));
  why.on('w512', () =>
    stage.play(
      widthNow.to(512, {
        duration: 1.2,
        ease: smoother,
      }),
      {
        duration: 1.2,
      },
    ),
  );
  // Softmax cares about gaps.
  const plusAll = stage.value(0),
    gapMix = stage.value(0);
  const gapScores = () =>
    [2, 1, 0].map((x, i) => x + ([10, 0, 0][i] - x) * gapMix.value + plusAll.value);
  const finePct = (x) =>
    x >= 0.995 ? `${(x * 100).toFixed(4)}%` : x < 0.005 ? `${(x * 100).toFixed(4)}%` : pct(x);
  assert.equal(finePct(softmax([10, 0, 0])[0]), '99.9909%');
  assert.equal(finePct(softmax([10, 0, 0])[1]), '0.0045%');
  const GAP_X = [-710, -360, -10],
    GAP_BASE = 440,
    GAP_H = 520;
  const gapBars = dynamic(() => {
    const scores = gapScores(),
      sharesNow = softmax(scores),
      out = [];
    scores.forEach((value, i) => {
      out.push(midMono(String(Math.round(value)), GAP_X[i], -290, 76, 'ink'));
      out.push(midMono(finePct(sharesNow[i]), GAP_X[i], -190, 66, 'yellow'));
      const h = Math.max(4, sharesNow[i] * GAP_H);
      out.push(
        rect(250, h, {
          radius: 6,
          fill: ['yellow', 'blue', 'teal'][i],
          stroke: null,
        })
          .at(GAP_X[i], GAP_BASE - h / 2)
          .opacity(0.85),
      );
    });
    return out;
  });
  const gapTitle = prose('Scores, then shares', LEFT, -370, 48, 'dim');
  const addTag = prose("Add 1,000 to all:\nthe shares don't change.", 230, -180, 54, 'green', {
    leading: 1.14,
  });
  const gapsTag = prose('Softmax cares about gaps,\nnot sizes.', 230, -180, 54, 'ink', {
    leading: 1.14,
  });
  const gapEq = math('e^{10} \\approx 22{,}026', 230, 40, 78, 'yellow');
  const gapTag = prose('A gap of ten: that many\ntimes bigger.', 230, 160, 54, 'yellow', {
    leading: 1.14,
  });
  const fewTag = prose(
    'One clear leader, few keys:\nnearly all the share.',
    230,
    340,
    54,
    'orange',
    {
      leading: 1.14,
    },
  );
  const distParts = [distPlot, bell, spreadRead, axisName];
  why.on('gaps', () =>
    stage.play(
      fadeOut([...distParts, modelTag, varOne, varD, stdD, std64, std512], {
        duration: 0.16,
      }),
      arrive(fadeIn([gapBars, gapTitle, gapsTag])),
      {
        duration: 0.42,
      },
    ),
  );
  why.on('add-thousand', () =>
    stage.play(
      fadeOut(gapsTag, {
        duration: 0.25,
      }),
      plusAll.to(1000, {
        duration: 1,
        ease: smoother,
      }),
      fadeIn(addTag),
      {
        duration: 1,
      },
    ),
  );
  why.on('gap-ten', () =>
    stage.play(
      plusAll.to(0, {
        duration: 0.6,
      }),
      gapMix.to(1, {
        duration: 1,
        ease: smoother,
      }),
      fadeOut(addTag, {
        duration: 0.3,
      }),
      {
        duration: 1,
      },
    ),
  );
  why.after('gap-ten', () => stage.play(fadeIn([gapEq, gapTag]), { duration: 0.25 }));
  show(why, 'leader', fewTag);
  // Why saturation hurts: the slope of one share against its own score.
  const slopePlot = axes({
    x: [-8, 24],
    y: [0, 1],
    width: 860,
    height: 620,
    xStep: 8,
    yStep: 0.5,
    labelSize: 34,
    tips: false,
  }).at(-440, 100);
  slopePlot.numbers.children.forEach((node, i) => (i < 4 ? node.shift(0, 14) : node.shift(-30, 0)));
  const shareOfOne = (z) => Math.exp(z) / (Math.exp(z) + 2);
  close(shareOfOne(0), 1 / 3, 1e-9);
  const sPoints = Array.from(
    {
      length: 321,
    },
    (_, i) => {
      const z = -8 + (32 * i) / 320;
      return slopePlot.world(z, shareOfOne(z));
    },
  );
  const sCurve = polyline(sPoints, {
    stroke: 'yellow',
    width: 5,
  });
  const slopeAxis = midProse("this key's score, others at 0", -440, 487, 44, 'dim');
  const slopeY = prose('its share', LEFT + 10, -255, 44, 'dim');
  const tangentA = line(
    slopePlot.world(-1.5, shareOfOne(0) - 1.5 * TIED_SLOPE),
    slopePlot.world(3, shareOfOne(0) + 3 * TIED_SLOPE),
    {
      stroke: 'teal',
      width: 6,
    },
  );
  const dotA = mark(11, 'teal').moveTo(slopePlot.world(0, shareOfOne(0)));
  const tangentB = line(slopePlot.world(15, 1), slopePlot.world(24, 1), {
    stroke: 'red',
    width: 6,
  });
  const dotB = mark(11, 'red').moveTo(slopePlot.world(20, shareOfOne(20)));
  const nudgeTitle = prose('Share moved per unit of score', RIGHT_X, -270, 46, 'dim');
  const tiedLine = math(
    `\\text{three tied keys:}\\ \\approx ${f2(TIED_SLOPE)}`,
    RIGHT_X,
    -170,
    60,
    'teal',
  );
  const leadLine = math(
    '\\text{a 20 point lead:}\\ \\approx 4 \\times 10^{-9}',
    RIGHT_X,
    -60,
    60,
    'red',
  );
  const gradTag = prose(
    'The gradient through the scores\nnearly vanishes.',
    RIGHT_X,
    110,
    60,
    'red',
    {
      leading: 1.14,
    },
  );
  const valueTag = prose("The leading key's value\ncan still learn.", RIGHT_X, 310, 60, 'green', {
    leading: 1.14,
  });
  why.on('hurt', () =>
    stage.play(
      fadeOut([gapBars, gapTitle, gapEq, gapTag, fewTag], {
        duration: 0.18,
      }),
      brief(draw(slopePlot.lines), 0.5, 0.16, LINEAR),
      arrive(fadeIn(slopePlot.numbers), 0.09),
      brief(draw(sCurve), 0.5, 0.16, LINEAR),
      arrive(fadeIn([slopeAxis, slopeY, nudgeTitle]), 0.09),
      {
        duration: 0.66,
      },
    ),
  );
  why.after('tied', () => stage.play(fadeIn(tiedLine), { duration: 0.25 }));
  why.on('tied', () =>
    stage.play(
      draw(tangentA),
      fadeIn(dotA, {
        scale: 0.4,
      }),
      {
        duration: 0.7,
      },
    ),
  );
  why.after('lead', () => stage.play(fadeIn(leadLine), { duration: 0.25 }));
  why.on('lead', () =>
    stage.play(
      draw(tangentB),
      fadeIn(dotB, {
        scale: 0.4,
      }),
      {
        duration: 0.7,
      },
    ),
  );
  show(why, 'gradient', gradTag);
  show(why, 'value-learns', valueTag);
  // Dividing restores the spread.
  const restoreEq = math(
    '\\text{Var}\\left(\\frac{q \\cdot k}{\\sqrt{d}}\\right) = \\frac{d}{d} = 1',
    RIGHT_X,
    -220,
    68,
    'green',
  );
  const eightToOne = math(
    '\\text{at } d = 64:\\ \\text{std } 8 \\to 1',
    RIGHT_X,
    -70,
    72,
    'yellow',
  );
  const notD = prose('Why not divide by d?', RIGHT_X, 80, 62, 'dim');
  const notDEq = math('\\text{std} = 1 / \\sqrt{d}', RIGHT_X, 165, 62, 'orange');
  const notDValues = math(
    '0.125 \\text{ at } d = 64,\\ 0.044 \\text{ at } d = 512',
    RIGHT_X,
    250,
    48,
    'orange',
  );
  close(1 / Math.sqrt(64), 0.125, 1e-9);
  close(1 / Math.sqrt(512), 0.044, 0.001);
  const notDTag = prose('It shrinks more as vectors widen.', RIGHT_X, 340, 56, 'orange');
  const slopeParts = [
    slopePlot,
    sCurve,
    slopeAxis,
    slopeY,
    tangentA,
    dotA,
    tangentB,
    dotB,
    nudgeTitle,
    tiedLine,
    leadLine,
    gradTag,
    valueTag,
  ];
  why.on('divide-back', () =>
    stage.play(
      fadeOut(slopeParts, {
        duration: 0.3,
      }),
      fadeIn([...distParts, restoreEq]),
      widthNow.to(64, {
        duration: 0.5,
      }),
      {
        duration: 0.6,
      },
    ),
  );
  const axisDivided = midMath('\\text{raw score} / \\sqrt{d}', -440, 490, 36, 'dim');
  why.on('eight', () =>
    stage.play(
      dividedBy.to(1, {
        duration: 1.1,
        ease: smoother,
      }),
      fadeOut(axisName, {
        duration: 0.25,
      }),
      fadeIn([axisDivided, eightToOne]),
      {
        duration: 1.1,
      },
    ),
  );
  show(why, 'not-d', [notD, notDEq, notDValues, notDTag]);
  const limitA = prose('The proof assumes independence.', RIGHT_X, -260, 52, 'orange');
  const limitB = prose(
    'Real queries and keys come\nfrom shared states.',
    RIGHT_X,
    -110,
    58,
    'dim',
    {
      leading: 1.14,
    },
  );
  const limitC = prose("So measure a trained\nmodel's scores.", RIGHT_X, 110, 72, 'yellow', {
    leading: 1.14,
  });
  why.on('limits', () =>
    stage.play(
      fadeOut([restoreEq, eightToOne, notD, notDEq, notDValues, notDTag], {
        duration: 0.16,
      }),
      arrive(fadeIn(limitA)),
      {
        duration: 0.42,
      },
    ),
  );
  show(why, 'shared', limitB);
  show(why, 'measure', limitC);
  leave(why, [distPlot, bell, spreadRead, axisDivided, limitA, limitB, limitC]);
}
