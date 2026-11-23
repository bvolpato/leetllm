import { extensionText, focusTarget, outline } from '../defaults.mjs';
import { cueProgress } from '../receipt.mjs';
export function drawAssembleApp(ctx, scene, state, api) {
  const currentBeat = state.beat;
  const { C: themeColors } = api;
  focusTarget(ctx, api, 'assemble-app-mechanism', () => {
    extensionText(ctx, api, 'uv run rotation_app.py', 960, 280, 39, themeColors.cyan, 'center');
    const roles = [
      ['app-browser-role', 'index.html', '127.0.0.1:8000', themeColors.blue],
      ['app-handler-role', 'rotation_app.py', 'POST /rotation/decide', themeColors.yellow],
      ['app-checker-role', 'verify_p7', 'Trusted facts + candidate', themeColors.green],
    ];
    roles.forEach(([name, label, detail, color], i) =>
      focusTarget(ctx, api, name, () => {
        const x = 180 + i * 570;
        outline(ctx, api, x, 380, 430, 150, color);
        extensionText(ctx, api, label, x + 215, 438, 36, color, 'center');
        extensionText(ctx, api, detail, x + 215, 490, 25, themeColors.muted, 'center');
      }),
    );
    api.arrow(ctx, 625, 455, 735, 455, themeColors.cyan, 4);
    api.arrow(ctx, 1195, 455, 1305, 455, themeColors.cyan, 4);
    if (currentBeat > 0) {
      const parts = [
        ['Trusted facts', themeColors.blue],
        ['Fixture provider', themeColors.yellow],
        ['SQLite file', themeColors.green],
      ];
      parts.forEach(([label, color], i) =>
        focusTarget(ctx, api, 'app-adapter-' + i, () => {
          const x = 300 + i * 480;
          outline(ctx, api, x, 665, 380, 85, color);
          extensionText(ctx, api, label, x + 190, 720, 31, color, 'center');
        }),
      );
      api.line(ctx, 960, 540, 960, 620, themeColors.muted, 3);
      api.line(ctx, 490, 620, 1450, 620, themeColors.muted, 3);
      for (const x of [490, 970, 1450]) api.arrow(ctx, x, 620, x, 650, themeColors.muted, 3);
    }
    if (currentBeat === 1 && cueProgress(scene, state, 'fixture-version') > 0) {
      focusTarget(ctx, api, 'fixture-version', () =>
        extensionText(
          ctx,
          api,
          'prompt_version    rotation_decision@2',
          960,
          890,
          38,
          themeColors.yellow,
          'center',
        ),
      );
    }
    if (currentBeat === 2) {
      extensionText(
        ctx,
        api,
        'Replace the provider during the HTTP test',
        960,
        885,
        36,
        themeColors.green,
        'center',
      );
      extensionText(
        ctx,
        api,
        'Keep the route, checker and SQLite store in the test.',
        960,
        970,
        30,
        themeColors.muted,
        'center',
      );
    }
  });
  return;
}
export default {
  id: 'assemble-app',
  draw: drawAssembleApp,
  cues: ['app-checker-role-b1-1', 'app-adapter-0-b2-1', 'fixture-version', 'app-handler-role-b3-1'],
};
