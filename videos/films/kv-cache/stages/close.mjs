import { fade, fadeIn, rect, smoother, to, write } from 'vizmatic/stage';
import { sceneHeading } from '../../../stage-lessons/kit.mjs';

/** Start with this block of memory. */
export function buildClose(
  stage,
  narration,
  { T, place, fadeOut, PREVIEW },
  { tokens, keyValue, stack, sweep, scanRing, redFaces, wholeBlock },
) {
  const ending = narration.scene('close');
  sceneHeading(stage, ending, narration.title('close'));
  const recap = [
    'Why the second word is cheap',
    'Why long chats tend to get slower',
    'Why memory can run out before compute',
  ].map((sentence, i) =>
    place(
      T(sentence, {
        size: 64,
      }),
      -800,
      -300 + i * 110,
    ).opacity(PREVIEW),
  );
  const marks = recap.map((_, i) =>
    rect(16, 76, {
      radius: 4,
      fill: ['green', 'yellow', 'red'][i],
      stroke: null,
    })
      .at(-840, -300 + i * 110)
      .opacity(PREVIEW),
  );
  const skills = [
    ['Size the cache by hand', 'yellow'],
    ['Follow a position through a block table', 'blue'],
    ['Tell a packing problem from a prefill or a bytes problem', 'green'],
  ].map(([name, color], i) =>
    place(
      T(name, {
        size: 52,
        color,
      }),
      -800,
      70 + i * 86,
    ).opacity(PREVIEW),
  );
  // The block from the size scene returns, and it lights the part that answers each line.
  ending.at(0.05, () => {
    stage.play(
      to(stack, (node) => node.at(620, -120)),
      stack.unit.to(80),
      stack.theta.to(-0.72),
      keyValue.to(1),
      tokens.to(4096),
      {
        duration: 0.01,
      },
    );
    stage.play(
      ...wholeBlock.map((face) =>
        fade(face, 1, {
          duration: 0.4,
        }),
      ),
      fadeIn([...recap, ...marks, ...skills]),
      {
        duration: 0.45,
      },
    );
  });
  // One new token: a single slice at the block's end.
  ending.on('three-whys', () =>
    stage.play(fade(recap[0], 1), fade(marks[0], 1), fadeIn(scanRing), {
      duration: 0.5,
    }),
  );
  // Long chats: the same read sweeps the whole length.
  ending.on('slower', () => {
    stage.play(fade(recap[1], 1), fade(marks[1], 1), sweep.to(0), {
      duration: 0.8,
      ease: smoother,
    });
    stage.play(sweep.to(1), {
      duration: 1.2,
      ease: smoother,
    });
  });
  // Out of memory: the whole block is what does not fit.
  ending.on('compute', () =>
    stage.play(
      fade(recap[2], 1),
      fade(marks[2], 1),
      fadeOut(scanRing, {
        duration: 0.25,
      }),
      ...wholeBlock.map((face) => fade(face, 0)),
      ...redFaces.map((face) => fade(face, 1)),
      {
        duration: 0.6,
      },
    ),
  );
  ending.on('skills', () =>
    stage.play(
      fade(skills[0], 1),
      ...redFaces.map((face) => fade(face, 0)),
      ...wholeBlock.map((face) => fade(face, 1)),
      {
        duration: 0.5,
      },
    ),
  );
  ending.on('follow', () =>
    stage.play(fade(skills[1], 1), {
      duration: 0.4,
    }),
  );
  ending.on('tell', () =>
    stage.play(fade(skills[2], 1), {
      duration: 0.4,
    }),
  );
  const nextUp = place(
    T('Next: prefix caching, up close', {
      italic: true,
      size: 72,
      color: 'yellow',
    }),
    -800,
    400,
  );
  ending.on('next', () =>
    stage.play(write(nextUp), {
      duration: 0.8,
    }),
  );
  stage.at(ending.end - 0.7, () =>
    stage.play(
      fadeOut([...recap, ...marks, ...skills, nextUp]),
      ...wholeBlock.map((face) => fade(face, 0)),
      {
        duration: 0.6,
      },
    ),
  );
}
