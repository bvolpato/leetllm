// Scene 20: cache-bytes: 128 KiB/token KV bill (360 MiB direct -> 20 MiB reduced, 332.5 MiB full) + orbiting 3D KV slab.
import {
  BYTES_PER_TOKEN,
  COSMOS,
  FULL_PREFIX,
  FULL_REDUCED_MIB,
  REDUCED_PREFIX,
  ROLE,
  VISUAL_DIRECT_MIB,
  VISUAL_REDUCED_MIB,
  aura,
  buildKvSlab3d,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  orbitScene,
  playCue,
  txt,
} from '../parts.mjs';

export default function cacheBytes(s, c) {
  const showFactors = s.value(0);
  const showPerTok = s.value(0);
  const showBills = s.value(0);
  const showDirect = s.value(0);
  const shrink3d = s.value(0);
  const showFull = s.value(0);
  const showMoe = s.value(0);

  const bgAura = aura(360, 20, 760, '#14335c2c', '#26184a28');
  const title = heroTitle(['Compute the Logical KV Bill', 'for the Admitted Sequence'], {
    x: -855,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.ok,
  });

  const eq = glowTex(String.raw`2 \times 32 \times 8 \times 128 \times 2 = 128\text{ KiB / tok}`, {
    x: 430,
    y: -395,
    size: 32,
    color: ROLE.gold,
    glow: 7,
  });

  // Signature orbiting 3D KV-cache slab on the right (shrinks 360 MiB -> 20 MiB)
  const slab3d = buildKvSlab3d(shrink3d, { x: 470, y: 20 });
  orbitScene(s, c, slab3d, { theta: -0.3, phi: 0.94 });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const fc = showFactors.value;
    const pt = showPerTok.value;
    const bl = showBills.value;
    const dr = showDirect.value;
    const sh = shrink3d.value;
    const fl = showFull.value;
    const mo = showMoe.value;

    const barX = -855;
    const maxW = 760;
    const scaleMib = maxW / 380;

    const nodes = [
      txt(
        pt > 0.3
          ? `32L x 8 KVH x 128D x 2B x K&V = ${BYTES_PER_TOKEN.toLocaleString()} B (128 KiB/tok)`
          : '32 layers x 8 KV heads x 128 dim x 2 bytes x (K + V)',
        barX,
        -235,
        26,
        pt > 0.3 ? ROLE.gold : fc > 0.3 ? ROLE.vision : COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),

      // Bar 1: Direct visual (2,880 tokens -> 360 MiB)
      txt(
        `Direct Visual (${FULL_PREFIX.visualTokens.toLocaleString()} tok): ${VISUAL_DIRECT_MIB} MiB`,
        barX,
        -145,
        28,
        dr > 0.3 ? ROLE.warn : ROLE.vision,
        'mono',
        'left',
      ).opacity(alpha),
      lumBar(barX, -92, VISUAL_DIRECT_MIB * scaleMib, 34, ROLE.warn, {
        opacity: alpha * (0.58 + 0.42 * Math.max(bl, dr)),
        maxTrackW: maxW,
      }),

      // Bar 2: Reduced visual (160 tokens -> 20 MiB, saves 340 MiB!)
      txt(
        sh > 0.3
          ? `Reduced Visual (${REDUCED_PREFIX.visualTokens} tok): ${VISUAL_REDUCED_MIB} MiB  (SAVES 340 MiB!)`
          : `Reduced Visual (${REDUCED_PREFIX.visualTokens} tok): ${VISUAL_REDUCED_MIB} MiB`,
        barX,
        -8,
        28,
        ROLE.ok,
        'mono',
        'left',
      )
        .glow(sh > 0.3 ? 8 : 0, ROLE.ok)
        .opacity(alpha * (0.55 + 0.45 * sh)),
      lumBar(barX, 45, Math.max(24, VISUAL_REDUCED_MIB * scaleMib), 34, ROLE.ok, {
        opacity: alpha * (0.55 + 0.45 * sh),
        maxTrackW: maxW,
      }),

      // Bar 3: Full reduced reservation (2,660 tokens -> 332.5 MiB)
      txt(
        `Full Reduced (${REDUCED_PREFIX.total.toLocaleString()} tok = text+vis+out): ${FULL_REDUCED_MIB} MiB`,
        barX,
        130,
        28,
        fl > 0.3 ? ROLE.text : COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha * (0.55 + 0.45 * fl)),
      lumBar(barX, 183, FULL_REDUCED_MIB * scaleMib, 34, ROLE.text, {
        opacity: alpha * (0.55 + 0.45 * fl),
        maxTrackW: maxW,
      }),

      // Bottom MoE & allocator caveat
      txt(
        mo > 0.3
          ? 'MoE cuts active FFN FLOPs/token; visual encoding, prefix attention & KV remain!'
          : 'Excludes weights, encoder activations, allocator overhead & cross-attn caches',
        barX,
        305,
        26,
        mo > 0.3 ? ROLE.gold : COSMOS.muted,
        'sans',
        'left',
      ).opacity(alpha),

      // 3D slab caption on right
      txt(
        sh > 0.4 ? 'Visual KV Tensor: 360 -> 20 MiB' : 'Visual KV Cache Slab (360 MiB)',
        470,
        340,
        26,
        sh > 0.4 ? ROLE.ok : ROLE.warn,
        'mono',
        'center',
      ).opacity(alpha),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, eq, slab3d, layer);
  playCue(s, c, 'mm-cache-bytes-0', (d) => s.play(showFactors.to(1, { duration: d })));
  playCue(s, c, 'mm-per-token-bytes', (d) => s.play(showPerTok.to(1, { duration: d })));
  playCue(s, c, 'mm-cache-bytes-1', (d) => s.play(showBills.to(1, { duration: d })));
  playCue(s, c, 'mm-visual-direct', (d) => s.play(showDirect.to(1, { duration: d })));
  playCue(s, c, 'mm-visual-reduced', (d) => s.play(shrink3d.to(1, { duration: d })), { dur: 0.9 });
  playCue(s, c, 'mm-full-reservation', (d) => s.play(showFull.to(1, { duration: d })));
  playCue(s, c, 'mm-cache-bytes-2', (d) => s.play(showMoe.to(1, { duration: d })));
}
