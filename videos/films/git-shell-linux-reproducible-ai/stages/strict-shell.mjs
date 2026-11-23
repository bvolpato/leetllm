import { mix, smooth } from '../arithmetic.mjs';
import { cueProgress } from '../construction.mjs';
import { caption, code, mark, tag, terminal, text } from '../defaults.mjs';
export function drawStrictShell(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0;
  if (currentBeat === 0) {
    const p = cueProgress(state, 'rightmost-status', 0),
      err = cueProgress(state, 'stderr-separate', 0);
    mark(api, 'pipeline-status-selection', () => {
      text(
        ctx,
        api,
        'Supplied completed stage statuses · pipefail enabled',
        960,
        315,
        34,
        api.C.muted,
        'center',
      );
      [2, 7, 0].forEach((status, i) => {
        const x = 180 + i * 575;
        tag(ctx, api, `stage ${i + 1}`, x, 410, 420, api.C.blue);
        text(
          ctx,
          api,
          `exit ${status}`,
          x + 210,
          570,
          61,
          status ? api.C.yellow : api.C.cyan,
          'center',
        );
        if (i < 2) api.line(ctx, x + 445, 443, x + 545, 443, api.C.muted, 3);
      });
      if (p > 0) {
        const x = mix(1540, 965, smooth(p));
        api.line(ctx, x, 625, x, 690, api.C.yellow, 6);
      }
      text(
        ctx,
        api,
        p === 1 ? 'Rightmost nonzero → pipeline exit 7' : 'Which status survives?',
        960,
        755,
        43,
        p === 1 ? api.C.yellow : api.C.muted,
        'center',
      );
    });
    mark(api, 'pipeline-streams', () => {
      text(
        ctx,
        api,
        'stdout  ──────────────→ next stdin',
        690,
        875,
        31,
        api.C.cyan,
        'center',
        true,
      );
      if (err === 1)
        text(ctx, api, 'stderr → separate destination', 1400, 875, 29, api.C.pink, 'center', true);
    });
    caption(ctx, api, 'Read the status before the next command overwrites it');
  } else {
    const p = cueProgress(state, 'conditional-errexit', 1),
      fix = cueProgress(state, 'explicit-status', 1),
      unset = cueProgress(state, 'unset-variable', 1);
    mark(api, 'conditional-status', () => {
      terminal(
        ctx,
        api,
        'Executed Bash probe · set -e',
        [
          'probe() {',
          '  false',
          '  printf "continued\\n"',
          '}',
          'if probe; then echo accepted; fi',
        ],
        180,
        360,
        730,
        395,
        {
          color: api.C.yellow,
          size: 30,
          lineHeight: 51,
        },
      );
      if (p > 0) {
        const y = mix(505, 555, smooth(p));
        api.line(ctx, 195, y, 230, y, api.C.yellow, 5);
      }
      if (p === 1)
        code(ctx, api, ['continued', 'accepted · final status 0'], 230, 835, {
          size: 29,
          color: api.C.yellow,
          lineHeight: 52,
        });
      text(
        ctx,
        api,
        unset === 1 ? '-u: unset expansion errors' : 'Options have distinct jobs',
        960,
        305,
        32,
        api.C.cyan,
        'center',
      );
    });
    mark(api, 'explicit-check', () => {
      terminal(
        ctx,
        api,
        'Explicit dependency',
        [
          'probe() {',
          '  false || return',
          '  printf "continued\\n"',
          '}',
          'if probe; then echo accepted; fi',
        ],
        1010,
        360,
        730,
        395,
        {
          color: api.C.blue,
          size: 30,
          lineHeight: 51,
        },
      );
      if (fix === 1) {
        api.line(ctx, 1025, 505, 1060, 505, api.C.pink, 5);
        text(ctx, api, 'return 1 · no dependent print', 1375, 850, 30, api.C.pink, 'center');
      }
    });
    caption(
      ctx,
      api,
      'The tested-function exception is actual probe behavior; explicit failure controls the branch',
    );
  }
}
export default {
  id: 'strict-shell',
  draw: drawStrictShell,
  cues: [
    'rightmost-status',
    'stderr-separate',
    'conditional-errexit',
    'explicit-status',
    'unset-variable',
  ],
};
