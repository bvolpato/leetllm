import { boxOf, draw, line, place, rect, row } from 'vizmatic/stage';
import { label } from '../../kit-narrated.mjs';
import { caption, CASE, work } from '../parts.mjs';

export default function opening(s, c) {
  const { daysBefore, daysAfter } = CASE;
  const gap = daysBefore - daysAfter;
  const [headline, subject, chart, answer] = work.rows([1.2, 0.55, 2.1, 1.05], 'normal');
  const saved = label('saved', { size: 84 });
  const draft = place(
    row([label('“My connector', { size: 84 }), saved, label(gap + ' days.”', { size: 84 })], {
      gap: 18,
    }),
    headline,
  );
  const word = boxOf(saved);
  const underline = line([word.left, word.bottom + 4], [word.right, word.bottom + 4], {
    stroke: 'yellow',
    width: 8,
  });
  const topic = caption(
    subject,
    'Example project   ·   adding partner runbooks to search',
    'ink',
    42,
  );
  const rows = chart.rows(2, 'normal').map((band, i) => {
    const days = i ? daysAfter : daysBefore;
    const color = i ? 'cyan' : 'blue';
    const [group, strip, value] = band.columns([1.2, 5, 1], 'normal');
    const slots = strip.columns(daysBefore, 7);
    const cells = slots
      .slice(0, days)
      .map((slot) =>
        place(rect(slot.width, slot.width, { fill: color, stroke: null, radius: 6 }), slot),
      );
    return {
      cells,
      name: caption(group, i ? 'Later group' : 'Earlier group', 'ink', 39),
      total: caption(value, days + ' days', color, 52),
      slots,
    };
  });
  const slots = rows[1].slots;
  const omitted = slots.slice(daysAfter).map((slot) =>
    place(
      rect(slot.width, slot.width, {
        fill: null,
        stroke: 'dim',
        width: 2,
        dash: [6, 6],
        radius: 6,
      }),
      slot,
    ),
  );
  const review = caption(answer, c.title, 'yellow', 48);
  const question = caption(
    answer,
    'How much of that gap can you credit to your connector?',
    'yellow',
    48,
  );
  const supported = caption(
    headline,
    '“Onboarding took ' + gap + ' fewer days in these groups.”',
    'cyan',
    67,
  );
  const check = caption(answer, 'Compare source difficulty and staff time', 'yellow', 46);
  const first = [draft.nodes, topic, review, ...rows.map((r) => [r.name, r.cells, r.total])].flat(
    Infinity,
  );
  s.add(first);
  for (const node of first) node.track('opacity').step(0, 1);
  s.play(draw(underline), { duration: 0.8 });
  c.show('gap', omitted, { stagger: 0.035 });
  c.swap('ask', review, question);
  c.swap('scope', [draft, underline], supported, { after: true });
  c.swap('check', question, check);
}
