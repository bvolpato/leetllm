// Scene 08: hardware-contract: Separate Capacity (GB) vs Bandwidth (GB/s): RTX 4090 (24 GB / 1008 GB/s) vs M5 Max (128 GB / 460-614) vs M5 Ultra (512 GB / 1.2 TB/s) & MLX.
import {
  COSMOS,
  ROLE,
  aura,
  bindCueBeat,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  txt,
} from '../parts.mjs';

export default function hardwareContract(s, c) {
  const showMac = s.value(0);
  const showMlx = s.value(0);
  const accent = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#20184422');
  const title = heroTitle(['Hardware Memory Contract:', 'Capacity vs Bandwidth'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: ROLE.vram,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const mc = showMac.value;
    const ml = showMlx.value;
    const capX = -460;
    const bwX = 240;
    const wMax = 480;

    const specs = [
      {
        name: 'RTX 4090 (GDDR6X)',
        cap: 24,
        capStr: '24 GB',
        bw: 1008,
        bwStr: '1008 GB/s',
        col: ROLE.ok,
        op: 1,
      },
      {
        name: 'M5 Max (Unified)',
        cap: 128,
        capStr: '128 GB',
        bw: 614,
        bwStr: '460-614 GB/s',
        col: ROLE.vram,
        op: 0.45 + 0.55 * mc,
      },
      {
        name: 'M5 Ultra (Unified)',
        cap: 512,
        capStr: '512 GB',
        bw: 1200,
        bwStr: '1.2 TB/s',
        col: ROLE.kv,
        op: 0.45 + 0.55 * mc,
      },
    ];

    const nodes = [
      txt('CAPACITY -> MEMORY BUDGET', capX, -215, 26, ROLE.vram, 'mono', 'left').opacity(alpha),
      txt('BANDWIDTH -> DECODE CLOCK', bwX, -215, 26, ROLE.gold, 'mono', 'left').opacity(alpha),
    ];

    specs.forEach((sp, i) => {
      const y = -115 + i * 105;
      const op = alpha * sp.op;
      nodes.push(
        txt(sp.name, -855, y, 26, sp.col, 'mono', 'left').opacity(op),
        lumBar(capX, y, Math.max(18, (sp.cap / 512) * wMax), 34, sp.col, {
          opacity: op,
          maxTrackW: wMax,
        }),
        txt(sp.capStr, capX + wMax + 18, y, 26, sp.col, 'mono', 'left').opacity(op),
        lumBar(bwX, y, (sp.bw / 1200) * wMax, 34, ROLE.gold, { opacity: op, maxTrackW: wMax }),
        txt(sp.bwStr, bwX + wMax + 18, y, 26, ROLE.gold, 'mono', 'left').opacity(op),
      );
    });

    nodes.push(
      chipPill('Unified RAM shares pool with OS + apps + Metal working-set limit', -240, 235, {
        w: 1120,
        h: 72,
        color: ml > 0.3 ? ROLE.gold : COSMOS.rule,
        size: 26,
        opacity: alpha * (0.45 + 0.55 * ml),
      }),
      chipPill('MLX: CPU + GPU (no ANE)', 600, 235, {
        w: 480,
        h: 72,
        color: ml > 0.3 ? ROLE.vram : COSMOS.rule,
        size: 26,
        opacity: alpha * (0.45 + 0.55 * ml),
      }),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'pl-hardware-contract-1-0', (d) => s.play(showMac.to(1, { duration: d })));
  playCue(s, c, 'pl-hardware-contract-2-0', (d) => s.play(showMlx.to(1, { duration: d })));
  bindCueBeat(s, c, accent, [
    'pl-hardware-contract-0-0',
    'pl-hardware-contract-0-1',
    'pl-hardware-contract-0-2',
    'pl-hardware-contract-0-3',
    'pl-hardware-contract-1-1',
    'pl-hardware-contract-1-2',
    'pl-hardware-contract-1-3',
    'pl-hardware-contract-2-1',
    'pl-hardware-contract-2-2',
    'pl-hardware-contract-2-3',
  ]);
}
