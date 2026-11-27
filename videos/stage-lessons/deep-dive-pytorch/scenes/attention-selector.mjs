// Scene 08: How much space do the scores take? 1x2x8192x8192 = 134,217,728 cells = 256 MiB -> tiled FlashAttention -> GQA 4Q:2KV.
import { group } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  SCORE_CELLS_8192,
  SCORE_MIB_8192,
  aura,
  buildScorePlane3d,
  glassCell,
  guardedDynamic,
  heroTitle,
  line,
  orbitScene,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function attentionSelector(s, c) {
  const phase = s.value(0);
  const tileMode = s.value(0);
  const stage = s.value(0); // 1=count, 2=256 MiB, 3=head width, 4=fused tile, 5=backends, 6=GQA 4Q:2KV

  const bgAura = aura(440, 20, 540, '#60a5fa20', '#6ee7b718');
  const { view: plane3d } = buildScorePlane3d(tileMode, phase, { x: 475, y: 25, unit: 92 });

  const title = heroTitle(['How Much Space', 'Do Scores Take?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.orig,
    eyebrow: 'O(S²) SCORE PLANES · SRAM TILING · GQA',
  });

  const live = guardedDynamic(1, () => {
    const st = stage.value;

    const nodes = [
      txt('3D SCORE PLANES (2 HEADS)', 475, -390, 26, ROLE.orig, 'mono').glow(5, ROLE.orig),
      txt(
        st >= 3.5 ? 'Fused SRAM tile skips HBM S×S write' : 'Each head builds an 8192 × 8192 grid',
        475,
        405,
        26,
        st >= 3.5 ? ROLE.good : ROLE.trans,
        'mono',
      ),

      // Top readout: SxS cell count & 256 MiB
      glassCell(-420, -145, 860, 186, st >= 1.5 ? ROLE.bad : ROLE.orig, {
        fill: st >= 1.5 ? '#2a1322' : '#0f1b33',
        glow: 9,
      }),
      txt('B=1 · H=2 · S=8,192 · 2 B/score', -420, -194, 26, COSMOS.muted, 'mono'),
      txt(
        st >= 1.5
          ? `${SCORE_CELLS_8192.toLocaleString()} cells  =  ${SCORE_MIB_8192} MiB`
          : st >= 0.5
            ? `${SCORE_CELLS_8192.toLocaleString()} score cells`
            : '1 × 2 × 8,192 × 8,192',
        -420,
        -136,
        32,
        st >= 1.5 ? ROLE.bad : COSMOS.gold,
        'mono',
      ),
      txt(
        st >= 2.5
          ? 'Double head dim D: 2× dot work, SAME cell count!'
          : 'Scales quadratically with sequence length S',
        -420,
        -82,
        26,
        st >= 2.5 ? ROLE.trans : COSMOS.muted,
        'mono',
      ),
    ];

    // Bottom: either Fused backends or GQA 4Q -> 2KV
    if (st >= 5.5) {
      nodes.push(
        glassCell(-420, 128, 860, 250, ROLE.good, { fill: '#0d2624', glow: 9 }),
        txt('GROUPED-QUERY ATTENTION (4 Q -> 2 KV)', -420, 44, 28, ROLE.good, 'mono'),
      );
      const qXs = [-710, -520, -320, -130];
      const kvXs = [-615, -225];
      qXs.forEach((qx, i) => {
        const kvx = kvXs[Math.floor(i / 2)];
        nodes.push(
          line([qx, 118], [kvx, 174], { stroke: ROLE.copy, width: 3.0 }),
          glassCell(qx, 102, 130, 52, ROLE.orig, { fill: '#11223e', glow: 4 }),
          txt(`Q${i}`, qx, 102, 26, ROLE.orig, 'mono'),
        );
      });
      kvXs.forEach((kvx, j) => {
        nodes.push(
          glassCell(kvx, 202, 210, 56, ROLE.good, { fill: '#10312b', glow: 6 }),
          txt(`KV Head ${j}`, kvx, 202, 26, ROLE.good, 'mono'),
        );
      });
    } else {
      nodes.push(
        glassCell(-420, 128, 860, 232, st >= 3.5 ? ROLE.good : COSMOS.dim, {
          fill: st >= 3.5 ? '#0e2422' : '#0b101d',
          glow: st >= 3.5 ? 9 : 2,
        }),
        txt('SDPA BACKEND DISPATCH', -420, 54, 28, st >= 3.5 ? ROLE.good : COSMOS.dim, 'mono'),
        txt(
          st >= 4.5
            ? 'FlashAttention-2 · Mem-Efficient · cuDNN · Math'
            : 'Tile Q, K, V in SRAM with online softmax',
          -420,
          118,
          26,
          st >= 3.5 ? COSMOS.ink : COSMOS.dim,
          'mono',
        ),
        txt(
          st >= 4.5
            ? 'Record which backend ran in your profiler trace'
            : 'Avoids writing S×S scores to device HBM',
          -420,
          180,
          26,
          st >= 4.5 ? COSMOS.gold : COSMOS.muted,
          'mono',
        ),
      );
    }

    nodes.push(
      txt(
        st >= 5.5
          ? 'Math backend accepts FP64 and FP32 intermediates for numerical reference checks'
          : 'Device, dtype, shape, strides, and mask gate fused kernel eligibility',
        -855,
        345,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, plane3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, plane3d, { theta: -0.22, phi: 0.85 });

  c.on('score-count', () =>
    s.play(stage.to(1, { duration: remainDuration(c, 'score-count', 0.35) })),
  );
  c.on('score-bytes', () =>
    s.play(stage.to(2, { duration: remainDuration(c, 'score-bytes', 0.35) })),
  );
  c.on('head-width', () =>
    s.play(stage.to(3, { duration: remainDuration(c, 'head-width', 0.35) })),
  );
  c.on('score-tile', () => {
    const dur = remainDuration(c, 'score-tile', 0.45);
    s.play(stage.to(4, { duration: dur }));
    s.play(tileMode.to(1, { duration: dur }));
  });
  c.on('score-path', () =>
    s.play(stage.to(5, { duration: remainDuration(c, 'score-path', 0.35) })),
  );
  c.on('group-heads', () =>
    s.play(stage.to(6, { duration: remainDuration(c, 'group-heads', 0.45) })),
  );
}
