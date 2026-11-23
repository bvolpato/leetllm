import { done, sentence } from '../construction.mjs';
import { chapterHeading, chapterRectangle, chapterText } from '../defaults.mjs';
export function drawProjectEvidence(ctx, scene, state, api) {
  return api.focus.target(`nc-${scene.id}-mechanism`, () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0,
      progress = (bi, si) => sentence(state, 'project-evidence', bi, si),
      resultComplete = (bi, si) => done(state, 'project-evidence', bi, si);
    const rankColors = [themeColors.blue, themeColors.cyan, themeColors.pink, themeColors.yellow];
    {
      chapterHeading(
        ctx,
        api,
        currentBeat === 0
          ? 'The exact files carry their own redistribution terms'
          : 'Bind the performance claim to a complete receipt',
      );
      if (currentBeat === 0) {
        const names = ['Apache 2 source', 'BSD-retained file', 'Borrowed notices', 'DCO sign-off'];
        names.forEach((v, i) => {
          const x = 220 + (i % 2) * 850,
            y = 390 + Math.floor(i / 2) * 260;
          chapterRectangle(ctx, api, x, y, 650, 180, themeColors.panel, rankColors[i]);
          chapterText(ctx, api, v, x + 325, y + 95, 32, rankColors[i], 'center');
        });
      } else {
        const names = [
            'Hardware + software',
            'Workload',
            'Precision + path',
            'Equivalent baseline',
            'Correctness',
          ],
          values = [
            'Inventory pending · source 5067397c…',
            'Supplied 256 MiB / four-rank all-reduce',
            'float32 · selected transport unobserved',
            'Preserve payload, dtype and requested checks',
            'Three CPU programs run · GPU benchmark not run',
          ],
          reveal = resultComplete(1, 3) ? 5 : Math.floor(progress(1, 2) * 5);
        names.forEach((name, i) => {
          chapterRectangle(
            ctx,
            api,
            260,
            350 + i * 115,
            1400,
            80,
            themeColors.panel,
            i < reveal ? themeColors.cyan : themeColors.muted,
          );
          chapterText(
            ctx,
            api,
            i < reveal ? name + ': ' + values[i] : name + ' · evidence pending',
            960,
            400 + i * 115,
            28,
            i < reveal ? themeColors.cyan : themeColors.muted,
            'center',
          );
        });
        chapterText(
          ctx,
          api,
          resultComplete(1, 3)
            ? 'Executed: three CPU programs · GPU benchmark not executed'
            : 'Research assumptions and actual machine evidence stay separate',
          960,
          1010,
          29,
          themeColors.yellow,
          'center',
        );
      }
    }
  });
}
export default {
  id: 'project-evidence',
  draw: drawProjectEvidence,
  cues: [
    'nc-project-evidence-b0-s0',
    'nc-project-evidence-b0-s1',
    'nc-project-evidence-b0-s2',
    'nc-project-evidence-b0-s3',
    'nc-project-evidence-b1-s0',
    'nc-project-evidence-b1-s1',
    'nc-project-evidence-b1-s2',
    'nc-project-evidence-b1-s3',
  ],
};
