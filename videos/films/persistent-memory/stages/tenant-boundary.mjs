import { cue } from '../case-file.mjs';

export function drawTenantBoundary(ctx, scene, state, api) {
  const { C } = api;
  api.focus.target('tenant-boundary-construction', () => {
    if (state.beat === 1) {
      const owner = cue(api, 'rls-owner') >= 1;
      const bypass = cue(api, 'rls-bypass') >= 1;
      api.text(ctx, 'PostgreSQL row security', 116, 285, 46, C.ink, 'left', 'serif');
      const roles = [
        ['Ordinary subject role', 'Policy applies', C.green],
        [
          'Table owner',
          owner ? 'FORCE ROW LEVEL SECURITY applies' : 'Normally bypasses',
          owner ? C.green : C.yellow,
        ],
        ['Superuser or BYPASSRLS role', bypass ? 'Bypasses policy' : 'Privileged role', C.yellow],
      ];
      for (const [i, [name, result, color]] of roles.entries()) {
        const y = 441 + i * 165;
        api.line(ctx, 115, y - 70, 1780, y - 70, C.muted, 2);
        api.text(ctx, name, 115, y, 40, C.ink);
        api.text(ctx, result, 986, y, 37, color);
      }
      return;
    }
    const pool = state.beat === 2;
    const cleared = pool && cue(api, 'pool-clear') >= 1;
    const rebound = pool && cue(api, 'pool-rebind') >= 1;
    const tenant = rebound ? 'payments' : cleared ? null : 'billing';
    const rows = [
      { owner: 'billing', who: 'Ada', event: 'Billing replay 78291' },
      { owner: 'payments', who: 'Ada', event: 'Payments incident P9' },
    ];
    api.text(
      ctx,
      pool ? 'One pooled connection' : 'Private record owners',
      115,
      286,
      46,
      C.ink,
      'left',
      'serif',
    );
    for (const [i, row] of rows.entries()) {
      const y = 355 + i * 155;
      api.rect(ctx, 115, y, 817, 123, C.panel, null, 4);
      api.text(ctx, row.owner + ' / ' + row.who, 147, y + 47, 31, C.muted, 'left', 'mono');
      api.text(ctx, row.event, 147, y + 98, 39, tenant === row.owner ? C.ink : C.muted);
    }
    api.text(ctx, 'Authenticated transaction', 1018, 286, 44, C.ink, 'left', 'serif');
    api.text(
      ctx,
      tenant ? tenant + ' / Ada' : 'No scope',
      1018,
      426,
      48,
      tenant ? C.cyan : C.yellow,
      'left',
      'mono',
    );
    api.line(ctx, 1018, 486, 1779, 486, C.muted, 2);
    const allowed = rows.filter((row) => row.owner === tenant);
    api.text(
      ctx,
      allowed.length + (allowed.length === 1 ? ' private row returned' : ' private rows returned'),
      1018,
      563,
      38,
      C.muted,
    );
    if (allowed.length) api.text(ctx, allowed[0].event, 1018, 663, 48, C.green);
    if (!pool) {
      api.text(ctx, 'Also authorized for both teams', 118, 835, 35, C.muted);
      api.text(ctx, 'Reviewed webhook retry rule', 118, 916, 48, C.blue, 'left', 'serif');
    }
  });
}
export default {
  id: 'tenant-boundary',
  draw: drawTenantBoundary,
  cues: ['same-username', 'rls-owner', 'rls-bypass', 'pool-clear', 'pool-rebind'],
};
