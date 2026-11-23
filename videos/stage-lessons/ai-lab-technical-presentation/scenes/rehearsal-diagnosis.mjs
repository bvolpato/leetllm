import { dot, place, rect, to } from 'vizmatic/stage';
import { sourceWaitBudget } from '../../../films/ai-lab-technical-presentation/arithmetic.mjs';
import { REPEATED_CURSOR_PAGES } from '../../../films/ai-lab-technical-presentation/fixtures.mjs';
import { PAIRED, addTitle, work, caption, ledger, readout, track, CASE } from '../parts.mjs';

export default function rehearsalDiagnosis(s, c) {
  addTitle(s, c);
  const [top, foot] = work.rows([4, 1]);
  const t = ledger(
    top,
    ['Claim on the slide', 'Missing evidence', 'Supporting artifact'],
    [
      {
        id: 'req',
        'Claim on the slide': 'Package diagram',
        'Missing evidence': 'Request and failure',
        'Supporting artifact': ' ',
      },
      {
        id: 'score',
        'Claim on the slide': 'Hit-rate gain',
        'Missing evidence': 'Denominator',
        'Supporting artifact': ' ',
      },
      {
        id: 'owner',
        'Claim on the slide': 'Personal contribution',
        'Missing evidence': 'What the presenter owned',
        'Supporting artifact': ' ',
      },
      {
        id: 'project',
        'Claim on the slide': 'Migration improved retrieval',
        'Missing evidence': 'Cause of the gain',
        'Supporting artifact': `Before ${PAIRED.baselineHits}/${PAIRED.n} · after ${PAIRED.candidateHits}/${PAIRED.n}`,
      },
    ],
  );
  const prompt = caption(foot, 'Ask the presenter to defend one row.', 'dim');
  const [controls, result] = foot.columns([2, 1], 'wide');
  const [inputs, paths] = controls.rows(2, 'tight');
  const [oldPath, newPath] = paths.columns(2);
  const fixed = caption(inputs, 'Fixed queries, corpus, labels and tenant', 'dim', 34);
  const old = caption(oldPath, 'Old connector path', 'blue', 34);
  const next = caption(newPath, 'Candidate path', 'cyan', 34);
  const selector = dot(9, 'yellow').moveTo(oldPath.point('bottom'));
  const [trialName, empty] = result.rows([1, 1.1], 'tight');
  const trial = caption(trialName, 'Proposed path-only trial', 'yellow', 36);
  const slot = place(
    rect(empty.width * 0.84, empty.height * 0.9, {
      fill: null,
      stroke: 'dim',
      dash: [10, 7],
      width: 3,
      radius: 8,
    }),
    empty,
  );
  const proposal = [fixed, old, next, selector, trial, slot];
  const scope = caption(foot, 'Replay uses recorded inputs in a test environment.', 'cyan');
  const appendix = caption(foot, 'Open the evidence for the question being asked.', 'cyan');
  const question = caption(foot, 'Would a service split remove the source wait?', 'yellow');
  const signal = caption(foot, 'Measure shared-process contention.', 'yellow');
  const timing = sourceWaitBudget();
  const bars = top.rows(2, 'tight').flatMap((band, i) => {
    const [plot, total] = band.columns([4, 1]);
    const parts = [
      { name: 'Source wait', value: timing.wait, color: 'blue' },
      { name: 'Other work', value: timing.other, color: 'cyan' },
    ];
    if (i) parts.push({ name: 'Remote hop', value: timing.hop, color: 'yellow' });
    const name =
      (i ? 'Separate service' : 'In process') + '   ·   ' + timing.wait + ' ms source wait';
    return [
      track(plot, name, timing.after, parts),
      readout(total, String(i ? timing.after : timing.before), 'ms total'),
    ];
  });
  const receipts = ledger(
    top,
    ['Request', 'Page', 'Source returned', 'Adapter action'],
    REPEATED_CURSOR_PAGES.map((p, i) => ({
      id: String(p.page),
      Request: CASE.request,
      Page: String(p.page),
      'Source returned': p.nextCursor,
      'Adapter action': i ? 'Stop before page 3' : 'Remember cursor',
    })),
  );
  const stopped = caption(foot, 'The adapter reports an incomplete result.', 'yellow');
  s.add(t, prompt);
  const fill = (id, v) => [t.light(id), t.setCell(id, 'Supporting artifact', v)];
  c.on('request', () => s.play(...fill('req', CASE.request + ' / C-17')));
  c.on('denom', () => s.play(...fill('score', PAIRED.n + ' frozen queries')));
  c.on('own', () => s.play(...fill('owner', 'Adapter contract tests')));
  c.swap('confound', prompt, proposal);
  c.on('confound', () => s.play(t.light('project')));
  c.after('confound', () => s.play(to(selector, (n) => n.moveTo(newPath.point('bottom')))));
  c.swap('scope', proposal, scope);
  c.swap('appendix', scope, appendix);
  c.swap('question', [t, appendix], [bars, question]);
  c.swap('reverse', question, signal);
  c.swap('failure', [bars, signal], [receipts, stopped]);
  c.after('failure', () => s.play(receipts.light(String(REPEATED_CURSOR_PAGES.at(-1).page))));
}
