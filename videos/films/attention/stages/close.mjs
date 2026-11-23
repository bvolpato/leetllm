import { fadeIn, group, lagged, morph, rect, smoother, text } from 'vizmatic/stage';
import { sceneHeading } from '../../../stage-lessons/kit.mjs';
import {
  fadeOut,
  LEFT,
  prose,
  midProse,
  midMath,
  chipNode,
  waiting,
  dimIn,
  lit,
} from '../defaults.mjs';

/** Now do it again. */
export function buildClose(stage, narration, { handOver }) {
  const ending = narration.scene('close');
  sceneHeading(stage, ending, narration.title('close'));
  const closeEq = midMath(
    '\\text{softmax}\\left(\\frac{QK^{\\top}}{\\sqrt{d}} + M\\right) V',
    0,
    -290,
    96,
    'yellow',
  );
  const closeSteps = [
    ['match', 'yellow'],
    ['scale', 'orange'],
    ['mask', 'red'],
    ['share', 'teal'],
    ['mix', 'green'],
  ].map(([name, color], i) =>
    chipNode(name, -640 + i * 320, -60, color, {
      w: 270,
      h: 110,
      size: 62,
    }),
  );
  const closeAsks = [
    'Why the scale is there',
    "Why more heads don't add core work at a fixed width",
    'Where long sequences get expensive',
  ].map((line2, i) => prose(line2, LEFT, 110 + i * 100, 64, 'ink'));
  waiting([...closeSteps, ...closeAsks]);
  ending.at(0.1, () =>
    stage.play(fadeIn(closeEq), ...dimIn([...closeSteps, ...closeAsks]), {
      duration: 0.45,
    }),
  );
  ending.on('complete', () =>
    stage.play(
      lagged(lit(closeSteps), {
        lag: 0.35,
      }),
      {
        duration: 2.2,
      },
    ),
  );
  ['say-why', 'say-heads', 'say-cost'].forEach((cue, i) =>
    ending.on(cue, () =>
      stage.play(...lit([closeAsks[i]]), {
        duration: 0.5,
      }),
    ),
  );
  // One part of a block, then many blocks, then image patches as tokens.
  const blockCard = (x, y, words) => {
    const card = group(
      rect(520, 330, {
        radius: 16,
        fill: 'bg',
        stroke: 'dim',
        width: 3,
      }).at(0, 0),
      rect(440, 120, {
        radius: 10,
        fill: 'yellow',
        stroke: null,
      })
        .at(0, -80)
        .opacity(words ? 0.85 : 0.3),
      rect(440, 120, {
        radius: 10,
        fill: 'surface',
        stroke: 'faint',
        width: 2,
      }).at(0, 70),
    );
    if (words)
      card.add(
        text('attention', {
          font: 'text-serif',
          size: 62,
          color: 'bg',
        }).moveTo([0, -80]),
        text('the rest of the block', {
          font: 'text-serif',
          size: 44,
          color: 'dim',
        }).moveTo([0, 70]),
      );
    return card.at(x, y);
  };
  // The front card is the one the voice describes, and the others stack behind it.
  const stacked = [2, 1, 0].map((i) => blockCard(-540 + i * 60, 90 - i * 60, i === 0).zIndex(-i));
  const blockTag = midProse('One part of a transformer block', -480, 340, 56, 'yellow');
  const LAYER_NOTE_X = 480;
  const askAgain = midProse(
    'Each token asks new questions\nof an already mixed sequence.',
    LAYER_NOTE_X,
    -300,
    52,
    'ink',
    {
      leading: 1.14,
    },
  );
  const patchColors = ['blue', 'teal', 'green', 'yellow', 'orange', 'pink', 'purple', 'red'];
  const patches = [];
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++)
      patches.push(
        rect(110, 110, {
          radius: 6,
          fill: patchColors[(r * 3 + c * 2) % patchColors.length],
          stroke: null,
        })
          .at(LAYER_NOTE_X - 120 + c * 120, -40 + r * 120)
          .opacity(0.85),
      );
  const tokensRow = patches.map((_, i) =>
    rect(70, 70, {
      radius: 6,
      fill: patchColors[(Math.floor(i / 3) * 3 + (i % 3) * 2) % patchColors.length],
      stroke: null,
    })
      .at(LAYER_NOTE_X - 340 + i * 85, 340)
      .opacity(0.85),
  );
  const nextTag = midProse('Next: the same operation, with no causal mask', 0, 450, 56, 'green');
  const closeFirst = [closeEq, ...closeSteps, ...closeAsks];
  waiting([askAgain]);
  handOver(ending, 'one-part', closeFirst, () =>
    stage.play(fadeIn(stacked[2]), fadeIn(blockTag), ...dimIn([askAgain]), {
      duration: 0.18,
    }),
  );
  ending.on('layers', () =>
    stage.play(
      lagged(
        stacked
          .slice(0, 2)
          .reverse()
          .map((node) =>
            fadeIn(node, {
              shift: [20, 20],
            }),
          ),
        {
          lag: 0.4,
        },
      ),
      {
        duration: 1.1,
      },
    ),
  );
  ending.on('new-questions', () =>
    stage.play(...lit([askAgain]), {
      duration: 0.5,
    }),
  );
  ending.on('next', () =>
    stage.play(
      fadeIn(nextTag),
      lagged(
        patches.map((node) =>
          fadeIn(node, {
            scale: 0.8,
          }),
        ),
        {
          lag: 0.03,
        },
      ),
      {
        duration: 0.6,
      },
    ),
  );
  ending.on('patches', () =>
    stage.play(...patches.map((node, i) => morph(node, tokensRow[i])), {
      duration: 0.6,
      ease: smoother,
    }),
  );
  // The back cards leave first, while the front card still hides them.
  stage.at(ending.end - 1.05, () =>
    stage.play(fadeOut(stacked.slice(0, 2)), {
      duration: 0.3,
    }),
  );
  stage.at(ending.end - 0.7, () =>
    stage.play(fadeOut([stacked[2], blockTag, askAgain, nextTag, ...tokensRow]), {
      duration: 0.6,
    }),
  );
}
