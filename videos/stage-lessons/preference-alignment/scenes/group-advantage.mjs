// Scene 32: A prompt group supplies its own outcome baseline (GRPO [1, 0, 0.5, 1] -> [0.905, -1.508, -0.302, 0.905] + flat collapse + 3D pillars)
import {
  COSMOS,
  GROUP_MIXED,
  alignmentGroup,
  aura,
  buildGroupPillars3d,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  line,
  orbitScene,
  prefLerp,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function groupAdvantage(s, c) {
  const phase = s.value(0);
  const sIntro = s.value(0);
  const sHelper = s.value(0);
  const sMean = s.value(0);
  const sAdvs = s.value(0);
  const sFlatNote = s.value(0);
  const sUniform = s.value(0);
  const sSave = s.value(0);

  const bgAura = aura(430, 20, 560, '#123e3628', '#2e1a4a18');
  const pillars3d = buildGroupPillars3d(phase, {
    x: 455,
    y: 15,
    rewards: [1, 0, 0.5, 1],
    meanZ: 0.625,
  });

  const title = heroTitle(['A Prompt Group Supplies', 'Its Own Outcome Baseline'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.gold,
    eyebrow: 'GRPO OUTCOME STANDARDIZATION · NO CRITIC MODEL (-44.4% STATE)',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const fl = sUniform.value;
    const sv = sSave.value;

    const rewards = GROUP_MIXED.rewards.map((r) => prefLerp(r, 1.0, fl));
    const cur = fl > 0.95 ? alignmentGroup([1, 1, 1, 1]) : alignmentGroup(rewards);
    const baseY = 54;
    const scaleH = 170;
    const meanY = baseY - cur.mean * scaleH;

    const nodes = [
      txt(
        fl > 0.5
          ? 'UNIFORM [1, 1, 1, 1]: std = 0 -> ALL ADV = 0.000'
          : `GROUP [1, 0, 0.5, 1] · mean=${cur.mean.toFixed(3)} · std=${cur.std.toFixed(3)}`,
        -855,
        -208,
        26,
        fl > 0.5 ? COSMOS.amber : COSMOS.cyan,
        'mono',
        'left',
      ),

      line([-840, baseY], [-60, baseY], { stroke: COSMOS.rule, width: 2.4 }),
      // Mean horizontal gold line
      line([-840, meanY], [-60, meanY], { stroke: COSMOS.gold, width: 3, dash: [8, 5] }).opacity(
        Math.max(0.75, sMean.value),
      ),
    ];

    rewards.forEach((r, i) => {
      const cx = -745 + i * 192;
      const adv = cur.advantages[i];
      const col = fl > 0.8 ? COSMOS.dim : adv >= 0 ? COSMOS.emerald : COSMOS.rose;
      const h = Math.max(16, r * scaleH);
      nodes.push(
        rect(118, h, {
          fill: fl > 0.8 ? '#1b2236' : adv >= 0 ? '#103b33' : '#3a1421',
          stroke: col,
          width: 2.4,
          radius: 7,
        })
          .at(cx, baseY - h * 0.5)
          .glow(fl > 0.8 ? 3 : 7, col),
        txt(`r=${r.toFixed(1)}`, cx, baseY + 34, 26, COSMOS.ink, 'mono'),
        txt(
          sAdvs.value > 0.2 || fl > 0.2
            ? `A=${adv >= 0 ? '+' : ''}${adv.toFixed(2)}`
            : `y_${i + 1}`,
          cx,
          baseY + 74,
          26,
          col,
          'mono',
        ),
      );
    });

    nodes.push(
      // Bottom-left KL + Critic-savings panel
      glassCell(
        -440,
        344,
        825,
        140,
        sv > 0.2 ? COSMOS.emerald : fl > 0.3 ? COSMOS.amber : COSMOS.cyan,
        {
          fill: '#12182b',
          glow: fl > 0.3 || sv > 0.2 ? 9 * pulse : 4,
        },
      ),
      txt(
        sv > 0.2
          ? 'NO CRITIC SAVES 44.4% STATE (2520 -> 1400 GB)'
          : fl > 0.3
            ? 'ZERO REWARD UPDATE (KL PENALTY STILL ACTS)'
            : 'Group std normalizes outcomes without critic V_psi',
        -440,
        316,
        26,
        sv > 0.2 ? COSMOS.emerald : COSMOS.gold,
        'mono',
      ),
      txt(
        sv > 0.2
          ? 'Actor still rolls out G replies; scorer separates them'
          : 'All-pass, all-fail & blind scorer all give std = 0',
        -440,
        368,
        26,
        COSMOS.ink,
        'sans',
      ),

      // Right 3D header
      txt('3D PROMPT GROUP & GOLD MEAN PLANE', 455, -365, 26, COSMOS.emerald, 'mono'),
      txt(
        'Above mean -> positive push · Below mean -> negative pull',
        455,
        396,
        26,
        COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  const eqGrpo = glowTex(
    '\\hat{A}_i = \\frac{r_i - \\mu_{\\text{group}}}{\\sigma_{\\text{group}}}',
    {
      x: -440,
      y: 204,
      size: 32,
      color: COSMOS.gold,
      glow: 6,
    },
  );

  s.add(bgAura, pillars3d, title, live, eqGrpo);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, pillars3d, { theta: -0.22, phi: 0.92 });

  c.on('group-advantage-b0', () =>
    s.play(sIntro.to(1, { duration: remainDuration(c, 'group-advantage-b0', 0.45) })),
  );
  c.on('group-advantage-b1', () =>
    s.play(sHelper.to(1, { duration: remainDuration(c, 'group-advantage-b1', 0.45) })),
  );
  c.on('pa-group-mean', () =>
    s.play(sMean.to(1, { duration: remainDuration(c, 'pa-group-mean', 0.45) })),
  );
  c.on('pa-group-advantages', () =>
    s.play(sAdvs.to(1, { duration: remainDuration(c, 'pa-group-advantages', 0.5) })),
  );
  c.on('group-advantage-b2', () =>
    s.play(sFlatNote.to(1, { duration: remainDuration(c, 'group-advantage-b2', 0.45) })),
  );
  c.on('pa-group-uniform', () =>
    s.play(sUniform.to(1, { duration: remainDuration(c, 'pa-group-uniform', 0.85) })),
  );
  c.on('group-advantage-b3', () =>
    s.play(sSave.to(1, { duration: remainDuration(c, 'group-advantage-b3', 0.55) })),
  );
}
