import { clip, mix, smooth } from '../arithmetic.mjs';
import { PAIRS, PROGRAMS } from '../fixtures.mjs';
import { auditStarted } from '../construction.mjs';
import {
  auditFocusApi,
  drawAuditExpansionCell,
  drawAuditExpansionLine,
  drawAuditExpansionNote,
  drawAuditExpansionText,
} from '../defaults.mjs';
export function drawCandidates(ctx, scene, state, api) {
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
          auditStarted(state, 'ba-candidates-' + name, fallback);
        {
          const count = currentBeat === 0 ? Math.min(28, Math.floor(q * 28)) : 28;
          const live = PAIRS[Math.min(27, count)],
            stage = (q * 28) % 1;
          PROGRAMS.forEach((program, i) =>
            drawAuditExpansionCell(
              ctx,
              api,
              '#' + program.id,
              160 + i * 205,
              290,
              170,
              80,
              program.pass ? themeColors.green : themeColors.muted,
              32,
            ),
          );
          const gx = 200,
            gy = 560,
            dx = 215,
            dy = 87;
          for (let i = 0; i < count; i++) {
            const pair = PAIRS[i],
              x = gx + (i % 7) * dx,
              y = gy + Math.floor(i / 7) * dy;
            drawAuditExpansionCell(
              ctx,
              api,
              pair.a + ' + ' + pair.b,
              x,
              y,
              190,
              66,
              currentBeat > 0 && !pair.pass
                ? themeColors.pink
                : pair.pass
                  ? themeColors.green
                  : themeColors.muted,
              27,
            );
          }
          if (currentBeat === 0 && count < 28) {
            const sx = 245 + ((live.a + live.b) / 2 - 1) * 205;
            const tx = gx + (count % 7) * dx + 95,
              ty = gy + Math.floor(count / 7) * dy + 33;
            const xx =
              stage < 0.25
                ? mix(sx, 1780, stage * 4)
                : stage < 0.75
                  ? 1780
                  : mix(1780, tx, (stage - 0.75) * 4);
            const yy = stage < 0.25 ? 450 : stage < 0.75 ? mix(450, ty, (stage - 0.25) * 2) : ty;
            drawAuditExpansionCell(
              ctx,
              api,
              live.a + ' + ' + live.b,
              xx - 95,
              yy - 33,
              190,
              66,
              live.pass ? themeColors.green : themeColors.yellow,
              27,
            );
            if (stage < 0.25)
              for (const n of [live.a, live.b])
                drawAuditExpansionLine(
                  ctx,
                  api,
                  245 + (n - 1) * 205,
                  370,
                  sx,
                  417,
                  themeColors.yellow,
                  2,
                );
            drawAuditExpansionText(
              ctx,
              api,
              count + ' / 28 pairs deposited',
              960,
              250,
              31,
              themeColors.cyan,
              'center',
            );
          }
          if (currentBeat === 1 && shown('success', progress > 0.1))
            drawAuditExpansionText(
              ctx,
              api,
              '13 contain a pass · 15 contain only failures · 13/28 = 46.4%',
              960,
              965,
              32,
              themeColors.yellow,
              'center',
            );
          if (currentBeat === 2 && shown('select', progress > 0.1)) {
            drawAuditExpansionCell(
              ctx,
              api,
              'Selector returns #1 → FAIL',
              400,
              900,
              1120,
              75,
              themeColors.pink,
              34,
            );
          }
          drawAuditExpansionNote(
            ctx,
            api,
            'Each pair is made from the original sample identities; coverage does not choose the deployed answer.',
          );
        }
        return true;
      },
    )();
    return;
  }
}
export default {
  id: 'candidates',
  draw: drawCandidates,
  cues: [
    'candidates-beat-1-focus-1',
    'candidates-beat-1-focus-2',
    'ba-candidates-pairs',
    'candidates-beat-2-focus-1',
    'candidates-beat-2-focus-2',
    'ba-candidates-success',
    'candidates-beat-3-focus-1',
    'ba-candidates-select',
  ],
};
