import { phase } from '../arithmetic.mjs';
import { apiChapterState } from '../construction.mjs';
import { chapterText, footer, heading, panel, strokeLine, travel } from '../defaults.mjs';
export function drawWriteUncertainty(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat,
    modelState = apiChapterState('write-uncertainty', state),
    u = modelState.p,
    done = modelState.settled;
  {
    if (currentBeat === 0) {
      heading(ctx, api, 'The executable dictionary remembers only this process');
      panel(ctx, api, 'intent 7e3b', 220, 415, 500, 100, themeColors.yellow, 32);
      panel(
        ctx,
        api,
        done ? 'memory ledger\nempty after restart' : 'memory ledger\n7e3b → JOB-001',
        1060,
        410,
        640,
        155,
        done ? themeColors.pink : themeColors.green,
        32,
      );
      travel(
        ctx,
        api,
        'same intent',
        {
          x: 300,
          y: 700,
        },
        {
          x: 1210,
          y: 700,
        },
        u,
        themeColors.cyan,
        250,
      );
      if (done)
        panel(ctx, api, 'restart → empty dictionary', 1050, 845, 650, 80, themeColors.pink, 29);
      footer(
        ctx,
        api,
        'Two workers can both find an empty slot before either records the job',
      );
    } else if (currentBeat === 1) {
      heading(ctx, api, 'Local atomic ownership and remote outcome are different states');
      panel(
        ctx,
        api,
        'tenant + intent\nargument fingerprint\nPENDING',
        210,
        405,
        650,
        180,
        themeColors.yellow,
        29,
      );
      panel(ctx, api, 'destination\nJOB-001 exists?', 1110, 405, 600, 180, themeColors.pink, 31);
      travel(
        ctx,
        api,
        'dispatch',
        {
          x: 400,
          y: 700,
        },
        {
          x: 1280,
          y: 700,
        },
        phase(u, 0, 0.45),
        themeColors.blue,
        220,
      );
      if (u > 0.55) {
        strokeLine(ctx, api, 1440, 800, 450, 800, themeColors.pink, 3);
        chapterText(ctx, api, 'acknowledgment lost', 960, 855, 29, themeColors.pink, 'center');
      }
      footer(ctx, api, 'Unknown remote result → reuse supported action key or reconcile status');
    } else {
      heading(ctx, api, 'A new legitimate intent and a retry use different keys');
      panel(
        ctx,
        api,
        'same authorized intent\n7e3b → JOB-001',
        240,
        420,
        650,
        160,
        themeColors.green,
        32,
      );
      panel(
        ctx,
        api,
        'later authorized rotation\nnew intent → new key',
        1030,
        420,
        650,
        160,
        themeColors.blue,
        32,
      );
      panel(
        ctx,
        api,
        'current permission + account state',
        430,
        760,
        1060,
        100,
        themeColors.yellow,
        32,
      );
      footer(ctx, api, 'Idempotency preserves effect identity; authorization still applies');
    }
  }
}
export default {
  id: 'write-uncertainty',
  draw: drawWriteUncertainty,
  cues: ['ap-write-uncertainty-0', 'ap-write-uncertainty-1', 'ap-write-uncertainty-2'],
};
