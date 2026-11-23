import { dotProduct } from 'vizmatic';
import { A, contrast, dispatchWeights, labels } from '../fixtures.mjs';
import { event } from '../construction.mjs';
import { decisionFrame } from '../model.mjs';
import { scoreRail, target, text } from '../defaults.mjs';

function drawFourFlagPairs(ctx, state, api) {
  const { C } = api;
  const invoice = event(state, 2, 'invoice-ticket', 0.18, 0.33);
  const compared = event(state, 2, 'invoice-contrast', 0.42, 0.68);
  const weights = event(state, 3, 'weight-flags', 0.06, 0.31);
  const encoded = event(state, 3, 'encode-pairs', 0.33, 0.47);
  const dispatched = event(state, 3, 'dispatch-four', 0.56, 0.70) === 1;
  const newRule = weights === 1;
  const colors = [C.blue, C.pink, C.green, C.yellow];
  const names = [...labels, 'invoice'];
  const destinations = ['Billing', 'Performance', 'Release repair', 'Both teams'];
  const rows = [...A, [0, 0]];
  const scale = (score) => 854 + 196 * score;
  const showBits = state.beat === 4;
  target(ctx, api, 'flag-weights', () => {
    text(ctx, api, newRule ? 'One point for slow, two for rollback' : 'Contrast = (rollback − slow) / √2',
      960, 279, 40, C.yellow, 'center');
  });
  text(ctx, api, 'Incoming ticket', 150, 380, 33, C.muted);
  text(ctx, api, 'Slow / rollback', 524, 380, 32, C.muted, 'center');
  if (showBits) {
    text(ctx, api, 'Rollback (2)', 936, 380, 32, C.muted, 'center');
    text(ctx, api, 'Slow (1)', 1130, 380, 32, C.muted, 'center');
    text(ctx, api, 'Code', 1380, 380, 32, C.muted, 'center');
  } else {
    text(ctx, api, newRule ? 'Points saved' : 'Contrast score', 1110, 380, 32, C.muted, 'center');
    [-1, 0, 1, 2, 3].forEach((v) => text(ctx, api, String(v), scale(v), 449, 27, C.muted, 'center'));
  }
  text(ctx, api, 'Destination', 1650, 380, 32, C.muted, 'center');
  rows.forEach((row, i) => {
    if (i === 3 && invoice === 0) return;
    const y = 505 + i * 123;
    const color = colors[i];
    const score = dotProduct(row, contrast);
    const code = dotProduct(row, dispatchWeights);
    target(ctx, api, i === 3 ? 'invoice-ticket' : 'original-ticket', () => {
      text(ctx, api, names[i], 150, y + 10, 36, color);
      text(ctx, api, '[' + row.join(', ') + ']', 524, y + 12, 34, color, 'center');
    });
    if (showBits) {
      // Read the weighted sum in base two, with the most significant bit first.
      const bits = code.toString(2).padStart(2, '0');
      target(ctx, api, i === 2 ? 'both-bits' : 'single-code', () => {
        target(ctx, api, 'code-bits', () => {
          for (const [index, x] of [936, 1130].entries()) {
            const on = bits[index] === '1';
            const ink = index === 0 ? C.pink : C.blue;
            api.rect(ctx, x - 40, y - 39, 80, 75, on ? ink : C.panel, on ? ink : C.muted, 8);
            text(ctx, api, bits[index], x, y + 17, 48, on ? C.panel : C.muted, 'center');
          }
        });
        text(ctx, api, String(code), 1380, y + 14, 40, color, 'center');
        text(ctx, api, destinations[code], 1650, y + 12, 31, color, 'center');
      });
      return;
    }
    target(ctx, api, 'four-codes', () => target(ctx, api, i >= 2 ? 'zero-pair' : 'single-score', () => {
      api.line(ctx, scale(-1), y, scale(3), y, C.muted, 2);
      api.line(ctx, scale(0), y - 14, scale(0), y + 14, C.ink, 2);
      if (i === 3 && compared < 1) {
        text(ctx, api, '?', scale(0), y - 20, 31, color, 'center');
        return;
      }
      const p = Math.max(0, Math.min(1, encoded * 4 - i));
      const value = newRule ? row[0] + (code - row[0]) * p : score;
      if (newRule && row[1] && p > 0) {
        api.line(ctx, scale(row[0]), y, scale(value), y, color, 7);
      }
      api.circle(ctx, scale(value), y, 11, color);
      const routed = newRule ? dispatched : i < 2;
      text(ctx, api, routed ? destinations[code] : '?', 1650, y + 12, 31, routed ? color : C.muted, 'center');
    }));
  });
  const footer = showBits && event(state, 4, 'both-bits') === 1 ? 'Both flags set     2 + 1 = 3'
    : dispatched ? '4 distinct codes fit in 2 bits.'
    : newRule ? 'Start at the slow flag. Add two points wherever rollback is set.'
    : 'Which tickets need a different destination?';
  text(ctx, api, footer, 960, 997, 34, C.ink, 'center');
}

