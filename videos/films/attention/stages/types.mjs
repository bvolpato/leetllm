import { fadeIn, rect } from 'vizmatic/stage';
import { sceneHeading } from '../../../stage-lessons/kit.mjs';
import { fade, midProse, lineProse, midMono, maskCells, maskFrame, QUIET } from '../defaults.mjs';

/** Who may read whom. */
export function buildTypes(stage, narration, { show, leave, dropCovered }) {
  const types = narration.scene('types');
  sceneHeading(stage, types, narration.title('types'));
  const TYPE_X = [-600, 0, 600],
    TYPE_Y = -10,
    TYPE_CELL = 100;
  const typeFrames = [
    maskFrame(4, 4, TYPE_X[0], TYPE_Y, TYPE_CELL),
    maskFrame(4, 4, TYPE_X[1], TYPE_Y, TYPE_CELL),
    maskFrame(2, 3, TYPE_X[2], TYPE_Y, TYPE_CELL),
  ];
  const typeTitles = [
    midProse('Bidirectional', TYPE_X[0], -310, 58, 'yellow'),
    midProse('Causal', TYPE_X[1], -310, 58, 'yellow'),
    midProse('Cross', TYPE_X[2], -310, 58, 'yellow'),
  ];
  const fillFull = maskCells(4, 4, TYPE_X[0], TYPE_Y, TYPE_CELL, () => true);
  const fillCausal = maskCells(4, 4, TYPE_X[1], TYPE_Y, TYPE_CELL, (r, c) => c <= r);
  const fillCross = maskCells(2, 3, TYPE_X[2], TYPE_Y, TYPE_CELL, () => true, 'teal');
  const padBand = rect(TYPE_CELL - 2, TYPE_CELL * 4 - 2, {
    radius: 8,
    fill: 'bg',
    stroke: 'red',
    width: 3,
  }).at(TYPE_X[0] + TYPE_CELL * 1.5, TYPE_Y);
  const padName = midMono(
    'PAD',
    TYPE_X[0] + TYPE_CELL * 1.5,
    TYPE_Y - TYPE_CELL * 2 - 32,
    38,
    'red',
  );
  const sourceA = midProse('Q, K, V: one sequence', TYPE_X[0], 255, 50),
    sourceB = midProse('Q, K, V: one sequence', TYPE_X[1], 255, 50);
  const sourceC = midProse('Q from one sequence', TYPE_X[2], 215, 48),
    sourceD = midProse('K, V from another', TYPE_X[2], 280, 48);
  const usedA = midProse('BERT, original ViT', TYPE_X[0], 325, 50, 'dim'),
    usedB = midProse('GPT style models', TYPE_X[1], 325, 50, 'dim');
  const usedC = midProse('Decoder reads encoder', TYPE_X[2], 345, 48, 'dim');
  const seeAll = lineProse('Reads before and after', TYPE_X[0], 410, 50, 'green'),
    seeBack = lineProse('Reads itself and the past', TYPE_X[1], 410, 50, 'green');
  const shapeCross = midMono('2 × 3', TYPE_X[2], TYPE_Y + 150, 56, 'teal');
  const padCross = rect(TYPE_CELL - 2, TYPE_CELL * 2 - 2, {
    radius: 8,
    fill: 'bg',
    stroke: 'red',
    width: 3,
  }).at(TYPE_X[2] + TYPE_CELL, TYPE_Y);
  const padCrossName = midMono('PAD', TYPE_X[2] + TYPE_CELL, TYPE_Y - TYPE_CELL - 32, 38, 'red');
  const offlineTag = midProse('Offline: usually\nno causal mask', TYPE_X[2], 425, 42, 'green', {
    leading: 1.12,
  });
  const stepBack = (source, used, reads) => [
    fade(source, QUIET.ink),
    fade(used, QUIET.dim),
    fade(reads, QUIET.green),
  ];
  types.at(0.1, () =>
    stage.play(fadeIn([...typeFrames, ...typeTitles]), {
      duration: 0.45,
    }),
  );
  types.on('first', () =>
    stage.play(fadeIn(fillFull), fadeIn(sourceA), {
      duration: 0.6,
    }),
  );
  show(types, 'before-after', seeAll);
  show(types, 'encoders', usedA);
  types.on('pad-only', () =>
    stage.play(fadeIn([padBand, padName]), {
      duration: 0.5,
    }),
  );
  types.on('second', () =>
    stage.play(fadeIn(fillCausal), fadeIn(sourceB), ...stepBack(sourceA, usedA, seeAll), {
      duration: 0.6,
    }),
  );
  show(types, 'decoder-only', [usedB, seeBack]);
  types.on('third', () =>
    stage.play(
      fadeIn(fillCross),
      fadeIn([sourceC, sourceD]),
      ...stepBack(sourceB, usedB, seeBack),
      {
        duration: 0.6,
      },
    ),
  );
  show(types, 'decoder-asks', usedC);
  show(types, 'two-three', shapeCross);
  types.on('source-pad', () =>
    stage.play(fadeIn([padCross, padCrossName]), {
      duration: 0.5,
    }),
  );
  show(types, 'offline', offlineTag);
  dropCovered(types, [
    ...[3, 7, 11, 15].map((i) => fillFull.children[i]),
    ...[2, 5].map((i) => fillCross.children[i]),
  ]);
  leave(types, [
    ...typeFrames,
    ...typeTitles,
    fillFull,
    fillCausal,
    fillCross,
    padBand,
    padName,
    sourceA,
    sourceB,
    sourceC,
    sourceD,
    usedA,
    usedB,
    usedC,
    seeAll,
    seeBack,
    shapeCross,
    padCross,
    padCrossName,
    offlineTag,
  ]);
}
