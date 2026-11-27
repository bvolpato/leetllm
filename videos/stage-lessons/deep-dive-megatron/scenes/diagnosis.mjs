// Scene 02: Let the observed wall choose the first partition (TP width, PP depth, CP sequence, DP examples, EP sparse, selective recompute).
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

export default function diagnosis(s, c) {
  const step = s.value(0);

  const bgAura = aura(0, 20, 620, '#60a5fa1c', '#a78bfa18');
  const title = heroTitle(['Let the Observed Wall', 'Choose the First Split'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: ROLE.tp,
    eyebrow: '5D PARALLELISM + RECOMPUTE DIAGNOSTIC MAP',
  });

  const live = guardedDynamic(1, () => {
    const st = step.value;
    const walls = [
      { k: 'TENSOR (TP)', w: 'Wide matrix width', col: ROLE.tp, x: -560, y: -105 },
      { k: 'PIPELINE (PP)', w: 'Deep layer count', col: ROLE.pp, x: 0, y: -105 },
      { k: 'CONTEXT (CP)', w: 'Long sequence length', col: ROLE.cp, x: 560, y: -105 },
      { k: 'DATA (DP)', w: 'Throughput (more samples)', col: ROLE.dp, x: -560, y: 120 },
      { k: 'EXPERT (EP)', w: 'Sparse MoE routing', col: ROLE.ep, x: 0, y: 120 },
      { k: 'RECOMPUTE', w: 'Activation VRAM wall', col: ROLE.warn, x: 560, y: 120 },
    ];

    const nodes = [
      txt('MATCH EACH MEMORY OR TIME WALL TO ITS OWN AXIS', 0, -225, 28, COSMOS.gold, 'mono'),
    ];
    walls.forEach((wl) => {
      nodes.push(
        glassCell(wl.x, wl.y, 500, 172, wl.col, { fill: '#111b31', glow: st >= 1 ? 8 : 5 }),
        txt(wl.k, wl.x, wl.y - 34, 28, wl.col, 'mono'),
        txt(wl.w, wl.x, wl.y + 30, 26, COSMOS.ink, 'sans'),
      );
    });

    nodes.push(
      txt(
        st >= 1
          ? 'Use the smallest supported combination that removes the measured wall, then profile the new wait'
          : 'DP adds independent samples; it does NOT shorten a single sample path inside a wide layer',
        0,
        355,
        28,
        COSMOS.muted,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  wireStepCues(s, c, step, [
    ['mg-diagnosis-b0', 0],
    ['mg-diagnosis-b1', 1],
  ]);
}
