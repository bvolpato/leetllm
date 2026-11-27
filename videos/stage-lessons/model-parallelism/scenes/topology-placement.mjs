// Scene 17: Which GPUs need to talk? Hybrid TP=4 x PP=2 (3D dual-node NVLink + inter-node PP bridge) -> GB200 NVL72 72-GPU domain -> 8x80=640 GB vs 405B (202.5 GB) & 671B (335.5 GB) INT4.
import {
  COSMOS,
  ROLE,
  aura,
  buildHybridNodes3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  rect,
  remainAfterDuration,
  remainDuration,
  runPhase,
  swapViews,
  txt,
} from '../parts.mjs';

export default function topologyPlacement(s, c) {
  const phase = s.value(0);
  const showHybrid = s.value(1);
  const showNvl = s.value(0);
  const showWeights = s.value(0);

  const p0 = s.value(0);
  const pPlace = s.value(0);
  const pDom = s.value(0);
  const pRaw = s.value(0);
  const pGrp = s.value(0);

  const bgAura = aura(350, 20, 620, '#60a5fa1c', '#ffd16614');
  const { view: hybrid3d } = buildHybridNodes3d(phase, { x: 430, y: 30, unit: 92 });

  const title = heroTitle(['Which GPUs', 'Need to Talk?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.gpu0,
    eyebrow: 'HYBRID TP × PP · NVL72 DOMAIN · 8 × 80 GB INT4 FIT',
  });

  const hybridView = guardedDynamic(showHybrid, (a) => {
    const pl = pPlace.value;
    const nodes = [
      txt('3D DUAL-NODE TP=4 × PP=2 FABRIC', 430, -395, 26, COSMOS.gold, 'mono')
        .glow(5, COSMOS.gold)
        .opacity(a),
      txt(
        'Fast intra-node NVLink TP · 1 inter-node PP edge',
        430,
        420,
        26,
        COSMOS.muted,
        'sans',
      ).opacity(a),

      glassCell(-425, -105, 830, 152, p0.value > 0.3 ? ROLE.gpu0 : COSMOS.dim, {
        fill: '#10213d',
        glow: 8,
        opacity: a,
      }),
      txt('STAGE 0 · EARLY LAYERS (GPUs 0-3)', -425, -142, 28, ROLE.gpu0, 'mono').opacity(a),
      txt(
        'Intra-node NVLink handles per-layer TP collectives',
        -425,
        -76,
        26,
        COSMOS.ink,
        'sans',
      ).opacity(a),

      glassCell(-425, 118, 830, 152, ROLE.gpu1, { fill: '#0e2b38', glow: 8, opacity: a }),
      txt('STAGE 1 · LATER LAYERS (GPUs 4-7)', -425, 81, 28, ROLE.gpu1, 'mono').opacity(a),
      txt(
        'Uneven layer splits balance memory across stages',
        -425,
        147,
        26,
        COSMOS.ink,
        'sans',
      ).opacity(a),

      glassCell(-425, 315, 830, 78, pl > 0.4 ? COSMOS.gold : COSMOS.dim, {
        fill: '#231c0e',
        glow: pl > 0.4 ? 9 : 3,
        opacity: a,
      }),
      txt(
        pl > 0.4
          ? 'Activation crosses between groups once per forward pass'
          : 'Map heavy TP collectives onto fastest coherent links',
        -425,
        315,
        26,
        pl > 0.4 ? COSMOS.gold : COSMOS.muted,
        'sans',
      ).opacity(a),
    ];
    return group(...nodes);
  });

  const nvlView = guardedDynamic(showNvl, (a) => {
    const dm = pDom.value > 0.4;
    const nodes = [
      txt('NVIDIA GB200 NVL72 · 72 COHERENT NVLINK GPUS', 0, -215, 30, ROLE.gpu1, 'mono')
        .glow(6, ROLE.gpu1)
        .opacity(a),
    ];
    // 18 cols x 4 rows = 72 GPUs
    for (let r = 0; r < 72; r++) {
      const gx = -765 + (r % 18) * 90;
      const gy = -115 + Math.floor(r / 18) * 98;
      const hi = r < 8;
      nodes.push(
        rect(70, 70, {
          fill: hi ? '#143866' : '#0f172a',
          stroke: hi ? COSMOS.gold : '#2c3d62',
          width: hi ? 2.8 : 1.6,
          radius: 8,
        })
          .at(gx, gy)
          .glow(hi ? 9 : 0, COSMOS.gold)
          .opacity(a),
      );
    }
    nodes.push(
      glassCell(0, 315, 1280, 82, dm ? COSMOS.gold : ROLE.gpu0, {
        fill: '#101a2e',
        glow: 8,
        opacity: a,
      }),
      txt(
        dm
          ? '8 highlighted GPUs occupy just 1/9 of one 72-GPU NVLink domain'
          : 'Zooming out to rack-scale NVLink fabrics',
        0,
        315,
        28,
        dm ? COSMOS.gold : COSMOS.ink,
        'mono',
      ).opacity(a),
    );
    return group(...nodes);
  });

  const weightsView = guardedDynamic(showWeights, (a) => {
    const rw = pRaw.value > 0.4;
    const gr = pGrp.value > 0.4;
    const cap = 640; // 8 x 80 GB
    const x0 = -560;
    const barW = 1140;

    const models = [
      { name: '405B INT4', gb: 202.5, y: -55, col: ROLE.gpu0 },
      { name: '671B INT4', gb: 335.5, y: 120, col: ROLE.gpu1 },
    ];

    const nodes = [
      txt(
        'SINGLE 8-GPU NODE RAW 4-BIT WEIGHT CHECK (8 × 80 = 640 GB)',
        0,
        -200,
        28,
        COSMOS.gold,
        'mono',
      ).opacity(a),
    ];

    models.forEach((m) => {
      const w = (m.gb / cap) * barW;
      nodes.push(
        txt(m.name, x0 - 30, m.y, 30, m.col, 'mono', 'right').opacity(a),
        rect(barW, 88, { fill: '#0c1426', stroke: COSMOS.dim, width: 2.0, radius: 10 })
          .at(x0 + barW * 0.5, m.y)
          .opacity(a),
        rect(w, 88, {
          fill: m.col === ROLE.gpu0 ? '#122c52' : '#0e3240',
          stroke: m.col,
          width: 2.8,
          radius: 10,
        })
          .at(x0 + w * 0.5, m.y)
          .glow(8, m.col)
          .opacity(a),
        txt(rw ? `${m.gb} GB raw` : '? GB', x0 + w * 0.5, m.y, 30, COSMOS.ink, 'mono').opacity(a),
      );
    });

    nodes.push(
      txt(
        gr ? 'Group total: 8 × 80 GB = 640 GB' : '8 GPUs × 80 GB',
        x0 + barW,
        222,
        30,
        COSMOS.gold,
        'mono',
        'right',
      ).opacity(a),
      glassCell(0, 325, 1340, 78, ROLE.good, { fill: '#0d2624', glow: 8, opacity: a }),
      txt(
        'Check per-GPU share with quantization scales, KV history & workspace, then time a request',
        0,
        325,
        26,
        ROLE.good,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  s.add(bgAura, hybrid3d, title, hybridView, nvlView, weightsView);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, hybrid3d, { theta: -0.18, phi: 0.94 });

  c.on('mp-topology-placement-0', () =>
    s.play(p0.to(1, { duration: remainDuration(c, 'mp-topology-placement-0', 0.4) })),
  );
  c.on('mp-topology-placement-placement', () =>
    s.play(pPlace.to(1, { duration: remainDuration(c, 'mp-topology-placement-placement', 0.5) })),
  );
  c.hide('mp-topology-placement-1', [hybrid3d], { fade: 0.16 });
  c.on('mp-topology-placement-1', () => {
    const d = Math.min(0.16, remainDuration(c, 'mp-topology-placement-1', 0.16));
    swapViews(s, showHybrid, showNvl, d, d);
  });
  c.on('mp-topology-placement-domain', () =>
    s.play(pDom.to(1, { duration: remainDuration(c, 'mp-topology-placement-domain', 0.45) })),
  );
  c.on('mp-topology-placement-2', () => {
    const d = Math.min(0.16, remainDuration(c, 'mp-topology-placement-2', 0.16));
    swapViews(s, showNvl, showWeights, d, d);
  });
  c.after('mp-topology-placement-raw-codes', () =>
    s.play(
      pRaw.to(1, { duration: remainAfterDuration(c, 'mp-topology-placement-raw-codes', 0.4) }),
    ),
  );
  c.on('mp-topology-placement-group', () =>
    s.play(pGrp.to(1, { duration: remainDuration(c, 'mp-topology-placement-group', 0.4) })),
  );
}
