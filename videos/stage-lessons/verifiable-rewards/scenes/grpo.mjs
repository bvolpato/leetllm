// Scene 14: Where do these four answers set the baseline? (GRPO mean, std, advantages + uniform guard)
import {
  COSMOS,
  GROUP_4,
  REWARDS,
  aura,
  glassCell,
  glowDot,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function grpo(s, c) {
  const phase = s.value(0);
  const sMean = s.value(0);
  const sDist = s.value(0);
  const sBelow = s.value(0);
  const sSpread = s.value(0);
  const sNorm = s.value(0);
  const modeVal = s.value(0); // 0=mixed [1,0,1,0], 1=all pass [1,1,1,1], 2=all fail [0,0,0,0]
  const sGuard = s.value(0);

  const bgAura = aura(0, 20, 640, '#123d3626', '#2e1e5414');
  const title = heroTitle(['Where Do Four Answers', 'Set the Baseline?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.emerald,
    eyebrow: 'GRPO GROUP-RELATIVE ADVANTAGES · ZERO-STD GUARD',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const sm = Math.max(0.55, sMean.value);
    const sd = sDist.value;
    const sb = sBelow.value;
    const sp = sSpread.value;
    const sn = sNorm.value;
    const md = modeVal.value;
    const gd = sGuard.value;

    const rewards = md > 1.5 ? [0, 0, 0, 0] : md > 0.5 ? [1, 1, 1, 1] : [...REWARDS];
    const mean = md > 1.5 ? 0 : md > 0.5 ? 1 : GROUP_4.mean;
    const std = md > 0.5 ? 0 : GROUP_4.std;
    const advs = md > 0.5 ? [0, 0, 0, 0] : GROUP_4.advantages;

    const x0 = -740;
    const stride = 200;
    const baseY = 230;
    const maxH = 290;
    const meanY = baseY - mean * maxH;

    const nodes = [
      txt(
        md > 1.5
          ? 'ALL MISSES [0, 0, 0, 0]'
          : md > 0.5
            ? 'ALL PASSES [1, 1, 1, 1]'
            : 'MIXED GROUP [1, 0, 1, 0]',
        -830,
        -190,
        26,
        md > 0.5 ? COSMOS.amber : COSMOS.cyan,
        'mono',
        'left',
      ),
      line([-840, baseY], [20, baseY], { stroke: COSMOS.rule, width: 2.2 }),
    ];

    rewards.forEach((r, i) => {
      const cx = x0 + i * stride;
      const pass = r === 1;
      const col = md > 0.5 ? COSMOS.amber : pass ? COSMOS.emerald : COSMOS.rose;
      const h = pass ? maxH : 34;
      const adv = advs[i];
      nodes.push(
        rect(118, h, { fill: pass ? '#12463b' : '#3a1421', stroke: col, width: 2.4, radius: 8 })
          .at(cx, baseY - h * 0.5)
          .glow(pass ? 7 : 3, col),
        txt(`R${i + 1}`, cx, baseY + 38, 26, COSMOS.muted, 'mono'),
        txt(
          sn > 0.5 ? `A=${adv >= 0 ? '+' : ''}${adv.toFixed(0)}` : `r=${r}`,
          cx,
          baseY - h - 26,
          28,
          col,
          'mono',
        ),
      );

      // Signed deviation stems on R1 (+0.5) and R2 (-0.5), offset slightly right of bar center so labels stay clear
      if (md < 0.5 && ((i === 0 && sd > 0.2) || (i === 1 && sb > 0.2))) {
        const stemX = cx + 76;
        const topY = baseY - (pass ? maxH : 0);
        nodes.push(
          line([stemX, topY], [stemX, meanY], { stroke: COSMOS.gold, width: 4.2 }).glow(
            7,
            COSMOS.gold,
          ),
          glowDot(stemX, (topY + meanY) * 0.5, { radius: 6, color: COSMOS.gold }),
        );
      }
    });

    // Mean line (label placed cleanly below baseY or to right so it never overlaps bars/labels)
    nodes.push(
      line([-840, meanY], [20, meanY], { stroke: COSMOS.gold, width: 3.6, dash: [12, 8] })
        .glow(8, COSMOS.gold)
        .opacity(sm),
      txt(`mean = ${mean.toFixed(2)}`, -830, -142, 26, COSMOS.gold, 'mono', 'left').opacity(sm),
    );

    // Right side: Live GRPO statistics telemetry
    const rx = 460;
    nodes.push(
      glassCell(rx, -100, 680, 140, COSMOS.cyan, { fill: '#102138', glow: 6 }),
      txt('GROUP MEAN & POPULATION STD', rx, -135, 26, COSMOS.muted, 'mono'),
      txt(
        `mu = ${mean.toFixed(2)}    sigma = ${std.toFixed(2)}`,
        rx,
        -78,
        38,
        COSMOS.cyan,
        'mono',
      ).glow(sp > 0.3 ? 8 : 3, COSMOS.cyan),

      glassCell(rx, 80, 680, 148, md > 0.5 ? COSMOS.amber : COSMOS.emerald, {
        fill: md > 0.5 ? '#261c0f' : '#0e2824',
        glow: sn > 0.3 || gd > 0.3 ? 9 * pulse : 3,
      }),
      txt('NORMALIZED ADVANTAGES', rx, 40, 26, md > 0.5 ? COSMOS.amber : COSMOS.emerald, 'mono'),
      txt(
        md > 0.5
          ? 'sigma = 0 -> A = [0,0,0,0] (guarded)'
          : sn > 0.3
            ? 'A = [+1, -1, +1, -1]'
            : 'r - mu = [+0.5, -0.5, +0.5, -0.5]',
        rx,
        98,
        28,
        md > 0.5 ? COSMOS.amber : COSMOS.emerald,
        'mono',
      ),
      txt(
        gd > 0.3
          ? 'Zero reward advantage on uniform groups (log them; KL/other terms may still act)'
          : 'Population std divides squared deviations by G = 4',
        0,
        352,
        26,
        COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  const eqGrpo = glowTex('A_i = \\frac{r_i - \\mu_G}{\\sigma_G + \\varepsilon}', {
    x: 460,
    y: 258,
    size: 42,
    color: COSMOS.gold,
    glow: 7,
  });

  s.add(bgAura, title, live, eqGrpo);
  runPhase(s, c, phase, 14);

  c.on('grpo-mean', () => s.play(sMean.to(1, { duration: 0.5 })));
  c.on('grpo-distance', () => s.play(sDist.to(1, { duration: 0.45 })));
  c.on('grpo-below', () => s.play(sBelow.to(1, { duration: 0.45 })));
  c.on('grpo-spread', () => s.play(sSpread.to(1, { duration: 0.5 })));
  c.on('grpo-normalize', () => s.play(sNorm.to(1, { duration: 0.5 })));
  c.on('grpo-pass', () => s.play(modeVal.to(1, { duration: 0.45 })));
  c.on('grpo-fail', () => s.play(modeVal.to(2, { duration: 0.45 })));
  c.on('grpo-guard', () =>
    s.play(sGuard.to(1, { duration: remainDuration(c, 'grpo-guard', 0.45) })),
  );
}
