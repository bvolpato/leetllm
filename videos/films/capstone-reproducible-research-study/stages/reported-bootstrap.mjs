import { RS_FIRST_INDICES } from '../fixtures.mjs';
import { researchEvent } from '../construction.mjs';
import { quantile } from '../arithmetic.mjs';
import { reportedMeans, signed } from '../evidence.mjs';
import { deltas, researchConstructionModel } from '../model.mjs';
import {
  drawResearchConstructionBox,
  drawResearchConstructionFooter,
  drawResearchConstructionHeader,
  drawResearchConstructionMid,
  drawResearchConstructionRect,
  drawResearchConstructionSmallGrid,
  formatResearchSigned,
} from '../defaults.mjs';
const sorted = [...reportedMeans].sort((a, b) => a - b);
const neighbors = [4, 12];
const fraction = 0.25;
const interpolated = quantile(neighbors, fraction);

export function drawReportedBootstrap(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = researchConstructionModel('reported-bootstrap', state),
    currentBeat = modelState.b;
  const E = (beat, sentence) => researchEvent('reported-bootstrap', state, beat, sentence),
    resultComplete = (beat, sentence) => E(beat, sentence) === 1;
  api.focus.target('rs-reported-bootstrap-mechanism', () => {
    if (currentBeat === 2 || (currentBeat === 3 && !resultComplete(3, 1))) {
      const from = 380,
        to = 1540,
        y = 566;
      drawResearchConstructionHeader(ctx, api, 'Practice with two different neighboring means');
      api.line(ctx, from, y, to, y, themeColors.muted, 5);
      for (let i = 0; i <= 4; i++) {
        const x = from + ((to - from) * i) / 4;
        api.line(ctx, x, y - 22, x, y + 22, themeColors.muted, 4);
      }
      for (const [i, x] of [from, to].entries())
        drawResearchConstructionMid(
          ctx,
          api,
          signed(neighbors[i]) + ' points',
          x,
          y + 102,
          43,
          themeColors.ink,
        );
      if (E(2, 1) > 0) {
        const x = from + fraction * (to - from);
        api.line(ctx, from, y - 84, x, y - 84, themeColors.cyan, 5);
        drawResearchConstructionMid(
          ctx,
          api,
          '¼ of the gap',
          (from + x) / 2,
          y - 120,
          34,
          themeColors.cyan,
        );
        api.circle(ctx, x, y, 15, themeColors.yellow);
      }
      const answer = resultComplete(3, 0);
      drawResearchConstructionMid(
        ctx,
        api,
        answer
          ? `4 + ¼ × (12 − 4) = ${interpolated} points`
          : 'What value falls a quarter of the way across?',
        960,
        860,
        46,
        answer ? themeColors.yellow : themeColors.ink,
      );
      return;
    }
    drawResearchConstructionHeader(
      ctx,
      api,
      currentBeat === 0 && modelState.count === 0
        ? 'First draw from all 24 seed pairs'
        : 'Distribution of resampled means',
    );
    if (currentBeat === 0 && modelState.count === 0) {
      const n = Math.min(24, Math.floor(24 * E(0, 0)));
      for (let j = 0; j < 24; j++) {
        const x = 200 + (j % 8) * 200,
          y = 365 + Math.floor(j / 8) * 145;
        drawResearchConstructionBox(
          ctx,
          api,
          j < n
            ? `Seed ${RS_FIRST_INDICES[j]}\n${formatResearchSigned(ctx, api, deltas[RS_FIRST_INDICES[j]])}`
            : 'waiting',
          x,
          y,
          175,
          100,
          j < n ? themeColors.cyan : themeColors.muted,
          27,
        );
      }
      if (resultComplete(0, 1))
        drawResearchConstructionMid(
          ctx,
          api,
          'Mean of this draw   ' + formatResearchSigned(ctx, api, modelState.firstMean, 3),
          960,
          865,
          35,
          themeColors.yellow,
        );
    } else {
      const low = -0.1,
        step = 0.02,
        bins = Array(25).fill(0);
      for (const v of modelState.means) {
        const j = Math.floor((v - low) / step);
        if (j >= 0 && j < bins.length) bins[j]++;
      }
      const max = Math.max(...bins, 1),
        x0 = 240,
        y0 = 680,
        w = 60;
      bins.forEach((count, i) => {
        const h = (count / max) * 260;
        if (h > 0)
          drawResearchConstructionRect(
            ctx,
            api,
            x0 + i * w,
            y0 - h,
            48,
            h,
            themeColors.cyan,
            undefined,
          );
        if (i % 5 === 0)
          drawResearchConstructionMid(
            ctx,
            api,
            (low + i * step).toFixed(2),
            x0 + i * w + 24,
            y0 + 48,
            25,
            themeColors.muted,
          );
      });
      drawResearchConstructionMid(
        ctx,
        api,
        'Completed resamples   ' + modelState.count.toLocaleString('en-US'),
        960,
        355,
        32,
        themeColors.cyan,
      );
      drawResearchConstructionMid(
        ctx,
        api,
        'Mean difference in success rate',
        960,
        770,
        29,
        themeColors.muted,
      );
      if (currentBeat === 0) {
        drawResearchConstructionMid(
          ctx,
          api,
          `Tallest bin: ${max} resamples`,
          960,
          886,
          32,
          themeColors.ink,
        );
        return;
      }
      const rows = [['q', 'q × 9999', 'left value', 'right value', 'fraction', 'quantile']];
      for (const q of [0.05, 0.95]) {
        const pos = q * 9999,
          left = Math.floor(pos),
          right = Math.ceil(pos);
        rows.push([
          q.toFixed(2),
          resultComplete(1, 1) ? pos.toFixed(2) : 'pending',
          resultComplete(1, 1) ? sorted[left].toFixed(6) : 'pending',
          resultComplete(1, 1) ? sorted[right].toFixed(6) : 'pending',
          resultComplete(1, 1) ? (pos - left).toFixed(2) : 'pending',
          modelState.endpointsVisible
            ? (q === 0.05 ? 'lo ' : 'hi ') +
              (q === 0.05 ? modelState.low : modelState.high).toFixed(6)
            : 'pending',
        ]);
      }
      drawResearchConstructionSmallGrid(ctx, api, rows, 220, 800, 1480, 150, [
        themeColors.muted,
        themeColors.cyan,
        themeColors.cyan,
      ]);
    }
    if (currentBeat === 0)
      drawResearchConstructionFooter(
        ctx,
        api,
        'Study sample: 24 pairs    /    NumPy bootstrap seed: 20260731',
      );
    else
      drawResearchConstructionFooter(
        ctx,
        api,
        currentBeat >= 2
          ? 'A fresh draw from observed pairs can only repeat outcomes in the table.'
          : 'The two neighboring sorted values determine the linear interpolation',
      );
  });
}
export default {
  id: 'reported-bootstrap',
  draw: drawReportedBootstrap,
  cues: [
    'rsx-reported-bootstrap-b0-s0',
    'rsx-reported-bootstrap-b0-s1',
    'rsx-reported-bootstrap-b0-s2',
    'rsx-reported-bootstrap-b1-s0',
    'rsx-reported-bootstrap-b1-s1',
    'rsx-reported-bootstrap-b1-s2',
    'rsx-reported-bootstrap-b2-s0',
    'rsx-reported-bootstrap-b2-s1',
    'rsx-reported-bootstrap-b3-s0',
    'rsx-reported-bootstrap-b3-s1',
    'rsx-reported-bootstrap-b3-s2',
    'rsx-reported-bootstrap-b3-s3',
  ],
};
