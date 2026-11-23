import {
  drawText,
  line,
  note,
  pill,
  rectangle,
  tokenCells,
  withPretrainingMainFrame,
} from '../defaults.mjs';
export function paintPretrainingMainRestartConsistency(
  ctx,
  scene,
  state,
  api,
  C,
  c,
  b,
  p,
  cue,
  P,
  D,
  beg,
) {
  const order = ['0', '5', '1', '2', '3', '4'];
  if (b === 0) {
    drawText(
      ctx,
      api,
      C,
      'Record-local work and common comparison ownership',
      960,
      300,
      34,
      C.blue,
    );
    ['A band 1', 'B band 1', 'C band6'].forEach((v, i) =>
      pill(ctx, api, C, v, 380 + i * 580, 460, 430, i === 2 ? C.pink : C.blue),
    );
    if (beg('shuffle')) {
      pill(ctx, api, C, 'Owner:band 1 → compare A/B', 680, 760, 800, C.cyan);
      pill(ctx, api, C, 'Owner:band6 → C', 1470, 760, 590, C.pink);
    }
    note(ctx, api, C, 'Node counts follow measured extraction, storage and shuffle capacity');
  } else {
    drawText(ctx, api, C, 'Actual executed deterministic order', 960, 290, 36, C.blue);
    tokenCells(ctx, api, C, order, 230, 420, 245, C.blue);
    const consumedX = 230 + 2 * 245,
      prefetchX = 230 + 4 * 245;
    line(ctx, api, C, consumedX - 8, 530, consumedX - 8, 650, C.green, 4);
    drawText(ctx, api, C, 'Consumed 2', consumedX, 720, 31, C.green);
    if (b === 1 && D('suffix')) {
      rectangle(ctx, api, C, consumedX, 790, 4 * 245 - 14, 95, C.panel, C.green);
      drawText(ctx, api, C, 'Restore suffix: 1,2,3,4', consumedX + 480, 850, 36, C.green);
    }
    if (b === 2) {
      if (beg('prefetch')) {
        line(ctx, api, C, prefetchX - 8, 530, prefetchX - 8, 650, C.yellow, 4);
        drawText(ctx, api, C, 'Prefetched 4', prefetchX, 720, 31, C.yellow);
      }
      if (D('skip'))
        drawText(ctx, api, C, 'Reader head skips unconsumed 1,2', 960, 825, 34, C.pink);
      if (D('repeat'))
        drawText(ctx, api, C, 'Original seed repeats consumed 0,5', 960, 905, 34, C.pink);
    }
    note(
      ctx,
      api,
      C,
      b === 1
        ? 'Verify each shard’s bytes against its digest; hashing only the manifest is insufficient'
        : 'Align data position with the completed optimizer step and restore model, optimizer and schedule',
    );
  }
}
export function drawRestartConsistencyStage(ctx, scene, state, api) {
  withPretrainingMainFrame(ctx, scene, state, api, paintPretrainingMainRestartConsistency);
}
export default {
  id: 'restart-consistency',
  draw: drawRestartConsistencyStage,
  cues: [
    'pt-restart-consistency-shuffle',
    'pt-restart-consistency-suffix',
    'pt-restart-consistency-manifest',
    'pt-restart-consistency-prefetch',
    'pt-restart-consistency-skip',
    'pt-restart-consistency-repeat',
    'pt-restart-consistency-restore',
  ],
};
