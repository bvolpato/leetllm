// Scene 21: real-scale: "How wide is a real attention head?"
// View 1 (Beat 0): Llama 3 405B embedding slice (128,256 x 16,384 = 2.1B, 0.52% of 405B) + 126 layers, 128 heads.
// View 2 (Beat 1): gpt-oss-120b explicit head dimensions: residual 2880 -> 64x64 = 4096 -> output 2880.
// View 3 (Beat 2): 36 alternating layers (18 Sliding window 128 + 18 Full causal) lattice.
import { arrow } from 'vizmatic/stage';
import { COSMOS, guardedDynamic, heroTitle, txt } from '../../cinematic-kit.mjs';
import { ROLE, cinemaAtmosphere, fmt, lumBar, playCue, swapVis } from '../parts.mjs';

export default function realScale(s, c) {
  const title = heroTitle(['Frontier scale:', 'real widths & windows'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.attn,
  });

  const vLlama = s.value(1);
  const vOss = s.value(0);
  const vAlt = s.value(0);

  const llamaProg = s.value(0);
  const embedReveal = s.value(0);
  const ossProg = s.value(0);
  const widthReveal = s.value(0);
  const layerProg = s.value(0);
  const windowReveal = s.value(0);

  // VIEW 1: Llama 3 405B parameter proportion bar
  const embedB = (128256 * 16384) / 1e9; // ~2.101B
  const ratio = embedB / 405; // ~0.00519

  const llamaLayer = guardedDynamic(vLlama, (alpha) => {
    const lp = llamaProg.value;
    const er = embedReveal.value;
    const barLeft = -720;
    const barW = 1440;
    const sliceW = Math.max(12, barW * ratio);
    const barY = -30;

    const nodes = [
      txt(
        'Llama 3 405B  ·  128,256 vocab  x  16,384 features',
        0,
        -235,
        32,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),
      lumBar(0, barY, barW, 170, {
        color: ROLE.stream,
        fillOpacity: 0.16,
        strokeWidth: 2.2,
        glow: 6,
        opacity: alpha,
      }),
      lumBar(barLeft + sliceW / 2, barY, sliceW, 170, {
        color: ROLE.attn,
        fillOpacity: 0.85,
        strokeWidth: 3,
        glow: 14,
        radius: 4,
        opacity: alpha,
      }),
      txt(
        '403B transformer blocks & projections',
        80,
        barY,
        32,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
      txt(
        'Token embedding table',
        barLeft + 210,
        barY - 135,
        28,
        ROLE.attn,
        'mono',
        'center',
      ).opacity(alpha),
      arrow([barLeft + 140, barY - 110], [barLeft + sliceW / 2 + 4, barY - 92], {
        stroke: ROLE.attn,
        width: 3.2,
        tip: 12,
      }).opacity(alpha),
    ];

    if (er > 0.1) {
      nodes.push(
        txt(
          `~ ${fmt(embedB, 1)}B / 405B  =  ${fmt(100 * ratio, 2)}%  (about half a percent!)`,
          0,
          155,
          36,
          ROLE.query,
          'mono',
          'center',
        )
          .glow(9, ROLE.query)
          .opacity(er * alpha),
      );
    }

    nodes.push(
      txt(
        '126 layers   ·   128 query heads   ·   16,384 / 128 = 128 features per head',
        0,
        305,
        30,
        ROLE.valid,
        'mono',
        'center',
      ).opacity((0.35 + 0.65 * lp) * alpha),
    );
    return nodes;
  });

  // VIEW 2: gpt-oss-120b explicit head width (2880 -> 64x64 = 4096 -> 2880)
  const ossLayer = guardedDynamic(vOss, (alpha) => {
    const op = ossProg.value;
    const wr = widthReveal.value > 0.35;
    const rows = [
      { label: 'residual input', w: 2880, col: ROLE.stream },
      { label: '64 heads x 64', w: 4096, col: ROLE.mask },
      { label: 'output W_O', w: 2880, col: ROLE.valid },
    ];
    const barLeft = -420;
    const maxW = 1040;
    const nodes = [
      txt(
        'gpt-oss-120b:  head width declared independently of d_model',
        0,
        -255,
        30,
        ROLE.query,
        'mono',
        'center',
      ).opacity(alpha),
    ];

    rows.forEach((r, i) => {
      const y = -115 + i * 165;
      const frac = Math.max(0.05, Math.min(1, op * 3 - i));
      const bw = (r.w / 4096) * maxW * frac;
      nodes.push(
        txt(r.label, barLeft - 32, y, 28, r.col, 'mono', 'right').opacity(alpha),
        lumBar(barLeft + bw / 2, y, bw, 76, {
          color: r.col,
          fillOpacity: 0.38,
          strokeWidth: 2.6,
          glow: 9,
          opacity: alpha,
        }),
        txt(wr ? String(r.w) : '?', barLeft + maxW + 36, y, 32, r.col, 'mono', 'left')
          .glow(wr ? 7 : 0, r.col)
          .opacity(alpha),
      );
    });

    nodes.push(
      txt(
        wr
          ? '64 x 64 = 4,096 projected features -> W_O projects back to 2,880 to match residual stream'
          : 'Check checkpoint config instead of assuming d_head = d_model / h',
        0,
        355,
        28,
        wr ? ROLE.valid : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );
    return nodes;
  });

  // VIEW 3: 36 alternating sliding (18) + full (18) causal layers
  const altLayer = guardedDynamic(vAlt, (alpha) => {
    const lp = layerProg.value;
    const wr = windowReveal.value;
    const litCount = Math.ceil(36 * lp);
    const nodes = [
      txt(
        '36 alternating causal layers:  18 Sliding (S)  ·  18 Full (F)',
        0,
        -255,
        30,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),
    ];

    for (let i = 0; i < 36; i++) {
      const colIdx = i % 18;
      const rowIdx = Math.floor(i / 18);
      const cx = -765 + colIdx * 90;
      const cy = -95 + rowIdx * 165;
      const isFull = i % 2 === 1;
      const col = isFull ? ROLE.stream : ROLE.valid;
      const on = i < litCount;
      nodes.push(
        lumBar(cx, cy, 72, 108, {
          color: col,
          fillOpacity: on ? 0.38 : 0.1,
          strokeWidth: on ? 2.4 : 1.4,
          glow: on ? 8 : 0,
          radius: 6,
          opacity: alpha,
        }),
        txt(isFull ? 'F' : 'S', cx, cy, 28, on ? COSMOS.ink : COSMOS.dim, 'mono', 'center').opacity(
          alpha,
        ),
      );
    }

    nodes.push(
      txt(
        wr > 0.35
          ? 'Sliding window = 128 recent positions  ·  Full layers read entire prefix'
          : 'Sliding window = ?',
        0,
        240,
        32,
        ROLE.query,
        'mono',
        'center',
      )
        .glow(wr > 0.35 ? 8 : 0, ROLE.query)
        .opacity(alpha),
      txt(
        'Both layer types strictly block future tokens',
        0,
        345,
        28,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );
    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.attn, ROLE.stream), title, llamaLayer, ossLayer, altLayer);

  // Beat 0: Llama 3 405B
  playCue(s, c, 'tr-real-scale-voice-0', (d) => s.play(llamaProg.to(1, { duration: d })), {
    dur: 1.2,
  });
  playCue(s, c, 'tr-real-scale-embed', (d) => s.play(embedReveal.to(1, { duration: d })), {
    dur: 0.7,
  });

  // Beat 1: gpt-oss-120b widths
  playCue(
    s,
    c,
    'tr-real-scale-voice-1',
    (d) => s.play(swapVis(vLlama, vOss, Math.min(0.65, d * 0.35))),
    { dur: 0.7 },
  );
  playCue(s, c, 'tr-real-scale-voice-1', (d) => s.play(ossProg.to(1, { duration: d })), {
    dur: 1.4,
    offset: 0.7,
  });
  playCue(s, c, 'tr-real-scale-width', (d) => s.play(widthReveal.to(1, { duration: d })), {
    dur: 0.65,
  });

  // Beat 2: 36 alternating layers
  playCue(
    s,
    c,
    'tr-real-scale-voice-2',
    (d) => s.play(swapVis(vOss, vAlt, Math.min(0.65, d * 0.35))),
    { dur: 0.7 },
  );
  playCue(s, c, 'tr-real-scale-voice-2', (d) => s.play(layerProg.to(1, { duration: d })), {
    dur: 1.6,
    offset: 0.7,
  });
  playCue(s, c, 'tr-real-scale-window', (d) => s.play(windowReveal.to(1, { duration: d })), {
    dur: 0.65,
  });
}
