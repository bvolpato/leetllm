import assert from 'node:assert/strict';
import { fadeIn, group, indicate, line, rect, text, tex } from 'vizmatic/stage';
import { sceneHeading } from '../../../stage-lessons/kit.mjs';
import { fadeOut, fade, LEFT, prose, chipNode, waiting, dimIn, lit, QUIET } from '../defaults.mjs';

/** Reading the symptoms. */
export function buildMistakes(stage, narration, { leave }) {
  const mistakes = narration.scene('mistakes');
  sceneHeading(stage, mistakes, narration.title('mistakes'));
  // The formula stays. Each symptom gets a line to the term that causes it, until the formula is annotated.
  const annotated = tex('\\text{softmax}\\left(\\frac{QK^{\\top}}{\\sqrt{d}} + M\\right) V', {
    size: 100,
  }).at(0, -70);
  const leavesOf = (node) => (node.children?.length ? node.children.flatMap(leavesOf) : [node]);
  const glyphs = leavesOf(annotated);
  assert.equal(glyphs.length, 19);
  const GLYPH = {
    softmax: [0, 1, 2, 3, 4, 5, 6],
    q: [8],
    kTop: [9, 10],
    numerator: [8, 9, 10],
    root: [11, 12, 13],
    m: [16],
    v: [18],
  };
  const termBox = (indices, color, pad = 12, { insetLeft = 0 } = {}) => {
    const parts = indices.map((i) => glyphs[i]);
    const left =
        Math.min(...parts.map((node) => node.center[0] - node.width / 2)) - pad + insetLeft,
      right = Math.max(...parts.map((node) => node.center[0] + node.width / 2)) + pad;
    const top = Math.min(...parts.map((node) => node.center[1] - node.height / 2)) - pad,
      bottom = Math.max(...parts.map((node) => node.center[1] + node.height / 2)) + pad;
    // A tint, not an outline, so it marks the term without a line through its neighbors.
    const node = rect(right - left, bottom - top, {
      radius: 10,
      fill: color,
      stroke: null,
    })
      .fill(color, 0.3)
      .at((left + right) / 2, (top + bottom) / 2);
    return {
      node: node.opacity(0),
      left,
      right,
      top,
      bottom,
      x: (left + right) / 2,
      y: (top + bottom) / 2,
    };
  };
  const symptom = (what, cause, x, y, color) => {
    const row = [prose(what, x, y, 48), prose(cause, x, y + 56, 48, color)];
    waiting(row);
    return row;
  };
  const leader = (from, to, color) =>
    line(from, to, {
      stroke: color,
      width: 3,
    }).opacity(0);
  const axisBox = termBox(GLYPH.softmax, 'orange'),
    keyBox = termBox(GLYPH.kTop, 'yellow', 12, {
      insetLeft: 10,
    }),
    rootBox = termBox(GLYPH.root, 'red'),
    maskBox = termBox(GLYPH.m, 'orange');
  const axisCard = symptom(
    "Dropout off, a real row doesn't add to one",
    'softmax on the wrong axis',
    LEFT,
    -375,
    'orange',
  );
  const keyCard = symptom(
    'Shape error, or wrong at equal sizes',
    'a missing transpose',
    140,
    -375,
    'yellow',
  );
  const rootCard = symptom(
    'Shares pile onto one key',
    'as width grows: missing scaling',
    LEFT,
    135,
    'red',
  );
  const maskCard = symptom(
    'Dropout off, a real row too:',
    'a mask applied after softmax',
    170,
    135,
    'orange',
  );
  const axisLead = leader([axisBox.x, -284], [axisBox.x, axisBox.top], 'orange');
  const keyLead = leader([210, -284], [keyBox.x, keyBox.top], 'yellow');
  const rootLead = leader([-330, 140], [rootBox.left, rootBox.bottom], 'red');
  const maskLead = leader([maskBox.x, 100], [maskBox.x, maskBox.bottom], 'orange');
  const firstMarks = [
    axisBox.node,
    keyBox.node,
    rootBox.node,
    maskBox.node,
    axisLead,
    keyLead,
    rootLead,
    maskLead,
    ...axisCard,
    ...keyCard,
    ...rootCard,
    ...maskCard,
  ];
  mistakes.at(0.1, () =>
    stage.play(fadeIn(annotated), {
      duration: 0.45,
    }),
  );
  mistakes.on('shape', () =>
    stage.play(...lit([keyBox.node, keyLead, ...keyCard]), {
      duration: 0.5,
    }),
  );
  mistakes.on('wrong-axis', () =>
    stage.play(...lit([axisBox.node, axisLead, ...axisCard]), {
      duration: 0.5,
    }),
  );
  mistakes.on('after-softmax', () =>
    stage.play(...lit([maskBox.node, maskLead, ...maskCard]), {
      duration: 0.5,
    }),
  );
  mistakes.on('scaling', () =>
    stage.play(...lit([rootBox.node, rootLead, ...rootCard]), {
      duration: 0.5,
    }),
  );
  // A not-a-number check walks through the formula, in order.
  const badge = (number, x, y, color) =>
    group(
      rect(58, 58, {
        radius: 29,
        fill: 'surface',
        stroke: color,
        width: 3,
      }),
      text(String(number), {
        font: 'mono',
        size: 38,
        color,
      }).moveTo([0, 0]),
    )
      .at(x, y)
      .opacity(0);
  const badges = [
    [
      badge(1, glyphs[8].center[0] - 40, glyphs[8].center[1] - 92, 'ink'),
      badge(1, glyphs[18].center[0] + 4, glyphs[18].center[1] - 88, 'ink'),
    ],
    [badge(2, glyphs[10].center[0] + 74, glyphs[10].center[1] - 12, 'red')],
    [badge(3, glyphs[16].center[0], glyphs[16].center[1] - 84, 'orange')],
    [badge(4, axisBox.x, axisBox.top - 42, 'yellow')],
  ];
  const nanTitle = prose('Not a number? Check in order.', LEFT, 120, 60, 'red');
  const checks = [
    '1. Are the inputs finite?',
    '2. Did the scores overflow before masking?',
    '3. Does each row have a key it may read?',
    '4. Only then look at softmax.',
  ].map((line2, i) => prose(line2, LEFT, 200 + i * 78, 58, i === 3 ? 'yellow' : 'ink'));
  waiting(checks);
  mistakes.on('nan', () => {
    stage.play(...firstMarks.map((node) => fade(node, 0)), {
      duration: 0.25,
    });
    stage.play(fadeIn(nanTitle), ...dimIn(checks), {
      duration: 0.35,
    });
  });
  ['finite', 'overflowed', 'row-key', 'only-then'].forEach((cue, i) =>
    mistakes.on(cue, () =>
      stage.play(...lit([checks[i], ...badges[i]]), {
        duration: 0.35,
      }),
    ),
  );
  // M explains two more symptoms, and three costs sit on three parts of the formula.
  const historyCard = symptom(
    'A new token forgets its history',
    'local positions in a cached mask',
    170,
    262,
    'orange',
  );
  const fakeCard = symptom(
    'A decoder reads fake tokens',
    'a missing padding mask',
    170,
    392,
    'red',
  );
  const maskRail = leader([150, 100], [150, 450], 'orange'),
    maskRailTop = leader([150, 100], [maskBox.x, 100], 'orange');
  const estimateTag = prose('A bad long context estimate?', LEFT, 275, 52, 'dim');
  const threeCosts = [
    chipNode('score memory', -690, 365, 'blue', {
      w: 330,
      h: 84,
      size: 46,
    }),
    chipNode('cache memory', -340, 365, 'green', {
      w: 330,
      h: 84,
      size: 46,
    }),
    chipNode('the work itself', -690, 465, 'yellow', {
      w: 330,
      h: 84,
      size: 46,
    }),
  ];
  const scoreMemBox = termBox(GLYPH.numerator, 'blue', 20),
    cacheBoxV = termBox(GLYPH.v, 'green', 16);
  // The cache holds keys and values, so it marks K as well as V. K already sits inside the score tint, so it gets a bar.
  const keyGlyph = glyphs[9],
    cacheBarK = rect(keyGlyph.width, 9, {
      radius: 3,
      fill: 'green',
      stroke: null,
    })
      .at(keyGlyph.center[0], keyGlyph.center[1] + keyGlyph.height / 2 + 7)
      .opacity(0);
  const earlierMarks = [axisBox.node, keyBox.node, rootBox.node, axisLead, keyLead, rootLead];
  const quietCard = ([what, cause], color) => [fade(what, QUIET.ink), fade(cause, QUIET[color])];
  const earlierCards = [
    ...quietCard(axisCard, 'orange'),
    ...quietCard(keyCard, 'yellow'),
    ...quietCard(rootCard, 'red'),
  ];
  const earlier = [...earlierMarks, ...axisCard, ...keyCard, ...rootCard];
  const maskStay = [maskBox.node, maskLead, ...maskCard];
  mistakes.on('forgets', () => {
    stage.play(fadeOut([nanTitle, ...checks, ...badges.flat()]), {
      duration: 0.25,
    });
    stage.play(
      ...earlierMarks.map((node) => fade(node, 0.35)),
      ...earlierCards,
      ...lit([...maskStay, maskRail, maskRailTop, ...historyCard]),
      {
        duration: 0.35,
      },
    );
  });
  mistakes.on('fake-tokens', () =>
    stage.play(...lit(fakeCard), {
      duration: 0.4,
    }),
  );
  mistakes.on('estimate', () =>
    stage.play(
      ...[maskBox.node, maskLead, maskRail, maskRailTop].map((node) => fade(node, 0.3)),
      ...[axisBox.node, keyBox.node, rootBox.node].map((node) => fade(node, 0.2)),
      ...[axisLead, keyLead, rootLead, ...axisCard, ...keyCard, ...rootCard, ...maskCard].map(
        (node) => fade(node, 0),
      ),
      ...quietCard(historyCard, 'orange'),
      ...quietCard(fakeCard, 'red'),
      fadeIn(estimateTag),
      {
        duration: 0.5,
      },
    ),
  );
  mistakes.on('c-score', () =>
    stage.play(fadeIn(threeCosts[0]), ...lit([scoreMemBox.node]), {
      duration: 0.35,
    }),
  );
  mistakes.on('c-cache', () =>
    stage.play(fadeIn(threeCosts[1]), ...lit([cacheBoxV.node, cacheBarK]), {
      duration: 0.35,
    }),
  );
  mistakes.on('c-work', () =>
    stage.play(
      fadeIn(threeCosts[2]),
      indicate(annotated, {
        color: 'yellow',
        scale: 1.02,
      }),
      {
        duration: 0.8,
      },
    ),
  );
  leave(mistakes, [
    annotated,
    ...earlier,
    ...maskStay,
    maskRail,
    maskRailTop,
    ...historyCard,
    ...fakeCard,
    estimateTag,
    ...threeCosts,
    scoreMemBox.node,
    cacheBoxV.node,
    cacheBarK,
  ]);
}
