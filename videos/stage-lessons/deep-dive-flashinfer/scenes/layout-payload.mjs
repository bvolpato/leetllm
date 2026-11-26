// Scene 12: Attach units to the stored axes: NHD vs HND transpose, 15x2x4x8x128 = 122,880 elems / 245,760 B, MLA & quant codecs.
import {
  ALLOC_BYTES,
  ALLOC_ELEMS,
  ALLOC_HEAD_DIM,
  ALLOC_KINDS,
  ALLOC_KV_HEADS,
  ALLOC_PAGES,
  ALLOC_SLOTS,
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

export default function layoutPayload(s, c) {
  const phase = s.value(0);
  const activeGroup = s.value(0);
  const showTranspose = s.value(1);
  const transposeReady = s.value(0);
  const showAlloc = s.value(0);
  const allocRevealed = s.value(0);
  const bytesRevealed = s.value(0);
  const showCodec = s.value(0);
  const codecWarn = s.value(0);

  const bgAura = aura(430, 20, 520, '#5ce1e622', '#a78bfa1c');
  const { view: gqa3d } = buildGqaTensorCube3d(activeGroup, phase, { x: 445, y: 20, unit: 100 });

  const title = heroTitle(['Attach Units to', 'the Stored Axes'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.r2,
    eyebrow: 'PAYLOAD LAYOUT · NHD VS HND VS MLA',
    subtitle: 'Page list says where to look; layout says how bytes are ordered',
  });

  // View 0: NHD vs HND transpose on Page 14 (4 slots x 8 heads x 128 dim)
  const transposeView = guardedDynamic(showTranspose, (a) => {
    const tr = transposeReady.value;
    const p = phase.value;
    const selSlot = Math.floor((p * 1.4) % 4);
    const selHead = Math.floor((p * 2.2) % 8);

    const nodes = [
      txt('3D KV HEAD & SLOT TENSOR SLAB', 445, -405, 26, COSMOS.cyan, 'mono')
        .glow(5, COSMOS.cyan)
        .opacity(a),
      txt('Same elements, transposed stride order', 445, 420, 26, COSMOS.muted, 'sans').opacity(a),

      // NHD layout block
      glassCell(-445, -66, 790, 166, ROLE.r0, { fill: '#10213d', glow: 8, opacity: a }),
      txt('NHD:  [slots=4,  heads=8,  dim=128]', -445, -110, 28, ROLE.r0, 'mono').opacity(a),
      txt(
        'Token slots outermost -> heads -> 128 coords',
        -445,
        -66,
        26,
        COSMOS.ink,
        'sans',
      ).opacity(a),
      txt(
        `Active slice: slot ${selSlot}, head ${selHead}`,
        -445,
        -22,
        26,
        COSMOS.gold,
        'mono',
      ).opacity(a),

      // HND layout block
      glassCell(-445, 134, 790, 166, ROLE.r2, { fill: '#0f283a', glow: 8, opacity: a }),
      txt('HND:  [heads=8,  slots=4,  dim=128]', -445, 90, 28, ROLE.r2, 'mono').opacity(a),
      txt(
        'KV heads outermost -> token slots -> 128 coords',
        -445,
        134,
        26,
        COSMOS.ink,
        'sans',
      ).opacity(a),
      txt(
        `Same tensor value at head ${selHead}, slot ${selSlot}`,
        -445,
        178,
        26,
        COSMOS.gold,
        'mono',
      ).opacity(a),
    ];

    if (tr > 0.05) {
      nodes.push(
        glassCell(-445, 315, 790, 108, ROLE.good, { fill: '#0e2824', glow: 9, opacity: tr * a }),
        txt(
          '4 × 8 × 128 = 4,096 elements per K or V page',
          -445,
          315,
          28,
          ROLE.good,
          'mono',
        ).opacity(tr * a),
      );
    }

    return group(...nodes);
  });

  // View 1: Combined 5-axis FP16 allocation (15 x 2 x 4 x 8 x 128)
  const allocView = guardedDynamic(showAlloc, (a) => {
    const ar = allocRevealed.value;
    const br = bytesRevealed.value;
    const axes = [
      { label: 'pages', val: String(ALLOC_PAGES), col: ROLE.r0 },
      { label: 'K / V', val: String(ALLOC_KINDS), col: ROLE.violet },
      { label: 'slots', val: String(ALLOC_SLOTS), col: ROLE.r2 },
      { label: 'KV heads', val: String(ALLOC_KV_HEADS), col: ROLE.good },
      { label: 'dim', val: String(ALLOC_HEAD_DIM), col: COSMOS.gold },
    ];

    const nodes = [
      txt('COMBINED NHD KV CACHE ALLOCATION TENSOR', 0, -155, 28, COSMOS.cyan, 'mono').opacity(a),
    ];

    axes.forEach((ax, i) => {
      const cx = -680 + i * 340;
      nodes.push(
        glassCell(cx, -10, 290, 152, ax.col, {
          fill: '#0e192e',
          glow: ar > 0.5 ? 9 : 4,
          opacity: a,
        }),
        txt(ax.label, cx, -44, 26, COSMOS.muted, 'mono').opacity(a),
        txt(ax.val, cx, 18, 46, ax.col, 'mono').glow(6, ax.col).opacity(a),
      );
      if (i < axes.length - 1) {
        nodes.push(txt('×', cx + 170, -10, 36, COSMOS.muted, 'mono').opacity(a));
      }
    });

    if (br > 0.05) {
      nodes.push(
        glassCell(0, 240, 1520, 168, ROLE.good, { fill: '#0e2824', glow: 10, opacity: br * a }),
        txt(
          `15 × 2 × 4 × 8 × 128 = ${ALLOC_ELEMS.toLocaleString()} elements`,
          0,
          208,
          36,
          COSMOS.gold,
          'mono',
        )
          .glow(6, COSMOS.gold)
          .opacity(br * a),
        txt(
          `FP16 (2 bytes/elem) -> ${ALLOC_BYTES.toLocaleString()} bytes`,
          0,
          274,
          36,
          ROLE.good,
          'mono',
        )
          .glow(6, ROLE.good)
          .opacity(br * a),
      );
    }

    return group(...nodes);
  });

  // View 2: Block-sparse BSR, MLA latents, FP8/FP4 packing codecs
  const codecView = guardedDynamic(showCodec, (a) => {
    const cw = codecWarn.value;
    const formats = [
      {
        cx: -555,
        head: 'BSR / PAGED FP16',
        sub: 'Indexed physical blocks',
        note: 'Dense scores on referenced pages',
        col: ROLE.r2,
      },
      {
        cx: 0,
        head: 'MLA LATENT CACHE',
        sub: 'Compressed latent + RoPE',
        note: 'Different payload structure',
        col: ROLE.violet,
      },
      {
        cx: 555,
        head: 'FP8 / 4-BIT CACHE',
        sub: 'Packed payload + scales',
        note: 'Requires matching dequant kernel',
        col: ROLE.warn,
      },
    ];

    const nodes = [
      txt(
        'REPRESENTATION CHANGES REQUIRE MATCHING KERNELS & CODECS',
        0,
        -155,
        28,
        COSMOS.gold,
        'mono',
      ).opacity(a),
    ];

    formats.forEach((fm) => {
      nodes.push(
        glassCell(fm.cx, 35, 490, 240, fm.col, { fill: '#0e172a', glow: 8, opacity: a }),
        txt(fm.head, fm.cx, -30, 28, fm.col, 'mono').opacity(a),
        txt(fm.sub, fm.cx, 30, 28, COSMOS.ink, 'sans').opacity(a),
        txt(fm.note, fm.cx, 92, 26, COSMOS.muted, 'sans').opacity(a),
      );
    });

    if (cw > 0.05) {
      nodes.push(
        glassCell(0, 295, 1600, 118, ROLE.bad, { fill: '#2c101b', glow: 9, opacity: cw * a }),
        txt(
          'Relabeling a dtype tag alone never converts payload bytes into a compressed format',
          0,
          295,
          28,
          ROLE.bad,
          'mono',
        ).opacity(cw * a),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, gqa3d, title, transposeView, allocView, codecView);
  runPhase(s, c, phase, 14);
  const allocStart = c.cue('fi-layout-payload-1').start;
  orbitScene(
    s,
    c,
    gqa3d,
    { theta: -0.2, phi: 0.92 },
    { startOffset: 0.1, endMargin: Math.max(0.55, c.end - allocStart + 0.35) },
  );

  c.on('fi-layout-payload-0', () =>
    s.play(activeGroup.to(7, { duration: remainDuration(c, 'fi-layout-payload-0', 2.4) })),
  );
  c.on('fi-layout-payload-0-result', () =>
    s.play(
      transposeReady.to(1, { duration: remainDuration(c, 'fi-layout-payload-0-result', 0.4) }),
    ),
  );
  c.on('fi-layout-payload-1', () => {
    s.play(
      par(showTranspose.to(0, { duration: 0.18 }), delay(showAlloc.to(1, { duration: 0.22 }), 0.2)),
    );
  });
  c.hide('fi-layout-payload-1', [gqa3d], { fade: 0.18 });
  c.on('fi-layout-payload-allocation', () =>
    s.play(
      allocRevealed.to(1, { duration: remainDuration(c, 'fi-layout-payload-allocation', 0.4) }),
    ),
  );
  c.on('fi-layout-payload-bytes', () =>
    s.play(bytesRevealed.to(1, { duration: remainDuration(c, 'fi-layout-payload-bytes', 0.4) })),
  );
  c.after('fi-layout-payload-1-result', () =>
    s.play(bytesRevealed.to(1, { duration: remainAfter(c, 'fi-layout-payload-1-result', 0.25) })),
  );
  c.on('fi-layout-payload-2', () => {
    s.play(
      par(showAlloc.to(0, { duration: 0.18 }), delay(showCodec.to(1, { duration: 0.22 }), 0.2)),
    );
  });
  c.on('fi-layout-payload-2-result', () =>
    s.play(codecWarn.to(1, { duration: remainDuration(c, 'fi-layout-payload-2-result', 0.4) })),
  );
}
