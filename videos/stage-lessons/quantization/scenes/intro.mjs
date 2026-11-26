// Scene 01: intro: 0.73 on 0.1-step 4-bit grid -> code 7 (0.7, error -0.03) -> x1.5 output moves 1.095 -> 1.05 (-0.045) + 3D bit-grid snapping manifold.
import {
  COSMOS,
  INTRO_EX,
  ROLE,
  aura,
  buildQuantGrid3d,
  chipPill,
  circle,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  orbitScene,
  playCue,
  txt,
} from '../parts.mjs';

export default function intro(s, c) {
  const revealSnap = s.value(0); // strictly withheld until AFTER compact-code!
  const revealBits = s.value(0);
  const showMul = s.value(0);

  const bgAura = aura(-240, 0, 720, '#14335c28', '#20184422');
  const title = heroTitle(['What Happens When a Weight', 'Snaps to a 4-Bit Grid?'], {
    x: -855,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.grid,
  });

  // Orbiting 3D bit-grid snapping manifold on the right
  const view3d = buildQuantGrid3d(revealSnap, { x: 465, y: 15 });
  orbitScene(s, c, view3d, { theta: -0.22, phi: 0.94 });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const sn = revealSnap.value;
    const bt = revealBits.value;
    const ml = showMul.value;

    const rLeft = -835;
    const rRight = -45;
    const rY = -95;
    const toX = (v) => rLeft + ((v - 0.5) / 0.5) * (rRight - rLeft);
    const x073 = toX(INTRO_EX.sourceWeight);
    const x070 = toX(INTRO_EX.weight);
    const curX = x073 + (x070 - x073) * sn;

    const nodes = [
      txt('4-BIT UNIFORM RULER (STEP = 0.1)', -855, -215, 26, ROLE.grid, 'mono', 'left').opacity(
        alpha,
      ),
      line([rLeft, rY], [rRight, rY], { stroke: COSMOS.rule, width: 4 }).opacity(alpha),
    ];

    for (let k = 5; k <= 10; k++) {
      const v = k / 10;
      const tx = toX(v);
      const isSeven = k === 7 && sn > 0.35;
      nodes.push(
        line([tx, rY - 20], [tx, rY + 20], {
          stroke: isSeven ? ROLE.ok : COSMOS.muted,
          width: isSeven ? 4 : 2.5,
        }).opacity(alpha),
        txt(
          v.toFixed(1),
          tx,
          rY + 46,
          26,
          isSeven ? ROLE.ok : COSMOS.muted,
          'mono',
          'center',
        ).opacity(alpha),
        txt(`c=${k}`, tx, rY - 46, 26, isSeven ? ROLE.gold : COSMOS.dim, 'mono', 'center').opacity(
          alpha * (0.45 + 0.55 * bt),
        ),
      );
    }

    // Source weight ghost dot + active snapping dot
    nodes.push(
      circle(11, { fill: '#182442', stroke: ROLE.weight, width: 3 }).at(x073, rY).opacity(alpha),
      glowDot(curX, rY, {
        radius: 13,
        color: sn > 0.4 ? ROLE.ok : ROLE.gold,
        glow: 14,
        opacity: alpha,
      }),
      txt(
        sn > 0.4 ? '0.73 -> 0.70 (code 7, err -0.03)' : 'w = 0.73  (which mark is closest?)',
        -440,
        24,
        28,
        sn > 0.4 ? ROLE.ok : ROLE.gold,
        'mono',
        'center',
      ).opacity(alpha),

      chipPill(bt > 0.35 ? 'Stored 4-bit code: 0111 (7)' : 'Stored 4-bit code: ????', -440, 125, {
        w: 760,
        h: 68,
        color: bt > 0.35 ? ROLE.code : ROLE.gold,
        fill: '#111830',
        size: 28,
        glow: bt > 0.35 ? 10 : 4,
        opacity: alpha,
      }),
      chipPill(
        ml > 0.35
          ? `x1.5: ${INTRO_EX.source.toFixed(3)} -> ${INTRO_EX.reconstructed.toFixed(2)} (err ${INTRO_EX.error.toFixed(3)})`
          : 'Input x = 1.5 scales weight & rounding error',
        -440,
        228,
        {
          w: 760,
          h: 68,
          color: ml > 0.35 ? ROLE.err : ROLE.grid,
          fill: ml > 0.35 ? '#301422' : '#10182d',
          size: 26,
          glow: ml > 0.35 ? 10 : 4,
          opacity: alpha * (0.5 + 0.5 * ml),
        },
      ),
      txt(
        sn > 0.4
          ? '3D Bit-Grid: Discrete Terrace Snapping'
          : '3D Weight Surface: Continuous Values',
        465,
        355,
        26,
        sn > 0.4 ? ROLE.ok : ROLE.grid,
        'mono',
        'center',
      ).opacity(alpha),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, view3d, layer);
  playCue(s, c, 'original-weight', (d) => s.play(revealSnap.to(0, { duration: d })));
  // Strict prediction withholding: reveal 0.7 / code 7 only after compact-code!
  playCue(s, c, 'compact-code', (d) => s.play(revealSnap.to(1, { duration: d })), { after: true });
  playCue(s, c, 'stored-bits', (d) => s.play(revealBits.to(1, { duration: d })));
  playCue(s, c, 'changed-computation', (d) => s.play(showMul.to(1, { duration: d })));
}
