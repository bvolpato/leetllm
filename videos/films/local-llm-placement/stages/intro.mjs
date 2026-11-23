import { cache, memory } from '../model.mjs';
import { cueProgress, memoryRail } from '../worksheet.mjs';

export function drawIntro(ctx, scene, state, api) {
  const { C, focus } = api;
  const p = cueProgress(scene, state, api);
  const text = (value, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, value, x, y, size, color, align);
  const filled = p('workload-state');
  const budget = memory(16384, true);
  const perLog = cache(16384, 1);
  const work = budget.workspace * p('working-allocation');
  const x = 152,
    width = 1600;
  const scale = (gb) => x + (width * gb) / budget.capacity;
  if (state.beat === 0) {
    // Keep the failed request visible from frame zero while the scene heading fades in.
    ctx.save();
    if (state.t < 0.35) ctx.globalAlpha = 1;
    focus.target('requests', () => {
      for (let i = 0; i < 4; i++) {
        api.rect(
          ctx,
          140 + i * 18,
          282 + i * 19,
          666,
          385,
          C.panel,
          i === 3 ? C.pink : C.muted,
          10,
        );
      }
      text('incident-04.log', 239, 418, 46);
      api.line(ctx, 239, 455, 811, 455, C.muted, 2);
      text('Worker response', 239, 530, 32, C.muted);
      text('Out of memory', 239, 635, 72, C.pink);
      if (p('short-answer') === 1) text('Earlier short query answered', 194, 813, 33, C.green);
    });
    focus.target('device-budget', () => {
      const left = 1004,
        top = 338,
        cardWidth = 745;
      for (let pin = 0; pin < 22; pin++) {
        api.rect(ctx, left + 66 + pin * 22, 708, 12, 44, C.yellow, undefined, 2);
      }
      api.rect(ctx, left, top, cardWidth, 383, C.panel, C.blue, 20);
      text(budget.capacity + ' GB GPU', left + 48, 450, 74);
      const shared = p('shared-model');
      const rail = cardWidth - 96;
      memoryRail(ctx, api, {
        x: left + 48,
        y: 510,
        width: rail,
        height: 60,
        maximum: budget.capacity,
        segments: [{ gb: budget.weights, color: C.blue }],
      });
      text(budget.weights + ' GB', left + 64, 554, 36, C.bg);
      text(
        shared === 1 ? 'One copy shared by four logs' : 'Model weight estimate',
        left + 48,
        645,
        37,
        C.blue,
      );
    });
    ctx.restore();
    return;
  }
  focus.target('requests', () => {
    text('Runbook assistant    /    one GPU worker', x, 265, 37);
    for (let i = 0; i < 4; i++) {
      const left = x + 405 * i;
      api.rect(ctx, left, 365, 365, 146, C.panel, C.cyan);
      text(`Log ${i + 1}`, left + 24, 422, 38);
      const counted = filled * 4 >= i + 1;
      text(
        counted ? `Cache +${perLog.total.toFixed(3)} GB` : '16,384 tokens',
        left + 24,
        475,
        30,
        C.cyan,
      );
    }
  });
  const segments = [
    { gb: budget.weights, color: C.blue },
    { gb: work, color: C.pink },
  ];
  for (let i = 0; i < 4; i++) {
    const fraction = Math.min(1, Math.max(0, filled * 4 - i));
    segments.push(
      { gb: perLog.sliding * fraction, color: C.cyan },
      { gb: perLog.full * fraction, color: C.green },
    );
  }
  focus.target('device-budget', () => {
    text('Counted on the device worksheet', x, 605, 33, C.muted);
    memoryRail(ctx, api, { x, y: 644, width, height: 75, maximum: budget.capacity, segments });
    for (let i = 1; i < 4 && i < filled * 4; i++) {
      const mark = scale(budget.weights + work + i * perLog.total);
      api.line(ctx, mark, 648, mark, 715, C.bg, 3);
    }
    api.line(ctx, scale(budget.limit), 623, scale(budget.limit), 737, C.yellow, 4);
    text(`${budget.limit} GB limit`, scale(budget.limit), 605, 29, C.yellow, 'center');
    text(`${budget.capacity} GB`, x + width, 605, 29, C.muted, 'right');
    const entries = [
      ['Shared weights', budget.weights, C.blue],
      ['Workspace', work, C.pink],
      ['Recent-window cache', budget.sliding * filled, C.cyan],
      ['Full-history cache', budget.full * filled, C.green],
    ];
    for (const [i, [label, gb, color]] of entries.entries()) {
      const left = x + 405 * i;
      text(label, left, 794, 32, color);
      text(`${gb.toFixed(3)} GB`, left, 850, 40, color);
    }
  });
  focus.target('question', () => {
    let line = `Four open logs × ${perLog.total.toFixed(3)} GB of cache. Inside ${budget.limit} GB?`;
    if (filled > 0)
      line =
        filled === 1
          ? `Coexisting total ${segments.reduce((sum, part) => sum + part.gb, 0).toFixed(3)} GB   ·   inside the planning limit`
          : 'Add one cache allocation per open log.';
    text(line, x, 937, 42, filled === 1 ? C.green : C.ink);
    if (p('check-peak') > 0)
      text('Check the failed request’s cache allocation and peak workspace.', x, 998, 33);
  });
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'failed-request',
    'short-answer',
    'shared-model',
    'working-allocation',
    'ask-fit',
    'workload-state',
    'check-peak',
  ],
};
