// Scene 13: quantize-capacity: 80 GB card (54 weights + 8 runtime = 18 GB KV -> 53 FP16 vs 107 FP8 users) + hybrid 53 -> 55 chats.
import {
  CAP,
  COSMOS,
  ROLE,
  aura,
  bindCueBeat,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  swapVis,
  txt,
} from '../parts.mjs';

export default function quantizeCapacity(s, c) {
  const view1Vis = s.value(1);
  const view2Vis = s.value(0);
  const show53 = s.value(0);
  const show107 = s.value(0);
  const halveStrip = s.value(0);

  const bgAura = aura(0, 0, 740, '#103c3628', '#16355e18');
  const title = heroTitle(['KV Quantization:', 'bytes that limit admission'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: ROLE.decode,
  });

  // View 1: 80 GB GPU memory budget (54 weights + 8 runtime + 18 KV -> 53 vs 107 users)
  const view1 = guardedDynamic(view1Vis, (alpha) => {
    const s53 = show53.value;
    const s107 = show107.value;
    const maxW = 1120;
    const barX = -855;
    const w54 = (54 / 80) * maxW;
    const w8 = (8 / 80) * maxW;
    const w18 = (18 / 80) * maxW;
    const nodes = [
      txt(
        '80 GB GPU BUDGET: 54 GB WEIGHTS + 8 GB RUNTIME = 18 GB KV POOL',
        -855,
        -225,
        28,
        ROLE.clockA,
        'mono',
        'left',
      ).opacity(alpha),
      lumBar(barX, -145, w54, 46, ROLE.prefill, { opacity: alpha }),
      lumBar(barX + w54, -145, w8, 46, ROLE.wait, { opacity: alpha }),
      lumBar(barX + w54 + w8, -145, w18, 46, ROLE.decode, { opacity: alpha }),
      txt('Weights 54 GB', barX + w54 * 0.5, -88, 26, ROLE.prefill, 'mono', 'center').opacity(
        alpha,
      ),
      txt('Run 8', barX + w54 + w8 * 0.5, -88, 26, ROLE.wait, 'mono', 'center').opacity(alpha),
      txt('KV 18 GB', barX + w54 + w8 + w18 * 0.5, -88, 26, ROLE.decode, 'mono', 'center').opacity(
        alpha,
      ),

      // 5,120-position users fitting in 18 GB pool: 53 (2B) vs 107 (1B)
      txt(
        '2 bytes/value (FP16)',
        -855,
        45,
        30,
        s53 > 0.2 ? ROLE.clockA : COSMOS.dim,
        'mono',
        'left',
      ).opacity(alpha),
      lumBar(-380, 45, (CAP.kvOnly.counts[0] / 110) * 860 * Math.max(0.08, s53), 40, ROLE.clockA, {
        opacity: (0.28 + 0.72 * s53) * alpha,
        maxTrackW: 860,
      }),
      txt(
        s53 > 0.2 ? `${CAP.kvOnly.counts[0]} users` : 'baseline',
        510,
        45,
        34,
        s53 > 0.2 ? ROLE.clockA : COSMOS.dim,
        'mono',
        'left',
      ).opacity(alpha),

      txt(
        '1 byte/value (FP8)',
        -855,
        155,
        30,
        s107 > 0.2 ? ROLE.decode : COSMOS.dim,
        'mono',
        'left',
      ).opacity(alpha),
      lumBar(
        -380,
        155,
        (CAP.kvOnly.counts[1] / 110) * 860 * Math.max(0.08, s107),
        40,
        ROLE.decode,
        {
          opacity: (0.28 + 0.72 * s107) * alpha,
          maxTrackW: 860,
        },
      ),
      txt(
        s107 > 0.2 ? `${CAP.kvOnly.counts[1]} users` : '2× capacity',
        510,
        155,
        34,
        s107 > 0.2 ? ROLE.decode : COSMOS.dim,
        'mono',
        'left',
      )
        .glow(s107 > 0.2 ? 8 : 0, ROLE.decode)
        .opacity(alpha),

      txt(
        'Also budget scale factors, unused page slots, recurrent state, and calibration quality',
        -855,
        295,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ).opacity(alpha),
    ];
    return group(...nodes);
  });

  // View 2: Hybrid short chat (144 MiB recurrent + 8 MiB KV -> halve KV to 4 MiB: 152 -> 148 MiB, 53 -> 55 chats!)
  const view2 = guardedDynamic(view2Vis, (alpha) => {
    const hv = halveStrip.value;
    const kvMiB = 8 - 4 * hv;
    const totalMiB = 144 + kvMiB;
    const chats = Math.floor((8 * 1024) / totalMiB);
    const scale = 6.2; // 152 MiB = 942 px
    const barX = -855;
    const nodes = [
      txt(
        'HYBRID SHORT CHAT: RECURRENT STATE DOMINATES THE PER-USER FOOTPRINT',
        -855,
        -215,
        28,
        ROLE.clockB,
        'mono',
        'left',
      ).opacity(alpha),
      lumBar(barX, -95, 144 * scale, 56, ROLE.prefill, { opacity: alpha }),
      lumBar(barX + 144 * scale, -95, kvMiB * scale, 56, ROLE.decode, { opacity: alpha }),
      txt(
        '144 MiB recurrent state (fixed)',
        barX + 446,
        -28,
        28,
        ROLE.prefill,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        `${kvMiB.toFixed(0)} MiB KV`,
        barX + 144 * scale + 55,
        -28,
        26,
        ROLE.decode,
        'mono',
        'left',
      ).opacity(alpha),

      txt(
        `Total per chat = ${totalMiB.toFixed(0)} MiB   →   8 GiB pool fits ${chats} chats (53 → 55, +2 only!)`,
        -855,
        120,
        32,
        ROLE.wait,
        'mono',
        'left',
      )
        .glow(8, ROLE.wait)
        .opacity(alpha),
      txt(
        'Amdahl limit on memory: shrinking a 5% KV strip barely moves hybrid concurrency',
        -855,
        235,
        30,
        COSMOS.ink,
        'serif',
        'left',
      ).opacity(alpha),
    ];
    return group(...nodes);
  });

  s.add(bgAura, title, view1, view2);
  playCue(s, c, 'ic-cap-53', (d) => s.play(show53.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'ic-cap-107', (d) => s.play(show107.to(1, { duration: d })), { dur: 0.55 });
  playCue(
    s,
    c,
    'quantize-capacity-core-extension',
    (d) => {
      s.play(swapVis(view1Vis, view2Vis, d));
      s.play(halveStrip.to(1, { duration: d }));
    },
    { dur: 0.85 },
  );
  bindCueBeat(s, c, s.value(0), [
    'quantize-capacity-b1',
    'ic-one-byte-row',
    'quantize-capacity-b2',
    'ic-cap-device',
    'ic-cap-weights',
    'ic-cap-reserve',
    'ic-cap-pool',
    'ic-cap-positions',
    'quantize-capacity-b3',
  ]);
}
