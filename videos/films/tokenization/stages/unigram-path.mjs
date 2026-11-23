import assert from 'node:assert/strict';
import {
  Node,
  arrow,
  draw,
  fade,
  fadeIn,
  indicate,
  lagged,
  line,
  rect,
  tex,
  text,
  write,
} from 'vizmatic/stage';
import { chip, sceneHeading } from '../../../stage-lessons/kit.mjs';
import { LINEAR, brief, fadeOut, leftText } from '../defaults.mjs';
import { P, PATHS, LOWERED, logOf, BEST } from '../model.mjs';

/** Unigram picks the best complete path. */
export function buildUnigramPath(stage, narration, { clearAtEnd, HOME, openOn, pullTo }) {
  /** Text as a row of tiles, with each candidate piece drawn as an arc over the boundaries it spans. */
  const buildLattice = ({
    x0,
    step,
    y,
    chars,
    pieces,
    tileSize = 72,
    labelSize = 44,
    tileH = 104,
  }) => {
    const bx = (i) => x0 + i * step;
    const tiles = chars.map((ch, i) =>
      chip(ch, {
        w: step - 12,
        h: tileH,
        size: tileSize,
        color: 'blue',
      }).at(x0 + (i + 0.5) * step, y),
    );
    const arcs = {},
      labels = {},
      lit = {};
    for (const piece of pieces) {
      const up = piece.bend < 0,
        sign = up ? -1 : 1,
        start = [bx(piece.from) + 8, y + sign * (tileH / 2 + 6)],
        end = [bx(piece.to) - 8, y + sign * (tileH / 2 + 6)];
      arcs[piece.id] = arrow(start, end, {
        stroke: 'dim',
        width: 3,
        tip: 18,
        bend: piece.bend,
      });
      lit[piece.id] = arrow(start, end, {
        stroke: 'yellow',
        width: 6,
        tip: 24,
        bend: piece.bend,
      }).zIndex(1);
      const apex = y + sign * (tileH / 2 + 6 + Math.abs(piece.bend) / 2 + labelSize * 0.86);
      labels[piece.id] = text(piece.label, {
        font: 'mono',
        size: labelSize,
        color: 'ink',
      }).at((bx(piece.from) + bx(piece.to)) / 2 + (piece.shift ?? 0), apex);
    }
    return {
      tiles,
      arcs,
      labels,
      lit,
      bx,
      all: [...tiles, ...Object.values(arcs), ...Object.values(labels)],
    };
  };
  const pad2 = (value) => value.toFixed(2).replace(/^0/, '');
  const LATTICE_PIECES = (bends) => [
    {
      id: 'whole',
      from: 0,
      to: 5,
      bend: bends[0],
      label: `▁rain ${pad2(P.whole)}`,
    },
    {
      id: 'ra',
      from: 1,
      to: 3,
      bend: bends[1],
      label: `ra ${pad2(P.ra)}`,
    },
    {
      id: 'in',
      from: 3,
      to: 5,
      bend: bends[1],
      label: `in ${pad2(P.in)}`,
      shift: -50,
    },
    {
      id: 'marker',
      from: 0,
      to: 1,
      bend: bends[2],
      label: `▁ ${pad2(P.marker)}`,
    },
    {
      id: 'rain',
      from: 1,
      to: 5,
      bend: bends[3],
      label: `rain ${pad2(P.rain)}`,
    },
  ];
  const path = narration.scene('unigram-path');
  sceneHeading(stage, path, narration.title('unigram-path'));
  const CHARS = ['▁', 'r', 'a', 'i', 'n'];
  const lattice = buildLattice({
    x0: -860,
    step: 170,
    y: 20,
    chars: CHARS,
    pieces: LATTICE_PIECES([-560, -150, 110, 260]),
  });
  const SCORE_COLUMN = 150,
    SCORE_YS = [-290, -150, -10];
  const productRow = (name, product, i, result) => {
    const style = {
      font: 'mono',
      size: 44,
      color: 'dim',
    };
    const label = leftText(name, SCORE_COLUMN, SCORE_YS[i], {
      font: 'mono',
      size: 54,
      color: 'ink',
    });
    const y = SCORE_YS[i] + 62;
    if (!result) return [label, leftText(product, SCORE_COLUMN, y, style)];

    const suffix = ` = ${result}`;
    const complete = leftText(product + suffix, SCORE_COLUMN, y, style);
    const operands = text(product, style),
      answer = text(suffix, style);
    // The text pivot includes half of the full advance, including the space before the equals sign.
    operands.at(complete.get('x') - complete.get('px') + operands.get('px'), y);
    answer.at(complete.get('x') + complete.get('px') - answer.get('px'), y);
    return [label, operands, answer];
  };
  const pathRows = [
    productRow('▁rain', pad2(P.whole), 0),
    productRow(
      '▁ + rain',
      `${pad2(P.marker)} × ${pad2(P.rain)}`,
      1,
      PATHS[1].toFixed(3).replace(/^0/, ''),
    ),
    productRow(
      '▁ + ra + in',
      `${pad2(P.marker)} × ${pad2(P.ra)} × ${pad2(P.in)}`,
      2,
      PATHS[2].toFixed(5).replace(/^0/, ''),
    ),
  ];
  const wholeLabelAnchor = [lattice.labels.whole.get('x'), lattice.labels.whole.get('y') - 16];
  lattice.labels.whole.at(wholeLabelAnchor);
  const pendingWholeLabel = text('▁rain', {
    font: 'mono',
    size: 44,
    color: 'ink',
  }).at(wholeLabelAnchor);
  const initialLabels = [
    pendingWholeLabel,
    ...Object.entries(lattice.labels)
      .filter(([id]) => id !== 'whole')
      .map(([, label]) => label),
  ];
  const ring = (i) =>
    rect(760, 128, {
      radius: 14,
      stroke: 'green',
      width: 5,
    })
      .moveTo([0, SCORE_YS[i] + 30])
      .alignTo([SCORE_COLUMN - 22, 0], 'left')
      .zIndex(2);
  const winRings = [ring(0), ring(1)];
  const loweredLabel = text(`▁rain ${pad2(LOWERED)}`, {
    font: 'mono',
    size: 44,
    color: 'red',
  }).at(wholeLabelAnchor);
  const loweredValue = leftText(pad2(LOWERED), SCORE_COLUMN, SCORE_YS[0] + 62, {
    font: 'mono',
    size: 44,
    color: 'red',
  });
  const arcNote = leftText('Each arc contributes one factor', -860, 305, {
    size: 42,
    color: 'dim',
  });
  const logScores = [LOWERED, PATHS[1], PATHS[2]].map((value, i) =>
    leftText(`log ${logOf(value)}`, SCORE_COLUMN + 420, SCORE_YS[i], {
      font: 'mono',
      size: 44,
      color: 'teal',
    }),
  );
  assert(Math.log(PATHS[1]) > Math.log(LOWERED));
  const countNote = tex('\\text{100 characters: up to } 2^{99} \\text{ paths}', {
    size: 50,
    color: 'yellow',
  })
    .moveTo([0, 215])
    .alignTo([SCORE_COLUMN, 0], 'left');
  const bestLabel = leftText('Best score at each boundary', -860, 452, {
    size: 44,
    color: 'yellow',
  });
  const bestAt = [0, 1, 3, 5];
  const bestValues = BEST.map((value, i) =>
    text(String(value).replace(/^0/, ''), {
      font: 'mono',
      size: 48,
      color: i === 3 ? 'green' : 'yellow',
    }).at(lattice.bx(bestAt[i]), 397),
  );
  const bestAxis = new Node();
  bestAxis.add(
    line([lattice.bx(0), 350], [lattice.bx(5), 350], {
      stroke: 'yellow',
      width: 3,
    }),
    ...bestAt.map((i) =>
      line([lattice.bx(i), 338], [lattice.bx(i), 362], {
        stroke: 'yellow',
        width: 4,
      }),
    ),
  );
  const boundaryDots = bestAt.map((i) =>
    rect(16, 16, {
      radius: 8,
      fill: 'yellow',
      stroke: null,
    })
      .at(lattice.bx(i), 20 + 52 + 8)
      .zIndex(3),
  );
  openOn(path, lattice.tiles);
  pullTo(path, 'path', [lattice.tiles, Object.values(lattice.arcs), initialLabels, arcNote]);
  pullTo(path, 'p1', HOME);
  path.at(0.1, () =>
    stage.play(
      fadeIn(lattice.tiles, {
        shift: [0, 10],
      }),
      {
        duration: 0.35,
      },
    ),
  );
  path.on('path', () =>
    stage.play(fadeIn(Object.values(lattice.arcs)), fadeIn(initialLabels), {
      duration: 0.8,
    }),
  );
  path.on('made-up', () =>
    stage.play(fadeIn(arcNote), {
      duration: 0.4,
    }),
  );
  path.on('score', () =>
    stage.play(
      indicate(initialLabels, {
        color: 'yellow',
        scale: 1.06,
      }),
      {
        duration: 0.8,
      },
    ),
  );
  path.on('p1', () =>
    stage.play(
      draw(lattice.lit.whole),
      fadeIn(pathRows[0][0], {
        shift: [-12, 0],
      }),
      {
        duration: 0.7,
      },
    ),
  );
  path.after('p1', () =>
    stage.play(fadeOut(pendingWholeLabel), fadeIn([lattice.labels.whole, pathRows[0][1]]), {
      duration: 0,
    }),
  );
  path.on('p2', () =>
    stage.play(
      fadeOut(lattice.lit.whole, {
        duration: 0.3,
      }),
      draw(lattice.lit.marker),
      draw(lattice.lit.rain),
      fadeIn(pathRows[1].slice(0, 2), {
        shift: [-12, 0],
      }),
      {
        duration: 0.7,
      },
    ),
  );
  path.after('p2-result', () => stage.play(fadeIn(pathRows[1][2]), { duration: 0 }));
  path.on('p3', () =>
    stage.play(
      fadeOut([lattice.lit.rain], {
        duration: 0.3,
      }),
      draw(lattice.lit.ra),
      draw(lattice.lit.in),
      fadeIn(pathRows[2].slice(0, 2), {
        shift: [-12, 0],
      }),
      {
        duration: 0.7,
      },
    ),
  );
  path.after('p3-result', () => stage.play(fadeIn(pathRows[2][2]), { duration: 0 }));
  path.on('which', () =>
    stage.play(
      fadeOut([lattice.lit.marker, lattice.lit.ra, lattice.lit.in], {
        duration: 0.4,
      }),
      {
        duration: 0.4,
      },
    ),
  );
  path.after('win', () => stage.play(fadeIn(winRings[0]), { duration: 0.5 }));
  path.on('not-longest', () =>
    stage.play(
      indicate(lattice.labels.whole, {
        color: 'yellow',
        scale: 1.08,
      }),
      {
        duration: 0.7,
      },
    ),
  );
  path.on('lower', () => stage.play(fadeOut(winRings[0]), { duration: 0.2 }));
  path.after('lower', () =>
    stage.play(
      fadeOut([lattice.labels.whole, pathRows[0][1]]),
      fadeIn([loweredLabel, loweredValue]),
      { duration: 0 },
    ),
  );
  path.after('flip', () => stage.play(fadeIn(winRings[1]), { duration: 0.5 }));
  path.on('logs', () =>
    stage.play(
      lagged(
        logScores.map((node) =>
          fadeIn(node, {
            shift: [-10, 0],
          }),
        ),
        {
          lag: 0.2,
        },
      ),
      {
        duration: 0.7,
      },
    ),
  );
  path.on('many', () =>
    stage.play(brief(fadeOut(logScores), 0.2, 0, LINEAR), write(countNote), {
      duration: 0.9,
    }),
  );
  path.on('viterbi', () =>
    stage.play(
      fadeIn([bestLabel, bestAxis, ...boundaryDots]),
      lagged(
        bestValues.map((node) =>
          fadeIn(node, {
            shift: [0, 10],
          }),
        ),
        {
          lag: 0.3,
        },
      ),
      {
        duration: 1.2,
      },
    ),
  );
  // The paths that lost are dropped, and only the best complete path stays lit.
  path.on('best', () =>
    stage.play(
      indicate(bestValues[3], {
        color: 'green',
        scale: 1.2,
      }),
      draw(lattice.lit.marker),
      draw(lattice.lit.rain),
      fade(lattice.arcs.whole, 0.2),
      fade(lattice.arcs.ra, 0.2),
      fade(lattice.arcs.in, 0.2),
      fade(loweredLabel, 0.72),
      fade(lattice.labels.ra, 0.55),
      fade(lattice.labels.in, 0.55),
      {
        duration: 0.7,
      },
    ),
  );
  clearAtEnd(path, [
    ...lattice.tiles,
    ...Object.values(lattice.arcs),
    lattice.labels.ra,
    lattice.labels.in,
    lattice.labels.marker,
    lattice.labels.rain,
    loweredLabel,
    pathRows[0][0],
    loweredValue,
    ...pathRows[1],
    ...pathRows[2],
    winRings[1],
    arcNote,
    countNote,
    bestLabel,
    ...bestValues,
    bestAxis,
    ...boundaryDots,
    lattice.lit.marker,
    lattice.lit.rain,
  ]);
  return {
    buildLattice,
    pad2,
    LATTICE_PIECES,
    CHARS,
  };
}
