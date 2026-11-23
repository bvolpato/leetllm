import { arrow, draw, fadeIn, lagged, smoother, text, to } from 'vizmatic/stage';
import { sceneHeading } from '../../../stage-lessons/kit.mjs';
import { fadeOut, WORDS, midProse, lineProse } from '../defaults.mjs';

/** Who is singing?. */
export function buildHook(stage, narration, { show, leave }) {
  const hook = narration.scene('hook');
  const vectors = narration.scene('vectors');
  sceneHeading(stage, hook, narration.title('hook'));
  const WORD_Y = 90;
  const WORD_SIZE = 108,
    WORD_GAP = 27;
  const wordNodes = WORDS.map((word) =>
    text(word, {
      font: 'text-serif',
      size: WORD_SIZE,
    }),
  );
  let cursor = 0;
  const widths = wordNodes.map((node) => node.width);
  const total = widths.reduce((a, b) => a + b, 0) + WORD_GAP * (WORDS.length - 1);
  wordNodes.forEach((node, i) => {
    node.at(-total / 2 + cursor + widths[i] / 2, WORD_Y);
    cursor += widths[i] + WORD_GAP;
  });
  const wordTop = (i) => [wordNodes[i].center[0], WORD_Y - 76];
  const main = arrow(wordTop(4), wordTop(0), {
    stroke: 'yellow',
    width: 7,
    tip: 32,
    bend: 420,
    glow: 12,
  });
  // Every word runs its own search, so these arcs start from different words.
  const others = [
    [1, 3],
    [2, 0],
    [3, 0],
    [5, 4],
    [6, 3],
    [7, 5],
  ].map(([from, target]) =>
    arrow(wordTop(from), wordTop(target), {
      stroke: 'dim',
      width: 3.5,
      tip: 20,
      bend: from > target ? 90 + (from - target) * 45 : -90 - (target - from) * 45,
    }),
  );
  hook.on(
    'sentence',
    () =>
      stage.play(
        lagged(
          wordNodes.map((node) =>
            fadeIn(node, {
              shift: [0, 16],
            }),
          ),
          {
            lag: 0.45,
          },
        ),
        {
          duration: 2.2,
        },
      ),
    -0.3,
  );
  hook.on('reaches-sing', () =>
    stage.play(
      to(wordNodes[4], (node) => node.color('teal'), {
        duration: 0.5,
      }),
    ),
  );
  hook.on('four-back', () =>
    stage.play(
      draw(main, {
        lag: 1,
      }),
      to(wordNodes[0], (node) => node.color('blue')),
      {
        duration: 1.1,
        ease: smoother,
      },
    ),
  );
  hook.on('every-word', () =>
    stage.play(
      lagged(
        others.map((node) =>
          draw(node, {
            lag: 1,
          }),
        ),
        {
          lag: 0.2,
        },
      ),
      {
        duration: 1.2,
      },
    ),
  );
  // The two words we keep travel up to a small line that stays through the lesson.
  const KEEP_Y = -462,
    BIG = 2.4,
    KEEP = 0.56;
  hook.on('two-words', () => {
    stage.play(
      ...others.map((node) => fadeOut(node)),
      fadeOut(main),
      ...[1, 2, 3, 5, 6, 7].map((i) => fadeOut(wordNodes[i])),
      {
        duration: 0.5,
      },
    );
    stage.play(
      to(wordNodes[0], (node) => node.at(-380, 40).scale(BIG)),
      to(wordNodes[4], (node) => node.at(380, 40).scale(BIG)),
      {
        duration: 0.9,
        ease: smoother,
      },
    );
  });
  const tokenTags = [
    midProse('one token', -380, 240, 54, 'dim'),
    midProse('one token', 380, 240, 54, 'dim'),
  ];
  const needs = midProse(
    'You need: vectors, matrix multiplication, variance, training loss, gradients',
    0,
    370,
    46,
    'dim',
  );
  const copyOne = lineProse('copy one word?', -380, 385, 76, 'yellow'),
    blendMany = lineProse('or blend several?', 380, 385, 76, 'yellow');
  show(hook, 'tokens', tokenTags);
  show(hook, 'needs', needs);
  hook.on('predict', () => {
    stage.play(fadeOut(needs), {
      duration: 0.25,
    });
    stage.play(
      fadeIn([copyOne, blendMany], {
        shift: [0, 12],
      }),
      {
        duration: 0.45,
      },
    );
  });
  leave(hook, [...tokenTags, copyOne, blendMany]);
  vectors.at(0.1, () =>
    stage.play(
      to(wordNodes[0], (node) => node.at(630, KEEP_Y).scale(KEEP / BIG)),
      to(wordNodes[4], (node) => node.at(800, KEEP_Y).scale(KEEP / BIG)),
      {
        duration: 0.9,
        ease: smoother,
      },
    ),
  );
  return {
    wordNodes,
  };
}
