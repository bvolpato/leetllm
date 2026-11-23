import { equation, text } from '../defaults.mjs';
import { motion } from '../timing.mjs';

export function drawDepthDiagnosis(ctx, scene, state, api) {
  const { C, teaching } = api;
  if (state.beat === 0) {
    const example = motion(state, 'example-steps', 0, 0.49, 0.56);
    if (!example) {
      text(ctx, api, 'Last feed-forward block at initialization', 960, 310, 49, C.ink, 'center');
      text(ctx, api, 'Upper bounds on the gradient norm of its second weight matrix', 960, 412, 37, C.muted, 'center');
      text(ctx, api, 'Post-LN', 540, 550, 45, C.blue, 'center');
      text(ctx, api, 'Pre-LN', 1380, 550, 45, C.cyan, 'center');
      equation(ctx, api, String.raw`O(d\sqrt{\ln d})`, 540, 714, 76, C.blue, 'center');
      equation(ctx, api, String.raw`O(d\sqrt{\ln d / L})`, 1380, 714, 76, C.cyan, 'center');
      text(ctx, api, 'd = width      L = depth      ·      Xiong et al., simplified initialization', 960, 943, 36, C.ink, 'center');
      return;
    }
    const p = motion(state, 'smaller-step', 0, 0.62, 0.75);
    const rate = Number((0.01 + p * (0.001 - 0.01)).toFixed(4));
    api.focus.target('step-intro', () => text(ctx, api, 'Illustrative SGD update at initialization', 140, 295, 43, C.ink));
    text(ctx, api, `Learning rate   ${rate.toFixed(4)}`, 140, 400, 44, C.yellow);
    text(ctx, api, 'Gradient norm', 520, 505, 32, C.muted, 'center');
    text(ctx, api, 'Update norm = rate × gradient norm', 1120, 505, 34, C.ink, 'center');
    api.focus.target('step-lengths', () => {
      for (const [i, gradient] of [1, 8].entries()) {
        const y = 590 + 170 * i;
        text(ctx, api, i ? 'Top layer' : 'Lower layer', 140, y + 38, 36, C.ink);
        text(ctx, api, gradient, 520, y + 38, 45, C.cyan, 'center');
        api.rect(ctx, 730, y, 10500 * gradient * 0.01, 46, C.panel, C.muted, 2);
        api.rect(ctx, 730, y, 10500 * gradient * rate, 46, C.yellow, undefined, 2);
        text(ctx, api, (gradient * rate).toFixed(4), 1760, y + 38, 40, C.yellow, 'right');
      }
    });
    text(ctx, api, 'Measure early updates across layers in the actual optimizer.', 960, 975, 39, C.ink, 'center');
    return;
  }
  if (state.beat === 1) {
    const plot = teaching.axes({
      x: 260, y: 390, width: 1100, height: 470,
      xDomain: [0, 8], yDomain: [0, 10], xTicks: [0, 4, 8], yTicks: [0, 3, 6, 9],
      xLabel: 'number of writes', yLabel: 'scale', fontSize: 30,
    });
    for (const [i, scale] of [(k) => 1 + k, (k) => Math.sqrt(1 + k)].entries()) {
      const n = 8 * (i ? motion(state, 'add-variance', 1, 0.38, 0.58) : motion(state, 'eight-writes', 1, 0.10, 0.25));
      const steps = Array.from({ length: Math.floor(n) + 1 }, (_, k) => k);
      if (n % 1 > 0) steps.push(n);
      const color = i ? C.cyan : C.pink;
      api.focus.target(i ? 'variance-growth' : 'aligned-growth', () => {
        if (steps.length > 1) teaching.curve({ plot, points: steps.map(x => ({ x, y: scale(x) })), color, width: 6 });
        teaching.scatter({ plot, points: [{ x: n, y: scale(n) }], color, radius: 9 });
      });
    }
    text(ctx, api, 'Aligned unit writes', 1620, 435, 32, C.pink, 'center');
    text(ctx, api, 'Norm = 1 + n', 1620, 505, 38, C.pink, 'center');
    text(ctx, api, 'Uncorrelated writes', 1620, 655, 32, C.cyan, 'center');
    text(ctx, api, 'SD = √(1 + n)', 1620, 725, 38, C.cyan, 'center');
    text(ctx, api, 'Second model assumes initial variance 1 and variance 1 per write.', 960, 1000, 34, C.muted, 'center');
    return;
  }
  text(ctx, api, 'Same checkpoint and held-out examples', 960, 302, 44, C.ink, 'center');
  const bypass = motion(state, 'bypass-block', 2, 0.26, 0.44);
  for (let i = 0; i < 2; i++) {
    const y = 470 + i * 215;
    text(ctx, api, i ? 'Trial' : 'Baseline', 140, y + 20, 40, C.ink);
    api.line(ctx, 370, y, 670, y, C.blue, 5);
    if (i === 0 || !bypass) {
      api.components.card({ x: 680, y: y - 48, width: 330, height: 96, label: 'Late block', fill: C.panel, stroke: C.cyan, textColor: C.cyan, fontSize: 35 });
    } else {
      api.focus.target('bypassed-block', () => {
        api.line(ctx, 680, y, 1010, y, C.yellow, 5);
        text(ctx, api, 'bypass', 845, y - 32, 32, C.yellow, 'center');
      });
    }
    api.arrow(ctx, 1020, y, 1310, y, C.blue, 5);
    text(ctx, api, 'Task score   ?', 1530, y + 20, 42, C.ink, 'center');
  }
  text(ctx, api, 'Compare the two scores on the same task.', 960, 948, 45, C.ink, 'center');
}
export default { id: 'depth-diagnosis', draw: drawDepthDiagnosis, cues: ['example-steps', 'smaller-step', 'eight-writes', 'add-variance', 'bypass-block'] };
