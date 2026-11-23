import assert from 'node:assert/strict';
import {
  Node,
  arrow,
  axes,
  par,
  draw,
  fade as fadeTo,
  fadeIn,
  indicate,
  lagged,
  rect,
  text,
  tex,
  write,
} from 'vizmatic/stage';
import { clearAxisNumbers, label, sceneHeading } from '../../../stage-lessons/kit.mjs';
import {
  LINEAR,
  brief,
  fadeOut,
  fade,
  f2,
  num,
  bmatrix,
  LEFT,
  prose,
  midProse,
  midMono,
  math,
  midMath,
  chipNode,
} from '../defaults.mjs';
import { Q, K, V, dot, project, SCORES } from '../model.mjs';

/** Every word asks, answers, and carries. */
export function buildVectors(stage, narration, { show, handOver }) {
  const vectors = narration.scene('vectors');
  sceneHeading(stage, vectors, narration.title('vectors'));
  const PLANE_SIZE = 780,
    PLANE_X = -450,
    PLANE_Y = 60;
  const plane = axes({
    x: [0, 1.2],
    y: [0, 1.2],
    width: PLANE_SIZE,
    height: PLANE_SIZE,
    xStep: 0.4,
    yStep: 0.4,
    grid: true,
    labelSize: 36,
    tips: false,
  }).at(PLANE_X, PLANE_Y);
  clearAxisNumbers(plane);
  const p = (x, y) => plane.world(x, y);
  const qs = Q[1],
    kb = K[0],
    ks = K[1];
  const queryArrow = arrow(p(0, 0), p(...qs), {
    stroke: 'yellow',
    width: 6,
    tip: 26,
  });
  const birdsKey = arrow(p(0, 0), p(...kb), {
    stroke: 'blue',
    width: 6,
    tip: 26,
  });
  const singKey = arrow(p(0, 0), p(...ks), {
    stroke: 'teal',
    width: 6,
    tip: 26,
  });
  const qLabel = tex('q_{\\text{sing}}', {
    size: 58,
    color: 'yellow',
  }).moveTo([p(...qs)[0] + 62, p(...qs)[1] - 30]);
  const bLabel = tex('k_{\\text{birds}}', {
    size: 58,
    color: 'blue',
  }).moveTo([p(...kb)[0] + 64, p(...kb)[1] + 62]);
  const sLabel = tex('k_{\\text{sing}}', {
    size: 58,
    color: 'teal',
  }).moveTo([p(...ks)[0] - 96, p(...ks)[1] - 14]);
  const COLUMN = 30;
  const roles = [
    ['query', 'What am I looking for?', 'yellow'],
    ['key', 'What can I be found by?', 'blue'],
    ['value', 'What do I hand over?', 'green'],
  ].map(([name, question, color], i) => {
    const node = new Node();
    const y = -290 + i * 250;
    node.add(
      label(name, COLUMN, y, {
        font: 'mono',
        size: 80,
        color,
      }),
      label(question, COLUMN, y + 92, {
        font: 'text-serif',
        size: 76,
        color: 'ink',
      }),
    );
    return node.opacity(0);
  });
  const triplet = (x, y, scale = 1) =>
    ['yellow', 'blue', 'green'].map((color, i) =>
      rect(26 * scale, 170 * scale, {
        radius: 6,
        fill: color,
        stroke: null,
      }).at(x + (i - 1) * 46 * scale, y),
    );
  const tripletBirds = triplet(-640, 10, 2.1),
    tripletSing = triplet(-250, 10, 2.1);
  const tripletNames = [
    text('Birds', {
      font: 'text-serif',
      size: 96,
      color: 'blue',
    }).at(-640, 290),
    text('sing', {
      font: 'text-serif',
      size: 96,
      color: 'teal',
    }).at(-250, 290),
  ];
  vectors.at(0.15, () =>
    stage.play(
      lagged(
        [...tripletBirds, ...tripletSing].map((node) =>
          fadeIn(node, {
            scale: 0.2,
          }),
        ),
        {
          lag: 0.18,
        },
      ),
      fadeIn(tripletNames),
      ...roles.map((node) => fade(node, 0.3)),
      {
        duration: 1.1,
      },
    ),
  );
  vectors.on('query', () =>
    stage.play(fade(roles[0], 1), {
      duration: 0.5,
    }),
  );
  vectors.on('key', () =>
    stage.play(fade(roles[1], 1), {
      duration: 0.5,
    }),
  );
  vectors.on('value', () =>
    stage.play(fade(roles[2], 1), {
      duration: 0.5,
    }),
  );
  // One state projects three ways. Each row of the diagram is computed from the state.
  const singState = [0, 1];
  const stateBirds = math('x_{\\text{birds}} = [1,\\ 0]', LEFT, -60, 60, 'blue');
  const stateSing = math('x_{\\text{sing}} = [0,\\ 1]', LEFT, 60, 60, 'teal');
  const ROWS_Y = [-210, 50, 310];
  const projections = [
    ['W_Q', Q, 'yellow', 'q'],
    ['W_K', K, 'blue', 'k'],
    ['W_V', V, 'green', 'v'],
  ].map(([name, W, color, letter], i) => {
    const matrix = midMath(
      `${name} = ${bmatrix(W.map((row) => row.map(num)))}`,
      -10,
      ROWS_Y[i],
      56,
      color,
    );
    const result = math(
      `${letter}_{\\text{sing}} = [${project(singState, W).map(num).join(',\\ ')}]`,
      340,
      ROWS_Y[i],
      64,
      letter === 'q' ? 'yellow' : 'teal',
    );
    const into = arrow([-480, 60], [-265, ROWS_Y[i]], {
      stroke: 'dim',
      width: 3,
      tip: 18,
    });
    const out = arrow([250, ROWS_Y[i]], [330, ROWS_Y[i]], {
      stroke: color,
      width: 3,
      tip: 18,
    });
    return {
      matrix,
      result,
      into,
      out,
    };
  });
  projections.forEach((row) => row.matrix.opacity(0));
  const seqReveal = (row) => par(fade(row.matrix, 1), fadeIn([row.into, row.out, row.result]));
  const projectionParts = projections.flatMap((row) => [row.matrix, row.result, row.into, row.out]);
  vectors.on('state', () =>
    stage.play(
      fadeOut([...tripletBirds, ...tripletSing, ...tripletNames], {
        duration: 0.3,
      }),
      ...roles.map((node) =>
        fade(node, 0, {
          duration: 0.25,
        }),
      ),
      brief(
        fadeIn([stateBirds, stateSing], {
          shift: [0, 10],
        }),
        0.35,
        0.22,
      ),
      ...projections.map((row) => brief(fade(row.matrix, 0.3), 0.35, 0.22)),
      {
        duration: 0.6,
      },
    ),
  );
  vectors.on('project', () =>
    stage.play(
      lagged(
        projections.map((row) => seqReveal(row)),
        {
          lag: 0.35,
        },
      ),
      {
        duration: 1.3,
      },
    ),
  );
  vectors.on('training', () =>
    stage.play(
      lagged(
        projections.map((row) =>
          indicate(row.matrix, {
            color: 'ink',
            scale: 1.05,
          }),
        ),
        {
          lag: 0.2,
        },
      ),
      {
        duration: 1,
      },
    ),
  );
  // Why three: scoring the states directly gives one number both ways. Learned matrices can split it.
  const DIRECT = dot([1, 0], [0, 1]);
  assert.equal(DIRECT, 0);
  const birdChip = chipNode('Birds', -470, 90, 'blue', {
      w: 280,
      h: 130,
      size: 76,
    }),
    singChip = chipNode('sing', 470, 90, 'teal', {
      w: 280,
      h: 130,
      size: 76,
    });
  const toward = arrow([-320, 50], [320, 50], {
      stroke: 'ink',
      width: 5,
      tip: 26,
      bend: -90,
    }),
    backward = arrow([320, 130], [-320, 130], {
      stroke: 'ink',
      width: 5,
      tip: 26,
      bend: -90,
    });
  const directTitle = midProse('Score the states directly', 0, -320, 62, 'dim');
  const directEq = midMath(
    'x_{\\text{birds}} \\cdot x_{\\text{sing}} = x_{\\text{sing}} \\cdot x_{\\text{birds}}',
    0,
    -215,
    84,
  );
  const directTop = midMono(f2(DIRECT), 0, -55, 88),
    directBottom = midMono(f2(DIRECT), 0, 245, 88);
  const directTag = midProse('The same number, both ways.', 0, 400, 66, 'red');
  const learnedTitle = midProse('Score through separate matrices', 0, -320, 62, 'dim');
  const learnedEq = midMath(
    'q_{\\text{birds}} \\cdot k_{\\text{sing}} \\ne q_{\\text{sing}} \\cdot k_{\\text{birds}}',
    0,
    -215,
    84,
    'yellow',
  );
  const learnedTop = midMono(f2(SCORES[0][1]), 0, -55, 88, 'yellow'),
    learnedBottom = midMono(f2(SCORES[1][0]), 0, 245, 88, 'yellow');
  const learnedTag = midProse(
    'What a word wants can differ from what it offers.',
    0,
    370,
    60,
    'green',
  );
  const handsOver = midProse('And what it hands over can differ from both.', 0, 455, 56, 'green');
  handOver(
    vectors,
    'why-three',
    [stateBirds, stateSing, ...projectionParts],
    () =>
      stage.play(
        brief(fadeIn([directTitle, directEq, birdChip, singChip]), 0.3),
        brief(
          draw(toward, {
            lag: 1,
          }),
          0.3,
          0.15,
        ),
        brief(
          draw(backward, {
            lag: 1,
          }),
          0.3,
          0.15,
        ),
      ),
    0.22,
    0.12,
  );
  vectors.on('same-both', () =>
    stage.play(
      fadeIn([directTop, directBottom, directTag], {
        shift: [0, 8],
      }),
      {
        duration: 0.5,
      },
    ),
  );
  vectors.on('separate', () => {
    stage.play(fadeOut([directTitle, directEq, directTop, directBottom, directTag]), {
      duration: 0.25,
    });
    stage.play(
      fadeIn([learnedTitle, learnedEq, learnedTop, learnedBottom, learnedTag], {
        shift: [0, 8],
      }),
      {
        duration: 0.45,
      },
    );
  });
  show(vectors, 'hands-over', handsOver);
  // The numbers, drawn on a plane.
  const toyTag = prose('Made up, and small enough to draw.', COLUMN, 450, 50, 'dim');
  // Old text leaves first, so the axes never draw through it. The arrows linger, so the frame is never empty.
  vectors.on('numbers', () =>
    stage.play(
      fadeOut(birdChip, {
        duration: 0.34,
      }),
    ),
  );
  handOver(
    vectors,
    'numbers',
    [toward, backward, singChip],
    () =>
      stage.play(
        draw(plane.grid, {
          lag: 0.02,
        }),
        draw(plane.lines),
        fadeIn(plane.numbers),
        ...roles.map((node) => brief(fadeTo(node, 1), 0.2, 0.04, LINEAR)),
        brief(fadeIn(toyTag), 0.2, 0.04, LINEAR),
        {
          duration: 0.8,
        },
      ),
    0.16,
    0.08,
  );
  vectors.on('numbers', () =>
    stage.play(
      fadeOut([learnedTitle, learnedEq, learnedTop, learnedBottom, learnedTag, handsOver], {
        duration: 0.14,
      }),
    ),
  );
  vectors.on('query-arrow', () =>
    stage.play(
      draw(queryArrow, {
        lag: 1,
      }),
      write(qLabel),
      {
        duration: 0.9,
      },
    ),
  );
  vectors.on('birds-key', () =>
    stage.play(
      draw(birdsKey, {
        lag: 1,
      }),
      write(bLabel),
      {
        duration: 0.8,
      },
    ),
  );
  vectors.on('sing-key', () =>
    stage.play(
      draw(singKey, {
        lag: 1,
      }),
      write(sLabel),
      {
        duration: 0.8,
      },
    ),
  );
  return {
    plane,
    p,
    qs,
    ks,
    queryArrow,
    birdsKey,
    singKey,
    qLabel,
    bLabel,
    sLabel,
    COLUMN,
    roles,
    triplet,
    toyTag,
  };
}
