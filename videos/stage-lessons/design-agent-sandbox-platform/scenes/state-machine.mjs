import { place } from 'vizmatic/stage';
import { area, heading, label, mono, namedBox } from '../../kit-narrated.mjs';

export default function scene(s, c) {
  const [owners, entries, cmd, reply, footer] = area.rows([0.85, 2.2, 1.05, 1, 0.7], 'normal');
  const [a, b] = owners.columns([2, 1], 'wide');
  const [page, file, base] = entries.columns(3, 'wide');
  const tile = (r, v, color, dash = false) =>
    place(namedBox(v, { width: r.width - 30, height: 118, color, size: 38, dash }), r);
  const say = (text, color) => place(mono(text, { color, size: 42 }), reply);
  const call = (text) => place(mono(text, { color: 'ink', size: 48 }), cmd);
  const status = (text) => place(label(text, { size: 36, color: 'cyan' }), footer);
  const emptyPage = tile(page, 'Private pages  ∅', 'dim', true),
    emptyFile = tile(file, 'Scratch  ∅', 'dim', true);
  const written = tile(page, 'Page 1  =  99', 'cyan'),
    output = tile(file, 'output.csv   1,99', 'cyan');
  const restored = status('RESTORED'),
    ready = status('READY'),
    run = status('RUNNING'),
    cancel = status('CANCEL_REQUESTED');
  const retired = status('RETIRED'),
    disposed = status('DISPOSED');
  const dispose = call('a.dispose()');
  const wrong = call('a.confirm_retired("A", 2)'),
    right = call('a.confirm_retired("A", 1)');
  const denied = say('execution retirement required', 'yellow');
  const mismatch = say('retirement identity mismatch', 'yellow');

  s.add(
    heading(c.title),
    place(label('Python clone A  /  generation 1', { color: 'cyan', size: 42 }), a),
    place(label('Clone B  /  generation 1', { color: 'blue', size: 38 }), b),
    emptyPage,
    emptyFile,
    restored,
  );
  c.swap('admit', restored, ready, { after: true });
  c.swap('start', ready, run, { after: true });
  c.show('start', tile(base, 'B reads 20', 'blue'), { after: true });
  c.swap('write', [emptyPage, emptyFile], [written, output], { after: true });
  c.swap('cancel', run, cancel, { after: true });
  c.show('try', dispose);
  c.show('fail', denied, { after: true });
  c.swap('wrong', [dispose, denied], wrong, { after: true });
  c.show('reject', mismatch, { after: true });
  c.swap('right', [wrong, mismatch], right, { after: true });
  c.swap('retired', cancel, retired, { after: true });
  c.swap('dispose', [right, retired, written, output], [dispose, disposed, emptyPage, emptyFile], {
    after: true,
  });
}
