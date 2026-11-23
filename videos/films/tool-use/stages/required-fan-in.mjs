import { filmClock } from '../clock.mjs';
import { requiredToolComparison } from '../model.mjs';

const expected = { 'call-1': 'reranker-v16', 'call-2': 'reranker-v17' };
const budget = 0.02;
const first = { call_id: 'call-1', release_id: expected['call-1'], ok: true,
  status: 'canary_failed', error_rate: 0.081, budget };
const second = { call_id: 'call-2', release_id: expected['call-2'], ok: true,
  status: 'canary_clean', error_rate: 0.009, budget };
const timeout = { call_id: 'call-1', ok: false, error: 'temporarily_unavailable' };
const perThousand = (rate) => Math.round(1000 * rate);

export function drawRequiredFanIn(ctx, scene, state, api) {
  const { C, focus } = api;
  const { started, after } = filmClock(scene, state);
  const beat = state.beat ?? 0;
  const repeated = started('join-duplicate');
  const rerun = beat >= 2;
  const a = rerun ? (after('join-sixteen') ? first : null) : (after('join-first-timeout') ? timeout : null);
  const b = repeated ? first : after('join-seventeen') ? second : null;
  const incoming = [a, b];
  const verdict = requiredToolComparison(expected, incoming.filter(Boolean));
  const duplicateResolved = after('join-duplicate-verdict');
  const showVerdict = repeated ? duplicateResolved : rerun ? after('join-select') : after('join-wait');
  const label = (value, x, y, size, color = C.ink, font = 'sans') =>
    api.text(ctx, String(value), x, y, size, color, 'left', font);

  focus.target('join-pair', () => {
    label('Incoming service replies', 130, 278, 44, C.ink, 'serif');
    label('Required reads', 957, 278, 44, C.ink, 'serif');
    label('Errors per 1,000 requests', 1291, 278, 34, C.muted);
    Object.entries(expected).forEach(([id, release], i) => {
      const y = 339 + i * 256;
      const receipt = incoming[i];
      const matched = receipt?.call_id === id;
      focus.target(i === 0 ? 'join-a' : 'join-b', () => {
        api.rect(ctx, 130, y, 600, 183, C.panel, receipt ? C.blue : C.muted, 8);
        if (!receipt) {
          const collecting = rerun ? started('join-complete') : after('join-launch');
          label(collecting ? 'Awaiting result' : 'Ready to read', 162, y + 102, 39, C.muted);
        } else {
          label(receipt.call_id + (receipt.ok ? '   /   ' + receipt.release_id : '   /   timeout'),
            162, y + 65, 38, C.blue);
          label(receipt.ok ? receipt.status : 'ok: false', 162, y + 137, 39,
            receipt.ok ? C.ink : C.yellow, 'mono');
        }

        const joinColor = matched ? C.cyan : receipt ? C.yellow : C.muted;
        api.line(ctx, 746, y + 91, matched ? 921 : 837, y + 91, joinColor, 3);
        if (matched) {
          api.line(ctx, 907, y + 80, 922, y + 91, joinColor, 3);
          api.line(ctx, 922, y + 91, 907, y + 102, joinColor, 3);
        }
        api.rect(ctx, 950, y, 841, 183, C.panel, C.muted, 8);
        label(id, 983, y + 64, 42, C.cyan, 'mono');
        label(release, 983, y + 132, 33);
        if (matched && receipt.ok) {
          const x = 1303, width = 429;
          const tip = x + width * receipt.error_rate / 0.1;
          const limit = x + width * receipt.budget / 0.1;
          label(String(perThousand(receipt.error_rate)), x, y + 57, 46, C.blue);
          api.line(ctx, x, y + 96, x + width, y + 96, C.muted, 2);
          api.line(ctx, x, y + 87, tip, y + 87, C.blue, 8);
          api.line(ctx, limit, y + 71, limit, y + 107, C.yellow, 3);
          label('Limit ' + perThousand(receipt.budget), limit - 42, y + 153, 29, C.yellow);
        } else {
          const message = matched ? 'Rate unavailable' :
            duplicateResolved ? 'No matching reply' : '—';
          label(message, 1303, y + 104, 36, matched || duplicateResolved ? C.yellow : C.muted);
        }
      });
    });
  });
  focus.target('join-decision', () => {
    const decision = !showVerdict ? '?' : verdict.ok ? verdict.release_id :
      repeated ? 'Waiting for call-2' : 'Waiting for v16 evidence';
    label('Comparison candidate', 140, 935, 40);
    label(decision, 650, 942, 52, showVerdict && verdict.ok ? C.cyan : C.yellow);
  });
}

export default {
  id: 'required-fan-in',
  draw: drawRequiredFanIn,
  cues: ['join-launch', 'join-seventeen', 'join-first-timeout', 'join-partial-question', 'join-wait',
    'join-complete', 'join-sixteen', 'join-compare', 'join-select', 'join-duplicate',
    'join-duplicate-question', 'join-duplicate-verdict'],
};
