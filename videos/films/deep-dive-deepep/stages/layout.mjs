import { sampleModel } from '../construction.mjs';
import { text } from '../defaults.mjs';
export function drawLayout(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('layout', state),
    currentBeat = modelState.b,
    result = (name) => state.cues?.['dep-result-' + name]?.phase === 'after';
  {
    text(
      ctx,
      api,
      `Counts [${modelState.counts.join(', ')}] · alignment ${modelState.alignment}`,
      960,
      285,
      41,
      themeColors.yellow,
      'center',
    );
    const labels = modelState.valid.map((valid, slot) =>
        valid ? modelState.inverse.get(slot) : 'gap',
      ),
      highlights = modelState.valid.flatMap((valid, column) =>
        valid
          ? [
              {
                row: 0,
                column,
                fill: themeColors.panel,
                stroke: themeColors.cyan,
              },
            ]
          : [],
      );
    if (currentBeat === 2 && modelState.rejectedPadding && result('layout-reject'))
      highlights.push({
        row: 0,
        column: modelState.attempt.slot,
        fill: themeColors.panel,
        stroke: themeColors.pink,
      });
    labels.forEach((_, slot) =>
      text(
        ctx,
        api,
        `slot ${slot}`,
        190 + ((slot + 0.5) * 1540) / modelState.capacity,
        405,
        25,
        themeColors.muted,
        'center',
      ),
    );
    api.focus.target('layout-labels', () =>
      teaching.grid({
        x: 190,
        y: 450,
        width: 1540,
        height: 140,
        rows: 1,
        columns: modelState.capacity,
        labels: [labels],
        fontSize: 31,
        fill: themeColors.panel,
        stroke: themeColors.muted,
        textColor: themeColors.ink,
        highlights,
      }),
    );
    text(
      ctx,
      api,
      `Inverse map: ${[...modelState.inverse].map(([slot, token]) => `${slot} → ${token}`).join('    ')}`,
      960,
      660,
      29,
      themeColors.cyan,
      'center',
    );
    text(
      ctx,
      api,
      `Starts [${modelState.starts.join(', ')}] · valid endpoints [${modelState.endpoints.join(', ')}]`,
      960,
      760,
      36,
      themeColors.cyan,
      'center',
    );
    api.focus.target('dep-layout-summary', () => {
      const ready = currentBeat === 0 || result('layout-eight'),
        rejected = currentBeat === 2 && result('layout-reject');
      text(
        ctx,
        api,
        ready
          ? `Real rows ${modelState.valid.filter(Boolean).length} · allocated ${modelState.capacity}`
          : 'Valid-row and allocated-capacity totals pending',
        960,
        875,
        39,
        ready ? themeColors.green : themeColors.muted,
        'center',
      );
      text(
        ctx,
        api,
        rejected
          ? `Returned slot ${modelState.attempt.slot} rejected: ${modelState.attempt.error}`
          : currentBeat === 2
            ? 'Return from gap slot 3 · validation result pending'
            : 'Every valid slot has an inverse source identity · gaps have none',
        960,
        1000,
        29,
        rejected ? themeColors.pink : themeColors.muted,
        'center',
      );
    });
  }
}
export default {
  id: 'layout',
  draw: drawLayout,
  cues: [
    'layout-beat-1-focus-1',
    'layout-beat-2-focus-1',
    'dep-result-layout-eight',
    'layout-beat-3-focus-1',
    'dep-result-layout-reject',
  ],
};
