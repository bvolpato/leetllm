// Scene 17: Center the pair midpoint without confusing its spread: TRL centering term 4*gamma*m^2 & PPO beta/3 equivalence.
import {
  COSMOS,
  aura,
  circle,
  glowDot,
  glowTex,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function centeringAndKl(s, c) {
  const phase = s.value(0);
  const showFormula = s.value(0.45);
  const spreadTo100 = s.value(0);
  const showGap200 = s.value(0);
  const showKlBalance = s.value(0);

  const bgAura = aura(160, 15, 580, '#a78bfa20', '#fb923c18');
  const title = heroTitle(['Centering Midpoints', '& PPO KL Scale'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.violet,
    eyebrow: 'MIDPOINT PENALTY  ·  REWARD / KL EQUIVALENCE',
  });

  const eqCenter = glowTex(
    String.raw`\mathcal{L}_{\text{center}} = \gamma\,(r_w + r_l)^2 = 4\gamma\,\bar{r}^2`,
    { x: 355, y: -365, size: 34, color: COSMOS.violet },
  );

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const sf = showFormula.value;
    const sp = spreadTo100.value;
    const g2 = showGap200.value;
    const kl = showKlBalance.value;
    const pulse = 0.65 + 0.35 * Math.sin(p * 3.4);

    // Top-half axis: -120..+120 centered at 0
    const ax0 = -790;
    const ax1 = 790;
    const ay = -85;
    const mapX = (v) => ax0 + ((v + 120) / 240) * (ax1 - ax0);
    const valPos = 10 + 90 * sp;
    const valNeg = -10 - 90 * sp;
    const zeroX = mapX(0);

    const nodes = [
      txt('PAIR MIDPOINT  r̄ = (r_w + r_l) / 2 = 0', 0, -210, 28, COSMOS.violet, 'mono').opacity(
        Math.max(0.5, sf),
      ),
      line([ax0, ay], [ax1, ay], { stroke: '#455885', width: 3 }),
      ...[-100, -50, 0, 50, 100].map((v) =>
        group(
          line([mapX(v), ay - 8], [mapX(v), ay + 8], {
            stroke: v === 0 ? COSMOS.violet : '#5a6f9c',
            width: v === 0 ? 3 : 2,
          }),
          txt(
            v > 0 ? `+${v}` : String(v),
            mapX(v),
            ay + 40,
            26,
            v === 0 ? COSMOS.violet : COSMOS.muted,
            'mono',
          ),
        ),
      ),

      // Glowing margin span from -val to +val
      glowingTrail(
        [
          [mapX(valNeg), ay],
          [mapX(valPos), ay],
        ],
        { gradientColors: [COSMOS.rose, COSMOS.violet, COSMOS.emerald], width: 6.5, glow: 12 },
      ),
      glowDot(mapX(valNeg), ay, { radius: 11, color: COSMOS.rose }),
      glowDot(mapX(valPos), ay, { radius: 11, color: COSMOS.emerald }),
      circle(15 + pulse * 5, { fill: null, stroke: COSMOS.violet, width: 2.5 })
        .at(zeroX, ay)
        .opacity(0.8)
        .set('blend', 'screen'),
      glowDot(zeroX, ay, { radius: 8, color: COSMOS.violet }),

      txt(
        `r_l = ${valNeg.toFixed(0)}`,
        mapX(valNeg) - 18,
        ay - 46,
        28,
        COSMOS.rose,
        'mono',
        'right',
      ),
      txt(
        `r_w = +${valPos.toFixed(0)}`,
        mapX(valPos) + 18,
        ay - 46,
        28,
        COSMOS.emerald,
        'mono',
        'left',
      ),
      txt('midpoint = 0  →  L_center = 0', zeroX, ay - 96, 26, COSMOS.violet, 'mono'),

      // Spread readout under axis
      txt(
        `Margin Δ = ${(valPos - valNeg).toFixed(0)} points   ·   Centering penalty = 0`,
        0,
        24,
        32,
        g2 > 0.4 ? COSMOS.amber : COSMOS.gold,
        'mono',
      ).glow(7, g2 > 0.4 ? COSMOS.amber : COSMOS.gold),

      // Lower section: PPO Reward / KL Equivalence Lever
      line([-855, 95], [810, 95], { stroke: '#253355', width: 2 }),
      txt('IDEAL RLHF OBJECTIVE', -855, 155, 26, COSMOS.cyan, 'mono', 'left'),
      txt('max  E[ r(x, y) ]  -  β · KL(π ‖ π_ref)', -855, 212, 32, COSMOS.ink, 'mono', 'left'),
      txt(
        'TRL default: γ disabled (0.01 suggested) · align scales before comparing scorers',
        -855,
        282,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),
      txt(
        'Adding prompt constant c(x) preserves optimal policy · PPO distance also depends on clipping',
        -855,
        345,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      // Right-lower equivalence balance
      glowingTrail(
        [
          [170, 225],
          [790, 225],
        ],
        {
          gradientColors: [COSMOS.amber, COSMOS.gold, COSMOS.cyan],
          width: 4.5,
          opacity: Math.max(0.45, kl),
        },
      ),
      circle(12, { fill: COSMOS.gold, stroke: null }).at(480, 225).glow(8, COSMOS.gold),
      txt('3 · r  -  β · KL', 295, 180, 32, COSMOS.amber, 'mono')
        .glow(6, COSMOS.amber)
        .opacity(Math.max(0.45, kl)),
      txt('≡', 480, 180, 42, COSMOS.gold, 'mono').opacity(Math.max(0.45, kl)),
      txt('r  -  (β / 3) · KL', 665, 180, 32, COSMOS.cyan, 'mono')
        .glow(6, COSMOS.cyan)
        .opacity(Math.max(0.45, kl)),
      txt('Same ideal maximizer · 3× weaker KL anchor', 480, 278, 26, COSMOS.gold, 'sans').opacity(
        Math.max(0.45, kl),
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, eqCenter, live);
  runPhase(s, c, phase, 14);

  c.on('centering-and-kl-step-1', () => s.play(showFormula.to(1, { duration: 0.4 })));
  c.on('centering-extreme', () => s.play(spreadTo100.to(1, { duration: 0.7 })));
  c.on('centering-and-kl-step-2', () => s.play(showGap200.to(1, { duration: 0.45 })));
  c.on('centering-and-kl-step-3', () =>
    s.play(showKlBalance.to(1, { duration: remainDuration(c, 'centering-and-kl-step-3', 0.55) })),
  );
}
