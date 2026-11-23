import { delay, fade, fadeIn, group, place, polygon, polyline, terminal, to } from 'vizmatic/stage';
import { area, heading, label, mono } from '../../kit-narrated.mjs';
import { command, output } from '../checkout.mjs';
import { fixturePath } from '../parts.mjs';

function filePage(name, detail, color, size, missing = false) {
  const edge = [[-310, -132], [244, -132], [310, -66], [310, 132], [-310, 132]];
  const outline = missing
    ? { fill: null, stroke: 'dim', width: 4, dash: [16, 12] }
    : { fill: color, stroke: color, width: 4 };
  const ink = missing ? 'dim' : 'bg';
  return group(
    polygon(edge, outline),
    polyline([[244, -132], [244, -66], [310, -66]], { stroke: ink, width: 4 }),
    mono(name, { size, color: ink }).at(0, -27),
    mono(missing ? 'file absent' : detail, { size: 36, color: ink }).at(0, 70),
  );
}

export default function opening(s, c) {
  const [titles, pages, scripts, detail] = area.rows([0.8, 3.05, 0.95, 2.9], 'normal');
  const [localPage, clonePage] = pages.columns(2, 'wide');
  const [localScript, cloneScript] = scripts.columns(2, 'wide');
  const headings = ['Your laptop', 'Fresh clone'].map((name, i) =>
    place(label(name, { size: 52 }), titles.columns(2, 'wide')[i]),
  );
  const settings = ['.env', 'ACCESS_API_KEY=••••', 'pink', 92];
  const env = place(filePage(...settings), localPage);
  const absent = place(filePage(...settings, true), clonePage);
  const script = () => mono('repro.sh', { size: 48, color: 'green' });
  const original = place(script(), localScript);
  const copy = place(script(), localScript).opacity(0);
  const cloneCommand = place(mono('$ git clone /work/access-rag /tmp/review/access-rag', { color: 'blue' }), detail);
  const [ruleArea, checkArea] = detail.columns([1, 1.7], 'wide');
  const rule = place(terminal([output('.env*', 'pink')], {
    title: '.gitignore · excerpt', columns: 21, size: 42,
  }), ruleArea);
  const check = place(terminal([
    command('git status --short --ignored -- .env'), output('!! .env', 'pink'),
  ], { title: 'Your laptop', columns: 38, size: 38, shown: false }), checkArea);
  const committed = place(terminal([
    command('git ls-tree --name-only HEAD -- .env repro.sh'), output('repro.sh', 'green'),
  ], { title: 'Paths in the commit', columns: 48, size: 35, shown: false }), checkArea);

  const title = heading(c.title);
  const first = [title, ...headings, env, absent, original, cloneCommand];
  s.add(...first);
  s.play(fadeIn(first, { duration: 0 }));
  c.on('clone-project', () => s.play(
    to(copy, node => place(node, cloneScript), { duration: 1.05 }),
    delay(fade(copy, 1, { duration: 0.23 }), 0.46),
  ));
  c.swap('inspect-ignore', cloneCommand, check);
  c.on('inspect-ignore', () => s.play(check.type(0, { duration: 0.85 })), 0.35);
  c.on('ignored-status', () => s.play(check.print({ from: 1, to: 1 })));
  c.show('matching-rule', rule);
  c.swap('inspect-commit', check, committed);
  c.on('inspect-commit', () => s.play(committed.type(0, { duration: 0.75 })), 0.35);
  c.on('committed-script', () => s.play(committed.print({ from: 1, to: 1 })));

  const predictions = [fixturePath.split('/').at(-1), 'saved predictions', 'cyan', 42];
  const input = place(filePage(...predictions), localPage);
  const missingInput = place(filePage(...predictions, true), clonePage);
  const failure = place(terminal([
    command('./repro.sh'),
    output('ERROR: ' + fixturePath + ' missing.', 'red'),
    command('echo $?'), output('1', 'red'),
  ], { title: 'Fresh clone · error excerpt', size: 34, columns: 48, shown: false }), detail);
  const locations = ['/work/access-rag', '/tmp/review/access-rag'].map((path, i) =>
    place(terminal([
      command('pwd'), output(path),
      command('git rev-parse --show-toplevel'), output(path),
    ], { title: i ? 'Fresh clone' : 'Your laptop', size: 34, columns: 39, shown: false }),
    detail.columns(2, 'normal')[i]),
  );
  const pathTitle = heading('Where did the script look?');
  c.swap('run-script', [title, env, absent, rule, committed], [pathTitle, input, missingInput, failure]);
  c.on('run-script', () => s.play(failure.type(0, { duration: 0.5 })), 0.35);
  c.on('fixture-error', () => {
    s.play(failure.print({ from: 1, to: 1 }));
    s.play(failure.type(2, { duration: 0.4 }));
    s.play(failure.print({ from: 3, to: 3 }));
  });
  c.swap('check-directories', failure, locations);
  c.on('check-directories', () => {
    s.play(...locations.map(term => term.type(0, { duration: 0.4 })));
    s.play(...locations.map(term => term.print({ from: 1, to: 1 })));
  }, 0.35);
  c.on('check-roots', () => {
    s.play(...locations.map(term => term.type(2, { duration: 0.6 })));
    s.play(...locations.map(term => term.print({ from: 3, to: 3 })));
  });
}
