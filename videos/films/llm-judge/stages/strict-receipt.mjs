import { candidates } from '../fixtures.mjs';

export const cleanReceipt = '{"verdict":"B","evidence":["B leads with the action."]}';
export const duplicateReceipt =
  '{"verdict":"A","verdict":"B","evidence":["B leads with the action."]}';
const escapedReceipt = duplicateReceipt.replace('"verdict":"B"', '"\\u0076erdict":"B"');

function receiptLines(raw) {
  return raw.replace('{', '{\n  ').replaceAll(',"', ',\n  "').replace('}', '\n}').split('\n');
}

export function drawStrictReceipt(ctx, scene, state, api) {
  const { C, focus } = api;
  const audit = state.beat === 4;
  const duplicate = !audit && focus.visible('duplicate-keys');
  const escaped = duplicate && focus.visible('decoded-name');
  const raw = escaped ? escapedReceipt : duplicate ? duplicateReceipt : cleanReceipt;
  const defaultRead = duplicate && focus.progress('default-last-wins', 0) === 1;
  const rejected = duplicate && focus.progress('strict-decode', 0) === 1;
  focus.target('host-binding', () => {
    api.text(ctx, 'DEP-27   /   Rubric v1   /   A = compact, B = stepwise', 145, 249, 32, C.muted);
  });
  focus.target('raw-receipt', () => {
    api.text(ctx, 'Raw model response', 145, 358, 38, C.ink);
    api.line(ctx, 145, 390, 1000, 390, C.cyan, 3);
    receiptLines(raw).forEach((line, i) => {
      const color = duplicate && (i === 1 || i === 2) ? C.yellow : C.ink;
      api.text(ctx, line, 145, 462 + 61 * i, 32, color, 'left', 'mono');
    });
  });
  if (audit) {
    if (focus.visible('check-b'))
      focus.target('actual-reply', () => {
        api.text(ctx, 'Reply B opens with', 1080, 358, 37, C.cyan);
        api.line(ctx, 1080, 390, 1775, 390, C.cyan, 3);
        const [line1, line2] = candidates.stepwise.split('. ')[0].split(' its ');
        api.text(ctx, '“' + line1, 1080, 488, 39, C.ink, 'left', 'serif');
        api.text(ctx, 'its ' + line2 + '.”', 1080, 552, 39, C.ink, 'left', 'serif');
        if (focus.progress('misquote', 0) === 1)
          api.text(ctx, 'First sentence gives the condition.', 1080, 681, 36, C.pink);
      });
  } else if (duplicate) {
    focus.target('default-result', () => {
      api.text(ctx, 'Default decoder', 1080, 360, 36, C.muted);
      api.text(
        ctx,
        defaultRead ? 'verdict = "' + JSON.parse(raw).verdict + '"' : 'verdict = ?',
        1080,
        457,
        46,
        C.yellow,
        'left',
        'mono',
      );
    });
    focus.target('parse-result', () => {
      api.text(ctx, 'Strict decoder', 1080, 576, 36, C.muted);
      api.text(
        ctx,
        rejected ? 'Duplicate JSON field' : 'Count this vote?',
        1080,
        670,
        43,
        rejected ? C.pink : C.ink,
      );
      if (rejected) api.text(ctx, 'Keep receipt  /  Parse failure', 1080, 743, 36, C.pink);
      if (state.beat === 3) {
        api.text(ctx, 'Schema checks', 145, 864, 34, C.cyan);
        api.text(
          ctx,
          'Only verdict + evidence   /   Allowed label   /   List of nonblank strings',
          145,
          934,
          37,
          C.ink,
        );
      }
    });
  } else {
    focus.target('parse-result', () => {
      api.text(ctx, 'Shape check', 1080, 360, 36, C.muted);
      api.text(ctx, 'A   /   B   /   tie   /   review', 1080, 458, 41, C.ink);
      api.text(ctx, 'Evidence: nonempty list of nonblank strings', 1080, 541, 30, C.ink);
      if (focus.progress('valid-receipt', 0) === 1)
        api.text(ctx, 'Accepted   /   B', 1080, 668, 49, C.green);
    });
  }
}

export default {
  id: 'strict-receipt',
  draw: drawStrictReceipt,
  cues: [
    'host-binding',
    'strict-fields',
    'valid-receipt',
    'duplicate-keys',
    'decode-question',
    'default-last-wins',
    'strict-decode',
    'decoded-name',
    'provider-boundary',
    'audit-clean',
    'check-b',
    'misquote',
  ],
};
