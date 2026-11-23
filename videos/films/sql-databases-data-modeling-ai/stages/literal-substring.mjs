import { directed } from '../construction.mjs';
import { literalSubstringPattern } from '../model.mjs';
import { drawSqlText } from '../defaults.mjs';

const input = 'policy_10%!';
const examples = [input, 'policyX10aa!', 'archived POLICY_10%! copy'];

export function drawLiteralSubstring(ctx, scene, state, api) {
  const { C } = api;
  const progress = (id, beat) => directed(state, id, beat);
  const bang = progress('escape-bang', 0) === 1;
  const escaped = progress('escape-wildcards', 0) === 1;
  const wrapped = progress('substring-pattern', 0) === 1;
  const blank = progress('substring-empty', 2) === 1;
  const pattern = literalSubstringPattern(input);
  const characters = [...input].map((ch) =>
    ch === '!' && bang ? '!!' : escaped && ['_', '%'].includes(ch) ? '!' + ch : ch,
  );
  const cells = [wrapped ? '%' : '', ...characters, wrapped ? '%' : ''];
  drawSqlText(ctx, api, "lower(chunk_text) LIKE ? ESCAPE '!'", 135, 277, 32, C.blue);
  api.focus.target('search-input', () => {
    drawSqlText(ctx, api, 'Search box', 135, 366, 29, C.muted);
    drawSqlText(ctx, api, blank ? '(blank)' : input, 440, 370, 36, C.ink);
  });
  api.focus.target('pattern-cells', () => {
    drawSqlText(ctx, api, 'Bound pattern', 135, 474, 29, C.muted);
    if (blank) {
      drawSqlText(ctx, api, 'No query sent', 440, 477, 32, C.ink);
    } else {
      cells.forEach((s, i) => {
        const x = 425 + i * 91;
        const outer = i === 0 || i === cells.length - 1;
        api.rect(ctx, x, 417, 85, 89, C.panel, outer ? C.muted : C.blue, 2, 5);
        if (s) drawSqlText(ctx, api, s, x + 42, 476, 36, outer ? C.yellow : C.ink, 'center');
      });
    }
  });
  drawSqlText(ctx, api, 'Stored passages', 140, 610, 31, C.muted);
  drawSqlText(ctx, api, 'Pattern test', 1280, 610, 31, C.muted);
  api.line(ctx, 140, 640, 1770, 640, C.muted, 2);
  const cues = ['test-stored-strings', 'reject-lookalike', 'match-uppercase'];
  const targets = ['passage-one', 'passage-two', 'passage-three'];
  examples.forEach((str, i) => {
    api.focus.target(targets[i], () => {
      const y = 706 + i * 94;
      drawSqlText(ctx, api, str, 145, y, 37, C.ink);
      if (!blank && progress(cues[i], 1) === 1) {
        const match = str.toLowerCase().includes(input);
        drawSqlText(
          ctx,
          api,
          match ? 'Return row ' + (i + 1) : 'Skip  ·  X in place of _',
          1280,
          y,
          32,
          match ? C.green : C.pink,
        );
      }
    });
  });
  if (blank) drawSqlText(ctx, api, '0 rows', 1280, 705, 35, C.muted);
  if (wrapped && !blank) drawSqlText(ctx, api, pattern, 960, 993, 32, C.cyan, 'center');
}

export default {
  id: 'literal-substring',
  draw: drawLiteralSubstring,
  cues: [
    'escape-bang',
    'escape-wildcards',
    'substring-pattern',
    'test-stored-strings',
    'reject-lookalike',
    'match-uppercase',
    'substring-empty',
  ],
};
