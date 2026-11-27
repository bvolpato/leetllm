// Scene 02: What room is left for a request? 35B BF16 = 70 GB -> 2 GPUs (29 GB free, held!) -> 4 GPUs (17.5 GB, 46.5 GB free) -> 35B resident vs 3B active, 4-bit = 17.5 GB.
import {
  COSMOS,
  LEDGER_2,
  LEDGER_4,
  ROLE,
  aura,
  buildCluster3d,
  checkpointGB,
  deviceGB,
  group,
  guardedDynamic,
  heroTitle,
  line,
  orbitScene,
  rect,
  remainAfterDuration,
  remainBeatDuration,
  remainDuration,
  reserveGB,
  runPhase,
  swapViews,
  txt,
} from '../parts.mjs';

export default function weightBudget(s, c) {
  const phase = s.value(0);
  const showBars = s.value(1);
  const showParams = s.value(0);
  const lowB = s.value(0);
  const rev2 = s.value(0);
  const mode4 = s.value(0);
  const rev4 = s.value(0);
  const resCount = s.value(0);
  const raw4bit = s.value(0);

  const bgAura = aura(440, 20, 520, '#5ce1e620', '#6ee7b716');
  const { view: cluster3d } = buildCluster3d(() => (mode4.value > 0.5 ? 0.34 : 0.62), phase, {
    x: 490,
    y: 25,
    unit: 96,
    gpus: 4,
    radius: 1.9,
    ringColor: ROLE.good,
    rankColors: [ROLE.gpu0, ROLE.gpu1, ROLE.gpu0, ROLE.gpu1],
  });

  const title = heroTitle(['What Room Is Left', 'for a Request?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.good,
    eyebrow: '35B BF16 WEIGHT LEDGER · 2 vs 4 GPUS',
  });

  const barsView = guardedDynamic(showBars, (a) => {
    const four = mode4.value > 0.5;
    const r2 = rev2.value > 0.5;
    const r4 = rev4.value > 0.5;
    const lb = lowB.value > 0.5;

    const x0 = -830;
    const px = 7.4;
    const capW = deviceGB * px; // 592
    const resW = reserveGB * px;
    const sh2 = LEDGER_2.weight / 1e9;
    const fr2 = LEDGER_2.free / 1e9;
    const sh4 = LEDGER_4.weight / 1e9;
    const fr4 = LEDGER_4.free / 1e9;

    const nodes = [
      txt(four ? '4-GPU SHARD RING' : '2-GPU SHARD PAIR', 490, -405, 26, ROLE.good, 'mono')
        .glow(5, ROLE.good)
        .opacity(a),
      txt(
        four
          ? `${checkpointGB} GB / 4 = ${sh4} GB weights / GPU`
          : lb
            ? 'Minimum GPUs = ceil(70 / 64) = 2'
            : 'Usable per GPU = 80 - 16 = 64 GB',
        490,
        420,
        26,
        COSMOS.gold,
        'mono',
      ).opacity(a),
      line([x0 + capW, -168], [x0 + capW, -112], { stroke: COSMOS.gold, width: 3.0, dash: [8, 6] })
        .glow(6, COSMOS.gold)
        .opacity(a),
      line([x0 + capW, -8], [x0 + capW, 88], { stroke: COSMOS.gold, width: 3.0, dash: [8, 6] })
        .glow(6, COSMOS.gold)
        .opacity(a),
      txt('80 GB', x0 + capW, -196, 26, COSMOS.gold, 'mono').opacity(a),
    ];

    // Row 0: always 2-GPU shard (35 GB -> 29 GB free stays visible all through beat 1!)
    const rowConfigs = [
      {
        y: -60,
        label: four ? '2-GPU SPLIT (EACH GPU)' : 'GPU 0 (2-GPU SPLIT)',
        shard: sh2,
        free: fr2,
        showFree: r2,
        col: ROLE.gpu0,
        fill: '#122a4d',
      },
      {
        y: 140,
        label: four ? '4-GPU SPLIT (EACH GPU)' : 'GPU 1 (2-GPU SPLIT)',
        shard: four ? sh4 : sh2,
        free: four ? fr4 : fr2,
        showFree: four ? r4 : r2,
        col: ROLE.gpu1,
        fill: '#0f303c',
      },
    ];

    rowConfigs.forEach((rc) => {
      const shW = rc.shard * px;
      const freeW = rc.free * px;
      nodes.push(
        txt(rc.label, x0, rc.y - 68, 26, rc.col, 'mono', 'left').opacity(a),
        rect(capW, 82, { fill: '#0c1526', stroke: COSMOS.dim, width: 2.0, radius: 8 })
          .at(x0 + capW * 0.5, rc.y)
          .opacity(a),
        rect(resW, 82, { fill: '#232c44', stroke: COSMOS.muted, width: 1.8, radius: 8 })
          .at(x0 + resW * 0.5, rc.y)
          .opacity(a),
        txt('16 GB', x0 + resW * 0.5, rc.y, 26, COSMOS.ink, 'mono').opacity(a),
        rect(shW, 82, { fill: rc.fill, stroke: rc.col, width: 2.6, radius: 8 })
          .at(x0 + resW + shW * 0.5, rc.y)
          .glow(8, rc.col)
          .opacity(a),
        txt(`${rc.shard} GB`, x0 + resW + shW * 0.5, rc.y, 26, COSMOS.ink, 'mono').opacity(a),
      );
      if (rc.showFree) {
        nodes.push(
          rect(freeW, 82, { fill: '#0d2b24', stroke: ROLE.good, width: 2.4, radius: 8 })
            .at(x0 + resW + shW + freeW * 0.5, rc.y)
            .glow(8, ROLE.good)
            .opacity(a),
          txt(
            `${rc.free} GB free`,
            x0 + resW + shW + freeW * 0.5,
            rc.y,
            28,
            ROLE.good,
            'mono',
          ).opacity(a),
        );
      } else {
        nodes.push(
          txt('? GB free', x0 + resW + shW + freeW * 0.5, rc.y, 28, COSMOS.gold, 'mono').opacity(a),
        );
      }
    });

    const foot = r4
      ? '2 GPUs: 29 GB free  ·  4 GPUs: 46.5 GB free per GPU'
      : r2
        ? '2 GPUs leave 29 GB free per GPU'
        : 'Predict: with 35 GB weights + 16 GB reserve, how much room remains?';
    nodes.push(txt(foot, -855, 325, 28, r2 ? ROLE.good : COSMOS.gold, 'sans', 'left').opacity(a));
    return group(...nodes);
  });

  const paramsView = guardedDynamic(showParams, (a) => {
    const raw4 = raw4bit.value > 0.5;
    const rc = resCount.value > 0.5;
    const total = 35;
    const active = 3;
    const bytesPerParam = raw4 ? 0.5 : 2;
    const payload = total * bytesPerParam;

    const nodes = [
      txt(
        'RESIDENT PARAMETERS IN GPU MEMORY (ALL EXPERTS)',
        -840,
        -185,
        28,
        ROLE.gpu0,
        'mono',
        'left',
      ).opacity(a),
      txt(
        'ACTIVE PARAMETERS FOR ONE TOKEN (COMPUTE)',
        -840,
        55,
        28,
        ROLE.gpu1,
        'mono',
        'left',
      ).opacity(a),
    ];

    for (let i = 0; i < total; i++) {
      const bx = -820 + i * 34;
      nodes.push(
        rect(26, 78, {
          fill: rc ? '#173766' : '#122544',
          stroke: ROLE.gpu0,
          width: 1.8,
          radius: 4,
        })
          .at(bx, -108)
          .opacity(a),
        rect(26, 78, {
          fill: i < active ? '#103c48' : '#0b1120',
          stroke: i < active ? ROLE.gpu1 : '#23304d',
          width: i < active ? 2.4 : 1.4,
          radius: 4,
        })
          .at(bx, 132)
          .opacity(a),
      );
    }

    nodes.push(
      txt('~35B resident', -840, -28, 28, ROLE.gpu0, 'mono', 'left').opacity(a),
      txt('~3B active / token', -840, 212, 28, ROLE.gpu1, 'mono', 'left').opacity(a),
      txt(
        raw4
          ? `35B × 0.5 B (4-bit raw codes) = ${payload} GB (+ scales & packing)`
          : `35B × 2 B (BF16) = ${payload} GB stored weights`,
        -840,
        325,
        30,
        raw4 ? COSMOS.gold : COSMOS.ink,
        'mono',
        'left',
      )
        .glow(6, raw4 ? COSMOS.gold : ROLE.gpu0)
        .opacity(a),
    );

    return group(...nodes);
  });

  s.add(bgAura, cluster3d, title, barsView, paramsView);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, cluster3d, { theta: -0.2, phi: 0.92 });

  c.on('lower-bound', () =>
    s.play(lowB.to(1, { duration: remainDuration(c, 'lower-bound', 0.4) })),
  );
  c.after('two-room', () =>
    s.play(rev2.to(1, { duration: remainAfterDuration(c, 'two-room', 0.4) })),
  );
  c.on('four-devices', () =>
    s.play(mode4.to(1, { duration: remainDuration(c, 'four-devices', 0.45) })),
  );
  c.after('four-room', () =>
    s.play(rev4.to(1, { duration: remainAfterDuration(c, 'four-room', 0.4) })),
  );
  c.hide(2, [cluster3d], { fade: 0.16 });
  c.onBeat(2, () => {
    const d = Math.min(0.18, remainBeatDuration(c, 2, 0.18));
    swapViews(s, showBars, showParams, d, d);
  });
  c.on('resident-count', () =>
    s.play(resCount.to(1, { duration: remainDuration(c, 'resident-count', 0.4) })),
  );
  c.after('raw-codes', () =>
    s.play(raw4bit.to(1, { duration: remainAfterDuration(c, 'raw-codes', 0.45) })),
  );
}
