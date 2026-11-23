import {
  arrow,
  draw,
  dynamic,
  fadeIn,
  indicate,
  lagged,
  line,
  linear,
  Node,
  rect,
  smoother,
  tex,
  to,
  write,
} from 'vizmatic/stage';
import { chip, sceneHeading } from '../../../stage-lessons/kit.mjs';
import { blocksFor } from '../model.mjs';

/** Keep the live batch moving. */
export function buildBatching(
  stage,
  narration,
  {
    T,
    M,
    S,
    place,
    fadeOut,
    bar,
    frameBar,
    slotBlock,
    clearScene,
    arrive,
    clearFirst,
    handoff,
  },
) {
  const batching = narration.scene('batching');
  sceneHeading(stage, batching, narration.title('batching'));
  const G_LEFT = -660,
    G_W = 1500,
    G_RIGHT = G_LEFT + G_W,
    stepX = (step) => G_LEFT + (step * G_W) / 200;
  const ganttName = (name, y, color) =>
    M(name, {
      size: 58,
      color,
    }).at(G_LEFT - 90, y);
  // A bar between two decode steps. It draws only as far as `clock` has reached.
  const stepBar = (y, color, from, until, clock, alpha = 0.92) =>
    dynamic(() => {
      const now = Math.min(clock.value, until);
      if (now <= from + 0.2) return null;
      return rect(stepX(now) - stepX(from), 78, {
        radius: 8,
        fill: color,
        stroke: null,
      })
        .opacity(alpha)
        .at((stepX(from) + stepX(now)) / 2, y);
    }).zIndex(1);
  const staticStep = stage.value(0);
  const staticTitle = place(
    T('Static batching: the batch runs until everyone is done', {
      size: 54,
      color: 'dim',
    }),
    G_LEFT - 140,
    -380,
  );
  const staticTracks = [-280, -180].map((y) => frameBar(G_LEFT, y, G_W, 78));
  const staticA = stepBar(-280, 'blue', 0, 20, staticStep),
    staticB = stepBar(-180, 'orange', 0, 200, staticStep),
    staticIdle = stepBar(-280, 'red', 20, 200, staticStep, 0.42);
  const staticNames = [ganttName('A', -280, 'blue'), ganttName('B', -180, 'orange')];
  const staticAxis = [
    [0, '0'],
    [20, '20'],
    [200, '200 steps'],
  ].map(([step, name]) =>
    M(name, {
      size: 38,
      color: 'dim',
    }).at(Math.min(stepX(step), G_RIGHT - 60), -112),
  );
  const staticNote = M(`${200 - 20} idle steps for A's place`, {
    size: 44,
    color: 'ink',
  })
    .at((stepX(20) + stepX(200)) / 2, -280)
    .zIndex(2);
  const needA = place(
      M('A needs 20 steps', {
        size: 60,
        color: 'blue',
      }),
      -800,
      60,
    ),
    needB = place(
      M('B needs 200 steps', {
        size: 60,
        color: 'orange',
      }),
      -800,
      150,
    );
  // Fixed to its left edge, so a new digit grows to the right and the word holds still.
  const stepBig = dynamic(() =>
    place(
      M(`step ${Math.round(staticStep.value / 5) * 5}`, {
        size: 170,
        color: 'ink',
      }),
      -8,
      110,
    ),
  );
  const aDone = place(
    T('A is done at step 20, and its place sits idle', {
      size: 70,
      color: 'blue',
    }),
    -800,
    310,
  );
  batching.at(0.05, () =>
    stage.play(
      fadeIn([
        staticTitle,
        ...staticNames,
        ...staticAxis,
        ...staticTracks,
        staticA,
        staticB,
        staticIdle,
        stepBig,
      ]),
      {
        duration: 0.45,
      },
    ),
  );
  batching.on('a-twenty', () =>
    stage.play(
      fadeIn(needA, {
        shift: [12, 0],
      }),
      {
        duration: 0.4,
      },
    ),
  );
  batching.on('b-200', () =>
    stage.play(
      fadeIn(needB, {
        shift: [12, 0],
      }),
      {
        duration: 0.4,
      },
    ),
  );
  const staticRun = batching.cue('idle').start - batching.cue('static').start + 1;
  batching.on('static', () =>
    stage.play(staticStep.to(200), {
      duration: staticRun,
      ease: linear,
    }),
  );
  stage.at(batching.cue('static').start + staticRun * 0.1, () =>
    stage.play(
      fadeIn(aDone, {
        shift: [0, 8],
      }),
      {
        duration: 0.4,
      },
    ),
  );
  batching.on('idle', () =>
    stage.play(fadeIn(staticNote), {
      duration: 0.5,
    }),
  );
  const contStep = stage.value(0);
  const contTitle = place(
    T('Continuous batching: look again every iteration', {
      size: 54,
      color: 'green',
    }),
    G_LEFT - 140,
    10,
  );
  const contTracks = [100, 200].map((y) => frameBar(G_LEFT, y, G_W, 78));
  const contA = stepBar(100, 'blue', 0, 20, contStep),
    contB = stepBar(200, 'orange', 0, 200, contStep);
  const contNames = [ganttName('A', 100, 'blue'), ganttName('B', 200, 'orange')];
  const contFollowers = [
    ['C', 26, 92, 'green'],
    ['D', 98, 150, 'teal'],
    ['E', 156, 200, 'purple'],
  ].flatMap(([name, from, until, color]) => [
    stepBar(100, color, from, until, contStep),
    dynamic(() =>
      contStep.value < (from + until) / 2 + 6
        ? null
        : S(name, {
            size: 46,
            color: 'bg',
            weight: 600,
          }).at((stepX(from) + stepX(until)) / 2, 100),
    ).zIndex(2),
  ]);
  const lookLine = dynamic(() =>
    contStep.value >= 199.5
      ? null
      : line([stepX(contStep.value), 52], [stepX(contStep.value), 248], {
          stroke: 'yellow',
          width: 4,
        }),
  ).zIndex(3);
  const eosTick = line([stepX(20), 52], [stepX(20), 290], {
    stroke: 'blue',
    width: 3,
  }).zIndex(2);
  const eosTag = place(
    M('A: end of sequence', {
      size: 40,
      color: 'blue',
    }),
    stepX(20) + 14,
    290,
  );
  const orcaNote = T('Orca made this explicit', {
    size: 56,
    color: 'dim',
  }).at(0, 400);
  const leavesAt = batching.cue('leaves').start - batching.cue('continuous').start;
  batching.on('continuous', () => {
    handoff(
      [needA, needB, stepBig, aDone],
      () =>
        arrive(
          fadeIn([
            contTitle,
            ...contNames,
            ...contTracks,
            contA,
            contB,
            lookLine,
            ...contFollowers,
          ]),
          {
            duration: 0.4,
          },
        ),
      clearFirst,
    );
    stage.play(contStep.to(20), {
      duration: Math.max(0.2, leavesAt - 0.36),
      ease: linear,
    });
  });
  batching.on('leaves', () =>
    stage.play(fadeIn(eosTick), fadeIn(eosTag), {
      duration: 0.4,
    }),
  );
  batching.on('joins', () =>
    stage.play(contStep.to(200), {
      duration: batching.cue('orca').start - batching.cue('joins').start + 1,
      ease: linear,
    }),
  );
  batching.on('orca', () =>
    stage.play(
      fadeIn(orcaNote, {
        shift: [0, 8],
      }),
      {
        duration: 0.5,
      },
    ),
  );
  const ganttParts = [
    ...staticTracks,
    staticTitle,
    staticA,
    staticB,
    staticIdle,
    ...staticNames,
    ...staticAxis,
    staticNote,
    contTitle,
    ...contTracks,
    contA,
    contB,
    ...contNames,
    ...contFollowers,
    lookLine,
    eosTick,
    eosTag,
    orcaNote,
  ];
  // The same requests as block counts, in a pool of blocks drawn with their sixteen token slots.
  const B_LEFT = -760,
    B_CELL = 190,
    B_Y = -130,
    B_LOW = 72;
  const blockSpot = (index) => [B_LEFT + 85 + (index % 8) * B_CELL, index < 8 ? B_Y : B_LOW];
  const emptyBlocks = Array.from(
    {
      length: 16,
    },
    (_, i) =>
      slotBlock(16, 0, 'dim', {
        columns: 4,
      }).at(...blockSpot(i)),
  );
  const rowBlocks = (tokens2, color, firstIndex) =>
    Array.from(
      {
        length: blocksFor(tokens2, 16),
      },
      (_, i) =>
        slotBlock(16, Math.min(16, tokens2 - i * 16), color, {
          columns: 4,
        })
          .at(...blockSpot(firstIndex + i))
          .zIndex(1),
    );
  const aBlocks = rowBlocks(64, 'blue', 0),
    bBlocks = rowBlocks(10, 'orange', 4),
    cBlocks = rowBlocks(20, 'green', 0);
  const ruleTex = tex(
    '\\text{blocks} = \\left\\lceil \\frac{\\text{tokens}}{16} \\right\\rceil',
    {
      size: 64,
      color: 'yellow',
    },
  )
    .moveTo([0, -335])
    .alignTo([-800, 0], 'left');
  const aTag = place(
    M('A: 64 tokens, 4 blocks', {
      size: 46,
      color: 'blue',
    }),
    -800,
    250,
  );
  const bTag = place(
    M('B: 10 tokens, 1 block', {
      size: 46,
      color: 'orange',
    }),
    -800,
    320,
  );
  const cTag = place(
    M('C: 20 tokens, 2 blocks', {
      size: 46,
      color: 'green',
    }),
    -800,
    390,
  );
  const pendingTag = (name, tokens, color, y) =>
    place(M(`${name}: ${tokens} tokens, ? blocks`, { size: 46, color }), -800, y);
  const aPending = pendingTag('A', 64, 'blue', 250),
    bPending = pendingTag('B', 10, 'orange', 320),
    cPending = pendingTag('C', 20, 'green', 390);
  const blockCount = stage.value(5);
  const inUse = dynamic(() =>
    M(`in use: ${Math.round(blockCount.value)}`, {
      size: 120,
      color: 'ink',
    }).at(420, 330),
  );
  const batchPoolTag = place(
    M('A small example pool: 16 blocks', {
      size: 38,
      color: 'dim',
    }),
    190,
    -380,
  );
  // The voice now describes a fresh moment, so the charts above do not set B's size here.
  const snapshotTag = place(
    M('New snapshot, made-up sizes', {
      size: 38,
      color: 'yellow',
    }),
    190,
    -325,
  );
  batching.on('count', () =>
    handoff(ganttParts, () =>
      arrive(fadeIn(emptyBlocks), fadeIn(batchPoolTag), fadeIn(snapshotTag), {
        duration: 0.4,
      }),
    ),
  );
  batching.on('rule', () =>
    stage.play(write(ruleTex), {
      duration: 0.7,
    }),
  );
  batching.on('a-four', () => stage.play(fadeIn(aPending), { duration: 0.4 }));
  batching.after('a-four', () =>
    stage.play(
      fadeOut(aPending, { duration: 0.2 }),
      lagged(
        aBlocks.map((node) =>
          fadeIn(node, {
            scale: 0.85,
          }),
        ),
        {
          lag: 0.3,
        },
      ),
      fadeIn(aTag),
      {
        duration: 0.7,
      },
    ),
  );
  batching.on('b-one', () => stage.play(fadeIn(bPending), { duration: 0.4 }));
  batching.after('b-one', () =>
    stage.play(
      fadeOut(bPending, { duration: 0.2 }),
      fadeIn(bBlocks, {
        scale: 0.85,
      }),
      fadeIn(bTag),
      {
        duration: 0.5,
      },
    ),
  );
  batching.after('five', () =>
    stage.play(fadeIn(inUse), {
      duration: 0.35,
    }),
  );
  batching.on('back', () =>
    stage.play(
      fadeOut([...aBlocks, aTag], {
        shift: [0, -20],
      }),
      blockCount.to(1),
      {
        duration: 0.6,
      },
    ),
  );
  batching.on('c-two', () => stage.play(fadeIn(cPending), { duration: 0.4 }));
  batching.after('c-two', () =>
    stage.play(
      fadeOut(cPending, { duration: 0.2 }),
      lagged(
        cBlocks.map((node) =>
          fadeIn(node, {
            scale: 0.85,
          }),
        ),
        {
          lag: 0.3,
        },
      ),
      fadeIn(cTag),
      blockCount.to(3),
      {
        duration: 0.6,
      },
    ),
  );
  batching.on('three', () =>
    stage.play(
      indicate(inUse, {
        color: 'yellow',
        scale: 1.08,
      }),
      {
        duration: 0.5,
      },
    ),
  );
  const countParts = [
    batchPoolTag,
    snapshotTag,
    ruleTex,
    ...emptyBlocks,
    ...bBlocks,
    ...cBlocks,
    bTag,
    cTag,
    inUse,
  ];
  // Together they fit well, yet each works alone, and neither one promises a deadline.
  const pairNote = T('Paging and continuous batching fit well together', {
    size: 66,
    color: 'ink',
  }).at(0, -270);
  const pairPaging = chip('Paging', {
    w: 430,
    h: 190,
    color: 'blue',
    size: 70,
    font: 'text-serif',
  }).at(-370, 20);
  const pairCont = chip('Continuous batching', {
    w: 780,
    h: 190,
    color: 'green',
    size: 70,
    font: 'text-serif',
  }).at(350, 20);
  const pairPlus = M('+', {
    size: 80,
    color: 'ink',
  }).at(-97, 20);
  const pairAlone = [
    T('works alone', {
      size: 54,
      color: 'blue',
    }).at(-560, 170),
    T('works alone', {
      size: 54,
      color: 'green',
    }).at(460, 170),
  ];
  const pairDeadline = chip('The next deadline: not promised by either', {
    w: 1340,
    h: 130,
    color: 'red',
    size: 60,
    font: 'text-serif',
  }).at(0, 350);
  batching.onBeat(3, () =>
    handoff(countParts, () =>
      arrive(
        fadeIn(pairNote),
        fadeIn([pairPaging, pairCont], {
          scale: 0.94,
        }),
        fadeIn(pairPlus),
        {
          duration: 0.5,
        },
      ),
    ),
  );
  batching.on('both', () =>
    stage.play(
      indicate(pairPlus, {
        color: 'yellow',
        scale: 1.3,
      }),
      {
        duration: 0.7,
      },
    ),
  );
  batching.on('neither-req', () =>
    stage.play(
      fadeOut(pairPlus, {
        duration: 0.2,
      }),
      to(pairPaging, (node) => node.at(-560, 20)),
      to(pairCont, (node) => node.at(460, 20)),
      fadeIn(pairAlone),
      {
        duration: 0.8,
        ease: smoother,
      },
    ),
  );
  batching.on('deadline', () =>
    stage.play(
      fadeIn(pairDeadline, {
        shift: [0, 14],
      }),
      {
        duration: 0.5,
      },
    ),
  );
  // The trap: blocks look fine, and the first token is still late. Values are illustrative.
  const TR_LEFT = -780,
    TR_W = 980,
    TR_BASE = 200,
    TR_TOP = -240,
    trX = (t) => TR_LEFT + t * TR_W;
  const spikes = [0.28, 0.72];
  const curve = (t) =>
    70 + spikes.reduce((sum, at2) => sum + 330 * Math.exp(-((t - at2) ** 2) / 0.0012), 0);
  const trReveal = stage.value(0);
  const trLine = dynamic(() => {
    const points = [];
    for (let i = 0; i <= 160 * trReveal.value; i += 1)
      points.push([trX(i / 160), TR_BASE - curve(i / 160)]);
    if (points.length < 2) return null;
    const node = new Node();
    for (let i = 1; i < points.length; i += 1)
      node.add(
        line(points[i - 1], points[i], {
          stroke: 'red',
          width: 5,
        }),
      );
    return node;
  });
  const trAxes = [
    line([TR_LEFT, TR_BASE], [TR_LEFT + TR_W, TR_BASE], {
      stroke: 'dim',
      width: 3,
    }),
    line([TR_LEFT, TR_BASE], [TR_LEFT, TR_TOP], {
      stroke: 'dim',
      width: 3,
    }),
  ];
  const trName = place(
    S('time to first token (illustrative)', {
      size: 40,
      color: 'red',
    }),
    TR_LEFT + 14,
    TR_TOP - 40,
  );
  const trTime = S('time', {
    size: 40,
    color: 'dim',
  }).at(TR_LEFT + TR_W / 2, TR_BASE + 44);
  const promptTags = spikes.map((at2) =>
    M('huge prompt', {
      size: 38,
      color: 'yellow',
    }).at(trX(at2), TR_BASE + 44 + 44),
  );
  const packTitle = place(
    S('Block usage', {
      size: 44,
      color: 'dim',
    }),
    340,
    -210,
  );
  const packBar = frameBar(340, -130, 540, 66),
    packFill = bar(340, -130, 540 * 0.92, 66, 'green');
  const packName = place(
    T('Well packed', {
      size: 56,
      color: 'green',
    }),
    340,
    -40,
  );
  batching.on('trap', () =>
    handoff([pairNote, pairPaging, pairCont, ...pairAlone, pairDeadline], () =>
      arrive(fadeIn([...trAxes, trName, trTime, packTitle, packBar, packFill, packName]), {
        duration: 0.45,
      }),
    ),
  );
  batching.on('spike', () =>
    stage.play(
      fadeIn(trLine),
      trReveal.to(1, {
        duration: 2,
        ease: linear,
      }),
      lagged(
        promptTags.map((node) => fadeIn(node)),
        {
          lag: 0.6,
        },
      ),
      {
        duration: 2,
      },
    ),
  );
  const fixNote = place(
    T('Packing does not\ncompute the prompt', {
      size: 48,
      color: 'ink',
      leading: 1.2,
    }),
    340,
    60,
  );
  batching.on('cant-fix', () =>
    stage.play(fadeIn(fixNote), {
      duration: 0.5,
    }),
  );
  const competeNote = place(
    T('The prompt competes with\neveryone already decoding', {
      size: 48,
      color: 'yellow',
      leading: 1.2,
    }),
    340,
    200,
  );
  batching.on('compete', () =>
    stage.play(fadeIn(competeNote), {
      duration: 0.5,
    }),
  );
  const checkNote = place(
    T('Check queueing and prefill first', {
      size: 58,
      color: 'ink',
    }),
    -280,
    440,
  );
  batching.on('check', () =>
    stage.play(write(checkNote), {
      duration: 0.7,
    }),
  );
  const trapParts = [
    trLine,
    ...trAxes,
    trName,
    trTime,
    ...promptTags,
    packTitle,
    packBar,
    packFill,
    packName,
    fixNote,
    competeNote,
    checkNote,
  ];
  // Chunked prefill: the same long prompt, cut across several iterations, beside running decodes.
  const IT_LEFT = -800,
    IT_W = 266,
    IT_COUNT = 6,
    IT_Y = -130;
  const iterX = (i) => IT_LEFT + i * IT_W;
  const iterFrames = Array.from(
    {
      length: IT_COUNT,
    },
    (_, i) =>
      rect(IT_W - 12, 300, {
        radius: 12,
        fill: 'surface',
        stroke: 'dim',
        width: 1.5,
      }).at(iterX(i) + IT_W / 2, IT_Y),
  );
  const iterNames = Array.from(
    {
      length: IT_COUNT,
    },
    (_, i) =>
      M(`iter ${i + 1}`, {
        size: 38,
        color: 'dim',
      }).at(iterX(i) + IT_W / 2, IT_Y - 180),
  );
  // Each iteration stacks its decodes and a piece of the prompt up to one cap: the token budget.
  // The last piece is what remains of the prompt, so it stops short, and iteration 6 has none.
  const IT_BASE = 6,
    IT_CAP = -232,
    DECODE_H = 84,
    IT_GAP = 4,
    FULL_CHUNK = IT_BASE - DECODE_H - IT_GAP - IT_CAP - IT_GAP,
    LAST_CHUNK = 78;
  const iterDecode = Array.from(
    {
      length: IT_COUNT,
    },
    (_, i) => bar(iterX(i) + 22, IT_BASE - DECODE_H / 2, IT_W - 56, DECODE_H, 'green'),
  );
  const iterChunks = Array.from(
    {
      length: IT_COUNT - 1,
    },
    (_, i) => {
      const height = i === IT_COUNT - 2 ? LAST_CHUNK : FULL_CHUNK;
      return bar(
        iterX(i) + 22,
        IT_BASE - DECODE_H - IT_GAP - height / 2,
        IT_W - 56,
        height,
        'yellow',
      );
    },
  );
  const chunkKey = [
    place(
      S('running decodes', {
        size: 42,
        color: 'green',
      }),
      IT_LEFT,
      IT_Y + 200,
    ),
    place(
      S('one long prompt, in pieces', {
        size: 42,
        color: 'yellow',
      }),
      IT_LEFT + 470,
      IT_Y + 200,
    ),
  ];
  batching.on('chunked', () =>
    handoff(trapParts, () =>
      arrive(
        lagged(
          iterFrames.map((node) => fadeIn(node)),
          {
            lag: 0.05,
          },
        ),
        fadeIn(iterNames),
        lagged(
          iterDecode.map((node) => fadeIn(node)),
          {
            lag: 0.05,
          },
        ),
        fadeIn(chunkKey[0]),
        {
          duration: 0.6,
        },
      ),
    ),
  );
  batching.on('pieces', () =>
    stage.play(
      lagged(
        iterChunks.map((node) =>
          fadeIn(node, {
            shift: [0, 16],
          }),
        ),
        {
          lag: 0.25,
        },
      ),
      fadeIn(chunkKey[1]),
      {
        duration: 0.9,
      },
    ),
  );
  const iterCaps = Array.from(
    {
      length: IT_COUNT,
    },
    (_, i) =>
      line([iterX(i) + 14, IT_CAP], [iterX(i) + IT_W - 22, IT_CAP], {
        stroke: 'orange',
        width: 7,
      }).zIndex(2),
  );
  const budgetName = place(
    S('cap: token budget per iteration', {
      size: 42,
      color: 'orange',
    }),
    IT_LEFT + 1030,
    IT_Y + 200,
  );
  batching.on('budget', () =>
    stage.play(
      lagged(
        iterCaps.map((node) => draw(node)),
        {
          lag: 0.2,
        },
      ),
      fadeIn(budgetName),
      {
        duration: 0.7,
      },
    ),
  );
  const disturbNote = place(
    T('Chunks can still disturb running requests, so measure', {
      size: 50,
      color: 'dim',
    }),
    -800,
    150,
  );
  batching.on('disturb', () =>
    stage.play(
      fadeIn(disturbNote),
      lagged(
        iterDecode.slice(0, -1).map((node) =>
          indicate(node, {
            color: 'red',
            scale: 1.04,
          }),
        ),
        {
          lag: 0.1,
        },
      ),
      {
        duration: 0.7,
      },
    ),
  );
  const machines = [
    ['prefill machine', 'yellow', -450],
    ['decode machine', 'green', 450],
  ].map(([name, color, x]) => {
    const node = new Node();
    node.add(
      rect(580, 170, {
        radius: 16,
        fill: 'surface',
        stroke: color,
        width: 3,
      }),
      S(name, {
        size: 48,
        color,
      }),
    );
    return node.at(x, 345);
  });
  batching.on('separate', () =>
    stage.play(
      lagged(
        machines.map((node) =>
          fadeIn(node, {
            scale: 0.92,
          }),
        ),
        {
          lag: 0.3,
        },
      ),
      {
        duration: 0.6,
      },
    ),
  );
  const stateArrow = arrow([-150, 345], [150, 345], {
    stroke: 'red',
    width: 6,
    tip: 26,
  });
  const stateName = M('move state', {
    size: 38,
    color: 'red',
  }).at(0, 297);
  batching.on('moving', () =>
    stage.play(draw(stateArrow), fadeIn(stateName), {
      duration: 0.6,
    }),
  );
  clearScene(batching, [
    ...iterFrames,
    ...iterNames,
    ...iterDecode,
    ...iterChunks,
    ...chunkKey,
    ...iterCaps,
    budgetName,
    disturbNote,
    ...machines,
    stateArrow,
    stateName,
  ]);
}
