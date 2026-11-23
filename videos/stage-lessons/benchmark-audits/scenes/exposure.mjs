import { column, place, to, indicate } from 'vizmatic/stage';
import { heading, label, note, chip } from '../../kit-narrated.mjs';
import { caseBoard, MAIN, FOOT, exposureCases } from '../parts.mjs';
export default function exposure(s, c) {
  const board = caseBoard();
  const [start, end] = MAIN.rows([2, 3], 'loose');
  const bins = end.columns(2, 'loose');
  const cards = exposureCases.map((p, i) =>
    place(
      column([chip(p.id, { color: p.used ? 'pink' : 'cyan' }), note(p.date)], { gap: 'normal' }),
      start.columns(4, 'wide')[i],
    ),
  );
  const headers = ['Regression', 'Potential fresh holdout'].map((v, i) =>
    place(label(v, { color: i ? 'cyan' : 'pink', size: 36 }), bins[i], 'bottom'),
  );
  const destinations = exposureCases.map(
    (p) => bins[p.used ? 0 : 1].columns(2, 'wide')[p.id === 'C' || p.id === 'D' ? 1 : 0],
  );
  const caption = place(note('Separate exposure fixture · tuning freeze: end of March'), FOOT);
  s.add(heading('Which cases did the team use?'), cards, headers, caption);
  c.take(board.nodes);
  c.on('exposure-beat-1-focus-1', () =>
    s.play(indicate(headers[1], { scale: 1, color: 'yellow' })),
  );
  c.on('exposure-beat-1-focus-2', () => s.play(indicate(cards, { scale: 1, color: 'yellow' })));
  c.on('exposed-move', () =>
    s.play(
      ...cards
        .filter((_, i) => exposureCases[i].used)
        .map((a) => {
          const i = cards.indexOf(a);
          return to(a, () => place(a, destinations[i], 'top'), { duration: 1.5 });
        }),
    ),
  );
  c.on('exposure-beat-2-focus-2', () => s.play(indicate(cards[2], { scale: 1, color: 'yellow' })));
  c.on('exposure-beat-2-focus-1', () =>
    s.play(indicate(headers[0], { scale: 1, color: 'yellow' })),
  );
  c.on('exposure-beat-3-focus-1', () =>
    s.play(
      ...cards
        .filter((_, i) => !exposureCases[i].used)
        .map((a) => {
          const i = cards.indexOf(a);
          return to(a, () => place(a, destinations[i], 'top'), { duration: 1.5 });
        }),
    ),
  );
  c.keep(board.nodes);
}
