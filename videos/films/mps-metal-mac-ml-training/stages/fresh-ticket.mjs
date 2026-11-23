import { classNames } from '../fixtures.mjs';
import { cueComplete } from '../arithmetic.mjs';
import {
  extensionCode,
  target,
  text,
  withMpsExtensionFrame,
  withMpsRootFrame,
} from '../defaults.mjs';

function featureRow(ctx, api, C, values, y, color, changed) {
  const left = 195;
  for (let j = 0; j < 6; j++) {
    const x = left + j * 110;
    const value = values?.[j];
    const stroke = value === undefined ? C.muted : changed && j === 5 ? C.yellow : color;
    api.rect(ctx, x, y, 100, 82, C.panel, stroke, 4);
    if (value !== undefined) text(ctx, api, C, String(value), x + 50, y + 55, 41, stroke, 'center');
  }
}

export function paintFreshTicket(ctx, scene, state, api, C, c, t, s) {
  let code = s.assigned ? 'batch = source.to(parameter.device)' : 'batch.to(parameter.device)';
  if (s.step === 2) code = s.sourceEdited ? 'source[0, 5, 0] = -21' : 'source[0, 5, 0]';
  if (s.step === 3 || s.callingWithCorrection) code = 'scores = model(batch.mean(dim=1))';
  target(ctx, api, 'mps-fresh-placement', () => {
    if (!s.assigned) extensionCode(ctx, api, C, 'batch = source', 960, 226, 29, C.muted);
    extensionCode(ctx, api, C, code, 960, 293, 39, C.ink);
    text(ctx, api, C, 'CPU source', 195, 396, 38, C.blue);
    if (s.cpuKnown && !s.assigned) text(ctx, api, C, '← batch', 810, 396, 31, C.yellow, 'right');
    featureRow(ctx, api, C, s.source.positions, 425, C.blue, s.sourceEdited);
    text(ctx, api, C, s.copiedAgain ? 'MPS copy 2' : s.assigned ? 'MPS copy 1' : 'MPS copy', 195, 604, 38, C.cyan);
    if (s.assigned) text(ctx, api, C, '← batch', 810, 604, 31, C.yellow, 'right');
    const shownCopy = s.assigned ? s.placed.positions : s.source.positions.slice(0, s.unboundValues);
    featureRow(ctx, api, C, shownCopy, 637, C.cyan, s.copiedAgain);
    if (s.recopyProgress > 0 && !s.copiedAgain) {
      // Follow the full device-changing copy between the two allocation rows.
      const path = [[850, 466], [895, 466], [895, 678], [850, 678]];
      let remaining = s.recopyProgress * 302;
      for (let i = 1; i < path.length && remaining > 0; i++) {
        const [x1, y1] = path[i - 1];
        const [x2, y2] = path[i];
        const length = Math.abs(x2 - x1) + Math.abs(y2 - y1);
        const fraction = Math.min(1, remaining / length);
        api.line(ctx, x1, y1, x1 + fraction * (x2 - x1), y1 + fraction * (y2 - y1), C.yellow, 6);
        remaining -= length;
      }
    } else if (s.assigned) api.arrow(ctx, 860, 678, 934, 678, C.cyan, 5);
  });
  text(ctx, api, C, 'First ticket  /  one feature across six positions', 195, 800, 29, C.muted);

  const result = s.placed;
  const lastScores = s.step === 2 || (s.step === 4 && !s.scored);
  const hasMean =
    s.step === 4 && s.copiedAgain
      ? s.revisedMeanReady
      : s.meanReady && (s.step > 1 || cueComplete(state.cues, 'mps-fresh-mean', s.p > 0.56));
  target(ctx, api, 'mps-fresh-mean', () => {
    if (hasMean) {
      const sum = result.positions.reduce((a, b) => a + b, 0);
      text(ctx, api, C, 'MPS mean   ' + sum + ' / 6 = ' + result.mean, 195, 885, 43, C.cyan);
    } else text(ctx, api, C, 'MPS mean   ?', 195, 885, 43, C.muted);
  });
  target(ctx, api, 'mps-fresh-shapes', () => {
    const ready =
      s.shapesReady && (s.step > 1 || cueComplete(state.cues, 'mps-fresh-shapes', s.p > 0.37));
    extensionCode(
      ctx,
      api,
      C,
      ready ? '3 × 6 × 8   →   3 × 8   →   3 × 3' : 'input   3 × 6 × 8',
      520,
      977,
      30,
      C.muted,
    );
  });

  const zero = 1480;
  text(
    ctx,
    api,
    C,
    lastScores ? 'Last scores  /  copy 1' : s.assigned ? 'Scores  /  copy ' + (s.copiedAgain ? 2 : 1) : 'Class scores',
    1405,
    396,
    39,
    C.ink,
    'center',
  );
  target(ctx, api, 'mps-fresh-weights', () => {
    classNames.forEach((name, k) => {
      text(ctx, api, C, name, 970, 510 + k * 133, 35, C.ink);
      if (s.weightsReady)
        text(ctx, api, C, '× ' + s.weights[k], 1210, 510 + k * 133, 31, C.yellow, 'center');
    });
  });
  target(ctx, api, 'mps-fresh-logits', () => {
    api.line(ctx, zero, 437, zero, 804, C.muted, 2);
    for (let k = 0; k < classNames.length; k++) {
      const y = 497 + k * 133;
      api.line(ctx, zero - 175, y + 25, zero + 175, y + 25, C.muted, 2);
      if (!s.scored && !lastScores) continue;
      const value = lastScores ? s.logits[k] : result.logits[k];
      const width = 49 * value;
      const ink = lastScores ? C.muted : s.verdict && k === s.winningClass ? C.green : C.cyan;
      api.rect(
        ctx,
        Math.min(zero, zero + width),
        y - 13,
        Math.max(4, Math.abs(width)),
        26,
        ink,
        ink,
        2,
      );
      text(ctx, api, C, String(value), 1725, y + 12, 36, ink, 'center');
    }
    if (s.verdict)
      text(
        ctx,
        api,
        C,
        'Route  →  ' + classNames[s.winningClass],
        1390,
        885,
        50,
        C.green,
        'center',
      );
    else if (s.step === 2 && s.sourceEdited)
      text(ctx, api, C, 'Which class gets this ticket on the next call?', 1390, 885, 33, C.yellow, 'center');
  });
}

export function drawFreshTicketStage(ctx, scene, state, api) {
  withMpsRootFrame(ctx, scene, state, api, (ctx, scene, state, api, C, c, t, s) =>
    withMpsExtensionFrame(ctx, scene, state, api, C, c, s, paintFreshTicket),
  );
}
export default {
  id: 'fresh-ticket',
  draw: drawFreshTicketStage,
  cues: [
    'fresh-ticket-b1',
    'fresh-unbound-copy',
    'fresh-discard-copy',
    'fresh-ticket-b2',
    'mps-fresh-cpu',
    'mps-fresh-assign',
    'mps-fresh-shapes',
    'mps-fresh-mean',
    'mps-fresh-weights',
    'mps-fresh-logits',
    'mps-fresh-first-route',
    'fresh-ticket-b3',
    'mps-fresh-edit',
    'mps-fresh-keep',
    'mps-fresh-replace',
    'fresh-next-call',
    'mps-fresh-remean',
    'mps-fresh-rescore',
    'mps-fresh-route',
  ],
};
