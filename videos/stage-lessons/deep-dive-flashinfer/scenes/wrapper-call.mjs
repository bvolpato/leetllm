// Scene 15: Read the actual paged-prefill call: v0.6.18 FA2 signature, 32 Q / 8 KV GQA 3D packing, 128 MiB workspace & int32.
import {
  ALLOC_HEAD_DIM,
  ALLOC_KV_HEADS,
  ALLOC_Q_HEADS,
  COSMOS,
  ROLE,
  aura,
  buildGqaTensorCube3d,
  delay,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  par,
  remainAfter,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function wrapperCall(s, c) {
  const phase = s.value(0);
  const activeGroup = s.value(0);
  const showSig = s.value(1);
  const sigWarn = s.value(0);
  const showGqa = s.value(0);
  const gqaRef = s.value(0);
  const showShapes = s.value(0);
  const finiteCheck = s.value(0);

  const bgAura = aura(430, 20, 540, '#5ce1e622', '#a78bfa1e');
  const { view: gqa3d } = buildGqaTensorCube3d(activeGroup, phase, { x: 455, y: 20, unit: 100 });

  const title = heroTitle(['Read the Actual', 'Paged-Prefill Call'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.r2,
    eyebrow: 'v0.6.18 FA2 WRAPPER · GQA 32Q / 8KV',
  });

  // View 0: Exact keyword arguments of wrapper.plan(...)
  const sigView = guardedDynamic(showSig, (a) => {
    const sw = sigWarn.value;
    const args = [
      { k: 'qo_indptr', v: '[0, 3, 4, 8]  (token rows)', col: COSMOS.gold },
      { k: 'paged_kv_indptr', v: '[0, 2, 3, 6]  (page IDs)', col: ROLE.r2 },
      { k: 'paged_kv_indices', v: '[7, 2, 11, 3, 14, 6]', col: ROLE.r2 },
      { k: 'paged_kv_last_page_len', v: '[2, 2, 1]  ·  head_dim_qk=128', col: ROLE.r0 },
    ];
    const nodes = [
      txt(
        'BatchPrefillWithPagedKVCacheWrapper.plan(...)  [backend="fa2"]',
        0,
        -162,
        28,
        COSMOS.cyan,
        'mono',
      ).opacity(a),
    ];

    args.forEach((arg, idx) => {
      const cy = -80 + idx * 102;
      nodes.push(
        glassCell(-420, cy, 500, 78, arg.col, { fill: '#101d35', glow: 6, opacity: a }),
        txt(arg.k, -420, cy, 28, arg.col, 'mono').opacity(a),
        glassCell(325, cy, 880, 78, COSMOS.cyan, { fill: '#0e172a', glow: 5, opacity: a }),
        txt(arg.v, 325, cy, 28, COSMOS.ink, 'mono').opacity(a),
      );
    });

    if (sw > 0.05) {
      nodes.push(
        glassCell(0, 355, 1620, 102, ROLE.warn, { fill: '#261a10', glow: 8, opacity: sw * a }),
        txt(
          'Exact keyword names are an executable API: shorthand names fail before attention runs',
          0,
          355,
          28,
          ROLE.warn,
          'sans',
        ).opacity(sw * a),
      );
    }

    return group(...nodes);
  });

  // View 1: 32 Q heads sharing 8 KV heads (4:1 GQA) paired with 3D GQA Tensor Core cube
  const gqaView = guardedDynamic(showGqa, (a) => {
    const gr = gqaRef.value;
    const nodes = [
      txt('3D GQA HEAD-GROUP PACKING (4:1)', 455, -405, 26, COSMOS.cyan, 'mono')
        .glow(5, COSMOS.cyan)
        .opacity(a),
      txt('8 stored KV heads broadcast to 32 Q heads', 455, 420, 26, COSMOS.muted, 'sans').opacity(
        a,
      ),

      glassCell(-445, -75, 790, 150, ROLE.r0, { fill: '#10213d', glow: 8, opacity: a }),
      txt(
        `Q SHAPE:  8 rows × ${ALLOC_Q_HEADS} Q heads × ${ALLOC_HEAD_DIM}`,
        -445,
        -108,
        28,
        ROLE.r0,
        'mono',
      ).opacity(a),
      txt(
        `KV HEADS: ${ALLOC_KV_HEADS} stored heads -> groups of 4`,
        -445,
        -52,
        28,
        COSMOS.gold,
        'mono',
      ).opacity(a),

      glassCell(-445, 118, 790, 150, ROLE.good, { fill: '#0e2824', glow: 8, opacity: a }),
      txt('ZERO-COPY PHYSICAL REUSE', -445, 86, 28, ROLE.good, 'mono').opacity(a),
      txt(
        'Kernel reads each KV head once for all 4 Q heads',
        -445,
        142,
        26,
        COSMOS.ink,
        'sans',
      ).opacity(a),
    ];

    if (gr > 0.05) {
      nodes.push(
        glassCell(-445, 310, 790, 120, ROLE.violet, { fill: '#1c1336', glow: 8, opacity: gr * a }),
        txt(
          'Dense reference uses repeat_interleave(4)',
          -445,
          286,
          28,
          ROLE.violet,
          'mono',
        ).opacity(gr * a),
        txt(
          'Only to verify math transparently; GPU never copies 4×',
          -445,
          336,
          26,
          COSMOS.muted,
          'sans',
        ).opacity(gr * a),
      );
    }

    return group(...nodes);
  });

  // View 2: 128 MiB workspace, int32 indices, matching O shape, finite check
  const shapeView = guardedDynamic(showShapes, (a) => {
    const fc = finiteCheck.value;
    const boxes = [
      { x: -435, y: -45, h: 'WORKSPACE SCRATCH', v: '128 MiB uint8 buffer', col: COSMOS.gold },
      {
        x: 435,
        y: -45,
        h: 'INDEX METADATA DTYPE',
        v: 'int32 pointers, indices, tails',
        col: ROLE.r0,
      },
      { x: -435, y: 155, h: 'QUERY TENSOR Q', v: 'shape (8, 32, 128) · FP16', col: ROLE.r2 },
      { x: 435, y: 155, h: 'OUTPUT TENSOR O', v: 'shape (8, 32, 128) · FP16', col: ROLE.good },
    ];
    const nodes = [
      txt(
        'RUNTIME BUFFERS, INDEX DTYPES & OUTPUT VERIFICATION',
        0,
        -165,
        28,
        COSMOS.cyan,
        'mono',
      ).opacity(a),
    ];

    boxes.forEach((b) => {
      nodes.push(
        glassCell(b.x, b.y, 760, 148, b.col, { fill: '#0e172a', glow: 8, opacity: a }),
        txt(b.h, b.x, b.y - 30, 26, b.col, 'mono').opacity(a),
        txt(b.v, b.x, b.y + 26, 32, COSMOS.ink, 'mono').opacity(a),
      );
    });

    if (fc > 0.05) {
      nodes.push(
        glassCell(0, 345, 1630, 114, ROLE.good, { fill: '#0e2824', glow: 10, opacity: fc * a }),
        txt(
          'CUDA example verifies O against dense attention and asserts torch.isfinite(O).all()',
          0,
          345,
          28,
          ROLE.good,
          'mono',
        ).opacity(fc * a),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, sigView, gqaView, shapeView);
  runPhase(s, c, phase, 14);

  c.on('fi-wrapper-call-0', () =>
    s.play(sigWarn.to(0.01, { duration: remainDuration(c, 'fi-wrapper-call-0', 0.2) })),
  );
  c.on('fi-wrapper-call-0-result', () =>
    s.play(sigWarn.to(1, { duration: remainDuration(c, 'fi-wrapper-call-0-result', 0.4) })),
  );
  c.show('fi-wrapper-call-1', [gqa3d], { fade: 0.22, lead: -0.22 });
  c.on('fi-wrapper-call-1', () => {
    s.play(par(showSig.to(0, { duration: 0.18 }), delay(showGqa.to(1, { duration: 0.22 }), 0.22)));
    s.play(activeGroup.to(7, { duration: remainDuration(c, 'fi-wrapper-call-1', 4.0) }));
    s.play(
      gqa3d.orbit(
        { theta: -0.24, phi: 0.94 },
        { duration: remainDuration(c, 'fi-wrapper-call-1', 4.5) },
      ),
    );
  });
  c.on('fi-wrapper-call-1-result', () =>
    s.play(gqaRef.to(1, { duration: remainDuration(c, 'fi-wrapper-call-1-result', 0.4) })),
  );
  c.hide('fi-wrapper-call-2', [gqa3d], { fade: 0.18 });
  c.on('fi-wrapper-call-2', () => {
    s.play(
      par(showGqa.to(0, { duration: 0.18 }), delay(showShapes.to(1, { duration: 0.22 }), 0.2)),
    );
  });
  c.on('fi-wrapper-call-2-result', () =>
    s.play(finiteCheck.to(1, { duration: remainDuration(c, 'fi-wrapper-call-2-result', 0.4) })),
  );
}
