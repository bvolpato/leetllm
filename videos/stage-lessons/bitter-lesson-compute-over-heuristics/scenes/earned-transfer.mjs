import { place, boxOf, column, line, row, assertEqual } from 'vizmatic/stage';
import { heading, label, mono, note, namedBox, chip } from '../../kit-narrated.mjs';
import { BODY, gateRuler, POLICY_FLOOR } from '../parts.mjs';
import { plans, forwardWork, workChart, checkWork } from '../lifetime-work.mjs';
import { baselineCases } from '../../../films/bitter-lesson-compute-over-heuristics/fixtures.mjs';
import { releaseAction } from '../../../films/bitter-lesson-compute-over-heuristics/model.mjs';

export default function earned(s, c) {
  const chart = workChart(s, 200);
  const bars = [chart.legend, chart.scale, chart.large.nodes, chart.small.nodes];
  const extra = 100;
  const rate = (2 * plans.small.parameters) / 1e9;
  checkWork(plans.large, 200, '8.68');
  checkWork(plans.small, 200 + extra, '9.00');
  const premise = place(label('Same requests  ·  same quality', { size: 41 }), chart.foot);
  const revision = place(
    column(
      [
        mono('3B model only: +' + extra + 'B reasoning tokens × ' + rate + 'B FLOPs/token', {
          size: 38,
        }),
        label('Which plan now uses fewer lifetime FLOPs?', { color: 'yellow', size: 42 }),
      ],
      { gap: 'normal' },
    ),
    chart.foot,
  );
  const ranking = place(
    label('Extra serving work: ' + forwardWork(plans.small, extra).toFixed(2) + ' zettaFLOPs', {
      size: 44,
      color: 'green',
    }),
    chart.foot,
  );

  const score = 0.97;
  const decision = (evidence) => releaseAction('promote', score, new Set(evidence));
  const withReport = decision(['eval_report']);
  const withoutReport = decision([]);
  assertEqual(withReport, 'promote', 'release request with report marker');
  assertEqual(withoutReport, 'request_evidence', 'same release request without report marker');
  const [candidate, fields, output, follow] = BODY.rows([0.7, 2.5, 1, 0.7], 'wide');
  const [left, right] = fields.columns(2, 'loose');
  const [reportName, slot] = left.rows([0.6, 2.4], 'tight');
  const [scoreName, scale] = right.rows([0.6, 2.4], 'tight');
  const proposal = place(
    label('7B candidate    ·    proposed action: promote', { size: 48 }),
    candidate,
  );
  const reportTitle = place(note('Supplied evidence', { size: 38 }), reportName);
  const scoreTitle = place(note('Evaluation score', { size: 38 }), scoreName);
  const marker = place(namedBox('eval_report', { width: 480, height: 100, color: 'green' }), slot);
  const empty = place(
    namedBox('Empty', { width: 480, height: 100, color: 'dim', dash: true }),
    slot,
  );
  const ruler = gateRuler(scale, score, score.toFixed(2));
  const pass = place(
    row(
      [note('Local gate returns', { size: 38 }), mono(withReport, { size: 49, color: 'green' })],
      { gap: 'normal' },
    ),
    output,
  );
  const question = place(
    label('Which action does the local gate return now?', { size: 43, color: 'yellow' }),
    output,
  );
  const missing = place(
    row(
      [
        note('Local gate returns', { size: 38 }),
        mono(withoutReport, { size: 49, color: 'yellow' }),
      ],
      { gap: 'normal' },
    ),
    output,
  );
  const check = place(
    note('Required evidence: evaluation report for this build', { size: 39 }),
    follow,
  );
  const [textBand, inputBand, piecesBand, nextBand] = BODY.rows([0.7, 1, 1.4, 0.8], 'normal');
  const text = baselineCases.at(-1).text;
  const words = text.toLowerCase().match(/[a-z]+/g);
  assertEqual(words, ['can', 't', 'authenticate'], 'letter runs in the access ticket');
  const ticketName = place(note('Access ticket', { size: 40 }), textBand);
  const rawText = place(mono(text, { size: 96, color: 'cyan' }), inputBand);
  const bounds = boxOf(rawText);
  const charWidth = bounds.width / text.length;
  const marks = [...text.matchAll(/[a-z]+/g)].map(({ index, 0: word }) =>
    line(
      [bounds.left + index * charWidth, bounds.bottom + 6],
      [bounds.left + (index + word.length) * charWidth, bounds.bottom + 6],
      { stroke: 'green', width: 7 },
    ),
  );
  const pieces = place(
    column(
      [
        row(
          words.map((word) => chip(word, { color: 'green', size: 50 })),
          { gap: 'normal' },
        ),
        note('3 letter runs in 2 written words', { size: 38 }),
      ],
      { gap: 'normal' },
    ),
    piecesBand,
  );
  const next = place(
    note('Next lesson: why token IDs must match the checkpoint', { size: 37 }),
    nextBand,
  );
  assertEqual(score >= POLICY_FLOOR, true, 'score stays above the inclusive floor');

  const title = heading(c.title);
  s.add(title, bars, premise);
  c.swap('extra-tokens', premise, revision);
  c.swap('extra-work', revision, ranking, { after: true });
  c.after('new-total', () => s.play(...chart.small.advance(200 + extra, 0.85)));
  const gateTitle = heading('Can the 7B build move forward?');
  c.swap(
    'release-request',
    [title, bars, ranking],
    [gateTitle, proposal, reportTitle, scoreTitle, marker, ruler],
  );
  c.show('local-pass', pass, { after: true });
  c.hide('remove-marker', pass);
  c.swap('remove-marker', marker, empty);
  c.show('gate-question', question);
  c.swap('gate-answer', question, missing, { after: true });
  c.show('match-report', check);
  c.swap(
    'last-ticket',
    [gateTitle, proposal, reportTitle, scoreTitle, empty, ruler, missing, check],
    [heading('What counted as a word?'), ticketName, rawText],
  );
  c.show('split-word', marks, { after: true });
  c.show('letter-runs', pieces, { after: true });
  c.show('next-lesson', next);
}
