import { clamp, motion } from '../arithmetic.mjs';
import { drawArrow, drawCell, drawFooter, drawRectangle, drawText } from '../defaults.mjs';
export function drawEgressAddresses(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cue = (name, index) => {
      const q = state.cues?.['sp-egress-addresses-' + name];
      if (state.cues && !q) throw Error('Missing current scene cue sp-egress-addresses-' + name);
      return q
        ? {
            q: q.phase === 'before' ? 0 : q.phase === 'after' ? 1 : q.progress,
            done: q.phase === 'after',
          }
        : {
            q: currentBeat < index ? 0 : currentBeat > index ? 1 : motion(progress),
            done: currentBeat > index || (currentBeat === index && progress > 0.8),
          };
    },
    resultComplete = (n, i) => cue(n, i).done;
  api.focus.target('sp-egress-addresses-mechanism', () => {
    const again = currentBeat > 0 || resultComplete('again', 0);
    drawCell(ctx, api, 'Request owner', 'tenant A / S8 / g4', 180, 310, 700, themeColors.blue);
    drawCell(ctx, api, 'Target name', 'api.vendor.test', 1010, 310, 700, themeColors.cyan);
    const rows = [
      ['attempt 1', '93.184.216.34', 'approved public', 'connected / pinned'],
      ['attempt 2', '10.0.0.7', 'private target', 'DENY new connection'],
    ];
    rows.slice(0, currentBeat < 2 ? (again ? 2 : 1) : 0).forEach(([name, ip, scope, result], i) => {
      const y = 520 + i * 180;
      drawCell(ctx, api, name, ip, 180, y, 520, i ? themeColors.pink : themeColors.green);
      drawCell(
        ctx,
        api,
        'Resolved-address policy',
        scope,
        820,
        y,
        450,
        i ? themeColors.pink : themeColors.green,
      );
      drawText(ctx, api, result, 1340, y + 65, 27, i ? themeColors.pink : themeColors.green);
      drawArrow(ctx, api, 715, y + 55, 790, y + 55, i ? themeColors.pink : themeColors.green);
    });
    if (currentBeat === 1)
      drawFooter(
        ctx,
        api,
        'Deny metadata / host-management / other-tenant routes, including IPv6 and mapped forms.',
      );
    else if (currentBeat === 2) {
      const broker = resultComplete('broker', 2);
      drawRectangle(ctx, api, 180, 520, 650, 250, themeColors.blue);
      drawText(ctx, api, 'Opaque capability', 210, 580, 32, themeColors.blue);
      drawText(ctx, api, 'tenant / g4 / resource / operation / expiry', 210, 650, 25);
      drawRectangle(ctx, api, 1050, 520, 660, 250, themeColors.yellow);
      drawText(ctx, api, 'Authenticated broker', 1080, 580, 32, themeColors.yellow);
      drawText(
        ctx,
        api,
        broker ? 'approved upstream TLS request' : 'recheck current scope',
        1080,
        650,
        28,
        broker ? themeColors.green : themeColors.yellow,
      );
      drawArrow(ctx, api, 850, 625, 1020, 625, themeColors.cyan);
      drawFooter(
        ctx,
        api,
        'Broker constructs the approved request; encrypted transit headers are not rewritten.',
      );
    } else
      drawFooter(
        ctx,
        api,
        'Name and TLS hostname stay bound to the validated destination for this connection.',
      );
  });
}
export default {
  id: 'egress-addresses',
  draw: drawEgressAddresses,
  cues: [
    'sp-egress-addresses-0',
    'sp-egress-addresses-pin',
    'sp-egress-addresses-again',
    'sp-egress-addresses-1',
    'sp-egress-addresses-2',
    'sp-egress-addresses-broker',
  ],
};
