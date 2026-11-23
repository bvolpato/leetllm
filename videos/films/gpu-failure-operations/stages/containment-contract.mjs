import {
  constructionBox,
  constructionHeading,
  constructionNote,
  constructionText,
  withGpuConstructionFrame,
} from '../defaults.mjs';
export function paintGpuConstructionContainmentContract(
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
  if (b < 2) {
    constructionHeading(
      ctx,
      api,
      C,
      b === 0
        ? 'Future admission and existing request custody differ'
        : 'Unhealthy allocation state does not evict the assigned pod',
    );
    const unhealthy = b === 1 && show('gpu-device-unhealthy', 1);
    for (let i = 0; i < 8; i++) {
      const x = 370 + (i % 4) * 410,
        y = 430 + Math.floor(i / 4) * 240;
      constructionBox(
        ctx,
        api,
        C,
        'GPU-' + i,
        x,
        y,
        330,
        100,
        i === 0 && unhealthy ? C.pink : C.blue,
        34,
      );
      if (i === 0)
        constructionText(ctx, api, C, 'W9 remains assigned', x, y + 100, 27, C.yellow, 'center');
    }
    constructionText(
      ctx,
      api,
      C,
      'capacity 8 · allocatable ' + (unhealthy ? '7' : '8'),
      960,
      940,
      36,
      C.cyan,
      'center',
    );
    constructionNote(
      ctx,
      api,
      C,
      'Existing R1/R2 remain owned; retries need a healthy peer, budget and deduplication contract.',
    );
  } else {
    constructionHeading(ctx, api, C, 'Node N1 control toy · current W9 stays owned until eviction');
    api.rect(ctx, 300, 390, 1000, 430, 'transparent', C.blue, 3);
    constructionText(ctx, api, C, 'N1', 370, 440, 34, C.blue);
    constructionBox(ctx, api, C, 'W9 + local cache C9', 800, 590, 650, 120, C.cyan, 32);
    const cordon = show('gpu-node-cordon', 2),
      drain = show('gpu-node-drain', 2);
    constructionBox(
      ctx,
      api,
      C,
      cordon ? 'ordinary placement held' : 'ordinary placement open',
      1570,
      470,
      560,
      100,
      cordon ? C.yellow : C.blue,
      29,
    );
    if (drain) {
      constructionBox(ctx, api, C, 'drain request · may wait', 1570, 710, 570, 100, C.pink, 30);
      constructionText(
        ctx,
        api,
        C,
        'disruption budgets /ownership',
        1570,
        880,
        27,
        C.pink,
        'center',
      );
    }
    constructionNote(
      ctx,
      api,
      C,
      'If eviction completes, local emptyDir data can be lost. Durable receipts survive.',
    );
  }
}
export function drawContainmentContractStage(ctx, scene, state, api) {
  withGpuConstructionFrame(ctx, scene, state, api, paintGpuConstructionContainmentContract);
}
export default {
  id: 'containment-contract',
  draw: drawContainmentContractStage,
  cues: [
    'containment-contract-0',
    'containment-contract-1',
    'gpu-device-unhealthy',
    'containment-contract-2',
    'gpu-node-cordon',
    'gpu-node-drain',
  ],
};
