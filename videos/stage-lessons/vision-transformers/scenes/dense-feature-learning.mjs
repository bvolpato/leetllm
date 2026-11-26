// Scene 19: dense-feature-learning: DINOv2 EMA teacher-student, DINOv3 Gram anchoring rotation invariance & 4 registers.
import {
  COSMOS,
  ROLE,
  arrow,
  aura,
  chipPill,
  circle,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  rect,
  swapVis,
  txt,
} from '../parts.mjs';

export default function denseFeatureLearning(s, c) {
  const view1Vis = s.value(1); // DINOv2 + Gram anchoring
  const view2Vis = s.value(0); // Registers + 201 -> 196 bridge slot count
  const studentAngle = s.value(0); // 0 -> 90 deg
  const revealDot = s.value(0);
  const showGram = s.value(0);
  const showBridgeSelect = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#25184422');
  const title = heroTitle(['Dense Self-Supervision:', 'DINOv2/v3, Gram & Registers'], {
    x: -855,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.bridge,
  });

  function vectorPair(cx, cy, r, angleDeg, color1, color2, label, alpha) {
    const a1 = (angleDeg * Math.PI) / 180;
    const a2 = ((angleDeg + 90) * Math.PI) / 180;
    return group(
      circle(r, { fill: '#0e172c', stroke: '#2c426e', width: 2.2 }).at(cx, cy).opacity(alpha),
      arrow([cx, cy], [cx + Math.cos(a1) * (r - 14), cy - Math.sin(a1) * (r - 14)], {
        stroke: color1,
        width: 4.5,
        head: 14,
      })
        .glow(8, color1)
        .opacity(alpha),
      arrow([cx, cy], [cx + Math.cos(a2) * (r - 14), cy - Math.sin(a2) * (r - 14)], {
        stroke: color2,
        width: 4.5,
        head: 14,
      })
        .glow(8, color2)
        .opacity(alpha),
      txt(label, cx, cy - r - 28, 28, COSMOS.ink, 'mono', 'center').opacity(alpha),
    );
  }

  const view1 = guardedDynamic(view1Vis, (alpha) => {
    const ang = studentAngle.value;
    const rev = revealDot.value;
    const gr = showGram.value;

    const nodes = [
      txt(
        'DINOv2 EMA TEACHER -> STUDENT  |  DINOv3 GRAM ANCHORING',
        -855,
        -225,
        26,
        ROLE.patch,
        'mono',
        'left',
      ).opacity(alpha),
      vectorPair(-530, 15, 138, 0, ROLE.patch, ROLE.pos, 'TEACHER (90 deg)', alpha),
      vectorPair(
        -50,
        15,
        138,
        ang,
        ROLE.ok,
        ROLE.bridge,
        `STUDENT (+${Math.round(ang)} deg)`,
        alpha,
      ),

      // Right: Dot product (withheld until gram-product!) + 2x2 Gram matrix
      txt('PAIRWISE DOT PRODUCT', 250, -140, 26, ROLE.pos, 'mono', 'left').opacity(alpha),
      txt('Teacher u1 · u2 = 0', 250, -75, 30, ROLE.patch, 'mono', 'left').opacity(alpha),
      txt(
        rev > 0.4
          ? 'Student u1 · u2 = 0  (INVARIANT!)'
          : ang > 20
            ? 'Student u1 · u2 = ?'
            : 'Student u1 · u2 = 0',
        250,
        -10,
        30,
        rev > 0.4 ? ROLE.ok : ROLE.pos,
        'mono',
        'left',
      )
        .glow(rev > 0.4 ? 8 : 0, ROLE.ok)
        .opacity(alpha),

      // 2x2 Gram matrix G = [[1, 0], [0, 1]]
      txt('2 x 2 GRAM MATRIX', 250, 75, 26, ROLE.ok, 'mono', 'left').opacity(
        alpha * (0.3 + 0.7 * gr),
      ),
      rect(110, 68, { fill: '#103128', stroke: ROLE.ok, width: 2.2, radius: 8 })
        .at(310, 145)
        .opacity(alpha * (0.25 + 0.75 * gr)),
      txt('1', 310, 145, 32, ROLE.ok, 'mono', 'center').opacity(alpha * (0.25 + 0.75 * gr)),
      rect(110, 68, { fill: '#0e162a', stroke: COSMOS.rule, width: 2, radius: 8 })
        .at(435, 145)
        .opacity(alpha * (0.25 + 0.75 * gr)),
      txt('0', 435, 145, 32, COSMOS.ink, 'mono', 'center').opacity(alpha * (0.25 + 0.75 * gr)),
      rect(110, 68, { fill: '#0e162a', stroke: COSMOS.rule, width: 2, radius: 8 })
        .at(310, 225)
        .opacity(alpha * (0.25 + 0.75 * gr)),
      txt('0', 310, 225, 32, COSMOS.ink, 'mono', 'center').opacity(alpha * (0.25 + 0.75 * gr)),
      rect(110, 68, { fill: '#103128', stroke: ROLE.ok, width: 2.2, radius: 8 })
        .at(435, 225)
        .opacity(alpha * (0.25 + 0.75 * gr)),
      txt('1', 435, 225, 32, ROLE.ok, 'mono', 'center').opacity(alpha * (0.25 + 0.75 * gr)),
    ];

    return group(...nodes);
  });

  const view2 = guardedDynamic(view2Vis, (alpha) => {
    const sel = showBridgeSelect.value;
    const nodes = [
      txt(
        'REGISTER TOKENS ABSORB INTERNAL SCRATCHPAD NORMS',
        -855,
        -210,
        26,
        ROLE.bridge,
        'mono',
        'left',
      ).opacity(alpha),

      // Encoder sequence: 1 [CLS] + 4 [REG] + 196 [PATCH] = 201 slots
      chipPill('[CLS]  1', -730, -90, { w: 230, h: 78, color: ROLE.pos, size: 28, opacity: alpha }),
      chipPill('4 Registers', -440, -90, {
        w: 280,
        h: 78,
        color: ROLE.bridge,
        size: 28,
        glow: 10,
        opacity: alpha,
      }),
      chipPill('196 Patch Tokens  (14 x 14)', 180, -90, {
        w: 880,
        h: 78,
        color: ROLE.patch,
        size: 30,
        glow: 10,
        opacity: alpha,
      }),
      txt(
        'Total Encoder Slots = 1 + 4 + 196 = 201',
        -855,
        10,
        32,
        COSMOS.ink,
        'mono',
        'left',
      ).opacity(alpha),

      // Bridge selection row
      arrow([180, -45], [180, 110], { stroke: ROLE.ok, width: 4, head: 14 }).opacity(
        alpha * (0.3 + 0.7 * sel),
      ),
      chipPill('Bridge Selects Patches Only -> 196 Visual Slots to LLM', 0, 175, {
        w: 1120,
        h: 82,
        color: ROLE.ok,
        fill: '#0f2d24',
        size: 30,
        glow: 12,
        opacity: alpha * (0.3 + 0.7 * sel),
      }),
      txt(
        'Count only selected bridge states, never blindly copy all 201 encoder slots',
        0,
        295,
        28,
        ROLE.pos,
        'sans',
        'center',
      ).opacity(alpha * (0.3 + 0.7 * sel)),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, view1, view2);
  playCue(s, c, 'dense-feature-learning-beat-0', (d) =>
    s.play(studentAngle.to(0, { duration: d })),
  );
  playCue(s, c, 'dense-feature-learning-beat-1', (d) =>
    s.play(studentAngle.to(0, { duration: d })),
  );
  playCue(s, c, 'gram-rotate', (d) => s.play(studentAngle.to(90, { duration: d })));
  // Strict prediction withholding: reveal dot product = 0 only after gram-product!
  playCue(s, c, 'gram-product', (d) => s.play(revealDot.to(1, { duration: d })), { after: true });
  playCue(s, c, 'gram-matrix', (d) => s.play(showGram.to(1, { duration: d })));
  playCue(s, c, 'dense-feature-learning-beat-2', (d) => s.play(swapVis(view1Vis, view2Vis, d)));
  playCue(s, c, 'dense-feature-learning-beat-3', (d) =>
    s.play(showBridgeSelect.to(1, { duration: d })),
  );
}
