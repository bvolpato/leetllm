// Scene 14: pair-sum: SIGNATURE SHOWPIECE: 2-frequency exact sum + Orbiting 3D K(Delta) Decay Surface!
import { dynamic, group, line, par, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  buildDecaySurface3d,
  cinemaAura,
  cinemaStars,
  clockDial,
  glowDot,
  glowTex,
  glowingCurve,
  guardedDynamic,
  heroTitle,
  orbitScene,
  safeDur,
  txt,
  wavePath,
} from '../parts.mjs';

const F_FAST = 1.0;
const F_SLOW = 0.1;

const ALL_CUES = [
  'rp-pair-sum-0-0',
  'pair-sum-head-summed-score-b1-1',
  'rp-pair-sum-0-1',
  'rp-pair-sum-1-0',
  'pair-sum-frequency-contribution-0-b2-1',
  'pair-sum-frequency-contribution-1-b2-2',
  'rp-pair-sum-1-1',
  'rp-pair-sum-1-2',
  'rp-pair-sum-1-3',
  'pair-sum-frequency-dot-pair-1-b3-1',
  'rp-pair-sum-2-0',
  'rp-pair-sum-2-1',
  'rp-pair-sum-2-2',
];

export default function pairSum(s, c) {
  const deltaVal = s.value(0);
  const vis2d = s.value(1);

  const stars = cinemaStars(135, 14, COSMOS.gold);
  const stageAura = cinemaAura(280, 30, 620, '#ffd16622', '#4c2f8a16');

  const title = heroTitle(['The head adds', 'the pair scores'], {
    x: -860,
    y: -435,
    size: 56,
    lineHeight: 64,
    accent: COSMOS.gold,
    eyebrow: 'MULTI-FREQUENCY INTERFERENCE',
  });

  // Shot 1 (Beats 0-1): Two live dials (fast cyan + slow gold) feeding exact waves & running sum
  const stage2d = guardedDynamic(vis2d, (alpha) => {
    const d = deltaVal.value;
    const cFast = Math.cos(d * F_FAST);
    const cSlow = Math.cos(d * F_SLOW);
    const total = cFast + cSlow;

    const wx0 = -830;
    const wx1 = 200;
    const wy = 265;
    const maxD = 12;
    const ptsFast = wavePath(wx0, wx1, wy, 68, (t) => Math.cos(t * maxD * F_FAST), 150);
    const ptsSlow = wavePath(wx0, wx1, wy, 68, (t) => Math.cos(t * maxD * F_SLOW), 120);
    const ptsSum = wavePath(
      wx0,
      wx1,
      wy,
      68,
      (t) => 0.5 * (Math.cos(t * maxD * F_FAST) + Math.cos(t * maxD * F_SLOW)),
      150,
    );
    const probeX = wx0 + (Math.min(maxD, d) / maxD) * (wx1 - wx0);
    const probeY = wy - 68 * (0.5 * total);

    const nodes = [
      clockDial({
        cx: -550,
        cy: -125,
        radius: 108,
        queryAngle: 0,
        keyAngle: -d * F_FAST,
        showProj: true,
        queryColor: COSMOS.ink,
        keyColor: COSMOS.cyan,
        projColor: COSMOS.cyan,
        title: `Fast θ₀ = 1.0`,
        subtitle: `cos = ${cFast.toFixed(3)}`,
        titleColor: COSMOS.cyan,
        subColor: COSMOS.ink,
      }),
      clockDial({
        cx: -140,
        cy: -125,
        radius: 108,
        queryAngle: 0,
        keyAngle: -d * F_SLOW,
        showProj: true,
        queryColor: COSMOS.ink,
        keyColor: COSMOS.gold,
        projColor: COSMOS.gold,
        title: `Slow θ₁ = 0.1`,
        subtitle: `cos = ${cSlow.toFixed(3)}`,
        titleColor: COSMOS.gold,
        subColor: COSMOS.ink,
      }),
      // Right live bar stack: fast + slow = sum
      txt(`Distance Δ = ${d.toFixed(1)}`, 320, -210, 32, COSMOS.ink, 'mono', 'left'),
      txt(
        `Fast pair:  ${cFast >= 0 ? '+' : ''}${cFast.toFixed(3)}`,
        320,
        -135,
        30,
        COSMOS.cyan,
        'mono',
        'left',
      ),
      txt(
        `Slow pair:  ${cSlow >= 0 ? '+' : ''}${cSlow.toFixed(3)}`,
        320,
        -75,
        30,
        COSMOS.gold,
        'mono',
        'left',
      ),
      line([320, -32], [820, -32], { stroke: '#3a4b73', width: 2 }),
      txt(
        `Sum = ${total >= 0 ? '+' : ''}${total.toFixed(3)}`,
        320,
        18,
        44,
        ROLE.score,
        'mono',
        'left',
      ).glow(8, ROLE.score),
      rect(Math.max(10, Math.abs(total) * 190), 34, {
        fill: total >= 0 ? ROLE.score : ROLE.danger,
        stroke: null,
        radius: 6,
      })
        .at(560 + (total >= 0 ? 1 : -1) * Math.abs(total) * 95, 105)
        .opacity(0.84)
        .glow(8, total >= 0 ? ROLE.score : ROLE.danger)
        .set('blend', 'screen'),
      // Bottom glowing interference wave plot
      line([wx0, wy], [wx1, wy], { stroke: '#2c3b5e', width: 1.8 }),
      glowingCurve(ptsFast, COSMOS.cyan, { width: 2.6, glow: 6 }).opacity(0.68),
      glowingCurve(ptsSlow, COSMOS.gold, { width: 2.6, glow: 6 }).opacity(0.72),
      glowingCurve(ptsSum, ROLE.score, {
        width: 4.4,
        glow: 10,
        gradientColors: [COSMOS.cyan, COSMOS.emerald, COSMOS.gold],
      }),
      line([probeX, wy - 86], [probeX, wy + 86], {
        stroke: '#ffffff',
        width: 2.0,
        dash: [4, 5],
      }).opacity(0.6),
      glowDot(probeX, probeY, { radius: 8.5, color: '#ffffff', glow: 14 }),
      txt('Δ = 0', wx0, wy + 120, 26, COSMOS.dim, 'mono'),
      txt('Δ = 12', wx1, wy + 120, 26, COSMOS.dim, 'mono'),
      txt(
        'Cyan: fast   ·   Gold: slow   ·   Emerald: sum',
        320,
        265,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),
    ];
    return group(...nodes).opacity(alpha);
  });

  // Shot 2 (Beat 2): Orbiting 3D Constructive-Interference K(Delta) Decay Surface!
  const surfaceView = buildDecaySurface3d({ x: 300, y: -24 });
  const surfaceCopy = group(
    glowTex(String.raw`K(\Delta) = \frac{1}{P}\sum_{i=0}^{P-1}\cos(\Delta\,\theta_i)`, {
      x: -575,
      y: -145,
      size: 36,
      color: COSMOS.cyan,
      glow: 6,
    }),
    txt('All clocks align at Δ = 0 → sharp peak', -860, 120, 28, COSMOS.gold, 'sans', 'left'),
    txt('Phases cancel at large Δ → smooth decay', -860, 178, 28, COSMOS.ink, 'sans', 'left'),
    txt('Content vectors scale amplitude & phase', -860, 250, 28, COSMOS.muted, 'sans', 'left'),
  );

  s.add(stars, stageAura, title, stage2d);

  // Wire EVERY cue cleanly: Beat 0-1 sweep delta continuously from 0 to 10.5
  ALL_CUES.forEach((id, idx) => {
    const cue = c.cue(id);
    if (idx < 9) {
      const target = Math.min(10.5, (idx + 1) * 1.15);
      c.on(id, () => s.play(deltaVal.to(target, { duration: safeDur(c, cue.start, 1.1) })));
    }
  });

  // Beat 2: swap smoothly to the jaw-dropping 3D K(Delta) interference surface + continuous camera orbit!
  const beat2Cue = c.cue('rp-pair-sum-2-0');
  c.on('rp-pair-sum-2-0', () => s.play(vis2d.to(0, { duration: 0.45 })));
  c.show('rp-pair-sum-2-0', [surfaceView, surfaceCopy], { lead: -0.25 });
  // Mark remaining Beat 2 cues used with gentle progress
  for (const id of ['pair-sum-frequency-dot-pair-1-b3-1', 'rp-pair-sum-2-1', 'rp-pair-sum-2-2']) {
    const cue = c.cue(id);
    c.on(id, () => s.play(deltaVal.to(11.5, { duration: safeDur(c, cue.start, 0.5) })));
  }
  orbitScene(
    s,
    c,
    surfaceView,
    { theta: -0.58, phi: 0.96 },
    {
      startOffset: Math.max(0.2, beat2Cue.start - c.start),
      endMargin: 0.5,
    },
  );
}
