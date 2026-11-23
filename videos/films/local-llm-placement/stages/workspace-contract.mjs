import { sentenceCounts } from '../fixtures.mjs';
import { constructionNote, constructionRectangle, constructionText } from '../defaults.mjs';
export function drawWorkspaceContract(ctx, scene, state, api) {
  api.focus.target('pl-workspace-contract-trace', () => {
    const { C, components: c } = api,
      b = state.beat,
      beatP = state.beatP ?? 0;
    const op = (beat, sentence) => {
      if (
        !sentenceCounts['workspace-contract'] ||
        sentence < 0 ||
        sentence >= sentenceCounts['workspace-contract'][beat]
      )
        throw Error('Invalid placement sentence workspace-contract/' + beat + '/' + sentence);
      if (b > beat) return 1;
      if (b < beat) return 0;
      return state.cues
        ? api.focus.progress(`pl-${'workspace-contract'}-${beat}-${sentence}`, 0)
        : Math.max(0, Math.min(1, beatP * sentenceCounts['workspace-contract'][beat] - sentence));
    };
    const done = (beat, sentence) => op(beat, sentence) >= 1;
    {
      constructionText(
        ctx,
        api,
        'One pool · one phase · coexisting allocations',
        150,
        280,
        34,
        C.cyan,
      );
      const phases = [
          ['Prefill', 3],
          ['Decode', 1.4],
        ],
        items = [
          ['Weights', 7.6, C.blue],
          ['KV', 2.4, C.cyan],
          ['Workspace', b === 0 ? 3 : 2, C.pink],
          ['Other', 1, C.yellow],
        ];
      phases.forEach(([name, w], i) => {
        const y = 420 + i * 210;
        constructionText(ctx, api, name, 150, y + 40, 32);
        let x = 460;
        for (const [k, v, col] of items) {
          const n = k === 'Workspace' ? (b === 0 ? w : 2) : v;
          constructionRectangle(ctx, api, x, y, (n / 16) * 1200, 85, col, true);
          if (n > 1.5)
            constructionText(ctx, api, k, x + (n / 16) * 600, y + 53, 26, C.bg, 'center');
          x += (n / 16) * 1200;
        }
        constructionText(
          ctx,
          api,
          'peak ' + (11 + (b === 0 ? w : 2)).toFixed(1) + ' GB',
          150,
          y + 115,
          28,
          C.muted,
        );
      });
      if (done(0, 1) && b === 0)
        constructionText(
          ctx,
          api,
          'Choose the larger phase peak; do not add both bars',
          150,
          900,
          34,
          C.yellow,
        );
      if (b === 1)
        constructionText(
          ctx,
          api,
          'Supplied workspace 2 GB · supplied reserve 20%',
          150,
          900,
          34,
          C.yellow,
        );
      constructionNote(
        ctx,
        api,
        'Replace worksheet inputs with actual peak allocations and competing use',
      );
    }
  });
}
export default {
  id: 'workspace-contract',
  draw: drawWorkspaceContract,
  cues: [
    'pl-workspace-contract-0-0',
    'pl-workspace-contract-0-1',
    'pl-workspace-contract-0-2',
    'pl-workspace-contract-0-3',
    'pl-workspace-contract-1-0',
    'pl-workspace-contract-1-1',
    'pl-workspace-contract-1-2',
    'pl-workspace-contract-1-3',
  ],
};
