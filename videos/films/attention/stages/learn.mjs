import {
  arrow,
  axes,
  dot as mark,
  draw,
  dynamic,
  fadeIn,
  lagged,
  smoother,
  tex,
} from 'vizmatic/stage';
import { clearAxisNumbers, sceneHeading } from '../../../stage-lessons/kit.mjs';
import {
  fadeOut,
  fade,
  arrive,
  f2,
  prose,
  midMono,
  math,
  midMath,
  shareBar,
  chipNode,
  waiting,
} from '../defaults.mjs';
import { V, softmax, blendOf, SCALED } from '../model.mjs';

/** How routing learns. */
export function buildLearn(stage, narration, { show, leave }) {
  const learn = narration.scene('learn');
  sceneHeading(stage, learn, narration.title('learn'));
  const IDENTICAL = [3, -1];
  const lplane = axes({
    x: [0, 3.4],
    y: [-1.4, 2.4],
    width: 760,
    height: 800,
    xStep: 1,
    yStep: 1,
    grid: true,
    labelSize: 36,
    tips: false,
  }).at(-470, 60);
  clearAxisNumbers(lplane);
  const xTicks = lplane.numbers.children.slice(0, lplane.numbers.children.length / 2);
  const lp = (x, y) => lplane.world(x, y);
  const lerp = (a, b, t) => a.map((x, i) => x + (b[i] - x) * t);
  const scoreBump = stage.value(0),
    merged = stage.value(0),
    oneKey = stage.value(0),
    routeVisible = stage.value(1),
    outputVisible = stage.value(1);
  const valuesNow = () => [
    lerp(V[0], IDENTICAL, merged.value),
    lerp(V[1], IDENTICAL, merged.value),
  ];
  const sharesNowL = () => {
    const a = softmax([SCALED[1][0] + scoreBump.value, SCALED[1][1]]);
    return [a[0] * (1 - oneKey.value), a[1] + a[0] * oneKey.value];
  };
  const outputNow = () => blendOf(sharesNowL(), valuesNow());
  const valueArrows = dynamic(() => {
    if (routeVisible.value <= 0.01) return [];
    const [a, b] = valuesNow();
    return [
      arrow(lp(0, 0), lp(...a), {
        stroke: 'blue',
        width: 6,
        tip: 24,
      }).opacity(1 - 0.75 * oneKey.value),
      arrow(lp(0, 0), lp(...b), {
        stroke: 'teal',
        width: 4,
        tip: 20,
      }),
    ];
  });
  const outputPoint = dynamic(() => {
    if (routeVisible.value <= 0.01 || outputVisible.value <= 0.01) return [];
    const point = lp(...outputNow());
    return [
      mark(15, 'yellow').moveTo(point).glow(14),
      tex('o', {
        size: 52,
        color: 'yellow',
      }).moveTo([point[0] + 34, point[1] - 30]),
    ];
  });
  const routeBar = dynamic(() =>
    routeVisible.value <= 0.01
      ? []
      : shareBar(sharesNowL(), 480, -250, 780, 100, ['blue', 'teal'], 54),
  );
  const routeRead = dynamic(() => {
    if (outputVisible.value <= 0.01) return [];
    const o = outputNow();
    return midMono(`o = [${f2(o[0])}, ${f2(o[1])}]`, 480, -130, 66, 'yellow');
  });
  const vbName = tex('v_{\\text{birds}}', {
    size: 50,
    color: 'blue',
  }).moveTo([lp(...V[0])[0] + 74, lp(...V[0])[1] - 6]);
  const vsName = tex('v_{\\text{sing}}', {
    size: 50,
    color: 'teal',
  }).moveTo([lp(...V[1])[0] - 72, lp(...V[1])[1] - 24]);
  const sameName = tex('v_{\\text{birds}} = v_{\\text{sing}}', {
    size: 50,
    color: 'teal',
  }).moveTo([lp(...IDENTICAL)[0] - 170, lp(...IDENTICAL)[1] + 44]);
  waiting([sameName]);
  const pullEq = midMath('\\frac{\\partial o}{\\partial s_j} = a_j\\,(v_j - o)', 480, 45, 84);
  // Computed from the current state, so it never disagrees with the bar above it.
  const pullBirds = dynamic(() => {
    const a = sharesNowL()[0],
      o = outputNow(),
      v = valuesNow()[0];
    return midMono(
      `${f2(a)} × ([2, 1] - o) = [${f2(a * (v[0] - o[0]))}, ${f2(a * (v[1] - o[1]))}]`,
      480,
      225,
      40,
      'blue',
    );
  });
  const lossTag2 = prose(
    'A loss uses this to adjust\nthe query and key matrices.',
    100,
    355,
    56,
    'green',
    {
      leading: 1.14,
    },
  );
  learn.at(0.1, () =>
    stage.play(
      draw(lplane.grid, {
        lag: 0.02,
      }),
      draw(lplane.lines),
      fadeIn(lplane.numbers),
      fadeIn([valueArrows, outputPoint, routeBar, routeRead, vbName, vsName]),
      {
        duration: 0.45,
      },
    ),
  );
  learn.on('raising', () =>
    stage.play(
      scoreBump.to(1.1, {
        duration: 1.2,
        ease: smoother,
      }),
    ),
  );
  learn.on('pull', () =>
    stage.play(
      scoreBump.to(0, {
        duration: 0.8,
        ease: smoother,
      }),
      fadeIn(pullEq),
      {
        duration: 0.8,
      },
    ),
  );
  show(learn, 'pull-amount', pullBirds);
  learn.on('turn-birds', () =>
    stage.play(
      scoreBump.to(1.6, {
        duration: 1.2,
        ease: smoother,
      }),
    ),
  );
  show(learn, 'backprop', lossTag2);
  const whatMovesTag = prose('Both values: [3, −1].\nWhat moves?', 100, 140, 70, 'yellow', {
    leading: 1.14,
  });
  learn.on('same-value', () =>
    stage.play(
      outputVisible.to(0, { duration: 0 }),
      fadeOut([pullEq, pullBirds, lossTag2], {
        duration: 0.3,
      }),
      scoreBump.to(0, {
        duration: 0.6,
      }),
      merged.to(1, {
        duration: 1.1,
        ease: smoother,
      }),
      fade(vbName, 0, {
        duration: 0.3,
      }),
      fade(vsName, 0, {
        duration: 0.3,
      }),
      fade(sameName, 1),
      {
        duration: 1.1,
      },
    ),
  );
  // The arrows sweep across the x axis, so its digits step aside while they pass.
  const fadeTicks = (value, duration = 0.2) =>
    stage.play(
      ...xTicks.map((node) =>
        fade(node, value, {
          duration,
        }),
      ),
    );
  learn.on('same-value', () => fadeTicks(0));
  learn.on('same-value', () => fadeTicks(1), 1.2);
  learn.on('only-one', () => fadeTicks(0));
  learn.on('only-one', () => fadeTicks(1), 0.85);
  learn.on('change-shares', () => {
    stage.play(
      fadeIn(whatMovesTag),
      scoreBump.to(1.5, {
        duration: 0.9,
        ease: smoother,
      }),
      {
        duration: 0.9,
      },
    );
    stage.play(
      scoreBump.to(-1.5, {
        duration: 1.3,
        ease: smoother,
      }),
    );
  });
  const nothingTag = prose('Nothing, dropout off.', 100, 20, 84, 'red');
  const zeroEq = math(
    '\\frac{\\partial o}{\\partial s_j} = a_j\\,(v_j - o) = 0',
    100,
    185,
    76,
    'red',
  );
  const valueGrad = prose('The values still get a gradient.', 100, 345, 58, 'green');
  learn.after('nothing', () =>
    stage.play(
      fadeOut(whatMovesTag, {
        duration: 0.2,
      }),
      fadeIn(nothingTag),
      outputVisible.to(1, { duration: 0 }),
      scoreBump.to(0.4, {
        duration: 0.5,
      }),
      {
        duration: 0.5,
      },
    ),
  );
  learn.after('zero-grad', () => stage.play(fadeIn(zeroEq), { duration: 0.3 }));
  show(learn, 'value-path', valueGrad);
  const oneKeyTag = prose('One allowed key: its share is stuck at 1.', 100, 110, 46, 'orange');
  const routeTag = prose('Nothing to route.', 100, 210, 76, 'orange');
  const nearlyTag = prose('Nearly all on one key: close to this.', 100, 340, 54, 'dim');
  learn.on('only-one', () => {
    stage.play(fadeOut([nothingTag, zeroEq, valueGrad]), fade(sameName, 0), {
      duration: 0.2,
    });
    stage.play(
      merged.to(0, {
        duration: 0.6,
        ease: smoother,
      }),
      scoreBump.to(0, {
        duration: 0.6,
      }),
      oneKey.to(1, {
        duration: 0.6,
        ease: smoother,
      }),
      fade(vbName, 0.25),
      fade(vsName, 1),
      fadeIn(oneKeyTag),
      {
        duration: 0.6,
      },
    );
  });
  show(learn, 'stuck', routeTag);
  show(learn, 'nearly', nearlyTag);
  const storyTag = prose('Shares are part of the story.', 100, 100, 58, 'yellow');
  const storyChain = [
    chipNode('weighted content', 300, 210, 'green'),
    chipNode('output matrix', 300, 320, 'green'),
    chipNode('later layers', 300, 430, 'green'),
  ];
  learn.on('story', () =>
    stage.play(
      fadeOut([oneKeyTag, routeTag, nearlyTag], {
        duration: 0.16,
      }),
      oneKey.to(0, {
        duration: 0.4,
      }),
      fade(vbName, 1),
      arrive(fadeIn(storyTag)),
      {
        duration: 0.5,
      },
    ),
  );
  learn.on('follow', () =>
    stage.play(
      lagged(
        storyChain.map((node) =>
          fadeIn(node, {
            shift: [0, 10],
          }),
        ),
        {
          lag: 0.5,
        },
      ),
      {
        duration: 1.3,
      },
    ),
  );
  leave(learn, [
    lplane,
    valueArrows,
    outputPoint,
    routeBar,
    routeRead,
    vbName,
    vsName,
    storyTag,
    ...storyChain,
  ]);
}
