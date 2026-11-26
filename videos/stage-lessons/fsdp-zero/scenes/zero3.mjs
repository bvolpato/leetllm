// Scene 07: Shard model parameters too (ZeRO-3): 0.5W + 0.5G + 1O = 2 units/rank, all-gather before compute -> reshard after!
import {
  COSMOS,
  ROLE,
  ZERO_2,
  ZERO_3,
  aura,
  buildGpuRing3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function zero3(s, c) {
  const ringHeight = s.value(0.5);
  const phase = s.value(0);
  const shardW = s.value(0);
  const gathered = s.value(0); // 1 = materialized, 0 = resharded
  const backward = s.value(0);

  const bgAura = aura(420, 20, 520, '#6ee7b71e', '#5ce1e618');
  const { view: ring3d } = buildGpuRing3d(ringHeight, phase, {
    x: 445,
    y: 25,
    unit: 100,
    gpus: 4,
    color: ROLE.good,
  });

  const title = heroTitle(['ZeRO Stage 3:', 'Shard Parameters Too'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.good,
    eyebrow: 'FULL SHARDING · 3.5 → 2.0 UNITS / RANK',
  });

  const live = guardedDynamic(1, () => {
    const sw = shardW.value;
    const ga = gathered.value;
    const bw = backward.value;
    const wNow = ZERO_2.weights + (ZERO_3.weights - ZERO_2.weights) * sw;
    const totalNow = wNow + ZERO_3.gradients + ZERO_3.optimizer;

    const unitPx = 54;
    const baseY = 170;
    const rankXs = [-720, -520, -320, -120];

    const nodes = [
      txt('3D 4-RANK ALL-GATHER / RESHARD RING', 445, -405, 26, ROLE.good, 'mono').glow(
        5,
        ROLE.good,
      ),
      txt(
        ga > 0.5
          ? 'All-Gather materializes full wrapped unit for compute'
          : bw > 0.5
            ? 'Backward: reduce-scatter grads → local optimizer update'
            : 'Between layers, each rank holds only 1/4 of W, G, Opt',
        445,
        420,
        26,
        ga > 0.5 ? COSMOS.gold : ROLE.good,
        'mono',
      ),
      txt(
        `PER-RANK PERSISTENT STATE: ${totalNow.toFixed(1)} UNITS`,
        -855,
        -205,
        28,
        ROLE.good,
        'mono',
        'left',
      ),
    ];

    rankXs.forEach((rx, r) => {
      nodes.push(txt(`R${r}`, rx, baseY + 38, 26, COSMOS.ink, 'mono'));
      let curBottom = baseY;
      const hW = Math.max(44, (wNow + ga * 1.5) * unitPx);
      nodes.push(
        rect(144, hW - 4, {
          fill: ga > 0.5 ? '#2b2410' : '#132a4f',
          stroke: ga > 0.5 ? COSMOS.gold : ROLE.weights,
          width: ga > 0.5 ? 3.0 : 2.2,
          radius: 8,
        })
          .at(rx, curBottom - hW * 0.5)
          .glow(ga > 0.5 ? 10 : 4, ga > 0.5 ? COSMOS.gold : ROLE.weights),
        txt(
          ga > 0.5 ? 'W full' : `W${r}:0.5`,
          rx,
          curBottom - hW * 0.5,
          26,
          ga > 0.5 ? COSMOS.gold : ROLE.weights,
          'mono',
        ),
      );
      curBottom -= hW;

      const hG = Math.max(42, ZERO_3.gradients * unitPx);
      nodes.push(
        rect(144, hG - 4, { fill: '#231742', stroke: ROLE.grads, width: 2.2, radius: 8 }).at(
          rx,
          curBottom - hG * 0.5,
        ),
        txt(`G${r}:0.5`, rx, curBottom - hG * 0.5, 26, ROLE.grads, 'mono'),
      );
      curBottom -= hG;

      const hO = Math.max(46, ZERO_3.optimizer * unitPx);
      nodes.push(
        rect(144, hO - 4, { fill: '#2b2210', stroke: ROLE.opt, width: 2.2, radius: 8 }).at(
          rx,
          curBottom - hO * 0.5,
        ),
        txt(`O${r}:1`, rx, curBottom - hO * 0.5, 26, ROLE.opt, 'mono'),
      );
    });

    nodes.push(
      txt(
        ga > 0.5
          ? 'Gathered copy lives only while wrapped unit computes'
          : 'Smaller wrapped units cut peak memory but add collectives',
        -855,
        305,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, ring3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, ring3d, { theta: -0.18, phi: 0.92 });

  c.on('zero3-b1-1', () => {
    const dur = remainDuration(c, 'zero3-b1-1', 0.5);
    s.play(shardW.to(1, { duration: dur }));
    s.play(ringHeight.to(0.28, { duration: dur }));
  });
  c.on('zero3-b2-1', () => {
    const dur = remainDuration(c, 'zero3-b2-1', 0.45);
    s.play(gathered.to(1, { duration: dur }));
    s.play(ringHeight.to(0.95, { duration: dur }));
  });
  c.on('zero3-b2-2', () => {
    const dur = remainDuration(c, 'zero3-b2-2', 0.45);
    s.play(gathered.to(0, { duration: dur }));
    s.play(ringHeight.to(0.28, { duration: dur }));
  });
  c.on('zero3-b3-1', () =>
    s.play(backward.to(1, { duration: remainDuration(c, 'zero3-b3-1', 0.45) })),
  );
}
