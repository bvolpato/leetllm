import { replay } from '../model.mjs';
import { cueStep, shortInvoice, shortKey } from '../invoice-page.mjs';
import { text } from '../defaults.mjs';

const firstDelivery = replay(false, 1);
const afterRetry = replay(false, 2);

function invoice(ctx, api, row, x) {
  const { C } = api;
  const top = 310,
    width = 405,
    fold = 52;
  const right = x + width;
  api.path(
    ctx,
    [
      { x, y: top },
      { x: right - fold, y: top },
      { x: right, y: top + fold },
      { x: right, y: 827 },
      { x, y: 827 },
    ],
    { closed: true, fill: C.ink, width: 0 },
  );
  api.path(
    ctx,
    [
      { x: right - fold, y: top },
      { x: right - fold, y: top + fold },
      { x: right, y: top + fold },
    ],
    { closed: true, fill: C.muted, width: 0 },
  );
  text(ctx, api, 'INVOICE', x + 43, 412, 39, C.panel);
  api.text(ctx, shortInvoice(row.invoice), x + 37, 563, 130, C.bg, 'left', 'serif');
  api.line(ctx, x + 43, 610, right - 43, 610, C.muted, 2);
  text(ctx, api, 'Billing event', x + 43, 684, 33, C.panel);
  text(ctx, api, shortKey(row.event), x + 43, 770, 64, C.bg);
}

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  const tested = cueStep(state, 'intro-first', 0, 0.24, 0.47);
  const passed = firstDelivery.count === 1;
  const retry = cueStep(state, 'intro-retry', 0, 0.48, 0.92);
  const expected = cueStep(state, 'intro-expect', 2, 0, 0.06);
  const delivered = cueStep(state, 'intro-delivered', 2, 0.1, 0.17);
  const store = delivered === 1 ? afterRetry : firstDelivery;
  const delivery = (retry > 0 ? afterRetry : firstDelivery).deliveries.at(-1);

  text(ctx, api, 'The agent’s button patch', 120, 300, 37, C.ink);
  api.rect(ctx, 120, 346, 363, 135, C.blue, undefined, 25);
  text(ctx, api, 'Pay', 301, 433, 61, C.bg, 'center');
  api.path(
    ctx,
    [
      { x: 438, y: 442 },
      { x: 450, y: 510 },
      { x: 467, y: 488 },
      { x: 488, y: 523 },
      { x: 502, y: 515 },
      { x: 481, y: 480 },
      { x: 512, y: 480 },
    ],
    { closed: true, fill: C.ink, color: C.bg, width: 4 },
  );
  text(ctx, api, '1 click', 537, 432, 48, C.ink);
  api.focus.target('checkout-test', () =>
    text(
      ctx,
      api,
      tested === 1
        ? 'Single-delivery test ' + (passed ? 'passed' : 'failed')
        : 'Single-delivery test',
      120,
      567,
      36,
      tested === 1 ? (passed ? C.green : C.pink) : C.muted,
    ),
  );

  api.focus.target('event-identity', () => {
    text(ctx, api, retry > 0 ? 'Provider retry' : 'First provider delivery', 120, 708, 38, C.ink);
    text(ctx, api, 'Event ' + shortKey(delivery.event), 120, 795, 54, C.blue);
    if (retry > 0) {
      const tip = api.trace(
        ctx,
        [
          { x: 558, y: 778 },
          { x: 866, y: 778 },
        ],
        retry,
        C.blue,
        4,
      );
      if (tip) api.circle(ctx, tip.x, tip.y, 9, C.blue);
    }
  });

  api.focus.target('stored-count', () => {
    const firstX = 1140 - 213 * api.ease(delivered);
    text(ctx, api, 'Stored invoices', firstX, 263, 39, C.ink);
    invoice(ctx, api, store.invoices[0], firstX);
    if (store.count === 2) invoice(ctx, api, store.invoices[1], 1375);
  });
  api.focus.target('decision', () => {
    if (retry === 0) return;
    const label =
      delivered === 1
        ? 'Expected #1 on retry. The server returned ' +
          shortInvoice(store.deliveries[1].invoice) +
          '.'
        : expected === 1
          ? 'Expected on retry   #1'
          : 'Which invoice should come back?';
    text(ctx, api, label, 120, 972, 44, C.yellow);
  });
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['intro-first', 'intro-retry', 'intro-expect', 'intro-delivered', 'intro-test'],
};
