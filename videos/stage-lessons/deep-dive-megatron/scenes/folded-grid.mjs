// Scene 17: Refactor the same ranks into an expert grid (256 GPUs: TP4 x CP2 x DP8 x PP4 vs ETP1 x EP64 x EDP1 x PP4, matched PP groups, 3D folded world).
import {
  COSMOS,
  ROLE,
  aura,
  buildFoldedWorld3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function foldedGrid(s, c) {
  const phase = s.value(0);
  const step = s.value(0); // 0=attention 256, 1=folded 256, 2=separate rank generators (CP=1), 3=matched PP groups
  const foldVal = s.value(0);

  const bgAura = aura(0, 15, 620, '#60a5fa1a', '#f59e0b1c');
  const title = heroTitle(['Refactor the Same Ranks', 'Into an Expert Grid'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.ep,
    eyebrow: 'PARALLEL FOLDING · ONE 256-GPU POPULATION, TWO FACTORIZATIONS',
  });

  const rig3d = buildFoldedWorld3d(foldVal, phase, { x: 495, y: 20, unit: 92 });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const nodes = [];

    nodes.push(
      glassCell(-420, -145, 840, 138, ROLE.tp, { fill: '#101f38', glow: 8 }),
      txt('DENSE / ATTENTION RANK GENERATOR', -420, -182, 26, ROLE.tp, 'mono'),
      txt('TP=4  x  CP=2  x  DP=8  x  PP=4  =  256', -420, -122, 28, COSMOS.ink, 'mono'),

      glassCell(-420, 22, 840, 152, st >= 1 ? ROLE.ep : ROLE.dim, {
        fill: st >= 1 ? '#1f1a10' : '#0f1628',
        glow: st >= 1 ? 10 : 4,
      }),
      txt('FOLDED EXPERT RANK GENERATOR (CP = 1)', -420, -24, 26, ROLE.ep, 'mono'),
      txt('ETP=1  x  EP=64  x  EDP=1  x  PP=4  =  256', -420, 26, 28, COSMOS.ink, 'mono'),
      txt(
        'EDP = copies of an expert shard (need not equal DP=8)',
        -420,
        70,
        26,
        COSMOS.muted,
        'sans',
      ),

      glassCell(-420, 195, 840, 118, st >= 3 ? ROLE.good : ROLE.pp, {
        fill: st >= 3 ? '#0e2624' : '#181430',
        glow: st >= 3 ? 10 : 5,
      }),
      txt(
        st >= 3 ? 'INVARIANT: PIPELINE GROUPS MUST MATCH (PP = 4)' : 'BREAKS OLD EP <= DP LIMIT',
        -420,
        172,
        26,
        st >= 3 ? ROLE.good : ROLE.pp,
        'mono',
      ),
      txt(
        'Product = 256 is only step 1: check shapes, routing, checkpoints',
        -420,
        220,
        26,
        COSMOS.ink,
        'sans',
      ),
    );

    nodes.push(
      txt(
        '3D stack: 4 shared pipeline stages; glowing rings expand when folded onto 64 expert ranks',
        0,
        365,
        26,
        COSMOS.muted,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live, rig3d.view);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, rig3d.view, { startTheta: -0.78, endTheta: 0.48, startPhi: 0.96, endPhi: 0.84 });
  wireStepCues(s, c, step, [
    ['mg-folded-grid-b0', 0],
    ['mg-folded-population', 1],
    ['mg-folded-grid-b1', 2],
    ['mg-matched-pipeline', 3],
  ]);
  c.on('mg-folded-population', () => s.play(foldVal.to(1, { duration: 0.45 })));
}
