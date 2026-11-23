import { beatCue } from '../construction.mjs';

export function drawXmlContract(ctx, scene, state, api) {
  const { C } = api;
  const fixed = beatCue(state, 'xml-fix', 0, 0.48).done;
  const invalid = beatCue(state, 'xml-invalid', 0, 0.22).done;
  const parsed = beatCue(state, 'xml-parse', 0, 0.75).done;
  const received = beatCue(state, 'xml-receipt', 1, 0.5).done;
  const clock = beatCue(state, 'xml-age', 2, 0.2).started;
  const tag = fixed ? 'final_answer' : 'final';
  api.focus.target('xml', () => {
    api.text(ctx, 'Model response', 140, 290, 40, C.muted);
    const rows = [
      '<response>',
      '  <checkpoint>Smoke passed</checkpoint>',
      '  <verification_summary>Checked</verification_summary>',
      '  <' + tag + '>Hold</' + tag + '>',
      '</response>',
    ];
    rows.forEach((row, i) =>
      api.text(
        ctx,
        row,
        140,
        395 + i * 68,
        40,
        i === 3 ? (invalid && !fixed ? C.pink : C.cyan) : C.ink,
        'left',
        'mono',
      ),
    );
    api.text(
      ctx,
      parsed
        ? 'Parsed final answer   /   Hold'
        : invalid && !fixed
          ? 'Unknown field   /   final'
          : 'Expected field   /   final_answer',
      140,
      785,
      43,
      parsed ? C.green : invalid && !fixed ? C.pink : C.muted,
      'left',
      'mono',
    );
  });
  api.focus.target('xml-result', () => {
    api.text(ctx, 'Tool evidence', 140, 917, 33, C.muted);
    api.text(
      ctx,
      clock
        ? '110 s - 100 s = 10 s     /     allowed age 0–30 s'
        : received
          ? 'checkout-42   /   rev 7   /   10%   /   true   /   240 ms'
          : 'Awaiting authenticated receipt',
      455,
      920,
      38,
      received ? C.cyan : C.yellow,
    );
  });
}

export default {
  id: 'xml-contract',
  draw: drawXmlContract,
  cues: ['xml-invalid', 'xml-fix', 'xml-parse', 'xml-empty', 'xml-receipt', 'xml-age'],
};
