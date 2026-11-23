import {
  constructionBox,
  constructionHeading,
  constructionLine,
  constructionNote,
  constructionText,
  withGpuConstructionFrame,
} from '../defaults.mjs';
export function paintGpuConstructionFaultConstruction(
  ctx,
  scene,
  state,
  api,
  C,
  f,
  b,
  p,
  show,
  prog,
  done,
  original,
) {
  if (b === 0) {
    constructionHeading(ctx, api, C, 'Two ranks in one collective');
    constructionBox(ctx, api, C, 'Rank 0 · waiting for peer', 470, 460, 620, 120, C.blue, 33);
    constructionBox(
      ctx,
      api,
      C,
      show('gpu-peer-stall', 0) ? 'Rank 1 · peer stalled' : 'Rank 1 · collective active',
      1450,
      460,
      620,
      120,
      show('gpu-peer-stall', 0) ? C.pink : C.blue,
      33,
    );
    constructionLine(ctx, api, C, 810, 460, 1110, 460, C.muted, 6);
    if (show('gpu-peer-stall', 0)) {
      constructionLine(ctx, api, C, 950, 420, 1010, 500, C.pink, 6);
      constructionLine(ctx, api, C, 1010, 420, 950, 500, C.pink, 6);
    }
    const n = Math.floor(prog('gpu-peer-buffers', 0) * 6);
    for (let i = 0; i < n; i++) api.rect(ctx, 260 + i * 85, 680, 65, 100, C.blue);
    constructionText(
      ctx,
      api,
      C,
      'retained communication /request buffers',
      520,
      855,
      30,
      C.blue,
      'center',
    );
    if (show('gpu-peer-oom', 0))
      constructionBox(ctx, api, C, 'Rank 0 allocation fails', 520, 937, 620, 74, C.pink, 32);
    constructionNote(
      ctx,
      api,
      C,
      'Match first timestamps and affected peer topology before tuning the healthy rank’s allocator.',
    );
  } else if (b === 1) {
    constructionHeading(ctx, api, C, 'Event-specific recovery scope · inspected catalog examples');
    const code = show('gpu-xid-uncontained', 1) ? 95 : 94;
    constructionBox(ctx, api, C, 'Catalog example   /   Xid ' + code, 960, 420, 920, 100, C.pink, 38);
    for (let i = 0; i < 3; i++)
      constructionBox(
        ctx,
        api,
        C,
        'application ' + String.fromCharCode(65 + i),
        400 + i * 560,
        650,
        450,
        100,
        code === 95 || i === 0 ? C.pink : C.green,
        31,
      );
    constructionText(
      ctx,
      api,
      C,
      code === 94
        ? 'affected app restarts · other running apps unaffected'
        : 'owner-controlled GPU reset precedes application restart',
      960,
      870,
      34,
      C.yellow,
      'center',
    );
    constructionNote(
      ctx,
      api,
      C,
      'An Xid can arise in an application, NVIDIA software or hardware. Read its catalog action.',
    );
  } else {
    constructionHeading(ctx, api, C, 'A limiter is a clue with a workload and configuration');
    const fields = [
      ['configured cap', '250 W'],
      ['observed power', '250 W'],
      ['active reason', 'software power cap'],
      ['workload window', 'matched regression'],
    ];
    fields.forEach(([a, z], i) => {
      const x = 330 + i * 440;
      constructionText(ctx, api, C, a, x, 400, 28, C.muted, 'center');
      constructionBox(ctx, api, C, z, x, 560, 390, 100, i === 2 ? C.yellow : C.cyan, 30);
    });
    constructionText(
      ctx,
      api,
      C,
      'supplied worksheet readings · enforcing a cap is not a thermal diagnosis',
      960,
      790,
      31,
      C.yellow,
      'center',
    );
    constructionText(
      ctx,
      api,
      C,
      'correlate clocks, temperature, power, limits and time',
      960,
      930,
      33,
      C.ink,
      'center',
    );
    constructionNote(
      ctx,
      api,
      C,
      'Synthetic readings from the same workload window.',
    );
  }
}
export function drawFaultConstructionStage(ctx, scene, state, api) {
  withGpuConstructionFrame(ctx, scene, state, api, paintGpuConstructionFaultConstruction);
}
export default {
  id: 'fault-construction',
  draw: drawFaultConstructionStage,
  cues: [
    'fault-construction-0',
    'gpu-peer-stall',
    'gpu-peer-buffers',
    'gpu-peer-oom',
    'fault-construction-1',
    'gpu-xid-uncontained',
    'fault-construction-2',
  ],
};
