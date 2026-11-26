// Scene 09: Will the lookup work on two new inputs? (Visible 2/2 vs withheld 0/2 generalization)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function hiddenCases(s, c) {
  const phase = s.value(0);
  const sVis = s.value(0);
  const sNew = s.value(0);
  const sFail = s.value(0);
  const sAcc = s.value(0);
  const sVer = s.value(0);

  const bgAura = aura(0, 20, 640, '#14365c26', '#3d1c4c14');
  const title = heroTitle(['Will the Lookup Work', 'on Two New Inputs?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.rose,
    eyebrow: 'HIDDEN TRANSFER TESTS · MEMORIZATION vs MULTIPLICATION',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const sv = Math.max(0.55, sVis.value);
    const sn = Math.max(0.55, sNew.value);
    const sf = sFail.value;
    const sa = sAcc.value;
    const vr = sVer.value;

    const nodes = [
      // Left: Exposed lookup table (2/2)
      glassCell(-450, -30, 740, 280, COSMOS.emerald, {
        fill: '#0e2524',
        glow: sv > 0.7 ? 9 : 4,
        opacity: sv,
      }),
      txt('EXPOSED TRAINING EXAMPLES', -450, -130, 26, COSMOS.emerald, 'mono').opacity(sv),
      txt('lookup[(14, 12)] -> 168   PASS', -450, -60, 30, COSMOS.ink, 'mono').opacity(sv),
      txt('lookup[( 8, 12)] ->  96   PASS', -450, 4, 30, COSMOS.ink, 'mono').opacity(sv),
      txt('Visible score:  2 / 2', -450, 74, 36, COSMOS.emerald, 'mono')
        .glow(7, COSMOS.emerald)
        .opacity(sv),

      // Right: Withheld unseen pairs (0/2, revealed strictly after sFail!)
      glassCell(450, -30, 740, 280, sf > 0.5 ? COSMOS.rose : COSMOS.gold, {
        fill: sf > 0.5 ? '#291018' : '#201a0f',
        dash: sf > 0.5 ? undefined : [9, 6],
        glow: sf > 0.5 ? 10 * pulse : 5,
        opacity: sn,
      }),
      txt(
        'WITHHELD NEW INPUTS (TABLE FIXED)',
        450,
        -130,
        26,
        sf > 0.5 ? COSMOS.rose : COSMOS.gold,
        'mono',
      ).opacity(sn),
      txt(
        sf > 0.5 ? 'lookup[( 7,  9)] -> MISS (63)' : 'lookup[( 7,  9)] -> ?',
        450,
        -60,
        30,
        sf > 0.5 ? COSMOS.rose : COSMOS.ink,
        'mono',
      ).opacity(sn),
      txt(
        sf > 0.5 ? 'lookup[(11, 13)] -> MISS (143)' : 'lookup[(11, 13)] -> ?',
        450,
        4,
        30,
        sf > 0.5 ? COSMOS.rose : COSMOS.ink,
        'mono',
      ).opacity(sn),
      txt(
        sf > 0.5 ? 'Held-out score: 0 / 2' : 'Held-out score: ? / 2',
        450,
        74,
        36,
        sf > 0.5 ? COSMOS.rose : COSMOS.gold,
        'mono',
      )
        .glow(7, sf > 0.5 ? COSMOS.rose : COSMOS.gold)
        .opacity(sn),

      // Lower governance notes (balanced luminance from start)
      glowDot(-820, 210, { radius: 6, color: COSMOS.gold }),
      txt(
        'Deduplicate across optimization boundary · limit repeated queries against final held-out tests',
        -790,
        212,
        28,
        sa > 0.3 ? COSMOS.gold : COSMOS.muted,
        'sans',
        'left',
      ).opacity(Math.max(0.75, sa)),
      glowDot(-820, 282, { radius: 6, color: COSMOS.cyan }),
      txt(
        'Preserve exact test & verifier versions · even blind feedback can leak a weak grader interface',
        -790,
        284,
        28,
        vr > 0.3 ? COSMOS.cyan : COSMOS.muted,
        'sans',
        'left',
      ).opacity(Math.max(0.75, vr)),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('vr-hidden-cases-b0', () => s.play(phase.to(1.5, { duration: 0.4 })));
  c.on('vr-visible-hidden-cases', () => s.play(sVis.to(1, { duration: 0.45 })));
  c.on('vr-new-hidden-cases', () => s.play(sNew.to(1, { duration: 0.45 })));
  c.after('vr-fail-hidden-cases', () =>
    s.play(sFail.to(1, { duration: remainDuration(c, 'vr-fail-hidden-cases', 0.45) })),
  );
  c.on('vr-hidden-cases-b1', () => s.play(sAcc.to(0.6, { duration: 0.35 })));
  c.on('vr-access-hidden-cases', () => s.play(sAcc.to(1, { duration: 0.45 })));
  c.on('vr-hidden-cases-b2', () => s.play(sVer.to(0.6, { duration: 0.35 })));
  c.on('vr-versions-hidden-cases', () =>
    s.play(sVer.to(1, { duration: remainDuration(c, 'vr-versions-hidden-cases', 0.45) })),
  );
}
