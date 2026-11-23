import { column, place, terminal } from 'vizmatic/stage';
import { label, mono } from '../../kit-narrated.mjs';
import { command, output } from '../checkout.mjs';
import { fixturePath, fixtureTable, repositoryContext, rows } from '../parts.mjs';
import { jsonl, newlineCount } from '../../../films/git-shell-linux-reproducible-ai/arithmetic.mjs';
import { searchResult } from '../../../films/git-shell-linux-reproducible-ai/model.mjs';

export default function shellInspection(s, c) {
  const { main } = repositoryContext(s, c);
  const [records, cmd, foot] = main.rows([5, 2, 1], 'wide');
  const fixture = place(fixtureTable(rows, records.width), records);
  const head = place(mono('head -n 1 ' + fixturePath, { color: 'blue' }), cmd);
  const wc = place(mono('wc -l < ' + fixturePath, { color: 'blue' }), cmd);
  const count = place(mono(String(newlineCount(jsonl(rows))), { color: 'cyan' }), foot);
  const [original, absent] = main.rows(2, 'normal').map(region => region.columns([3, 1], 'wide'));
  const searched = place(fixtureTable(rows, main.width * 0.8, { leading: 1.95 }), main.rows(2, 'normal')[1]);
  const present = searchResult();
  const missing = searchResult({ exists: false });
  const compare = (region, title, path, lines) => place(terminal([
    command('grep -c denied ' + path),
    ...lines,
  ], { title, columns: 45, size: 41, shown: false }), region[0], 'center');
  const existingFile = compare(original, 'Existing fixture', fixturePath, [output(present.stdout, 'cyan')]);
  const missingFile = compare(absent, 'Missing path', 'eval/missing.jsonl', [
    output('grep: eval/missing.jsonl:', 'red'),
    output('No such file or directory', 'red'),
  ]);
  const receipt = (region, meaning, status, color) => place(column([
    label(meaning, { size: 36, color }),
    mono('exit ' + status, { size: 46, color }),
  ], { gap: 'normal' }), region[1]);
  const noMatch = receipt(original, 'No matches', present.status, 'yellow');
  const readError = receipt(absent, 'Read failed', missing.status, 'red');
  s.add(fixture);
  c.show('inspect-head', head);
  c.on('inspect-head', () => s.play(fixture.light('101')));
  c.swap('inspect-count', head, wc);
  c.on('inspect-count', () => s.play(fixture.light(null)));
  c.show('newline-result', count, { after: true });
  c.swap('grep-search', [fixture, wc, count], [existingFile, searched]);
  c.on('grep-search', () => s.play(existingFile.type(0, { duration: 0.7 })), 0.35);
  c.on('grep-empty', () => s.play(existingFile.print({ from: 1, to: 1 })));
  c.show('no-match-status', noMatch, { after: true });
  c.swap('grep-change-file', searched, missingFile);
  c.on('grep-change-file', () => s.play(missingFile.type(0, { duration: 0.7 })), 0.35);
  c.on('grep-missing', () => s.play(missingFile.print({ from: 1, to: 2 })));
  c.show('read-error-status', readError, { after: true });
}
