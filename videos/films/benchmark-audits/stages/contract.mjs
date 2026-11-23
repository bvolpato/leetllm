import { clip, mix, smooth } from '../arithmetic.mjs';
import { auditCue, auditStarted } from '../construction.mjs';
import {
  auditFocusApi,
  drawAuditExpansionCell,
  drawAuditExpansionNote,
  drawAuditExpansionText,
} from '../defaults.mjs';
export function drawContract(ctx, scene, state, api) {
  api = auditFocusApi(api, scene);
  {
    const inherited = [
      ...new Set(
        scene.beats
          .flatMap((beat) => beat.visual_cues ?? [])
          .filter((cue) => !cue.id.startsWith('ba-'))
          .flatMap((cue) => cue.targets),
      ),
    ];
    inherited.reduceRight(
      (paint, id) => () => api.focus.target(id, paint),
      () => {
        const currentBeat = state.beat ?? 0,
          progress = clip(state.beatP ?? 0),
          q = smooth(progress);
        const { C: themeColors } = api;
        const cue = (name, fallback = q) => auditCue(state, 'ba-contract-' + name, fallback);
        const shown = (name, fallback = true) =>
          auditStarted(state, 'ba-contract-' + name, fallback);
        {
          drawAuditExpansionText(
            ctx,
            api,
            'One library case · same question, prompt, tools and attempt budget',
            960,
            275,
            32,
            themeColors.ink,
            'center',
          );
          const extra = currentBeat > 1 ? 1 : currentBeat === 1 ? cue('passages') : 0;
          for (let model = 0; model < 2; model++) {
            const x = 220 + model * 860;
            drawAuditExpansionText(
              ctx,
              api,
              'Assistant ' + (model ? 'B' : 'A'),
              x + 300,
              365,
              35,
              model ? themeColors.cyan : themeColors.blue,
              'center',
            );
            for (let i = 0; i < 3; i++)
              drawAuditExpansionCell(
                ctx,
                api,
                'passage ' + (i + 1),
                x + i * 210,
                430,
                190,
                125,
                themeColors.blue,
                25,
              );
            if (model && extra > 0)
              for (let i = 0; i < 2; i++) {
                const stage = clip(extra * 2 - i);
                if (stage > 0)
                  drawAuditExpansionCell(
                    ctx,
                    api,
                    i ? 'renewal exception' : 'approval condition',
                    mix(1600, x + 65 + i * 255, stage),
                    695,
                    245,
                    100,
                    themeColors.yellow,
                    24,
                  );
              }
            if (currentBeat === 0)
              drawAuditExpansionCell(
                ctx,
                api,
                '3 admitted passages',
                x,
                740,
                650,
                105,
                themeColors.blue,
                31,
              );
            else if (!model)
              drawAuditExpansionCell(
                ctx,
                api,
                '3 admitted passages',
                x,
                740,
                650,
                105,
                themeColors.blue,
                31,
              );
          }
          if (currentBeat > 0 && shown('consequence', progress > 0.5))
            drawAuditExpansionText(
              ctx,
              api,
              'B now receives an additional renewal condition',
              960,
              940,
              33,
              themeColors.yellow,
              'center',
            );
          drawAuditExpansionNote(
            ctx,
            api,
            currentBeat
              ? 'The compared object is the complete input path plus model; an isolated checkpoint claim needs a matched harness.'
              : 'Each model receives correct chat formatting while the evaluation contract stays matched.',
          );
        }
        return true;
      },
    )();
    return;
  }
}
export default {
  id: 'contract',
  draw: drawContract,
  cues: [
    'contract-beat-1-focus-1',
    'contract-beat-2-focus-1',
    'ba-contract-passages',
    'ba-contract-consequence',
    'contract-beat-3-focus-1',
  ],
};
