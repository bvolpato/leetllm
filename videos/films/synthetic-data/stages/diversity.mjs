import { cosineSimilarity, orderAudit } from '../arithmetic.mjs';
import { diversityState } from '../construction.mjs';
import { card, equation, text } from '../defaults.mjs';
export function drawDiversity(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api;
  const currentBeat = state.beat ?? 0,
    progress2 = api.clamp(state.beatP ?? 0, 0, 1);
  const audit = orderAudit(0.8, 0.7);
  {
    const nearCueProgress = state.cues?.['diversity-b2-1']
      ? api.focus.progress('diversity-b2-1', 0)
      : undefined;
    const current = diversityState(currentBeat, progress2, nearCueProgress),
      seed = [1, 0],
      near = [0.99, 0.02],
      novel = [0.25, 0.95];
    const plot = teaching.axes({
      x: 190,
      y: 410,
      width: 940,
      height: 470,
      equalUnits: true,
      xDomain: [-0.1, 1.1],
      yDomain: [-0.1, 1.1],
      xTicks: [0, 0.5, 1],
      yTicks: [0, 0.5, 1],
      xLabel: 'embedding coordinate 1',
      yLabel: 'embedding coordinate 2',
      fontSize: 28,
    });
    const origin = plot.point(0, 0),
      seedAt = plot.point(...seed);
    api.focus.target('seed-vector', () => {
      api.arrow(ctx, origin.x, origin.y, seedAt.x, seedAt.y, themeColors.blue, 4);
      api.focus.target('seed-point', () =>
        api.circle(ctx, seedAt.x, seedAt.y, 14, themeColors.blue),
      );
    });
    text(ctx, api, 'Reviewed seed · blue direction', 660, 350, 27, themeColors.blue, 'center');
    if (currentBeat === 0) {
      for (const v of [
        [0.94, 0.06],
        [0.97, 0.025],
      ]) {
        const at = plot.point(...v);
        api.circle(ctx, at.x, at.y, 8, themeColors.blue);
      }
      card(ctx, api, 'Existing pagination neighborhood', 1230, 430, 530, themeColors.blue, 85, 27);
      text(
        ctx,
        api,
        'A candidate needs a task-coverage review',
        960,
        1000,
        30,
        themeColors.muted,
        'center',
      );
    }
    for (const [value, progress, color, name] of [
      [current.near, current.nearProgress, themeColors.pink, 'C3 near-copy candidate'],
      [current.novel, current.novelProgress, themeColors.green, 'C1 new task family'],
    ])
      if (value) {
        const target = plot.point(...value),
          start = {
            x: 1480,
            y: 565,
          },
          at = {
            x: api.lerp(start.x, target.x, progress),
            y: api.lerp(start.y, target.y, progress),
          };
        api.focus.target('candidate-point', () => api.circle(ctx, at.x, at.y, 12, color));
        if (progress >= 1) {
          api.path(ctx, [origin, target], {
            color,
            width: 3,
          });
          if (name === 'C1 new task family')
            text(ctx, api, name, target.x + 28, target.y - 18, 27, color);
        }
      }
    if (currentBeat > 0) {
      card(
        ctx,
        api,
        current.review ? 'C3 near copy → task review' : 'Place the new candidate',
        1230,
        405,
        540,
        current.review ? themeColors.pink : themeColors.muted,
        78,
        28,
      );
      if (current.novel)
        card(ctx, api, 'C1 different family → eligible', 1230, 515, 540, themeColors.green, 78, 26);
      if (currentBeat === 2) {
        const arc = (angle, progress, color, radius) => {
          const points = Array.from(
            {
              length: 41,
            },
            (_, i) =>
              plot.point(
                radius * Math.cos((angle * progress * i) / 40),
                radius * Math.sin((angle * progress * i) / 40),
              ),
          );
          api.path(ctx, points, {
            color,
            width: 4,
          });
        };
        arc(current.nearAngle, current.angleProgress, themeColors.pink, 0.65);
        arc(current.novelAngle, current.angleProgress, themeColors.green, 0.4);
        if (current.nearComparison > 0 || api.focus.progress('diversity-b3-1', 0) > 0) {
          api.focus.target('cosine-near', () =>
            equation(
              ctx,
              api,
              '\\cos(\\theta_{\\mathrm{near}})=' + cosineSimilarity(seed, near).toFixed(4),
              1500,
              700,
              35,
              themeColors.pink,
            ),
          );
        }
        if (current.novelComparison > 0) {
          api.focus.target('cosine-new', () =>
            equation(
              ctx,
              api,
              '\\cos(\\theta_{\\mathrm{new}})=' + cosineSimilarity(seed, novel).toFixed(3),
              1500,
              805,
              35,
              themeColors.green,
            ),
          );
        }
        text(
          ctx,
          api,
          'Angle from the same seed direction',
          1500,
          900,
          26,
          themeColors.muted,
          'center',
        );
      } else
        text(
          ctx,
          api,
          'Review threshold: cosine ≥ 0.95',
          1500,
          735,
          29,
          themeColors.yellow,
          'center',
        );
    }
  }
}
export default {
  id: 'diversity',
  draw: drawDiversity,
  cues: ['diversity-b1-1', 'diversity-b2-1', 'diversity-b3-1', 'diversity-b3-2'],
};
