// Scene `loss`: the cost of the word that came is minus the log of its share.
//
// The picture: a point on the loss curve starts at the share of the favorite and climbs to the
// share of the observed word. The board stays, and the gap on its ruler gives the same loss.
import { column, draw, place, row, tex, write } from 'vizmatic/stage';
import { lossTrace } from '../../../films/softmax/arithmetic.mjs';
import { LOGITS, PROBS, TARGET } from '../../../films/softmax/fixtures.mjs';
import { mono, note } from '../../kit-narrated.mjs';
import { MARK_COLOR, STATE, dogScene, lossCurve } from '../parts.mjs';

export default function loss(s, c) {
  const { b, stack, under, finish } = dogScene(s, c, STATE.mass, 3);
  const trace = lossTrace(LOGITS, TARGET);
  c.show(0, [stack[3][0], write(stack[3][1])]);

  // The curve: the point follows one probability, from the favorite to the observed word.
  const q = s.value(PROBS[0]);
  const { graph, point } = lossCurve(under(4), () => q.value, 'share of the word being scored');
  const hypothetical = place(
    note('if ran were observed', { color: 'blue' }),
    under(4),
    'top right',
  );
  const cost = place(
    mono(`${trace.loss.toFixed(2)} nats`, { color: MARK_COLOR, size: 56 }),
    under(4),
    'top right',
  );
  c.show(0, graph);
  c.show('loss-favorite', [point, hypothetical]);
  c.hide('loss-observed', hypothetical);
  c.on('loss-observed', () => s.play(q.to(PROBS[TARGET], { duration: 2 })));
  c.show('loss-result', cost, { after: true });

  // The same loss from the scores: the gap to the leader, plus the log of the shifted total.
  const lead = b.gap(TARGET, 0);
  const parts = [
    tex(`${trace.gap}`, { size: 56, color: MARK_COLOR }),
    tex(`+\\; \\ln ${trace.total.toFixed(3)}`, { size: 56, color: 'cyan' }),
    tex(`=\\; ${trace.loss.toFixed(3)}`, { size: 56 }),
  ];
  const extreme = lossTrace([1000, 0, -1], 1);
  const safe = [
    note('scores [1000, 0, −1] · the target weight rounds to 0'),
    tex(`${extreme.gap} + \\ln ${extreme.total.toFixed(3)} = ${extreme.loss}`, {
      size: 56,
      color: 'pink',
    }),
  ];
  place(
    column([row(parts, { gap: 'normal' }), ...safe], { gap: 'wide', align: 'center' }),
    under(4),
  );
  c.swap('loss-gap', [graph, point, cost], [parts[0], lead], { after: true });
  c.show('loss-log-total', [parts[1], parts[2]], { after: true });
  c.show('loss-extreme', safe);
  c.hide('loss-extreme', lead);
  finish(STATE.loss, 4);
}
