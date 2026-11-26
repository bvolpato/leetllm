// Scene 24: container-layout: GGUF binary sections (Header, KV Metadata, Tensor Descriptors, 32-byte aligned Payload) + mmap residency.
import {
  COSMOS,
  ROLE,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function containerLayout(s, c) {
  const showAlign = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#20184422');
  const title = heroTitle(['Inside a GGUF File:', 'Header, Descriptors & 32-Byte Alignment'], {
    x: -855,
    y: -430,
    size: 46,
    lineHeight: 54,
    accent: ROLE.weight,
  });

  const blocks = [
    { x: -690, w: 300, col: ROLE.weight, t: 'HEADER', b: 'magic + version' },
    { x: -335, w: 380, col: ROLE.gold, t: 'KV METADATA', b: 'arch + norms + tokenizer' },
    { x: 95, w: 450, col: ROLE.code, t: 'TENSOR DESCRIPTORS', b: 'name, dims, type, offset' },
    { x: 590, w: 500, col: ROLE.ok, t: 'ALIGNED PAYLOAD', b: '32-byte default alignment' },
  ];

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const al = showAlign.value;

    const nodes = [
      txt(
        'SELF-DESCRIBING SINGLE-FILE LAYOUT (NO EXTERNAL CONFIG REQUIRED FOR TENSOR OFFSETS)',
        -855,
        -220,
        26,
        ROLE.grid,
        'mono',
        'left',
      ).opacity(alpha),
    ];

    blocks.forEach((b) => {
      nodes.push(
        rect(b.w, 160, { fill: '#10182d', stroke: b.col, width: 2.8, radius: 12 })
          .at(b.x, -45)
          .opacity(alpha),
        txt(b.t, b.x, -76, 26, b.col, 'mono', 'center').opacity(alpha),
        txt(b.b, b.x, -16, 26, COSMOS.ink, 'sans', 'center').opacity(alpha),
      );
    });

    nodes.push(
      chipPill(
        '32-byte alignment (overridable via general.alignment) keeps SIMD & DMA loads cleanly aligned',
        0,
        125,
        {
          w: 1620,
          h: 74,
          color: al > 0.35 ? ROLE.ok : ROLE.grid,
          fill: al > 0.35 ? '#0f2d24' : '#10182d',
          size: 26,
          glow: al > 0.35 ? 10 : 4,
          opacity: alpha * (0.5 + 0.5 * al),
        },
      ),
      chipPill(
        'mmap skips an extra host copy on CPU, but pages STILL fault from disk into RAM (or copy to GPU VRAM)!',
        0,
        235,
        {
          w: 1620,
          h: 74,
          color: ROLE.gold,
          size: 26,
          opacity: alpha * (0.5 + 0.5 * al),
        },
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'container-layout-build-0', (d) => s.play(showAlign.to(0, { duration: d })));
  playCue(s, c, 'container-layout-build-1', (d) => s.play(showAlign.to(1, { duration: d })));
}
