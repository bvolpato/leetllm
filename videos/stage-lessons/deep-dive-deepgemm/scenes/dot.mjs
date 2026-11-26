// Scene 03: One output element accumulates matching coordinates.
// Row A[0]=[1,2] . B[0]=[3,4] = 11; Row A[1]=[0,-1] . B[0]=[3,4] = -4; 2x2 NT tile [[11,-1],[-4,1]].
import {
  COSMOS,
  ROLE,
  TILE_DONE,
  aura,
  buildFp8WgmmaCube3d,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function dot(s, c) {
  const phase = s.value(0);
  const kCursor = s.value(0);
  const promoVal = s.value(0.15);
  const step = s.value(0); // 1=pair, 2=sum=11, 3=row2=-4, 4=NT eq, 5=2x2 tile, 6=TC

  const bgAura = aura(445, 20, 520, '#60a5fa22', '#ff6b8b18');
  const { view: cube3d } = buildFp8WgmmaCube3d(kCursor, promoVal, phase, {
    x: 455,
    y: 15,
    unit: 94,
  });

  const title = heroTitle(['Accumulate Matching', 'Coordinates'], {
    x: -860,
    y: -420,
    size: 56,
    lineHeight: 66,
    accent: ROLE.a,
    eyebrow: 'NT DOT PRODUCT · SHARED K AXIS',
    subtitle: 'Pair activation row with stored weight row',
  });

  const ntEq = glowTex('D = C + A B^{\\top}', { x: -640, y: 245, size: 42, color: ROLE.gold });

  const live = guardedDynamic(1, () => {
    const st = step.value;
    const useRow1 = st >= 2.5;
    const aRow = useRow1 ? TILE_DONE.a[1] : TILE_DONE.a[0];
    const bRow = TILE_DONE.z[0];
    const p0 = aRow[0] * bRow[0];
    const p1 = aRow[1] * bRow[1];
    const total = p0 + p1;

    const nodes = [
      txt('3D WGMMA SYSTOLIC TILE CUBE', 455, -415, 26, COSMOS.cyan, 'mono').glow(5, COSMOS.cyan),
      txt('1×128 A slice × 128×128 B slab -> FP32 acc', 455, 435, 26, COSMOS.muted, 'sans'),
    ];

    // Row A cells
    nodes.push(
      txt(useRow1 ? 'A[1, :]' : 'A[0, :]', -845, -125, 26, ROLE.a, 'mono', 'left'),
      glassCell(-655, -125, 118, 74, ROLE.a, { fill: '#10203a', glow: 7 }),
      txt(String(aRow[0]), -655, -125, 36, ROLE.a, 'mono'),
      glassCell(-515, -125, 118, 74, ROLE.a, { fill: '#10203a', glow: 7 }),
      txt(String(aRow[1]), -515, -125, 36, ROLE.a, 'mono'),
    );

    // Row B cells (stored by rows!)
    nodes.push(
      txt('B[0, :]', -845, -20, 26, ROLE.b, 'mono', 'left'),
      glassCell(-655, -20, 118, 74, ROLE.b, { fill: '#281122', glow: 7 }),
      txt(String(bRow[0]), -655, -20, 36, ROLE.b, 'mono'),
      glassCell(-515, -20, 118, 74, ROLE.b, { fill: '#281122', glow: 7 }),
      txt(String(bRow[1]), -515, -20, 36, ROLE.b, 'mono'),
    );

    // Pairwise products & running sum
    if (st >= 0.8) {
      nodes.push(
        txt('k = 0', -655, -190, 26, ROLE.gold, 'mono'),
        txt('k = 1', -515, -190, 26, ROLE.gold, 'mono'),
        txt(`${aRow[0]}×${bRow[0]} = ${p0}`, -655, 68, 26, ROLE.c, 'mono'),
        txt(`${aRow[1]}×${bRow[1]} = ${p1}`, -515, 68, 26, ROLE.c, 'mono'),
      );
    }

    if (st >= 1.6) {
      const sumColor = useRow1 ? ROLE.gold : ROLE.good;
      const sumExpr =
        p1 >= 0 ? `sum = ${p0} + ${p1} = ${total}` : `sum = ${p0} - ${Math.abs(p1)} = ${total}`;
      nodes.push(
        glassCell(-585, 152, 370, 76, sumColor, { fill: '#0e2432', glow: 9 }),
        txt(sumExpr, -585, 152, 26, sumColor, 'mono').glow(5, sumColor),
      );
    }

    // 2x2 output tile panel on middle-left (appears on dot-tile)
    if (st >= 4.5) {
      nodes.push(txt('2×2 OUTPUT TILE D', -195, -190, 26, ROLE.c, 'mono'));
      for (let r = 0; r < 2; r++) {
        for (let col = 0; col < 2; col++) {
          const cx = -255 + col * 124;
          const cy = -95 + r * 102;
          const val = TILE_DONE.result[r][col];
          const hl = st >= 5.5;
          nodes.push(
            glassCell(cx, cy, 108, 82, hl ? ROLE.good : ROLE.c, {
              fill: '#0d2233',
              glow: hl ? 9 : 5,
            }),
            txt(String(val), cx, cy, 36, hl ? ROLE.good : ROLE.c, 'mono'),
          );
        }
      }
      nodes.push(
        txt(
          st >= 5.5 ? 'Tensor Cores run MMA tiles' : 'Block stages A & B tiles',
          -195,
          106,
          26,
          st >= 5.5 ? ROLE.good : COSMOS.muted,
          'sans',
        ),
      );
    }

    nodes.push(
      txt(
        st >= 5.5
          ? 'Tile size balances arithmetic reuse vs SRAM & register budget'
          : st >= 3.5
            ? 'NT layout keeps both A and B contiguous along K'
            : 'Matching K coordinates multiply and sum into D[i, j]',
        -860,
        365,
        26,
        st >= 5.5 ? ROLE.good : COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, cube3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, cube3d, { theta: -0.2, phi: 0.92 });

  c.on('dot-pair', () => s.play(step.to(1, { duration: remainDuration(c, 'dot-pair', 0.45) })));
  c.on('dot-sum', () => {
    const dur = remainDuration(c, 'dot-sum', 0.55);
    s.play(step.to(2, { duration: dur }));
    s.play(kCursor.to(1, { duration: dur }));
  });
  c.on('dot-row2', () => {
    const dur = remainDuration(c, 'dot-row2', 0.5);
    s.play(step.to(3, { duration: dur }));
    s.play(kCursor.to(2, { duration: dur }));
  });
  c.show('dot-nt', ntEq);
  c.on('dot-nt', () => s.play(step.to(4, { duration: remainDuration(c, 'dot-nt', 0.4) })));
  c.on('dot-tile', () => s.play(step.to(5, { duration: remainDuration(c, 'dot-tile', 0.45) })));
  c.on('dot-tc', () => {
    const dur = remainDuration(c, 'dot-tc', 0.5);
    s.play(step.to(6, { duration: dur }));
    s.play(promoVal.to(1, { duration: dur }));
  });
}
