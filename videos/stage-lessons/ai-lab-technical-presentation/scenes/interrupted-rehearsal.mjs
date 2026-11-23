import { interruptedBudget } from '../../../films/ai-lab-technical-presentation/arithmetic.mjs';
import { budget, addTitle, caption, rehearsalClock } from '../parts.mjs';
import { label } from '../../kit-narrated.mjs';
import { to, fadeOut } from 'vizmatic/stage';

export default function interruptedRehearsal(s, c) {
  addTitle(s, c);
  const d = interruptedBudget();
  const clock = rehearsalClock();
  const { lower, blocks, minute } = clock;
  const question = blocks[5],
    decision = blocks[2];
  const used = d.context + d.path;
  const reserve = budget[5].value;
  const extra = d.questions - reserve;
  const finalMinutes = (value, center) =>
    label(value + ' min', { size: 32, color: 'ink' }).moveTo(clock.at(center, 21));
  const qTime = finalMinutes(d.questions, used + d.questions / 2);
  const dTime = finalMinutes(d.replacement[0], used + d.questions + d.replacement[0] / 2);
  const shift = (nodes, dx, dy) => nodes.map((node) => to(node, (n) => n.shift(dx * minute, dy)));
  const widthRatio = (before, after) => (after * minute - 5) / (before * minute - 5);
  const start = caption(lower, 'Rehearsal plan    ·    15 minutes', 'dim');
  const at = caption(lower, 'Context + path    ·    ' + (d.context + d.path) + ' min used', 'blue');
  const left = caption(lower, 'Time left    ·    ' + d.remaining + ' min', 'yellow');
  const over = caption(
    lower,
    'Continuation needs ' + d.oldContinuation + ' min    ·    ' + d.remaining + ' min available',
    'red',
  );
  const fit = caption(
    lower,
    'Decision 2    +    evidence 3    +    limit 1    =    ' + d.newContinuation + ' min',
    'yellow',
  );
  const brief = caption(
    lower,
    '90 seconds    ·    keep the problem, choice, contribution and result.',
    'cyan',
    37,
  );
  const appendix = caption(
    lower,
    'Open the requested artifact, then resume the argument.',
    'yellow',
  );
  c.take([clock.ruler, blocks.map((b) => b.nodes)].flat(Infinity));
  s.add(start);
  c.swap('six', start, at, { after: true });
  const rest = blocks.slice(2, 5).flatMap((b) => b.nodes);
  const lift = 115;
  c.on('interrupt', () => s.play(...shift(question.nodes, 0, -lift), { duration: 0.28 }));
  c.on(
    'interrupt',
    () =>
      s.play(...shift(question.nodes, used - (d.total - reserve), 0), ...shift(rest, reserve, 0), {
        duration: 0.65,
      }),
    0.3,
  );
  c.on('interrupt', () => s.play(...shift(question.nodes, 0, lift), { duration: 0.28 }), 0.97);
  c.on('interrupt', () => s.play(fadeOut(question.duration), { duration: 0.15 }), 1.25);
  c.on(
    'interrupt',
    () =>
      s.play(
        to(question.bar, (n) =>
          n.scale([widthRatio(reserve, d.questions), 1]).shift((extra * minute) / 2, 0),
        ),
        ...shift([question.title], extra / 2, 0),
        ...shift(rest, extra, 0),
        { duration: 0.55 },
      ),
    1.42,
  );
  c.show('interrupt', qTime, { after: true, lead: 0 });
  c.swap('left', at, left, { after: true });
  c.swap('over', left, over, { after: true });
  const saved = budget[2].value - d.replacement[0];
  c.hide('shorten', [over, decision.duration], { fade: 0.13 });
  c.on(
    'shorten',
    () =>
      s.play(
        to(decision.bar, (n) =>
          n
            .scale([widthRatio(budget[2].value, d.replacement[0]), 1])
            .shift((-saved * minute) / 2, 0),
        ),
        ...shift([decision.title], -saved / 2, 0),
        ...shift(
          blocks.slice(3, 5).flatMap((b) => b.nodes),
          -saved,
          0,
        ),
        { duration: 0.65 },
      ),
    0.15,
  );
  c.show('shorten', dTime, { after: true });
  c.show('fit', fit, { after: true });
  c.swap('short', fit, brief);
  c.swap('appendix', brief, appendix);
}
