import {
  advancedCode,
  foot,
  math,
  target,
  text,
  withMpsAdvancedFrame,
  withMpsRootFrame,
} from '../defaults.mjs';
export function paintAllocator(ctx, scene, state, api, C, c, t, s) {
  const driver = s.driver,
    live = s.live,
    scale = 20,
    start = 240,
    y = 470;
  target(ctx, api, 'live-counter', () => {
    text(ctx, api, C, 'Live tensors · ' + live.toFixed(0) + ' MiB', 460, 295, 39, C.cyan, 'center');
    advancedCode(ctx, api, C, 'current_allocated_memory()', 460, 355, 25, C.cyan);
  });
  target(ctx, api, 'driver-counter', () => {
    text(
      ctx,
      api,
      C,
      'Metal process · ' + driver.toFixed(0) + ' MiB',
      1390,
      295,
      39,
      C.yellow,
      'center',
    );
    advancedCode(ctx, api, C, 'driver_allocated_memory()', 1390, 355, 25, C.yellow);
  });
  const limitX = start + s.budget * scale;
  text(ctx, api, C, '48 MiB example budget', limitX, 420, 30, C.ink, 'center');
  api.rect(ctx, start, y, 1440, 150, C.panel, C.muted, 2, 8);
  let cursor = start;
  const blockLabels = [];
  const blocks = [
    {
      name: 'input',
      amount: s.input,
      color: C.cyan,
    },
    {
      name: 'training state',
      amount: s.state,
      color: C.blue,
    },
    {
      name: 'unused cache',
      amount: s.cached,
      color: C.yellow,
    },
    {
      name: 'driver extras',
      amount: s.other,
      color: C.muted,
    },
  ];
  if (s.step === 2 && s.reducedReady)
    blocks.push({
      name: 'new activations',
      amount: s.requested,
      color: C.green,
    });
  target(ctx, api, 'allocator-blocks', () => {
    for (const block of blocks) {
      if (block.amount > 0) {
        api.rect(ctx, cursor, y, block.amount * scale, 150, block.color, block.color, 0, 0);
        blockLabels.push({
          ...block,
          x: cursor + (block.amount * scale) / 2,
        });
        cursor += block.amount * scale;
      }
    }
    if (!s.accepted && s.requestVisible)
      api.rect(ctx, cursor, y, s.requested * s.requestProgress * scale, 150, C.panel, C.pink, 0);
  });
  api.line(ctx, limitX, 435, limitX, 650, C.ink, 4);
  const names = {
    input: 'input',
    'training state': 'state',
    'unused cache': 'cache',
    'driver extras': 'extras',
    'new activations': 'activations',
  };
  for (const block of blockLabels)
    if (block.name !== 'unused cache' || block.amount * scale >= 130)
      text(
        ctx,
        api,
        C,
        names[block.name] + ' ' + block.amount.toFixed(0),
        block.x,
        710,
        29,
        block.color,
        'center',
      );
  if (s.step > 0 && s.cached < 0.1)
    text(ctx, api, C, 'cache released', 1480, 710, 29, C.yellow, 'center');
  if (s.step === 0) {
    target(ctx, api, 'allocator-explanation', () =>
      math(
        ctx,
        api,
        C,
        '24\\text{ live}+16\\text{ cached}+8\\text{ extras}=48\\text{ MiB}',
        960,
        835,
        44,
        C.yellow,
      ),
    );
    text(ctx, api, C, 'Which blocks can we release now?', 960, 945, 40, C.yellow, 'center');
  } else if (s.step === 1) {
    target(ctx, api, 'cache-release', () =>
      advancedCode(
        ctx,
        api,
        C,
        'empty_cache() releases unoccupied cached blocks',
        960,
        810,
        30,
        C.yellow,
      ),
    );
    target(ctx, api, 'requested-peak', () =>
      math(
        ctx,
        api,
        C,
        s.requestProgress === 1
          ? '32+24=56\\text{ MiB}>48\\text{ MiB}'
          : s.requestVisible
            ? '\\text{next activation request}'
            : '\\text{live tensors remain: }24\\text{ MiB}',
        960,
        925,
        48,
        s.requestVisible ? C.pink : C.cyan,
      ),
    );
  } else {
    target(ctx, api, 'reduced-peak', () => {
      if (s.reducedReady)
        math(ctx, api, C, '6+12+8+12=38\\text{ MiB}<48\\text{ MiB}', 960, 835, 48, C.green);
      else
        text(
          ctx,
          api,
          C,
          'Which live allocations shrink with the batch?',
          960,
          835,
          39,
          C.yellow,
          'center',
        );
    });
    text(
      ctx,
      api,
      C,
      s.reducedReady
        ? 'Smaller batch · smaller input and activation peak'
        : 'Plan the smaller batch before retrying',
      960,
      945,
      39,
      C.green,
      'center',
    );
  }
  foot(
    ctx,
    api,
    C,
    'Supplied allocator model · macOS and application pressure also share physical memory',
  );
}
function selectStage(ctx, scene, state, api, C, c, t, s) {
  withMpsAdvancedFrame(ctx, scene, state, api, C, c, s, paintAllocator);
}
export function drawAllocatorStage(ctx, scene, state, api) {
  withMpsRootFrame(ctx, scene, state, api, selectStage);
}
export default {
  id: 'allocator',
  draw: drawAllocatorStage,
  cues: [
    'live-tensor-count',
    'metal-process-count',
    'release-unused',
    'request-activations',
    'reduce-memory',
  ],
};
