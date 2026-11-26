// Scene 15: economics: Vocab memory cost (500 / 2,000 / 15,625 MiB) vs sequence & O(L^2) savings (Llama 2 -> 3).
import {
  COSMOS,
  ROLE,
  aura,
  bindCueBeat,
  dropOf,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  mebibytes,
  playCue,
  swapVis,
  txt,
} from '../parts.mjs';

export default function economics(s, c) {
  const view1Vis = s.value(1);
  const view2Vis = s.value(0);
  const show32 = s.value(0);
  const show128 = s.value(0);
  const show1m = s.value(0);
  const showDemo = s.value(0);
  const showLlama = s.value(0);
  const showTrade = s.value(0);

  const bgAura = aura(0, 0, 740, '#18375a26', '#3c251218');
  const title = heroTitle(['Vocabulary Economics:', 'every row has a price'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: ROLE.merge,
  });

  const eq = glowTex(String.raw`\text{Bytes} = 2 \cdot V \cdot d \cdot 2`, {
    x: 540,
    y: -380,
    size: 40,
    color: ROLE.merge,
    glow: 6,
  });

  const m32 = mebibytes(32_000); // 500
  const m128 = mebibytes(128_000); // 2000
  const m1m = mebibytes(1_000_000); // 15625
  const llamaPosDrop = Math.round(dropOf(3.17, 3.94) * 100); // 20%
  const llamaAttnDrop = Math.round((1 - (3.17 / 3.94) ** 2) * 100); // 35%

  // View 1: Fixed memory bill scaling with vocabulary size V (d = 4096, FP16, untied)
  const view1 = guardedDynamic(view1Vis, (alpha) => {
    const s32 = show32.value;
    const s128 = show128.value;
    const s1m = show1m.value;
    const maxW = 920;
    const barX = -460;
    const nodes = [
      txt(
        'd = 4,096  ·  2 BYTES (FP16)  ·  SEPARATE INPUT & OUTPUT TABLES',
        -855,
        -210,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),
    ];

    // Persistent quiet tracks from t=0; luminous bars fill as each vocabulary scale is spoken
    nodes.push(
      txt(
        '32,000 rows',
        -855,
        -100,
        34,
        s32 > 0.2 ? ROLE.piece : COSMOS.dim,
        'mono',
        'left',
      ).opacity(alpha),
      lumBar(barX, -100, maxW * (m32 / m1m) * Math.max(0.05, s32), 40, ROLE.piece, {
        opacity: (0.28 + 0.72 * s32) * alpha,
        maxTrackW: maxW,
      }),
      txt(
        s32 > 0.2 ? `${m32} MiB` : 'scale 1',
        barX + maxW + 36,
        -100,
        34,
        s32 > 0.2 ? ROLE.piece : COSMOS.dim,
        'mono',
        'left',
      ).opacity(alpha),

      txt(
        '128,000 rows',
        -855,
        20,
        34,
        s128 > 0.2 ? ROLE.token : COSMOS.dim,
        'mono',
        'left',
      ).opacity(alpha),
      lumBar(barX, 20, maxW * (m128 / m1m) * Math.max(0.05, s128), 40, ROLE.token, {
        opacity: (0.28 + 0.72 * s128) * alpha,
        maxTrackW: maxW,
      }),
      txt(
        s128 > 0.2 ? `${m128.toLocaleString()} MiB` : 'scale 2',
        barX + maxW + 36,
        20,
        34,
        s128 > 0.2 ? ROLE.token : COSMOS.dim,
        'mono',
        'left',
      ).opacity(alpha),

      txt(
        '1,000,000 rows',
        -855,
        140,
        34,
        s1m > 0.2 ? ROLE.warn : COSMOS.dim,
        'mono',
        'left',
      ).opacity(alpha),
      lumBar(barX, 140, maxW * Math.max(0.02, s1m), 40, ROLE.warn, {
        opacity: (0.28 + 0.72 * s1m) * alpha,
        maxTrackW: maxW,
      }),
      txt(
        s1m > 0.2 ? `${m1m.toLocaleString()} MiB` : 'scale 3',
        barX + maxW + 36,
        140,
        34,
        s1m > 0.2 ? ROLE.warn : COSMOS.dim,
        'mono',
        'left',
      )
        .glow(s1m > 0.2 ? 8 : 0, ROLE.warn)
        .opacity(alpha),
    );
    if (s1m > 0.2) {
      nodes.push(
        txt(
          '~16.38 billion bytes before the first transformer layer',
          -855,
          265,
          32,
          ROLE.warn,
          'serif',
          'left',
        ).opacity(s1m * alpha),
      );
    }
    return group(...nodes);
  });

  // View 2: Compression saving (1 - old/new) and Llama 2 -> Llama 3 comparison
  const view2 = guardedDynamic(view2Vis, (alpha) => {
    const dm = showDemo.value;
    const ll = showLlama.value;
    const tr = showTrade.value;
    const maxW = 760;
    const nodes = [
      txt(
        'SEQUENCE REDUCTION = 1 − (old rate / new rate)',
        -855,
        -210,
        28,
        ROLE.ok,
        'mono',
        'left',
      ).opacity(alpha),
      // Quiet tracks visible immediately when View 2 opens, then fill smoothly as cues fire
      txt(
        '3 → 4 chars/token (+33% rate)',
        -855,
        -110,
        32,
        dm > 0.2 ? COSMOS.ink : COSMOS.dim,
        'mono',
        'left',
      ).opacity(alpha),
      lumBar(-220, -110, maxW * (0.08 + 0.67 * dm), 36, ROLE.ok, {
        opacity: (0.28 + 0.72 * dm) * alpha,
        maxTrackW: maxW,
      }),
      txt(
        dm > 0.2 ? '−25% tokens' : 'demo',
        575,
        -110,
        32,
        dm > 0.2 ? ROLE.ok : COSMOS.dim,
        'mono',
        'left',
      )
        .glow(dm > 0.2 ? 6 : 0, ROLE.ok)
        .opacity(alpha),

      txt(
        'Llama 2 (3.17) → Llama 3 (3.94)',
        -855,
        25,
        32,
        ll > 0.2 ? ROLE.piece : COSMOS.dim,
        'mono',
        'left',
      ).opacity(alpha),
      lumBar(-220, 25, maxW * (0.08 + (1 - dropOf(3.17, 3.94) - 0.08) * ll), 36, ROLE.piece, {
        opacity: (0.28 + 0.72 * ll) * alpha,
        maxTrackW: maxW,
      }),
      txt(
        ll > 0.2 ? `−${llamaPosDrop}% tokens` : 'English',
        575,
        25,
        32,
        ll > 0.2 ? ROLE.piece : COSMOS.dim,
        'mono',
        'left',
      ).opacity(alpha),

      txt(
        'Quadratic attention pairs (L²)',
        -855,
        130,
        32,
        ll > 0.2 ? ROLE.merge : COSMOS.dim,
        'mono',
        'left',
      ).opacity(alpha),
      lumBar(-220, 130, maxW * (0.08 + ((3.17 / 3.94) ** 2 - 0.08) * ll), 36, ROLE.merge, {
        opacity: (0.28 + 0.72 * ll) * alpha,
        maxTrackW: maxW,
      }),
      txt(
        ll > 0.2 ? `−${llamaAttnDrop}% pairs` : 'L² cost',
        575,
        130,
        32,
        ll > 0.2 ? ROLE.merge : COSMOS.dim,
        'mono',
        'left',
      )
        .glow(ll > 0.2 ? 8 : 0, ROLE.merge)
        .opacity(alpha),
    ];

    if (tr > 0.05) {
      nodes.push(
        txt(
          'Memory bill is fixed arithmetic; savings depend on your languages, code, and numbers',
          -855,
          310,
          30,
          ROLE.ok,
          'serif',
          'left',
        )
          .glow(6, ROLE.ok)
          .opacity(tr * alpha),
      );
    }
    return group(...nodes);
  });

  s.add(bgAura, title, eq, view1, view2);
  playCue(s, c, 'c32', (d) => s.play(show32.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'c128', (d) => s.play(show128.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'c1m', (d) => s.play(show1m.to(1, { duration: d })), { dur: 0.55 });

  playCue(s, c, 'rate', (d) => s.play(swapVis(view1Vis, view2Vis, d)), { dur: 0.65 });
  playCue(s, c, 'demo', (d) => s.play(showDemo.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'llama', (d) => s.play(showLlama.to(1, { duration: d })), { dur: 0.55 });
  playCue(s, c, 'fixed', (d) => s.play(showTrade.to(1, { duration: d })), { dur: 0.5 });
  bindCueBeat(s, c, s.value(0), [
    'price',
    'hidden',
    'double',
    'illustrate',
    'cost32',
    'cost-value32',
    'cost128',
    'cost-value128',
    'cost1m',
    'cost-value1m',
    'billion',
    'rule',
    'drop',
    'drop-value',
    'gain',
    'twenty',
    'twenty-value',
    'thirtyfive',
    'thirtyfive-value',
    'whole',
    'depends',
    'measure',
  ]);
}
