import { observation } from './fixtures.mjs';

export function drawReceipt(ctx, api, { record, now, smokeVisible = true, showAge = true }) {
  const { C } = api;
  api.focus.target('traffic', () => {
    api.text(ctx, 'Checkout-42   /   live rollout', 140, 265, 34, C.muted);
    api.text(ctx, 'Revision ' + observation.revision, 140, 355, 70, C.ink);
    for (let i = 0; i < 10; i++)
      api.rect(
        ctx,
        145 + i * 61,
        396,
        53,
        48,
        i < observation.canary / 10 ? C.cyan : C.panel,
        C.muted,
        3,
      );
    api.text(ctx, observation.canary + '% of traffic', 145, 515, 38, C.cyan);
    if (smokeVisible) api.text(ctx, 'Smoke test passed', 145, 570, 34, C.ink);
  });
  api.focus.target('receipt', () => {
    api.text(ctx, 'Metrics tool   /   checkout-42', 940, 265, 34, C.muted);
    if (!record) {
      api.text(ctx, 'Awaiting reading', 940, 355, 60, C.muted);
      return;
    }
    api.text(ctx, 'Revision ' + record.revision, 940, 355, 70, C.ink);
    api.text(ctx, record.latency + ' ms', 940, 456, 72, C.cyan);
    api.text(ctx, 'p95 latency', 1285, 452, 38, C.ink);
    if (showAge)
      api.text(
        ctx,
        'Observed at ' + record.observedAt + ' s     ·     age ' + (now - record.observedAt) + ' s',
        940,
        546,
        34,
        C.muted,
      );
  });
}

export function drawPolicy(ctx, api, { visible, latency, result, prompt }) {
  const { C } = api;
  api.focus.target('policy', () => {
    if (!visible) {
      api.text(ctx, prompt, 140, 785, 48, C.ink);
      return;
    }
    const pos = (value) => 200 + ((value - 100) / 300) * 1490;
    api.text(ctx, 'Exercise policy v3   /   smoke passed', 140, 675, 32, C.muted);
    for (const [lo, hi, name] of [
      [100, 200, 'Continue'],
      [200, 300, 'Hold'],
      [300, 400, 'Rollback'],
    ]) {
      api.rect(ctx, pos(lo), 740, pos(hi) - pos(lo) - 4, 14, C.muted, undefined, 1);
      api.text(ctx, name, (pos(lo) + pos(hi)) / 2, 816, 39, C.ink, 'center');
    }
    for (const tick of [200, 300]) api.text(ctx, tick + ' ms', pos(tick), 715, 32, C.ink, 'center');
    if (latency != null) api.circle(ctx, pos(latency), 747, 13, C.yellow, C.bg, 3);
    api.text(ctx, result ?? prompt, 140, 956, 48, result ? C.yellow : C.ink);
  });
}
