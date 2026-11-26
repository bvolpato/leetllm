// Scene 15: Construct the mean and population spread from all eight outcomes (8-rollout group + Dr. GRPO note)
import {
  COSMOS,
  GROUP_8,
  GROUP_8_REWARDS,
  aura,
  glassCell,
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

export default function populationGroup(s, c) {
  const phase = s.value(0);
  const sSum = s.value(0);
  const sDev = s.value(0);
  const sStd = s.value(0);
  const sAdv = s.value(0);
  const mode = s.value(0); // 0=4/8 mixed, 1=8/8 pass, 2=0/8 fail
  const sGuard = s.value(0);

  const bgAura = aura(0, 20, 640, '#14385c26', '#2e1e5414');
  const title = heroTitle(['Mean & Population Spread', 'Across Eight Outcomes'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.cyan,
    eyebrow: 'G = 8 ROLLOUTS · POPULATION STD vs DEGENERACY',
  });

  const live = guardedDynamic(s.value(1), () => {
    const sm = Math.max(0.55, sSum.value);
    const dv = sDev.value;
    const st = sStd.value;
    const av = sAdv.value;
    const md = mode.value;
    const gd = sGuard.value;

    const rewards =
      md > 1.5 ? Array(8).fill(0) : md > 0.5 ? Array(8).fill(1) : [...GROUP_8_REWARDS];
    const mean = md > 1.5 ? 0 : md > 0.5 ? 1 : GROUP_8.mean;
    const std = md > 0.5 ? 0 : GROUP_8.std;
    const advs = md > 0.5 ? Array(8).fill(0) : GROUP_8.advantages;

    const x0 = -770;
    const stride = 112;
    const baseY = 200;
    const maxH = 260;
    const meanY = baseY - mean * maxH;

    const nodes = [
      txt(
        md > 1.5
          ? '8 / 8 FAILURES (UNIFORM)'
          : md > 0.5
            ? '8 / 8 PASSES (UNIFORM)'
            : '4 PASSES / 8 ROLLOUTS',
        -830,
        -195,
        26,
        md > 0.5 ? COSMOS.amber : COSMOS.cyan,
        'mono',
        'left',
      ),
      line([-840, baseY], [90, baseY], { stroke: COSMOS.rule, width: 2.2 }),
    ];

    rewards.forEach((r, i) => {
      const cx = x0 + i * stride;
      const pass = r === 1;
      const col = md > 0.5 ? COSMOS.amber : pass ? COSMOS.emerald : COSMOS.rose;
      const h = pass ? maxH : 32;
      nodes.push(
        rect(72, h, { fill: pass ? '#12463b' : '#3a1421', stroke: col, width: 2.2, radius: 7 })
          .at(cx, baseY - h * 0.5)
          .glow(pass ? 6 : 2, col),
        txt(`#${i + 1}`, cx, baseY + 36, 26, COSMOS.muted, 'mono'),
        txt(
          av > 0.5 ? `${advs[i] >= 0 ? '+' : ''}${advs[i].toFixed(0)}` : String(r),
          cx,
          baseY - h - 26,
          26,
          col,
          'mono',
        ),
      );
    });

    nodes.push(
      line([-840, meanY], [90, meanY], { stroke: COSMOS.gold, width: 3.4, dash: [10, 8] })
        .glow(7, COSMOS.gold)
        .opacity(sm),
    );

    // Right stats column
    const rx = 505;
    nodes.push(
      glassCell(rx, -110, 620, 128, COSMOS.cyan, { fill: '#102138', glow: 6 }),
      txt('SUM / 8  &  POPULATION STD', rx, -142, 26, COSMOS.muted, 'mono'),
      txt(
        `mu = ${mean.toFixed(2)}    sigma = ${std.toFixed(2)}`,
        rx,
        -86,
        36,
        COSMOS.cyan,
        'mono',
      ).glow(st > 0.3 ? 8 : 3, COSMOS.cyan),

      glassCell(rx, 64, 620, 148, md > 0.5 ? COSMOS.amber : COSMOS.emerald, {
        fill: md > 0.5 ? '#261c0f' : '#0e2824',
        glow: av > 0.3 || gd > 0.3 ? 8 : 3,
      }),
      txt('ADVANTAGE VECTOR', rx, 26, 26, md > 0.5 ? COSMOS.amber : COSMOS.emerald, 'mono'),
      txt(
        md > 0.5
          ? 'sigma = 0 -> guarded A = 0'
          : av > 0.3
            ? 'pass: +1.0   ·   fail: -1.0'
            : dv > 0.3
              ? 'deviations: +-0.50 (sq = 0.25)'
              : 'compute r_i - mu',
        rx,
        82,
        28,
        md > 0.5 ? COSMOS.amber : COSMOS.emerald,
        'mono',
      ),
      txt(
        gd > 0.3
          ? 'Uniform groups give 0 reward signal (guard denominator; log degenerate rate)'
          : 'Note: Dr. GRPO removes std division to avoid up-weighting near-uniform prompts',
        0,
        345,
        26,
        COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  const eqStd = glowTex('\\sigma_G = \\sqrt{\\frac{1}{8}\\sum_{i=1}^{8}(r_i - \\mu)^2} = 0.5', {
    x: 505,
    y: 245,
    size: 34,
    color: COSMOS.gold,
    glow: 6,
  });

  s.add(bgAura, title, live, eqStd);
  runPhase(s, c, phase, 14);

  c.on('vr-population-group-b0', () => s.play(phase.to(1.5, { duration: 0.4 })));
  c.on('vr-sum-population-group', () => s.play(sSum.to(1, { duration: 0.45 })));
  c.on('vr-deviation-population-group', () => s.play(sDev.to(1, { duration: 0.45 })));
  c.on('vr-std-population-group', () => s.play(sStd.to(1, { duration: 0.45 })));
  c.on('vr-population-group-b1', () => s.play(sAdv.to(0.6, { duration: 0.35 })));
  c.on('vr-advantages-population-group', () => s.play(sAdv.to(1, { duration: 0.45 })));
  c.on('vr-population-group-b2', () => s.play(mode.to(0.4, { duration: 0.2 })));
  c.on('vr-all-pass-population-group', () => s.play(mode.to(1, { duration: 0.4 })));
  c.on('vr-all-fail-population-group', () => s.play(mode.to(2, { duration: 0.4 })));
  c.on('vr-guard-population-group', () =>
    s.play(sGuard.to(1, { duration: remainDuration(c, 'vr-guard-population-group', 0.45) })),
  );
}
