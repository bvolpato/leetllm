import { beside, dot, dynamic, line, place } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { charge, firstGuide, guideScores, occurrence, tickets } from '../charge.mjs';
import { fmt, plane, RIGHT, vec } from '../parts.mjs';

export default function articleContext(s, c) {
  const p = plane(s, {
    title: 'One lookup, two clues',
    range: [-0.08, 1.17],
    xName: 'coordinate 1',
    yName: 'coordinate 2',
  });
  const [key, first, second, footer] = RIGHT.rows([0.65, 1.5, 1.5, 0.75], 'normal');
  const base = dot(13, 'blue').moveTo(p.point(charge));
  const tag = (text, vector, color, dy) => {
    const [x, y] = p.point(vector);
    return label(text, { size: 32, color }).moveTo([x, y + dy]);
  };
  const prompt = place(label('Which ticket changes guide?', { color: 'yellow' }), footer);
  const rule = place(label('½ lookup + ½ of its own clue'), key, 'left');
  const committed = place(note('Same stored row for both tickets'), footer);
  const rows = tickets.map((ticket, i) => {
    const progress = s.value(0);
    const state = () => occurrence(ticket, progress.value);
    const [name, coords, scores, verdict] = [first, second][i].rows([1, 1, 1, 0.95], 'tight');
    const scoreLine = dynamic(() => {
      const [invoice, phone] = guideScores(state());
      return place(
        mono('Invoice ' + fmt(invoice) + '   Phone ' + fmt(phone), { size: 35 }),
        scores,
        'left',
      );
    });
    return {
      progress,
      name: place(
        label('“' + ticket.excerpt + '”', { color: ticket.color, size: 43 }),
        name,
        'left',
      ),
      coords: dynamic(() => place(mono('charge  ' + vec(state()), { size: 37 }), coords, 'left')),
      scoreLine,
      guide: place(
        label('→ ' + firstGuide(guideScores(occurrence(ticket, 0.5))), {
          size: 37,
          color: ticket.color,
        }),
        verdict,
        'left',
      ),
      path: line(p.point(charge), p.point(ticket.clue), {
        stroke: ticket.color,
        width: 3,
        dash: [9, 8],
      }),
      clue: dot(10, ticket.color).moveTo(p.point(ticket.clue)),
      clueName: tag(
        (i === 0 ? 'invoice  ' : 'phone  ') + vec(ticket.clue),
        ticket.clue,
        ticket.color,
        i === 0 ? -36 : 39,
      ),
      moving: dynamic(() => dot(12, ticket.color).moveTo(p.point(state()))),
    };
  });
  c.take(p.frame);
  s.add(
    heading(c.title),
    p.nodes,
    rule,
    rows.map((r) => [r.path, r.clue, r.clueName, r.name, r.coords]),
    base,
    beside(label('charge', { size: 32, color: 'blue' }), base, 'left', 'normal').shift(0, 25),
  );
  c.show(
    'static',
    rows.map((r) => r.scoreLine),
  );
  c.show('predict', prompt);
  c.hide('invoice', prompt);
  rows.forEach((r, i) => {
    const cue = i === 0 ? 'invoice' : 'phone';
    c.show(cue, r.moving);
    c.on(cue, () => s.play(r.progress.to(0.5, { duration: 1.8 })));
    c.show(i === 0 ? 'bill-result' : 'device-result', r.guide);
  });
  c.show('table', committed);
  c.keep(p.frame);
}
