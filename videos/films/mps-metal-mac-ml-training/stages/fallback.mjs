import { card, foot, target, text, withMpsRootFrame } from '../defaults.mjs';
export function paintFallback(ctx, scene, state, api, C, c, t, s) {
  text(
    ctx,
    api,
    C,
    'Follow Ticket 1 through one modeled missing kernel',
    960,
    275,
    37,
    C.ink,
    'center',
  );
  let pt;
  if (s.step === 0)
    pt = {
      x: 620 + (80 * s.travel) / 0.35,
      y: 390,
    };
  else if (s.travel < 0.35)
    pt = {
      x: 960,
      y: api.lerp(545, 710, s.travel / 0.35),
    };
  else if (s.travel < 0.72)
    pt = {
      x: api.lerp(960, 1560, (s.travel - 0.35) / 0.37),
      y: 710,
    };
  else
    pt = {
      x: 1560,
      y: api.lerp(710, 480, (s.travel - 0.72) / 0.28),
    };
  const route = (x1, y1, x2, y2, color = C.yellow) => {
    const lowX = pt.x - 76,
      highX = pt.x + 76,
      lowY = pt.y - 48,
      highY = pt.y + 48;
    if (y1 === y2 && y1 > lowY && y1 < highY) {
      const low = Math.min(x1, x2),
        high = Math.max(x1, x2);
      if (Math.min(high, lowX) - low > 4)
        api.line(ctx, low, y1, Math.min(high, lowX), y2, color, 5);
      if (high - Math.max(low, highX) > 4)
        api.line(ctx, Math.max(low, highX), y1, high, y2, color, 5);
    } else if (x1 === x2 && x1 > lowX && x1 < highX) {
      const low = Math.min(y1, y2),
        high = Math.max(y1, y2);
      if (Math.min(high, lowY) - low > 4)
        api.line(ctx, x1, low, x2, Math.min(high, lowY), color, 5);
      if (high - Math.max(low, highY) > 4)
        api.line(ctx, x1, Math.max(low, highY), x2, high, color, 5);
    } else api.line(ctx, x1, y1, x2, y2, color, 5);
  };
  card(ctx, api, C, c, 'MPS operation', 160, 345, 400, 90, C.cyan, 32);
  target(ctx, api, 'missing-kernel', () =>
    card(ctx, api, C, c, 'No MPS kernel', 760, 345, 400, 90, C.pink, 32),
  );
  card(
    ctx,
    api,
    C,
    c,
    'Next MPS operation',
    1360,
    345,
    400,
    90,
    s.returned ? C.green : C.muted,
    29,
  );
  route(560, 390, 760, 390, C.cyan);
  if (s.enabled) {
    target(ctx, api, 'cpu-fallback', () =>
      text(ctx, api, C, 'CPU execution · fallback', 1210, 850, 36, C.yellow, 'center'),
    );
    route(960, 470, 960, 710);
    route(960, 710, 1560, 710);
    route(1560, 710, 1560, 480);
  }
  target(ctx, api, 'detour-ticket', () =>
    card(ctx, api, C, c, 'T1', pt.x - 60, pt.y - 32, 120, 64, s.enabled ? C.yellow : C.pink, 28),
  );
  if (!s.enabled)
    text(ctx, api, C, 'The operation blocks this step', 960, 940, 42, C.pink, 'center');
  else
    target(ctx, api, 'fallback-setting', () =>
      api.text(ctx, 'PYTORCH_ENABLE_MPS_FALLBACK=1', 960, 970, 35, C.yellow, 'center', 'mono'),
    );
  foot(
    ctx,
    api,
    C,
    s.enabled
      ? 'Set before importing PyTorch · measure repeated detours'
      : 'Operator coverage depends on the installed PyTorch stack',
  );
}
function selectStage(ctx, scene, state, api, C, c, t, s) {
  paintFallback(ctx, scene, state, api, C, c, t, s);
}
export function drawFallbackStage(ctx, scene, state, api) {
  withMpsRootFrame(ctx, scene, state, api, selectStage);
}
export default {
  id: 'fallback',
  draw: drawFallbackStage,
  cues: ['missing-operator', 'cpu-detour'],
};
