import { arrow, axes, dot as mark, draw, fadeIn, group, tex } from 'vizmatic/stage';
import { clearAxisNumbers, sceneHeading } from '../../../stage-lessons/kit.mjs';
import {
  fadeOut,
  arrive,
  f2,
  num,
  pct,
  prose,
  midProse,
  math,
  shareBar,
  waiting,
  dimIn,
  lit,
} from '../defaults.mjs';
import {
  K,
  V,
  ROOT,
  WEIGHTS,
  OUTPUT,
  NEW_STATE,
  NEW_QUERY,
  NEW_SCORES,
  NEW_WEIGHTS,
  NEW_OUTPUT,
} from '../model.mjs';

/** Your turn. */
export function buildYourTurn(stage, narration, { show, leave }) {
  const turn = narration.scene('your-turn');
  sceneHeading(stage, turn, narration.title('your-turn'));
  const tplane = axes({
    x: [0, 4],
    y: [0, 4],
    width: 780,
    height: 780,
    xStep: 1,
    yStep: 1,
    grid: true,
    labelSize: 36,
    tips: false,
  }).at(-460, 60);
  clearAxisNumbers(tplane);
  const tp = (x, y) => tplane.world(x, y);
  const turnKeyB = arrow(tp(0, 0), tp(...K[0]), {
      stroke: 'blue',
      width: 6,
      tip: 22,
    }),
    turnKeyS = arrow(tp(0, 0), tp(...K[1]), {
      stroke: 'teal',
      width: 6,
      tip: 22,
    });
  const turnQuery = arrow(tp(0, 0), tp(...NEW_QUERY), {
    stroke: 'yellow',
    width: 7,
    tip: 30,
  });
  const turnQName = tex(`q = [${NEW_QUERY.join(',\\ ')}]`, {
    size: 54,
    color: 'yellow',
  }).moveTo([tp(...NEW_QUERY)[0] - 20, tp(...NEW_QUERY)[1] - 46]);
  const turnKeyNames = [
    tex('k_{\\text{birds}}', {
      size: 46,
      color: 'blue',
    }).moveTo([tp(...K[0])[0] + 84, tp(...K[0])[1] + 10]),
    tex('k_{\\text{sing}}', {
      size: 46,
      color: 'teal',
    }).moveTo([tp(...K[1])[0] - 6, tp(...K[1])[1] - 42]),
  ];
  const TURN_X = 30;
  const turnState = math(`x = [${NEW_STATE.join(',\\ ')}]`, TURN_X, -310, 84);
  const turnSame = prose('The same matrices', TURN_X, -210, 56, 'dim');
  const turnQEq = math(`q = x\\,W_Q = [${NEW_QUERY.join(',\\ ')}]`, TURN_X, -110, 76, 'yellow');
  const predictTag = prose(
    'Pause and predict.\nWhich source gains share?',
    TURN_X,
    80,
    76,
    'yellow',
    {
      leading: 1.14,
    },
  );
  const turnScoreB = math(
    `q \\cdot k_{\\text{birds}} = ${num(NEW_SCORES[0])}`,
    TURN_X,
    -300,
    76,
    'blue',
  );
  const turnScoreS = math(
    `q \\cdot k_{\\text{sing}} = ${num(NEW_SCORES[1])}`,
    TURN_X,
    -200,
    76,
    'teal',
  );
  const turnDivide = math(
    `\\div \\sqrt{2}\\ \\to\\ ${f2(NEW_SCORES[0] / ROOT)},\\ ${f2(NEW_SCORES[1] / ROOT)}`,
    TURN_X,
    -90,
    66,
  );
  const turnBar = group(...shareBar(NEW_WEIGHTS, TURN_X + 420, 60, 840, 140, ['blue', 'teal'], 72));
  const turnWas = prose(
    `Before: ${pct(WEIGHTS[1][0])} and ${pct(WEIGHTS[1][1])}`,
    TURN_X,
    180,
    54,
    'dim',
  );
  const turnGains = prose('Sing gains.', TURN_X, 290, 92, 'yellow');
  waiting([predictTag]);
  turn.at(0.1, () =>
    stage.play(
      draw(tplane.grid, {
        lag: 0.02,
      }),
      draw(tplane.lines),
      fadeIn(tplane.numbers),
      draw(turnKeyB, {
        lag: 1,
      }),
      draw(turnKeyS, {
        lag: 1,
      }),
      fadeIn([turnState, ...turnKeyNames]),
      ...dimIn([predictTag]),
      {
        duration: 0.45,
      },
    ),
  );
  show(turn, 'same-matrices', turnSame);
  turn.after('new-query', () =>
    stage.play(
      draw(turnQuery, {
        lag: 1,
      }),
      fadeIn([turnQName, turnQEq]),
      {
        duration: 0.8,
      },
    ),
  );
  turn.on('predict', () =>
    stage.play(...lit([predictTag]), {
      duration: 0.5,
    }),
  );
  turn.on('score-it', () =>
    stage.play(
      fadeOut([turnState, turnSame, turnQEq, predictTag], {
        duration: 0.16,
      }),
      {
        duration: 0.42,
      },
    ),
  );
  turn.after('birds-result', () => stage.play(fadeIn(turnScoreB), { duration: 0.25 }));
  turn.after('against-sing', () => stage.play(fadeIn(turnScoreS), { duration: 0.25 }));
  turn.after('root-two', () => stage.play(fadeIn(turnDivide), { duration: 0.3 }));
  turn.after('new-shares', () =>
    stage.play(
      fadeIn([turnBar, turnWas], {
        shift: [0, 8],
      }),
      {
        duration: 0.6,
      },
    ),
  );
  turn.after('sing-gains', () => stage.play(fadeIn(turnGains), { duration: 0.3 }));
  // The same values, blended by the new shares.
  const vplane2 = axes({
    x: [0, 2.4],
    y: [0, 2.4],
    width: 780,
    height: 780,
    xStep: 0.5,
    yStep: 0.5,
    grid: true,
    labelSize: 36,
    tips: false,
  }).at(-460, 60);
  clearAxisNumbers(vplane2);
  const vp2 = (x, y) => vplane2.world(x, y);
  const turnVB = arrow(vp2(0, 0), vp2(...V[0]), {
      stroke: 'blue',
      width: 4,
      tip: 20,
    }).opacity(0.45),
    turnVS = arrow(vp2(0, 0), vp2(...V[1]), {
      stroke: 'teal',
      width: 4,
      tip: 20,
    }).opacity(0.45);
  const scaledB = V[0].map((x) => x * NEW_WEIGHTS[0]);
  const turnLegA = arrow(vp2(0, 0), vp2(...scaledB), {
    stroke: 'blue',
    width: 8,
    tip: 22,
  });
  const turnLegB = arrow(vp2(...scaledB), vp2(...NEW_OUTPUT), {
    stroke: 'teal',
    width: 8,
    tip: 22,
  });
  const oldPoint = mark(11, 'dim').moveTo(vp2(...OUTPUT[1])),
    newPoint = mark(15, 'yellow')
      .moveTo(vp2(...NEW_OUTPUT))
      .glow(12);
  const oldName = midProse(
    'before',
    vp2(...OUTPUT[1])[0] + 80,
    vp2(...OUTPUT[1])[1] + 6,
    44,
    'dim',
  );
  const newName = tex('o', {
    size: 58,
    color: 'yellow',
  }).moveTo([vp2(...NEW_OUTPUT)[0] - 34, vp2(...NEW_OUTPUT)[1] - 34]);
  const mixLine = math(
    `${pct(NEW_WEIGHTS[0])} \\times [2,\\ 1] + ${pct(NEW_WEIGHTS[1])} \\times [1,\\ 2]`.replace(
      /%/g,
      '\\%',
    ),
    TURN_X,
    -260,
    66,
  );
  const newAnswer = math(
    `o \\approx [${num(+NEW_OUTPUT[0].toFixed(1))},\\ ${num(+NEW_OUTPUT[1].toFixed(1))}]`,
    TURN_X,
    -120,
    120,
    'yellow',
  );
  const oldAnswer = math(
    `\\text{before: } [${f2(OUTPUT[1][0])},\\ ${f2(OUTPUT[1][1])}]`,
    TURN_X,
    30,
    62,
    'dim',
  );
  const sameLine2 = prose(
    'Same content,\ndifferent question,\ndifferent blend.',
    TURN_X,
    260,
    78,
    'green',
    {
      leading: 1.14,
    },
  );
  const queryParts = [
    tplane,
    turnKeyB,
    turnKeyS,
    ...turnKeyNames,
    turnQuery,
    turnQName,
    turnScoreB,
    turnScoreS,
    turnDivide,
    turnBar,
    turnWas,
    turnGains,
  ];
  turn.on('mix-values', () =>
    stage.play(
      fadeOut(queryParts, {
        duration: 0.3,
      }),
      draw(vplane2.grid, {
        lag: 0.02,
      }),
      draw(vplane2.lines),
      fadeIn(vplane2.numbers),
      fadeIn([turnVB, turnVS, oldPoint, oldName]),
      fadeIn(mixLine),
      {
        duration: 0.6,
      },
    ),
  );
  turn.after('blend-legs', () =>
    stage.play(
      draw(turnLegA, {
        lag: 1,
      }),
      draw(turnLegB, {
        lag: 1,
      }),
      {
        duration: 0.8,
      },
    ),
  );
  turn.after('new-answer', () =>
    stage.play(fadeIn([newPoint, newName, newAnswer, oldAnswer]), {
      duration: 0.6,
    }),
  );
  show(turn, 'same-content', sameLine2);
  leave(turn, [
    vplane2,
    turnVB,
    turnVS,
    turnLegA,
    turnLegB,
    oldPoint,
    oldName,
    newPoint,
    newName,
    mixLine,
    newAnswer,
    oldAnswer,
    sameLine2,
  ]);
}
