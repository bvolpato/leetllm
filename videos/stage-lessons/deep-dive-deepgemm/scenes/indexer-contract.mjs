// Scene 16: Carry the valid span through a version migration.
// Negative head weights -> valid [-0.4, -0.2] lose to invalid 0.0 without -inf; empty [40,40) -> [];
// Oct API drops clean_logits; SM100 MXFP8/MXFP4 + UE8M0 + BF16 vs SM90 FP32.
import {
  COSMOS,
  INDEXER_REF,
  ROLE,
  aura,
  buildIndexerTower3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function indexerContract(s, c) {
  const phase = s.value(0);
  const maskVal = s.value(0);
  const step = s.value(0); // 1=ref 0.4, 2=paged, 3=neg trap, 4=empty [], 5=Oct compressed, 6=SM100 vs SM90

  const bgAura = aura(445, 20, 520, '#a78bfa20', '#ff6b8b1a');
  const { view: idx3d } = buildIndexerTower3d(maskVal, phase, { x: 455, y: 15, unit: 94 });

  const title = heroTitle(['Carry the Valid Span', 'Across Migration'], {
    x: -860,
    y: -420,
    size: 56,
    lineHeight: 66,
    accent: ROLE.scale,
    eyebrow: 'INDEXER API · JULY -> OCTOBER',
    subtitle: 'Mask negative-score bounds to -inf and map compressed offsets',
  });

  const live = guardedDynamic(1, () => {
    const st = step.value;
    const nodes = [
      txt('3D MASKED SPAN & ARCH FORMAT', 455, -415, 26, ROLE.scale, 'mono').glow(5, ROLE.scale),
      txt('Invalid 0.0 beats valid -0.2 unless masked to -inf', 455, 435, 26, COSMOS.muted, 'sans'),
    ];

    // Row 1: July reference & paged lookup
    nodes.push(
      glassCell(-460, -140, 800, 88, st >= 0.6 ? ROLE.c : COSMOS.dim, {
        fill: '#0e1d30',
        glow: st >= 0.6 ? 7 : 0,
      }),
      txt(
        st >= 1.6
          ? `Ref = ${INDEXER_REF.score.toFixed(1)} · Paged decode uses block table`
          : `k=[1,-0.5] · ReLU·[0.4,0.6] = ${INDEXER_REF.score.toFixed(1)}`,
        -460,
        -140,
        26,
        ROLE.c,
        'mono',
      ),
    );

    // Row 2: Negative score trap: [0.0 (invalid), -0.4 (valid), -0.2 (valid)]
    const showNeg = st >= 2.6;
    const cells = [
      {
        idx: 0,
        val: showNeg && st >= 3.5 ? '-inf' : '0.0',
        tag: 'pos 0 INVALID',
        col: ROLE.bad,
        x: -725,
      },
      { idx: 1, val: '-0.4', tag: 'pos 1 valid', col: ROLE.a, x: -460 },
      { idx: 2, val: '-0.2', tag: 'pos 2 WINNER', col: ROLE.good, x: -195 },
    ];
    cells.forEach((cell) => {
      nodes.push(
        glassCell(cell.x, 4, 244, 130, showNeg ? cell.col : COSMOS.dim, {
          fill: '#0f1628',
          glow: showNeg ? 8 : 0,
        }),
        txt(cell.tag, cell.x, -38, 26, showNeg ? cell.col : COSMOS.muted, 'mono'),
        txt(cell.val, cell.x, 4, 34, showNeg ? cell.col : COSMOS.muted, 'mono'),
        txt(
          cell.idx === 0 ? 'beats -0.2 if 0!' : 'in [1, 3)',
          cell.x,
          44,
          26,
          COSMOS.muted,
          'sans',
        ),
      );
    });

    if (st >= 3.6) {
      nodes.push(
        txt(
          'Empty valid span [40, 40) -> return [] (never pick -inf)',
          -860,
          102,
          26,
          ROLE.gold,
          'mono',
          'left',
        ),
      );
    }

    // Row 3: October API & SM100 vs SM90 contract
    if (st >= 4.6) {
      nodes.push(
        glassCell(-665, 224, 370, 128, ROLE.scale, { fill: '#1c1535', glow: 8 }),
        txt('OCT COMPRESSED API', -665, 186, 26, ROLE.scale, 'mono'),
        txt('clean_logits removed', -665, 226, 26, COSMOS.ink, 'mono'),
        txt('token = start + col', -665, 264, 26, ROLE.good, 'mono'),

        glassCell(-250, 224, 410, 128, st >= 5.5 ? ROLE.c : COSMOS.dim, {
          fill: '#0e2030',
          glow: st >= 5.5 ? 9 : 0,
        }),
        txt('SM100 VS SM90 FORMAT', -250, 186, 26, ROLE.c, 'mono'),
        txt('SM100: MX + UE8M0 + BF16', -250, 226, 26, COSMOS.ink, 'mono'),
        txt('SM90: FP8 + FP32 weights', -250, 264, 26, COSMOS.muted, 'mono'),
      );
    }

    nodes.push(
      txt(
        'Port paging metadata, valid-span slicing & scale format together',
        -860,
        382,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, idx3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, idx3d, { theta: -0.2, phi: 0.94 });

  c.after('ic-ref', () => s.play(step.to(1, { duration: remainAfterDuration(c, 'ic-ref', 0.35) })));
  c.on('ic-paged', () => s.play(step.to(2, { duration: remainDuration(c, 'ic-paged', 0.45) })));
  c.on('ic-neg', () => s.play(step.to(3, { duration: remainDuration(c, 'ic-neg', 0.45) })));
  c.on('ic-empty', () => {
    const dur = remainDuration(c, 'ic-empty', 0.45);
    s.play(step.to(4, { duration: dur }));
    s.play(maskVal.to(1, { duration: dur }));
  });
  c.on('ic-oct', () => s.play(step.to(5, { duration: remainDuration(c, 'ic-oct', 0.45) })));
  c.on('ic-arch', () => s.play(step.to(6, { duration: remainDuration(c, 'ic-arch', 0.45) })));
}
