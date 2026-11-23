import {
  cueVisible,
  evidenceBox,
  evidenceFootnote,
  evidenceLine,
  evidenceText,
} from '../defaults.mjs';
export function drawBenchmarkSurfaces(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  api.focus.target('benchmark-surfaces-mechanism', () => {
    if (currentBeat < 2) {
      const rows =
        currentBeat === 0
          ? [
              ['SWE-bench', 'patch → repository tests', cueVisible(ctx, api, 'bench-swe')],
              [
                'WebArena',
                'answer / URL / HTML + some judge checks',
                cueVisible(ctx, api, 'bench-web'),
              ],
              [
                'OSWorld',
                'files / settings / app state · Ubuntu',
                cueVisible(ctx, api, 'bench-os'),
              ],
            ]
          : [
              ['GAIA', 'normalized reference answer', cueVisible(ctx, api, 'bench-gaia')],
              [
                'Terminal-Bench',
                'task verifier + resource limits',
                cueVisible(ctx, api, 'bench-terminal'),
              ],
              ['Tau-Bench', 'annotated final database changes', cueVisible(ctx, api, 'bench-tau')],
            ];
      rows.forEach(([name, contract, seen], i) => {
        const y = 320 + i * 170;
        evidenceBox(ctx, api, name, 220, y, 430, 115, seen ? themeColors.cyan : themeColors.muted);
        evidenceLine(ctx, api, 650, y + 57, 870, y + 57, themeColors.line);
        if (seen) evidenceBox(ctx, api, contract, 870, y, 820, 115, themeColors.blue);
      });
      if (currentBeat === 1 && cueVisible(ctx, api, 'confirmation-gap')) {
        evidenceText(
          ctx,
          api,
          'Final DB goal can match despite missing user confirmation',
          960,
          900,
          34,
          themeColors.pink,
          'center',
        );
      }
    } else {
      const fields = [
        'task split',
        'environment image',
        'harness + scorer',
        'model + scaffold',
        'permissions + budget',
        'trials + simulator',
      ];
      fields.forEach((s, i) =>
        evidenceBox(
          ctx,
          api,
          s,
          250 + (i % 3) * 500,
          320 + Math.floor(i / 3) * 155,
          440,
          105,
          cueVisible(ctx, api, 'pin-config') ? themeColors.cyan : themeColors.muted,
        ),
      );
      if (cueVisible(ctx, api, 'version-four')) {
        evidenceBox(
          ctx,
          api,
          'Terminal-Bench 2.1\nold score',
          280,
          700,
          550,
          140,
          themeColors.muted,
        );
        evidenceBox(
          ctx,
          api,
          'Terminal-Bench 4.0\nnew task/resource contract',
          1090,
          700,
          550,
          140,
          themeColors.yellow,
        );
        evidenceLine(ctx, api, 850, 770, 1060, 770, themeColors.pink, 5);
      }
      if (cueVisible(ctx, api, 'rerun-version'))
        evidenceText(
          ctx,
          api,
          'New comparable evidence requires a rerun',
          960,
          920,
          35,
          themeColors.green,
          'center',
        );
    }
    evidenceFootnote(
      ctx,
      api,
      'Match the shipped capability and verifier, then pin the complete comparison',
    );
  });
  return;
}
export default {
  id: 'benchmark-surfaces',
  draw: drawBenchmarkSurfaces,
  cues: [
    'bench-swe',
    'bench-web',
    'bench-os',
    'bench-gaia',
    'bench-terminal',
    'bench-tau',
    'confirmation-gap',
    'pin-config',
    'version-four',
    'rerun-version',
  ],
};
