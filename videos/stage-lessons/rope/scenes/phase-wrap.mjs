// Scene 17: phase-wrap: Single fast pair wraps past 2pi (trough & rebound), slower band stays distinct.
import { dynamic, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  bindStepCues,
  cinemaAura,
  cinemaStars,
  clockDial,
  glowDot,
  glowingCurve,
  heroTitle,
  txt,
  wavePath,
} from '../parts.mjs';

const ALL_CUES = [
  'rp-phase-wrap-0-0',
  'phase-wrap-wrapping-frequency-pair-b1-1',
  'rp-phase-wrap-0-1',
  'rp-phase-wrap-0-2',
  'rp-phase-wrap-0-3',
  'phase-wrap-slower-frequency-pair-b2-1',
  'rp-phase-wrap-1-0',
  'rp-phase-wrap-1-1',
  'rp-phase-wrap-1-2',
  'phase-wrap-current-distance-score-b3-1',
  'rp-phase-wrap-2-0',
  'rp-phase-wrap-2-1',
  'rp-phase-wrap-2-2',
];

const F_FAST = 1.0;
const F_SLOW = 0.14;

export default function phaseWrap(s, c) {
  const step = s.value(0);
  const stars = cinemaStars(130, 17, ROLE.query);
  const stageAura = cinemaAura(-380, -30, 560, '#5ce1e622', '#ffd16614');

  const title = heroTitle(['A rotating score', 'can rise again'], {
    x: -860,
    y: -435,
    size: 56,
    lineHeight: 64,
    accent: ROLE.query,
    eyebrow: 'PERIODIC PHASE WRAPPING',
  });

  const live = dynamic(() => {
    const st = step.value;
    // Distance sweeps past 2pi (~6.28) up to 9.5
    const delta = 0.4 + Math.min(8.8, st * 0.85);
    const fastCos = Math.cos(delta * F_FAST);
    const slowCos = Math.cos(delta * F_SLOW);
    const showSlow = Math.max(0, Math.min(1, st - 4.5));

    // Wave plot on right
    const x0 = -60;
    const x1 = 835;
    const wy = 40;
    const maxD = 10;
    const amp = 165;
    const ptsFast = wavePath(x0, x1, wy, amp, (t) => Math.cos(t * maxD * F_FAST), 160);
    const ptsSlow = wavePath(x0, x1, wy, amp, (t) => Math.cos(t * maxD * F_SLOW), 120);

    const mapX = (d) => x0 + (Math.min(maxD, d) / maxD) * (x1 - x0);
    const px = mapX(delta);
    const troughX = mapX(Math.PI);
    const wrapX = mapX(Math.PI * 2);

    const nodes = [
      // Left: Fast wrapping dial + slower distinguishing dial
      clockDial({
        cx: -640,
        cy: -55,
        radius: 138,
        queryAngle: 0,
        keyAngle: -delta * F_FAST,
        showProj: true,
        queryColor: COSMOS.ink,
        keyColor: ROLE.query,
        projColor: fastCos >= 0 ? ROLE.score : ROLE.danger,
        title: `Fast θ₀ = 1.0`,
        subtitle: `cos = ${fastCos.toFixed(2)}`,
        titleColor: ROLE.query,
        subColor: COSMOS.ink,
      }),
      clockDial({
        cx: -310,
        cy: -55,
        radius: 138,
        queryAngle: 0,
        keyAngle: -delta * F_SLOW,
        showProj: showSlow > 0.2,
        queryColor: COSMOS.ink,
        keyColor: COSMOS.gold,
        projColor: COSMOS.gold,
        title: `Slow θ₁ = 0.14`,
        subtitle: `cos = ${slowCos.toFixed(2)}`,
        titleColor: COSMOS.gold,
        subColor: COSMOS.ink,
      }).opacity(0.3 + 0.7 * showSlow),
      // Right: Full cosine wave vs distance Δ showing trough (π) and wrap rebound (2π)
      line([x0, wy], [x1, wy], { stroke: '#35456d', width: 2 }),
      line([x0, wy - amp], [x1, wy - amp], { stroke: '#232e4a', width: 1.4, dash: [5, 7] }),
      line([x0, wy + amp], [x1, wy + amp], { stroke: '#232e4a', width: 1.4, dash: [5, 7] }),
      line([troughX, wy - amp - 24], [troughX, wy + amp + 24], {
        stroke: ROLE.danger,
        width: 2.0,
        dash: [5, 6],
      }).opacity(0.7),
      txt('trough (π)', troughX, wy + amp + 54, 26, ROLE.danger, 'mono'),
      line([wrapX, wy - amp - 24], [wrapX, wy + amp + 24], {
        stroke: ROLE.query,
        width: 2.2,
        dash: [5, 6],
      }).opacity(0.8),
      txt('rebound (2π)', wrapX, wy - amp - 48, 26, ROLE.query, 'mono'),
      glowingCurve(ptsFast, ROLE.query, { width: 4.2, glow: 10 }),
      glowingCurve(ptsSlow, COSMOS.gold, { width: 3.6, glow: 8 }).opacity(0.25 + 0.75 * showSlow),
      glowDot(px, wy - amp * fastCos, { radius: 8.5, color: '#ffffff', glow: 14 }),
      glowDot(px, wy - amp * slowCos, { radius: 7.5, color: COSMOS.gold, glow: 12 }).opacity(
        0.25 + 0.75 * showSlow,
      ),
      // Bottom telemetry
      txt(`Distance Δ = ${delta.toFixed(2)}`, -855, 295, 34, COSMOS.ink, 'mono', 'left'),
      txt(
        'Multiple frequencies separate distances that wrap on one fast clock',
        -855,
        370,
        27,
        COSMOS.muted,
        'sans',
        'left',
      ),
    ];

    return group(...nodes);
  });

  s.add(stars, stageAura, title, live);
  bindStepCues(s, c, step, ALL_CUES, 0.55);
}
