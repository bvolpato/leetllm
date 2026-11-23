import { spokenProgress } from '../drawing.mjs';

export function drawAlignmentSpace(ctx, scene, state, api) {
  const { C } = api;
  const p = spokenProgress(api, state);
  const rows = [
    ['SFT', 'Worked answer', 'Fit its tokens', 'method-sft', 0, 0, 0.22],
    [
      'Reward-model RLHF',
      'People rank answers',
      'Train a scorer for new answers',
      'method-rlhf',
      0,
      0.25,
      0.55,
    ],
    [
      'DPO',
      'Preferred and rejected answers',
      'Fit their ordering directly',
      'method-dpo',
      0,
      0.6,
      0.92,
    ],
    [
      'RLVR',
      'Newly sampled answers',
      'Run a checker and use its reward',
      'method-rlvr',
      1,
      0,
      0.23,
    ],
  ];
  if (state.beat < 2) {
    api.text(ctx, 'Training method', 145, 311, 36, C.muted);
    api.text(ctx, 'What goes in?', 642, 311, 36, C.muted);
    api.text(ctx, 'How is it used?', 1212, 311, 36, C.muted);
    rows.forEach(([method, input, action, id, beat, start, end], i) => {
      if (i && p(id, beat, start, end) <= 0) return;
      const y = 430 + i * 143;
      api.focus.target(id, () => {
        api.text(ctx, method, 145, y, 42, C.blue);
        api.text(ctx, input, 642, y, 34, C.ink);
        api.text(ctx, action, 1212, y, 34, C.cyan);
      });
    });
    return;
  }

  api.focus.target('tulu-rewards', () => {
    api.text(ctx, 'Tülu 3', 174, 328, 68, C.ink);
    api.text(ctx, 'Policy update with PPO', 174, 406, 38, C.blue);
    const checks = [
      ['Checked success', '+10', C.green, 'tulu-checked', 0.15, 0.45],
      ['Checked failure', '0', C.ink, 'tulu-checked', 0.15, 0.45],
      ['Missing end token', '−10', C.yellow, 'tulu-end', 0.48, 0.73],
    ];
    checks.forEach(([label, value, color, id, start, end], i) => {
      const x = 174 + 555 * i;
      api.text(ctx, label, x, 578, 39, C.muted);
      if (p(id, 2, start, end) === 1) api.text(ctx, value, x, 737, 104, color);
    });
  });
}

export default {
  id: 'alignment-space',
  draw: drawAlignmentSpace,
  cues: ['method-sft', 'method-rlhf', 'method-dpo', 'method-rlvr', 'tulu-checked', 'tulu-end'],
};
