import { maskReceiptFixture, maskReceiptMatches, spokenProgress } from '../model.mjs';
import {
  chapterArrow,
  chapterFooter,
  chapterPanel,
  chapterStripe,
  chapterSubtitle,
  chapterText,
  focusScope,
} from '../defaults.mjs';
export function drawHandoff(ctx, scene, state, api) {
  const themeColors = {
      ...api.C,
      purple: '#b7a2f7',
    },
    beat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const q = (id, fallback = progress) => spokenProgress(state, id, fallback);
  {
    chapterSubtitle(
      ctx,
      api,
      themeColors,
      'The saved record is the bridge between scoring and execution',
    );
    focusScope(ctx, api, 'handoff-id-job-label', () => {
      const names = ['estimate', 'write record', 'slice + restore', 'continue'];
      names.forEach((s, i) =>
        chapterPanel(
          ctx,
          api,
          themeColors,
          s,
          160 + i * 440,
          345,
          370,
          100,
          [themeColors.blue, themeColors.cyan, themeColors.yellow, themeColors.green][i],
        ),
      );
      for (let i = 0; i < 3; i++)
        chapterArrow(
          ctx,
          api,
          themeColors,
          530 + i * 440,
          395,
          580 + i * 440,
          395,
          themeColors.muted,
        );
    });
    focusScope(ctx, api, 'lp-handoff-record', () => {
      const record = maskReceiptFixture(),
        moved = beat > 1 ? 1 : beat === 1 ? q('lp-record-load') : 0;
      const x = api.lerp(430, 1110, moved);
      chapterPanel(
        ctx,
        api,
        themeColors,
        'R17 · SHA-256 ' + record.digest.slice(0, 10),
        x,
        510,
        540,
        85,
        themeColors.cyan,
        28,
      );
      chapterText(
        ctx,
        api,
        themeColors,
        'record R17 · head IDs [0,2,3]',
        540,
        635,
        32,
        themeColors.cyan,
        'center',
      );
      chapterStripe(
        ctx,
        api,
        themeColors,
        ['H0', 'H1', 'H2', 'H3'],
        260,
        705,
        'original coordinates',
        [0, 2, 3],
        themeColors.cyan,
        115,
        80,
      );
    });
    focusScope(ctx, api, 'lp-handoff-shape', () => {
      const cut = beat > 1 ? 1 : beat === 1 ? q('lp-handoff-slice') : 0,
        record = maskReceiptFixture();
      const matched = maskReceiptMatches(record, {
        modelRevision: 'R17',
        selected: [0, 2, 3],
        shape: [3, 2],
      });
      chapterStripe(
        ctx,
        api,
        themeColors,
        cut > 0.8 ? ['H0', 'H2', 'H3'] : ['H0', 'H1', 'H2', 'H3'],
        1120,
        705,
        cut > 0.8 ? 'reduced receiving shape' : 'receiving shape pending',
        undefined,
        cut > 0.8 ? themeColors.green : themeColors.muted,
        115,
        80,
      );
      chapterArrow(ctx, api, themeColors, 850, 745, 1060, 745, themeColors.yellow, cut);
      if (cut === 1)
        chapterText(
          ctx,
          api,
          themeColors,
          matched ? 'Hash + R17 + selected axes: MATCH' : 'HOLD · record / shape mismatch',
          1390,
          850,
          27,
          matched ? themeColors.green : themeColors.pink,
          'center',
        );
    });
    focusScope(ctx, api, 'lp-handoff-clock', () => {
      if (beat === 2)
        chapterText(
          ctx,
          api,
          themeColors,
          'estimate + records + surgery + continue + evaluate + export',
          960,
          925,
          30,
          themeColors.yellow,
          'center',
        );
    });
    chapterFooter(
      ctx,
      api,
      themeColors,
      'Supplied record bytes hashed locally · run identity and selected shape must agree before continuation.',
    );
  }
}
export default {
  id: 'handoff',
  draw: drawHandoff,
  cues: [
    'handoff-beat-1-focus-1',
    'handoff-beat-2-focus-1',
    'lp-record-load',
    'lp-handoff-slice',
    'handoff-beat-3-focus-1',
    'lp-stopwatch-scope',
  ],
};
