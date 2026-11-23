import {
  constructionBox,
  constructionHeading,
  constructionNote,
  constructionText,
  withGpuConstructionFrame,
} from '../defaults.mjs';
export function paintGpuConstructionAutomationContract(
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
    constructionHeading(ctx, api, C, 'Structured source and exact scope precede a transition');
    const fields = [
      'GPU/node/workload/process IDs',
      'exact code +source +window',
      'category /severity /raw message',
    ];
    fields.forEach((s, i) =>
      constructionBox(ctx, api, C, s, 650, 420 + i * 190, 970, 110, C.cyan, 32),
    );
    constructionBox(ctx, api, C, 'authenticated owner', 1510, 600, 620, 150, C.yellow, 31);
    constructionNote(
      ctx,
      api,
      C,
      'A log substring or an unclassified raw Fail cannot authorize a device reset or node drain.',
    );
  } else {
    const count = b === 1 ? (show('gpu-incident-repeat', 1) ? 2 : 1) : 2,
      quiet = b === 1 && show('gpu-incident-quiet', 1);
    constructionHeading(ctx, api, C, 'Device incident I1   /   GPU-7f3');
    constructionBox(ctx, api, C, 'I1   /   fault reports   ' + count, 960, 460, 1100, 130, C.pink, 40);
    constructionText(ctx, api, C, 'quarantine HELD', 960, 700, 49, C.pink, 'center');
    if (quiet || b === 2)
      constructionText(
        ctx,
        api,
        C,
        'New events in the later window   0',
        960,
        860,
        32,
        C.cyan,
        'center',
      );
    constructionNote(
      ctx,
      api,
      C,
      b === 2
        ? 'Release requires fresh evidence and the responsible owners.'
        : 'Repeated reports increment recurrence rather than creating duplicate drain actions.',
    );
  }
}
export function drawAutomationContractStage(ctx, scene, state, api) {
  withGpuConstructionFrame(ctx, scene, state, api, paintGpuConstructionAutomationContract);
}
export default {
  id: 'automation-contract',
  draw: drawAutomationContractStage,
  cues: [
    'automation-contract-0',
    'automation-contract-1',
    'gpu-incident-repeat',
    'gpu-incident-quiet',
    'automation-contract-2',
  ],
};
