// Scene 02: capacity-and-evidence: "Where did the evidence land?"
// Orbiting 3D lost-in-the-middle / context-rot manifold + sliding trace needle + two-source
// question transition + 12-case probe scores (10/12 = 83.33%, 7/12 = 58.33%, delta = 25 pp) with MathJax.
import {
  COSMOS,
  INPUT_LIMIT,
  POSITION_DELTA,
  POSITION_PCT,
  POSITION_PROBE,
  ROLE,
  aura,
  buildRotManifold3d,
  chip,
  dotRow,
  ease,
  fmt,
  glowArrow,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  lerp,
  orbitScene,
  playBeat,
  playCue,
  swapVis,
  tokenRail,
  txt,
} from '../parts.mjs';

export default function capacityAndEvidence(s, c) {
  const rotDepth = s.value(0.2);
  const probePos = s.value(0.05); // 0 = beginning, 0.5 = middle, 1 = end
  const viewMain = s.value(1);
  const viewScores = s.value(0);
  const showCombine = s.value(0);
  const showScope = s.value(0);
  const showTen = s.value(0);
  const showSeven = s.value(0);
  const showDiff = s.value(0);
  const showFormula = s.value(0);

  const bgAura = aura(320, 20, 780, '#14346230', '#38152d26');
  const title = heroTitle(['Where did the', 'evidence land?'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 60,
    accent: ROLE.evidence,
  });

  // Signature orbiting 3D lost-in-the-middle / context-rot surface on the right
  const { view: rot3d } = buildRotManifold3d({
    x: 430,
    y: 35,
    unit: 90,
    probe: probePos,
    rot: rotDepth,
    focusZ: 0.65,
  });
  orbitScene(s, c, rot3d, { theta: -0.35, phi: 0.96, distance: 14.8 });

  const rotLayer = guardedDynamic(viewMain, (alpha) => {
    const pos = probePos.value;
    const comb = ease(showCombine.value);
    const scp = ease(showScope.value);

    const railX = -855;
    const railW = 790;
    const needleX = railX + lerp(58, railW - 58, pos);
    const zoneName = pos < 0.28 ? 'BEGINNING' : pos > 0.72 ? 'END' : 'MIDDLE (DIP)';
    const zoneCol = pos < 0.28 || pos > 0.72 ? ROLE.evidence : ROLE.poison;

    const nodes = [
      txt(
        `WINDOW CAPACITY: ${fmt(INPUT_LIMIT)} TOKENS`,
        railX,
        -240,
        26,
        ROLE.units,
        'mono',
        'left',
      ).opacity(alpha),
      tokenRail({
        x0: railX,
        y: -165,
        width: railW,
        total: 100,
        height: 54,
        segments: [
          { units: 16, color: ROLE.evidence, alpha: 0.9 },
          { units: 68, color: '#2b395c', alpha: 0.7, outline: true },
          { units: 16, color: ROLE.evidence, alpha: 0.9 },
        ],
        opacity: alpha,
      }),
      // Sliding trace-17 token block
      chip('trace-17', needleX, -165, {
        color: zoneCol,
        size: 26,
        h: 52,
        minW: 165,
        fill: '#131d38',
        glow: 11,
        opacity: alpha,
      }),
      txt(`Position: ${zoneName}`, railX, -90, 30, zoneCol, 'mono', 'left').opacity(alpha),

      // Two-source synthesis panel (quiet skeleton from t=0, illuminates on probe-combine)
      txt('TWO-SOURCE SYNTHESIS QUESTION', railX, 15, 26, ROLE.tool, 'mono', 'left').opacity(
        alpha * (0.48 + 0.52 * comb),
      ),
      chip('trace-17: /callback 403', -645, 110, {
        color: ROLE.evidence,
        size: 26,
        minW: 410,
        opacity: alpha * (0.45 + 0.55 * comb),
      }),
      chip('deploy-record: scope edit', -645, 210, {
        color: ROLE.units,
        size: 26,
        minW: 410,
        opacity: alpha * (0.45 + 0.55 * comb),
      }),
      glowArrow([-420, 110], [-285, 160], ROLE.evidence, { opacity: alpha * (0.35 + 0.65 * comb) }),
      glowArrow([-420, 210], [-285, 160], ROLE.units, { opacity: alpha * (0.35 + 0.65 * comb) }),
      txt(
        scp > 0.3 ? 'Check required scope first' : 'Combine both records',
        -265,
        160,
        28,
        scp > 0.3 ? ROLE.note : COSMOS.muted,
        'sans',
        'left',
      ).opacity(alpha * (0.45 + 0.55 * comb)),

      // Right caption underneath the 3D manifold
      txt('U-SHAPED RECALL MANIFOLD', 430, 320, 28, ROLE.evidence, 'mono', 'center').opacity(alpha),
      txt(
        'Edge depth vs input length (context rot)',
        430,
        365,
        26,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    ];

    return group(...nodes);
  });

  // MathJax delta equation (only shown during B3 score comparison)
  const eqSymbolic = glowTex(
    String.raw`\Delta_{\mathrm{pp}} = 100\left(p_{\mathrm{beginning}} - p_{\mathrm{middle}}\right)`,
    { x: 0, y: 185, size: 42, color: ROLE.units, glow: 7 },
  );
  const eqConcrete = glowTex(
    String.raw`\Delta_{\mathrm{pp}} = 100\left(\frac{10}{12} - \frac{7}{12}\right) = 25\text{ pp}`,
    { x: 0, y: 185, size: 44, color: ROLE.note, glow: 9 },
  );

  const scoreLayer = guardedDynamic(viewScores, (alpha) => {
    const t10 = ease(showTen.value);
    const t7 = ease(showSeven.value);
    const df = ease(showDiff.value);
    const fm = ease(showFormula.value);

    const nodes = [
      txt(
        'CONTROLLED 12-CASE POSITION PROBE (FIXED QUESTION & TEXT)',
        -855,
        -230,
        28,
        ROLE.evidence,
        'mono',
        'left',
      ).opacity(alpha),

      // Row 1: Beginning (10/12)
      txt('BEGINNING', -855, -125, 32, ROLE.evidence, 'mono', 'left').opacity(alpha),
      dotRow(-560, -125, POSITION_PROBE.cases, POSITION_PROBE.beginning, {
        spacing: 56,
        radius: 17,
        on: ROLE.evidence,
        off: ROLE.poison,
        opacity: alpha,
        reveal: t10,
      }),
      txt(
        t10 > 0.5 ? `10 / 12 = ${POSITION_PCT.beginning.toFixed(2)}%` : '? / 12',
        160,
        -125,
        36,
        t10 > 0.5 ? ROLE.evidence : COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),

      // Row 2: Middle (7/12)
      txt('MIDDLE', -855, 5, 32, ROLE.poison, 'mono', 'left').opacity(alpha),
      dotRow(-560, 5, POSITION_PROBE.cases, POSITION_PROBE.middle, {
        spacing: 56,
        radius: 17,
        on: ROLE.units,
        off: ROLE.poison,
        opacity: alpha,
        reveal: t7,
      }),
      txt(
        t7 > 0.5 ? `7 / 12 = ${POSITION_PCT.middle.toFixed(2)}%` : '? / 12',
        160,
        5,
        36,
        t7 > 0.5 ? ROLE.poison : COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),

      // Equation: symbolic before concrete, strictly non-overlapping
      df > 0.4 ? eqConcrete.opacity(alpha * df) : eqSymbolic.opacity(alpha * (0.45 + 0.55 * fm)),

      // Bottom summary
      txt(
        df > 0.4
          ? `${Math.round(POSITION_DELTA)} percentage-point drop; score two-source questions separately.`
          : 'Subtract success fractions and multiply by 100 for percentage points.',
        0,
        335,
        32,
        df > 0.4 ? ROLE.note : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    ];

    return group(...nodes);
  });

  // Hide 3D surface cleanly when swapping to B3 score sheet
  const view3dWrap = guardedDynamic(viewMain, (alpha) =>
    alpha > 0.05 ? rot3d.opacity(alpha) : [],
  );

  s.add(bgAura, title, view3dWrap, rotLayer, scoreLayer);

  // B1: deepen context rot as Chroma study is narrated
  playBeat(s, c, 1, (d) => s.play(rotDepth.to(1, { duration: Math.max(d, 1.4) })));

  // B2: slide needle beginning -> middle -> end, then switch to two-source question
  playCue(s, c, 'ce-position-move', () => {
    s.play(probePos.to(0.5, { duration: 1.4 }));
    s.play(probePos.to(0.95, { duration: 1.2 }));
  });
  playCue(s, c, 'probe-combine', (d) => s.play(showCombine.to(1, { duration: d })));
  playCue(s, c, 'probe-next', (d) => s.play(showScope.to(1, { duration: d })));

  // B3: sequential swap to 12-case score board, then reveal 10/12, 7/12, 25 pp after cues
  playBeat(s, c, 3, (d) => s.play(swapVis(viewMain, viewScores, d)));
  playCue(s, c, 'ce-position-ten', (d) => s.play(showTen.to(1, { duration: d })), { after: true });
  playCue(s, c, 'ce-position-seven', (d) => s.play(showSeven.to(1, { duration: d })), {
    after: true,
  });
  playCue(s, c, 'ce-capacity-and-evidence-4', (d) => s.play(showFormula.to(1, { duration: d })));
  playCue(s, c, 'ce-position-difference', (d) => s.play(showDiff.to(1, { duration: d })), {
    after: true,
  });
}
