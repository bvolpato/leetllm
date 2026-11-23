import {
  arrayCells,
  assertEqual,
  boxOf,
  dot,
  indicate,
  place,
  rect,
  row,
  to,
} from 'vizmatic/stage';
import { chip, display, mono, note } from '../../kit-narrated.mjs';
import { repositoryContext } from '../parts.mjs';
import { pipelineStatus } from '../../../films/git-shell-linux-reproducible-ai/arithmetic.mjs';

export default function strictShell(s, c) {
  const { main } = repositoryContext(s, c);
  const [pipelineBand, streamBand, resultBand] = main.rows([5, 2, 1], 'wide');
  const statuses = [2, 7, 0],
    result = pipelineStatus(statuses, true);
  assertEqual(result, 7, 'rightmost nonzero');
  const cells = place(
    arrayCells(statuses, { cell: 130, gap: 150, size: 58, indices: false }),
    pipelineBand,
  );
  const cursor = dot(14, 'yellow').moveTo(boxOf(cells.cell(2)).point('bottom'));
  const chosen = place(mono(`pipefail → ${result}`, { color: 'red' }), resultBand);
  const streams = place(
    row(
      [chip('stdout → next stdin', { color: 'cyan' }), chip('stderr → separate', { color: 'red' })],
      { gap: 'loose' },
    ),
    streamBand,
  );
  const [codeArea, outputArea] = main.rows([7, 1], 'normal')[0].columns([3, 2], 'wide');
  const lines = [
    'set -e',
    'probe() {',
    '  false',
    '  printf ok',
    '}',
    'if probe; then',
    '  printf success',
    'fi',
  ];
  const lineRegions = codeArea.inset('normal').rows(lines.length, 'tight');
  const code = lines.map((line, i) =>
    place(mono(line, { size: 36, color: i === 0 ? 'blue' : 'ink' }), lineRegions[i], 'left'),
  );
  const guard = place(
    mono('  false || return', { size: 36, color: 'yellow' }),
    lineRegions[2],
    'left',
  );
  const trace = dot(10, 'yellow').moveTo(lineRegions[2].point('right'));
  const outputs = outputArea.rows([1, 2, 2, 2, 1], 'wide');
  const outputFrame = place(
    rect(outputArea.width, outputArea.height, { fill: 'surface', stroke: 'grid', radius: 10 }),
    outputArea,
  );
  const outputHead = place(note('stdout / function status'), outputs[0]);
  const ok = place(mono('ok', { color: 'green' }), outputs[1]);
  const success = place(mono('success', { color: 'green' }), outputs[2]);
  const zero = place(display('probe → 0', { size: 48, color: 'green' }), outputs[3]);
  const one = place(display('probe → 1', { size: 48, color: 'red' }), outputs[3]);
  const unset = place(mono('set -u     $UNSET → error', { size: 34, color: 'red' }), resultBand);
  const fallback = place(mono('set -u     ${UNSET:-fallback} → fallback', { size: 34, color: 'cyan' }), resultBand);
  s.add(cells, cursor, streams);
  c.on('rightmost-status', () =>
    s.play(to(cursor, (n) => n.moveTo(boxOf(cells.cell(1)).point('bottom')), { duration: 0.8 })),
  );
  c.show('rightmost-status', chosen, { after: true });
  c.on('stderr-separate', () => s.play(indicate(streams, { scale: 1, color: 'yellow' })));
  c.hide(1, [cells, cursor, streams, chosen]);
  c.show(1, [code, outputFrame, outputHead], { lead: -0.3 });
  c.show('unset-variable', unset, { after: true });
  c.swap('default-expansion', unset, fallback);
  c.show('probe-false', trace);
  c.on('probe-print', () =>
    s.play(to(trace, (n) => n.moveTo(lineRegions[3].point('right')), { duration: 0.6 })),
  );
  c.show('probe-print', ok, { after: true });
  c.show('conditional-errexit', zero, { after: true });
  c.on('probe-success', () =>
    s.play(to(trace, (n) => n.moveTo(lineRegions[6].point('right')), { duration: 0.6 })),
  );
  c.show('probe-success', success);
  c.hide('explicit-status', [code[2], ok, success, zero, fallback]);
  c.show('explicit-status', guard, { lead: -0.3 });
  c.on('explicit-status', () =>
    s.play(
      to(trace, (n) => n.moveTo(lineRegions[2].point('right')), { duration: 0.7 }),
      to(code[3], (n) => n.color('dim')),
      to(code[6], (n) => n.color('dim')),
    ),
  );
  c.show('explicit-status', one, { after: true });
}
