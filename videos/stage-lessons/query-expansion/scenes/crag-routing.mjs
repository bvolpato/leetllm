// Scene 13: Which passages should reach the generator? (CRAG evaluator thresholds + private egress gate)
import {
  COSMOS,
  aura,
  correctionPath,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function cragRouting(s, c) {
  const phase = s.value(0);
  const e1Score = s.value(0.81);
  const routeStage = s.value(0); // 0 -> 1 (correct) -> 2 (ambiguous) -> 3 (incorrect)
  const showPermission = s.value(0);

  const bgAura = aura(0, 10, 720, '#10345c26', '#3314261a');
  const title = heroTitle(['Which Passages Should', 'Reach the Generator?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'CORRECTIVE RAG (CRAG) · MAX-SCORE ROUTING & EGRESS GUARD',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const score = e1Score.value;
    const rs = routeStage.value;
    const denied = showPermission.value > 0.5;
    const pulse = 0.74 + 0.26 * Math.sin(p * 3.8);

    const best = Math.max(score, 0.12);
    const activeRoute = correctionPath(best);

    // Spectrum 0.0 .. 1.0 mapped across x = -780 .. +780
    const sx = (v) => -780 + v * 1560;
    const sy = 16;
    const markerX = sx(best);

    const bands = [
      {
        id: 'external',
        x0: sx(0),
        x1: sx(0.2),
        title: 'INCORRECT (< 0.2)',
        action: denied ? 'BLOCKED (PRIVATE)' : 'External fallback',
        sub: denied ? '0 web calls allowed' : 'Discard internal hits',
        col: denied ? COSMOS.rose : COSMOS.amber,
      },
      {
        id: 'combined',
        x0: sx(0.2),
        x1: sx(0.7),
        title: 'AMBIGUOUS (0.2 TO 0.7)',
        action: 'Combine both sources',
        sub: 'Internal + approved ext',
        col: COSMOS.cyan,
      },
      {
        id: 'internal',
        x0: sx(0.7),
        x1: sx(1.0),
        title: 'CORRECT (> 0.7)',
        action: 'Refine internal docs',
        sub: 'Strip noise before gen',
        col: COSMOS.emerald,
      },
    ];

    const nodes = [
      // Top evaluator score readout
      glassCell(-440, -172, 830, 102, COSMOS.blue, { fill: '#10203a', glow: 5 }),
      txt(
        'RETRIEVAL EVALUATOR SCORES (0 TO 1 SCALE)',
        -825,
        -198,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ),
      txt(`E1: ${score.toFixed(2)}`, -825, -148, 34, COSMOS.gold, 'mono', 'left'),
      txt('E2: 0.12', -530, -148, 34, COSMOS.muted, 'mono', 'left'),
      txt(`MAX = ${best.toFixed(2)}`, -48, -148, 34, COSMOS.cyan, 'mono', 'right'),

      // Authorization gate panel (right top)
      glassCell(440, -172, 830, 102, denied ? COSMOS.rose : COSMOS.emerald, {
        fill: denied ? '#2a121c' : '#0e2424',
        glow: denied ? 10 * pulse : 4,
      }),
      txt(
        'AUTHORIZATION & EGRESS GATE',
        55,
        -198,
        26,
        denied ? COSMOS.rose : COSMOS.emerald,
        'mono',
        'left',
      ),
      txt(
        denied
          ? 'PRIVATE POLICY -> 0 WEB CALLS (STAY INTERNAL)'
          : 'Evaluator scores quality; ACL decides egress',
        55,
        -148,
        26,
        denied ? COSMOS.rose : COSMOS.ink,
        'mono',
        'left',
      ),

      // Three colored spectrum bands along ruler
      ...bands.map((b) =>
        rect(b.x1 - b.x0 - 6, 36, { fill: b.col, radius: 6 })
          .opacity(activeRoute === b.id && rs > 0.3 ? 0.85 : 0.24)
          .at((b.x0 + b.x1) / 2, sy),
      ),

      // Threshold tick marks at 0.0, 0.2, 0.7, 1.0
      ...[0, 0.2, 0.7, 1.0].flatMap((v) => [
        line([sx(v), sy - 28], [sx(v), sy + 28], {
          stroke: v === 0.2 || v === 0.7 ? COSMOS.gold : COSMOS.muted,
          width: v === 0.2 || v === 0.7 ? 4 : 2,
        }),
        txt(
          v.toFixed(1),
          sx(v),
          sy + 54,
          28,
          v === 0.2 || v === 0.7 ? COSMOS.gold : COSMOS.muted,
          'mono',
        ),
      ]),

      // Live max-score pointer needle
      line([markerX, sy - 64], [markerX, sy + 24], { stroke: COSMOS.gold, width: 5 }).glow(
        10,
        COSMOS.gold,
      ),
      glowDot(markerX, sy, { radius: 11, color: COSMOS.gold }),
      txt(`best ${best.toFixed(2)}`, markerX, sy - 86, 30, COSMOS.gold, 'mono'),
    ];

    // Three route consequence cards below spectrum
    const cardXs = [-570, 0, 570];
    bands.forEach((b, idx) => {
      const isActive = rs > 0.3 && activeRoute === b.id;
      nodes.push(
        glassCell(cardXs[idx], 216, 540, 166, isActive ? b.col : COSMOS.dim, {
          fill: isActive ? (denied && b.id === 'external' ? '#2a121c' : '#102236') : '#101729',
          glow: isActive ? 10 * pulse : 2,
        }),
        txt(b.title, cardXs[idx], 166, 26, isActive ? b.col : COSMOS.muted, 'mono'),
        txt(b.action, cardXs[idx], 216, 30, isActive ? COSMOS.ink : COSMOS.muted, 'sans'),
        txt(b.sub, cardXs[idx], 262, 26, isActive ? b.col : COSMOS.dim, 'sans'),
      );
    });

    const bottomCol = denied ? COSMOS.rose : COSMOS.gold;
    const bottomMsg = denied
      ? 'Keep private policy questions inside · seek approved internal source or abstain'
      : 'CRAG routes by max document score (paper uses [-1, 1] tuned per dataset); exact marks take middle';

    nodes.push(
      glowDot(-840, 368, { radius: 6, color: bottomCol }),
      txt(bottomMsg, -812, 370, 28, bottomCol, 'sans', 'left'),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('crag-grade', () => s.play(e1Score.to(0.81, { duration: 0.3 })));
  c.on('crag-internal', () => s.play(routeStage.to(1, { duration: 0.4 })));
  c.on('crag-mid', () => s.play(e1Score.to(0.45, { duration: 0.65 })));
  c.on('crag-combined', () => s.play(routeStage.to(2, { duration: 0.4 })));
  c.on('crag-low', () => s.play(e1Score.to(0.17, { duration: 0.65 })));
  c.on('crag-external', () => s.play(routeStage.to(3, { duration: 0.4 })));
  c.after('crag-permission', () =>
    s.play(showPermission.to(1, { duration: remainDuration(c, 'crag-permission', 0.45) })),
  );
}
