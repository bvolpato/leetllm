import {
  assertEqual,
  boxOf,
  fadeIn,
  group,
  line,
  linear,
  place,
  polygon,
  rect,
  row,
  to,
} from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { BODY } from '../parts.mjs';
import { exactRoute } from '../../../films/bitter-lesson-compute-over-heuristics/model.mjs';
import { baselineCases } from '../../../films/bitter-lesson-compute-over-heuristics/fixtures.mjs';

export default function opening(s, c) {
  const [ruleBand, firstTicket, secondTicket, clock] = BODY.rows([0.65, 2, 2, 0.65], 'normal');
  const keyword = 'timeout';
  const rule = place(
    row(
      [
        note('Routing rule', { size: 38 }),
        mono(keyword, { size: 54, color: 'cyan' }),
        label('→  latency', { size: 52 }),
      ],
      { gap: 'normal' },
    ),
    ruleBand,
  );
  const tickets = [firstTicket, secondTicket].map((band, i) => {
    const ticket = band.inset(8, 0);
    const [message, stub] = ticket.columns([2.5, 1], 0);
    const { top, bottom, left, right } = ticket;
    const seam = stub.left;
    const outline = polygon(
      [
        [left, top],
        [seam - 15, top],
        [seam, top + 14],
        [seam + 15, top],
        [right, top],
        [right, bottom],
        [seam + 15, bottom],
        [seam, bottom - 14],
        [seam - 15, bottom],
        [left, bottom],
      ],
      { fill: 'surface', stroke: 'dim', width: 2 },
    );
    const perforation = line([seam, top + 20], [seam, bottom - 20], {
      stroke: 'dim',
      width: 2,
      dash: [7, 10],
    });
    const [nameBand, reportBand, rulerBand] = message.inset(52, 16).rows([0.55, 1, 1], 4);
    const name = place(
      note('Support ticket  ·  I-' + (16 + i), { size: 32, color: 'dim' }),
      nameBand,
      'left',
    );
    const report = baselineCases[i].text;
    const size = 65;
    const text = place(mono(report, { size }), reportBand, 'left');
    const bounds = boxOf(text);
    const pitch = bounds.width / report.length;
    const markerWidth = pitch * keyword.length;
    const strip = (color, offset = 0) => {
      const height = size * 1.06;
      const top = -height / 2;
      const plate = rect(markerWidth + 14, height, { fill: color, radius: 6 });
      const fingers = [-1, 1].map((side) => {
        const x = side * (markerWidth / 2 + 5);
        return line([x, top], [x, top - 15], { stroke: color, width: 4 });
      });
      return group(plate, ...fingers, mono(keyword, { size, color: 'bg' })).at(
        bounds.left + markerWidth / 2 + offset * pitch,
        rulerBand.cy,
      );
    };
    const offset = report.includes(keyword)
      ? report.indexOf(keyword)
      : report.length - keyword.length;
    const scanner = strip('cyan');
    const replay = strip('cyan');
    const scanTo = (node, index, duration) =>
      to(node, (n) => n.at(bounds.left + markerWidth / 2 + index * pitch, rulerBand.cy), {
        duration,
        ease: linear,
      });
    const stubTitle = place(note('Destination', { size: 34 }), stub.inset(20), 'top');
    const route = exactRoute(report, [keyword]);
    const output = place(
      label(route.replace('_', ' '), { size: 52, color: i === 0 ? 'green' : 'yellow' }),
      stub,
    );
    return {
      face: [outline, perforation, name, text, stubTitle],
      route,
      output,
      scanner,
      replay,
      strip,
      scanTo,
      offset,
    };
  });
  const [first, second] = tickets;
  assertEqual(
    tickets.map((t) => t.route),
    ['latency', 'manual_review'],
    'two tickets through the latency check',
  );
  const match = first.strip('green', first.offset);
  const status = (text, color = 'blue') => place(label(text, { size: 47, color }), clock);
  const roundOne = status('1 worker   ·   round 1');
  const roundTwo = status('1 worker   ·   round 2');
  const together = status('2 workers   ·   round 1');
  const question = status('Where does “tokens arrive slowly” go?', 'yellow');
  const result = status('1 worker: 2 rounds     ·     2 workers: 1 round');
  const methods = status('Learn from examples    ·    Search more choices');

  const firstFrame = [heading(c.title), rule, first.face, second.face, roundOne, first.scanner];
  s.add(firstFrame);
  s.play(fadeIn(firstFrame, { duration: 0 }));
  s.play(first.scanTo(first.scanner, 2, 0.55));
  s.play(first.scanTo(first.scanner, first.offset - 1, c.beats[0].end - c.start - 0.55));
  c.on('first-scan', () => s.play(first.scanTo(first.scanner, first.offset, 0.7)));
  c.swap('first-scan', first.scanner, match, { after: true });
  c.show('control-match', first.output, { after: true });
  c.swap('second-round', roundOne, roundTwo);
  c.show('second-round', second.scanner, { lead: 0 });
  c.on('second-round', () => s.play(second.scanTo(second.scanner, second.offset, 2.2)));
  c.show('initial-miss', second.output, { after: true });
  c.hide('add-worker', [match, second.scanner, first.output, second.output]);
  c.swap('add-worker', roundTwo, together);
  c.show(
    'same-round',
    tickets.map((t) => t.replay),
    { lead: 0 },
  );
  c.on('same-round', () => s.play(...tickets.map((t) => t.scanTo(t.replay, t.offset, 1.3))));
  c.swap('two-worker-question', together, question);
  c.swap('parallel-result', question, result, { after: true });
  c.swap('parallel-result', first.replay, match, { after: true });
  c.show('parallel-result', [first.output, second.output], { after: true });
  c.swap('learn-or-search', result, methods);
}
