// Scene 03: An index map and a data allocation have different owners (TensorImpl vs Storage, view/reshape/contiguous, CUDA/MPS/meta/sparse).
import { group } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  address,
  aura,
  glassCell,
  glowTex,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function tensorContract(s, c) {
  const stage = s.value(0); // 0=TensorImpl/Storage, 1=view/reshape/contiguous, 2=sparse/meta/MPS/CUDA

  const bgAura = aura(0, 20, 640, '#60a5fa1c', '#5ce1e618');
  const title = heroTitle(['Index Map vs', 'Data Allocation'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.orig,
    eyebrow: 'TENSORIMPL METADATA · STORAGE BYTES',
  });

  const formula = glowTex(
    '\\text{byte} = \\Big(\\text{offset} + \\sum_k i_k \\cdot \\text{stride}_k\\Big) \\times \\text{itemsize}',
    { x: 320, y: -380, size: 36, color: COSMOS.gold },
  );

  const live = guardedDynamic(1, () => {
    const st = stage.value;
    const idx3 = address([1, 0], [3, 1]);

    const nodes = [
      // Left: TensorImpl metadata owner
      glassCell(-530, -80, 620, 250, ROLE.orig, { fill: '#0f1b33', glow: st < 0.5 ? 10 : 4 }),
      txt('TensorImpl  (METADATA OWNER)', -530, -162, 28, ROLE.orig, 'mono'),
      txt('sizes: [2, 3]   strides: (3, 1)', -530, -106, 26, COSMOS.ink, 'mono'),
      txt('offset: 0   dtype: int64   device', -530, -56, 26, COSMOS.ink, 'mono'),
      txt(`(1, 0) -> elem ${idx3} -> byte ${idx3 * 8}`, -530, -4, 26, COSMOS.gold, 'mono'),

      // Right: Storage byte allocation owner
      glassCell(430, -80, 740, 250, ROLE.copy, { fill: '#0d202a', glow: st < 0.5 ? 10 : 4 }),
      txt('Storage  (RAW BYTE ALLOCATION)', 430, -162, 28, ROLE.copy, 'mono'),
      txt('[ 0 | 1 | 2 | 3 | 4 | 5 ]   48 B', 430, -96, 30, COSMOS.ink, 'mono'),
      txt('Multiple views point to same data_ptr()', 430, -28, 26, ROLE.copy, 'mono'),

      line([-210, -80], [50, -80], { stroke: COSMOS.gold, width: 3.4 }).glow(6, COSMOS.gold),
    ];

    // Bottom trio shifts between beat 1 (view/reshape/contiguous) and beat 2 (domain boundaries)
    if (st >= 1.5) {
      const domains = [
        { title: 'SPARSE / META', body: 'Other layouts or 0 bytes', col: ROLE.grad, x: -570 },
        { title: 'APPLE MPS', body: 'Unified CPU/GPU memory', col: ROLE.copy, x: 0 },
        { title: 'DISCRETE CUDA', body: 'Explicit H2D PCIe copy', col: ROLE.good, x: 570 },
      ];
      domains.forEach((d) => {
        nodes.push(
          glassCell(d.x, 195, 510, 168, d.col, { fill: '#11192e', glow: 8 }),
          txt(d.title, d.x, 152, 28, d.col, 'mono'),
          txt(d.body, d.x, 212, 26, COSMOS.ink, 'mono'),
        );
      });
    } else {
      const ops = [
        { title: 'view()', body: 'Zero-copy · strict strides', col: ROLE.orig, x: -570 },
        { title: 'reshape()', body: 'View OR new copy', col: ROLE.trans, x: 0 },
        { title: 'contiguous()', body: 'Copies only if non-contig', col: ROLE.good, x: 570 },
      ];
      ops.forEach((op) => {
        nodes.push(
          glassCell(op.x, 195, 510, 168, st >= 0.5 ? op.col : COSMOS.dim, {
            fill: st >= 0.5 ? '#111b30' : '#0a0f1c',
            glow: st >= 0.5 ? 9 : 2,
          }),
          txt(op.title, op.x, 152, 28, st >= 0.5 ? op.col : COSMOS.dim, 'mono'),
          txt(op.body, op.x, 212, 26, st >= 0.5 ? COSMOS.ink : COSMOS.dim, 'mono'),
        );
      });
    }

    nodes.push(
      txt(
        st >= 1.5
          ? 'Verify backend coverage, memory model, and numerics on the actual device'
          : 'Transpose leaves 6 cells put; time any hidden copy at the downstream kernel',
        0,
        390,
        28,
        COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, formula, live);

  c.on('pt-tensor-contract-0', () => s.play(stage.to(0, { duration: 0.25 })));
  c.on('pt-tensor-contract-1', () =>
    s.play(stage.to(1, { duration: remainDuration(c, 'pt-tensor-contract-1', 0.45) })),
  );
  c.on('pt-tensor-contract-2', () =>
    s.play(stage.to(2, { duration: remainDuration(c, 'pt-tensor-contract-2', 0.45) })),
  );
}
