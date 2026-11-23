import { reuseConstruction } from '../construction.mjs';
import { text } from '../defaults.mjs';
import { usd } from '../forecast-calendar.mjs';

export default {
  id: 'two-reuse-paths',
  cues: ['stored-answer-copy', 'prefix-kv-match', 'prefix-new-output'],
  draw(ctx, scene, state, api) {
    const { C } = api;
    const v = reuseConstruction(state);
    const label = (s, x, y, size, color, align = 'left') =>
      text(ctx, api, s, x, y, size, color, align);
    const stored = 'Returns accepted within 30 days.';
    label('What is the return window?', 135, 282, 43, C.ink);
    api.focus.target('answer-copy', () => {
      label('Approved answer for this policy', 135, 397, 30, C.muted);
      api.rect(ctx, 135, 425, 660, 98, C.panel, C.green, 8);
      label(stored, 465, 488, 34, C.green, 'center');
      label('Reply to customer', 135, 851, 31, C.muted);
      if (v.copy < 1) api.rect(ctx, 135, 711, 660, 98, C.panel, C.muted, 8);
      if (v.copy > 0) {
        const y = api.lerp(527, 711, v.copy);
        api.rect(ctx, 135, y, 660, 98, C.panel, C.green, 8);
        label(stored, 465, y + 63, 34, C.green, 'center');
      }
      label(
        v.copy === 1 ? '0 generated tokens   ·   $0 generation' : 'Stored answer',
        135,
        908,
        33,
        C.green,
      );
    });
    if (v.beat < 1) {
      label('The lookup and storage have separate costs.', 960, 986, 30, C.muted, 'center');
      return;
    }

    api.line(ctx, 895, 258, 895, 933, C.muted, 2);
    label('Does order 77 qualify?', 995, 282, 43, C.ink);
    const x = 995,
      w = 478,
      suffixX = x + w + 16;
    api.focus.target('prefix-match', () => {
      for (const [i, order] of ['Order 42', 'Order 77'].entries()) {
        const y = 375 + i * 144;
        label(i ? 'Current input' : 'Earlier input', x, y - 18, 29, C.muted);
        api.rect(ctx, x, y, w, 70, C.panel, C.yellow, 6);
        label('Same policy instructions', x + w / 2, y + 46, 29, C.yellow, 'center');
        api.rect(ctx, suffixX, y, 270, 70, C.panel, i ? C.cyan : C.muted, 6);
        label(order, suffixX + 135, y + 46, 30, i ? C.cyan : C.muted, 'center');
      }
      if (v.match > 0) api.rect(ctx, x, 594, w * v.match, 9, C.yellow, undefined, 0);
      if (v.match === 1) {
        label('1,280 read', x, 648, 31, C.yellow);
        label('520 ordinary', suffixX, 648, 31, C.cyan);
      }
    });
    api.focus.target('new-output', () => {
      const output = ['Order 77:', 'verify the', 'purchase date…'];
      api.rect(ctx, x, 711, 764, 98, C.panel, C.pink, 8);
      if (v.beat === 1)
        label('Which work does the model still owe?', x + 382, 774, 31, C.ink, 'center');
      else {
        const words = output.slice(0, Math.floor(v.generation * output.length)).join(' ');
        if (words) label(words, x + 382, 774, 32, C.pink, 'center');
      }
      label(v.generated + ' newly generated tokens', x, 873, 33, C.pink);
      if (v.generation === 1) label(usd(v.prefixCharge, 5) + ' generation', x, 932, 35, C.pink);
    });
    if (v.generation === 1)
      label(
        'Answer excerpts shown. Usage counts cover the complete responses.',
        960,
        1010,
        27,
        C.muted,
        'center',
      );
  },
};
