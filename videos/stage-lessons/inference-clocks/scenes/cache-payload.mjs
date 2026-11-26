// Scene 10: cache-payload: Orbiting 3D KV-cache tensor slab growing from 1 position (64 KiB) to 4,096 positions (0.25 GiB).
import {
  CAP,
  COSMOS,
  ROLE,
  aura,
  bindCueBeat,
  buildKvStack3d,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  orbitScene,
  playCue,
  txt,
} from '../parts.mjs';

export default function cachePayload(s, c) {
  const depthFrac = s.value(0.14); // 0.14 (1 pos) -> 1.0 (4,096 pos) -> 0.08 (dropped!) -> 1.0 (reused)
  const show64 = s.value(0);
  const showQuarter = s.value(0);
  const showRecurrent = s.value(0);
  const dropped = s.value(0);

  const bgAura = aura(350, 25, 560, '#123a5e28', '#103c3618');
  const kv3d = buildKvStack3d(depthFrac, { x: 350, y: 25 });

  const title = heroTitle(['KV Cache Payload:', 'bytes per position'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: ROLE.clockA,
  });

  const eq = glowTex(
    String.raw`2 \times 16 \times 4 \times 256 \times 2\text{ B} = 64\text{ KiB/pos}`,
    {
      x: 340,
      y: -385,
      size: 32,
      color: ROLE.wait,
      glow: 6,
    },
  );

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const s64 = show64.value;
    const sq = showQuarter.value;
    const rec = showRecurrent.value;
    const drp = dropped.value;
    const kib = CAP.perToken / 1024; // 64
    const nodes = [
      txt(
        'GQA SHARING: 24 QUERY HEADS → 4 KV HEADS',
        -855,
        -215,
        28,
        ROLE.clockA,
        'mono',
        'left',
      ).opacity(alpha),
      txt(
        `1 position across 16 attn layers = ${kib} KiB`,
        -855,
        -135,
        32,
        s64 > 0.2 ? ROLE.wait : COSMOS.dim,
        'mono',
        'left',
      )
        .glow(s64 > 0.2 ? 8 : 0, ROLE.wait)
        .opacity(alpha),
      txt(
        '4,096 cached positions = 0.25 GiB raw KV',
        -855,
        -55,
        32,
        sq > 0.2 ? ROLE.decode : COSMOS.dim,
        'mono',
        'left',
      )
        .glow(sq > 0.2 ? 8 : 0, ROLE.decode)
        .opacity(alpha),

      // 64-layer split bar: 16 attention (KV) + 48 recurrent
      txt(
        '64-LAYER HYBRID BUDGET (16 KV + 48 RECURRENT)',
        -855,
        65,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),
      lumBar(-855, 120, 140, 36, ROLE.clockA, { opacity: alpha }),
      lumBar(-715, 120, 420, 36, ROLE.clockB, { opacity: (0.35 + 0.65 * rec) * alpha }),
      txt('16 KV', -785, 175, 26, ROLE.clockA, 'mono', 'center').opacity(alpha),
      txt('48 recurrent state', -505, 175, 26, ROLE.clockB, 'mono', 'center').opacity(alpha),

      txt(
        drp > 0.5
          ? 'Deleting KV forces full recomputation of all 4,096 positions!'
          : 'Keeping KV intact lets decode read all 4,096 pairs straight away',
        -855,
        290,
        28,
        drp > 0.5 ? ROLE.stall : ROLE.decode,
        'sans',
        'left',
      )
        .glow(drp > 0.5 ? 8 : 0, ROLE.stall)
        .opacity(alpha),
      txt(
        '3D KV Tensor Volume (layers × heads × history)',
        350,
        420,
        26,
        ROLE.clockA,
        'mono',
        'center',
      ).opacity(alpha),
    ];
    return group(...nodes);
  });

  s.add(bgAura, kv3d, title, eq, layer);
  orbitScene(s, c, kv3d, { theta: -0.22, phi: 0.9 }, { startOffset: 0.15, endMargin: 0.5 });

  playCue(s, c, 'price-slice', (d) => s.play(show64.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'grow-history', (d) => s.play(depthFrac.to(1.0, { duration: d })), { dur: 0.85 });
  playCue(s, c, 'quarter-gib', (d) => s.play(showQuarter.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'other-state', (d) => s.play(showRecurrent.to(1, { duration: d })), { dur: 0.45 });
  playCue(
    s,
    c,
    'drop-history',
    (d) => {
      s.play(depthFrac.to(0.1, { duration: d }));
      s.play(dropped.to(1, { duration: d }));
    },
    { dur: 0.5 },
  );
  playCue(
    s,
    c,
    'reuse-history',
    (d) => {
      s.play(depthFrac.to(1.0, { duration: d }));
      s.play(dropped.to(0, { duration: d }));
    },
    { dur: 0.6 },
  );
  bindCueBeat(s, c, s.value(0), ['stored-pair', 'sharing', 'stack-layers', 'rebuild']);
}
