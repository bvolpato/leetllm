// Scene 05: projection: Shared 4x2 projection matrix E computing mean brightness (2.5) and left-right contrast (1.0).
import {
  COSMOS,
  E,
  ROLE,
  aura,
  bindCueBeat,
  embedded,
  group,
  guardedDynamic,
  heroTitle,
  patches,
  playCue,
  txt,
} from '../parts.mjs';

export default function projection(s, c) {
  const rowActive = s.value(1); // 1..4 accumulating contributions of pixels [0, 1, 4, 5]
  const showAll = s.value(0);

  const bgAura = aura(0, 0, 740, '#123a5e28', '#103c3618');
  const title = heroTitle(['Shared Patch Projection:', 'mean & contrast'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: ROLE.patch,
  });

  const p0 = patches[0]; // [0, 1, 4, 5]
  const stageVis = s.value(1);

  const layer = guardedDynamic(stageVis, (alpha) => {
    const k = Math.round(rowActive.value);
    const all = showAll.value;
    const nodes = [
      txt('PIXEL x_i', -855, -210, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
      txt('COL 1 (×0.25 MEAN)', -540, -210, 26, ROLE.patch, 'mono', 'left').opacity(alpha),
      txt('COL 2 (±0.5 CONTRAST)', -90, -210, 26, ROLE.warn, 'mono', 'left').opacity(alpha),
    ];

    let sumM = 0;
    let sumC = 0;
    p0.forEach((px, idx) => {
      const y = -125 + idx * 82;
      const active = idx < k;
      const mTerm = px * E[idx][0];
      const cTerm = px * E[idx][1];
      if (active) {
        sumM += mTerm;
        sumC += cTerm;
      }
      const aRow = (active ? 1 : 0.25) * alpha;
      nodes.push(
        txt(
          `pixel ${idx}:  ${px}`,
          -855,
          y,
          30,
          active ? COSMOS.ink : COSMOS.dim,
          'mono',
          'left',
        ).opacity(alpha),
        txt(
          `${px} × ${E[idx][0].toFixed(2)} = ${mTerm.toFixed(2)}`,
          -540,
          y,
          30,
          ROLE.patch,
          'mono',
          'left',
        ).opacity(aRow),
        txt(
          `${px} × (${E[idx][1] >= 0 ? '+' : ''}${E[idx][1].toFixed(1)}) = ${cTerm >= 0 ? '+' : ''}${cTerm.toFixed(2)}`,
          -90,
          y,
          30,
          ROLE.warn,
          'mono',
          'left',
        ).opacity(aRow),
      );
    });

    nodes.push(
      txt(
        `Running Token = [ ${sumM.toFixed(2)},  ${sumC.toFixed(2)} ]`,
        -855,
        255,
        38,
        k >= 4 ? ROLE.ok : ROLE.pos,
        'mono',
        'left',
      )
        .glow(10, k >= 4 ? ROLE.ok : ROLE.pos)
        .opacity(alpha),
    );

    if (all > 0.05) {
      nodes.push(
        txt(
          `All 4 patches projected with same E:  ${embedded.map((v) => `[${v[0].toFixed(1)},${v[1].toFixed(1)}]`).join('  ')}`,
          -855,
          350,
          26,
          ROLE.ok,
          'mono',
          'left',
        ).opacity(all * alpha),
      );
    }
    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'projection-one', (d) => s.play(rowActive.to(2, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'projection-four', (d) => s.play(rowActive.to(3, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'projection-five', (d) => s.play(rowActive.to(4, { duration: d })), { dur: 0.35 });
  playCue(
    s,
    c,
    'projection-projected-patch-result-b3-1',
    (d) => s.play(showAll.to(1, { duration: d })),
    { dur: 0.5 },
  );
  bindCueBeat(s, c, s.value(0), [
    'projection-shared-patch-projection-b1-1',
    'projection-patch-column-products-b2-1',
  ]);
}
