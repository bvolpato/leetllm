import { mix } from '../arithmetic.mjs';
import { exactCue, pyP } from '../construction.mjs';
import { code, pyMark, rail, stripe, text } from '../defaults.mjs';
export function drawLockedReplay(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    q = (id) => exactCue(state, 'py-locked-' + id),
    progress = pyP(state, 'locked-replay');
  pyMark(api, 'locked-replay', () => {
    const present =
      currentBeat === 0
        ? q('exact') < 1
        : currentBeat === 1
          ? q('install') > 0 && q('remove') < 1
          : false;
    text(
      ctx,
      api,
      currentBeat === 2 ? 'Fresh declared state' : 'One disposable .venv',
      630,
      290,
      37,
      api.C.blue,
      'center',
    );
    text(ctx, api, '.venv/ installed package inventory', 230, 365, 28, api.C.muted, 'left', true);
    rail(ctx, api, 260, 410, 720, 'declared pytest + selected dependencies', api.C.cyan, 100, 28);
    if (present) {
      const removal = currentBeat === 0 ? q('exact') : q('remove');
      const y = mix(620, 780, removal),
        x = 260;
      rail(ctx, api, 260, y, 720, 'extra six 1.17.0 · undeclared', api.C.yellow, 100, 29);
    }
    if (currentBeat === 0) {
      code(
        ctx,
        api,
        [
          'uv run --locked',
          '    required present; extra may remain',
          'uv sync --locked',
          '    removes unselected packages',
        ],
        1140,
        395,
        28,
        100,
      );
      stripe(ctx, api, 1140, 840, 580, progress, api.C.cyan);
    } else if (currentBeat === 1) {
      code(
        ctx,
        api,
        [
          'uv pip install six==1.17.0',
          'uv run --locked python -c "import six"',
          'uv sync --locked',
          'uv run --locked python -c "import six"',
        ],
        1120,
        365,
        25,
        115,
      );
      if (q('import') === 1)
        text(ctx, api, 'First import: success', 1400, 535, 28, api.C.green, 'center');
      if (q('remove') === 1)
        text(
          ctx,
          api,
          q('missing') === 1 ? 'Second import: ModuleNotFoundError' : 'Second import: ?',
          1400,
          840,
          28,
          q('missing') === 1 ? api.C.pink : api.C.muted,
          'center',
          true,
        );
      if (q('declare') === 1)
        text(
          ctx,
          api,
          'Repair: declare it, then review the lock.',
          960,
          950,
          30,
          api.C.green,
          'center',
        );
    } else {
      rail(ctx, api, 260, 620, 720, 'input JSONL · separate bytes', api.C.yellow, 100, 31);
      code(
        ctx,
        api,
        [
          'code + input identities + command',
          'interpreter + dependency records',
          'generator + seed when randomness exists',
        ],
        1140,
        410,
        29,
        110,
      );
      text(ctx, api, 'This scorer uses no randomness.', 1410, 850, 32, api.C.muted, 'center');
      stripe(ctx, api, 1140, 920, 580, progress, api.C.cyan);
    }
  });
}
export default {
  id: 'locked-replay',
  draw: drawLockedReplay,
  cues: [
    'py-locked-replay-0',
    'py-locked-inexact',
    'py-locked-exact',
    'py-locked-replay-1',
    'py-locked-install',
    'py-locked-import',
    'py-locked-remove',
    'py-locked-missing',
    'py-locked-declare',
    'py-locked-replay-2',
  ],
};
