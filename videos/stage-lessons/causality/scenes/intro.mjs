import { fadeIn, group, line, polygon, polyline, rect, to } from 'vizmatic/stage';
import { area, heading, label, mono } from '../../kit-narrated.mjs';
import { arms, captions, cells, COLORS, pct, rate, tally } from '../parts.mjs';
import { observedMix, riskBoard } from '../risk-board.mjs';

export default function intro(s, c) {
  const title = heading(c.title);
  const columns = area.columns(2, 'wide');
  const first = [title];
  const slips = ['Service outage', 'Password reset'].map((subject, i) => {
    const x = columns[i].cx;
    const paper = group(
      polygon([[-315, -166], [251, -166], [315, -102], [315, 166], [-315, 166]], {
        fill: 'ink', stroke: null,
      }),
      polyline([[251, -166], [251, -102], [315, -102]], { stroke: 'dim', width: 4 }),
      mono('Support ticket', { size: 36, color: 'bg' }).at(0, -105),
      label(subject, { size: 68, color: 'bg' }).at(0, -12),
      mono(i ? 'Easy at intake' : 'Hard at intake', { size: 38, color: 'bg' }).at(0, 75),
      line([-289, 124], [289, 124], { stroke: 'dim', width: 3, dash: [12, 9] }),
    ).at(x, -157);
    const tray = group(
      rect(750, 147, { radius: 19, stroke: COLORS[i], fill: 'surface', width: 4 }),
      label(i ? 'Human queue' : 'Assistant queue', { size: 53, color: COLORS[i] }),
    ).at(x, 220);
    first.push(paper, tray);
    return paper;
  });
  s.add(first);
  s.play(fadeIn(first, { duration: 0 }));
  const file = (i) => s.play(to(slips[i], (n) => n.at(columns[i].cx, 21)), { duration: 1.25 });
  file(0);
  c.on('reset', () => file(1));

  c.on('log', () => {
    s.remove(first);
    const board = riskBoard(s, c.title, { pooled: true });
    const counts = (tickets) => tally(tickets) + ' of ' + tickets.length;
    ['assistant', 'control'].forEach((cue, i) =>
      c.show(cue, board.panels[i].reading(counts(arms[i]) + ' resolved overall'), { after: true, lead: 0 }),
    );
    c.on('sort', () => board.move(observedMix));
    c.show('sort', board.riskLabels);
    const operands = board.equations(cells.map(([, hard]) => 'Hard: ' + counts(hard)));
    c.show('hard', operands);
    const rates = board.equations(cells.map(([, hard]) => 'Hard: ' + counts(hard) + ' = ' + pct(rate(hard))));
    c.swap('answer', operands, rates, { after: true, lead: 0 });
    captions(s, c, 'Each tile is one ticket. Green tickets resolved within 24 hours.', [
      ['sort', 'Sort the same tickets by the risk recorded before routing.'],
      ['hard', 'Among hard tickets, which workflow resolved a larger share?'],
      ['decision', 'What would happen if both workflows handled the same queue?'],
    ]);
  });
}
