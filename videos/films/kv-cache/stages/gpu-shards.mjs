import {
  draw,
  fadeIn,
  indicate,
  lagged,
  line,
  Node,
  rect,
  smoother,
  to,
  write,
} from 'vizmatic/stage';
import { chip } from '../../../stage-lessons/kit.mjs';
import { HEADS, TABLE } from '../model.mjs';
export function buildGpuShards(
  stage,
  shrink,
  { T, M, S, place, LINEAR, brief, fadeOut, pulse, arrive, handoff },
  { heading1, heading2, RQ_X },
  { keepParts },
) {
  // Eight key value heads across two GPUs, with logical blocks lined up on both.
  const GPU_X = [-450, 450],
    GPU_Y = -105,
    HEAD_SIDE = 88;
  const gpuBoxes = GPU_X.map((x, i) => {
    const node = new Node();
    node.add(
      rect(800, 470, {
        radius: 18,
        fill: 'surface',
        stroke: i ? 'orange' : 'blue',
        width: 3,
      }).at(x, GPU_Y),
      M(`GPU ${i + 1}`, {
        size: 46,
        color: i ? 'orange' : 'blue',
      }).at(x - 300, GPU_Y - 195),
    );
    return node;
  });
  const gpuHeads = Array.from(
    {
      length: HEADS,
    },
    (_, i) =>
      rect(HEAD_SIDE, HEAD_SIDE, {
        radius: 10,
        fill: 'teal',
        stroke: null,
      }).at(-345 + i * 99, 215),
  );
  const headTargets = Array.from(
    {
      length: HEADS,
    },
    (_, i) => [GPU_X[i < HEADS / 2 ? 0 : 1] - 210 + (i % (HEADS / 2)) * 140 + 70, GPU_Y - 110],
  );
  const gpuHeadNames = place(
    S('8 key value heads', {
      size: 44,
      color: 'teal',
    }),
    -345 - 40,
    300,
  );
  const fourEachNote = place(
    M(`${HEADS} heads ÷ 2 GPUs = ${HEADS / 2} each`, {
      size: 50,
      color: 'ink',
    }),
    RQ_X,
    190,
  );
  const allowNote = place(
    T('if the model and the runtime allow it', {
      size: 50,
      color: 'dim',
    }),
    60,
    190,
  );
  const tableRowsOf = (x) =>
    TABLE.map((block, logical) =>
      chip(`${logical} → ${block}`, {
        w: 280,
        h: 72,
        color: 'yellow',
        size: 46,
      }).at(x, GPU_Y + 40 + logical * 100),
    );
  const gpuTables = GPU_X.map(tableRowsOf);
  const alignLines = TABLE.map((_, logical) =>
    line(
      [GPU_X[0] + 146, GPU_Y + 40 + logical * 100],
      [GPU_X[1] - 146, GPU_Y + 40 + logical * 100],
      {
        stroke: 'yellow',
        width: 4,
      },
    ).dash([14, 10]),
  );
  const sameName = place(
    T('Original vLLM: the same block numbers on every GPU', {
      size: 50,
      color: 'yellow',
    }),
    RQ_X,
    268,
  );
  const repName = place(
    T('Some layouts replicate:', {
      size: 54,
      color: 'red',
    }),
    RQ_X,
    376,
  );
  const repBoxes = [90, 510].map((x) => {
    const node = new Node();
    node.add(
      rect(390, 120, {
        radius: 14,
        fill: 'surface',
        stroke: 'red',
        width: 3,
      }).at(x + 195, 376),
    );
    for (let i = 0; i < HEADS; i += 1)
      node.add(
        rect(38, 76, {
          radius: 6,
          fill: 'teal',
          stroke: null,
        }).at(x + 34 + i * 46, 376),
      );
    return node;
  });
  const repSub = place(
    T('Check what each GPU really holds', {
      size: 50,
      color: 'ink',
    }),
    RQ_X,
    468,
  );
  shrink.on('split', () =>
    handoff([...keepParts, heading1], () =>
      arrive(
        write(heading2),
        fadeIn(gpuBoxes),
        lagged(
          gpuHeads.map((node) =>
            fadeIn(node, {
              scale: 0.8,
            }),
          ),
          {
            lag: 0.1,
          },
        ),
        fadeIn(gpuHeadNames),
        {
          duration: 0.8,
        },
      ),
    ),
  );
  shrink.on('four-each', () =>
    stage.play(indicate(gpuHeadNames, { color: 'teal', scale: 1.04 }), { duration: 0.7 }),
  );
  shrink.after('four-each', () =>
    stage.play(
      fadeOut(gpuHeadNames, {
        duration: 0.2,
      }),
      ...gpuHeads.map((node, i) => to(node, (moved) => moved.at(...headTargets[i]))),
      fadeIn(fourEachNote),
      fadeIn(allowNote),
      {
        duration: 0.9,
        ease: smoother,
      },
    ),
  );
  shrink.on('aligned', () =>
    stage.play(
      lagged(
        [...gpuTables[0], ...gpuTables[1]].map((node) =>
          fadeIn(node, {
            scale: 0.92,
          }),
        ),
        {
          lag: 0.2,
        },
      ),
      lagged(
        alignLines.map((node) => draw(node)),
        {
          lag: 0.3,
        },
      ),
      {
        duration: 0.8,
      },
    ),
  );
  shrink.on('same-numbers', () =>
    stage.play(
      fadeIn(sameName),
      lagged(
        [...gpuTables[0], ...gpuTables[1]].map((node) => pulse(node, 1.05)),
        {
          lag: 0.1,
        },
      ),
      {
        duration: 0.7,
      },
    ),
  );
  shrink.on('own-share', () =>
    stage.play(
      lagged(
        gpuHeads.map((node) =>
          indicate(node, {
            color: 'teal',
            scale: 1.1,
          }),
        ),
        {
          lag: 0.1,
        },
      ),
      {
        duration: 0.9,
      },
    ),
  );
  shrink.on('replicate', () =>
    stage.play(
      brief(fadeOut([...gpuTables.flat(), ...alignLines, sameName]), 0.2, 0, LINEAR),
      brief(fadeIn(repName), 0.3, 0.16),
      lagged(
        repBoxes.map((node) =>
          fadeIn(node, {
            shift: [-12, 0],
          }),
        ),
        {
          lag: 0.3,
        },
      ),
      fadeIn(repSub),
      {
        duration: 0.7,
      },
    ),
  );
  const gpuParts = [
    ...gpuBoxes,
    ...gpuHeads,
    fourEachNote,
    allowNote,
    ...gpuTables.flat(),
    ...alignLines,
    sameName,
    repName,
    ...repBoxes,
    repSub,
  ];
  return {
    gpuParts,
  };
}
