import { issuerMatches } from '../model.mjs';
import { chip, codePanel, footer, line, text } from '../defaults.mjs';
export function drawHttpIdentity(ctx, scene, state, api) {
  return api.focus.target('http-identity-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    const cueVisible = (key) => api.focus.visible(`t-http-identity-${key}`);
    const cueComplete = (key) => api.focus.cue(`t-http-identity-${key}`)?.phase === 'after';
    {
      if (currentBeat === 0) {
        text(
          ctx,
          api,
          'Read request to local deployments service',
          155,
          286,
          41,
          themeColors.ink,
          'left',
        );
        api.focus.target('origin-fields', () => {
          text(ctx, api, 'Browser origin', 155, 410, 36, themeColors.muted, 'left');
          text(ctx, api, 'Allowed here', 155, 517, 36, themeColors.muted, 'left');
          text(ctx, api, 'Token audience', 155, 624, 36, themeColors.muted, 'left');
          text(ctx, api, 'https://reports.example', 650, 410, 44, themeColors.blue, 'left');
          text(ctx, api, 'https://console.example', 650, 517, 44, themeColors.ink, 'left');
          text(ctx, api, 'deployments   ·   valid', 650, 624, 41, themeColors.cyan, 'left');
        });
        line(ctx, api, 155, 683, 1725, 683, themeColors.muted, 2);
        api.focus.target('origin-result', () => {
          text(
            ctx,
            api,
            cueComplete('origin')
              ? 'present invalid Origin → HTTP 403 before tool dispatch'
              : 'Can the local service dispatch this read?',
            960,
            807,
            42,
            cueComplete('origin') ? themeColors.yellow : themeColors.ink,
          );
        });
      } else if (currentBeat === 1) {
        codePanel(
          ctx,
          api,
          'validated discovery',
          [
            'protected-resource metadata',
            'authorization server + PKCE support',
            'saved issuer for this flow',
          ],
          150,
          340,
          750,
          360,
          themeColors.blue,
        );
        codePanel(
          ctx,
          api,
          'bound OAuth flow',
          [
            'authorization request: resource R',
            'token request: resource R',
            'token audience: MCP resource R',
          ],
          1030,
          340,
          750,
          360,
          themeColors.cyan,
        );
        if (cueVisible('issuer'))
          chip(
            ctx,
            api,
            'flow-specific saved issuer: https://auth.example/',
            370,
            790,
            1180,
            themeColors.yellow,
            75,
            30,
          );
        footer(
          ctx,
          api,
          'This teaches profile checks; the local public fixture does not execute an OAuth flow.',
        );
      } else {
        const rows = [
          [
            'https://auth.example/',
            issuerMatches('https://auth.example/', 'https://auth.example/', true),
          ],
          [
            'https://AUTH.example/',
            issuerMatches('https://auth.example/', 'https://AUTH.example/', true),
          ],
          ['absent · support advertised', issuerMatches('https://auth.example/', undefined, true)],
          [
            'absent · support not advertised',
            issuerMatches('https://auth.example/', undefined, false),
          ],
        ];
        text(ctx, api, 'saved issuer = https://auth.example/', 960, 260, 34, themeColors.blue);
        rows.forEach(([value, match], i) => {
          const y = 335 + i * 125;
          chip(ctx, api, value, 170, y, 1030, themeColors.blue, 74, 29);
          if (
            i < 2
              ? cueComplete('exact')
              : i === 2
                ? cueComplete('missing')
                : cueComplete('unadvertised')
          )
            chip(
              ctx,
              api,
              match ? 'issuer check passes' : 'reject response',
              1320,
              y,
              460,
              match ? themeColors.cyan : themeColors.red,
              74,
              29,
            );
        });
        footer(
          ctx,
          api,
          cueVisible('audience')
            ? 'Incoming MCP token is not a downstream API credential. Obtain separate authorization.'
            : 'Compare the returned issuer exactly, including on authorization error responses.',
        );
      }
    }
  });
}
export default {
  id: 'http-identity',
  draw: drawHttpIdentity,
  cues: [
    'http-origin-fields',
    't-http-identity-origin',
    't-http-identity-resource',
    't-http-identity-issuer',
    't-http-identity-exact',
    't-http-identity-missing',
    't-http-identity-unadvertised',
    't-http-identity-audience',
  ],
};
