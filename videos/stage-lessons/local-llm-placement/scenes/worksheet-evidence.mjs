// Scene 06: worksheet-evidence: Signature orbiting 3D VRAM footprint manifold + 4 common-scale budget bars (12.0 -> 13.1 -> 14.4 -> 32.1 GB!).
import {
  COSMOS,
  MEM_CAP_32K,
  MEM_CAP_4,
  MEM_FULL_4,
  ROLE,
  aura,
  buildVramManifold3d,
  cache,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  orbitScene,
  playCue,
  txt,
} from '../parts.mjs';

export default function worksheetEvidence(s, c) {
  const step = s.value(0); // 0=4x16k capped, 1=4x32k capped, 2=8x16k capped, 3=4x16k uncapped, 4=no reserve still OOM
  const uncapped3d = s.value(0);

  const bgAura = aura(340, 20, 760, '#14386634', '#32142628');
  const title = heroTitle(['Device VRAM Worksheet:', 'Length, Concurrency & Retention'], {
    x: -855,
    y: -430,
    size: 46,
    lineHeight: 54,
    accent: ROLE.vram,
  });

  // Signature orbiting 3D VRAM surface (with 24 GB rose ceiling plane!)
  const vram3d = buildVramManifold3d(uncapped3d, { x: 440, y: 20 });
  orbitScene(s, c, vram3d, { theta: -0.32, phi: 0.94 });

  const total8x16k = 7.6 + 2.0 + cache(16384, 8, true).total; // ~14.43 GB
  const rows = [
    { label: '4 x 16k (cap)', gb: MEM_CAP_4.total, col: ROLE.ok, minSt: 0 },
    { label: '4 x 32k (cap)', gb: MEM_CAP_32K.total, col: ROLE.vram, minSt: 1 },
    { label: '8 x 16k (cap)', gb: total8x16k, col: ROLE.gold, minSt: 2 },
    { label: '4 x 16k (FULL)', gb: MEM_FULL_4.total, col: ROLE.work, minSt: 3 },
  ];

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const st = Math.round(step.value);
    const barX = -855;
    const maxW = 620;
    const maxGb = 34;
    const cap24X = barX + (24 / maxGb) * maxW;

    const nodes = [
      txt(
        'WEIGHTS 7.6 + WORK 2.0 + KV CACHE (24 GB CARD)',
        barX,
        -225,
        26,
        ROLE.vram,
        'mono',
        'left',
      ).opacity(alpha),
      lumBar(cap24X - 2, -10, 4, 340, ROLE.work, { opacity: alpha * 0.8, glow: 8 }),
      txt('24 GB', cap24X, -188, 26, ROLE.work, 'mono', 'center').opacity(alpha),
    ];

    rows.forEach((r, idx) => {
      const y = -135 + idx * 96;
      const active = st >= r.minSt;
      const op = active ? alpha : alpha * 0.42;
      nodes.push(
        txt(r.label, barX, y - 30, 26, r.col, 'mono', 'left').opacity(op),
        lumBar(barX, y + 10, (r.gb / maxGb) * maxW, 30, r.col, { opacity: op, maxTrackW: maxW }),
        txt(`${r.gb.toFixed(1)} GB`, barX + maxW + 18, y + 10, 28, r.col, 'mono', 'left').opacity(
          op,
        ),
      );
    });

    nodes.push(
      txt(
        st >= 4
          ? 'Even with 1 GB work & 0 reserve -> 31+ GB still exceeds 24 GB!'
          : '3D Surface: VRAM demand vs 24 GB ceiling plane',
        440,
        335,
        26,
        st >= 4 ? ROLE.work : ROLE.vram,
        'mono',
        'center',
      ).opacity(alpha),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, vram3d, layer);
  playCue(s, c, 'reference-cache', (d) => s.play(step.to(0, { duration: d })));
  playCue(s, c, 'longer-logs', (d) => s.play(step.to(1, { duration: d })));
  playCue(s, c, 'more-logs', (d) => s.play(step.to(2, { duration: d })));
  playCue(s, c, 'full-storage', (d) =>
    s.play(step.to(3, { duration: d }), uncapped3d.to(1, { duration: d })),
  );
  playCue(s, c, 'remove-reserve', (d) => s.play(step.to(4, { duration: d })));
}
