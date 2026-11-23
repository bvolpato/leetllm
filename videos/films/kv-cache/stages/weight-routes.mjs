import { arrow, draw, fadeIn, Node, rect } from 'vizmatic/stage';
import { chip } from '../../../stage-lessons/kit.mjs';
export function buildWeightRoutes(
  stage,
  shrink,
  { T, M, S, place, arrive, clearFirst, handoff },
  { RQ_X },
  { PL, PW2, panelParts },
) {
  // Fewer heads means new weights: two routes, and one quality gate after both.
  const boxWeights = rect(230, 220, {
    radius: 16,
    fill: 'surface',
    stroke: 'teal',
    width: 3,
  }).at(745, -140);
  const boxWeightsName = S('new\nweights', {
    size: 48,
    color: 'teal',
    align: 'center',
  }).at(745, -140);
  const switchName = place(
    T('Not a serving time switch', {
      size: 56,
      color: 'yellow',
    }),
    RQ_X,
    470,
  );
  const trainChip = chip('train it this way', {
    w: 470,
    h: 88,
    color: 'blue',
    size: 44,
  }).at(PL + 235, -195);
  const trainArrow = arrow([PL + 476, -195], [626, -195], {
    stroke: 'blue',
    width: 5,
    tip: 22,
  });
  const convertChip = chip('convert', {
    w: 200,
    h: 88,
    color: 'orange',
    size: 44,
  }).at(PL + 100, -85);
  const uptrainChip = chip('uptrain', {
    w: 200,
    h: 88,
    color: 'orange',
    size: 44,
  }).at(PL + 370, -85);
  const convertArrow = arrow([PL + 206, -85], [PL + 266, -85], {
    stroke: 'orange',
    width: 5,
    tip: 22,
  });
  const uptrainArrow = arrow([PL + 476, -85], [626, -85], {
    stroke: 'orange',
    width: 5,
    tip: 22,
  });
  const testsTitle = place(
    M('in the original tests', {
      size: 40,
      color: 'dim',
    }),
    PL,
    20,
  );
  const testGrouped = new Node(),
    testMulti = new Node();
  testGrouped.add(
    chip('grouped query', {
      w: 340,
      h: 84,
      color: 'green',
      size: 40,
    }).at(PL + 170, 100),
    place(
      T('did reasonably well', {
        size: 46,
        color: 'green',
      }),
      PL + 360,
      100,
    ),
  );
  testMulti.add(
    chip('multi query', {
      w: 340,
      h: 84,
      color: 'orange',
      size: 40,
    }).at(PL + 170, 200),
    place(
      T('needed extra training', {
        size: 46,
        color: 'orange',
      }),
      PL + 360,
      200,
    ),
  );
  const qualityGate = chip('check the quality on your task', {
    w: PW2,
    h: 100,
    color: 'green',
    size: 42,
  }).at(PL + PW2 / 2, 330);
  const switchParts = [
    switchName,
    boxWeights,
    boxWeightsName,
    trainChip,
    trainArrow,
    convertChip,
    uptrainChip,
    convertArrow,
    uptrainArrow,
    testsTitle,
    testGrouped,
    testMulti,
    qualityGate,
  ];
  shrink.on('switch', () =>
    handoff(
      panelParts,
      () =>
        arrive(fadeIn(switchName), {
          duration: 0.35,
        }),
      clearFirst,
    ),
  );
  shrink.on('weights', () =>
    stage.play(
      fadeIn([boxWeights, boxWeightsName], {
        scale: 0.9,
      }),
      {
        duration: 0.4,
      },
    ),
  );
  shrink.on('train', () =>
    stage.play(
      fadeIn(trainChip, {
        shift: [-14, 0],
      }),
      draw(trainArrow),
      {
        duration: 0.5,
      },
    ),
  );
  shrink.on('convert', () =>
    stage.play(
      fadeIn(convertChip, {
        shift: [-14, 0],
      }),
      draw(convertArrow),
      {
        duration: 0.5,
      },
    ),
  );
  shrink.on('uptrain', () =>
    stage.play(
      fadeIn(uptrainChip, {
        shift: [-14, 0],
      }),
      draw(uptrainArrow),
      {
        duration: 0.5,
      },
    ),
  );
  shrink.on('tests', () =>
    stage.play(
      fadeIn(testsTitle),
      fadeIn(testGrouped, {
        shift: [-14, 0],
      }),
      {
        duration: 0.5,
      },
    ),
  );
  shrink.on('multi-needs', () =>
    stage.play(
      fadeIn(testMulti, {
        shift: [-14, 0],
      }),
      {
        duration: 0.5,
      },
    ),
  );
  shrink.on('quality', () =>
    stage.play(
      fadeIn(qualityGate, {
        scale: 0.96,
      }),
      {
        duration: 0.5,
      },
    ),
  );
  return {
    switchParts,
  };
}
