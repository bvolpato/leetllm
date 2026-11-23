import { calibrationConstruction } from '../model.mjs';
import { cueProgress, motion } from '../construction.mjs';
import { badge, label, line } from '../defaults.mjs';

export function drawShortcutsAndCalibration(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const { forecasts, votes, count, average } = calibrationConstruction(state);
  const voteCount =
    beat > 0
      ? votes.length
      : Math.ceil(votes.length * cueProgress(state, 'calibration-votes', motion(state, 0.2, 0.56)));
  const miss = beat === 1 && cueProgress(state, 'calibration-miss', motion(state, 0.1, 0.3)) > 0;
  const firstThree = beat > 1 || (beat === 1 && count > 0);
  const showMean = beat > 1 && average >= 1;
  const column = (i) => 651 + i * 257;
  label(api, ctx, 'Fixed reply order', 150, 267, 32, C.muted);
  label(api, ctx, 'A waits for approval.   B grants access now.', 150, 334, 41, C.ink);
  api.focus.target('fixed-votes', () => {
    votes.forEach((vote, i) => {
      const x = column(i);
      badge(api, ctx, 'Vote ' + (i + 1), x, 415, C.muted, 31);
      api.circle(ctx, x, 488, 42, i < voteCount ? C.blue : C.panel, C.blue, 3);
      badge(
        api,
        ctx,
        i < voteCount ? (vote ? 'A' : 'B') : '?',
        x,
        504,
        i < voteCount ? C.bg : C.muted,
        43,
      );
    });
  });
  badge(api, ctx, beat === 0 ? 'Picks right' : 'Mean squared error', 1666, 417, C.ink, 29);
  line(api, ctx, 150, 556, 1780, 556, C.muted, 2);
  api.focus.target('calibration-errors', () => {
    forecasts.forEach((forecast, k) => {
      const y = 650 + 154 * k;
      label(api, ctx, 'P(A) = ' + forecast.q.toFixed(2), 150, y, 41, C.ink);
      votes.forEach((vote, i) => {
        const x = column(i);
        if (beat === 0) {
          badge(api, ctx, i < voteCount ? 'Pick A' : '·', x, y, C.ink, 33);
          return;
        }
        const show = beat > 1 || (i === 3 ? miss : firstThree && i < count);
        const error = forecast.errors[i];
        badge(
          api,
          ctx,
          show ? error.toFixed(4) : '·',
          x,
          y,
          i === 3 && show ? C.yellow : C.ink,
          34,
        );
        if (show)
          api.rect(
            ctx,
            x - 91,
            y + 23,
            Math.max(1, error * 182),
            14,
            i === 3 ? C.yellow : C.cyan,
            undefined,
            2,
          );
      });
      const correct = votes.filter((v) => Number(forecast.q > 0.5) === v).length;
      badge(
        api,
        ctx,
        beat === 0 && voteCount === 4
          ? correct + ' / 4'
          : showMean
            ? forecast.brier.toFixed(4)
            : '·',
        1666,
        y,
        showMean ? C.cyan : C.ink,
        40,
      );
    });
  });
  api.focus.target('brier-mean', () => {
    let caption = 'Which forecast fits these four votes better?';
    if (beat === 1) caption = 'Vote for B gives target 0.   Squared error = (forecast − target)²';
    if (beat > 1) caption = 'Brier score = sum of the four squared errors / 4';
    badge(api, ctx, caption, 960, 968, C.yellow, 37);
  });
}
export default {
  id: 'shortcuts-and-calibration',
  draw: drawShortcutsAndCalibration,
  cues: ['calibration-votes', 'calibration-miss', 'calibration-build', 'calibration-average'],
};
