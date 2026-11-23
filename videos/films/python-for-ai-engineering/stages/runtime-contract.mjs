import { exactCue } from '../construction.mjs';
import { footer, pyMark, rail, stripe, text } from '../defaults.mjs';
export function drawRuntimeContract(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    q = (id) => exactCue(state, 'py-runtime-' + id);
  pyMark(api, 'runtime-contract', () => {
    const inputs = [
      ['pyproject.toml', 'requires-python = ">=3.12"'],
      ['.python-version', '3.12'],
      ['uv.lock', 'resolved dependencies'],
    ];
    inputs.forEach(([name, value], i) => {
      const active =
        currentBeat === 0 || currentBeat === 2 || i === 0
          ? q('init')
          : i === 1
            ? q('pin')
            : q('sync');
      const y = 310 + i * 155;
      text(ctx, api, name, 185, y, 31, api.C.blue, 'left', true);
      rail(
        ctx,
        api,
        185,
        y + 22,
        670,
        currentBeat === 1 && active === 0 ? 'await command' : value,
        api.C.blue,
        76,
        29,
      );
    });
    text(
      ctx,
      api,
      currentBeat === 0
        ? '.venv/   ·   packages for this checkout'
        : currentBeat === 2
          ? 'Portable inputs'
          : 'Actual disposable project · selected fields',
      185,
      835,
      30,
      api.C.muted,
    );
    if (currentBeat === 0) {
      text(ctx, api, 'Python version', 925, 310, 32, api.C.ink);
      text(ctx, api, 'Project ≥ 3.12', 1365, 310, 32, api.C.blue, 'center');
      text(ctx, api, 'Pin 3.12', 1655, 310, 32, api.C.yellow, 'center');
      const minor = q('minor');
      ['3.11.9', '3.12.2', '3.12.8', '3.13.0'].forEach((version, i) => {
        const y = 430 + i * 120;
        const minorVersion = Number(version.split('.')[1]);
        const fitsPin = minorVersion === 12;
        if (fitsPin && minor > 0) {
          api.line(ctx, 914, y + 25, 914 + 845 * minor, y + 25, api.C.yellow, 3);
        }
        text(ctx, api, version, 925, y, 45, api.C.ink, 'left', true);
        text(ctx, api, minorVersion >= 12 ? 'yes' : 'no', 1365, y, 40,
          minorVersion >= 12 ? api.C.blue : api.C.muted, 'center', true);
        text(ctx, api, minor < 1 ? '?' : fitsPin ? 'yes' : 'no', 1655, y, 40,
          minor === 1 && fitsPin ? api.C.yellow : api.C.muted, 'center', true);
      });
    } else if (currentBeat === 1) {
      const commands = [
        'uv init --bare --python 3.12',
        'uv python pin 3.12',
        'uv sync',
        'uv run python --version',
      ];
      commands.forEach((s, i) => {
        const p = q(['init', 'pin', 'sync', 'run'][i]);
        text(
          ctx,
          api,
          '$ ' + s,
          970,
          340 + 100 * i,
          29,
          p === 1 ? api.C.green : api.C.muted,
          'left',
          true,
        );
        stripe(ctx, api, 970, 365 + 100 * i, 710, p, api.C.green);
      });
      if (q('sync') > 0)
        rail(
          ctx,
          api,
          970,
          760,
          710,
          q('sync') === 1 ? '.venv/ · local installed files' : 'Installing selected packages…',
          api.C.cyan,
          85,
          28,
        );
      if (q('activation') === 1)
        text(ctx, api, 'activate → shell PATH', 1325, 910, 30, api.C.yellow, 'center', true);
    } else {
      const p = q('locked'),
        changed = p > 0;
      text(ctx, api, 'Separate changed-dependency case', 1260, 315, 31, api.C.yellow, 'center');
      rail(
        ctx,
        api,
        970,
        365,
        710,
        changed ? 'project adds a required package' : 'project and lock agree',
        api.C.cyan,
        90,
        27,
      );
      rail(ctx, api, 970, 530, 710, 'uv.lock · previous resolution', api.C.blue, 90, 28);
      stripe(ctx, api, 970, 660, 710, p, api.C.pink);
      if (p === 1) {
        rail(ctx, api, 970, 725, 710, '--locked stops before the scorer', api.C.pink, 90, 28);
        text(ctx, api, 'Lock bytes remain unchanged.', 1325, 875, 30, api.C.muted, 'center');
      }
    }
  });
  if (currentBeat === 2) footer(ctx, api, 'Environment resolution and evaluated input identity are separate records.');
}
export default {
  id: 'runtime-contract',
  draw: drawRuntimeContract,
  cues: [
    'py-runtime-contract-0',
    'py-runtime-minor',
    'py-runtime-contract-1',
    'py-runtime-init',
    'py-runtime-pin',
    'py-runtime-sync',
    'py-runtime-run',
    'py-runtime-activation',
    'py-runtime-contract-2',
    'py-runtime-locked',
  ],
};
