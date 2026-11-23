import { recoveryTransferWaitConstruction } from '../construction.mjs';
import { centerText, cueProgress, line, note, rectangle, tag } from '../defaults.mjs';
export function drawRecoveryTransfer(ctx, scene, state, api) {
  const { C: themeColors } = api,
    rawBeat = state.beat ?? 0,
    currentBeat = Math.max(0, rawBeat - 1),
    done = (id) => cueProgress(ctx, api, id) === 1;
  api.focus.target('recovery-transfer-mechanism', () => {
    if (currentBeat === 0) {
      centerText(
        ctx,
        api,
        'Fresh unchanged operation · server repeat-safety contract active',
        960,
        280,
        33,
        themeColors.muted,
      );
      const s = recoveryTransferWaitConstruction(state, cueProgress(ctx, api, 'transfer-wait'));
      for (const [key, color] of [
        ['minimum', themeColors.blue],
        ['jitter', themeColors.yellow],
      ]) {
        const r = s[key];
        rectangle(ctx, api, r.x, r.y, r.width, r.height, color);
      }
      line(ctx, api, 1420, 385, 1420, 750, s.showVerdict ? themeColors.pink : themeColors.muted, 4);
      centerText(
        ctx,
        api,
        'remaining 1.4s',
        1420,
        825,
        32,
        s.showVerdict ? themeColors.pink : themeColors.yellow,
      );
      centerText(ctx, api, 'minimum 1.2s', 720, 410, 31, themeColors.blue);
      centerText(
        ctx,
        api,
        'jitter 0.3s',
        s.joined ? 1640 : 160,
        s.joined ? 410 : 710,
        29,
        themeColors.yellow,
      );
      if (s.showVerdict)
        centerText(ctx, api, 'wait 1.5s > 1.4s → stop', 960, 940, 43, themeColors.pink);
      else
        centerText(
          ctx,
          api,
          s.joined ? 'Combine the two supplied waits' : 'Predict whether to send',
          960,
          940,
          38,
          themeColors.yellow,
        );
      note(ctx, api, 'Repeat safety and remaining deadline grant different permissions');
    } else if (currentBeat === 1) {
      tag(ctx, api, 'completed · observed 40min ago', 960, 430, themeColors.blue, 1120);
      line(ctx, api, 300, 620, 1620, 620, themeColors.muted);
      rectangle(ctx, api, 300, 585, 1320 / 40, 70, themeColors.green);
      centerText(ctx, api, 'freshness cap 1min', 480, 760, 31, themeColors.green);
      centerText(ctx, api, 'observation age 40min', 1430, 760, 31, themeColors.blue);
      if (done('transfer-stale'))
        centerText(
          ctx,
          api,
          'Current status unavailable · keep original operation identity',
          960,
          920,
          35,
          themeColors.pink,
        );
      note(ctx, api, 'A dated completed state does not establish completion now');
    } else if (currentBeat === 2) {
      for (let i = 0; i < 100; i++) {
        const x = 240 + (i % 20) * 71,
          y = 380 + Math.floor(i / 20) * 78,
          c =
            i < 60
              ? themeColors.green
              : i < 72
                ? themeColors.blue
                : i < 90
                  ? themeColors.yellow
                  : themeColors.muted;
        rectangle(ctx, api, x, y, 54, 54, c);
      }
      centerText(
        ctx,
        api,
        '60 complete ·12 degraded ·18 handed off ·10 unresolved',
        960,
        840,
        32,
        themeColors.muted,
      );
      if (done('completion-rate'))
        centerText(ctx, api, 'task completion 60%', 600, 935, 37, themeColors.green);
      if (done('disposition-rate'))
        centerText(ctx, api, 'safe disposition 90%', 1380, 935, 37, themeColors.yellow);
      note(ctx, api, 'Unique runs and unfinished cases · attempts are a different denominator');
    } else {
      centerText(
        ctx,
        api,
        'Inject faults around the same durable boundary',
        960,
        285,
        36,
        themeColors.muted,
      );
      line(ctx, api, 270, 535, 1650, 535, themeColors.muted, 3);
      line(ctx, api, 960, 380, 960, 810, themeColors.yellow, 4);
      centerText(ctx, api, 'commit', 960, 340, 35, themeColors.yellow);
      tag(ctx, api, 'fault before → no retained effect', 550, 720, themeColors.blue, 740);
      tag(ctx, api, 'fault after → retained job; reply unknown', 1430, 720, themeColors.pink, 830);
      tag(
        ctx,
        api,
        'same key +same payload → reconcile retained job',
        960,
        915,
        themeColors.green,
        1250,
      );
      note(
        ctx,
        api,
        'Harness-owned expected effects · local tests do not certify remote execution or production partitions',
      );
    }
  });
}
export default {
  id: 'recovery-transfer',
  draw: drawRecoveryTransfer,
  cues: ['transfer-wait', 'transfer-stop', 'transfer-stale', 'completion-rate', 'disposition-rate'],
};
