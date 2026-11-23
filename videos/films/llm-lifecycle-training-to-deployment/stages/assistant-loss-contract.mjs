import { sceneCues } from '../picture.mjs';

export function drawAssistantLossContract(ctx, scene, state, api) {
  const { C } = api;
  const cue = sceneCues(scene, state);
  api.focus.target('assistant-loss-contract-mechanism', () => {
    if (state.beat === 2) {
      api.text(ctx, 'Inspect one proposed assistant target', 130, 290, 40, C.muted);
      const missing = cue.after('mask-audit');
      const rows = [
        ['eligible', 'true'],
        ['policy_id', '“P-7”'],
        ['evidence', '“Minimum age is 30 days.”'],
      ];
      rows.forEach(([key, value], i) => {
        const y = 437 + i * 140;
        api.text(ctx, key, 190, y, 44, C.ink, 'left', 'mono');
        api.text(
          ctx,
          missing && i === 1 ? '(omitted)' : value,
          730,
          y,
          44,
          missing && i === 1 ? C.pink : C.ink,
        );
        api.line(ctx, 185, y + 40, 1710, y + 40, C.panel, 4);
      });
      if (missing)
        api.text(ctx, 'Valid JSON    ·    Required field missing', 960, 934, 45, C.pink, 'center');
      return;
    }
    const spans = [
      [160, 420, 'System', 'Return JSON'],
      [612, 530, 'User', 'Stale · 42 d · min 30 d'],
      [1174, 585, 'Assistant', '“eligible”: true, …'],
    ];
    api.text(ctx, 'One input sequence', 130, 275, 38, C.muted);
    spans.forEach(([x, w, role, tokens], i) => {
      const color = i === 2 ? C.cyan : C.blue;
      api.text(ctx, role, x + w / 2, 368, 33, color, 'center');
      api.rect(ctx, x, 402, w, 120, C.panel, color, 11);
      api.text(ctx, tokens, x + w / 2, 479, 43, C.ink, 'center');
    });
    api.text(ctx, 'Direct training targets', 130, 653, 35, C.muted);
    const masked = cue.after('mask-prompt');
    spans.forEach(([x, w], i) => {
      const supervised = i === 2;
      const color = supervised ? C.cyan : C.muted;
      if (!masked && !supervised) return;
      if (supervised && !cue.started('mask-reply')) return;
      api.line(ctx, x, 710, x + w, 710, color, supervised ? 8 : 2);
      api.text(
        ctx,
        supervised ? 'Score reply tokens' : 'Masked',
        x + w / 2,
        771,
        35,
        color,
        'center',
      );
    });
    if (cue.started('mask-condition')) {
      const from = 877,
        to = 1466,
        y = 572;
      api.line(ctx, from, 528, from, y, C.blue, 3);
      api.line(ctx, from, y, to, y, C.cyan, 3);
      api.arrow(ctx, to, y, to, 527, C.cyan, 3);
      api.circle(ctx, from + (to - from) * cue.progress('mask-condition'), y, 7, C.cyan);
      api.text(ctx, 'Age 42 and P-7', 880, 931, 38, C.blue, 'center');
      api.text(ctx, 'help predict “true”', 1310, 931, 40, C.cyan, 'center');
    }
  });
}
export default {
  id: 'assistant-loss-contract',
  draw: drawAssistantLossContract,
  cues: ['mask-prompt', 'mask-reply', 'mask-condition', 'mask-audit'],
};
