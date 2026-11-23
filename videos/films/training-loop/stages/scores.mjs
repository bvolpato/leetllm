import { card, equation, optionalFocusTarget, text } from '../defaults.mjs';
import { stableSoftmax } from 'vizmatic';
export function drawScores(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api;
  const beat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  const phaseForBeat = (i) => (beat < i ? 0 : beat > i ? 1 : api.phase(progress, 0.04, 0.96));
  {
    const firstCue = state.cues?.['scores-beat-2-focus-1'],
      meanCue = state.cues?.['scores-beat-2-focus-2'];
    const secondProgress =
        beat < 1
          ? 0
          : beat > 1
            ? 1
            : firstCue && meanCue
              ? api.clamp((state.t - firstCue.end) / (meanCue.start - firstCue.end), 0, 1)
              : api.phase(progress, 0.25, 0.7),
      meanVisible =
        beat > 1 || (beat === 1 && (meanCue ? meanCue.phase !== 'before' : progress > 0.7));
    const raw = [
        [2, -1],
        [-0.5, 1.5],
      ],
      targets = [0, 1];
    const rows = raw.map((row) => stableSoftmax(row));
    const rowLoss = rows.map((row, i) => -Math.log(row[targets[i]]));
    const batchLoss = rowLoss.reduce((a, value) => a + value, 0) / rowLoss.length;
    optionalFocusTarget(ctx, api, 'scores-object-ticket-a-target-standard-14', () =>
      card(ctx, api, 'Ticket A · target standard', 240, 325, 610, 88, themeColors.blue),
    );
    card(ctx, api, 'Ticket B · target escalate', 1070, 325, 610, 88, themeColors.green);
    optionalFocusTarget(ctx, api, 'scores-simulation-16', () =>
      raw.forEach((row, i) => {
        optionalFocusTarget(ctx, api, 'scores-equation-string-raw-row-0-row-1-17', () =>
          equation(
            ctx,
            api,
            String.raw`[${row[0]},\;${row[1]}]`,
            545 + i * 830,
            500,
            44,
            themeColors.ink,
          ),
        );
        teaching.bars({
          x: 285 + i * 830,
          y: 585,
          width: 540,
          height: 200,
          values: rows[i],
          labels: ['standard', 'escalate'],
          colors: [themeColors.blue, themeColors.cyan],
          max: 1,
          progress: i === 0 ? phaseForBeat(0) : secondProgress,
          showValues: true,
          format: (value) => value.toFixed(3),
          fontSize: 28,
          gap: 70,
        });
        if (i === 0 ? phaseForBeat(0) > 0.9 : secondProgress === 1)
          text(
            ctx,
            api,
            `target loss  ${rowLoss[i].toFixed(3)}`,
            555 + i * 830,
            875,
            30,
            themeColors.yellow,
            'center',
          );
      }),
    );
    optionalFocusTarget(
      ctx,
      api,
      'scores-batch-average',
      () =>
        meanVisible &&
        equation(
          ctx,
          api,
          String.raw`\overline{L}=\frac{L_1+L_2}{2}\approx${batchLoss.toFixed(4)}`,
          960,
          950,
          42,
          themeColors.green,
        ),
    );
  }
}
export default {
  id: 'scores',
  draw: drawScores,
  cues: [
    'scores-beat-1-focus-1',
    'scores-beat-1-focus-2',
    'scores-beat-2-focus-1',
    'scores-beat-2-focus-2',
  ],
};
