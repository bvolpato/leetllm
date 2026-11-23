import { boxOf, column, dot, indicate, place, rect, row, seq, to } from 'vizmatic/stage';
import { chip, note } from '../../kit-narrated.mjs';
import { candidates } from '../../../films/active-labeling/fixtures.mjs';
import { footer, open, picture, traceRecord, TRACE_FIELDS } from '../parts.mjs';
export default function recordTypes(s, c) {
  open(s, c);
  const [left, right] = picture.columns([5, 4], 'loose');
  const trace = traceRecord(left, { cleaned: true });
  const [training, preserved] = right.rows([3, 2], 'wide');
  const [trainHead, trainBody] = training.inset('tight').rows([1, 6], 'tight');
  const [evalHead, evalBody] = preserved.inset('tight').rows([1, 4], 'tight');
  const boundaries = [training, preserved].map((r, i) =>
    place(rect(r.width - 8, r.height - 8, { stroke: i ? 'pink' : 'cyan', radius: 12 }), r).zIndex(
      -1,
    ),
  );
  const headings = [
    place(note('trace-204 · training signals', { color: 'cyan' }), trainHead),
    place(note('attack-014 · outside training', { color: 'pink' }), evalHead),
  ];
  const rows = [...trainBody.rows(3, 'tight'), ...evalBody.rows(2, 'tight')];
  const jobs = ['Demonstration', 'Pointwise', 'Preference', 'Evaluation', 'Incident'];
  const fields = [
    [
      'prompt: ' + TRACE_FIELDS.prompt.replace('Propose an ', '').replace('.', ''),
      'target A: approval + canary scope',
    ],
    [
      'completion A: approval + scope',
      'safe: ' + candidates.A.safe + ' · correct: ' + candidates.A.correct,
    ],
    ['chosen: A · rejected: B', 'decision: prefer A · approval rubric'],
    ['expected: approval before canary', 'held-out answer key: attack-014'],
    ['event: attempted write', 'authorization: missing'],
  ];
  const cells = rows.map((r) => r.columns([1.3, 3], 'normal'));
  const names = jobs.map((name, i) =>
    place(note(name, { color: i < 3 ? 'cyan' : 'pink' }), cells[i][0], 'left'),
  );
  const payloads = fields.map((fields, i) => {
    const parts = cells[i][1].rows(2, 'tight');
    return fields.map((v, j) =>
      place(note(v, { color: i < 3 ? 'cyan' : 'pink' }), parts[j], 'left'),
    );
  });
  const reservedSource = chip('attack-014', { color: 'pink' });
  const foot = place(
    row(
      [
        reservedSource,
        note('Preserved approval rule and unsafe B evidence stay outside training.'),
      ],
      { gap: 'wide' },
    ),
    footer,
  );
  const sources = [
    [trace.prompt, trace.a],
    [trace.a, trace.a],
    [trace.a, trace.b],
    [reservedSource, reservedSource],
    [reservedSource, reservedSource],
  ];
  const flights = sources.map((nodes, i) =>
    nodes.map((source, j) =>
      dot(10, i < 3 ? (nodes[j] === trace.b ? 'red' : j ? 'green' : 'cyan') : 'pink').moveTo(
        boxOf(source).point(i < 3 ? 'right' : 'top'),
      ),
    ),
  );
  const targets = payloads.map((nodes) => nodes.map((node) => boxOf(node).point('left')));
  const cues = ['training-signals', 'pointwise', 'preference', 'record-purpose', 'incident'];
  s.add(trace.nodes, boundaries, headings, names, foot);
  cues.forEach((cue, i) => {
    c.on(cue, () => s.play(indicate(sources[i], { color: i < 3 ? 'cyan' : 'pink', scale: 1 })));
    flights[i].forEach((mark, j) => {
      const offset = 0.35 + j * 0.8;
      c.show(cue, mark, { lead: -offset, fade: 0.08 });
      const corridor = (left.right + right.left) / 2;
      const sourceY = i < 3 ? boxOf(sources[i][j]).point('right')[1] : footer.top - 12;
      c.on(
        cue,
        () =>
          s.play(
            seq(
              to(mark, (n) => n.moveTo([corridor, sourceY]), { duration: 0.2 }),
              to(mark, (n) => n.moveTo([corridor, targets[i][j][1]]), { duration: 0.2 }),
              to(mark, (n) => n.moveTo(targets[i][j]), { duration: 0.2 }),
            ),
          ),
        offset + 0.1,
      );
      c.hide(cue, mark, { lead: -(offset + 0.7), fade: 0.08 });
      const phrase = c.cue(cue);
      const reveal = Math.max(
        offset + 0.85,
        j === 1 && (i === 1 || i === 2) ? phrase.end - phrase.start + 0.05 : 0,
      );
      c.show(cue, payloads[i][j], { lead: -reveal });
    });
  });
}
