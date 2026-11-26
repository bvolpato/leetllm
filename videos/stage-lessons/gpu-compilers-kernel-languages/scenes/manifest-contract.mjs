// Scene 11: A reproducible recipe includes every code-generation dependency: 10 recipe mutations, stride-1 vs stride-2, nested includes.
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  recipeDigest,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function manifestContract(s, c) {
  const phase = s.value(0);
  const showFields = s.value(0);
  const showMeta = s.value(0);
  const showMut = s.value(0);
  const showStride = s.value(0);
  const showTree = s.value(0);

  const bgAura = aura(0, 20, 640, '#5ce1e61c', '#a78bfa18');
  const title = heroTitle(['Reproducible Recipe', '& Stride Identity'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.ir,
    eyebrow: '10-FIELD COMPILATION MANIFEST',
  });

  const digestS1 = recipeDigest({ stride: [1] }).slice(0, 10);
  const digestS2 = recipeDigest({ stride: [2] }).slice(0, 10);

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const sf = showFields.value;
    const sm = showMeta.value;
    const mu = showMut.value;
    const ss = showStride.value;
    const tr = showTree.value;

    const nodes = [];

    // Top row: 10 recipe key tokens laid out cleanly in 2 rows of 5
    const fields = [
      { k: 'source+hdr', col: ROLE.host, on: sf > 0.3 },
      { k: 'compiler', col: ROLE.host, on: sf > 0.3 },
      { k: 'flags[]', col: ROLE.ir, on: sf > 0.3 },
      { k: 'target', col: ROLE.ir, on: sf > 0.3 },
      { k: 'layout', col: COSMOS.gold, on: sf > 0.3 },
      { k: 'block', col: ROLE.triton, on: sm > 0.3 },
      { k: 'num_warps', col: ROLE.triton, on: sm > 0.3 },
      { k: 'num_stages', col: ROLE.triton, on: sm > 0.3 },
      { k: 'const_vals', col: ROLE.ptx, on: sm > 0.3 },
      { k: 'digest+gpu', col: ROLE.cubin, on: sm > 0.3 },
    ];
    fields.forEach((f, i) => {
      const colIdx = i % 5;
      const rowIdx = Math.floor(i / 5);
      const cx = -620 + colIdx * 310;
      const cy = -180 + rowIdx * 92;
      const stroke = mu > 0.5 ? COSMOS.gold : f.on ? f.col : COSMOS.dim;
      nodes.push(
        glassCell(cx, cy, 278, 70, stroke, {
          fill: f.on ? '#101d35' : '#0b101d',
          glow: f.on ? 6 : 0,
        }),
        txt(f.k, cx, cy, 26, f.on ? stroke : COSMOS.muted, 'mono'),
      );
    });

    // Bottom left: Stride 1 vs Stride 2 address proof (same length 1000!)
    nodes.push(
      glassCell(-405, 130, 810, 210, ss > 0.5 ? COSMOS.gold : ROLE.ir, {
        fill: '#0e192d',
        glow: ss > 0.5 ? 9 : 3,
      }),
      txt('SAME LENGTH (1000) · DIFFERENT STRIDES', -405, 62, 26, COSMOS.gold, 'mono'),
      txt(
        `stride 1 → idx 1 @ off 1 (sha ${digestS1.slice(0, 8)})`,
        -405,
        124,
        26,
        ROLE.cubin,
        'mono',
      ),
      txt(
        `stride 2 → idx 1 @ off 2 (sha ${digestS2.slice(0, 8)})`,
        -405,
        184,
        26,
        ROLE.fail,
        'mono',
      ),
    );

    // Bottom right: Nested include dependency discovery tree
    nodes.push(
      glassCell(460, 130, 740, 210, tr > 0.5 ? ROLE.cubin : COSMOS.dim, {
        fill: '#0d2028',
        glow: tr > 0.5 ? 9 : 2,
      }),
      txt(
        'TRANSITIVE INCLUDE DISCOVERY',
        460,
        62,
        26,
        tr > 0.5 ? ROLE.cubin : COSMOS.muted,
        'mono',
      ),
      txt('main.cu  →  a.cuh  →  b.cuh', 460, 124, 30, COSMOS.ink, 'mono'),
      txt('Record resolved paths + immutable copy + verify digest', 460, 184, 26, ROLE.ir, 'sans'),
    );

    const u = (p * 0.6) % 1;
    nodes.push(
      glowDot(-780 + u * 1560, 290, { radius: 6, color: tr > 0.5 ? ROLE.cubin : COSMOS.gold }),
      txt(
        mu > 0.5
          ? '10 single-field mutations: identical recipe hits, every mutation misses'
          : 'Reusing stride-1 kernel on stride-2 tensor silently reads wrong element',
        0,
        365,
        28,
        COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('recipe-fields', () =>
    s.play(showFields.to(1, { duration: remainDuration(c, 'recipe-fields', 0.45) })),
  );
  c.on('meta-parameters', () =>
    s.play(showMeta.to(1, { duration: remainDuration(c, 'meta-parameters', 0.45) })),
  );
  c.on('mutate-inputs', () =>
    s.play(showMut.to(1, { duration: remainDuration(c, 'mutate-inputs', 0.45) })),
  );
  c.on('stride-addresses', () =>
    s.play(showStride.to(1, { duration: remainDuration(c, 'stride-addresses', 0.45) })),
  );
  c.on('dependency-discovery', () =>
    s.play(showTree.to(1, { duration: remainDuration(c, 'dependency-discovery', 0.45) })),
  );
}
