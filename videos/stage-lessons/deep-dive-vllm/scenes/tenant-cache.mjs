// Scene 25: Who assigns the cache namespace? (Orchard & Meadow send the same 4 tokens; gateway injects unguessable cache_salt namespaces; changing Orchard to Adapter B triggers a correctness-preserving cache miss).
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function tenantCache(s, c) {
  // step: 0=tenant-second (Orchard & Meadow send same 4 tokens under Adapter A with separate cache_salt), 1=tenant-enforce (gateway authenticates & assigns unguessable salt), 2=tenant-adapter (Orchard switches to Adapter B -> MISS -> compute under B)
  const step = s.value(0);

  const bgAura = aura(0, 20, 620, '#6ee7b71a', '#a78bfa18');
  const title = heroTitle(['Who Assigns the', 'Cache Namespace?'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: ROLE.good,
    eyebrow: 'MULTI-TENANT ISOLATION · GATEWAY CACHE_SALT · ADAPTER SAFETY',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const orchardAdapter = st >= 2 ? 'B' : 'A';
    const nodes = [];

    // Column headers
    const cols = [
      { label: 'GROUP', x: -700, w: 300 },
      { label: 'GATEWAY SALT', x: -335, w: 370 },
      { label: 'FIRST BLOCK', x: 70, w: 380 },
      { label: 'ADAPTER', x: 425, w: 270 },
      { label: 'CACHE RESULT', x: 725, w: 280 },
    ];
    cols.forEach(({ label, x }) => {
      nodes.push(txt(label, x, -240, 26, COSMOS.muted, 'mono'));
    });

    const rows = [
      {
        group: 'Orchard',
        salt: 'salt: orchard_9f3a',
        tokens: 'same 4 tokens',
        adapter: `Adapter ${orchardAdapter}`,
        result: st >= 2 ? 'MISS (new B)' : 'Hash H_orch_A',
        col: st >= 2 ? COSMOS.gold : ROLE.kv,
      },
      {
        group: 'Meadow',
        salt: 'salt: meadow_4c8b',
        tokens: 'same 4 tokens',
        adapter: 'Adapter A',
        result: 'Hash H_mead_A',
        col: ROLE.r1,
      },
    ];

    rows.forEach((r, ri) => {
      const cy = -145 + ri * 140;
      const vals = [r.group, r.salt, r.tokens, r.adapter, r.result];
      vals.forEach((val, ci) => {
        const isSalt = ci === 1;
        const isAdpMiss = ri === 0 && ci >= 3 && st >= 2;
        const stroke = isAdpMiss ? COSMOS.gold : isSalt && st >= 1 ? ROLE.good : r.col;
        const fill = isAdpMiss ? '#29200e' : isSalt && st >= 1 ? '#0e2924' : '#101a2e';
        nodes.push(
          glassCell(cols[ci].x, cy, cols[ci].w, 102, stroke, {
            fill,
            glow: isAdpMiss || (isSalt && st >= 1) ? 10 : 4,
          }),
          txt(val, cols[ci].x, cy, 26, isAdpMiss ? COSMOS.gold : COSMOS.ink, 'mono'),
        );
      });
    });

    // Bottom security & semantics panel
    const panelCol = st >= 2 ? COSMOS.gold : st === 1 ? ROLE.good : ROLE.kv;
    const panelHead =
      st >= 2
        ? 'ADAPTER CHANGE (A -> B) INSIDE ORCHARD’S NAMESPACE'
        : st === 1
          ? 'ONLY THE AUTHENTICATING GATEWAY SETS CACHE_SALT'
          : 'SALT ENTERS BLOCK 0 HASH -> ALL LATER BLOCKS INHERIT VIA PARENT HASH';
    const panelBody =
      st >= 2
        ? 'Cache miss preserves correctness: compute under B (model, tokenizer & media must also match)'
        : st === 1
          ? 'Unguessable salts curb cross-tenant cache timing; still authorize docs, memory & internal traffic'
          : 'Identical words from Orchard and Meadow never collide or leak across namespaces';

    nodes.push(
      glassCell(0, 195, 1690, 152, panelCol, {
        fill: st >= 2 ? '#231c0e' : st === 1 ? '#0d2922' : '#0e202c',
        glow: 9,
      }),
      txt(panelHead, 0, 162, 26, panelCol, 'mono'),
      txt(panelBody, 0, 222, 26, COSMOS.ink, 'sans'),
    );

    nodes.push(
      txt(
        'Never let untrusted clients choose their own cache namespace string',
        0,
        378,
        26,
        COSMOS.muted,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  wireStepCues(s, c, step, [
    ['tenant-second', 0],
    ['tenant-enforce', 1],
    ['tenant-adapter', 2, true],
  ]);
}
