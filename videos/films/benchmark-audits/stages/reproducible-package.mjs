import { clip, smooth } from '../arithmetic.mjs';
import { auditStarted } from '../construction.mjs';
import {
  auditFocusApi,
  drawAuditExpansionBox,
  drawAuditExpansionCell,
  drawAuditExpansionLine,
  drawAuditExpansionNote,
  drawAuditExpansionText,
} from '../defaults.mjs';
export function drawReproduciblePackage(ctx, scene, state, api) {
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
        const shown = (name, fallback = true) =>
          auditStarted(state, 'ba-reproducible-package-' + name, fallback);
        {
          drawAuditExpansionText(
            ctx,
            api,
            'An evidence packet keeps the experiment reconstructable',
            960,
            275,
            34,
            themeColors.ink,
            'center',
          );
          const fields = [
            'case IDs + final context',
            'model + prompt + decoding',
            'scorer + policy versions',
            'raw outputs + failed cases',
          ];
          const count = currentBeat === 0 && !shown('outputs', progress > 0.4) ? 3 : 4;
          for (let i = 0; i < count; i++) {
            const yy = 355 + i * 130;
            drawAuditExpansionCell(
              ctx,
              api,
              fields[i],
              210,
              yy,
              730,
              95,
              i === 3 ? themeColors.yellow : themeColors.blue,
              30,
            );
            drawAuditExpansionLine(ctx, api, 940, yy + 48, 1190, 580, themeColors.muted, 2);
          }
          drawAuditExpansionCell(ctx, api, 'manifest', 1190, 500, 520, 160, themeColors.cyan, 43);
          if (currentBeat === 0) {
            if (shown('missing', progress > 0.7)) {
              drawAuditExpansionBox(ctx, api, 1190, 780, 520, 125, themeColors.pink);
              drawAuditExpansionText(
                ctx,
                api,
                'missing output bytes',
                1450,
                855,
                30,
                themeColors.pink,
                'center',
              );
              drawAuditExpansionLine(ctx, api, 1450, 660, 1450, 780, themeColors.pink, 4);
            }
          } else {
            drawAuditExpansionCell(
              ctx,
              api,
              'top-3 → top-5 retrieval',
              1050,
              755,
              700,
              85,
              themeColors.pink,
              30,
            );
            if (shown('repair', progress > 0.65)) {
              drawAuditExpansionText(
                ctx,
                api,
                'Freeze system + reviewed scorer',
                960,
                925,
                34,
                themeColors.green,
                'center',
              );
            }
          }
          drawAuditExpansionNote(
            ctx,
            api,
            currentBeat
              ? 'Retain contemporaneous baseline, repeats, exposed-case regression and untouched matched evidence.'
              : 'Hashing a manifest does not supply absent outputs or prove that the run occurred.',
          );
        }
        return true;
      },
    )();
    return;
  }
}
export default {
  id: 'reproducible-package',
  draw: drawReproduciblePackage,
  cues: [
    'reproducible-package-phase-0',
    'ba-reproducible-package-outputs',
    'ba-reproducible-package-missing',
    'reproducible-package-phase-1',
    'ba-reproducible-package-repeat',
    'ba-reproducible-package-changed',
    'ba-reproducible-package-repair',
  ],
};
