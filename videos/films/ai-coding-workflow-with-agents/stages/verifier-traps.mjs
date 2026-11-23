import { queuedReplay, replay, replayEvidence } from '../model.mjs';
import { cueStep, shortInvoice, shortKey } from '../invoice-page.mjs';
import { text } from '../defaults.mjs';

export function drawVerifierTraps(ctx, scene, state, api) {
  const { C } = api;
  if (state.beat <= 1) {
    const inspected = cueStep(state, 'traps-inspect', 1, 0, 0.09);
    const queued = cueStep(state, 'traps-queued', 1, 0.23, 0.43);
    const checked = cueStep(state, 'traps-count', 1, 0.52, 0.64) === 1;
    const stores = [replay(true, 3), queuedReplay()];
    const keys = stores[0].deliveries.map((row) => shortKey(row.event));
    text(ctx, api, 'Same deliveries   ' + keys.join('   /   '), 120, 271, 38, C.blue);
    stores.forEach((store, i) => {
      const x = 120 + i * 865;
      api.rect(ctx, x, 333, 815, 535, C.panel, undefined, 10);
      text(ctx, api, 'Patch ' + ['X', 'Y'][i], x + 45, 413, 48, C.ink);
      api.focus.target('traps-returns', () => {
        text(ctx, api, 'Returned', x + 45, 513, 31, C.muted);
        text(
          ctx,
          api,
          store.deliveries.map((row) => shortInvoice(row.invoice)).join('     '),
          x + 300,
          513,
          48,
          C.ink,
        );
      });
      api.line(ctx, x + 45, 557, x + 765, 557, C.muted, 1);
      api.focus.target('traps-ledger', () => {
        text(
          ctx,
          api,
          inspected > 0 ? 'Stored rows' : 'Store inspection pending',
          x + 45,
          625,
          33,
          C.muted,
        );
        store.invoices.forEach((row, j) => {
          if (j < 2 && inspected < (j + 1) / 2) return;
          const y = 663 + j * 65;
          const duplicate = i === 1 && queued === 1 && row.event === store.invoices[2].event;
          const drawRow = () => {
            text(ctx, api, shortKey(row.event), x + 300, y, 35, duplicate ? C.pink : C.blue);
            text(ctx, api, shortInvoice(row.invoice), x + 600, y, 40, j === 2 ? C.pink : C.ink);
          };
          if (j < 2) drawRow();
          else
            api.focus.target('traps-queued-write', () => {
              if (queued === 1) drawRow();
              else if (queued > 0) {
                text(ctx, api, 'Queued insert', x + 45, y, 32, C.yellow);
                api.line(ctx, x + 300, y - 12, x + 300 + 380 * queued, y - 12, C.yellow, 3);
              }
            });
        });
        if (checked) {
          const passed = replayEvidence(store).every((check) => check.passed);
          text(
            ctx,
            api,
            store.count + (passed ? ' rows   PASS' : ' rows   FAIL'),
            x + 765,
            413,
            40,
            passed ? C.green : C.pink,
            'right',
          );
        }
      });
    });
    api.focus.target('traps-decision', () =>
      text(
        ctx,
        api,
        checked
          ? 'assert.equal(stored, 2);'
          : inspected === 1
            ? 'Two distinct event keys. Count each store.'
            : 'Where would you look for a duplicate?',
        120,
        981,
        40,
        C.yellow,
      ),
    );
    return;
  }

  if (state.beat <= 3) {
    const first = cueStep(state, 'traps-repair', 2, 0.23, 0.38) === 1;
    const blocked = cueStep(state, 'traps-import', 2, 0.5, 0.67) === 1;
    const counted = cueStep(state, 'traps-budget', 3, 0.01, 0.12) === 1;
    text(ctx, api, 'Same verifier K on all three snapshots', 120, 277, 42, C.ink);
    const runs = [
      ['Base', 'Ran', 'Retry returned #2', true],
      ['Repair 1', 'Ran', 'Retry returned #2', first],
      ['Repair 2', 'Import failed', 'Never started', blocked],
    ];
    const cols = [120, 665, 1250];
    ['Run', 'Test setup', 'Retry assertion'].forEach((label, i) =>
      text(ctx, api, label, cols[i], 413, 34, C.muted),
    );
    runs.forEach(([label, setup, outcome, ready], i) => {
      const y = 540 + i * 142;
      api.line(ctx, 120, y - 76, 1800, y - 76, C.muted, 1);
      text(ctx, api, label, cols[0], y, 43, C.ink);
      api.focus.target('traps-run', () => {
        text(ctx, api, ready ? setup : 'Pending', cols[1], y, 39, C.ink);
        text(
          ctx,
          api,
          ready ? outcome : '?',
          cols[2],
          y,
          38,
          ready ? (i === 2 ? C.yellow : C.pink) : C.muted,
        );
      });
    });
    api.focus.target('traps-budget', () =>
      text(
        ctx,
        api,
        counted
          ? '1 failed repair   ·   stop and restore the runner'
          : 'How many repairs failed the retry assertion?',
        120,
        979,
        41,
        C.yellow,
      ),
    );
    return;
  }

  const done = cueStep(state, 'traps-skip', 4, 0.28, 0.47) === 1;
  text(ctx, api, 'Read the runner’s execution record', 120, 285, 43, C.ink);
  const rows = [
    ['Test discovered', 'New event', 'Concurrent replay'],
    ['Execution record', 'Passed', done ? 'Skipped' : 'Pending'],
    ['Observed behavior', 'New invoice created', done ? 'No replay result' : 'Awaiting run'],
  ];
  rows.forEach(([name, a, b], i) => {
    const y = 443 + i * 155;
    api.line(ctx, 120, y - 72, 1800, y - 72, C.muted, 1);
    text(ctx, api, name, 120, y, 36, C.muted);
    text(ctx, api, a, 670, y, 41, C.ink);
    api.focus.target('traps-run', () =>
      text(ctx, api, b, 1270, y, 40, done && i ? C.yellow : C.ink),
    );
  });
  text(
    ctx,
    api,
    'Require concurrent replay to run before accepting its result.',
    120,
    958,
    36,
    C.yellow,
  );
}

export default {
  id: 'verifier-traps',
  draw: drawVerifierTraps,
  cues: [
    'traps-return',
    'traps-inspect',
    'traps-queued',
    'traps-count',
    'traps-repair',
    'traps-import',
    'traps-budget',
    'traps-skip',
  ],
};
