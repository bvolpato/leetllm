// Scene 27: Keep different communication products in separate contracts.
// Beat 0: V1 (Buffer + NVSHMEM + zero-SM LL) vs V2 (ElasticBuffer + Gin) vs V2.5 (dedicated buffers, V1 removed).
// Beat 1: Pipeline stages vs Engram integer-index lookup (index 2 -> entry C, remote entry + local scale).
import {
  COSMOS,
  ROLE,
  aura,
  buildJitAndStackRig3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  orbitScene,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function legacyExperimental(s, c) {
  const phase = s.value(0);
  const stackStage = s.value(0);
  const engramMode = s.value(0);
  const fetchProg = s.value(0);

  const bgAura = aura(470, 12, 500, '#fb923c22', '#5ce1e61c');
  const { view: rig3d } = buildJitAndStackRig3d(stackStage, phase, { x: 470, y: 12, unit: 94 });

  const title = heroTitle(['Separate Products,', 'Separate Contracts'], {
    x: -860,
    y: -420,
    size: 54,
    lineHeight: 64,
    accent: ROLE.brand,
    eyebrow: 'V1 / V2 / V2.5 · PIPELINE & ENGRAM LOOKUP',
    subtitle: 'Never conflate archived V1 NVSHMEM with V2/V2.5 or Engram',
  });

  const live = guardedDynamic(1, () => {
    const isEngram = Math.round(engramMode.value) >= 1;
    const gotC = Math.round(fetchProg.value) >= 1;

    const nodes = [
      txt('3D PRODUCT & BUFFER BOUNDARY STACK', 470, -415, 26, ROLE.brand, 'mono').glow(
        5,
        ROLE.brand,
      ),
      txt(
        isEngram
          ? 'Engram: remote entry by integer index + local scale'
          : 'Trace 1 weighted row back to source before timing',
        470,
        435,
        26,
        COSMOS.muted,
        'mono',
      ),
    ];

    if (!isEngram) {
      const tiers = [
        {
          era: 'Archived V1',
          api: 'Buffer + NVSHMEM',
          note: 'separate 0-SM LL RDMA path',
          col: ROLE.bad,
        },
        {
          era: 'Historical V2',
          api: 'ElasticBuffer + Gin',
          note: 'budgets SMs for EP comm',
          col: ROLE.rank0,
        },
        {
          era: 'V2.5 Migration',
          api: 'EP / Bucket / PP / Engram',
          note: 'removes legacy V1 path',
          col: ROLE.good,
        },
      ];
      tiers.forEach((t, i) => {
        const y = -90 + i * 126;
        nodes.push(
          glassCell(-440, y, 820, 102, t.col, { fill: '#0e1729', glow: 6 }),
          txt(t.era, -820, y - 18, 28, t.col, 'mono', 'left'),
          txt(t.api, -60, y - 18, 26, COSMOS.ink, 'mono', 'right'),
          txt(t.note, -820, y + 26, 26, COSMOS.muted, 'sans', 'left'),
        );
      });
      nodes.push(
        txt(
          'Porting? Verify 1 restored weighted row before benchmarking',
          -860,
          292,
          26,
          ROLE.token,
          'sans',
          'left',
        ),
      );
    } else {
      const entries = ['entry A', 'entry B', 'entry C', 'entry D'];
      nodes.push(
        txt(
          'ENGRAM INDEXED LOOKUP (INDEX 2 -> ENTRY C)',
          -860,
          -130,
          26,
          ROLE.token,
          'mono',
          'left',
        ),
      );
      entries.forEach((name, i) => {
        const cx = -755 + i * 210;
        const isHit = i === 2;
        const col = isHit ? (gotC ? ROLE.good : ROLE.nvlink) : COSMOS.dim;
        nodes.push(
          rect(194, 118, {
            fill: isHit ? '#0d2624' : '#0f1628',
            stroke: col,
            width: 2.4,
            radius: 8,
          }).at(cx, -25),
          txt(`idx ${i}`, cx, -50, 26, COSMOS.muted, 'mono'),
          txt(name, cx, 4, 28, col, 'mono'),
        );
      });

      const fromX = -755 + 2 * 210;
      nodes.push(
        line([fromX, 38], [-440, 118], {
          stroke: gotC ? ROLE.good : ROLE.nvlink,
          width: 4,
        }).glow(6, gotC ? ROLE.good : ROLE.nvlink),
        glassCell(-440, 178, 820, 104, gotC ? ROLE.good : ROLE.nvlink, {
          fill: '#0d2224',
          glow: 7,
        }),
        txt(
          gotC ? 'Fetched: entry C (remote) + local scale' : 'Looking up index 2...',
          -440,
          178,
          28,
          gotC ? ROLE.good : ROLE.nvlink,
          'mono',
        ),
        txt(
          'Pipeline sends activations; bucket & Engram keep own consumers',
          -860,
          312,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, rig3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, rig3d, { theta: -0.22, phi: 0.94 });

  c.on('de-legacy-experimental-b0', () =>
    s.play(stackStage.to(1, { duration: remainDuration(c, 'de-legacy-experimental-b0', 0.75) })),
  );
  c.on('de-legacy-experimental-b1', () => {
    const dur = remainDuration(c, 'de-legacy-experimental-b1', 0.55);
    s.play(engramMode.to(1, { duration: dur }));
    s.play(stackStage.to(2, { duration: dur }));
  });
  c.on('de-engram-entry', () =>
    s.play(fetchProg.to(1, { duration: remainDuration(c, 'de-engram-entry', 0.65) })),
  );
}
