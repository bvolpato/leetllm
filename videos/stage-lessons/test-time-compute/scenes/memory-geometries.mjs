// Scene 24: memory-geometries: Raw KV formula 2 * L * H_kv * d * b = 2 * 32 * 8 * 128 * 2 = 131,072 B (128 KiB/pos) + paged copy-on-write prefix sharing.
import {
  COSMOS,
  ROLE,
  aura,
  chipPill,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  kvPerToken,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function memoryGeometries(s, c) {
  const showProduct = s.value(0);
  const showCow = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#20184422');
  const title = heroTitle(
    ['KV Cache Geometry & Copy-on-Write:', 'Turning Positions Into Raw Bytes'],
    {
      x: -855,
      y: -430,
      size: 46,
      lineHeight: 54,
      accent: ROLE.search,
    },
  );

  const eq = glowTex(
    String.raw`\text{Bytes/pos} = 2 L H_{\text{kv}} d_{\text{head}} b = 2 \times 32 \times 8 \times 128 \times 2 = 131{,}072\text{ B}`,
    { scale: 1.22, color: COSMOS.ink, glow: 8, glowColor: ROLE.search },
  ).at(0, -170);

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const pr = showProduct.value;
    const cw = showCow.value;

    const nodes = [
      rect(500, 175, { fill: '#10203a', stroke: ROLE.draft, width: 2.8, radius: 12 })
        .at(-580, 15)
        .opacity(alpha),
      txt('USE KV HEADS (NOT Q!)', -580, -32, 26, ROLE.draft, 'mono', 'center').opacity(alpha),
      txt('Factor 2 = K + V', -580, 20, 28, COSMOS.ink, 'mono', 'center').opacity(alpha),
      txt('1 KiB=1024 B | 1 GiB=2^30', -580, 68, 26, ROLE.gold, 'mono', 'center').opacity(alpha),

      rect(520, 175, {
        fill: pr > 0.35 ? '#0f2d24' : '#10182d',
        stroke: ROLE.ok,
        width: 2.8,
        radius: 12,
      })
        .at(-15, 15)
        .opacity(alpha * (0.5 + 0.5 * pr)),
      txt('RAW PER POSITION', -15, -32, 26, ROLE.ok, 'mono', 'center').opacity(alpha),
      txt(`${kvPerToken.toLocaleString()} bytes`, -15, 20, 30, ROLE.ok, 'mono', 'center').opacity(
        alpha,
      ),
      txt('= 128 KiB / position', -15, 68, 26, COSMOS.ink, 'mono', 'center').opacity(alpha),

      rect(520, 175, {
        fill: cw > 0.35 ? '#181434' : '#10182d',
        stroke: ROLE.score,
        width: 2.8,
        radius: 12,
      })
        .at(555, 15)
        .opacity(alpha * (0.5 + 0.5 * cw)),
      txt('PAGED COPY-ON-WRITE', 555, -32, 26, ROLE.score, 'mono', 'center').opacity(alpha),
      txt('Share identical prefix blocks', 555, 20, 26, COSMOS.ink, 'sans', 'center').opacity(
        alpha,
      ),
      txt('Fork private blocks on diverge', 555, 68, 26, ROLE.gold, 'sans', 'center').opacity(
        alpha,
      ),

      chipPill(
        cw > 0.35
          ? 'Sliding windows, hybrid SSM layers & block rounding each need their own real allocator formula!'
          : 'Multiply bytes per position by retained positions to compute raw KV bytes before runtime overhead',
        0,
        240,
        {
          w: 1620,
          h: 76,
          color: cw > 0.35 ? ROLE.score : ROLE.ok,
          size: 26,
          opacity: alpha,
        },
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, eq, layer);
  playCue(s, c, 'tt-memory-geometries-0', (d) => s.play(showProduct.to(0, { duration: d })));
  playCue(s, c, 'tt-memory-geometries-1', (d) => s.play(showProduct.to(0.6, { duration: d })));
  playCue(s, c, 'tt-kv-product', (d) => s.play(showProduct.to(1, { duration: d })));
  playCue(s, c, 'tt-memory-geometries-2', (d) => s.play(showCow.to(0.6, { duration: d })));
  playCue(s, c, 'tt-cow-diverge', (d) => s.play(showCow.to(1, { duration: d })));
}
