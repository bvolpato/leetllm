import { sampleDeepGemmChapter } from '../construction.mjs';
import { drawBox, drawFooter, drawLink, drawSubtitle, drawText } from '../defaults.mjs';
export function drawJitContract(ctx, scene, state, api) {
  return api.focus.target('jit-contract-construction', () => {
    const { C: themeColors, components: components } = api,
      modelState = sampleDeepGemmChapter('jit-contract', state),
      { b: currentBeat, g: teaching2 } = modelState;
    const done = (beat, index) => teaching2(beat, index) >= 1;
    {
      drawSubtitle(ctx, api, 'Generated inputs identify the cached operation');
      const labels = ['kernel name', 'compiler identity', 'effective flags', 'generated code'];
      const signatureOperands = labels.map((label, i) =>
        drawBox(
          ctx,
          api,
          label,
          150 + i * 425,
          350,
          365,
          90,
          [themeColors.blue, themeColors.cyan, themeColors.pink, themeColors.yellow][i],
          29,
        ),
      );
      if (currentBeat === 0) {
        const p = teaching2(0, 2),
          signature = drawBox(
            ctx,
            api,
            'Signature · tracked generated inputs',
            400,
            650,
            1120,
            110,
            themeColors.green,
            36,
          );
        labels.forEach((_, i) => {
          if (p > i / 4)
            drawLink(
              ctx,
              api,
              signatureOperands[i],
              signature,
              p,
              [themeColors.blue, themeColors.cyan, themeColors.pink, themeColors.yellow][i],
            );
        });
        drawText(
          ctx,
          api,
          teaching2(0, 3) > 0
            ? 'Same generated signature → compatible cache lookup'
            : 'A runtime dimension matters when it changes generated inputs',
          960,
          880,
          31,
          themeColors.muted,
          'center',
        );
      } else if (currentBeat === 1) {
        const a = drawBox(
            ctx,
            api,
            'Rank A · unique temp directory',
            160,
            550,
            650,
            100,
            themeColors.blue,
            31,
          ),
          z = drawBox(
            ctx,
            api,
            'Rank B · unique temp directory',
            1110,
            550,
            650,
            100,
            themeColors.pink,
            31,
          ),
          published = drawBox(
            ctx,
            api,
            'Complete published cache directory',
            480,
            810,
            960,
            110,
            themeColors.green,
            34,
          ),
          files = teaching2(1, 1);
        for (let i = 0; i < 3; i++)
          if (files > i / 3) {
            drawBox(
              ctx,
              api,
              ['kernel.cu', 'kernel.cubin', 'closed\nsynced'][i],
              180 + i * 210,
              690,
              200,
              100,
              themeColors.blue,
              26,
            );
            drawBox(
              ctx,
              api,
              ['kernel.cu', 'kernel.cubin', 'closed\nsynced'][i],
              1130 + i * 210,
              690,
              200,
              100,
              themeColors.pink,
              26,
            );
          }
        if (teaching2(1, 3) > 0) {
          const points = [
            {
              x: a.x - 16,
              y: a.y + a.height / 2,
            },
            {
              x: 110,
              y: a.y + a.height / 2,
            },
            {
              x: 110,
              y: published.y + published.height / 2,
            },
            {
              x: published.x - 16,
              y: published.y + published.height / 2,
            },
          ];
          api.path(ctx, points, {
            color: themeColors.blue,
            width: 3,
          });
          components.particle({
            points,
            progress: teaching2(1, 3),
            radius: 6,
            fill: themeColors.blue,
          });
          if (done(1, 3))
            drawText(
              ctx,
              api,
              'B loses publication race · reuse complete entry',
              960,
              975,
              28,
              themeColors.muted,
              'center',
            );
        }
      } else {
        const entry = drawBox(
            ctx,
            api,
            'S / F / compiler C',
            180,
            600,
            570,
            110,
            themeColors.blue,
            39,
          ),
          replay = drawBox(
            ctx,
            api,
            'New runtime M · same generated inputs',
            1060,
            600,
            710,
            110,
            themeColors.cyan,
            30,
          );
        drawLink(ctx, api, replay, entry, teaching2(2, 0), themeColors.cyan);
        if (teaching2(2, 1) > 0)
          drawText(ctx, api, 'Cache hit', 960, 815, 55, themeColors.green, 'center');
        if (teaching2(2, 3) > 0)
          drawText(
            ctx,
            api,
            'Changed flags or generated code → another entry',
            960,
            920,
            33,
            themeColors.pink,
            'center',
          );
      }
      drawFooter(ctx, api, 'Complete publication is distinct from single-writer compilation');
    }
  });
}
export default {
  id: 'jit-contract',
  draw: drawJitContract,
  cues: [
    'jit-contract-b0',
    'dg-jit-contract-0-0',
    'dg-jit-contract-0-1',
    'dg-jit-contract-0-2',
    'dg-jit-contract-0-3',
    'dg-jit-contract-0-4',
    'jit-contract-b1',
    'dg-jit-contract-1-0',
    'dg-jit-contract-1-1',
    'dg-jit-contract-1-2',
    'dg-jit-contract-1-3',
    'jit-contract-b2',
    'dg-jit-contract-2-0',
    'dg-jit-contract-2-1',
    'dg-jit-contract-2-2',
    'dg-jit-contract-2-3',
  ],
};
