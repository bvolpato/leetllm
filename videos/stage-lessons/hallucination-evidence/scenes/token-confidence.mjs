// Scene 9: What does a token probability measure? (Next-token prob 0.98 vs full-vocab entropy 1.04 nats)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  meterBar,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function tokenConfidence(s, c) {
  const phase = s.value(0);
  const showProb = s.value(0);
  const showToy = s.value(0);
  const showDist = s.value(0);
  const showSum = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2b1b5216');
  const title = heroTitle(['What Does a Token', 'Probability Measure?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.cyan,
    eyebrow: 'TOKEN PROBABILITY vs FACTUALITY · NEXT-TOKEN ENTROPY H(p)',
  });

  const eq = glowTex('H(p) = -\\sum_i p_i \\ln p_i', { size: 38, color: COSMOS.gold }).at(
    510,
    -365,
  );

  const probs = [
    { tok: 'tok A', p: 0.5, col: COSMOS.cyan },
    { tok: 'tok B', p: 0.25, col: COSMOS.emerald },
    { tok: 'tok C', p: 0.25, col: COSMOS.amber },
  ];
  const contribs = probs.map((r) => -r.p * Math.log(r.p));
  const totalH = contribs.reduce((a, b) => a + b, 0);

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const sp = showProb.value;
    const st = showToy.value;
    const sd = showDist.value;
    const ss = showSum.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      // Left: High token confidence != Grounded fact
      txt('PREFIX: "Full recovery is fully..."', -855, -205, 26, COSMOS.amber, 'mono', 'left'),
      glassCell(-465, -70, 770, 198, sp > 0.3 ? COSMOS.rose : COSMOS.muted, {
        fill: '#26111a',
        glow: sp > 0.3 ? 9 * pulse : 3,
      }),
      txt('P("recovered" | prompt, prefix) = 0.98', -825, -124, 28, COSMOS.rose, 'mono', 'left'),
      meterBar(-825, -74, 690, 28, 0.98, COSMOS.rose),
      txt(
        'Measures fluent continuation, NOT runbook truth!',
        -825,
        -22,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),

      glassCell(-465, 162, 770, 198, COSMOS.cyan, { fill: '#101c34', glow: 3 }),
      txt('WHY TOP-k LOGPROBS ARE NOT ENOUGH', -825, 102, 26, COSMOS.cyan, 'mono', 'left'),
      txt(
        '· Entropy needs probabilities across the whole vocab',
        -825,
        148,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        '· Multiple surface words can express the same fact',
        -825,
        190,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        '· Calibrate risk scores on dev; check on held-out',
        -825,
        232,
        26,
        COSMOS.gold,
        'sans',
        'left',
      ),

      // Right: 3-token toy vocabulary entropy calculation [0.5, 0.25, 0.25] -> 1.04 nats
      txt('3-CHOICE TOY VOCABULARY ENTROPY', 110, -205, 26, COSMOS.gold, 'mono', 'left'),
    ];

    probs.forEach((row, i) => {
      const y = -112 + i * 110;
      const contrib = contribs[i];
      nodes.push(
        glassCell(495, y, 750, 88, sd > 0.3 ? row.col : COSMOS.muted, {
          fill: '#10182d',
          glow: sd > 0.3 ? 7 : 2,
        }),
        txt(`${row.tok}: p = ${row.p.toFixed(2)}`, 150, y + 2, 27, row.col, 'mono', 'left'),
        meterBar(405, y + 2, 210, 24, row.p, row.col),
        txt(`+${contrib.toFixed(3)} nats`, 840, y + 2, 26, row.col, 'mono', 'right'),
      );
    });

    nodes.push(
      glassCell(495, 234, 750, 96, ss > 0.3 ? COSMOS.gold : COSMOS.muted, {
        fill: ss > 0.3 ? '#231e10' : '#12182b',
        glow: ss > 0.3 ? 10 * pulse : 2,
      }),
      txt(`Total Entropy H(p) = ${totalH.toFixed(2)} nats`, 495, 236, 32, COSMOS.gold, 'mono'),

      glowDot(-840, 355, { radius: 6, color: COSMOS.gold }),
      txt(
        st > 0.3
          ? 'Surface phrasing variety raises token entropy even when the underlying fact is identical'
          : 'A 0.98 next-token probability tells you fluency, never whether a runbook backs the claim',
        -812,
        357,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, eq, live);
  runPhase(s, c, phase, 14);

  c.on('token-confidence-b1', () => s.play(showProb.to(1, { duration: 0.45 })));
  c.on('token-confidence-b2', () => s.play(showToy.to(1, { duration: 0.4 })));
  c.on('token-distribution', () => s.play(showDist.to(1, { duration: 0.45 })));
  c.on('token-sum', () =>
    s.play(showSum.to(1, { duration: remainDuration(c, 'token-sum', 0.45) })),
  );
}
