// Scene 28 (Finale): Replay a step with a zero gradient: missing Adam step counter (t=0->1 vs t=2->3) makes bias correction over-step -> rewind & restore t=2 -> marks align!
import { group } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beforeFresh,
  freshBad,
  freshGood,
  glassCell,
  glowDot,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function freshCounter(s, c) {
  const phase = s.value(0);
  const zeroGrad = s.value(0);
  const showCounts = s.value(0);
  const revGood = s.value(0);
  const revBad = s.value(0);
  const rewound = s.value(0);
  const recounted = s.value(0);
  const restored = s.value(0);

  const bgAura = aura(0, 20, 620, '#6ee7b71c', '#fb71851c');
  const title = heroTitle(['Replay a Step with', 'a Zero Gradient'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.good,
    eyebrow: 'FINALE TRANSFER · ADAM STEP COUNTER',
  });

  const live = guardedDynamic(1, () => {
    const zg = zeroGrad.value;
    const sc = showCounts.value;
    const rg = revGood.value;
    const rb = revBad.value;
    const rw = rewound.value;
    const rc = recounted.value;
    const rs = restored.value;
    const p = phase.value;

    // Weight scale: [0.978 .. 0.990] -> x in [-600, 660]
    const wMin = 0.978;
    const wMax = 0.99;
    const wx = (w) => -600 + ((w - wMin) / (wMax - wMin)) * 1260;
    const startX = wx(beforeFresh.w);
    const goodX = wx(freshGood.w);
    const badX = wx(freshBad.w);

    const nodes = [
      txt(
        rs > 0.5
          ? 'REPAIRED: step=2 RESTORED -> BOTH RUNS LAND AT THE EXACT SAME WEIGHT!'
          : rw > 0.5
            ? 'REWIND TO SAVED CHECKPOINT (w, m, v) AND RESTORE MISSING COUNT = 2'
            : zg > 0.5
              ? 'SAVED AFTER 2 STEPS (g1=+0.5, g2=-0.25)   ·   NEXT GRADIENT g3 = 0.0'
              : 'SAME WEIGHT & MOMENTS AFTER 2 STEPS · ONE COPY RESETS step = 0',
        0,
        -222,
        26,
        rs > 0.5 ? ROLE.good : COSMOS.gold,
        'mono',
      ),
      line([-600, -150], [660, -150], { stroke: COSMOS.muted, width: 2.6 }),
    ];

    [0.98, 0.982, 0.984, 0.986, 0.988].forEach((tk) => {
      const tx = wx(tk);
      nodes.push(
        line([tx, -162], [tx, -138], { stroke: COSMOS.muted, width: 2.4 }),
        txt(tk.toFixed(3), tx, -184, 26, COSMOS.muted, 'mono'),
      );
    });

    // Lane 1: Complete run (step 2 -> 3)
    const countGood = sc > 0.5 ? 'step: 2 -> 3' : 'step: 2';
    nodes.push(
      txt('COMPLETE RUN', -845, -55, 26, ROLE.good, 'mono', 'left'),
      txt(countGood, -845, -18, 26, COSMOS.muted, 'mono', 'left'),
      line([-600, -55], [660, -55], { stroke: COSMOS.dim, width: 2.0 }),
      glowDot(startX, -55, { radius: 9, color: COSMOS.gold }),
    );
    if (rg > 0.5) {
      nodes.push(
        line([startX, -55], [goodX, -55], { stroke: ROLE.good, width: 5.5 }).glow(8, ROLE.good),
        glowDot(goodX, -55, { radius: 11, color: ROLE.good }),
        txt(freshGood.w.toFixed(4), goodX, -98, 26, ROLE.good, 'mono'),
      );
    }

    // Lane 2: Reset counter run (step 0 -> 1, then rewound to 2 -> 3!)
    const isRepaired = rs > 0.5;
    const isRewound = rw > 0.5 && !isRepaired;
    const lane2Col = isRepaired ? ROLE.good : rc > 0.5 ? ROLE.copy : ROLE.bad;
    const countBad = isRepaired
      ? 'step: 2 -> 3 (MATCH!)'
      : rc > 0.5
        ? 'step = 2 restored'
        : sc > 0.5 && !isRewound
          ? 'step: 0 -> 1!'
          : 'step: 0 (missing)';

    nodes.push(
      txt('RESTORED COPY', -845, 95, 26, lane2Col, 'mono', 'left'),
      txt(countBad, -845, 132, 26, lane2Col, 'mono', 'left'),
      line([-600, 95], [660, 95], { stroke: COSMOS.dim, width: 2.0 }),
      glowDot(startX, 95, { radius: 9, color: COSMOS.gold }),
    );

    if (isRepaired) {
      nodes.push(
        line([startX, 95], [goodX, 95], { stroke: ROLE.good, width: 5.5 }).glow(10, ROLE.good),
        glowDot(goodX, 95, { radius: 11, color: ROLE.good }),
        txt(`${freshGood.w.toFixed(4)} (ALIGNED!)`, goodX, 142, 26, ROLE.good, 'mono'),
      );
    } else if (rb > 0.5 && !isRewound) {
      nodes.push(
        line([startX, 95], [badX, 95], { stroke: ROLE.bad, width: 5.5 }).glow(10, ROLE.bad),
        glowDot(badX, 95, { radius: 11, color: ROLE.bad }),
        txt(`${freshBad.w.toFixed(4)} (OVERSHOOTS!)`, badX, 142, 26, ROLE.bad, 'mono'),
      );
    }

    // Alignment vertical guide when repaired
    if (isRepaired) {
      nodes.push(
        line([goodX, -55], [goodX, 95], { stroke: ROLE.good, width: 2.8, dash: [8, 6] }).glow(
          6,
          ROLE.good,
        ),
      );
    }

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-740 + u * 1480, 250, { radius: 6, color: lane2Col }),
      txt(
        isRepaired
          ? 'Verify restart on the same next batch: if weights diverge, check LR, moments m/v, and step count!'
          : rb > 0.5
            ? 'Dividing by (1 - beta^1) instead of (1 - beta^3) amplifies the decayed momentum!'
            : 'Predict: given g3 = 0, will step=2 and step=0 land on the same next weight?',
        0,
        335,
        28,
        isRepaired ? ROLE.good : COSMOS.gold,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('fresh-zero', () =>
    s.play(zeroGrad.to(1, { duration: remainDuration(c, 'fresh-zero', 0.35) })),
  );
  c.on('fresh-counts', () =>
    s.play(showCounts.to(1, { duration: remainDuration(c, 'fresh-counts', 0.35) })),
  );
  c.after('pt-fresh-correct', () =>
    s.play(revGood.to(1, { duration: remainDuration(c, 'pt-fresh-correct', 0.45) })),
  );
  c.after('pt-fresh-wrong', () =>
    s.play(revBad.to(1, { duration: remainDuration(c, 'pt-fresh-wrong', 0.45) })),
  );
  c.on('fresh-rewind', () =>
    s.play(rewound.to(1, { duration: remainDuration(c, 'fresh-rewind', 0.35) })),
  );
  c.on('fresh-recount', () =>
    s.play(recounted.to(1, { duration: remainDuration(c, 'fresh-recount', 0.35) })),
  );
  c.after('pt-fresh-restored', () =>
    s.play(restored.to(1, { duration: remainDuration(c, 'pt-fresh-restored', 0.45) })),
  );
}
