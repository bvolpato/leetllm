import { multiTenantConstructionModel } from '../model.mjs';

export function drawFreshDesignGate(ctx, scene, state, api) {
  const s = multiTenantConstructionModel(scene.id, state);
  const { C } = api;
  const firstPages = Math.floor(s.reservedPositions / 16);
  const partial = state.cues['fresh-thirty-seven'].phase === 'after';
  api.focus.target('fresh-design-gate-mechanism', () => {
    api.text(ctx, 'Workspace C    /    request 9    /    attempt 2', 135, 273, 41, C.ink);
    api.text(ctx, 'Input ' + s.input + '    +    output cap ' + s.outputCap, 135, 370, 43, C.ink);

    const x = 140,
      width = 753;
    api.text(ctx, 'Period allowance', x, 480, 41, C.blue);
    api.text(ctx, s.total.toLocaleString('en-US') + ' units in this period', x, 545, 34, C.muted);
    let cursor = x;
    for (const [amount, color] of [
      [s.balance.available, C.muted],
      [s.balance.held, C.yellow],
      [s.balance.settled, C.blue],
    ]) {
      const segment = (width * amount) / s.total;
      if (segment) api.rect(ctx, cursor, 585, segment, 45, color, undefined, 0);
      cursor += segment;
    }
    [
      ['Available', s.balance.available, C.ink],
      ['Held', s.balance.held, C.yellow],
      ['Settled', s.balance.settled, C.blue],
    ].forEach(([name, n, color], i) => {
      api.text(ctx, name, x + i * 250, 710, 34, color);
      api.text(ctx, String(n), x + i * 250, 778, 47, color);
    });

    api.text(ctx, 'Worker reservation', 1000, 480, 41, C.pink);
    api.text(ctx, '16 positions per page', 1000, 545, 34, C.muted);
    if (s.pageAnswer || partial) {
      const count = s.pageAnswer ? s.pages : firstPages;
      for (let i = 0; i < count; i++) {
        const xx = 1000 + (i % 10) * 77,
          yy = 589 + Math.floor(i / 10) * 56;
        api.rect(ctx, xx, yy, 62, 39, C.bg, C.muted, 1);
        const positions = Math.min(16, s.reservedPositions - i * 16);
        if (!s.retired)
          api.rect(
            ctx,
            xx + 3,
            yy + 3,
            (56 * positions) / 16,
            33,
            i * 16 < s.input ? C.blue : C.yellow,
            undefined,
            0,
          );
      }
      api.text(
        ctx,
        !s.pageAnswer
          ? firstPages + ' pages cover ' + firstPages * 16 + ' positions'
          : s.retired
            ? s.pages + ' pages released'
            : s.pages +
              ' pages reserved  ·  ' +
              (s.pages * 16 - s.reservedPositions) +
              ' spare positions',
        1000,
        855,
        33,
        C.ink,
      );
    } else {
      api.text(
        ctx,
        s.reserved ? s.reservedPositions + ' positions ÷ 16' : 'How many whole pages?',
        1000,
        704,
        45,
        C.ink,
      );
    }

    let status = 'What must admission reserve on each side?';
    if (s.reserved) status = 'Allow for every input position and every permitted output position.';
    if (partial) status = 'Blue covers the input. Gold covers possible output.';
    if (s.ackLost)
      status = 'Dispatch acknowledgement missing. Attempt 2 still owns its reservation.';
    if (s.usageKnown && !s.retired) {
      api.text(
        ctx,
        'Usage receipt: 90 output tokens    /    Last device read: pending',
        135,
        896,
        32,
        C.yellow,
      );
      status =
        state.cues['fresh-keep-both'].phase === 'after'
          ? 'Keep the 600 units and all 38 pages reserved.'
          : 'Can we release either the held allowance or the pages?';
    }
    if (s.retired) status = 'Last device read finished. This worker has retired the attempt.';
    if (s.settlementAmountKnown)
      status =
        s.input + ' input + ' + s.actualOutput + ' output = ' + s.actual + ' units to settle';
    if (s.released)
      status =
        'Returned ' + s.refund + ' unused units. Available allowance: ' + s.balance.available + '.';
    if (s.replayed)
      status = 'Same attempt, second delivery. The balance stays at ' + s.balance.available + '.';
    api.text(ctx, status, 135, 975, 37, C.ink);
  });
}
export default {
  id: 'fresh-design-gate',
  draw: drawFreshDesignGate,
  cues: [
    'mt-fresh-design-gate-b0',
    'mt-fresh-design-gate-b1',
    'mt-fresh-design-gate-s1-0',
    'fresh-thirty-seven',
    'mt-fresh-design-gate-s1-2',
    'mt-fresh-design-gate-b2',
    'mt-fresh-design-gate-s2-2',
    'mt-fresh-design-gate-b3',
    'mt-fresh-design-gate-retired',
    'mt-fresh-design-gate-s3-0',
    'mt-fresh-design-gate-s3-1',
    'mt-fresh-design-gate-s3-2',
    'fresh-keep-both',
  ],
};
