import { confusion } from '../fixtures.mjs';
import { card, cueReveal, cueVisible, focus, text } from '../defaults.mjs';
export function drawAlertUsefulness(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  {
    const precision = confusion.tp / (confusion.tp + confusion.fp);
    const recall = confusion.tp / (confusion.tp + confusion.fn);
    const precisionShown = cueVisible(ctx, api, 'alert-usefulness-precision', currentBeat > 0);
    const recallShown = cueVisible(ctx, api, 'alert-usefulness-recall', currentBeat > 0);
    const quietShown = cueVisible(ctx, api, 'alert-usefulness-quiet-period', currentBeat > 2);
    const labels = [
      ['', 'Actionable disruption', 'Routine workload'],
      [
        'Alert sent',
        precisionShown ? `Actionable · ${confusion.tp}` : '',
        precisionShown ? `Unhelpful · ${confusion.fp}` : '',
      ],
      [
        'No alert',
        recallShown ? `Missed · ${confusion.fn}` : '',
        quietShown ? `Quiet · ${confusion.tn}` : '',
      ],
    ];
    api.teaching.grid({
      x: 340,
      y: 365,
      width: 1240,
      height: 300,
      rows: 3,
      columns: 3,
      labels,
      cellFocusTarget: (row, column) =>
        ({
          '1,1': 'alert-cell-0',
          '1,2': 'alert-cell-1',
          '2,1': 'alert-cell-2',
          '2,2': 'alert-cell-3',
        })[`${row},${column}`],
      fill: themeColors.panel,
      stroke: themeColors.muted,
      fontSize: 25,
      textColor: themeColors.ink,
      padding: 7,
    });
    const caseTokens = [
      {
        id: 'I1',
        x: 900,
        y: 550,
        show: precisionShown,
        color: themeColors.green,
      },
      {
        id: 'I2',
        x: 1020,
        y: 550,
        show: precisionShown,
        color: themeColors.green,
      },
      {
        id: 'I3',
        x: 1370,
        y: 550,
        show: precisionShown,
        color: themeColors.yellow,
      },
      {
        id: 'I4',
        x: 960,
        y: 650,
        show: recallShown,
        color: themeColors.pink,
      },
      {
        id: 'I5',
        x: 1370,
        y: 650,
        show: quietShown,
        color: themeColors.blue,
      },
    ];
    caseTokens.forEach((r) => {
      if (r.show) text(ctx, api, r.id, r.x, r.y, 24, r.color);
    });
    text(
      ctx,
      api,
      quietShown
        ? 'Same five periods: I1/I2 caught · I3 routine alert · I4 missed · I5 quiet'
        : 'Authored period IDs retain identity as outcomes are classified',
      960,
      325,
      25,
      themeColors.muted,
    );
    cueReveal(ctx, api, 'alert-usefulness-precision-result', currentBeat > 1, () =>
      card(
        ctx,
        api,
        `Precision · ${confusion.tp}/${confusion.tp + confusion.fp}`,
        340,
        745,
        themeColors.cyan,
        550,
        68,
        1,
        'alert-precision-result',
      ),
    );
    cueReveal(ctx, api, 'alert-usefulness-recall-result', currentBeat > 1, () =>
      card(
        ctx,
        api,
        `Recall · ${confusion.tp}/${confusion.tp + confusion.fn}`,
        1030,
        745,
        themeColors.yellow,
        550,
        68,
        1,
        'alert-recall-result',
      ),
    );
    cueReveal(ctx, api, 'alert-usefulness-decimals', currentBeat > 1, () => {
      focus(ctx, api, 'alert-precision-decimal', () =>
        api.teaching.valueChange({
          x: 340,
          y: 835,
          width: 550,
          height: 76,
          from: 0,
          to: precision,
          progress: 1,
          label: 'Precision',
          format: (value) => value.toFixed(3),
          fontSize: 30,
          showDelta: false,
          color: themeColors.cyan,
          restColor: themeColors.ink,
        }),
      );
      focus(ctx, api, 'alert-recall-decimal', () =>
        api.teaching.valueChange({
          x: 1030,
          y: 835,
          width: 550,
          height: 76,
          from: 0,
          to: recall,
          progress: 1,
          label: 'Recall',
          format: (value) => value.toFixed(3),
          fontSize: 30,
          showDelta: false,
          color: themeColors.yellow,
          restColor: themeColors.ink,
        }),
      );
    });
    if (
      cueVisible(ctx, api, 'alert-usefulness-small-sample', currentBeat > 1) &&
      !cueVisible(ctx, api, 'alert-usefulness-review-outcomes', currentBeat > 2)
    ) {
      focus(ctx, api, 'alert-small-sample', () =>
        text(ctx, api, 'Five reviewed cases · wide uncertainty', 960, 950, 25, themeColors.muted),
      );
    }
    cueReveal(ctx, api, 'alert-usefulness-review-outcomes', currentBeat > 2, () =>
      focus(ctx, api, 'alert-review-outcomes', () =>
        text(
          ctx,
          api,
          'Group alerts into incidents · track delay · test decision impact',
          960,
          950,
          24,
          themeColors.muted,
        ),
      ),
    );
  }
}
export default {
  id: 'alert-usefulness',
  draw: drawAlertUsefulness,
  cues: [
    'alert-usefulness-precision',
    'alert-usefulness-recall',
    'alert-usefulness-precision-result',
    'alert-usefulness-recall-result',
    'alert-usefulness-decimals',
    'alert-usefulness-small-sample',
    'alert-usefulness-review-outcomes',
    'alert-usefulness-quiet-period',
  ],
};
