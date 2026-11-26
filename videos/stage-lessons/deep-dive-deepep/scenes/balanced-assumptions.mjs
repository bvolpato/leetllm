// Scene 23: Generalize the destination count without confusing it with top-k.
// Derives G * (1 - C(E - E/G, k) / C(E, k)) step by step, then verifies 5/3 on E=4, G=2, k=2.
import {
  COSMOS,
  RESOURCE_PAIRS,
  ROLE,
  aura,
  buildStreamOverlapRig3d,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  rect,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function balancedAssumptions(s, c) {
  const phase = s.value(0);
  const smSplit = s.value(0.25);
  const waitGate = s.value(0.5);
  const stepVal = s.value(0); // 0..5 derivation progression
  const showFiveThirds = s.value(0);

  const bgAura = aura(470, 12, 500, '#ffd16620', '#5ce1e61c');
  const { view: rig3d } = buildStreamOverlapRig3d(smSplit, waitGate, phase, {
    x: 470,
    y: 12,
    unit: 94,
  });

  const title = heroTitle(['Expected Destinations', 'Under Uniform Top-k'], {
    x: -860,
    y: -420,
    size: 54,
    lineHeight: 64,
    accent: ROLE.token,
    eyebrow: 'COMBINATORIAL BASELINE · REPEATED OWNERSHIP',
    subtitle: 'E experts evenly split across G destinations, picking k distinct experts',
  });

  const fullFormula = glowTex(
    String.raw`\mathbb{E}[\mathrm{dests}] = G\left(1 - \frac{\binom{E - E/G}{k}}{\binom{E}{k}}\right)`,
    { x: -440, y: -55, size: 42, color: ROLE.token, glow: 7 },
  );

  const live = guardedDynamic(1, () => {
    const st = Math.round(stepVal.value);
    const hasFive = Math.round(showFiveThirds.value) >= 1;

    const nodes = [
      txt('3D BALANCED VS SKEWED ROUTE LOAD', 470, -415, 26, ROLE.token, 'mono').glow(
        5,
        ROLE.token,
      ),
      txt(
        hasFive
          ? 'E=4, G=2, k=2 -> 6 pairs -> mean 5/3 dests'
          : 'Measure real histograms before budgeting skewed gates',
        470,
        435,
        26,
        COSMOS.muted,
        'mono',
      ),
    ];

    const steps = [
      { idx: 1, text: '1. Outside experts: E - E/G', col: ROLE.nvlink },
      { idx: 2, text: '2. Miss prob: C(E - E/G, k) / C(E, k)', col: ROLE.brand },
      { idx: 3, text: '3. Hit prob x G: G * (1 - miss)', col: ROLE.good },
    ];
    steps.forEach((item, i) => {
      const y = 62 + i * 68;
      const on = st >= item.idx;
      nodes.push(
        rect(820, 54, {
          fill: on ? '#0e1d2a' : '#0f1424',
          stroke: on ? item.col : COSMOS.dim,
          width: on ? 2.2 : 1.4,
          radius: 7,
        }).at(-440, y),
        txt(item.text, -825, y, 26, on ? item.col : COSMOS.muted, 'mono', 'left'),
      );
    });

    const summaryText = hasFive
      ? `k=2: E(E-1)/2 = ${RESOURCE_PAIRS.length} pairs  ->  mean = 5/3`
      : st >= 4
        ? 'k=2: E(E-1)/2 = 6 pairs  ->  mean = ?'
        : 'Skewed routers depart from uniform math';

    nodes.push(
      glassCell(-440, 298, 840, 92, hasFive ? ROLE.good : ROLE.rank0, {
        fill: hasFive ? '#0d241c' : '#0e1a2e',
        glow: 7,
      }),
      txt(summaryText, -440, 298, 27, hasFive ? ROLE.good : ROLE.rank0, 'mono'),
    );

    return group(...nodes);
  });

  s.add(bgAura, rig3d, title, fullFormula, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, rig3d, { theta: -0.22, phi: 0.94 });

  c.on('de-balanced-assumptions-b0', () =>
    s.play(smSplit.to(0.35, { duration: remainDuration(c, 'de-balanced-assumptions-b0', 0.45) })),
  );
  c.on('de-expected-miss', () =>
    s.play(stepVal.to(1, { duration: remainDuration(c, 'de-expected-miss', 0.4) })),
  );
  c.on('de-expected-outside', () =>
    s.play(stepVal.to(1, { duration: remainDuration(c, 'de-expected-outside', 0.35) })),
  );
  c.on('de-expected-ratio', () =>
    s.play(stepVal.to(2, { duration: remainDuration(c, 'de-expected-ratio', 0.4) })),
  );
  c.on('de-expected-final', () =>
    s.play(stepVal.to(3, { duration: remainDuration(c, 'de-expected-final', 0.4) })),
  );
  c.on('de-balanced-assumptions-b1', () => {
    const dur = remainDuration(c, 'de-balanced-assumptions-b1', 0.5);
    s.play(stepVal.to(4, { duration: dur }));
    s.play(smSplit.to(0.6, { duration: dur }));
  });
  c.after('de-expected-five-thirds', () =>
    s.play(
      showFiveThirds.to(1, { duration: remainAfterDuration(c, 'de-expected-five-thirds', 0.3) }),
    ),
  );
}
