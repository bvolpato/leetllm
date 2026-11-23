import { cueProgress, memoryRail } from '../worksheet.mjs';

export function drawPools(ctx, scene, state, api) {
  const { C, focus } = api,
    p = cueProgress(scene, state, api);
  const text = (s, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);
  const shared = state.beat === 2;
  const left = 485,
    width = 1210,
    maximum = 40;
  function pool(name, label, y, capacity, segments, target) {
    focus.target(target, () => {
      text(name, 135, y + 45, 37);
      memoryRail(ctx, api, { x: left, y, width, height: 63, maximum, segments });
      const mark = left + (width * capacity) / maximum;
      api.line(ctx, mark, y - 19, mark, y + 81, C.yellow, 4);
      text(capacity + ' GB', mark, y - 39, 30, C.yellow, 'center');
      text(label, left, y + 122, 32, C.ink);
    });
  }
  if (shared) {
    text('CPU and GPU share one physical memory pool', 135, 300, 39);
    const other = 10,
      requested = 24,
      capacity = 32,
      u = p('shared-request');
    pool(
      'Shared memory',
      'System and apps   10 GB     /     Model requests   24 GB',
      496,
      capacity,
      [
        { gb: other, color: C.blue },
        { gb: requested * u, color: C.pink },
      ],
      'shared',
    );
    if (u === 1)
      text(
        `${other + requested} GB requested   ·   ${other + requested - capacity} GB over capacity`,
        135,
        896,
        44,
        C.pink,
      );
  } else {
    text('Discrete GPU   /   a separate budget for each pool', 135, 265, 37);
    const u = p('device-demand'),
      host = p('host-buffer');
    pool(
      'Host RAM',
      host > 0 ? 'Separate host buffer   8 GB' : 'Host memory available',
      409,
      32,
      [{ gb: 8 * host, color: C.blue }],
      'host',
    );
    pool(
      'Device VRAM',
      'Ordinary device request   28 GB',
      705,
      24,
      [{ gb: 28 * u, color: C.pink }],
      'device',
    );
    if (u === 1) text('Device request exceeds its pool by 4 GB.', 135, 974, 39, C.pink);
  }
}
export default {
  id: 'pools',
  draw: drawPools,
  cues: ['device-demand', 'host-buffer', 'host-does-fit', 'shared-request'],
};
