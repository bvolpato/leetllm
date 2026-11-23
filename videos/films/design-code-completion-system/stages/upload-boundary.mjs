import { completionCue } from '../construction.mjs';
import {
  completionBox,
  completionCode,
  completionFooter,
  completionHeading,
  completionText,
} from '../defaults.mjs';
export function drawUploadBoundary(ctx, scene, state, api) {
  api.focus.target('cc-upload-boundary-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0,
      progress = Math.max(0, Math.min(1, state.beatP ?? 0)),
      done = (id) => completionCue(state, id) >= 1;
    {
      const existing = currentBeat === 0 && done('cc-existing-placeholder'),
        collision = existing && done('cc-placeholder-collision'),
        redacted = currentBeat > 0 || done('cc-redacted-before-upload');
      completionHeading(
        ctx,
        api,
        currentBeat === 2
          ? 'A telemetry function has its own exact allowlist'
          : 'Redact before crossing the client upload boundary',
      );
      api.line(ctx, 1000, 350, 1000, 930, themeColors.yellow, 3);
      completionText(ctx, api, 'CLIENT', 480, 370, 30, themeColors.blue, 'center');
      completionText(ctx, api, 'SERVER', 1460, 370, 30, themeColors.cyan, 'center');
      if (currentBeat === 2) {
        ['tenant', 'model', 'latency bucket'].forEach((v, i) =>
          completionBox(ctx, api, v, 1120, 440 + i * 140, 600, 80, themeColors.green),
        );
        completionCode(ctx, api, 'prompt: excluded', 200, 610, 31, themeColors.pink);
        completionFooter(
          ctx,
          api,
          'Proxy, exception, trace, crash and SDK paths need separate inspection',
        );
      } else {
        completionCode(
          ctx,
          api,
          existing ? 'demo_api_token_abc123 + <API_KEY_7>' : "API('demo_api_token_abc123')",
          150,
          510,
          27,
          themeColors.blue,
        );
        if (collision) {
          completionText(
            ctx,
            api,
            'Collision → reject before upload',
            480,
            740,
            32,
            themeColors.pink,
            'center',
          );
          completionText(
            ctx,
            api,
            'No new mapping produced',
            480,
            830,
            29,
            themeColors.muted,
            'center',
          );
        } else if (redacted && !existing) {
          api.arrow(ctx, 820, 650, 1130, 650, themeColors.green, 4);
          completionCode(ctx, api, "API('<API_KEY_1>')", 1160, 650, 27, themeColors.green);
          completionBox(ctx, api, 'mapping stays local', 200, 780, 620, 90, themeColors.blue);
          if (currentBeat > 0)
            completionText(
              ctx,
              api,
              'Returned placeholder → local review',
              1460,
              850,
              29,
              themeColors.yellow,
              'center',
            );
        }
        completionFooter(
          ctx,
          api,
          'Fictional demo pattern only · no automatic secret restoration into model-chosen output',
        );
      }
    }
    return true;
  });
}
export default {
  id: 'upload-boundary',
  draw: drawUploadBoundary,
  cues: [
    'cc-upload-boundary-0',
    'cc-redacted-before-upload',
    'cc-existing-placeholder',
    'cc-placeholder-collision',
    'cc-upload-boundary-1',
    'cc-return-placeholder',
    'cc-upload-boundary-2',
    'cc-telemetry-fields',
  ],
};
