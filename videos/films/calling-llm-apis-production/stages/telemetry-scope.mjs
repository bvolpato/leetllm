import { phase } from '../arithmetic.mjs';
import { apiChapterState } from '../construction.mjs';
import { footer, heading, panel, strokeLine, travel } from '../defaults.mjs';
export function drawTelemetryScope(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat,
    modelState = apiChapterState('telemetry-scope', state),
    u = modelState.p,
    done = modelState.settled;
  {
    if (currentBeat === 0) {
      heading(ctx, api, 'Pin convention version and retain distinct identities');
      const rows = [
        ['provider / operation', 'service / operation'],
        ['requested model', 'requested model ID'],
        ['reported model', 'reported model ID'],
        ['usage + finish', 'provider accounting'],
      ];
      rows.forEach(([a, z], i) => {
        panel(ctx, api, a, 230, 390 + i * 135, 700, 95, themeColors.blue, 28);
        if (u > (i + 0.5) / 5)
          panel(ctx, api, z, 1060, 390 + i * 135, 620, 95, themeColors.cyan, 28);
      });
      footer(ctx, api, 'Pinned GenAI semantic convention: Development status');
    } else if (currentBeat === 1) {
      heading(ctx, api, 'One task trace contains separate attempts and validation');
      strokeLine(ctx, api, 300, 470, 1640, 470, themeColors.cyan);
      ['lookup', 'attempt A', 'attempt B', 'validation'].forEach((v, i) => {
        panel(
          ctx,
          api,
          'T-17\n' + v,
          230 + i * 430,
          650 - 120 * phase(u, i * 0.15, i * 0.15 + 0.35),
          360,
          120,
          i === 3 ? themeColors.green : themeColors.blue,
          29,
        );
      });
      panel(ctx, api, 'task outcome: validation failed', 500, 840, 920, 85, themeColors.pink, 31);
      footer(ctx, api, 'An earlier HTTP success cannot erase the failed task outcome');
    } else {
      heading(ctx, api, 'Match repeated questions within a tenant and environment');
      panel(
        ctx,
        api,
        'private customer question\nraw text omitted',
        220,
        420,
        620,
        150,
        themeColors.pink,
        30,
      );
      panel(ctx, api, 'separate tenant/env key', 1060, 420, 640, 150, themeColors.yellow, 30);
      travel(
        ctx,
        api,
        'HMAC input',
        {
          x: 360,
          y: 690,
        },
        {
          x: 1280,
          y: 690,
        },
        u,
        themeColors.cyan,
        260,
      );
      panel(
        ctx,
        api,
        done ? '32 hex characters = 128 bits' : 'truncated HMAC → ?',
        400,
        860,
        1120,
        85,
        themeColors.green,
        31,
      );
      footer(
        ctx,
        api,
        'Still linkable · possible collisions · approved access and retention required',
      );
    }
  }
}
export default {
  id: 'telemetry-scope',
  draw: drawTelemetryScope,
  cues: ['ap-telemetry-scope-0', 'ap-telemetry-scope-1', 'ap-telemetry-scope-2'],
};
