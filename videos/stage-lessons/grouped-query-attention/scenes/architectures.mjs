// Scene 04: architectures - Signature orbiting 3D GQA head-sharing manifold (MHA -> GQA -> MQA).
import {
  COSMOS,
  HEADS,
  ROLE,
  buildHeadManifold3d,
  cinemaAtmosphere,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  orbitScene,
  playCue,
  rect,
  runPhase,
  txt,
} from '../parts.mjs';

export default function architectures(s, c) {
  const mode = s.value(1); // 0=MHA(8), 1=GQA(2), 2=MQA(1)
  const kvCount = s.value(HEADS.gqaKV);
  const phase = s.value(0);
  const stageIdx = s.value(0); // 0=intro, 1=mha, 2=gqa, 3=mqa, 4=four, 5=eight, 6=learned

  const { view: manifold3d } = buildHeadManifold3d(mode, phase, {
    x: 345,
    y: -15,
    tokenSlots: 3,
    theta: -0.78,
    phi: 1.04,
    distance: 15.6,
    unit: 102,
  });

  const title = heroTitle(['Eight readers,', 'three KV layouts'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.query,
    eyebrow: 'MHA · GQA · MQA SPECTRUM',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(stageIdx.value);
    const kv = kvCount.value;
    const nodes = [];

    // Active architecture name & key metric (always true for current state, A8)
    const archMap = [
      {
        name: 'Stored histories',
        ratio: '2 KV heads',
        sub: '8 query heads stay distinct',
        col: ROLE.query,
      },
      {
        name: 'Multi-head attention',
        ratio: '8 KV heads · 1× cache',
        sub: '1 private history per query head',
        col: ROLE.key,
      },
      {
        name: 'Grouped-query attention',
        ratio: '2 KV heads · ¼ cache',
        sub: '4 queries share each KV group',
        col: ROLE.query,
      },
      {
        name: 'Multi-query attention',
        ratio: '1 KV head · ⅛ cache',
        sub: 'All 8 queries read 1 shared KV head',
        col: ROLE.gold,
      },
      {
        name: 'Grouped-query attention',
        ratio: '¼ of MHA cache',
        sub: '2 stored heads at fixed length & width',
        col: ROLE.query,
      },
      {
        name: 'Multi-query attention',
        ratio: '⅛ of MHA cache',
        sub: 'All 8 queries share one learned KV subspace',
        col: ROLE.gold,
      },
      {
        name: 'Grouped-query attention',
        ratio: '2 learned KV subspaces',
        sub: 'Balance cache savings vs task quality',
        col: ROLE.value,
      },
    ];
    const info = archMap[Math.max(0, Math.min(archMap.length - 1, st))];

    nodes.push(
      txt(info.name, -855, -205, 42, info.col, 'serif', 'left').glow(7, info.col),
      txt(info.ratio, -855, -135, 36, ROLE.gold, 'mono', 'left').glow(6, ROLE.gold),
      txt(info.sub, -855, -72, 28, COSMOS.muted, 'sans', 'left'),
    );

    // Luminous proportional KV head gauge (0..8 stored heads)
    const barX = -855;
    const barY = 60;
    const barW = 470;
    const fillW = Math.max(8, (kv / HEADS.queries) * barW);
    nodes.push(
      txt(
        'STORED KV HEADS (FIXED LENGTH & WIDTH)',
        barX,
        barY - 46,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ),
      rect(barW, 44, { fill: '#0e1528', stroke: '#2c3d66', width: 2, radius: 8 }).at(
        barX + barW / 2,
        barY,
      ),
      lumBar(barX + fillW / 2, barY, fillW, 38, {
        color: info.col,
        fillOpacity: 0.55,
        strokeWidth: 2.4,
        glow: 10,
        radius: 6,
      }),
      txt(`${Math.round(kv)} / 8`, barX + barW + 22, barY, 32, info.col, 'mono', 'left'),
    );

    // Three luminous spectrum milestones below the bar (zero boxes!)
    const specs = [
      { label: 'MHA', val: '8 KV', x: -775, active: st === 1, col: ROLE.key },
      {
        label: 'GQA',
        val: '2 KV',
        x: -585,
        active: st === 2 || st === 4 || st === 6,
        col: ROLE.query,
      },
      { label: 'MQA', val: '1 KV', x: -395, active: st === 3 || st === 5, col: ROLE.gold },
    ];
    for (const sp of specs) {
      const op = sp.active ? 1 : 0.4;
      nodes.push(
        txt(sp.label, sp.x, 180, 32, sp.col, 'mono', 'center')
          .glow(sp.active ? 8 : 0, sp.col)
          .opacity(op),
        txt(sp.val, sp.x, 226, 26, COSMOS.ink, 'mono', 'center').opacity(op),
      );
    }

    // 3D viewport caption
    nodes.push(
      txt('3D QUERY-TO-KV CONDUIT MANIFOLD', 345, -425, 26, ROLE.query, 'mono', 'center').glow(
        5,
        ROLE.query,
      ),
      txt(
        'Cyan: 8 query heads  ·  Blue/Green: stored K/V slabs',
        345,
        462,
        26,
        COSMOS.muted,
        'sans',
        'center',
      ),
    );

    return group(...nodes);
  });

  s.add(cinemaAtmosphere(ROLE.query, ROLE.key), manifold3d, title, live);
  runPhase(s, c, phase, 16);
  orbitScene(s, c, manifold3d, { theta: -0.18, phi: 0.92 });

  const transitions = [
    ['mha', 0, HEADS.mhaKV, 1],
    ['gqa', 1, HEADS.gqaKV, 2],
    ['mqa', 2, HEADS.mqaKV, 3],
    ['four', 1, HEADS.gqaKV, 4],
    ['eight', 2, HEADS.mqaKV, 5],
    ['learned', 1, HEADS.gqaKV, 6],
  ];
  for (const [cue, targetMode, targetKv, idx] of transitions) {
    playCue(
      s,
      c,
      cue,
      (d) =>
        s.play(
          mode.to(targetMode, { duration: d }),
          kvCount.to(targetKv, { duration: d }),
          stageIdx.to(idx, { duration: Math.min(0.2, d) }),
        ),
      { after: true, dur: 0.55 },
    );
  }
}
