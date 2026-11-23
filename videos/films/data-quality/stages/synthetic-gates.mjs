const cases = [
  { input: [], required: 0 },
  { input: [-3, 2], required: 1 },
  { input: [0], required: 1 },
];
export function drawSyntheticGates(ctx, scene, state, api) {
  const { C, text, line, rect, focus } = api;
  const p = focus.progress;
  const ranEmpty = p('synthetic-empty') > 0;
  const ranMixed = p('synthetic-mixed') > 0;
  const repaired = p('synthetic-edit') > 0;
  const rerun = p('synthetic-rerun') > 0;
  const boundary = p('synthetic-zero') > 0;
  const zeroCounted = p('synthetic-zero-result') === 1;
  focus.target('count-workbench', () => {
    text(ctx, 'Generated Python function', 145, 263, 33, C.blue);
    text(ctx, 'def count_nonnegative(xs):', 145, 370, 51, C.ink, 'left', 'mono');
    text(
      ctx,
      repaired ? '    return sum(x >= 0 for x in xs)' : '    return len(xs)',
      145,
      466,
      51,
      repaired ? C.cyan : C.ink,
      'left',
      'mono',
    );
    const xs = [165, 665, 1075, 1420];
    ['Input', 'Required count', 'len(xs)', 'Repaired function'].forEach((label, i) => {
      if (i < 3 || repaired) text(ctx, label, xs[i], 607, 32, C.muted);
    });
    line(ctx, 145, 633, 1775, 633, C.muted, 2);
    cases.slice(0, boundary ? 3 : 2).forEach(({ input, required }, i) => {
      const y = 708 + i * 101;
      if (i === 1 && ranMixed) rect(ctx, 136, y - 57, 1645, 78, C.panel, C.muted, 5);
      text(ctx, '[' + input.join(', ') + ']', xs[0], y, 44, C.ink, 'left', 'mono');
      const showOutput = i < 2 || zeroCounted;
      text(ctx, showOutput ? String(required) : '?', xs[1], y, 42, C.ink);
      if (i === 0 ? ranEmpty : i === 1 ? ranMixed : zeroCounted)
        text(ctx, String(input.length), xs[2], y, 44, input.length === required ? C.green : C.pink);
      else text(ctx, '?', xs[2], y, 40, C.yellow);
      if (repaired)
        text(
          ctx,
          rerun && showOutput ? String(input.filter((x) => x >= 0).length) : '?',
          xs[3],
          y,
          44,
          rerun && showOutput ? C.green : C.yellow,
        );
    });
    if (ranMixed && !repaired)
      text(
        ctx,
        '−3 contributes to the length. It contributes zero to the required count.',
        960,
        961,
        36,
        C.yellow,
        'center',
      );
    if (zeroCounted)
      text(
        ctx,
        'Keep the inputs, outputs and checker version with the example.',
        960,
        1003,
        34,
        C.muted,
        'center',
      );
  });
}
export default {
  id: 'synthetic-gates',
  draw: drawSyntheticGates,
  cues: [
    'synthetic-empty',
    'synthetic-mixed',
    'synthetic-edit',
    'synthetic-rerun',
    'synthetic-zero',
    'synthetic-zero-result',
  ],
};
