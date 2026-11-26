// Scene 01: What score will submission B get? (First-box verifier loophole + 3D GRPO wave)
import {
  COSMOS,
  aura,
  buildGroupWave3d,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function intro(s, c) {
  const phase = s.value(0);
  const showSecondBox = s.value(0);
  const showRule = s.value(0);
  const showRead = s.value(0);
  const revealAward = s.value(0);

  const bgAura = aura(390, 20, 540, '#123e362a', '#2d1e5614');
  const wave3d = buildGroupWave3d(phase, { x: 420, y: 20, rewards: [1, 1, 0, 0] });

  const title = heroTitle(['What Score Will', 'Submission B Get?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'RLVR · VERIFIABLE REWARDS & PARSER CONTRACTS',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const sb = showSecondBox.value;
    const sr = showRule.value;
    const rd = showRead.value;
    const aw = revealAward.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      // Reference key
      txt('ANSWER KEY:   14 x 12 = 168', -855, -182, 30, COSMOS.cyan, 'mono', 'left'),

      // Submission B (two boxes: 168 then revised 148)
      txt('SUBMISSION B (REVISED ITS ANSWER)', -855, -108, 26, COSMOS.amber, 'mono', 'left'),
      glassCell(-725, -24, 240, 92, rd > 0.3 ? COSMOS.emerald : COSMOS.cyan, {
        fill: '#102138',
        glow: rd > 0.3 ? 10 * pulse : 5,
      }),
      txt('\\boxed{168}', -725, -22, 32, COSMOS.ink, 'mono'),
    ];

    if (sb > 0.05) {
      nodes.push(
        txt('then', -560, -22, 26, COSMOS.muted, 'sans').opacity(sb),
        glassCell(-405, -24, 240, 92, COSMOS.rose, {
          fill: '#281119',
          glow: 8 * pulse,
          opacity: sb,
        }),
        txt('\\boxed{148}', -405, -22, 32, COSMOS.rose, 'mono').opacity(sb),
      );
    }

    // Score slot for Submission B (strictly withheld as "?" until intro-award!)
    nodes.push(
      glassCell(-155, -24, 190, 92, aw > 0.5 ? COSMOS.emerald : COSMOS.gold, {
        fill: aw > 0.5 ? '#0e2824' : '#201a0e',
        dash: aw > 0.5 ? undefined : [8, 6],
        glow: 8 * pulse,
      }),
      txt(
        aw > 0.5 ? 'r = 1.0' : 'r = ?',
        -155,
        -22,
        34,
        aw > 0.5 ? COSMOS.emerald : COSMOS.gold,
        'mono',
      ).glow(7, aw > 0.5 ? COSMOS.emerald : COSMOS.gold),

      // Submission A (single box: 168)
      glassCell(-725, 165, 240, 92, COSMOS.emerald, {
        fill: '#0e2624',
        glow: rd > 0.3 ? 10 * pulse : 4,
        opacity: Math.max(0.45, rd),
      }),
      txt('\\boxed{168}', -725, 167, 32, COSMOS.emerald, 'mono').opacity(Math.max(0.45, rd)),
      txt('SUBMISSION A (SINGLE FINAL BOX)', -855, 244, 26, COSMOS.emerald, 'mono', 'left').opacity(
        Math.max(0.45, rd),
      ),
      glassCell(-155, 165, 190, 92, aw > 0.5 ? COSMOS.emerald : COSMOS.muted, {
        fill: aw > 0.5 ? '#0e2824' : '#12182b',
        glow: aw > 0.5 ? 8 : 2,
        opacity: Math.max(0.45, rd),
      }),
      txt(
        aw > 0.5 ? 'r = 1.0' : 'r = ?',
        -155,
        167,
        34,
        aw > 0.5 ? COSMOS.emerald : COSMOS.muted,
        'mono',
      ).opacity(Math.max(0.45, rd)),
    );

    if (sr > 0.05) {
      nodes.push(
        txt('CHECKER RULE: award 1 if FIRST box == 168', -855, 308, 28, COSMOS.gold, 'mono', 'left')
          .glow(5, COSMOS.gold)
          .opacity(sr),
      );
    }

    if (rd > 0.2) {
      nodes.push(
        glowingArc([-725, 26], [-725, 114], 0, { color: COSMOS.emerald, width: 3.4, opacity: rd }),
        glowDot(-725, 70, { radius: 6, color: COSMOS.emerald, opacity: rd }),
      );
    }

    if (aw > 0.3) {
      nodes.push(
        txt(
          'Both read 168 -> both earn 1.0 (even the contradiction!)',
          -855,
          368,
          28,
          COSMOS.rose,
          'sans',
          'left',
        )
          .glow(5, COSMOS.rose)
          .opacity(aw),
      );
    }

    nodes.push(
      txt('3D VERIFIABLE REWARD GROUP', 420, -370, 26, COSMOS.emerald, 'mono').glow(
        5,
        COSMOS.emerald,
      ),
      txt(
        'Green pillars beat the group mean; rose pillars fall below',
        420,
        412,
        26,
        COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, wave3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, wave3d, { theta: -0.2, phi: 0.92 });

  c.on('intro-extra', () => s.play(showSecondBox.to(1, { duration: 0.55 })));
  c.on('intro-rule', () => s.play(showRule.to(1, { duration: 0.5 })));
  c.on('intro-read', () => s.play(showRead.to(1, { duration: 0.5 })));
  c.after('intro-award', () =>
    s.play(revealAward.to(1, { duration: remainDuration(c, 'intro-award', 0.45) })),
  );
}
