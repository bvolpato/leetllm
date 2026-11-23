import {
  cueComplete,
  cueProgress,
  detailNote,
  detailPanel,
  detailText,
  progressArrow,
} from '../defaults.mjs';
export function drawArtifactSafety(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.focus.target('artifact-safety-mechanism', () => {
    if (currentBeat === 0) {
      detailText(ctx, api, 'compiled.json', 440, 335, 64, themeColors.blue);
      detailText(ctx, api, 'State restored into DeployAnswerer', 1280, 335, 42, themeColors.cyan);
      detailPanel(ctx, api, 'Instruction and signature fields', 440, 500, themeColors.blue, 670);
      detailPanel(ctx, api, 'Demonstrations', 440, 665, themeColors.yellow, 670);
      detailPanel(ctx, api, 'Model settings', 440, 830, themeColors.blue, 670);
      if (cueComplete(ctx, api, 'json-restore')) {
        detailText(ctx, api, 'Restored: 2 demos + attached model A', 1310, 425, 35, themeColors.blue);
        detailText(
          ctx,
          api,
          'Roll back tests?   SERVE · approval-4412',
          1310,
          522,
          34,
          themeColors.ink,
        );
        detailText(
          ctx,
          api,
          'Deploy service?   ABSTAIN · empty ID',
          1310,
          610,
          34,
          themeColors.ink,
        );
        progressArrow(ctx, api, 795, 665, 906, 610, themeColors.yellow);
        const bound = cueComplete(ctx, api, 'set-runtime');
        if (cueProgress(ctx, api, 'set-runtime'))
          detailText(ctx, api, 'Explicit set_lm(model B)', 1310, 746, 39, themeColors.cyan);
        detailText(
          ctx,
          api,
          bound ? 'Effective attached model is now B' : 'Effective attached model remains A',
          1310,
          855,
          35,
          bound ? themeColors.cyan : themeColors.blue,
        );
      }
    } else if (currentBeat === 1) {
      const { C } = api;
      const savedKey = cueComplete(ctx, api, 'api-key-omitted');
      const savedHeader = cueComplete(ctx, api, 'artifact-content');
      api.text(ctx, 'Setting', 110, 303, 37, C.muted);
      api.text(ctx, 'Before saving', 715, 303, 39, C.blue);
      api.text(ctx, 'In compiled.json', 1320, 303, 39, C.cyan);
      const fields = [
        ['api_key', 'unused-placeholder', savedKey ? 'omitted by pinned serializer' : '…', C.muted],
        ['extra_headers', 'fixture-only-header', savedHeader ? 'fixture-only-header' : '…', C.pink],
      ];
      fields.forEach(([key, before, after, color], i) => {
        const y = 467 + i * 204;
        api.text(ctx, key, 110, y, 35, C.ink, 'left', 'mono');
        if (i === 1) api.text(ctx, '└ Authorization', 145, y + 64, 32, C.ink, 'left', 'mono');
        api.text(ctx, before, 715, y, 34, C.blue);
        api.text(ctx, after, 1320, y, 36, color);
      });
      if (savedHeader)
        api.text(ctx, 'placeholder string survives serialization', 110, 815, 36, C.pink);
      if (cueComplete(ctx, api, 'full-inspection'))
        detailText(
          ctx,
          api,
          'Review examples and nested settings. Evaluate the sanitized copy.',
          960,
          905,
          40,
          C.yellow,
        );
      detailNote(ctx, api, 'Local serialization test · both strings are placeholders');
    } else {
      detailPanel(ctx, api, 'Whole program: cloudpickle', 500, 300, themeColors.pink, 760);
      detailPanel(ctx, api, 'State-only JSON', 1430, 300, themeColors.blue, 740);
      if (cueProgress(ctx, api, 'pickle-load')) {
        detailText(ctx, api, 'Untrusted load can execute code', 500, 455, 31, themeColors.pink);
        detailText(
          ctx,
          api,
          'Still needs compatible reviewed code',
          1430,
          455,
          30,
          themeColors.yellow,
        );
      }
      if (cueProgress(ctx, api, 'release-evidence')) {
        const names = [
          'Code + artifact digest',
          'Model + engine',
          'Data + scorer',
          'Evaluation evidence',
          'Rollback target',
        ];
        names.forEach((v, i) =>
          detailPanel(
            ctx,
            api,
            v,
            960,
            550 + i * 85,
            [
              themeColors.blue,
              themeColors.cyan,
              themeColors.yellow,
              themeColors.green,
              themeColors.blue,
            ][i],
            1320,
          ),
        );
      }
      if (cueComplete(ctx, api, 'release-binding'))
        detailText(
          ctx,
          api,
          'Digest identifies bytes; separate approval and retention govern release',
          960,
          965,
          29,
          themeColors.pink,
        );
    }
  });
  return;
}
export default {
  id: 'artifact-safety',
  draw: drawArtifactSafety,
  cues: [
    'json-restore',
    'set-runtime',
    'artifact-content',
    'api-key-omitted',
    'full-inspection',
    'release-binding',
    'pickle-load',
    'release-evidence',
  ],
};
