import {
  constructionArrow,
  constructionBox,
  constructionHeading,
  constructionNote,
  constructionText,
  withGpuConstructionFrame,
} from '../defaults.mjs';
export function paintGpuConstructionReceiptContract(
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
    constructionHeading(ctx, api, C, 'Incident window   /   14:03:17 UTC');
    const owners = [
      ['r-7812', 290, 390, C.yellow],
      ['Pod UID / PID 17', 750, 390, C.blue],
      ['GPU-7f3', 1220, 390, C.cyan],
      ['node gpu-a17', 1640, 390, C.pink],
    ];
    owners.forEach(([s, x, y, c], i) => {
      constructionBox(ctx, api, C, s, x, y, i === 1 ? 370 : 330, 95, c, 29);
      if (i < 3) constructionArrow(ctx, api, C, x + 180, y, owners[i + 1][1] - 190, y, c);
    });
    const fields = [
      'model revision',
      'allocator backend/config',
      'driver + CUDA runtime',
      'first/last timestamps',
    ];
    fields.forEach((s, i) =>
      constructionText(ctx, api, C, s, 300 + i * 430, 670, 27, C.muted, 'center'),
    );
    if (show('gpu-receipt-bind', 0))
      constructionText(
        ctx,
        api,
        C,
        'Identity survives display-name reuse and process replacement',
        960,
        875,
        34,
        C.green,
        'center',
      );
    constructionNote(
      ctx,
      api,
      C,
      'Tie every sample to the same failure window.',
    );
  } else if (b === 1) {
    constructionHeading(ctx, api, C, 'Bounded evidence capture runs alongside containment');
    constructionBox(
      ctx,
      api,
      C,
      'P17 · volatile allocator history',
      500,
      450,
      680,
      110,
      C.blue,
      32,
    );
    constructionBox(
      ctx,
      api,
      C,
      'incident storage · controlled access',
      1430,
      450,
      720,
      110,
      C.cyan,
      30,
    );
    const q = prog('gpu-capture-dump', 1);
    constructionArrow(ctx, api, C, 870, 450, 1030, 450);
    api.rect(ctx, 880 + 150 * q, 580, 90, 60, C.cyan);
    constructionText(ctx, api, C, 'captured metadata', 960, 700, 33, C.cyan, 'center');
    if (show('gpu-capture-deadline', 1)) {
      constructionBox(
        ctx,
        api,
        C,
        'deadline reached · do not wait for hung dump',
        960,
        870,
        1250,
        95,
        C.pink,
        32,
      );
      constructionText(
        ctx,
        api,
        C,
        'Continue with the required isolation or termination',
        960,
        970,
        31,
        C.pink,
        'center',
      );
    }
    constructionNote(
      ctx,
      api,
      C,
      'Exit loses unsaved history; reset may erase volatile device evidence.',
    );
  } else {
    constructionHeading(ctx, api, C, 'Preserve metadata inside the incident tenancy boundary');
    const fields = [
      'allocator stacks /source paths',
      'process owners /arguments',
      'raw device code +time',
    ];
    fields.forEach((s, i) =>
      constructionBox(ctx, api, C, s, 600, 400 + i * 180, 830, 100, C.blue, 30),
    );
    api.rect(ctx, 1120, 340, 600, 570, 'transparent', C.yellow, 3);
    constructionText(ctx, api, C, 'restricted incident storage', 1420, 410, 31, C.yellow, 'center');
    constructionText(
      ctx,
      api,
      C,
      'retention · encryption · access',
      1420,
      580,
      28,
      C.ink,
      'center',
    );
    constructionText(ctx, api, C, 'stable IDs +hashes', 1420, 750, 32, C.cyan, 'center');
    constructionNote(
      ctx,
      api,
      C,
      'Collect prompt content only under the applicable incident policy.',
    );
  }
}
export function drawReceiptContractStage(ctx, scene, state, api) {
  withGpuConstructionFrame(ctx, scene, state, api, paintGpuConstructionReceiptContract);
}
export default {
  id: 'receipt-contract',
  draw: drawReceiptContractStage,
  cues: [
    'receipt-contract-0',
    'gpu-receipt-bind',
    'receipt-contract-1',
    'gpu-capture-dump',
    'gpu-capture-deadline',
    'receipt-contract-2',
  ],
};
