import { fingerprint, records } from '../fixtures.mjs';
import { normalizationStates } from '../model.mjs';
import { drawOriginalCard, drawOriginalText, drawOriginalVisualFocus } from '../defaults.mjs';
export function drawNormalization(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  const phaseForBeat = (i, a = 0.08, z = 0.88) =>
    currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  {
    const step = currentBeat === 0 ? Math.min(3, Math.floor(phaseForBeat(0) * 4)) : 3;
    drawOriginalText(
      ctx,
      api,
      'Raw record stays available for inspection',
      520,
      280,
      31,
      themeColors.muted,
    );
    drawOriginalVisualFocus(
      ctx,
      api,
      'normalization-object-raw-text-unicode-nfkc-case-folded-whitespace-colla-21',
      () =>
        drawOriginalText(
          ctx,
          api,
          ['Raw text', 'Unicode NFKC', 'Case folded', 'Whitespace collapsed'][step],
          1410,
          280,
          34,
          themeColors.yellow,
        ),
    );
    drawOriginalVisualFocus(ctx, api, 'normalization-simulation-22', () => {
      for (const [i, row] of records.slice(0, 2).entries()) {
        const y = 345 + i * 210,
          stages = normalizationStates(row.text),
          raw = drawOriginalCard(
            ctx,
            api,
            '“' + row.text + '”',
            145,
            y,
            i ? themeColors.blue : themeColors.cyan,
            730,
            90,
            1,
            34,
          );
        drawOriginalText(
          ctx,
          api,
          row.id + ' · ' + row.conversation + ' · ' + row.label,
          510,
          y + 140,
          29,
          i ? themeColors.blue : themeColors.cyan,
        );
        const target = drawOriginalCard(
          ctx,
          api,
          '“' + stages[step] + '”',
          1050,
          y,
          themeColors.yellow,
          730,
          90,
          1,
          34,
        );
        drawOriginalText(
          ctx,
          api,
          'same record ' + row.id + ' · fields retained',
          1415,
          y + 140,
          28,
          themeColors.muted,
        );
        const route = api.connect(ctx, raw, target, {
          color: themeColors.yellow,
          width: 3,
          fromGap: 12,
          toGap: 12,
        });
        if (currentBeat === 0 && progress < 0.88)
          api.components.particle({
            points: [route.from, route.to],
            progress: phaseForBeat(0),
            radius: 8,
            fill: themeColors.yellow,
          });
      }
    });
    if (currentBeat === 1) {
      drawOriginalText(ctx, api, 'Unicode example: ﬁle → file', 960, 815, 44, themeColors.cyan);
      drawOriginalText(
        ctx,
        api,
        'NFKC changes the ligature; task rules decide whether that is appropriate.',
        960,
        885,
        29,
        themeColors.muted,
      );
    } else if (currentBeat >= 2) {
      drawOriginalText(
        ctx,
        api,
        '101 / 102 share key ' + fingerprint(records[0].text).slice(0, 12) + '…',
        960,
        805,
        36,
        themeColors.yellow,
      );
      drawOriginalText(ctx, api, '107: build is not failing', 520, 895, 33, themeColors.pink);
      drawOriginalText(
        ctx,
        api,
        'different key ' + fingerprint(records[4].text).slice(0, 12) + '…',
        1380,
        895,
        33,
        themeColors.pink,
      );
    } else
      drawOriginalText(
        ctx,
        api,
        'Case and whitespace change; ID, conversation and reviewed label stay attached.',
        960,
        860,
        31,
        themeColors.ink,
      );
  }
}

// The executable Python article is authoritative. This illustrated subset covers its
// ASCII ticket fixture plus the explicitly demonstrated compatibility/sharp-s forms.
export default {
  id: 'normalization',
  draw: drawNormalization,
  cues: [
    'normalization-beat-1-focus-1',
    'normalization-beat-1-focus-2',
    'normalization-beat-2-focus-1',
    'normalization-beat-3-focus-1',
  ],
};
