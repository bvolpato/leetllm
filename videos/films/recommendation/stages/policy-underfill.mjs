import { ranked } from '../construction.mjs';
import { sourceIdentity } from '../arithmetic.mjs';
import { sourceSlate } from '../model.mjs';
import { cueProgress, drawRecommendationDocument } from '../defaults.mjs';

const full = sourceSlate();
const limited = sourceSlate({ onlySource: 'platform' });
const rows = ranked.slice(0, ranked.findIndex((page) => page.id === full.selected.at(-1)) + 1);

export function paintPolicyUnderfill(ctx, scene, state, api) {
  const { C } = api;
  const walk = cueProgress(state, api, 'slate-capacity', 1, 0.02, 0.57);
  const reset = cueProgress(state, api, 'slate-withdraw', 1, 0.58, 0.77);
  const replay = cueProgress(state, api, 'slate-two', 2, 0.01, 0.23);
  const result = reset === 1 ? limited : full;
  const progress = reset === 1 ? replay : walk * (1 - reset);
  const step = (i) => api.clamp(progress * (reset === 1 ? limited.order.length : rows.length) - i);
  const spent = rows.filter(
    (d, i) =>
      sourceIdentity(d.id) === 'platform' && result.selected.includes(d.id) && step(i) === 1,
  ).length;
  const label = (v, x, y, size, color, align = 'left') =>
    api.text(ctx, v, x, y, size, color, align);
  label(reset === 1 ? 'Platform-only reserve' : 'Scored reserve', 140, 264, 39, C.ink);
  label('First screen', 1130, 264, 39, C.ink);
  label('Platform places', 1160, 899, 31, C.muted);
  for (let i = 0; i < 2; i++) {
    const used = i < spent;
    api.rect(ctx, 1420 + i * 130, 856, 112, 62, used ? C.blue : C.panel, C.blue, 8);
    label(used ? 'used' : 'free', 1476 + i * 130, 897, 28, used ? C.bg : C.muted, 'center');
  }

  for (let i = 0; i < 3; i++) {
    const y = 333 + i * 128;
    label(String(i + 1), 1750, y + 55, 33, C.muted);
    api.rect(ctx, 1128, y, 590, 88, C.panel, C.muted, 9);
  }

  rows.forEach((doc, i) => {
    const platform = sourceIdentity(doc.id) === 'platform';
    if (!platform && reset === 1) return;
    const q = !platform && reset > 0 ? 1 : step(i);
    const slot = result.selected.indexOf(doc.id);
    const y = 338 + i * 128;
    let x = 145,
      destY = y;
    if (slot >= 0) {
      x = api.lerp(145, 1140, api.ease(api.clamp(q / 0.72)));
      destY = api.lerp(y, 338 + slot * 128, api.ease(api.clamp((q - 0.72) / 0.28)));
    } else {
      x += 275 * api.ease(q);
    }
    ctx.save();
    if (!platform) ctx.globalAlpha *= 1 - api.clamp(reset * 3);
    drawRecommendationDocument(ctx, api, C, doc, x, destY, {
      w: 560,
      h: 78,
      subtitle: sourceIdentity(doc.id),
      muted: slot < 0 && q === 1,
    });
    ctx.restore();
  });
  if (progress === 1 && reset === 0)
    label('SDK example held at the two-page cap', 141, 965, 32, C.yellow);
  if (reset === 1 && replay === 0)
    label('How many pages can this portal show?', 140, 967, 40, C.yellow);
  if (replay === 1) {
    label('Empty', 1173, 645, 38, C.muted);
    label(
      result.selected.length + ' pages shown   ·   another eligible source needed',
      141,
      969,
      36,
      C.yellow,
    );
  }
}
export default {
  id: 'policy-underfill',
  draw: paintPolicyUnderfill,
  cues: ['policy-underfill-b1', 'slate-capacity', 'slate-withdraw', 'slate-two'],
};
