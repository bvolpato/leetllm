import { pipeline } from '../arithmetic.mjs';
import { shards } from '../model.mjs';
import { drawOriginalText } from '../defaults.mjs';
export function drawPipeline(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1),
    phaseForBeat = (i) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, 0.04, 0.92),
    whole = (currentBeat + phaseForBeat(currentBeat)) / 3;
  const result = shards();
  {
    api.focus.target('pipeline-four-items-three-equal-duration-stages-six-ticks', () =>
      drawOriginalText(
        ctx,
        api,
        'Four items, three equal-duration stages, six ticks',
        960,
        285,
        37,
        themeColors.ink,
        'center',
      ),
    );
    const layout = pipeline(),
      tick = Math.min(6, Math.ceil(6 * whole));
    for (let i = 0; i < 6; i++)
      api.focus.target('pipeline-readout', () =>
        drawOriginalText(
          ctx,
          api,
          't' + (i + 1),
          450 + i * 210,
          370,
          29,
          themeColors.muted,
          'center',
        ),
      );
    layout.forEach((row, stage) => {
      api.focus.target('pipeline-readout-2', () =>
        drawOriginalText(
          ctx,
          api,
          'Stage ' + (stage + 1),
          210,
          500 + stage * 145,
          30,
          themeColors.muted,
          'center',
        ),
      );
      row.forEach((value, i) =>
        api.focus.target('pipeline-readout-3', () =>
          components.card({
            label: value && i < tick ? 'Item ' + value : '',
            x: 350 + i * 210,
            y: 440 + stage * 145,
            width: 180,
            height: 95,
            fontSize: 30,
            fill: themeColors.panel,
            stroke:
              value && i < tick
                ? [themeColors.blue, themeColors.cyan, themeColors.pink, themeColors.yellow][
                    value - 1
                  ]
                : themeColors.muted,
            textColor: value
              ? [themeColors.blue, themeColors.cyan, themeColors.pink, themeColors.yellow][
                  value - 1
                ]
              : themeColors.muted,
          }),
        ),
      );
    });
    api.focus.target('pipeline-idealized-schedule-excludes-transfer-time-and-stage-imb', () =>
      drawOriginalText(
        ctx,
        api,
        'Idealized schedule: excludes transfer time and stage imbalance',
        960,
        950,
        30,
        themeColors.muted,
        'center',
      ),
    );
  }
}
export default {
  id: 'pipeline',
  draw: drawPipeline,
  cues: [
    'ordered-stages',
    'prior-dependency',
    'overlapping-items',
    'pipeline-bubbles',
    'schedule-limits',
    'serial-dependency',
  ],
};
