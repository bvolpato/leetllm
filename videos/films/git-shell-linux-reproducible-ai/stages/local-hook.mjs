import { mix, smooth } from '../arithmetic.mjs';
import { cueProgress } from '../construction.mjs';
import { caption, code, mark, terminal, text } from '../defaults.mjs';
export function drawLocalHook(ctx, scene, state, api) {
  const installed = cueProgress(state, 'install-hook', 0),
    failed = cueProgress(state, 'hook-failure', 1);
  if ((state.beat ?? 0) === 0) {
    mark(api, 'hook-installation', () => {
      terminal(
        ctx,
        api,
        'Tracked · scripts/pre-commit-ai-eval.sh',
        ['#!/usr/bin/env bash', 'set -euo pipefail', './scripts/run_eval.sh'],
        150,
        340,
        760,
        360,
        {
          size: 31,
          color: api.C.blue,
        },
      );
      terminal(
        ctx,
        api,
        'Clone-local · .git/hooks/pre-commit',
        installed === 1
          ? ['#!/usr/bin/env bash', 'set -euo pipefail', './scripts/run_eval.sh']
          : ['installer copies the hook here'],
        1010,
        340,
        760,
        360,
        {
          size: 31,
          color: api.C.yellow,
        },
      );
      if (installed > 0 && installed < 1)
        text(
          ctx,
          api,
          './scripts/run_eval.sh',
          mix(250, 1100, smooth(installed)),
          785,
          33,
          api.C.yellow,
          'left',
          true,
        );
    });
    code(
      ctx,
      api,
      [
        '$ ./scripts/install_hooks.sh',
        installed === 1
          ? 'Installed .git/hooks/pre-commit · executable'
          : 'Active hooks belong to this clone',
      ],
      300,
      850,
      {
        size: 32,
        lineHeight: 60,
      },
    );
  } else
    mark(api, 'hook-terminal', () =>
      terminal(
        ctx,
        api,
        'Trial · four rows staged and present in the working tree',
        [
          '$ git commit -m "add trial row"',
          'Running AI eval gate before commit...',
          ...(failed === 1
            ? [
                'Eval rows: 4 · 2 matches',
                'Gate failed: score regressed below 2/3',
                'exit 1 · commit was not created',
              ]
            : ['evaluation running']),
        ],
        150,
        340,
        1620,
        500,
        {
          color: api.C.pink,
          size: 36,
          lineHeight: 68,
        },
      ),
    );
  caption(ctx, api, 'Installer preserves an existing different hook and honors core.hooksPath');
}
export default {
  id: 'local-hook',
  draw: drawLocalHook,
  cues: ['install-hook', 'hook-failure'],
};
