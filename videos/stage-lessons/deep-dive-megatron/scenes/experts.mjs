// Scene 15: How do expert ranks share a layer? (T3 -> E2 [2,0] w=3/4 + E7 [0,4] w=1/4 -> [1.5, 1]; 8-token skew onto E2; 256-GPU parallel folding).
import {
  COSMOS,
  ROLE,
  aura,
  buildFoldedWorld3d,
  expertSkewTrace,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  orbitScene,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function experts(s, c) {
  const phase = s.value(0);
  // step: 0=T3 dispatch (HOLD!), 1=3/4*2=1.5, 2=1/4*4=1 -> [1.5,1], 3=8 tokens batch, 4=skew E2->8, 5=256 world, 6=folded EP=64
  const step = s.value(0);
  const foldVal = s.value(0);

  const bgAura = aura(0, 15, 640, '#f59e0b1c', '#60a5fa18');
  const title = heroTitle(['How Expert Ranks', 'Share a Layer'], {
    x: -855,
    y: -420,
    size: 54,
    lineHeight: 64,
    accent: ROLE.ep,
    eyebrow: 'ROUTER WEIGHTS · TOKEN SKEW · PARALLEL FOLDING',
  });

  const skewStart = expertSkewTrace(0);
  const skewEnd = expertSkewTrace(1);
  const rig3d = buildFoldedWorld3d(foldVal, phase, { x: 500, y: 20, unit: 88 });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const nodes = [];

    if (st <= 2) {
      // Beat 0-1a: Token T3 -> E2 [2,0] (w=3/4) + E7 [0,4] (w=1/4) -> [1.5, 1]
      nodes.push(
        glassCell(-690, -25, 250, 120, COSMOS.gold, { fill: '#1f1a10', glow: 9 }),
        txt('Token T3', -690, -45, 28, COSMOS.gold, 'mono'),
        txt('Router top-2', -690, 5, 26, COSMOS.muted, 'mono'),

        line([-565, -45], [-290, -145], { color: ROLE.tp, width: 3.5 }),
        line([-565, 0], [-290, 95], { color: COSMOS.magenta, width: 3.5 }),
        txt('w = 3/4', -450, -155, 26, ROLE.tp, 'mono'),
        txt('w = 1/4', -450, 108, 26, COSMOS.magenta, 'mono'),

        glassCell(-115, -145, 350, 125, ROLE.tp, { fill: '#10203a', glow: 8 }),
        txt('Expert 2', -115, -172, 28, ROLE.tp, 'mono'),
        txt('output = [2, 0]', -115, -120, 28, COSMOS.ink, 'mono'),

        glassCell(-115, 95, 350, 125, COSMOS.magenta, { fill: '#291224', glow: 8 }),
        txt('Expert 7', -115, 68, 28, COSMOS.magenta, 'mono'),
        txt('output = [0, 4]', -115, 120, 28, COSMOS.ink, 'mono'),

        line([60, -145], [270, -25], { color: ROLE.tp, width: 3.5 }),
        line([60, 95], [270, -25], { color: COSMOS.magenta, width: 3.5 }),

        glassCell(545, -25, 550, 178, st >= 2 ? ROLE.good : COSMOS.gold, {
          fill: st >= 2 ? '#0e2624' : '#1b1a14',
          glow: 10,
        }),
        txt('COMBINED T3', 545, -78, 26, COSMOS.muted, 'mono'),
        txt(
          st === 0 ? '[ ?, ? ]' : st === 1 ? '[ 1.5, ? ]' : '[ 1.5, 1.0 ]',
          545,
          -18,
          36,
          st >= 2 ? ROLE.good : COSMOS.gold,
          'mono',
        ),
        txt(
          st === 0
            ? 'Predict combined vector'
            : st === 1
              ? '3/4 x 2 = 1.5 in coord 0'
              : '3/4[2,0] + 1/4[0,4] = [1.5,1]',
          545,
          38,
          26,
          COSMOS.ink,
          'mono',
        ),
      );
    } else if (st <= 4) {
      // Beat 1b: 8 tokens, top-2 -> 16 assignments across Experts [2, 7, 4, 9], skewing onto Expert 2 (all 8 tokens!)
      const snap = st === 3 ? skewStart : skewEnd;
      const e2Count = snap.counts[0];
      nodes.push(
        txt(
          st === 3
            ? '8 TOKENS x TOP-2 = 16 ASSIGNMENTS (BALANCED)'
            : 'SKEWED ROUTING: ALL 8 TOKENS HIT EXPERT 2!',
          0,
          -235,
          28,
          st === 4 ? ROLE.bad : COSMOS.gold,
          'mono',
        ),
      );
      snap.experts.forEach((expId, idx) => {
        const cnt = snap.counts[idx];
        const x = -480 + idx * 320;
        const barH = cnt * 36;
        const isHot = expId === 2 && st === 4;
        nodes.push(
          glassCell(x, 120 - barH / 2, 220, Math.max(48, barH), isHot ? ROLE.bad : ROLE.ep, {
            fill: isHot ? '#311322' : '#1b1a14',
            glow: isHot ? 12 : 5,
          }),
          txt(`${cnt}`, x, 120 - barH - 28, 30, isHot ? ROLE.bad : COSMOS.ink, 'mono'),
          txt(`Expert ${expId}`, x, 165, 26, isHot ? ROLE.bad : COSMOS.muted, 'mono'),
        );
      });
      nodes.push(
        txt(
          `Expert 2 load: ${e2Count} of ${snap.tokens} tokens (total assignments fixed at ${snap.totalAssignments})`,
          0,
          245,
          28,
          st === 4 ? ROLE.bad : COSMOS.ink,
          'sans',
        ),
      );
    } else {
      // Beat 2: Same 256 GPUs refactored (Attention TP4 x CP2 x DP8 x PP4 vs Expert ETP1 x EP64 x EDP1 x PP4)
      nodes.push(
        glassCell(-420, -90, 780, 148, ROLE.tp, { fill: '#101f38', glow: 8 }),
        txt('ATTENTION GRID (256 GPUs)', -420, -124, 26, ROLE.tp, 'mono'),
        txt('TP=4  x  CP=2  x  DP=8  x  PP=4', -420, -64, 30, COSMOS.ink, 'mono'),

        glassCell(-420, 105, 780, 162, st >= 6 ? ROLE.ep : ROLE.dim, {
          fill: st >= 6 ? '#1f1a10' : '#0f1628',
          glow: st >= 6 ? 10 : 4,
        }),
        txt('FOLDED EXPERT GRID (SAME 256 GPUs)', -420, 62, 26, ROLE.ep, 'mono'),
        txt('ETP=1  x  EP=64  x  EDP=1  x  PP=4', -420, 118, 30, COSMOS.ink, 'mono'),
        txt('Each expert matrix stays whole; PP=4 matches', -420, 165, 26, COSMOS.muted, 'sans'),
      );
    }

    nodes.push(
      txt(
        st >= 5
          ? 'Parallel folding regroups the same 256 ranks while keeping pipeline stages aligned'
          : 'Router weights scale each expert output before summing at the source token',
        0,
        368,
        26,
        COSMOS.muted,
        'sans',
      ),
    );
    return group(...nodes);
  });

  const rigVis = guardedDynamic(
    () => (Math.round(step.value) >= 5 ? 1 : 0),
    () => rig3d.view,
  );
  s.add(bgAura, title, live, rigVis);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, rig3d.view, { startTheta: -0.78, endTheta: 0.45, startPhi: 0.96, endPhi: 0.84 });
  wireStepCues(s, c, step, [
    ['experts-beat-1-focus-1', 0],
    ['experts-beat-1-focus-2', 0],
    ['experts-weighted-combination', 1, true],
    ['experts-second-contribution', 2, true],
    ['experts-batch', 3],
    ['experts-skew-assignments', 4],
    ['experts-same-rank-world', 5],
    ['experts-folded-ownership', 6],
  ]);
  c.on('experts-folded-ownership', () => s.play(foldVal.to(1, { duration: 0.45 })));
}
