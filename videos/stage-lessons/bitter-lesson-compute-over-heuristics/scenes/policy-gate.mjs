import { assertEqual, column, place, row } from 'vizmatic/stage';
import { chip, heading, label, mono, namedBox, note } from '../../kit-narrated.mjs';
import { BODY, gateRuler, POLICY_FLOOR } from '../parts.mjs';
import {
  releaseAction,
  releaseGate,
} from '../../../films/bitter-lesson-compute-over-heuristics/model.mjs';

export default function policy(s, c) {
  const [low, high, missing] = [0, 1, 2].map(releaseGate);
  const decide = (score, hasReport) =>
    releaseAction('promote', score, new Set(hasReport ? ['eval_report'] : []));
  assertEqual(
    [low, high, missing].map((r) => decide(r.score, r.report)),
    ['human_review_failed_gate', 'promote', 'request_evidence'],
    'release checks in order',
  );
  assertEqual(decide(POLICY_FLOOR, true), 'promote', 'inclusive cutoff');
  for (const score of ['0.98', true, NaN, 2]) {
    assertEqual(decide(score, true), 'human_review_invalid_score', 'invalid evaluation score');
  }

  const [request, fields, verdict, detail] = BODY.rows([1.2, 3.2, 0.9, 0.85], 'normal');
  const [noteArea, intentArea] = request.columns(2, 'normal');
  const message = place(label('“Ship this build.”', { size: 72 }), noteArea);
  const intent = place(
    label('Requested action    →    promote', { size: 51, color: 'cyan' }),
    intentArea,
  );
  const routes = place(
    column(
      [
        label('Ordinary ticket    →    latency, quality or access', { size: 47 }),
        label('Unknown route    →    review', { size: 47 }),
      ],
      { gap: 'wide' },
    ),
    fields,
  );
  const [file, grade] = fields.columns([0.9, 1.25], 'wide');
  const [fileName, fileValue] = file.rows([1, 2.3], 'normal');
  const [gradeName, gradeValue] = grade.rows([1, 2.3], 'normal');
  const headings = [
    place(note('Evaluation report', { size: 43 }), fileName, 'bottom'),
    place(note('Evaluation score', { size: 43 }), gradeName, 'bottom'),
  ];
  const marker = place(
    namedBox('eval_report', { width: 475, height: 120, size: 47, color: 'green' }),
    fileValue,
  );
  const empty = place(
    namedBox('Missing', { width: 475, height: 120, size: 47, dash: true, color: 'dim' }),
    fileValue,
  );
  const ruler = gateRuler(gradeValue, low.score);
  const edge = gateRuler(gradeValue, POLICY_FLOOR);
  const read = (words, color) => place(label(words, { size: 56, color }), verdict);
  const scoreText = (value) =>
    place(mono(value.toFixed(2), { size: 61, color: 'blue' }), gradeName, 'bottom');
  const lowScore = scoreText(low.score);
  const highScore = scoreText(high.score);
  const threshold = scoreText(POLICY_FLOOR);
  const review = read('Human review', 'yellow');
  const pass = read('Score check passed', 'green');
  const question = read('What happens to the request?', 'ink');
  const needReport = read('Request the report', 'yellow');
  const permitted = place(label('Finite number from 0 to 1', { size: 48 }), gradeValue);
  const invalid = place(
    row(
      ['String', 'Boolean', 'NaN'].map((v) => chip(v, { size: 40 })),
      { gap: 'wide' },
    ),
    gradeValue,
  );
  const reject = read('Invalid score    →    human review', 'yellow');
  const order = place(note('Check type and range before finiteness', { size: 42 }), detail);
  const service = place(
    note('Verify report origin   ·   match build and cohort   ·   verify caller', { size: 38 }),
    detail,
  );

  s.add(heading(c.title), message);
  c.show('proposal', intent, { after: true });
  c.show('ordinary-routes', routes);
  c.swap('release-path', routes, headings);
  c.show('report-listed', [marker, ruler]);
  c.swap('score-low', headings[1], lowScore);
  c.show('score-low', review, { after: true });
  c.hide('raise-score', [lowScore, review]);
  c.on('raise-score', () => s.play(ruler.move('score', high.score, { duration: 1.0 })));
  c.show('raise-score', highScore, { after: true });
  c.show('numeric-pass', pass, { after: true });
  c.swap('remove-report', marker, empty);
  c.swap('remove-report', pass, question);
  c.swap('missing-verdict', question, needReport, { after: true });
  c.swap('restore-report', empty, marker);
  c.hide('restore-report', [ruler, needReport]);
  c.swap('restore-report', highScore, headings[1]);
  c.show('valid-score', permitted, { after: true });
  c.swap('invalid-score', permitted, invalid);
  c.show('invalid-score', reject, { after: true });
  c.show('check-order', order);
  c.hide('boundary-score', [reject, order]);
  c.swap('boundary-score', invalid, edge);
  c.swap('boundary-score', headings[1], threshold);
  c.show('boundary-pass', pass, { after: true });
  c.show('release-service', service);
}
