import { gradientCue } from './construction.mjs';

export const number = (value, digits = 5) => String(Number(value.toFixed(digits))).replace('-', '−');

export function cueProgress(state, api, id, beat, from, to) {
  if (state.beat < beat) return 0;
  if (state.beat > beat) return 1;
  return gradientCue(state.cues, id, api.phase(state.beatP ?? 0, from, to));
}

// Each strip spans one hundred tokens. Its width is the predicted time for that block.
export function drawRequest(ctx, api, weight, { showPrediction = true, traceSeconds, elapsed = 0 } = {}) {
  const { C, text, math, rect, line, focus } = api;
  const x = seconds => 230 + 200 * seconds;
  const prediction = 2 * weight;
  const tracing = traceSeconds !== undefined;
  const tip = Math.min(traceSeconds ?? prediction, prediction);
  const landed = tip === prediction;
  focus.target('request-input', () =>
    text(ctx, '200-token request', x(0), 270, 44, C.ink));
  focus.target('intro-dial', () => focus.target('adjustable-weight', () => {
    text(ctx, 'Weight (seconds per block)', x(7) - 125, 280, 38, C.ink, 'right');
    text(ctx, number(weight, 3), x(7), 280, 46, C.yellow, 'right');
  }));
  focus.target('latency-target', () => {
    rect(ctx, x(0), 309, x(5) - x(0), 78, C.green + '38', C.green, 9);
    text(ctx, 'Actual finish', x(0) + 27, 360, 37, C.ink);
    text(ctx, '5 s', x(5) - 24, 364, 46, C.green, 'right');
    line(ctx, x(5), 387, x(5), tracing ? 517 : 420, C.green, 5);
    line(ctx, x(5), 517, x(5), 548, C.green, 5);
  });
  for (let i = 0; i < 2; i++) {
    const left = x(i * weight), right = x(Math.min((i + 1) * weight, tip));
    if (right - left <= 6) continue;
    focus.target('prompt-strip', () => focus.target(i === 0 ? 'first-prompt-block' : 'second-prompt-block', () => {
      rect(ctx, left + 3, 422, right - left - 6, 92, C.cyan + (tracing ? '64' : '36'), C.cyan, 9);
      if (i === 1 && tracing && right > x(5)) {
        const overrun = right - x(5);
        rect(ctx, x(5), 422, overrun, 92, C.pink + '66', null, 0);
        if (landed) text(ctx, number(prediction - 5) + ' s late', x(5) + overrun / 2, 480, 37, C.ink, 'center');
      }
      const showElapsed = i === 1 && elapsed > 0;
      if (right - left > 185) {
        const center = (left + right) / 2;
        text(ctx, '100 tokens', tracing ? left + 30 : center, showElapsed ? 461 : 481, 33, C.ink,
          tracing ? 'left' : 'center');
      }
      if (showElapsed) {
        const from = left + 101, to = right - 180;
        text(ctx, number(weight) + ' s', from - 17, 507, 29, C.cyan, 'right');
        api.arrow(ctx, from, 500, api.lerp(from, to, elapsed), 500, C.cyan, 4);
        if (elapsed >= 1) text(ctx, number(prediction) + ' s total', to + 16, 507, 29, C.cyan);
      }
    }));
  }
  line(ctx, x(0), 551, x(7), 551, C.muted, 3);
  for (let i = 0; i <= 7; i++) {
    line(ctx, x(i), 551, x(i), 567, C.muted, 2);
    text(ctx, i, x(i), 609, 28, C.muted, 'center');
  }
  text(ctx, 'seconds', x(7) + 44, 609, 28, C.muted);
  focus.target('wrong-prediction', () => focus.target('latency-prediction', () => {
    if (tracing) {
      text(ctx, 'Model', x(0) - 22, 480, 34, C.cyan, 'right');
      line(ctx, x(tip), 421, x(tip), 515, tip > 5 ? C.pink : C.cyan, 7);
    }
    if (!landed) return;
    line(ctx, x(prediction), 517, x(prediction), 548, C.cyan, 6);
    const estimate = showPrediction ? number(prediction, 3) : '?';
    math(ctx, String.raw`\text{predicted}\quad\hat y=${estimate}\,\text{s}`, x(prediction), 684, 38, C.cyan, 'center');
  }));
  focus.target('prediction-gap', () => {
    if (!landed) return;
    const observed = x(5), predicted = x(prediction);
    line(ctx, observed, 635, predicted, 635, C.pink, 4);
    line(ctx, observed, 626, observed, 644, C.pink, 3);
    line(ctx, predicted, 626, predicted, 644, C.pink, 3);
  });
  return { prediction, gap: prediction - 5 };
}

// Both trials use the same time scale. The open circle records the original prediction.
export function drawTrial(ctx, api, { y, label, target, start, current, color, showLoss = false }) {
  const { C, text, line, circle } = api;
  const x = seconds => 1050 + (seconds - target) * 585;
  text(ctx, label, 160, y + 9, 33, C.ink);
  line(ctx, x(target - 0.75), y, x(target + 1), y, C.muted + '66', 3);
  for (const offset of [-0.5, 0, 0.5, 1]) {
    line(ctx, x(target + offset), y - 7, x(target + offset), y + 7, C.muted, 2);
  }
  line(ctx, x(target), y - 32, x(target), y + 24, C.green, 4);
  text(ctx, 'start ' + number(start) + ' s', x(start), y - 48, 26, C.muted, 'center');
  text(ctx, 'target ' + target + ' s', x(target), y - 48, 26, C.green, 'center');
  line(ctx, x(target), y + 16, x(current), y + 16, color, 5);
  circle(ctx, x(start), y, 13, C.bg, C.muted, 3);
  circle(ctx, x(current), y, 8, color);
  text(ctx, number(current) + ' s', x(current), y + 61, 30, color, 'center');
  if (showLoss) {
    text(ctx, 'loss ' + number((current - target) ** 2, 8), 160, y + 57, 29, color);
  }
}
