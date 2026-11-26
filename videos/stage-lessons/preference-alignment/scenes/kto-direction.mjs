// Scene 30: A single label reverses the update direction (KTO unpaired desirable vs undesirable waves as r: 1 -> 2)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  glowTex,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  ktoLoss,
  line,
  prefLerp,
  remainDuration,
  runPhase,
  sampleCurve,
  txt,
} from '../parts.mjs';

export default function ktoDirection(s, c) {
  const phase = s.value(0);
  const sIntro = s.value(0);
  const sForm = s.value(0);
  const sEx = s.value(0);
  const sMove = s.value(0);

  const bgAura = aura(320, 15, 560, '#123e3626', '#3c1b2a22');
  const title = heroTitle(['A Single Label Reverses', 'the Update Direction'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'KAHNEMAN-TVERSKY OPTIMIZATION (KTO) · UNPAIRED FEEDBACK AROUND z_0',
  });

  // Dual KTO curve plot on right half: r in [-1, 3], L in [0, 1]
  const px0 = 30;
  const px1 = 830;
  const pyBot = 215;
  const pyTop = -220;
  const mapX = (r) => px0 + ((r + 1) / 4) * (px1 - px0);
  const mapY = (l) => pyBot - l * (pyBot - pyTop);

  const goodPts = sampleCurve(
    (r) => ktoLoss(r, true, 0.5, 0.2),
    [-1, 3],
    [0, 1],
    px0,
    px1,
    pyBot,
    pyTop,
    80,
  );
  const badPts = sampleCurve(
    (r) => ktoLoss(r, false, 0.5, 0.2),
    [-1, 3],
    [0, 1],
    px0,
    px1,
    pyBot,
    pyTop,
    80,
  );

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const mv = sMove.value;
    const r = prefLerp(1.0, 2.0, mv);
    const lGood = ktoLoss(r, true, 0.5, 0.2); // 0.401 -> 0.289
    const lBad = ktoLoss(r, false, 0.5, 0.2); // 0.599 -> 0.711

    const nodes = [
      // Left: Unpaired single-response telemetry & live readouts
      glassCell(-465, -148, 770, 114, COSMOS.cyan, {
        fill: '#0f2138',
        glow: 5,
        opacity: Math.max(0.75, sIntro.value),
      }),
      txt('SINGLE RESPONSE + BINARY LABEL (NO PAIR)', -820, -174, 26, COSMOS.cyan, 'mono', 'left'),
      txt(
        `beta = 0.5 · z_0 = 0.2 · log-ratio r = ${r.toFixed(2)}`,
        -820,
        -124,
        26,
        COSMOS.ink,
        'mono',
        'left',
      ),

      glassCell(-465, -8, 770, 128, COSMOS.emerald, {
        fill: '#0e2824',
        glow: mv > 0.2 ? 10 * pulse : 5,
      }),
      txt('DESIRABLE LABEL (+)', -820, -38, 26, COSMOS.emerald, 'mono', 'left'),
      txt(`L_+ = ${lGood.toFixed(3)}`, -110, -38, 32, COSMOS.emerald, 'mono', 'right'),
      txt(
        'Raising r (1 -> 2) LOWERS loss: 0.401 -> 0.289',
        -820,
        22,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),

      glassCell(-465, 140, 770, 128, COSMOS.rose, {
        fill: '#28101a',
        glow: mv > 0.2 ? 10 * pulse : 5,
      }),
      txt('UNDESIRABLE LABEL (-)', -820, 110, 26, COSMOS.rose, 'mono', 'left'),
      txt(`L_- = ${lBad.toFixed(3)}`, -110, 110, 32, COSMOS.rose, 'mono', 'right'),
      txt(
        'Raising r (1 -> 2) RAISES loss: 0.599 -> 0.711',
        -820,
        170,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),

      // Detached z_0 & telemetry warning
      txt(
        sEx.value > 0.2
          ? 'z_0 estimated from clamped (>=0) mismatched-row log ratios (stop-grad)'
          : 'Click feedback needs clear semantics: guard against selection & class bias',
        -855,
        396,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      // Right plot: Dual opposing sigmoid waves
      txt('KTO OPPOSING BRANCHES AROUND DETACHED z_0 = 0.2', 430, -300, 26, COSMOS.gold, 'mono'),
      line([px0, pyBot], [px1, pyBot], { stroke: COSMOS.rule, width: 2.2 }),
      line([px0, pyBot], [px0, pyTop], { stroke: COSMOS.rule, width: 2.2 }),
      line([mapX(0.2), pyBot], [mapX(0.2), pyTop], {
        stroke: COSMOS.gold,
        width: 2.4,
        dash: [7, 5],
      }),
      txt('z_0=0.2', mapX(0.2), pyBot + 38, 26, COSMOS.gold, 'mono'),
      txt('r=1', mapX(1), pyBot + 38, 26, COSMOS.cyan, 'mono'),
      txt('r=2', mapX(2), pyBot + 38, 26, COSMOS.cyan, 'mono'),
      txt('1.0', px0 + 18, pyTop + 26, 26, COSMOS.muted, 'mono', 'left'),

      glowingTrail(goodPts, { color: COSMOS.emerald, width: 4.8, glow: 10 }),
      glowingTrail(badPts, { color: COSMOS.rose, width: 4.8, glow: 10 }),

      // Live vertical slice at r with both dots
      line([mapX(r), pyBot], [mapX(r), mapY(Math.max(lGood, lBad))], {
        stroke: COSMOS.gold,
        width: 2.4,
        dash: [6, 5],
      }),
      glowDot(mapX(r), mapY(lGood), { radius: 10, color: COSMOS.emerald, glow: 15 }),
      glowDot(mapX(r), mapY(lBad), { radius: 10, color: COSMOS.rose, glow: 15 }),
      txt(lGood.toFixed(3), mapX(r) - 24, mapY(lGood) + 46, 26, COSMOS.emerald, 'mono', 'right'),
      txt(lBad.toFixed(3), mapX(r) - 24, mapY(lBad) - 46, 26, COSMOS.rose, 'mono', 'right'),
    ];

    return group(...nodes);
  });

  const eqKto = glowTex(
    'L_+ = 1 - \\sigma(\\beta(r - z_0)), \\qquad L_- = 1 - \\sigma(\\beta(z_0 - r))',
    {
      x: -465,
      y: 304,
      size: 32,
      color: COSMOS.gold,
      glow: 6,
    },
  );

  s.add(bgAura, title, live, eqKto);
  runPhase(s, c, phase, 14);

  c.on('kto-direction-b0', () =>
    s.play(sIntro.to(1, { duration: remainDuration(c, 'kto-direction-b0', 0.45) })),
  );
  c.on('kto-direction-b1', () =>
    s.play(sForm.to(1, { duration: remainDuration(c, 'kto-direction-b1', 0.45) })),
  );
  c.on('kto-direction-b2', () =>
    s.play(sEx.to(1, { duration: remainDuration(c, 'kto-direction-b2', 0.45) })),
  );
  c.on('pa-kto-move', () =>
    s.play(sMove.to(1, { duration: remainDuration(c, 'pa-kto-move', 1.2) })),
  );
}
