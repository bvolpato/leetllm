import { column, place } from 'vizmatic/stage';
import { mono, note } from '../../kit-narrated.mjs';
import { repositoryContext, rows, score, wrongRow } from '../parts.mjs';
import { copyStrip, readStrip, requestStrip } from '../request-strips.mjs';

export default function commitBoundary(s, c) {
  const { main } = repositoryContext(s, c);
  const trial = [...rows, wrongRow];
  const [file, a, b, run, d, foot] = main.rows([1, 2, 2, 1, 2, 1], 'normal');
  const working = requestStrip(a, 'Working tree', trial);
  const index = requestStrip(b, 'Index', trial);
  const checkout = requestStrip(d, 'CI checkout', trial);
  const name = place(mono('eval/access_requests.jsonl', { size: 37, color: 'cyan' }), file);
  const local = score(rows),
    committed = score(trial);
  const hook = place(
    mono('pre-commit    ' + local.correct + '/' + local.total + '    exit 0', { color: 'green' }),
    file,
  );
  const diffAreas = run.columns(2, 'normal');
  const diffs = [
    ['git diff', '− request 104'],
    ['git diff --cached', '+ request 104'],
  ].map(([cmd, change], i) => place(column([
    mono(cmd, { size: 32, color: 'blue' }), note(change, { color: 'yellow' }),
  ], { gap: 'tight' }), diffAreas[i]));
  const showHead = place(column([
    mono('git show HEAD', { size: 32, color: 'blue' }), note('+ request 104', { color: 'yellow' }),
  ], { gap: 'tight' }), run);
  const commit = place(mono('git commit', { size: 36, color: 'blue' }), run, 'left');
  const gate = place(
    mono(committed.correct + ' × 3 < ' + committed.total + ' × 2     exit 1', { color: 'red' }),
    foot,
  );
  const ciCommand = place(mono('CI checkout   $ ./repro.sh', { color: 'blue' }), run);
  s.add(name, working.heading, index.heading, checkout.heading, working.cards, index.cards);
  c.hide('unstaged-repair', working.cards.at(-1), { after: true });
  c.show('compare-diffs', diffs);
  readStrip(s, c, 'hook-read', working, rows.length);
  c.swap('local-pass', name, hook);
  c.swap('plain-commit', diffs, commit);
  copyStrip(s, c, 'committed-check', index, checkout, trial.length);
  readStrip(s, c, 'ci-read', checkout, trial.length);
  c.show('ci-result', gate);
  c.swap('recorded-diff', commit, showHead);
  c.swap('ci-command', showHead, ciCommand);
}
