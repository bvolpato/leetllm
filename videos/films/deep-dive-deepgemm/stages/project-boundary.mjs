import { sampleDeepGemmChapter } from '../construction.mjs';
import { drawBox, drawLink, drawText } from '../defaults.mjs';
export function drawProjectBoundary(ctx, scene, state, api) {
  return api.focus.target('project-boundary-construction', () => {
    const { C: themeColors } = api,
      modelState = sampleDeepGemmChapter('project-boundary', state),
      { b: currentBeat, g: teaching2 } = modelState;
    {
      const row =
        currentBeat < 2
          ? drawBox(ctx, api, 'token t7 · hidden row', 150, 395, 410, 100, themeColors.cyan)
          : null;
      const owners = [
        ['Model', 'Choose experts and weights'],
        ['DeepGEMM', 'Multiply the routed rows'],
        ['Serving runtime', 'Batch requests and return the output'],
      ];
      owners.forEach(([owner, job], i) => {
        const y = 350 + i * 175,
          progress =
            currentBeat === 0
              ? teaching2(0, [1, 3, 4][i])
              : currentBeat === 1
                ? teaching2(1, [1, 2, 5][i])
                : 1,
          active = progress > 0,
          target = drawBox(
            ctx,
            api,
            owner,
            950,
            y,
            730,
            90,
            active
              ? [themeColors.pink, themeColors.blue, themeColors.yellow][i]
              : themeColors.muted,
            33,
          );
        drawText(
          ctx,
          api,
          job,
          1315,
          y + 132,
          28,
          active ? themeColors.ink : themeColors.muted,
          'center',
        );
        if (active && currentBeat < 2)
          drawLink(
            ctx,
            api,
            row,
            target,
            progress,
            [themeColors.pink, themeColors.blue, themeColors.yellow][i],
          );
      });
      if (currentBeat === 1 && teaching2(1, 4) > 0) {
        drawBox(ctx, api, 'Grouped vs. separate launches', 150, 675, 650, 100, themeColors.pink);
        drawText(ctx, api, 'Same rows and expert weights', 150, 850, 29, themeColors.muted);
      }
      if (currentBeat === 2) {
        const left = drawBox(
            ctx,
            api,
            '15 July · historical API',
            150,
            620,
            580,
            100,
            themeColors.blue,
          ),
          right = drawBox(
            ctx,
            api,
            '10 October · changed contracts',
            150,
            805,
            580,
            100,
            themeColors.cyan,
          );
        drawLink(ctx, api, left, right, teaching2(2, 1), themeColors.cyan);
        drawText(ctx, api, 'CPU: arithmetic + mapping', 150, 400, 30, themeColors.green);
        drawText(
          ctx,
          api,
          'GPU test · compare the returned rows',
          150,
          470,
          28,
          themeColors.yellow,
        );
      }
    }
  });
}
export default {
  id: 'project-boundary',
  draw: drawProjectBoundary,
  cues: [
    'project-boundary-b0',
    'dg-project-boundary-0-0',
    'dg-project-boundary-0-1',
    'dg-project-boundary-0-2',
    'dg-project-boundary-0-3',
    'dg-project-boundary-0-4',
    'project-boundary-b1',
    'dg-project-boundary-1-0',
    'dg-project-boundary-1-1',
    'dg-project-boundary-1-2',
    'dg-project-boundary-1-3',
    'dg-project-boundary-1-4',
    'dg-project-boundary-1-5',
    'dg-project-boundary-1-6',
    'project-boundary-b2',
    'dg-project-boundary-2-0',
    'dg-project-boundary-2-1',
    'dg-project-boundary-2-2',
    'dg-project-boundary-2-3',
    'dg-project-boundary-2-4',
  ],
};
