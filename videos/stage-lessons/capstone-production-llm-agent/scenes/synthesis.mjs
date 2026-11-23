import { column, dot, draw, group, indicate, line, place } from 'vizmatic/stage';
import { composedRepairFixture, execute } from '../../../films/capstone-production-llm-agent/model.mjs';
import { area, heading, label, mono } from '../../kit-narrated.mjs';
import { C, countQuery, field, paper, short } from '../parts.mjs';

export default function synthesis(s, c) {
  const demo = composedRepairFixture();
  const [meta, inputs, trace, footer] = area.rows([0.6, 2.1, 5.8, 0.8], 'normal');
  const boxes = inputs.columns(4, 'normal');
  const tags = ['Reviewed expiry', 'Stored expiry', 'A300 verified', 'Execution clock'];
  const values = boxes.map((box, i) => {
    const [title, body] = box.inset('normal').rows([1, 1.3], 'tight');
    s.add(paper(box), field(title, tags[i], 'dim', 34));
    return (v, color) => place(mono(String(v), { color, size: 45 }), body, 'left');
  });
  const review = values[0](demo.original.expiresAt, C.review);
  const original = values[1](demo.original.expiresAt, C.stored);
  const edited = values[1](demo.steps[0].storedExpiry, C.active);
  const eligible = values[2](true, C.stored);
  const revoked = values[2](false, C.active);
  const now = values[3](2001, C.active);
  const deadline = values[3](demo.original.expiresAt, C.active);
  const [head, ...bands] = trace.rows([1, 1, 1, 1, 1, 1], 'tight');
  const cols = (r) => r.columns([2.3, 1.05, 1.05, 1.05, 1.2, 2.85, 0.9], 'tight');
  const headings = ['Attempt', 'Packet', 'Account', 'Time', 'Effect key', 'Executor return', 'Rows'];
  const headCells = cols(head);
  const expected = {
    'BLOCK: packet changed': ['blocked:packet_changed', 0],
    'BLOCK: stale preconditions': ['blocked:stale_preconditions', 1],
    'Local effect committed': ['simulated_restore_created', 3],
    'Duplicate ignored': ['duplicate_ignored', 3],
    'BLOCK: expired': ['blocked:expired', 2],
  };
  const effects = new Set([demo.operation]);
  const expired = execute({
    stored: demo.original, review: demo.review, now: demo.original.expiresAt, effects,
  });
  const attempts = [...demo.steps, { result: expired, effects: effects.size }];
  const names = ['Two changes', 'Expiry restored', 'Identity restored', 'Same request', 'At deadline'];
  const rows = attempts.map((step, i) => {
    const cells = cols(bands[i]);
    const [word, last] = expected[step.result];
    const points = cells.slice(1, 5).map((slot) => slot.point('center'));
    const stops = step.result.startsWith('BLOCK');
    return {
      title: field(cells[0], names[i], 'ink', 35),
      marks: points.slice(0, last + 1).map(([x, y], j) =>
        j === last && stops
          ? group(line([x - 11, y - 11], [x + 11, y + 11], { stroke: C.blocked, width: 7 }),
                  line([x - 11, y + 11], [x + 11, y - 11], { stroke: C.blocked, width: 7 }))
          : dot(12, C.effect).moveTo([x, y])),
      links: points.slice(0, last).map((p, j) => line(p, points[j + 1], { stroke: C.stored, width: 3 })),
      outcome: field(cells[5], word, stops ? C.blocked : C.effect, 31),
      count: place(mono(String(step.effects), { color: step.effects ? C.effect : 'dim', size: 39 }), cells[6]),
    };
  });
  const stations = cols(bands[0]).slice(1, 5);
  const guides = stations.map((slot) => line([slot.point('center')[0], head.bottom],
    [slot.point('center')[0], bands.at(-1).bottom], { stroke: 'grid', width: 2, dash: [4, 10] }));
  const origin = field(meta, 'Operator request    ·    r-104    /    A300    /    prod-api    ·    ' +
    short(demo.operation) + '…', C.review, 33);
  const question = field(footer, 'Which check stops first? How many committed rows?', C.active, 40);
  const mismatch = field(footer,
    'Reviewed expiry   ' + demo.original.expiresAt + '     ≠     Stored expiry   ' + demo.steps[0].storedExpiry,
    C.review, 42);
  const secondAsk = field(footer, 'With the expiry restored, which check can it reach?', C.active, 40);
  const lastAsk = field(footer, 'At the deadline, what does the call return? How many rows remain?', C.active, 39);
  const [left, right] = footer.columns(2, 'wide');
  const operator = field(right, 'Operator request   →   1 committed restore', C.effect, 36);
  const inquiry = field(left, 'Policy inquiry   →   cited reply', C.ticket, 36);
  const initial = place(column([
    label('Before the first attempt', { color: C.stored, size: 40 }),
    mono(countQuery, { size: 37 }),
    label('0 committed restores', { color: C.stored, size: 62 }),
  ], { gap: 'normal' }), trace);
  const stationsHead = headCells.map((cell, i) =>
    i === 0 || i === 5 ? field(cell, headings[i], 'dim', 33) : place(label(headings[i], { color: 'dim', size: 31 }), cell));
  s.add(heading(c.title), origin, review, original, eligible, now, initial);
  c.on('fresh-review', () => s.play(indicate(review, { scale: 1.12 })));
  c.on('test-clock', () => s.play(indicate(now, { scale: 1.12 })));
  c.swap('edit-expiry', original, edited, { after: true });
  c.swap('revoke-verification', eligible, revoked, { after: true });
  c.swap('predict-order', initial, [question, guides, stationsHead, rows[0].title]);

  // Each path stops at the first failed check. Later columns stay empty on that row.
  const walk = (cue, r, start = 0, end = r.marks.length) => c.after(cue, () => {
    for (let j = start; j < end; j++) {
      if (j) s.play(draw(r.links[j - 1]), { duration: 0.13 });
      s.add(r.marks[j]);
    }
  });
  walk('packet-result', rows[0]);
  c.swap('packet-result', question, [rows[0].outcome, mismatch], { after: true });
  c.show('packet-count', rows[0].count, { after: true });
  c.swap('fix-expiry', edited, [original, rows[1].title], { after: true });
  c.hide('fix-expiry', mismatch);
  c.show('predict-live', secondAsk);
  walk('live-result', rows[1]);
  c.swap('live-result', secondAsk, rows[1].outcome, { after: true });
  c.show('live-count', rows[1].count, { after: true });
  c.swap('fix-account', revoked, [eligible, rows[2].title], { after: true });
  walk('pass-checks', rows[2], 0, 3);
  walk('commit-result', rows[2], 3);
  c.show('commit-result', [rows[2].outcome, rows[2].count], { after: true });
  c.show('try-replay', rows[3].title);
  walk('replay-verdict', rows[3]);
  c.show('replay-verdict', rows[3].outcome, { after: true });
  c.show('duplicate-result', rows[3].count, { after: true });
  c.swap('advance-clock', now, [deadline, rows[4].title], { after: true });
  c.show('predict-deadline', lastAsk);
  walk('deadline-result', rows[4]);
  c.swap('deadline-result', lastAsk, rows[4].outcome, { after: true });
  c.show('deadline-count', rows[4].count, { after: true });
  c.show('whose-request', operator);
  c.show('ticket-payoff', inquiry);
}