export function drawDecision(ctx, scene, state, api) {
  if (state.beat >= 2) return drawFourFlagPairs(ctx, state, api);
  const { C } = api;
  const c = decisionFrame(state);
  const colors = [C.blue, C.pink, C.green];
  const dial = { x: 720, y: 278 };
  const filed = event(state, 0, 'file-notes', 0.76, 0.83);
  const stops = ['route-tickets', 'route-release', 'route-both'];
  const delivered = stops.map((id) =>
    state.cues?.[id] ? event(state, 1, id) === 1 : c.route === 1,
  );
  target(ctx, api, 'restore-contrast', () => {
    api.circle(ctx, dial.x, dial.y, 50, C.panel, C.muted, 2);
    api.arrow(
      ctx,
      dial.x,
      dial.y,
      dial.x + 40 * c.direction[0],
      dial.y - 40 * c.direction[1],
      C.yellow,
      5,
    );
    text(
      ctx,
      api,
      c.restored === 0 ? 'Common' : c.restored === 1 ? 'Contrast' : 'Turning',
      810,
      292,
      36,
      C.yellow,
    );
  });
  text(
    ctx,
    api,
    filed === 1 && !delivered.some(Boolean) ? 'Source notes filed' : 'Incoming ticket',
    165,
    390,
    32,
    C.muted,
  );
  text(ctx, api, 'One stored score', 960, 390, 32, C.muted, 'center');
  text(ctx, api, 'Dispatch', 1585, 390, 32, C.muted, 'center');
  labels.forEach((name, i) => {
    const y = 502 + i * 154;
    const color = filed < 1 || delivered[i] ? colors[i] : C.ink;
    target(ctx, api, 'source-notes', () => {
      if (filed === 0 || delivered[i]) {
        text(ctx, api, name, 165, y + 6, 38, colors[i]);
        text(ctx, api, '[' + A[i].join(', ') + ']', 165, y + 50, 27, C.muted);
      } else {
        api.rect(ctx, 165, y - 40 * (1 - filed), 305, 8 + 76 * (1 - filed), C.panel, C.muted, 4);
      }
    });
    target(ctx, api, 'restore-contrast', () => {
      scoreRail(ctx, api, 565, y, 655, 1.5, c.scores[i], color);
      text(ctx, api, c.scores[i].toFixed(3), 1350, y + 13, 35, color, 'right');
    });
    target(ctx, api, stops[i], () => {
      api.rect(ctx, 1430, y - 45, 310, 91, C.panel, C.muted, 10);
      if (delivered[i] && c.routes[i]) {
        text(ctx, api, c.routes[i], 1585, y + 13, 35, colors[i], 'center');
      }
    });
  });
  text(
    ctx,
    api,
    delivered[2]
      ? 'Rule for tickets with at least one of these two binary flags'
      : 'Every ticket has at least one flag. Who gets the ticket at zero?',
    960,
    967,
    35,
    C.ink,
    'center',
  );
}

export default {
  id: 'decision',
  draw: drawDecision,
  cues: [
    'restore-contrast', 'file-notes', 'route-tickets', 'route-release', 'route-both',
    'invoice-ticket', 'invoice-contrast', 'weight-flags', 'encode-pairs', 'dispatch-four',
    'code-bits', 'both-bits',
  ],
};
