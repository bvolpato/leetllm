// Scene 10 (benchmark-audit): "Keep the audited subset inside its real denominator"
// Proportional denominator ribbons for SWE-bench Verified (500 -> 138 -> 59.4%) & Pro (731 -> ~30%) + 3D audit surface.
import {
  COSMOS,
  ROLE,
  aura,
  buildContaminationSurface3d,
  fadeIn,
  fadeOut,
  guardedDynamic,
  heroTitle,
  lumBar,
  orbitScene,
  runAmbientPhase,
  tweenCue,
  txt,
} from '../parts.mjs';

export default function audit(s, c) {
  const phase = s.value(0);
  const showSubset = s.value(0);
  const showIssues = s.value(0);
  const showRetract = s.value(0);
  const showPro = s.value(0);
  const showPrivate = s.value(0);

  const bgAura = aura(450, 20, 560, '#361a3d38', '#142d4c20');
  const { view: contam3d } = buildContaminationSurface3d(() => showRetract.value, {
    x: 470,
    y: 10,
    theta: -0.78,
    phi: 1.05,
    distance: 15.6,
    unit: 96,
  });

  const title = heroTitle(['Keep Every Audited Subset', 'Inside Its Real Denominator'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 60,
    accent: ROLE.fail,
    eyebrow: 'SWE-BENCH AUDITS · DENOMINATORS & EXPOSURE',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.0);
    const sub = showSubset.value;
    const iss = showIssues.value;
    const ret = showRetract.value;
    const pro = showPro.value;
    const priv = showPrivate.value;
    const nodes = [];

    const barLeft = -855;
    const barW = 860;
    const barCx = barLeft + barW * 0.5;

    // RIBBON 1: SWE-bench Verified universe (500 tasks, 138 unresolved subset)
    const r1Y = -145;
    const subW = barW * (138 / 500);
    nodes.push(
      txt(
        '1. SWE-BENCH VERIFIED · 500 HUMAN-REVIEWED TASKS',
        barLeft,
        r1Y - 58,
        26,
        COSMOS.ink,
        'mono',
        'left',
      ),
      lumBar(barCx, r1Y, barW, 56, {
        color: COSMOS.dim,
        fillOpacity: 0.22,
        strokeWidth: 2.0,
        glow: 4,
        radius: 8,
      }),
    );
    if (sub > 0.02) {
      const wNow = Math.max(8, subW * sub);
      nodes.push(
        lumBar(barLeft + wNow * 0.5, r1Y, wNow, 56, {
          color: ROLE.A,
          fillOpacity: 0.62,
          strokeWidth: 2.6,
          glow: 10,
          radius: 8,
          opacity: sub,
        }),
        txt('138 selected', barLeft + wNow + 18, r1Y, 26, ROLE.A, 'mono', 'left').opacity(sub),
      );
    }

    // RIBBON 2: Audited 138-task subset denominator -> 59.4% material defects
    const r2Y = 15;
    nodes.push(
      txt(
        iss > 0.3
          ? '2. AUDITED SUBSET (138 TASKS) · 59.4% MATERIAL ISSUES'
          : '2. AUDITED SUBSET DENOMINATOR (138 TASKS)',
        barLeft,
        r2Y - 58,
        26,
        iss > 0.3 ? ROLE.fail : COSMOS.muted,
        'mono',
        'left',
      ),
      lumBar(barCx, r2Y, barW, 56, {
        color: COSMOS.dim,
        fillOpacity: 0.18,
        strokeWidth: 2.0,
        glow: 3,
        radius: 8,
      }),
    );
    if (iss > 0.02) {
      const wIss = Math.max(8, barW * 0.594 * iss);
      nodes.push(
        lumBar(barLeft + wIss * 0.5, r2Y, wIss, 56, {
          color: ROLE.fail,
          fillOpacity: 0.68,
          strokeWidth: 2.8,
          glow: 11 * pulse,
          radius: 8,
          opacity: iss,
        }),
        txt('59.4% of 138', barLeft + wIss * 0.5, r2Y, 28, COSMOS.bg, 'mono').opacity(iss),
      );
    }

    // RIBBON 3: SWE-bench Pro (731 public tasks -> ~30% broken, Jul 2026 retraction)
    const r3Y = 175;
    nodes.push(
      txt(
        pro > 0.3
          ? '3. SWE-BENCH PRO (731 PUBLIC TASKS) · ~30% BROKEN'
          : '3. SWE-BENCH PRO (731 PUBLIC TASKS)',
        barLeft,
        r3Y - 58,
        26,
        pro > 0.3 ? ROLE.accent : COSMOS.muted,
        'mono',
        'left',
      ),
      lumBar(barCx, r3Y, barW, 56, {
        color: COSMOS.dim,
        fillOpacity: 0.18,
        strokeWidth: 2.0,
        glow: 3,
        radius: 8,
      }),
    );
    if (pro > 0.02) {
      const wPro = Math.max(8, barW * 0.3 * pro);
      nodes.push(
        lumBar(barLeft + wPro * 0.5, r3Y, wPro, 56, {
          color: ROLE.fail,
          fillOpacity: 0.66,
          strokeWidth: 2.8,
          glow: 11 * pulse,
          radius: 8,
          opacity: pro,
        }),
        txt('~30%', barLeft + wPro * 0.5, r3Y, 28, COSMOS.bg, 'mono').opacity(pro),
      );
    }

    // Bottom dated audit timeline (strictly non-overlapping crossfades)
    const cap0Op = iss * fadeOut(ret) * fadeOut(priv);
    const cap1Op = fadeIn(ret) * fadeOut(priv);
    const cap2Op = fadeIn(priv);

    if (cap0Op > 0.02) {
      nodes.push(
        txt(
          'Feb 2026: 138 tasks o3 did not consistently solve · OpenAI stopped reporting Verified',
          barLeft,
          315,
          28,
          ROLE.focus,
          'sans',
          'left',
        ).opacity(cap0Op),
      );
    }
    if (cap1Op > 0.02) {
      nodes.push(
        txt(
          'Jul 2026: Pro recommendation retracted after public audit + memorization findings',
          barLeft,
          315,
          28,
          ROLE.fail,
          'sans',
          'left',
        )
          .glow(6, ROLE.fail)
          .opacity(cap1Op),
      );
    }
    if (cap2Op > 0.02) {
      nodes.push(
        txt(
          'Inspect what your verifier accepts, run reviewed private cases, and keep failed answers',
          barLeft,
          315,
          28,
          ROLE.pass,
          'sans',
          'left',
        )
          .glow(6, ROLE.pass)
          .opacity(cap2Op),
      );
    }

    // 3D surface floating captions
    nodes.push(
      txt('EXPOSURE VS GENERALIZATION SURFACE', 470, -345, 26, ROLE.exposed, 'mono').glow(
        5,
        ROLE.exposed,
      ),
      txt('Public test scores mix skill with memorization', 470, 365, 26, COSMOS.muted, 'sans'),
    );

    return nodes;
  });

  s.add(bgAura, contam3d, title, live);
  runAmbientPhase(s, c, phase, 2.2);
  orbitScene(s, c, contam3d, { theta: 0.42, phi: 0.96 });

  tweenCue(s, c, 'benchmark-audit-phase-0', showSubset, 0, { duration: 0.1 });
  tweenCue(s, c, 'ba-benchmark-audit-subset', showSubset, 1, { duration: 0.55 });
  tweenCue(s, c, 'audit-issues', showIssues, 1, { duration: 0.55, after: true });
  tweenCue(s, c, 'ba-benchmark-audit-denominator', showIssues, 1, { duration: 0.25 });
  tweenCue(s, c, 'benchmark-audit-phase-1', showRetract, 0.2, { duration: 0.3 });
  tweenCue(s, c, 'ba-benchmark-audit-retract', showRetract, 1, { duration: 0.45 });
  tweenCue(s, c, 'ba-benchmark-audit-pro', showPro, 1, { duration: 0.5, after: true });
  tweenCue(s, c, 'benchmark-audit-phase-2', showPrivate, 1, { duration: 0.5 });
  tweenCue(s, c, 'ba-benchmark-audit-verifier', showPrivate, 1, { duration: 0.25 });
}
