import { freshConcurrentLedger, strictWorkflowReceipt } from '../model.mjs';
import { REQUIRED_WORKFLOW_CHECKS } from '../fixtures.mjs';
import { cueStep } from '../invoice-page.mjs';
import { text } from '../defaults.mjs';

const events = [43017, 43017, 43017, 88104];
const ledger = freshConcurrentLedger(events);
const full = {
  source: 'F',
  verifier: 'K',
  base: 'expected assertion failure',
  executed: REQUIRED_WORKFLOW_CHECKS,
  terminal: 'pass',
  exitCode: 0,
};
const receipts = [
  { ...full, source: 'E' },
  { ...full, executed: REQUIRED_WORKFLOW_CHECKS.filter((name) => name !== 'concurrent replay') },
  full,
];

function deliveries(ctx, state, api) {
  const { C } = api;
  const share = cueStep(state, 'fresh-share', 1, 0.05, 0.22) === 1;
  const other = cueStep(state, 'fresh-new', 1, 0.26, 0.4) === 1;
  const counted = cueStep(state, 'fresh-count', 1, 0.51, 0.68) === 1;
  text(
    ctx,
    api,
    'One account   /   starts empty   /   atomic insert or reuse',
    120,
    271,
    38,
    C.ink,
  );
  events.forEach((key, i) => {
    const x = 360 + i * 440;
    const ready = i === 3 ? other : share;
    const color = i === 3 ? C.yellow : C.blue;
    api.focus.target('fresh-deliveries', () => {
      text(ctx, api, 'Worker ' + String.fromCharCode(65 + i), x, 424, 36, C.muted, 'center');
      text(ctx, api, key, x, 523, 61, color, 'center');
    });
    api.arrow(ctx, x, 575, x, 636, color, 3);
    api.focus.target(i === 3 ? 'fresh-other' : 'fresh-shared', () =>
      text(
        ctx,
        api,
        ready ? '#' + ledger.returned[i] : '?',
        x,
        744,
        69,
        ready ? C.green : C.muted,
        'center',
      ),
    );
  });
  api.focus.target('fresh-rows', () => {
    if (counted) {
      text(ctx, api, 'Stored invoices: ' + ledger.count, 120, 946, 44, C.ink);
      ledger.rows.forEach((row, i) =>
        text(
          ctx,
          api,
          row.event + '  →  #' + row.invoice,
          785 + i * 475,
          946,
          42,
          i ? C.yellow : C.blue,
        ),
      );
    } else {
      text(
        ctx,
        api,
        'Which workers share an invoice? How many rows are stored?',
        120,
        946,
        41,
        C.yellow,
      );
    }
  });
}

function packets(ctx, state, api) {
  const { C } = api;
  const picked = cueStep(state, 'fresh-packet-reveal', 3, 0.02, 0.23) === 1;
  const handed = cueStep(state, 'fresh-owner', 3, 0.46, 0.64) === 1;
  const cols = [155, 690, 1200];
  const seen = [
    cueStep(state, 'fresh-read-one', 2, 0.42, 0.54),
    cueStep(state, 'fresh-read-two', 2, 0.55, 0.67),
    cueStep(state, 'fresh-read-three', 2, 0.68, 0.8),
  ];
  text(ctx, api, 'Local patch F', 120, 272, 55, C.ink);
  text(
    ctx,
    api,
    'All three use K. The base failed the retry. The new-key and row-count checks passed.',
    120,
    351,
    34,
    C.muted,
  );
  ['Receipt', 'Revision tested', 'Concurrent replay'].forEach((s, i) =>
    text(ctx, api, s, cols[i], 475, 37, C.ink),
  );
  receipts.forEach((r, i) => {
    const y = 592 + i * 126;
    const valid = strictWorkflowReceipt(r);
    const ran = r.executed.includes('concurrent replay');
    api.line(ctx, 120, y - 72, 1800, y - 72, C.muted, 1);
    api.focus.target('fresh-receipt-' + (i + 1), () => {
      text(ctx, api, 'R' + (i + 1), cols[0], y, 50, picked && valid ? C.green : C.ink);
      if (seen[i] === 0) return;
      text(ctx, api, r.source, cols[1], y, 45, picked && r.source !== 'F' ? C.pink : C.blue);
      text(
        ctx,
        api,
        ran ? 'Ran and passed' : 'Skipped',
        cols[2],
        y,
        43,
        picked && !ran ? C.pink : C.ink,
      );
    });
  });
  api.focus.target('fresh-result', () =>
    text(
      ctx,
      api,
      handed
        ? 'Return F + R3 to the integration owner.'
        : picked
          ? 'R3 records a passing concurrent replay on F.'
          : 'Which receipt supports concurrent replay on F?',
      120,
      979,
      39,
      picked ? C.green : C.yellow,
    ),
  );
}

export function drawFreshHandoff(ctx, scene, state, api) {
  if (state.beat < 2) deliveries(ctx, state, api);
  else packets(ctx, state, api);
}
export default {
  id: 'fresh-handoff',
  draw: drawFreshHandoff,
  cues: [
    'fresh-input',
    'fresh-share',
    'fresh-new',
    'fresh-count',
    'fresh-read-one',
    'fresh-read-two',
    'fresh-read-three',
    'fresh-packet-reveal',
    'fresh-owner',
  ],
};
