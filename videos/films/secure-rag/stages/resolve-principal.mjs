import { principalResolutionState } from '../construction.mjs';
import { drawOriginalCard, drawOriginalLink, drawOriginalText } from '../defaults.mjs';
export function drawResolvePrincipal(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1),
    phaseForBeat = (i) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, 0.07, 0.9);
  {
    const current = principalResolutionState(state),
      inputs = current.inputs;
    const caller = api.focus.target('authenticated-caller', () =>
      drawOriginalCard(ctx, api, 'Authenticated caller', 180, 405, 440, themeColors.blue, 1, 100),
    );
    const tenant = api.focus.target('tenant-scope', () =>
      drawOriginalCard(
        ctx,
        api,
        'Tenant ' + inputs.caller.tenant,
        775,
        350,
        350,
        themeColors.cyan,
        current.tenant,
        85,
      ),
    );
    const group = api.focus.target('group-scope', () =>
      drawOriginalCard(
        ctx,
        api,
        'Operations group',
        775,
        510,
        350,
        themeColors.green,
        current.group,
        85,
      ),
    );
    const trusted = drawOriginalCard(
      ctx,
      api,
      'Trusted principal',
      1350,
      435,
      390,
      themeColors.green,
      current.principal,
      100,
    );
    drawOriginalLink(ctx, api, caller, tenant, current.tenant);
    drawOriginalLink(ctx, api, caller, group, current.group, themeColors.green);
    drawOriginalLink(ctx, api, tenant, trusted, current.principal);
    drawOriginalLink(ctx, api, group, trusted, current.principal, themeColors.green);
    const requested = api.focus.target('requested-resource-read', () =>
      drawOriginalCard(
        ctx,
        api,
        `Read ${inputs.requested.recordId} · ${inputs.requested.title}`,
        170,
        650,
        700,
        themeColors.cyan,
        current.read,
        110,
        29,
      ),
    );
    if (current.grants) {
      let grant;
      api.focus.target('document-current-grant', () =>
        components.fade(current.grants, () => {
          grant = components.panel(
            {
              x: 1050,
              y: 635,
              width: 700,
              height: 145,
              fill: themeColors.panel,
              stroke: themeColors.yellow,
              padding: 12,
            },
            () => {
              drawOriginalText(
                ctx,
                api,
                `${inputs.requested.recordId} current resource grant`,
                1400,
                675,
                29,
                themeColors.yellow,
              );
              drawOriginalText(
                ctx,
                api,
                `${inputs.resource.currentGrants.join(', ') || 'no grant'} · source policy ${inputs.resource.sourceRevision}`,
                1400,
                720,
                28,
                themeColors.ink,
              );
              drawOriginalText(
                ctx,
                api,
                `Record revision ${inputs.resource.recordRevision} · ${inputs.resource.deleted ? 'deleted' : 'active'} · ${inputs.resource.valid ? 'valid' : 'invalid'}`,
                1400,
                760,
                26,
                themeColors.muted,
              );
            },
          );
        }),
      );
      if (current.read)
        drawOriginalLink(
          ctx,
          api,
          requested,
          grant,
          Math.min(current.read, current.grants),
          themeColors.yellow,
        );
      drawOriginalText(
        ctx,
        api,
        `Read policy: ${inputs.allowed ? 'ALLOW' : 'DENY'} ${inputs.requested.recordId} · caller ∧ requested read ∧ current grant`,
        960,
        990,
        29,
        inputs.allowed ? themeColors.green : themeColors.pink,
      );
    }
    drawOriginalCard(
      ctx,
      api,
      'Request says: security group',
      170,
      835,
      700,
      themeColors.pink,
      1,
      85,
      30,
    );
    api.focus.target('missing-identity', () =>
      drawOriginalCard(
        ctx,
        api,
        'Missing identity → hold retrieval',
        1050,
        835,
        700,
        themeColors.yellow,
        Math.max(phaseForBeat(2), Number(api.focus.progress('resolve-principal-b3-1', 0) > 0)),
        85,
        29,
      ),
    );
  }
}
export default {
  id: 'resolve-principal',
  draw: drawResolvePrincipal,
  cues: [
    'resolve-principal-b1-1',
    'resolve-principal-b1-2',
    'resolve-principal-group',
    'resolve-principal-read',
    'resolve-principal-b2-1',
    'resolve-principal-b3-1',
  ],
};
