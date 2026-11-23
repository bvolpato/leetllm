import { rateContentDigest } from '../arithmetic.mjs';
import { cueProgress } from '../construction.mjs';
import {
  drawChapterFooter,
  drawChapterLine,
  drawChapterTag,
  drawChapterText,
} from '../defaults.mjs';
export function drawTraceIntegrity(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    q = api.clamp(state.beatP ?? 0),
    cue = state.cues?.['te-trace-integrity-' + currentBeat],
    u = cue ? api.clamp(cue.progress) : api.clamp(q / 0.82),
    done = u >= 1;
  api.focus.target('te-trace-integrity-mechanism', () => {
    const sameId = 'standard-sep21',
      original = '2.50 / 0.25 / 15.00',
      edited = '2.50 / 0.25 / 16.00';
    drawChapterText(
      ctx,
      api,
      'Task T42 · attempt A1 · feature policy',
      960,
      320,
      34,
      themeColors.blue,
    );
    drawChapterTag(ctx, api, 'Rate ID: standard-sep21', 500, 440, themeColors.yellow, 590);
    drawChapterTag(
      ctx,
      api,
      'Recorded rates: 2.50 / 0.25 / 15.00',
      1400,
      440,
      themeColors.yellow,
      620,
    );
    if (currentBeat === 0) {
      const rows1 = [
        'Model GPT-5.4 · tier Standard',
        'Region + outcome + usage',
        'Release + approved rate content',
      ];
      rows1.forEach((s, i) => {
        drawChapterTag(
          ctx,
          api,
          s,
          960,
          610 + i * 120,
          i === 2 ? themeColors.yellow : themeColors.cyan,
          1000,
        );
      });
    } else if (currentBeat === 1) {
      const restored = cueProgress(state, 'restore-rates', Number(q >= 0.8));
      const changed = u > 0.5 && restored < 1,
        reference = rateContentDigest(15),
        current = rateContentDigest(changed ? 16 : 15);
      drawChapterTag(
        ctx,
        api,
        changed ? 'Same ID · edited output price' : 'Reproduce the recorded approved bytes',
        960,
        620,
        changed ? themeColors.pink : themeColors.green,
        1000,
      );
      drawChapterText(
        ctx,
        api,
        changed ? '2.50 / 0.25 / 16.00' : '2.50 / 0.25 / 15.00',
        960,
        735,
        38,
        changed ? themeColors.pink : themeColors.green,
      );
      drawChapterText(
        ctx,
        api,
        'Recorded SHA-256 prefix: ' + reference.slice(0, 12),
        500,
        815,
        26,
        themeColors.yellow,
      );
      drawChapterText(
        ctx,
        api,
        'Current SHA-256 prefix: ' + current.slice(0, 12),
        1420,
        815,
        26,
        changed ? themeColors.pink : themeColors.green,
      );
      drawChapterText(
        ctx,
        api,
        reference === current
          ? 'Matching content restores historical arithmetic'
          : 'Content digest mismatch → REJECT',
        960,
        930,
        34,
        reference === current ? themeColors.green : themeColors.pink,
      );
    } else {
      drawChapterTag(ctx, api, 'Matching digest', 500, 665, themeColors.green);
      drawChapterTag(
        ctx,
        api,
        'Provider authenticity / approval',
        1400,
        665,
        themeColors.yellow,
        650,
      );
      drawChapterLine(ctx, api, 790, 665, 1010, 665, themeColors.muted, 3);
      drawChapterText(
        ctx,
        api,
        'A trusted reference is still required',
        960,
        885,
        37,
        themeColors.yellow,
      );
    }
    drawChapterFooter(
      ctx,
      api,
      'LedgerTrace is a supplied cohort record, not an executed telemetry integration or a signed provider bill.',
    );
  });
}
export default {
  id: 'trace-integrity',
  draw: drawTraceIntegrity,
  cues: ['te-trace-integrity-0', 'te-trace-integrity-1', 'restore-rates', 'te-trace-integrity-2'],
};
