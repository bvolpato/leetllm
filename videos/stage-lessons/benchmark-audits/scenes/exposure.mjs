// Scene 16 (exposure): "Preserve case identity through development"
// Dated case cards routing across a March 31 tuning freeze into Regression vs Fresh Holdout + 3D contamination surface.
import {
  COSMOS,
  ROLE,
  aura,
  buildContaminationSurface3d,
  exposureCases,
  glowRing,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  lumBar,
  orbitScene,
  runAmbientPhase,
  tweenCue,
  txt,
} from '../parts.mjs';

export default function exposure(s, c) {
  const phase = s.value(0);
  const moveExposed = s.value(0);
  const focusAprilC = s.value(0);
  const moveFresh = s.value(0);

  const bgAura = aura(450, 20, 560, '#2e1a4a38', '#14304c20');
  const { view: contam3d } = buildContaminationSurface3d(() => moveExposed.value, {
    x: 490,
    y: 15,
    theta: -0.76,
    phi: 1.05,
    distance: 15.6,
    unit: 94,
  });

  const title = heroTitle(['Usage History Governs', 'Holdout Eligibility, Not Date'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 60,
    accent: ROLE.exposed,
    eyebrow: 'DEVELOPMENT EXPOSURE · HOLDOUT RETIREMENT',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.0);
    const expM = moveExposed.value;
    const frM = moveFresh.value;
    const nodes = [];

    // Left 2D sorting stage: x in [-855..20], top launch row at y=-150, destination lanes at y=165
    const startXs = [-745, -515, -285, -55];
    const startY = -145;
    const freezeX = -630;
    const destY = 165;

    // Vertical golden March 31 tuning freeze laser
    nodes.push(
      glowingTrail(
        [
          [freezeX, -235],
          [freezeX, -45],
        ],
        { color: ROLE.focus, width: 3.0, glow: 9, opacity: 0.85, core: false },
      ),
      txt('MAR 31 TUNING FREEZE', freezeX, -260, 26, ROLE.focus, 'mono').glow(6, ROLE.focus),
      // Open glowing destination platforms below cards (zero stroke crossings during flight!)
      lumBar(-615, destY + 80, 440, 8, {
        color: ROLE.exposed,
        fillOpacity: 0.8,
        strokeWidth: 0,
        glow: 10,
        radius: 4,
      }),
      txt('REGRESSION LANE', -615, destY + 118, 28, ROLE.exposed, 'mono').glow(6, ROLE.exposed),
      lumBar(-150, destY + 80, 440, 8, {
        color: ROLE.A,
        fillOpacity: 0.8,
        strokeWidth: 0,
        glow: 10,
        radius: 4,
      }),
      txt('POTENTIAL FRESH HOLDOUT', -150, destY + 118, 28, ROLE.A, 'mono').glow(6, ROLE.A),
    );

    // Target slots inside lanes: A & C -> Regression (-720, -510); B & D -> Fresh Holdout (-255, -45)
    const destXs = [-720, -255, -510, -45];
    exposureCases.forEach((item, i) => {
      const t = item.used ? expM : frM;
      // Two-phase L-shaped glide guarantees cards never cross each other during flight
      const pFirst = Math.min(1, t * 1.9);
      const pSecond = Math.max(0, Math.min(1, (t - 0.45) / 0.55));
      const e1 = pFirst * pFirst * (3 - 2 * pFirst);
      const e2 = pSecond * pSecond * (3 - 2 * pSecond);
      const ex = item.used ? e2 : e1;
      const ey = item.used ? e1 : e2;
      const cx = startXs[i] + (destXs[i] - startXs[i]) * ex;
      const cy = startY + (destY - startY) * ey;
      const col = item.used ? ROLE.exposed : ROLE.A;
      const isHiC = i === 2 && focusAprilC.value > 0.3;

      nodes.push(
        lumBar(cx, cy, 198, 128, {
          color: isHiC ? ROLE.focus : col,
          fillOpacity: 0.24,
          strokeWidth: isHiC ? 3.4 : 2.4,
          glow: isHiC ? 14 * pulse : 8,
          radius: 12,
        }),
        txt(`Case ${item.id}`, cx, cy - 34, 28, col, 'mono'),
        txt(item.date, cx, cy + 2, 26, COSMOS.ink, 'mono'),
        txt(
          item.used ? 'used' : 'untouched',
          cx,
          cy + 36,
          26,
          item.used ? ROLE.fail : ROLE.pass,
          'sans',
        ),
      );
    });

    // Bottom separation rule (safely inside frame bounds)
    nodes.push(
      txt(
        'Keep eval keys out of RAG (rules in index, fixtures in eval store)',
        -855,
        365,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),
      txt('EXPOSURE VS HOLDOUT LANDSCAPE', 490, -345, 26, ROLE.exposed, 'mono').glow(
        5,
        ROLE.exposed,
      ),
      txt('Tuning exposure inflates proxy scores', 490, 365, 26, COSMOS.muted, 'sans'),
    );

    return nodes;
  });

  s.add(bgAura, contam3d, title, live);
  runAmbientPhase(s, c, phase, 2.2);
  orbitScene(s, c, contam3d, { theta: 0.38, phi: 0.96 });

  tweenCue(s, c, 'exposure-beat-1-focus-1', focusAprilC, 0, { duration: 0.1 });
  tweenCue(s, c, 'exposure-beat-1-focus-2', focusAprilC, 0, { duration: 0.1 });
  tweenCue(s, c, 'exposed-move', moveExposed, 1, { duration: 1.1 });
  tweenCue(s, c, 'exposure-beat-2-focus-2', focusAprilC, 1, { duration: 0.45 });
  tweenCue(s, c, 'exposure-beat-2-focus-1', focusAprilC, 1, { duration: 0.25 });
  c.on('exposure-beat-3-focus-1', () => {
    s.play(focusAprilC.to(0, { duration: 0.3 }));
    s.play(moveFresh.to(1, { duration: 1.1 }));
  });
}
