import { linearInterpolate } from '../arithmetic.mjs';
import { chip, dot, footer, line, text } from '../defaults.mjs';
export function drawReuseArithmetic(ctx, scene, state, api) {
  const hosts = ['incident assistant', 'operations console', 'IDE'];
  const services = ['status', 'policy', 'telemetry', 'traffic'];
  const pairs = hosts.length * services.length,
    roles = hosts.length + services.length;
  if (state.beat === 1) {
    const { C, focus } = api;
    text(ctx, api, roles + ' shared implementations', 175, 275, 42, C.cyan, 'left');
    text(ctx, api, pairs + ' possible connections', 1710, 275, 42, C.blue, 'right');
    services.forEach((name, column) => text(ctx, api, name, 740 + 290 * column, 395, 37, C.ink));
    hosts.forEach((name, row) => {
      const y = 500 + row * 140;
      text(ctx, api, name, 175, y + 13, 38, C.ink, 'left');
      services.forEach((_, column) => {
        const x = 740 + 290 * column;
        if (row === 2 && column === 3) {
          focus.target('pair-permission', () => {
            const revoked = focus.cue('reuse-revoke')?.phase === 'after';
            chip(
              ctx,
              api,
              revoked ? 'not permitted' : 'permitted',
              x - 138,
              y - 35,
              276,
              revoked ? C.yellow : C.green,
              70,
              29,
            );
          });
        } else dot(ctx, api, x, y, C.blue, 12);
      });
    });
    text(
      ctx,
      api,
      'Each position is a possible connection. Only the IDE traffic permission is shown.',
      960,
      922,
      31,
      C.muted,
    );
    return;
  }
  return api.focus.target('reuse-arithmetic-mechanism', () => {
    const { C: themeColors } = api;
    const cueProgress = (key) => api.focus.progress(`t-reuse-arithmetic-${key}`, 0),
      cueVisible = (key) => api.focus.visible(`t-reuse-arithmetic-${key}`);
    const cueComplete = (key) => api.focus.cue(`t-reuse-arithmetic-${key}`)?.phase === 'after';
    {
      hosts.forEach((v, i) => chip(ctx, api, v, 120, 315 + i * 170, 430, themeColors.blue));
      services.forEach((v, i) => chip(ctx, api, v, 1360, 270 + i * 145, 420, themeColors.cyan));
      const q = Math.max(cueProgress('count'), cueProgress('pairs'));
      if (!cueVisible('roles') || cueVisible('links'))
        hosts.forEach((_, i) =>
          services.forEach((_, j) => {
            const k = i * 4 + j,
              amount = Math.max(0, Math.min(1, q * pairs - k));
            if (amount) {
              const startY = 350 + i * 170;
              const tipX = linearInterpolate(550, 1360, amount);
              const tipY = linearInterpolate(startY, 305 + j * 145, amount);
              const countingHost = Math.min(hosts.length - 1, Math.floor(q * hosts.length));
              const color = i === countingHost ? themeColors.blue : themeColors.muted;
              line(ctx, api, 550, startY, tipX, tipY, color, i === countingHost ? 4 : 2);
            }
          }),
        );
      if (cueComplete('pairs'))
        text(
          ctx,
          api,
          `${hosts.length} × ${services.length} = ${pairs} pair-specific adapters`,
          960,
          245,
          35,
          themeColors.yellow,
        );
      if (cueVisible('roles')) {
        if (!cueVisible('links')) {
          chip(ctx, api, '3 host integrations', 650, 410, 590, themeColors.blue);
          chip(ctx, api, '4 reusable servers', 650, 560, 590, themeColors.cyan);
        }
        if (cueComplete('roles'))
          text(
            ctx,
            api,
            `${hosts.length} + ${services.length} = ${roles} shared implementations`,
            960,
            800,
            37,
            themeColors.cyan,
          );
      }
      footer(
        ctx,
        api,
        cueVisible('links')
          ? 'The same 12 possible connections retain separate authorization relationships.'
          : 'Count integration implementations separately from connections.',
      );
    }
  });
}
export default {
  id: 'reuse-arithmetic',
  draw: drawReuseArithmetic,
  cues: [
    't-reuse-arithmetic-count',
    't-reuse-arithmetic-pairs',
    't-reuse-arithmetic-roles',
    't-reuse-arithmetic-links',
    'reuse-revoke',
  ],
};
