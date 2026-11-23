import { Node, arrow, fadeIn, group, indicate, lagged, line, rect } from 'vizmatic/stage';
import { gridPath, sceneHeading } from '../../../stage-lessons/kit.mjs';
import {
  fadeOut,
  fade,
  arrive,
  f2,
  LEFT,
  prose,
  midProse,
  midMono,
  math,
  midMath,
  shareBar,
  waiting,
  dimIn,
  lit,
} from '../defaults.mjs';
import { WEIGHTS, OUTPUT, HEAD2, HEAD2_WEIGHTS, HEAD2_OUTPUT } from '../model.mjs';

/** Many heads, same core work. */
export function buildHeads(stage, narration, { show, leave }) {
  const heads = narration.scene('heads');
  sceneHeading(stage, heads, narration.title('heads'));
  const STATE_X = -780,
    HEAD_X = -470,
    HEAD_Y = [-190, 170];
  const stateCells = Array.from(
    {
      length: 4,
    },
    (_, i) =>
      rect(70, 70, {
        radius: 8,
        fill: 'ink',
        stroke: null,
      })
        .at(STATE_X, 10 + (i - 1.5) * 84)
        .opacity(0.85),
  );
  const stateName = midProse('state', STATE_X, 240, 50, 'dim');
  const headCells = HEAD_Y.map((y, h) =>
    [0, 1].map((i) =>
      rect(70, 70, {
        radius: 8,
        fill: h ? 'pink' : 'yellow',
        stroke: null,
      })
        .at(HEAD_X, y + (i - 0.5) * 84)
        .opacity(0.9),
    ),
  );
  const headNames = HEAD_Y.map((y, h) =>
    midProse(`head ${h + 1}`, HEAD_X, y + 118, 46, h ? 'pink' : 'yellow'),
  );
  const wires = HEAD_Y.map((y, h) =>
    Array.from(
      {
        length: 4,
      },
      (_, i) =>
        [0, 1].map((j) =>
          line([STATE_X + 38, 10 + (i - 1.5) * 84], [HEAD_X - 38, y + (j - 0.5) * 84], {
            stroke: h ? 'pink' : 'yellow',
            width: 1.6,
          }).opacity(0.5),
        ),
    ).flat(),
  );
  const HEAD_TEXT_X = -360;
  const ownLine = prose('Each head has its own learned matrices.', HEAD_TEXT_X, -340, 52, 'dim');
  const bigLine = prose('Often stored as one big matrix, then split.', HEAD_TEXT_X, 400, 50, 'dim');
  const head1Title = math(
    '\\text{Head 1: the calculation we just did}',
    HEAD_TEXT_X,
    -270,
    52,
    'yellow',
  );
  const WORD_NAMES = ['birds', 'sing'];
  const head1Bar = group(
    ...shareBar(WEIGHTS[1], HEAD_TEXT_X + 560, -170, 1120, 92, ['blue', 'teal'], 56, {
      names: WORD_NAMES,
    }),
  );
  const head1Out = math(
    `o_1 = [${f2(OUTPUT[1][0])},\\ ${f2(OUTPUT[1][1])}]`,
    HEAD_TEXT_X,
    -60,
    72,
    'yellow',
  );
  const head2Title = math('\\text{Head 2: made up matrices}', HEAD_TEXT_X, 50, 52, 'pink');
  const head2Inputs = math(
    `q = [${HEAD2.q.join(',\\ ')}]\\quad k_{\\text{birds}} = [${HEAD2.K[0].join(',\\ ')}]\\quad k_{\\text{sing}} = [${HEAD2.K[1].join(',\\ ')}]`,
    HEAD_TEXT_X,
    125,
    44,
  );
  const head2Values = math(
    `v_{\\text{birds}} = [${HEAD2.V[0].join(',\\ ')}]\\quad v_{\\text{sing}} = [${HEAD2.V[1].join(',\\ ')}]`,
    HEAD_TEXT_X,
    195,
    50,
    'green',
  );
  const head2Bar = group(
    ...shareBar(HEAD2_WEIGHTS, HEAD_TEXT_X + 560, 280, 1120, 92, ['blue', 'teal'], 56, {
      names: WORD_NAMES,
    }),
  );
  const head2Out = math(
    `o_2 = [${f2(HEAD2_OUTPUT[0])},\\ ${f2(HEAD2_OUTPUT[1])}]`,
    HEAD_TEXT_X,
    380,
    72,
    'pink',
  );
  const reading = prose('Same words, different reading.', 260, 380, 46, 'yellow');
  const preBar1 = group(
    ...shareBar(WEIGHTS[1], HEAD_TEXT_X + 560, -170, 1120, 92, ['blue', 'teal'], 56, {
      names: WORD_NAMES,
      percent: false,
    }),
  );
  const preBar2 = group(
    ...shareBar(HEAD2_WEIGHTS, HEAD_TEXT_X + 560, 280, 1120, 92, ['blue', 'teal'], 56, {
      names: WORD_NAMES,
      percent: false,
    }),
  );
  const oneSet = prose('one set of shares', HEAD_TEXT_X, -270, 52, 'yellow'),
    anotherSet = prose('another set of shares, over the same words', HEAD_TEXT_X, 180, 52, 'pink');
  heads.at(0.1, () =>
    stage.play(fadeIn([...stateCells, stateName, ...headCells[0], headNames[0], preBar1, oneSet]), {
      duration: 0.45,
    }),
  );
  heads.on('several', () =>
    stage.play(fadeIn([...headCells[1], headNames[1], anotherSet]), {
      duration: 0.5,
    }),
  );
  show(heads, 'own-matrices', ownLine);
  show(heads, 'one-big', bigLine);
  heads.on('whole-state', () =>
    stage.play(
      fadeOut(bigLine, {
        duration: 0.2,
      }),
      lagged(
        wires.flat().map((node) => fadeIn(node)),
        {
          lag: 0.04,
        },
      ),
      {
        duration: 0.9,
      },
    ),
  );
  heads.on('head-one', () =>
    stage.play(
      fadeOut([preBar1, oneSet], {
        duration: 0.2,
      }),
      fadeIn([head1Title, head1Bar, head1Out], {
        shift: [0, 8],
      }),
      {
        duration: 0.6,
      },
    ),
  );
  heads.on('head-two', () =>
    stage.play(
      fadeOut([anotherSet, ownLine, head1Title], {
        duration: 0.2,
      }),
      fade(head1Bar, 0.45),
      fade(head1Out, 0.45),
      fadeIn([head2Title, head2Inputs], {
        shift: [0, 8],
      }),
      {
        duration: 0.6,
      },
    ),
  );
  show(heads, 'its-values', head2Values);
  heads.after('sixty-seven', () =>
    stage.play(
      fadeOut(preBar2, {
        duration: 0.2,
      }),
      fadeIn(head2Bar),
      {
        duration: 0.5,
      },
    ),
  );
  heads.after('lands-two', () => stage.play(fadeIn(head2Out), { duration: 0.3 }));
  heads.on('different', () =>
    stage.play(
      ...lit([head1Bar, head1Out]),
      fadeIn(reading, {
        shift: [0, 10],
      }),
      {
        duration: 0.5,
      },
    ),
  );
  // Join, project, add.
  const joined = [...OUTPUT[1], ...HEAD2_OUTPUT].map((value, i) =>
    midMono(f2(value), -620 + (i - 1.5) * 140, -30, 52, i < 2 ? 'yellow' : 'pink'),
  );
  const joinedBox = rect(610, 120, {
    radius: 12,
    stroke: 'dim',
    width: 2.5,
  }).at(-620, -30);
  const joinName = midProse('Back to four numbers', -620, -140, 54, 'dim');
  const outMatrix = rect(240, 240, {
    radius: 14,
    fill: 'surface',
    stroke: 'green',
    width: 4,
  }).at(10, -30);
  const outName = midMath('W^{O}', 10, -30, 96, 'green');
  const outTitle2 = midProse('learned output matrix', 10, -195, 48, 'green');
  const intoOut = arrow([-300, -30], [-120, -30], {
    stroke: 'dim',
    width: 4,
    tip: 22,
  });
  const outOf = arrow([140, -30], [330, -30], {
    stroke: 'dim',
    width: 4,
    tip: 22,
  });
  const residualEq = midMath('x + \\Delta', 560, -30, 120, 'yellow');
  const residualTag = midProse('Added to the state, not replacing it', 0, 260, 72, 'yellow');
  const headParts = [
    ...stateCells,
    stateName,
    ...headCells.flat(),
    ...headNames,
    ...wires.flat(),
    ownLine,
    head1Title,
    head1Bar,
    head1Out,
    head2Title,
    head2Inputs,
    head2Values,
    head2Bar,
    head2Out,
    reading,
  ];
  const joinLater = [outMatrix, outName, outTitle2, intoOut, outOf, residualEq];
  waiting(joinLater);
  heads.on('side-by-side', () =>
    stage.play(
      fadeOut(headParts, {
        duration: 0.16,
      }),
      arrive(fadeIn([...joined, joinedBox, joinName])),
      ...dimIn(joinLater).map((anim) => arrive(anim)),
      {
        duration: 0.42,
      },
    ),
  );
  heads.on('out-matrix', () =>
    stage.play(...lit([intoOut, outMatrix, outName, outTitle2]), {
      duration: 0.6,
    }),
  );
  heads.on('added', () =>
    stage.play(...lit([outOf, residualEq]), {
      duration: 0.6,
    }),
  );
  show(heads, 'adjusts', residualTag);
  // Same leading work, but more stored scores.
  const oneWide = rect(1024, 110, {
    radius: 8,
    fill: 'yellow',
    stroke: null,
  })
    .at(-330, -280)
    .opacity(0.85);
  const eightNarrow = Array.from(
    {
      length: 8,
    },
    (_, i) =>
      rect(120, 110, {
        radius: 6,
        fill: 'pink',
        stroke: null,
      })
        .at(-842 + 64 + i * 128, -140)
        .opacity(0.85),
  );
  const oneName = math('1 \\times 512', 240, -280, 80, 'yellow'),
    eightName = math('8 \\times 64', 240, -140, 80, 'pink');
  const sameWork = prose('Same leading score and value work.', LEFT, -15, 72, 'green');
  const smallGrid = (x, color) =>
    new Node(gridPath(8, 96)).fill(color, 0.5).stroke(color, 1).at(x, 300);
  const oneGrid = smallGrid(-800, 'yellow');
  const eightGrids = Array.from(
    {
      length: 8,
    },
    (_, i) => smallGrid(-650 + i * 104, 'pink'),
  );
  const memoryOne = midMono('1 grid', -800, 205, 46, 'yellow'),
    memoryEight = midMono('8 grids', -286, 205, 46, 'pink');
  const memoryTag = prose('One score per pair, per head:\n8× the memory.', 170, 300, 54, 'orange', {
    leading: 1.14,
  });
  const rowsTag2 = prose('More softmax rows', LEFT, 105, 54, 'dim');
  const joinParts = [
    ...joined,
    joinedBox,
    joinName,
    outMatrix,
    outName,
    outTitle2,
    intoOut,
    outOf,
    residualEq,
    residualTag,
  ];
  const memoryPics = [oneGrid, ...eightGrids, memoryOne, memoryEight];
  waiting(memoryPics);
  heads.on('core', () =>
    stage.play(
      fadeOut(joinParts, {
        duration: 0.16,
      }),
      arrive(fadeIn([oneWide, oneName, ...eightNarrow, eightName])),
      ...dimIn(memoryPics).map((anim) => arrive(anim)),
      {
        duration: 0.42,
      },
    ),
  );
  heads.on('compare', () =>
    stage.play(
      indicate(oneWide, {
        color: 'ink',
        scale: 1.02,
      }),
      lagged(
        eightNarrow.map((node) =>
          indicate(node, {
            color: 'ink',
            scale: 1.08,
          }),
        ),
        {
          lag: 0.05,
        },
      ),
      {
        duration: 0.9,
      },
    ),
  );
  show(heads, 'leading', sameWork);
  show(heads, 'softmax-rows', rowsTag2);
  heads.on('eight-memory', () =>
    stage.play(...lit(memoryPics), fadeIn(memoryTag), {
      duration: 0.8,
    }),
  );
  const heatmapCells = (x, value, color) => {
    const node = new Node();
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++)
        node.add(
          rect(64, 64, {
            radius: 4,
            fill: color,
            stroke: null,
          })
            .at((c - 3.5) * 70, (r - 3.5) * 70)
            .opacity(0.08 + 0.82 * value(r, c)),
        );
    return node.at(x, 60);
  };
  const nearby = heatmapCells(-600, (r, c) => Math.exp(-Math.abs(r - c - 1) * 1.2), 'yellow');
  const subject = heatmapCells(20, (r, c) => (c === 0 ? 0.9 : 0.08), 'pink');
  const nearbyTag = midProse('Previous word', -600, -340, 60, 'yellow'),
    subjectTag = midProse('First word', 20, -340, 60, 'pink');
  const readers = prose('One row\nper reader', 380, -220, 62, 'ink', {
    leading: 1.14,
  });
  const legend = prose('Brighter cells get\nlarger shares.', 380, -60, 48, 'dim', {
    leading: 1.14,
  });
  const hypothesis = prose('First position\nor subject?', 380, 130, 60, 'orange', {
    leading: 1.14,
  });
  const testIt = prose('Move the\nsubject.', 380, 330, 60, 'green', {
    leading: 1.14,
  });
  const costParts = [
    oneWide,
    oneName,
    ...eightNarrow,
    eightName,
    sameWork,
    rowsTag2,
    oneGrid,
    ...eightGrids,
    memoryOne,
    memoryEight,
    memoryTag,
  ];
  heads.on('what-learn', () =>
    stage.play(
      fadeOut(costParts, {
        duration: 0.16,
      }),
      arrive(fadeIn([nearby, subject, legend])),
      {
        duration: 0.42,
      },
    ),
  );
  show(heads, 'nobody', readers);
  show(heads, 'patterns', [nearbyTag, subjectTag]);
  show(heads, 'hypothesis', hypothesis);
  show(heads, 'test-it', testIt);
  leave(heads, [nearby, subject, nearbyTag, subjectTag, readers, legend, hypothesis, testIt]);
  return [nearby, subject];
}
