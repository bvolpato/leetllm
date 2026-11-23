import {
  drawSemanticCard,
  drawSemanticText,
  withSemanticConstructionFrame,
  withSemanticLegacyFrame,
} from '../defaults.mjs';
export function paintGates(ctx, scene, state, api, themeColors, c, t, s, currentBeat) {
  drawSemanticText(
    ctx,
    api,
    themeColors,
    `Stored release R7 · current release ${s.requestScope.release} · clock ${s.now}`,
    140,
    280,
    32,
    themeColors.muted,
  );
  const checks = [
    ['Current permission', s.authorized, 'allowed'],
    ['Scope check', s.sameScope, `R7 ${s.sameScope ? '=' : '≠'} ${s.requestScope.release}`],
    ['Expiry check', s.fresh, `${s.now} ${s.fresh ? '<' : '='} 200`],
  ];
  const stop = checks.findIndex(([, pass]) => !pass),
    finalGate = stop < 0 ? 2 : stop;
  const centers = [395, 965, 1535];
  const path = [220, ...centers.slice(0, finalGate + 1), ...(stop < 0 ? [1740] : [])];
  const travelled = s.p * (path.length - 1),
    segment = Math.min(path.length - 2, Math.floor(travelled));
  checks.forEach(([label, pass, comparison], i) => {
    const reached = travelled >= i + 1;
    api.focus.target('reuse-checks', () =>
      drawSemanticCard(
        ctx,
        api,
        themeColors,
        c,
        `${label}\n${reached ? comparison : '…'}`,
        150 + i * 570,
        395,
        490,
        reached ? (pass ? themeColors.green : themeColors.pink) : themeColors.muted,
        150,
      ),
    );
  });
  api.line(ctx, 160, 655, 1740, 655, themeColors.muted, 3);
  const candidateX = api.lerp(path[segment], path[segment + 1], travelled - segment);
  api.focus.target('stored-candidate', () =>
    drawSemanticCard(
      ctx,
      api,
      themeColors,
      c,
      'policy-R7\nanswer · 30 days',
      candidateX - 160,
      595,
      320,
      s.p >= 1 && stop >= 0 ? themeColors.pink : themeColors.cyan,
      120,
    ),
  );
  drawSemanticText(
    ctx,
    api,
    themeColors,
    'In storage     R7  ·  30 days',
    960,
    785,
    28,
    themeColors.cyan,
    'center',
  );
  const completed = s.p >= 1;
  api.focus.target('reuse-verdict', () =>
    drawSemanticCard(
      ctx,
      api,
      themeColors,
      c,
      completed
        ? s.accepted
          ? 'Serve approved candidate'
          : [
              'Permission denied',
              'Release changed  ·  Read the current policy',
              'Record expired  ·  Read the current policy',
            ][stop]
        : 'Check the current request before serving',
      250,
      825,
      1420,
      completed ? (s.accepted ? themeColors.green : themeColors.pink) : themeColors.muted,
      90,
    ),
  );
  drawSemanticText(
    ctx,
    api,
    themeColors,
    'Tenant · access · release · locale · schema bound to trusted metadata',
    960,
    970,
    28,
    themeColors.muted,
    'center',
  );
}
export function drawGates(ctx, scene, state, api) {
  if (withSemanticConstructionFrame(ctx, scene, state, api, paintGates)) return;
  withSemanticLegacyFrame(ctx, scene, state, api, paintGates);
}
export default {
  id: 'gates',
  draw: drawGates,
  cues: ['trusted-scope', 'release-change', 'expiration-boundary'],
};
