import { TRACKS } from '../arithmetic.mjs';
import { conditionalEdgeExperiment } from '../construction.mjs';
import { drawCard, drawEquation, drawText, withFocus } from '../defaults.mjs';
export function drawSynthesis(ctx, scene, state, api) {
  const { C: themeColors, teaching } = api;
  const beat = state.beat ?? 0;
  const progress = api.clamp(state.beatP ?? 0);
  const reveal = (from = 0.08, to = 0.82) => api.phase(progress, from, to);
  const track = TRACKS['synthesis'];
  const snapshot = track?.sample({
    beat,
    beatP: progress,
  }).snapshot;
  {
    if (beat === 1) {
      const edgeProgress = api.focus
          ? api.focus.progress('synthesis-beat-2-focus-1', progress)
          : progress,
        current = conditionalEdgeExperiment(edgeProgress);
      drawText(
        ctx,
        api,
        'Width 2 · same prefix Mia opened · move probability mass from the to a',
        960,
        275,
        29,
        themeColors.ink,
        'center',
      );
      withFocus(ctx, api, 'synthesis-conditional-edge', () => {
        teaching.bars({
          x: 220,
          y: 350,
          width: 800,
          height: 165,
          values: current.choices.map((row) => row[1]),
          labels: current.choices.map((row) => row[0]),
          colors: [themeColors.cyan, themeColors.yellow, themeColors.muted],
          max: 0.8,
          progress: 1,
          showValues: true,
          format: (value) => value.toFixed(3),
          fontSize: 28,
        });
        teaching.changeCue(
          {
            x: 1200,
            y: 355,
            width: 570,
            height: 95,
            from: 0.5,
            to: 0.2,
            progress: edgeProgress,
            color: themeColors.yellow,
            emphasis: edgeProgress > 0 && edgeProgress < 1 ? 0.7 : 0,
          },
          (cue) =>
            drawEquation(
              ctx,
              api,
              'P(\\mathrm{the}\\mid\\mathrm{Mia\\ opened})=' + cue.value.toFixed(3),
              1480,
              410,
              36,
              cue.color,
              'center',
            ),
        );
      });
      const candidates = current.run.history[1].expansions.filter((row) => !row.completed);
      withFocus(ctx, api, 'synthesis-active-frontier', () =>
        candidates.forEach((row, i) => {
          const kept = current.frontier.includes(row.text),
            x = 180 + (i % 2) * 820,
            y = 610 + Math.floor(i / 2) * 115;
          drawCard(
            ctx,
            api,
            'synthesis',
            row.text + ' · ' + row.probability.toFixed(3) + ' · ' + (kept ? 'KEEP' : 'pruned'),
            x,
            y,
            730,
            85,
            kept ? themeColors.green : themeColors.muted,
            29,
            1,
          );
        }),
      );
      const output = () =>
        withFocus(ctx, api, 'synthesis-edge-outputs', () => {
          drawCard(
            ctx,
            api,
            'synthesis',
            'Raw winner: Mia ' +
              current.raw.text +
              ' · probability ' +
              current.raw.probability.toFixed(4),
            200,
            890,
            1520,
            65,
            themeColors.cyan,
            28,
            1,
          );
          drawCard(
            ctx,
            api,
            'synthesis',
            'Mean-log winner: Mia ' +
              current.normalized.text +
              ' · ' +
              current.normalized.meanLogProbability.toFixed(3),
            200,
            980,
            1520,
            65,
            themeColors.yellow,
            28,
            1,
          );
        });
      if (api.focus) api.focus.reveal('synthesis-compare-outputs', output);
      else if (progress > 0.55) output();
    } else {
      const x = [120, 540, 960, 1380];
      const scoreLabel = snapshot.score
        .replace('cumulative log probability', 'Joint log score')
        .replace('mean log probability', 'Mean log score');
      const labels = [snapshot.policy, scoreLabel, snapshot.stop, 'Measure outcomes'];
      const colors = [themeColors.blue, themeColors.cyan, themeColors.yellow, themeColors.green];
      const nodes = labels.map((label, index) =>
        withFocus(ctx, api, 'synthesis-object-label-70', () =>
          drawCard(ctx, api, 'synthesis', label, x[index], 465, 360, 116, colors[index], 27, 1),
        ),
      );
      for (let index = 0; index < nodes.length - 1; index += 1) {
        teaching.transfer({
          source: {
            shape: nodes[index],
            opacity: reveal(index * 0.12, 0.62 + index * 0.08),
          },
          target: {
            shape: nodes[index + 1],
            opacity: reveal((index + 1) * 0.12, 0.62 + (index + 1) * 0.08),
          },
          progress: reveal(0.25, 0.82),
          color: colors[index],
          particle: {
            radius: 7,
            fill: themeColors.yellow,
          },
          gap: 14,
        });
      }
      drawText(ctx, api, snapshot.measures.join(' · '), 960, 700, 30, themeColors.yellow, 'center');
      drawText(
        ctx,
        api,
        `Decision ${beat + 1} of the lesson: ${snapshot.policy}`,
        960,
        900,
        30,
        themeColors.yellow,
        'center',
      );
    }
  }
}
export default {
  id: 'synthesis',
  draw: drawSynthesis,
  cues: [
    'synthesis-beat-1-focus-1',
    'synthesis-beat-1-focus-2',
    'synthesis-beat-2-focus-1',
    'synthesis-compare-outputs',
    'synthesis-beat-3-focus-1',
    'synthesis-beat-3-focus-2',
  ],
};
