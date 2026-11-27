// Scene 18: cache-key - Who can reuse these three tokens?
// Tokens [10, 20, 30]: Acme hits -> switch tenant to Contoso -> STRICT prediction pause ->
// Contoso MISSES! Plus vLLM parent-chained block hash + salt & prefix hit vs response hit!
import { group, line } from 'vizmatic/stage';
import { COSMOS, ROLE, aura, cinemaHeader, clampDur, guardedDynamic, txt } from '../parts.mjs';

export default function cacheKey(s, c) {
  const contosoOn = s.value(0);
  const missReveal = s.value(0); // STRICT after cc-key-miss!
  const chainOn = s.value(0);
  const respOn = s.value(0);

  const header = cinemaHeader('PREFIX CACHE KEY ISOLATION', 'Who can reuse', '[10, 20, 30]?', {
    x: -860,
    y: -445,
    accent: ROLE.model,
    size: 48,
  });

  const bgAura = aura(40, 20, 680, '#a78bfa1a', '#f43f5e16');

  const view = guardedDynamic(
    () => 1,
    () => {
      const cn = contosoOn.value;
      const ms = missReveal.value;
      const ch = chainOn.value;
      const rs = respOn.value;
      const nodes = [];

      const lx = -840;
      nodes.push(
        txt(
          'CACHED ENTRY:  tokens=[10, 20, 30] · tenant=ACME · pol=7 · adapter=v1',
          lx,
          -180,
          26,
          ROLE.ok,
          'mono',
          'left',
        ),
        txt(
          cn > 0.4
            ? 'INCOMING REQ:  tokens=[10, 20, 30] · tenant=CONTOSO · pol=7 · adapter=v1'
            : 'INCOMING REQ:  tokens=[10, 20, 30] · tenant=ACME · pol=7 · adapter=v1',
          lx,
          -115,
          26,
          cn > 0.4 ? (ms > 0.4 ? ROLE.fail : ROLE.focus) : ROLE.ok,
          'mono',
          'left',
        ),
        txt(
          ms > 0.4
            ? 'VERDICT: CONTOSO MISSES (MUST PREFILL! TENANT IS PART OF CACHE PARTITION!)'
            : cn > 0.4
              ? 'CAN CONTOSO REUSE ACME’S CACHED ENTRY?  [ ? ]'
              : 'ACME MATCHES ALL FIELDS -> PREFIX HIT!',
          lx,
          -45,
          26,
          ms > 0.4 ? ROLE.fail : cn > 0.4 ? ROLE.focus : ROLE.ok,
          'mono',
          'left',
        ).glow(ms > 0.4 ? 8 : 0, ROLE.fail),
      );

      // Middle: vLLM chained block hash + salt
      const chAlpha = 0.4 + ch * 0.6;
      nodes.push(
        line([-840, 22], [840, 22], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt(
          'vLLM BLOCK HASH = hash(parent_block_hash, token_ids, adapter, trust_group_salt)',
          0,
          82,
          26,
          ROLE.ed,
          'mono',
          'center',
        ).opacity(chAlpha),
        txt(
          'Editing header changes parent hash -> invalidates downstream blocks · Gateway verifies trust group first!',
          0,
          138,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ).opacity(chAlpha),
      );

      // Bottom: Prefix Hit vs Response Hit
      const rsAlpha = 0.35 + rs * 0.65;
      nodes.push(
        line([-840, 205], [840, 205], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt(
          'PREFIX HIT: saves prefill, still decodes',
          -430,
          270,
          26,
          ROLE.ok,
          'mono',
          'center',
        ).opacity(rsAlpha),
        txt(
          'RESPONSE HIT: finished text (match full config!)',
          430,
          270,
          26,
          ROLE.model,
          'mono',
          'center',
        ).opacity(rsAlpha),
        txt(
          'Track BOTH hit rates separately · Editor still checks snapshot at paint & Tab',
          0,
          330,
          26,
          COSMOS.muted,
          'sans',
          'center',
        ).opacity(rsAlpha),
        txt('COMPOSITE KEY', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt(
          'Tokens + Tenant + Policy + Adapter + KV',
          480,
          -378,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  c.on('cc-key-tenant', () => {
    s.play(contosoOn.to(1, { duration: clampDur(c, c.cue('cc-key-tenant').start, 0.35) }));
  });
  c.after('cc-key-miss', () => {
    s.play(missReveal.to(1, { duration: clampDur(c, c.cue('cc-key-miss').end, 0.35) }));
  });
  c.on('cc-key-parent-change', () => {
    s.play(chainOn.to(1, { duration: clampDur(c, c.cue('cc-key-parent-change').start, 0.4) }));
  });
  c.on('cc-key-response', () => {
    s.play(respOn.to(1, { duration: clampDur(c, c.cue('cc-key-response').start, 0.4) }));
  });
}
