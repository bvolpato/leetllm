import { cueProgress } from '../construction.mjs';
import { caption, mark, route, tag, text, transfer } from '../defaults.mjs';
export function drawEnvironmentContract(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0;
  if (currentBeat === 0) {
    const p = cueProgress(state, 'interpreter-contract', 0),
      rebuild = cueProgress(state, 'venv-rebuild', 0);
    mark(api, 'selected-interpreter', () => {
      text(
        ctx,
        api,
        '.python-version: 3.12 · version-manager hint',
        960,
        310,
        32,
        api.C.muted,
        'center',
        true,
      );
      tag(ctx, api, 'selected python', 180, 450, 430, api.C.blue);
      tag(ctx, api, 'new .venv/', 760, 450, 420, p === 1 ? api.C.cyan : api.C.muted);
      tag(ctx, api, 'scorer', 1320, 450, 420, p === 1 ? api.C.green : api.C.muted);
      route(
        ctx,
        api,
        [
          [635, 484],
          [735, 484],
        ],
        api.C.cyan,
      );
      route(
        ctx,
        api,
        [
          [1205, 484],
          [1295, 484],
        ],
        p === 1 ? api.C.cyan : api.C.muted,
      );
      transfer(ctx, api, 'Python ≥ 3.12', [210, 585], [805, 585], p, api.C.cyan, 340);
      if (p === 1)
        text(ctx, api, 'ACCESS_PYTHON=.venv/bin/python', 960, 665, 35, api.C.cyan, 'center', true);
      if (rebuild > 0) {
        text(ctx, api, 'Laptop .venv: /old/path/python', 550, 805, 30, api.C.muted, 'center', true);
        tag(ctx, api, 'rebuild', 180, 855, 270, api.C.yellow);
        text(
          ctx,
          api,
          rebuild === 1
            ? 'Destination: rebuild from declared inputs'
            : 'Absolute paths can be embedded',
          1310,
          805,
          32,
          api.C.yellow,
          'center',
        );
      }
      caption(ctx, api, 'The selected executable is checked; the hint file does not install it');
    });
  } else if (currentBeat === 1)
    mark(api, 'dependency-closure', () => {
      const locked = cueProgress(state, 'uv-locked', 1),
        all = cueProgress(state, 'locked-dependencies', 1);
      text(ctx, api, 'Complete package contracts', 960, 310, 37, api.C.ink, 'center');
      tag(ctx, api, 'pyproject.toml', 180, 410, 520, api.C.blue);
      tag(ctx, api, 'uv.lock', 180, 540, 520, api.C.cyan);
      route(
        ctx,
        api,
        [
          [725, 445],
          [820, 445],
          [820, 670],
          [925, 670],
        ],
        api.C.muted,
      );
      route(
        ctx,
        api,
        [
          [725, 575],
          [790, 575],
          [790, 670],
        ],
        api.C.muted,
      );
      tag(ctx, api, 'uv sync --locked', 950, 635, 730, locked === 1 ? api.C.cyan : api.C.muted, 35);
      text(
        ctx,
        api,
        locked === 1
          ? 'Stale lock → fail; no automatic rewrite'
          : 'Project and lock are separate inputs',
        960,
        790,
        32,
        api.C.yellow,
        'center',
      );
      if (all > 0) {
        tag(ctx, api, 'direct', 950, 400, 290, api.C.blue);
        tag(ctx, api, 'transitive', 1330, 400, 350, all === 1 ? api.C.cyan : api.C.muted);
        text(ctx, api, 'pip --require-hashes', 1300, 555, 32, api.C.ink, 'center', true);
        if (all === 1)
          text(
            ctx,
            api,
            'Pin versions + accepted artifact hashes for both',
            1300,
            605,
            26,
            api.C.cyan,
            'center',
          );
      }
      caption(ctx, api, 'OS · driver · system libraries remain declared host inputs');
    });
  else
    mark(api, 'activation-dependent-run', () => {
      const fail = cueProgress(state, 'activation-failure', 2);
      text(ctx, api, '$ source activate.sh && ./repro.sh', 960, 310, 37, api.C.ink, 'center', true);
      const steps = ['interpreter missing', 'helper returns 1', 'cleanup', 'source returns 1'];
      steps.forEach((value, i) => {
        const x = 180 + i * 420;
        tag(ctx, api, value, x, 450, 340, fail === 1 ? api.C.pink : api.C.muted, 25);
        if (i < 3) api.line(ctx, x + 350, 484, x + 405, 484, api.C.muted, 3);
      });
      if (fail > 0) {
        api.line(ctx, 950, 570, 950, 635 + fail * 80, api.C.pink, 4);
        if (fail === 1) {
          api.line(ctx, 880, 715, 1020, 715, api.C.pink, 5);
          text(ctx, api, './repro.sh never starts', 960, 800, 44, api.C.pink, 'center', true);
        }
      }
      caption(
        ctx,
        api,
        'Sourcing executes shell code in the caller; this scorer loads no real .env secret',
      );
    });
}
export default {
  id: 'environment-contract',
  draw: drawEnvironmentContract,
  cues: [
    'interpreter-contract',
    'venv-rebuild',
    'locked-dependencies',
    'uv-locked',
    'activation-failure',
  ],
};
