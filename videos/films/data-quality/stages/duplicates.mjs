import {
  crossConversationReviewGroups,
  deduplicatedIds,
  fingerprint,
  records,
  sameConversationDuplicateGroups,
} from '../fixtures.mjs';
import { drawOriginalCard, drawOriginalText, drawOriginalVisualFocus } from '../defaults.mjs';
export function drawDuplicates(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  const phaseForBeat = (i, a = 0.08, z = 0.88) =>
    currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  {
    const reviewGroup = crossConversationReviewGroups[0];
    const duplicateGroup = sameConversationDuplicateGroups[0];
    const reviewRows = reviewGroup.map((row, i) =>
      drawOriginalVisualFocus(ctx, api, 'duplicates-object-ticket-31', () =>
        drawOriginalCard(
          ctx,
          api,
          `ticket ${row.id} · ${row.conversation} · ${row.label}`,
          135,
          370 + i * 88,
          row.label === 'escalate' ? themeColors.pink : themeColors.cyan,
          700,
          70,
          1,
          27,
        ),
      ),
    );
    drawOriginalVisualFocus(
      ctx,
      api,
      'duplicates-object-one-normalized-text-across-two-conversations-32',
      () =>
        drawOriginalText(
          ctx,
          api,
          'one normalized text across two conversations',
          485,
          320,
          30,
          themeColors.muted,
        ),
    );
    const quarantineCard = drawOriginalVisualFocus(ctx, api, 'duplicates-quarantine', () =>
      drawOriginalCard(
        ctx,
        api,
        `quarantine ${reviewGroup.map((row) => row.id).join(', ')}`,
        1150,
        420,
        themeColors.red,
        565,
        94,
        currentBeat > 0 ? 1 : 0,
        28,
      ),
    );
    drawOriginalText(
      ctx,
      api,
      `${new Set(reviewGroup.map((row) => row.conversation)).size} conversations · ${new Set(reviewGroup.map((row) => row.label)).size} labels`,
      1432,
      550,
      28,
      themeColors.yellow,
    );
    api.components.fade(phaseForBeat(1), () =>
      reviewRows.forEach((row) => {
        const route = api.connect(ctx, row, quarantineCard, {
          color: themeColors.red,
          width: 3,
          fromGap: 12,
          toGap: 14,
        });
        if (phaseForBeat(1) < 1)
          api.components.particle({
            points: [route.from, route.to],
            progress: phaseForBeat(1),
            radius: 7,
            fill: themeColors.red,
          });
      }),
    );
    if (currentBeat >= 2)
      drawOriginalText(
        ctx,
        api,
        `same conversation · ${duplicateGroup[0].conversation}`,
        490,
        660,
        30,
        themeColors.muted,
      );
    const duplicateRows = duplicateGroup.map((row, i) =>
      drawOriginalVisualFocus(ctx, api, 'duplicates-same-conversation', () =>
        drawOriginalCard(
          ctx,
          api,
          `ticket ${row.id} · ${row.label}`,
          135,
          700 + i * 88,
          i === 0 ? themeColors.green : themeColors.yellow,
          700,
          70,
          currentBeat >= 2 ? 1 : 0,
          29,
        ),
      ),
    );
    const representativeCard = drawOriginalVisualFocus(
      ctx,
      api,
      'duplicates-object-keep-remove-duplicate-37',
      () =>
        drawOriginalCard(
          ctx,
          api,
          `keep ${duplicateGroup[0].id} · remove duplicate ${deduplicatedIds.values().next().value}`,
          1110,
          745,
          themeColors.green,
          605,
          94,
          phaseForBeat(2),
          27,
        ),
    );
    api.components.fade(phaseForBeat(2), () =>
      duplicateRows.forEach((row, i) => {
        const route = api.connect(ctx, row, representativeCard, {
          color: i === 0 ? themeColors.green : themeColors.yellow,
          width: 3,
          fromGap: 12,
          toGap: 14,
        });
        if (phaseForBeat(2) < 1)
          api.components.particle({
            points: [route.from, route.to],
            progress: phaseForBeat(2),
            radius: 7,
            fill: i === 0 ? themeColors.green : themeColors.yellow,
          });
      }),
    );
    if (currentBeat >= 2)
      drawOriginalText(
        ctx,
        api,
        'the candidate keeps the representative',
        1412,
        875,
        28,
        themeColors.muted,
      );
    if (currentBeat >= 2)
      drawOriginalText(
        ctx,
        api,
        `Lineage retained: 101 ← 102 · c-51 · key ${fingerprint(records[0].text).slice(0, 8)}`,
        960,
        975,
        29,
        themeColors.green,
      );
  }
}

// The executable Python article is authoritative. This illustrated subset covers its
// ASCII ticket fixture plus the explicitly demonstrated compatibility/sharp-s forms.
export default {
  id: 'duplicates',
  draw: drawDuplicates,
  cues: [
    'duplicates-beat-1-focus-1',
    'duplicates-beat-1-focus-2',
    'duplicates-beat-2-focus-1',
    'duplicates-beat-3-focus-1',
    'duplicates-beat-3-focus-2',
  ],
};
