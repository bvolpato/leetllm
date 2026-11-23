// Scene `update`: one step of descent, and the next prediction.
//
// The picture: each word moves along its arrow. The bars and the strip follow the scores at every
// frame, the bar of slept passes the old favorite, and the point on the loss curve comes down.
import { place, write } from 'vizmatic/stage';
import { lossTrace } from '../../../films/softmax/arithmetic.mjs';
import { LOGITS, PROBS, TARGET, UPDATED } from '../../../films/softmax/fixtures.mjs';
import { mono } from '../../kit-narrated.mjs';
import { READ, STATE, TARGET_COLOR, WORDS, dogScene, lossCurve } from '../parts.mjs';

export default function update(s, c) {
  const { b, stack, under, finish } = dogScene(s, c, STATE.gradient, 5);
  const after = lossTrace(UPDATED, TARGET).probabilities[TARGET];
  c.show('update-step', [stack[5][0], write(stack[5][1])]);

  // The numbers of the bars wait: the new share is a result of the last beat.
  c.onBeat(0, () => WORDS.forEach((_, i) => b.read[i].set(READ.none)));
  const { graph, point } = lossCurve(under(6), () => b.shares()[TARGET]);
  c.show(0, [graph, point]);

  // The step: half of the way while the voice states the rule, and the rest while it watches.
  const move = (amount, duration) => {
    b.namesOn.set(0);
    b.tagsOn.set(0);
    s.play(
      ...b.z.map((value, i) =>
        value.to(LOGITS[i] + (UPDATED[i] - LOGITS[i]) * amount, { duration }),
      ),
    );
    b.namesOn.set(1);
    b.tagsOn.set(1);
  };
  c.on('logit-update-rule-b1-1', () => move(0.5, 2.4));
  c.on('updated-probabilities-b2-1', () => move(1, 3.2));
  c.hide('updated-target-loss-b2-2', b.pushes);

  // The result: slept has most of the budget now.
  const was = place(
    mono(`slept ${Math.round(PROBS[TARGET] * 100)}% → ${Math.round(after * 100)}%`, {
      color: TARGET_COLOR,
      size: 48,
    }),
    b.top,
    'right',
  );
  c.after('update-result', () => WORDS.forEach((_, i) => b.read[i].set(READ.share)));
  c.show('update-result', was, { after: true });
  finish(STATE.update, 6);
}
