import { cueProgress } from '../arithmetic.mjs';
import { releaseSnapshot } from '../construction.mjs';
import { card, text, visualFocus } from '../defaults.mjs';
import { phase as cuePhase } from '../../../lib/scene.mjs';
export function drawEvaluateAndRelease(ctx, scene, state, api) {
  const { C: themeColors, phase } = api;
  const beat = state.beat ?? 0,
    progress2 = state.beatP ?? 0,
    q = phase(progress2, 0.04, 0.92);
  {
    const snapshot = releaseSnapshot(beat, progress2);
    const coverageCueIds = [
      'release-fragment-check-b2-1',
      'release-complete-rule-b2-2',
      'release-all-fields-b2-3',
    ];
    const activeCoverage = coverageCueIds.findIndex((id) => state.cues?.[id]?.active);
    const focusedCandidate = activeCoverage < 0 ? snapshot.evaluatedCount - 1 : activeCoverage;
    const positions = [120, 710, 1300];
    const display = {
      'condition-only': 'Rollback failure:\npage on-call within',
      'deadline-with-competing-rule':
        '15 minutes with deploy ID.\nRoutine deploy notes\narchive within 14 days.',
      'complete-rule': 'Rollback failure:\npage on-call within\n15 minutes with deploy ID.',
    };
    visualFocus(ctx, api, 'release-query', () =>
      card(ctx, api, `QUERY · ${snapshot.query}`, 120, 245, 1245, themeColors.blue, 110, 25),
    );
    card(
      ctx,
      api,
      `Passage length ≤ ${snapshot.wordCap} words`,
      1400,
      245,
      400,
      themeColors.yellow,
      110,
      26,
    );
    visualFocus(ctx, api, 'release-candidates', () =>
      snapshot.allRows.forEach((candidate, index) => {
        const baseX = positions[index],
          evaluated = index < snapshot.evaluatedCount;
        const selected = snapshot.selected?.id === candidate.id;
        const move = selected
          ? cueProgress(state, 'release-cutoff-choice-b3-1', cuePhase(progress2, 0.12, 0.72))
          : 0;
        const x = selected && move > 0.6 ? baseX + ((710 - baseX) * (move - 0.6)) / 0.4 : baseX;
        const y = selected ? 435 + (775 - 435) * Math.min(1, move / 0.6) : 435;
        const color =
          selected || (evaluated && candidate.releasable)
            ? themeColors.green
            : evaluated
              ? themeColors.pink
              : themeColors.cyan;
        text(
          ctx,
          api,
          `Candidate ${index + 1} · ${candidate.wordCount} / ${snapshot.wordCap} words`,
          x + 250,
          y - 30,
          25,
          color,
          'center',
        );
        if (selected)
          visualFocus(ctx, api, 'release-selection', () =>
            card(ctx, api, display[candidate.id], x, y, 500, color, 200, 25),
          );
        else card(ctx, api, display[candidate.id], x, y, 500, color, 200, 25);
        if (evaluated && !selected) {
          const fields = [
            ['condition', 'condition'],
            ['deadline', 'deadline'],
            ['identifier', 'deploy ID'],
          ]
            .map(([key, label]) => `${label} ${candidate.coverage[key] ? '✓' : '×'}`)
            .join('  ·  ');
          visualFocus(
            ctx,
            api,
            index === focusedCandidate ? 'release-coverage' : `release-coverage-${candidate.id}`,
            () => {
              text(ctx, api, fields, x + 250, 685, 22, color, 'center');
              text(
                ctx,
                api,
                candidate.withinCap ? 'within cutoff' : 'over cutoff',
                x + 250,
                725,
                22,
                candidate.withinCap ? themeColors.green : themeColors.pink,
                'center',
              );
            },
          );
        } else if (beat > 0 && !selected) {
          text(ctx, api, 'Coverage check pending', x + 250, 705, 22, themeColors.muted, 'center');
        }
      }),
    );
    if (snapshot.selected) {
      visualFocus(ctx, api, 'release-source', () =>
        text(
          ctx,
          api,
          `Source span · ${snapshot.locator}`,
          960,
          1042,
          21,
          themeColors.muted,
          'center',
        ),
      );
    } else {
      text(
        ctx,
        api,
        'At most 10 words. Look for the condition, deadline and deploy ID together.',
        960,
        915,
        26,
        themeColors.muted,
        'center',
      );
    }
  }
}
export default {
  id: 'evaluate-and-release',
  draw: drawEvaluateAndRelease,
  cues: [
    'release-query-cutoff-b1-1',
    'release-ten-word-cutoff-b1-2',
    'release-fragment-check-b2-1',
    'release-complete-rule-b2-2',
    'release-all-fields-b2-3',
    'release-cutoff-choice-b3-1',
    'release-source-span-b3-2',
  ],
};
