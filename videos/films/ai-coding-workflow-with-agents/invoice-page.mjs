import { EVENT, OTHER } from './fixtures.mjs';
import { clamp } from './arithmetic.mjs';
import { text } from './defaults.mjs';

// Storyboards without a measured voice use beat-relative stand-ins for the same operations.
export function cueStep(state, id, beat, start, end) {
  const cue = state.cues?.[id];
  if (cue) return cue.phase === 'before' ? 0 : cue.phase === 'after' ? 1 : clamp(cue.progress);
  if (state.beat !== beat) return state.beat > beat ? 1 : 0;
  return clamp((state.beatP - start) / (end - start));
}

export function shortKey(event) {
  return String(event).split(' ').at(-1);
}

export function shortInvoice(invoice) {
  return invoice.replace('invoice ', '#');
}

export function invoicePage(ctx, api, { store, shown, source, mode, footer, accent, writing = 0 }) {
  const { C } = api;
  api.focus.target('handler-node', () => {
    text(ctx, api, source, 120, 274, 43, C.ink);
    text(ctx, api, mode, 120, 338, 34, accent);
  });

  text(ctx, api, 'Provider delivery', 120, 450, 34, C.muted);
  text(ctx, api, 'Returned ID', 738, 450, 34, C.muted);
  for (let i = 0; i < shown; i++) {
    const y = 550 + 132 * i;
    const event = i === 2 ? OTHER : EVENT;
    const row = store.deliveries[i];
    api.line(ctx, 120, y - 66, 1090, y - 66, C.muted, 1);
    text(ctx, api, ['First', 'Retry', 'New'][i], 120, y, 34, C.muted);
    api.focus.target(i === 2 ? 'new-event-identity' : 'event-identity', () =>
      text(ctx, api, event, 250, y, 35, i === 2 ? C.yellow : C.blue),
    );
    api.focus.target(i === 2 ? 'new-invoice-result' : 'invoice-identity', () =>
      text(ctx, api, row?.invoice ?? '?', 738, y, 44, row ? C.ink : C.yellow),
    );
    if (row) {
      const slot = store.invoices.findIndex((record) => record.invoice === row.invoice);
      const turnX = 1088 - i * 28;
      const ledgerY = 590 + slot * 84;
      const color = i === 2 ? C.yellow : C.blue;
      api.path(
        ctx,
        [
          { x: 990, y: y - 16 },
          { x: turnX, y: y - 16 },
          { x: turnX, y: ledgerY },
          { x: 1142, y: ledgerY },
        ],
        { color, width: 2 },
      );
      api.circle(ctx, 1142, ledgerY, 5, color);
    }
  }

  api.rect(ctx, 1150, 373, 650, 526, C.panel, undefined, 12);
  text(ctx, api, 'Invoice ledger', 1195, 444, 44, C.ink);
  text(ctx, api, 'Event key', 1195, 512, 29, C.muted);
  text(ctx, api, 'Invoice', 1595, 512, 29, C.muted);
  store.invoices.forEach((row, i) => {
    const y = 605 + 84 * i;
    api.line(ctx, 1195, y - 59, 1750, y - 59, C.muted, 1);
    text(ctx, api, shortKey(row.event), 1195, y, 40, row.event === OTHER ? C.yellow : C.blue);
    text(ctx, api, shortInvoice(row.invoice), 1595, y, 45, C.ink);
  });
  if (writing > 0 && writing < 1) {
    const y = 605 + 84 * store.count;
    api.line(ctx, 1195, y - 59, 1195 + 555 * writing, y - 59, C.blue, 3);
  }
  api.focus.target('stored-count', () =>
    text(ctx, api, 'Stored invoices: ' + store.count, 1195, 856, 38, accent),
  );
  api.focus.target('decision', () => text(ctx, api, footer, 120, 988, 39, C.yellow));
}
