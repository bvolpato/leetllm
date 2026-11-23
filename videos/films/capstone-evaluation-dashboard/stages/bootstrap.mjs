import { baseline, drawIds, keys, rowNames } from '../fixtures.mjs';
import {
  dashboardBootstrapState,
  dashboardCue,
  dashboardStarted,
  resamples,
  histogram,
  percentileBand,
  sum,
} from '../arithmetic.mjs';
import {
  dashboardCell as cell,
  dashboardText as text,
  dashboardLine as line,
} from '../defaults.mjs';

const drawCues = ['draw-policy', 'draw-rewording', 'draw-again', 'draw-unsupported'];
const centers = [560, 900, 1240, 1580];
const rates = ['0%', '25%', '50%', '75%', '100%'];

function showDraw(ctx, api, state) {
  const { C } = api;
  text(ctx, api, 'One resample', 130, 590, 36, C.ink);
  let landed = 0;
  drawIds.forEach((source, slot) => {
    const p = state.beat > 0 ? 1 : dashboardCue(state, drawCues[slot], state.beatP * 4 - slot);
    const x = centers[slot];
    line(ctx, api, x - 113, 644, x + 113, 644, C.muted, 2);
    if (p >= 1) {
      landed++;
      cell(
        ctx,
        api,
        keys[source] + '   ' + (baseline[source] ? 'pass' : 'fail'),
        x - 123,
        533,
        246,
        88,
        baseline[source] ? C.green : C.pink,
        34,
      );
    } else if (p > 0) {
      const dx = centers[source] + (x - centers[source]) * p;
      api.circle(ctx, dx, 418 + 96 * p, 14, baseline[source] ? C.green : C.pink);
    }
  });
  if (landed === 4) {
    const answered = state.beat > 0;
    const passed = sum(drawIds.map((i) => baseline[i]));
    text(
      ctx,
      api,
      answered
        ? passed + ' passes / ' + landed + ' draws = ' + (100 * passed) / landed + '%'
        : 'What fraction of these four draws passed?',
      960,
      806,
      47,
      answered ? C.yellow : C.ink,
      'center',
    );
  }
}

function distribution(ctx, api, model, count, showBand) {
  const { C } = api;
  const bins = histogram(resamples(model.observed).slice(0, count));
  text(ctx, api, 'Ordered resamples', 130, 490, 32, C.muted);
  text(ctx, api, count + ' / 256', 130, 550, 40, C.ink);
  const xs = [575, 830, 1085, 1340, 1595];
  line(ctx, api, 450, 825, 1720, 825, C.muted, 2);
  bins.forEach((n, i) => {
    const h = (295 * n) / 256;
    if (n > 0) api.rect(ctx, xs[i] - 72, 825 - h, 144, h, C.blue, undefined, 0);
    text(ctx, api, n, xs[i], 805 - h, 32, C.ink, 'center');
    text(ctx, api, rates[i], xs[i], 880, 32, C.ink, 'center');
  });
  text(ctx, api, 'Pass rate', 130, 880, 32, C.muted);
  if (showBand) {
    const [low, high] = percentileBand(resamples(model.observed));
    text(
      ctx,
      api,
      'Middle 95% of resampled rates     ' + 100 * low + '% to ' + 100 * high + '%',
      960,
      977,
      38,
      C.yellow,
      'center',
    );
  }
}

export function drawBootstrap(ctx, scene, state, api) {
  const { C } = api;
  const b = state.beat ?? 0;
  const model = b < 2 ? { perfect: false, observed: baseline } : dashboardBootstrapState(state);
  const hist = b > 1 || (b === 1 && dashboardStarted(state, 'enumerate-draws', state.beatP > 0.3));
  api.focus.target('resampling', () => {
    text(
      ctx,
      api,
      model.perfect ? 'hybrid-v2' : 'extractive-v1',
      130,
      295,
      32,
      C.blue,
      'left',
      'mono',
    );
    text(ctx, api, 'Observed rows', 130, 355, 35, C.ink);
    model.observed.forEach((passed, i) => {
      cell(
        ctx,
        api,
        keys[i] + '   ' + rowNames[i] + '\n' + (passed ? 'pass' : 'fail'),
        centers[i] - 145,
        265,
        290,
        126,
        passed ? C.green : C.pink,
        32,
      );
    });
    if (hist) {
      const fraction = b > 1 ? 1 : dashboardCue(state, 'enumerate-draws', state.beatP);
      distribution(
        ctx,
        api,
        model,
        Math.round(256 * fraction),
        b > 1 || dashboardStarted(state, 'read-band', state.beatP > 0.7),
      );
    } else showDraw(ctx, api, state);
  });
}
export default {
  id: 'bootstrap',
  draw: drawBootstrap,
  cues: [...drawCues, 'enumerate-draws', 'read-band', 'bootstrap-perfect-case'],
};
