import { phase } from '../arithmetic.mjs';
import { sgBegun } from '../construction.mjs';
import { arrow, box, footer, table, title } from '../defaults.mjs';
export function drawRuntimeOwners(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat,
    q = phase(state.beatP);
  api.focus.target('runtime-owners-mechanism', () => {
    title(ctx, api, 'R42 keeps its identity while the owner changes');
    const labels = [
        'input preparation',
        'scheduler',
        'model runner',
        'sampling / grammar',
        'detokenizer',
      ],
      xs = [170, 500, 830, 1160, 1490],
      active = currentBeat
        ? 4
        : sgBegun(state, 'runtime-scheduler', q > 0.3)
          ? Math.min(3, 1 + Math.floor(q * 3))
          : 0;
    labels.forEach((v, i) => {
      box(
        ctx,
        api,
        v,
        xs[i],
        390,
        290,
        105,
        i <= active ? themeColors.blue : themeColors.muted,
        25,
      );
      if (i < 4) arrow(ctx, api, xs[i] + 295, 442, xs[i + 1] - 8, 442);
    });
    const x = xs[Math.min(4, active)];
    box(ctx, api, 'R42', x + 50, 545, 190, 65, themeColors.yellow);
    const rows = [
      ['Owner', 'Retained state'],
      ['Tokenizer manager', 'input IDs + request / output identity'],
      ['Scheduler', 'runnable positions + cache locations'],
      ['Model runner', 'forward tensors + selected backend'],
      ['Detokenizer', 'generated IDs → delivered text'],
    ];
    table(ctx, api, rows, 240, 650, 1440, 56, 25);
    footer(
      ctx,
      api,
      currentBeat
        ? 'Generated ID event ≠ delivered text chunk · process boundaries vary'
        : 'Responsibility trace · illustrative multiprocess path',
    );
  });
}
export default {
  id: 'runtime-owners',
  draw: drawRuntimeOwners,
  cues: [
    'sg-runtime-owners-beat-0',
    'sg-runtime-scheduler',
    'sg-runtime-owners-beat-1',
    'sg-runtime-output',
  ],
};
