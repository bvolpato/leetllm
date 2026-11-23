import {
  arrow,
  assertEqual,
  boxOf,
  codeBlock,
  column,
  dot,
  fitted,
  indicate,
  pipeline,
  place,
  rect,
  to,
} from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import { repositoryContext } from '../parts.mjs';

export default function environmentContract(s, c) {
  const { main } = repositoryContext(s, c);
  const [hintBand, buildBand, hostBand, foot] = main.rows([1, 6, 1, 1], 'normal');
  const hint = place(
    mono('.python-version: version-manager hint', { size: 34, color: 'cyan' }),
    hintBand,
  );
  const [inputsArea, pathArea, destination] = buildBand.columns([4, 1, 4], 'normal');
  const inputs = inputsArea.rows(3, 'wide');
  const outputs = destination.inset('normal').rows([1, 2, 2, 2], 'normal');
  const shell = place(
    rect(destination.width, destination.height, { fill: 'surface', stroke: 'dim', radius: 12 }),
    destination,
  ).zIndex(-1);
  const envName = place(mono('.venv / destination', { size: 31, color: 'dim' }), outputs[0]);
  const selected = place(
    column(
      [
        label('selected Python ≥ 3.12', { size: 34, color: 'blue' }),
        mono('python3.12 -m venv .venv', { size: 31, color: 'blue' }),
      ],
      { gap: 'normal' },
    ),
    inputs[0],
  );
  const uv = place(
    column(
      [
        mono('pyproject.toml + uv.lock', { size: 31, color: 'cyan' }),
        mono('uv sync --locked', { size: 31, color: 'blue' }),
      ],
      { gap: 'normal' },
    ),
    inputs[1],
  );
  const hashes = place(
    column(
      [
        mono('requirements.txt', { size: 31, color: 'cyan' }),
        note('all direct + transitive pins'),
      ],
      { gap: 'normal' },
    ),
    inputs[2],
  );
  const install = place(mono('python -m pip install --require-hashes -r requirements.txt', { size: 37, color: 'blue' }), foot);
  const interpreter = place(mono('.venv/bin/python', { size: 34, color: 'blue' }), outputs[1]);
  const uvPackages = place(
    column(
      [label('locked dependencies', { size: 34, color: 'green' }), note('stale lock → refuse')],
      { gap: 'normal' },
    ),
    outputs[2],
  );
  const pipPackages = place(
    column(
      [
        label('pinned dependencies', { size: 34, color: 'green' }),
        note('hashes match intended artifacts'),
      ],
      { gap: 'normal' },
    ),
    outputs[3],
  );
  const targets = [interpreter, uvPackages, pipPackages];
  const sourceNodes = [selected, uv, hashes];
  const paths = sourceNodes.map((node, i) =>
    arrow(boxOf(node).point('right'), boxOf(targets[i]).point('left'), { stroke: 'dim', pad: 16 }),
  );
  const packets = sourceNodes.map((node) => {
    const p = boxOf(node).point('right');
    return dot(14, 'blue').moveTo([p[0] + 32, p[1]]);
  });
  const host = place(note('host inputs: OS · driver · system libraries'), hostBand);
  const exported = place(mono('export PYTHON_BIN="$VIRTUAL_ENV/bin/python"', { size: 36, color: 'blue' }), foot);
  const [flowBand, codeBand, failureFoot] = main.rows([3, 4, 1], 'wide');
  const flow = place(
    fitted(flowBand, (width) =>
      pipeline(['Python', 'helper', 'cleanup', 'source', 'eval'], {
        width,
        size: 34,
        gates: false,
      }),
    ),
    flowBand,
  );
  const checked = place(
    codeBlock([
      'if _activate_main; then _activate_status=0',
      'else _activate_status=$?',
      'fi',
      'unset -f _activate_main _activate_fail',
      'if [[ $_activate_status -ne 0 ]]; then',
      '  return "$_activate_status" 2>/dev/null || exit "$_activate_status"',
      'fi',
      'unset _activate_status',
    ].join('\n'), {
      language: 'bash',
      size: 31,
      panel: false,
    }),
    codeBand,
  );
  const failed = place(
    mono('source activate.sh && ./repro.sh    →    scorer skipped', { size: 36, color: 'red' }),
    failureFoot,
  );
  const buildNodes = [hint, shell, envName, selected, uv, hashes, paths, targets, install, host];
  s.add(hint, shell, envName, selected, uv, hashes);
  ['create-venv', 'uv-locked', 'locked-dependencies'].forEach((cue, i) => {
    c.show(cue, packets[i], { fade: 0.1 });
    c.on(
      cue,
      () =>
        s.play(
          to(
            packets[i],
            (n) => {
              const p = boxOf(targets[i]).point('left');
              return n.moveTo([p[0] - 32, p[1]]);
            },
            { duration: 0.8 },
          ),
        ),
      0.15,
    );
    c.hide(cue, packets[i], { lead: -1.05, fade: 0.1 });
    c.show(cue, [paths[i], targets[i]], { after: true });
  });
  c.show('interpreter-contract', exported, { after: true });
  c.on('venv-rebuild', () => s.play(indicate(shell, { scale: 1, color: 'yellow' })));
  c.swap('locked-dependencies', exported, install);
  c.show('host-inputs', host);
  c.hide(2, buildNodes);
  c.show(2, [flow, checked], { lead: -0.3 });
  c.on('missing-interpreter', () => {
    s.play(indicate(flow.names[0], { scale: 1, color: 'red' }));
    s.play(flow.put({ id: 'setup', badge: '1', color: 'red' }, { duration: 0.25 }));
    s.play(flow.move('setup', 1, { duration: 0.4 }));
  });
  c.on('preserve-cleanup', () => s.play(flow.move('setup', 2, { duration: 0.4 })));
  c.on('source-failed', () => s.play(flow.move('setup', 3, { duration: 0.6 })));
  c.after('source-failed', () => s.play(flow.stop('setup', '1', { duration: 0.3 })));
  c.show('activation-failure', failed, { after: true });
  assertEqual(flow.reached(4), 0, 'dependent evaluation is skipped');
  c.clear(flow.laneNodes, 0.46, 0.2);
}
