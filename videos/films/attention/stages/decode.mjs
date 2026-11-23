import assert from 'node:assert/strict';
import {
  Node,
  arrow,
  draw,
  fadeIn,
  indicate,
  lagged,
  line,
  morph,
  par,
  rect,
  smoother,
  text,
} from 'vizmatic/stage';
import { gridNode, gridPath, sceneHeading } from '../../../stage-lessons/kit.mjs';
import {
  fadeOut,
  fade,
  arrive,
  LEFT,
  prose,
  midProse,
  mono,
  midMono,
  midMath,
  chipNode,
  waiting,
  dimIn,
  lit,
} from '../defaults.mjs';
import { cacheBytes } from '../model.mjs';

/** One new token at a time. */
export function buildDecode(stage, narration, { show, leave }) {
  const decode = narration.scene('decode');
  sceneHeading(stage, decode, narration.title('decode'));
  const CACHE_N = 8,
    CACHE_CELL = 170,
    cacheX = (i) => (i - (CACHE_N - 1) / 2) * CACHE_CELL;
  const fullGrid = gridNode(8, 560, 'blue').at(0, 60);
  const oneRow = new Node(gridPath(8, 560).filter((_, index) => Math.floor(index / 8) === 7))
    .fill('yellow', 0.8)
    .at(0, -320 + 245);
  const keysRow = Array.from(
    {
      length: CACHE_N,
    },
    (_, i) =>
      rect(150, 96, {
        radius: 10,
        fill: 'blue',
        stroke: null,
      })
        .at(cacheX(i), 170)
        .opacity(0.75),
  );
  const valuesRow = Array.from(
    {
      length: CACHE_N,
    },
    (_, i) =>
      rect(150, 96, {
        radius: 10,
        fill: 'green',
        stroke: null,
      })
        .at(cacheX(i), 290)
        .opacity(0.75),
  );
  const keyNames = keysRow.map((_, i) => midMath(`k_${i}`, cacheX(i), 170, 54, 'bg')),
    valueNames = valuesRow.map((_, i) => midMath(`v_${i}`, cacheX(i), 290, 54, 'bg'));
  const cacheName = midProse('the KV cache', 0, 410, 66, 'green');
  const queryChip = chipNode('one new query', 0, -250, 'yellow', {
    size: 56,
  });
  const readLines = keysRow.map((_, i) =>
    line([0, -196], [cacheX(i), 118], {
      stroke: 'yellow',
      width: 2.5,
    }).opacity(0.7),
  );
  decode.at(0.1, () =>
    stage.play(fadeIn(fullGrid), {
      duration: 0.45,
    }),
  );
  decode.on('one-query', () =>
    stage.play(morph(fullGrid, oneRow), fadeIn(queryChip), {
      duration: 0.8,
      ease: smoother,
    }),
  );
  decode.on('saved', () =>
    stage.play(
      fadeOut(oneRow, {
        duration: 0.3,
      }),
      lagged(
        [...keysRow, ...valuesRow].map((node) =>
          fadeIn(node, {
            scale: 0.8,
          }),
        ),
        {
          lag: 0.03,
        },
      ),
      fadeIn([...keyNames, ...valueNames, cacheName]),
      {
        duration: 0.8,
      },
    ),
  );
  decode.on('reads-all', () =>
    stage.play(
      lagged(
        readLines.map((node) => draw(node)),
        {
          lag: 0.08,
        },
      ),
      {
        duration: 0.9,
      },
    ),
  );
  decode.on('mixes-all', () =>
    stage.play(
      lagged(
        valuesRow.map((node) =>
          indicate(node, {
            color: 'ink',
            scale: 1.06,
          }),
        ),
        {
          lag: 0.08,
        },
      ),
      {
        duration: 1,
      },
    ),
  );
  // Absolute positions.
  const posKeys = Array.from(
    {
      length: 5,
    },
    (_, i) =>
      rect(190, 130, {
        radius: 12,
        fill: 'blue',
        stroke: null,
      })
        .at((i - 2) * 215, 30)
        .opacity(0.75),
  );
  const posNames = posKeys.map((_, i) => midMono(`key ${i}`, (i - 2) * 215, 30, 50, 'bg'));
  const posQuery = chipNode('new query: position 4, but row 0 in this batch', 0, -240, 'yellow', {
    size: 56,
  });
  const localMarks = posKeys.map((_, i) =>
    midMono(i === 0 ? 'T' : 'F', (i - 2) * 215, 170, 86, i === 0 ? 'green' : 'red'),
  );
  const localTag = midProse('Local row numbers: most of its history is gone.', 0, 285, 60, 'red');
  const absoluteMarks = posKeys.map((_, i) => midMono('T', (i - 2) * 215, 170, 86, 'green'));
  assert.deepEqual(
    [0, 1, 2, 3, 4].map((position) => position <= 4),
    [true, true, true, true, true],
  );
  const absoluteTag = midProse(
    'Absolute positions: none of them is in the future.',
    0,
    285,
    60,
    'green',
  );
  const ruleTag = midMath(
    '\\text{allowed} = (\\text{key position} \\le \\text{query position})\\ \\text{and not padding}',
    0,
    410,
    56,
    'yellow',
  );
  const cacheFront = [
    queryChip,
    ...keysRow,
    ...valuesRow,
    ...keyNames,
    ...valueNames,
    cacheName,
    ...readLines,
  ];
  decode.on('position', () =>
    stage.play(
      fadeOut(cacheFront, {
        duration: 0.16,
      }),
      arrive(fadeIn([...posKeys, ...posNames, posQuery])),
      {
        duration: 0.42,
      },
    ),
  );
  decode.on('local', () =>
    stage.play(
      fadeIn(localMarks),
      fadeIn(localTag),
      ...posKeys.slice(1).map((node) => fade(node, 0.2)),
      ...posNames.slice(1).map((node) => fade(node, 0.2)),
      {
        duration: 0.6,
      },
    ),
  );
  decode.on('all-five', () =>
    stage.play(
      fadeOut([...localMarks, localTag], {
        duration: 0.25,
      }),
      fadeIn([...absoluteMarks, absoluteTag]),
      ...posKeys.slice(1).map((node) => fade(node, 0.75)),
      ...posNames.slice(1).map((node) => fade(node, 1)),
      {
        duration: 0.6,
      },
    ),
  );
  show(decode, 'rule', ruleTag);
  // The cache: what has to fit, and what has to move.
  const hbmBox = rect(1040, 520, {
    radius: 18,
    fill: 'surface',
    stroke: 'dim',
    width: 3,
  }).at(-360, 70);
  const hbmName = midProse('GPU main memory', -360, -150, 56, 'dim');
  const hbmCache = new Node();
  for (let i = 0; i < 8; i++) {
    hbmCache.add(
      rect(102, 110, {
        radius: 8,
        fill: 'blue',
        stroke: null,
      })
        .at((i - 3.5) * 116, -62)
        .opacity(0.75),
    );
    hbmCache.add(
      rect(102, 110, {
        radius: 8,
        fill: 'green',
        stroke: null,
      })
        .at((i - 3.5) * 116, 62)
        .opacity(0.75),
    );
  }
  hbmCache.at(-360, 90);
  const hbmFit = midProse('It has to fit: capacity', -360, 280, 54, 'red');
  const chipBox = rect(340, 240, {
    radius: 18,
    fill: 'surface',
    stroke: 'yellow',
    width: 3,
  }).at(690, 70);
  const chipName = midProse('on the chip', 690, 70, 54, 'yellow');
  const reread = arrow([180, 70], [510, 70], {
    stroke: 'yellow',
    width: 7,
    tip: 30,
    glow: 8,
  });
  const rereadName = midProse('Each new token:\nread again', 340, -25, 42, 'yellow', {
    leading: 1.12,
  });
  const rereadTag = midProse('bandwidth', 345, 150, 54, 'red');
  const scoreRowX = 570;
  const scoreCells = keysRow.map((_, i) =>
    rect(66, 54, { radius: 5, fill: 'yellow', stroke: null }).at(
      scoreRowX + (i - (CACHE_N - 1) / 2) * 79,
      -132,
    ),
  );
  const rowLabel = midProse('Scores for one query', scoreRowX, -230, 54, 'yellow');
  const positionParts = [...posKeys, ...posNames, posQuery, ...absoluteMarks, absoluteTag, ruleTag];
  decode.on('score-fine', () =>
    stage.play(
      fadeOut(positionParts, {
        duration: 0.16,
      }),
      arrive(fadeIn([rowLabel, hbmBox, hbmName, hbmCache])),
      {
        duration: 0.42,
      },
    ),
  );
  decode.on('one-score-row', () =>
    stage.play(
      lagged(
        scoreCells.map((cell, i) =>
          par(indicate(hbmCache.children[2 * i], { color: 'yellow', scale: 1 }), fadeIn(cell)),
        ),
        { lag: 0.24 },
      ),
      { duration: 1.6 },
    ),
  );
  show(decode, 'fit', hbmFit);
  decode.on('read-again', () =>
    stage.play(
      fadeIn([chipBox, chipName, rereadName]),
      draw(reread, {
        lag: 1,
      }),
      {
        duration: 0.7,
      },
    ),
  );
  show(decode, 'limit', rereadTag);
  // Fewer key and value heads.
  const shareLayout = (x, kvHeads, title, color) => {
    const node = new Node();
    const queryY = -120,
      kvY = 200,
      spread = 56,
      kvWide = 460;
    for (let q = 0; q < 8; q++) {
      const fromX = (q - 3.5) * spread;
      const target = Math.floor((q * kvHeads) / 8),
        toX = kvHeads === 1 ? 0 : (target - (kvHeads - 1) / 2) * (kvWide / kvHeads);
      node.add(
        line([fromX, queryY + 26], [toX, kvY - 40], {
          stroke: color,
          width: 2,
        }).opacity(0.6),
      );
      node.add(
        rect(42, 52, {
          radius: 6,
          fill: 'yellow',
          stroke: null,
        }).at(fromX, queryY),
      );
    }
    for (let h = 0; h < kvHeads; h++) {
      const toX = kvHeads === 1 ? 0 : (h - (kvHeads - 1) / 2) * (kvWide / kvHeads);
      const width = Math.min(kvWide / kvHeads - 8, 150);
      node.add(
        rect(width, 72, {
          radius: 8,
          fill: color,
          stroke: null,
        }).at(toX, kvY),
      );
    }
    node.add(
      text(title, {
        font: 'text-serif',
        size: 54,
        color,
      }).at(0, queryY - 76),
    );
    node.add(
      text(`${kvHeads} KV head${kvHeads === 1 ? '' : 's'}`, {
        font: 'mono',
        size: 44,
        color,
      }).moveTo([0, kvY + 90]),
    );
    return node.at(x, 40);
  };
  const layoutMHA = shareLayout(-600, 8, 'Standard', 'blue'),
    layoutGQA = shareLayout(0, 2, 'Grouped query', 'green'),
    layoutMQA = shareLayout(600, 1, 'Multi query', 'teal');
  const queryHeadsTag = midProse('8 query heads, shown in yellow', 0, 440, 46, 'dim');
  const memoryParts = [
    hbmBox,
    hbmName,
    hbmCache,
    hbmFit,
    chipBox,
    chipName,
    reread,
    rereadName,
    rereadTag,
    rowLabel,
    ...scoreCells,
  ];
  waiting([layoutGQA, layoutMQA]);
  decode.on('fewer', () =>
    stage.play(
      fadeOut(memoryParts, {
        duration: 0.16,
      }),
      arrive(fadeIn([layoutMHA, queryHeadsTag])),
      ...dimIn([layoutGQA, layoutMQA]).map((anim) => arrive(anim)),
      {
        duration: 0.42,
      },
    ),
  );
  decode.on('mqa', () =>
    stage.play(...lit([layoutMQA]), {
      duration: 0.5,
    }),
  );
  decode.on('gqa', () =>
    stage.play(...lit([layoutGQA]), {
      duration: 0.5,
    }),
  );
  // A hypothetical layout, sized.
  const layoutEq = midMath(
    '2 \\times 80\\ \\text{layers} \\times h_{\\text{KV}} \\times 128 \\times 8192\\ \\text{tokens} \\times 16\\ \\text{requests} \\times 2\\ \\text{bytes}',
    0,
    -300,
    52,
  );
  const hypotheticalTag = midProse(
    'A hypothetical layout. The first 2: keys and values. 128: head width.',
    0,
    -210,
    48,
    'dim',
  );
  const SIZE_SCALE = 1060 / cacheBytes(64),
    SIZE_LEFT = -600,
    sizeY = [-60, 110, 280];
  const sizeRows = [
    [64, 'blue'],
    [8, 'green'],
    [1, 'teal'],
  ].map(([kv, color], i) => {
    const width = Math.max(10, cacheBytes(kv) * SIZE_SCALE);
    return {
      name: mono(`${kv}`, LEFT, sizeY[i], 72, color),
      bar: rect(width, 110, {
        radius: 8,
        fill: color,
        stroke: null,
      })
        .at(SIZE_LEFT + width / 2, sizeY[i])
        .opacity(0.85),
      size: mono(
        `≈ ${Math.round(cacheBytes(kv) / 1e9)} GB`,
        SIZE_LEFT + width + 26,
        sizeY[i],
        72,
        color,
      ),
    };
  });
  const headsAxis = midProse('KV heads', -780, -150, 44, 'dim');
  decode.on('hypothetical', () =>
    stage.play(
      fadeOut([layoutMHA, layoutGQA, layoutMQA, queryHeadsTag], {
        duration: 0.16,
      }),
      arrive(fadeIn([layoutEq, hypotheticalTag, headsAxis, ...sizeRows.map((row) => row.name)])),
      {
        duration: 0.42,
      },
    ),
  );
  ['sixty-four', 'with-eight', 'with-one'].forEach((cue, i) =>
    decode.after(cue, () =>
      stage.play(fadeIn([sizeRows[i].bar, sizeRows[i].size]), {
        duration: 0.6,
      }),
    ),
  );
  // Sharing shrinks the cache. Each query head still makes its own scores.
  const LIMIT_X = -460,
    limitQX = (q) => LIMIT_X + (q - 3.5) * 92;
  const limitGrids = Array.from(
    {
      length: 8,
    },
    (_, q) => new Node(gridPath(6, 72)).fill('red', 0.55).stroke('red', 1).at(limitQX(q), -270),
  );
  const limitHeads = Array.from(
    {
      length: 8,
    },
    (_, q) =>
      rect(72, 56, {
        radius: 6,
        fill: 'yellow',
        stroke: null,
      }).at(limitQX(q), -175),
  );
  const limitWires = Array.from(
    {
      length: 8,
    },
    (_, q) =>
      line([limitQX(q), -145], [LIMIT_X, 95], {
        stroke: 'teal',
        width: 2.5,
      }),
  );
  const limitKV = rect(320, 84, {
    radius: 10,
    fill: 'teal',
    stroke: null,
  }).at(LIMIT_X, 140);
  const gridsName = midProse('Each query head: its own scores', LIMIT_X, -350, 52, 'red');
  const kvName = midProse('Shared: a smaller cache', LIMIT_X, 240, 56, 'teal');
  const limit2 = prose("A trained model's cache\ncan't just be reshaped.", 90, -240, 64, 'red', {
    leading: 1.14,
  });
  const limit2b = prose(
    'Train for the new layout,\nor convert and train further.',
    90,
    -40,
    58,
    'dim',
    {
      leading: 1.14,
    },
  );
  const limit3 = prose('Then measure quality\non your own task.', 90, 180, 70, 'yellow', {
    leading: 1.14,
  });
  const sizeParts = [
    layoutEq,
    hypotheticalTag,
    headsAxis,
    ...sizeRows.flatMap((row) => [row.name, row.bar, row.size]),
  ];
  const limitLeft = [...limitGrids, ...limitHeads, ...limitWires, limitKV, gridsName, kvName];
  waiting([...limitLeft, limit2, limit2b, limit3]);
  decode.on('limits', () =>
    stage.play(
      fadeOut(sizeParts, {
        duration: 0.2,
      }),
      ...dimIn([...limitLeft, limit2, limit2b, limit3]).map((anim) => arrive(anim, 0.07)),
      {
        duration: 0.42,
      },
    ),
  );
  decode.on('own-scores', () =>
    stage.play(...lit([...limitGrids, ...limitHeads, gridsName]), {
      duration: 0.5,
    }),
  );
  decode.on('shrinks', () =>
    stage.play(...lit([...limitWires, limitKV, kvName]), {
      duration: 0.5,
    }),
  );
  decode.on('reshape', () =>
    stage.play(fade(limit2, 1), {
      duration: 0.4,
    }),
  );
  decode.on('train-new', () =>
    stage.play(fade(limit2b, 1), {
      duration: 0.4,
    }),
  );
  decode.on('measure', () =>
    stage.play(fade(limit3, 1), {
      duration: 0.4,
    }),
  );
  leave(decode, [...limitLeft, limit2, limit2b, limit3]);
}
