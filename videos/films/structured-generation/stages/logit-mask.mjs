import { stableSoftmax } from 'vizmatic';
import { legal, masked } from '../model.mjs';
import { constructionCode as code, constructionText as text } from '../defaults.mjs';
import { after } from '../page.mjs';

const tokens = ['The', '{', 'Sure', 'JSON'];
const logits = [0.45, 0.3, 0.15, 0.1];
const raw = stableSoftmax(logits);
const filtered = masked(logits, '', tokens);

export function drawLogitMask(ctx, scene, state, api) {
  const { C, focus } = api;
  focus.target('first-mask', () => {
    const mask = after(state, 'mask-first');
    const normalized = after(state, 'mask-normalize');
    text(ctx, api, 'First token   /   empty prefix   /   temperature 1', 145, 265, 36, C.yellow);
    ['Candidate', 'Model logit', 'Before mask', 'Masked logit', 'After mask'].forEach((label, i) =>
      text(ctx, api, label, [150, 470, 770, 1130, 1500][i], 401, 32, C.muted),
    );
    tokens.forEach((token, i) => {
      const y = 515 + i * 117;
      const allowed = legal('', token);
      const color = mask ? (allowed ? C.green : C.muted) : C.ink;
      code(ctx, api, token, 155, y, 49, color);
      code(ctx, api, logits[i].toFixed(2), 475, y, 43);
      code(ctx, api, (raw[i] * 100).toFixed(1) + '%', 775, y, 43);
      if (mask) code(ctx, api, allowed ? logits[i].toFixed(2) : '−∞', 1135, y, 44, color);
      if (normalized) code(ctx, api, (filtered[i] * 100).toFixed(0) + '%', 1505, y, 50, color);
      api.line(ctx, 145, y + 35, 1750, y + 35, C.muted, 1);
    });
  });
}
export default {
  id: 'logit-mask',
  draw: drawLogitMask,
  cues: ['mask-inputs', 'mask-first', 'mask-normalize'],
};
