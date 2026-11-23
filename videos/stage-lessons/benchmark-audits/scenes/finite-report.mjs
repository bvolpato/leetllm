import { column, place, codeBlock, indicate } from 'vizmatic/stage';
import { heading, label, note, chip } from '../../kit-narrated.mjs';
import { caseBoard, MAIN, FOOT, RELEASES } from '../parts.mjs';
export default function finite(s, c) {
  const board = caseBoard();
  const [top, body] = MAIN.rows([1, 4], 'wide');
  const cols = body.columns(2, 'wide');
  const telemetry = (candidate) =>
    place(
      codeBlock(
        `policy = ${candidate.quality}\nschema = ${candidate.schema}\nms = ${candidate.ms}\ncost = ${candidate.cost}`,
        {
          language: 'python',
          size: 36,
        },
      ),
      cols[0],
    );
  const balanced = RELEASES.find((r) => r.id === 'Balanced');
  const specialist = RELEASES.find((r) => r.id === 'Specialist');
  const record = telemetry(balanced);
  const slower = telemetry(specialist);
  const validator = place(
    column(
      [
        chip('actual int or float', { color: 'cyan' }),
        chip('finite', { color: 'cyan' }),
        chip('rate ∈ [0, 1]', { color: 'cyan' }),
        chip('ms, cost ≥ 0', { color: 'cyan' }),
      ],
      { gap: 'wide' },
    ),
    cols[1],
  );
  const bad = place(label('True · NaN · ∞ · missing · negative', { color: 'red', size: 36 }), top);
  const comparisons = place(
    codeBlock('NaN < floor  # False\nNaN > ceiling  # False', { language: 'python', size: 36 }),
    cols[0],
  );
  const pendingComparisons = place(
    codeBlock('NaN < floor\nNaN > ceiling', { language: 'python', size: 36 }),
    cols[0],
  );
  const naive = place(
    label('Naive rule admits missing evidence', { color: 'red', size: 36 }),
    FOOT,
  );
  const reject = place(
    label('Strict reference validator → REJECT', { color: 'yellow', size: 36 }),
    FOOT,
  );
  const scope = place(note('Balanced meets all four limits'), FOOT);
  const latency = place(
    label(`Specialist    ${specialist.ms} ms > 900 ms`, { color: 'yellow' }),
    FOOT,
  );
  s.add(heading('Reject invalid evidence before comparing it'), record, validator, bad);
  c.take(board.nodes);
  c.on('finite-report-phase-0', () => s.play(indicate(record, { scale: 1, color: 'yellow' })));
  c.on('ba-finite-report-typed', () => s.play(indicate(validator, { scale: 1, color: 'red' })));
  c.on('ba-finite-report-domain', () => s.play(indicate(bad, { scale: 1, color: 'red' })));
  c.swap('finite-report-phase-1', record, pendingComparisons);
  c.swap('ba-finite-report-nan', pendingComparisons, comparisons, { after: true });
  c.show('finite-admits', naive, { after: true });
  c.swap('invalid-nan', naive, reject, { after: true });
  c.on('ba-finite-report-reject', () => s.play(indicate(validator, { scale: 1, color: 'yellow' })));
  c.swap('finite-report-phase-2', comparisons, record);
  c.hide('finite-report-phase-2', bad);
  c.swap('finite-report-phase-2', reject, scope);
  c.swap('specialist-record', [record, scope], [slower, latency]);
  c.on('ba-finite-report-scope', () => s.play(indicate(slower, { scale: 1, color: 'yellow' })));
  c.keep(board.nodes);
}
