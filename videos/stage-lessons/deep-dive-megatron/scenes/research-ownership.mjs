// Scene 27: Where Megatron's parallel strategies came from (TP col/row pair, 3D cluster schedules, SP + selective recompute, parallel folding; NVIDIA governance & licensing).
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function researchOwnership(s, c) {
  const step = s.value(0); // 0=4 research pillars, 1=NVIDIA governance, tests, sign-off, licenses

  const bgAura = aura(0, 15, 620, '#60a5fa1a', '#a78bfa1a');
  const title = heroTitle(['Research Lineage &', 'Project Ownership'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.tp,
    eyebrow: 'FROM PAPERS TO PINNED CODE · GOVERNANCE & LICENSES',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const nodes = [];

    const papers = [
      { k: 'Paired Col + Row TP', d: 'Skip intermediate sync inside MLP', col: ROLE.tp },
      { k: '3D Cluster Schedules', d: 'Compose TP, PP (1F1B) & DP', col: ROLE.pp },
      { k: 'SP + Selective Recompute', d: 'Cut activation memory & waste', col: ROLE.cp },
      { k: 'Parallel Folding', d: 'Distinct Attention & Expert grids', col: ROLE.ep },
    ];
    papers.forEach((pp, i) => {
      const colIdx = i % 2;
      const rowIdx = Math.floor(i / 2);
      const x = colIdx === 0 ? -420 : 420;
      const y = rowIdx === 0 ? -160 : 10;
      nodes.push(
        glassCell(x, y, 760, 136, st === 0 ? pp.col : ROLE.dim, {
          fill: st === 0 ? '#101d32' : '#0b1120',
          glow: st === 0 ? 9 : 3,
        }),
        txt(pp.k, x, y - 24, 28, pp.col, 'mono'),
        txt(pp.d, x, y + 26, 26, COSMOS.ink, 'sans'),
      );
    });

    // Bottom bar: Governance & Licensing (highlighted on beat 1)
    nodes.push(
      glassCell(0, 185, 1600, 146, st >= 1 ? ROLE.good : ROLE.dim, {
        fill: st >= 1 ? '#0e2524' : '#0c1220',
        glow: st >= 1 ? 10 : 3,
      }),
      txt(
        'NVIDIA-LED OPEN SOURCE: DISCUSS DESIGN · RUN TESTS · SIGN OFF COMMITS',
        0,
        152,
        26,
        st >= 1 ? ROLE.good : COSMOS.muted,
        'mono',
      ),
      txt(
        'Verify repo license, third-party notices, plus separate terms for weights, tokenizers & datasets',
        0,
        212,
        26,
        COSMOS.ink,
        'sans',
      ),
    );

    nodes.push(
      txt(
        'Use each paper to predict communication, then trace the pinned code that executes it',
        0,
        365,
        26,
        COSMOS.muted,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  wireStepCues(s, c, step, [
    ['mg-research-ownership-b0', 0],
    ['mg-research-ownership-b1', 1],
  ]);
}
