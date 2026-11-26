// Scene 01: Can GPU 0 hold these weights? 16 GB reserve + 70 GB BF16 weights on 80 GB card -> +6 GB spill (strict hold!) -> split 35/35 across 2 GPUs.
import {
  COSMOS,
  LEDGER_1,
  LEDGER_2,
  ROLE,
  aura,
  buildCluster3d,
  checkpointGB,
  deviceGB,
  group,
  guardedDynamic,
  halfGB,
  heroTitle,
  line,
  orbitScene,
  rect,
  remainAfterDuration,
  remainDuration,
  reserveGB,
  runPhase,
  txt,
} from '../parts.mjs';

export default function intro(s, c) {
  const phase = s.value(0);
  const resAlpha = s.value(0);
  const loadP = s.value(0);
  const revSpill = s.value(0);
  const splitP = s.value(0);
  const placeP = s.value(0);
  const sameP = s.value(0);

  const bgAura = aura(440, 25, 520, '#60a5fa22', '#5ce1e618');
  const { view: cluster3d } = buildCluster3d(
    (i) => {
      const mv = placeP.value;
      const ld = loadP.value;
      if (i === 0) return 0.22 + ld * (0.85 - 0.42 * mv);
      return 0.22 + mv * 0.43;
    },
    phase,
    {
      x: 475,
      y: 25,
      unit: 102,
      gpus: 2,
      radius: 1.75,
      ringColor: ROLE.comm,
      rankColors: [ROLE.gpu0, ROLE.gpu1],
    },
  );

  const title = heroTitle(['Can GPU 0 Hold', 'These Weights?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.gpu0,
    eyebrow: '70 GB WEIGHTS · 80 GB GPU CAPACITY',
  });

  const live = guardedDynamic(1, () => {
    const ld = loadP.value;
    const sp = revSpill.value;
    const st = splitP.value;
    const mv = placeP.value;
    const sm = sameP.value;
    const res = resAlpha.value;

    const x0 = -830;
    const px = 7.4; // 80 GB = 592 px, 86 GB = 636.4 px -> ends at -193 px (clean left half)
    const capW = deviceGB * px;
    const resW = reserveGB * px;
    const wtW = checkpointGB * px;
    const halfW = halfGB * px;
    const deficit = reserveGB + checkpointGB - deviceGB; // 6 GB
    const y0 = -60;
    const y1 = 140;

    const nodes = [
      txt('3D 2-GPU NVLINK PAIR', 475, -405, 26, ROLE.comm, 'mono').glow(5, ROLE.comm),
      txt(
        sm > 0.5
          ? 'One model across two memories: 35 + 35 GB'
          : st > 0.5
            ? 'Split 70 GB -> two 35 GB shards'
            : sp > 0.5
              ? 'Full 70 GB copy overflows either 80 GB card'
              : '80 GB GPU with 16 GB runtime reserve',
        475,
        420,
        26,
        sm > 0.5 ? ROLE.good : st > 0.5 ? ROLE.gpu1 : sp > 0.5 ? ROLE.bad : COSMOS.muted,
        'mono',
      ),

      // 80 GB limit line segments (broken around bar bands so stroke never touches bar text)
      line([x0 + capW, -168], [x0 + capW, -112], {
        stroke: COSMOS.gold,
        width: 3.0,
        dash: [8, 6],
      }).glow(6, COSMOS.gold),
      line([x0 + capW, -8], [x0 + capW, 88], {
        stroke: COSMOS.gold,
        width: 3.0,
        dash: [8, 6],
      }).glow(6, COSMOS.gold),
      line([x0 + capW, 192], [x0 + capW, 240], {
        stroke: COSMOS.gold,
        width: 3.0,
        dash: [8, 6],
      }).glow(6, COSMOS.gold),
      txt('80 GB LIMIT', x0 + capW, -196, 26, COSMOS.gold, 'mono'),

      // GPU 0 rail
      txt('GPU 0', x0, -130, 26, ROLE.gpu0, 'mono', 'left'),
      rect(capW, 82, { fill: '#0c1526', stroke: COSMOS.dim, width: 2.0, radius: 8 }).at(
        x0 + capW * 0.5,
        y0,
      ),
      rect(resW, 82, {
        fill: '#232c44',
        stroke: res > 0.5 ? COSMOS.gold : COSMOS.muted,
        width: res > 0.5 ? 2.4 : 1.8,
        radius: 8,
      }).at(x0 + resW * 0.5, y0),
      txt('16 GB', x0 + resW * 0.5, y0, 26, COSMOS.ink, 'mono'),

      // GPU 1 rail
      txt('GPU 1', x0, 70, 26, ROLE.gpu1, 'mono', 'left'),
      rect(capW, 82, { fill: '#0c1526', stroke: COSMOS.dim, width: 2.0, radius: 8 }).at(
        x0 + capW * 0.5,
        y1,
      ),
      rect(resW, 82, { fill: '#232c44', stroke: COSMOS.muted, width: 1.8, radius: 8 }).at(
        x0 + resW * 0.5,
        y1,
      ),
      txt('16 GB', x0 + resW * 0.5, y1, 26, COSMOS.ink, 'mono'),
    ];

    if (st > 0.5) {
      // Left half stays on GPU 0
      nodes.push(
        rect(halfW, 82, { fill: '#122a4d', stroke: ROLE.gpu0, width: 2.6, radius: 8 })
          .at(x0 + resW + halfW * 0.5, y0)
          .glow(8, ROLE.gpu0),
        txt(`${halfGB} GB`, x0 + resW + halfW * 0.5, y0, 28, COSMOS.ink, 'mono'),
      );
      // Right half moves down and left into GPU 1
      const down = Math.min(1, mv * 2);
      const slide = Math.max(0, mv * 2 - 1);
      const rx = x0 + resW + halfW * (1 - slide) + halfW * 0.5;
      const ry = y0 + (y1 - y0) * down;
      nodes.push(
        rect(halfW, 82, { fill: '#0f303c', stroke: ROLE.gpu1, width: 2.6, radius: 8 })
          .at(rx, ry)
          .glow(9, ROLE.gpu1),
        txt(`${halfGB} GB`, rx, ry, 28, COSMOS.ink, 'mono'),
      );
    } else if (ld > 0.02) {
      const wy = y0 - (1 - ld) * 90;
      const strokeCol = sp > 0.5 ? ROLE.bad : ROLE.gpu0;
      nodes.push(
        rect(wtW, 82, {
          fill: sp > 0.5 ? '#2e1323' : '#122a4d',
          stroke: strokeCol,
          width: 2.6,
          radius: 8,
        })
          .at(x0 + resW + wtW * 0.5, wy)
          .glow(8, strokeCol)
          .opacity(Math.min(1, ld * 1.4)),
      );
      if (ld > 0.92) {
        nodes.push(
          txt(`${checkpointGB} GB weights`, x0 + resW + wtW * 0.5, y0, 28, COSMOS.ink, 'mono'),
        );
      }
    }

    if (sp > 0.5 && st < 0.5) {
      nodes.push(
        txt(`+${deficit} GB OVERFLOW`, x0 + capW - 24, 22, 28, ROLE.bad, 'mono', 'right').glow(
          7,
          ROLE.bad,
        ),
      );
    }

    const foot =
      sm > 0.5
        ? `Model parallelism: ${LEDGER_2.weight / 1e9} GB + ${LEDGER_2.weight / 1e9} GB fits both GPUs`
        : st > 0.5
          ? 'Split 70 GB into two 35 GB halves'
          : sp > 0.5
            ? `16 + 70 = 86 GB spills ${-LEDGER_1.free / 1e9} GB past 80 GB`
            : 'Predict: how far past 80 GB do 70 GB of weights stick out?';
    nodes.push(
      txt(
        foot,
        -855,
        325,
        28,
        sm > 0.5 ? ROLE.good : sp > 0.5 ? ROLE.bad : COSMOS.gold,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, cluster3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, cluster3d, { theta: -0.22, phi: 0.92 });

  c.on('load-weights', () =>
    s.play(loadP.to(1, { duration: remainDuration(c, 'load-weights', 0.65) })),
  );
  c.on('reserved-space', () =>
    s.play(resAlpha.to(1, { duration: remainDuration(c, 'reserved-space', 0.4) })),
  );
  c.after('spill', () =>
    s.play(revSpill.to(1, { duration: remainAfterDuration(c, 'spill', 0.4) })),
  );
  c.on('split-weights', () =>
    s.play(splitP.to(1, { duration: remainDuration(c, 'split-weights', 0.4) })),
  );
  c.on('place-half', () =>
    s.play(placeP.to(1, { duration: remainDuration(c, 'place-half', 0.9) })),
  );
  c.on('same-model', () =>
    s.play(sameP.to(1, { duration: remainDuration(c, 'same-model', 0.45) })),
  );
}
