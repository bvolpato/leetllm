import { completed, movement } from '../replay.mjs';

const example = { acceptable: 81, total: 100, required: 85 };

export function drawReleaseReceipt(ctx, scene, state, api) {
  const { C } = api;
  return api.focus.target('hf-release-receipt-mechanism', () => {
    if (state.beat < 2) {
      const first = state.beat === 0;
      const rows = first
        ? [
            [
              'Files',
              'Model, tokenizer, processor and custom-code commits',
              'hf-release-receipt-0',
            ],
            ['Model', 'Config hash, selected class, shard index, parameter count', 'receipt-class'],
            [
              'First forward',
              'Raw input, rendered chat, IDs, masks and modality tensors',
              'receipt-input',
            ],
          ]
        : [
            [
              'Execution',
              'Versions, precision, quantization, device map, cache, parallelism',
              'hf-release-receipt-1',
            ],
            ['Selection', 'Resolved settings, seed, stop IDs and token limit', 'receipt-policy'],
            [
              'Evidence',
              'Reference logits and tokens, tolerance, licenses, code review',
              'receipt-evidence',
            ],
          ];
      api.text(
        ctx,
        first ? 'Receipt for the bird request' : 'How the reply was produced',
        100,
        279,
        57,
        C.ink,
      );
      rows.forEach(([label, value, cue], i) => {
        const y = 435 + i * 190;
        api.text(ctx, label, 100, y, 39, C.blue);
        if (movement(state, state.beat, cue) > 0) api.text(ctx, value, 530, y, 35, C.ink);
        api.line(ctx, 100, y + 53, 1810, y + 53, C.muted, 2);
      });
      return;
    }
    const checked = completed(state, 2, 'receipt-numeric');
    const scored = completed(state, 2, 'receipt-quality');
    const timed = completed(state, 2, 'receipt-latency');
    api.text(ctx, 'Candidate application   /   illustrative release decision', 100, 275, 44, C.ink);
    const label = (name, y, status, color) => {
      api.text(ctx, name, 100, y, 43, C.ink);
      if (status) api.text(ctx, status, 1800, y, 42, color, 'right');
    };
    label('Numerical replay', 425, checked ? 'Pass' : '', C.green);
    api.text(
      ctx,
      checked ? 'Fixed-input logits meet tolerance' : 'Compare fixed-input logits',
      600,
      425,
      37,
      C.blue,
    );
    label(
      'Held-out quality',
      646,
      scored ? (example.acceptable >= example.required ? 'Pass' : 'Fail') : '',
      C.pink,
    );
    const left = 610,
      span = 820,
      y = 694;
    const threshold = left + (span * example.required) / example.total;
    api.line(ctx, left, y, left + span, y, C.muted, 4);
    api.line(ctx, threshold, y - 30, threshold, y + 30, C.yellow, 5);
    api.text(
      ctx,
      'Floor ' + example.required + ' / ' + example.total,
      threshold,
      y + 85,
      34,
      C.yellow,
      'center',
    );
    if (scored) {
      const actual = left + (span * example.acceptable) / example.total;
      api.line(ctx, left, y, actual, y, C.blue, 10);
      api.circle(ctx, actual, y, 13, C.blue);
      api.text(
        ctx,
        example.acceptable + ' acceptable answers',
        actual,
        y - 52,
        34,
        C.blue,
        'right',
      );
    }
    label('Workload latency', 927, timed ? 'Pending' : '', C.yellow);
    if (timed) api.text(ctx, 'Target workload has yet to run', 600, 927, 37, C.muted);
  });
}
export default {
  id: 'release-receipt',
  draw: drawReleaseReceipt,
  cues: [
    'hf-release-receipt-0',
    'receipt-class',
    'receipt-input',
    'hf-release-receipt-1',
    'receipt-policy',
    'receipt-evidence',
    'hf-release-receipt-2',
    'receipt-numeric',
    'receipt-quality',
    'receipt-latency',
  ],
};
