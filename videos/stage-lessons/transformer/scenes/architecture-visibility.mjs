// Scene 20: architecture-visibility: "Change the legal reads when the task changes"
// View 1 (Beat 0): Three glowing 3x3 visibility grids lighting up in turn:
//         Encoder self-read (full), Decoder self-read (causal), Target -> Source cross-read (full).
// View 2 (Beat 1): T5 missing-span pretraining ("function <span> result" -> "returns the") vs GPT shift.
// View 3 (Beat 2): Growing decoder KV cache strip (target 0..3) paired with fixed encoded source KV strip.
import { arrow } from 'vizmatic/stage';
import { COSMOS, guardedDynamic, heroTitle, txt } from '../../cinematic-kit.mjs';
import { ROLE, cinemaAtmosphere, glowMatrix, lumBar, playCue, swapVis } from '../parts.mjs';

export default function architectureVisibility(s, c) {
  const title = heroTitle(['Three families:', 'visibility sets the task'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.attn,
  });

  const vMasks = s.value(1);
  const vTasks = s.value(0);
  const vCache = s.value(0);

  const encLit = s.value(0.2);
  const decLit = s.value(0.2);
  const crossLit = s.value(0.2);
  const spanProg = s.value(0);
  const cacheSteps = s.value(1); // 1 -> 4 target positions
  const sourcePin = s.value(0);

  // VIEW 1: Encoder, Decoder, Cross-attention 3x3 visibility grids
  const masksLayer = guardedDynamic(vMasks, (alpha) => {
    const grids = [
      {
        cx: -555,
        name: 'Encoder-only (BERT)',
        sub: 'bidirectional self-read',
        mode: 'full',
        lit: encLit.value,
        col: ROLE.stream,
      },
      {
        cx: 0,
        name: 'Decoder-only (GPT)',
        sub: 'causal self-read',
        mode: 'causal',
        lit: decLit.value,
        col: ROLE.query,
      },
      {
        cx: 555,
        name: 'Cross-attention (T5)',
        sub: 'target Q -> source K, V',
        mode: 'full',
        lit: crossLit.value,
        col: ROLE.valid,
      },
    ];
    const nodes = [
      txt(
        'Same attention mechanism  ·  different visibility masks',
        0,
        -270,
        30,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
    ];

    grids.forEach((g) => {
      const vals = Array.from({ length: 3 }, (_, r) =>
        Array.from({ length: 3 }, (_, k) => (g.mode === 'full' || k <= r ? '1' : '0')),
      );
      const cols = Array.from({ length: 3 }, (_, r) =>
        Array.from({ length: 3 }, (_, k) => (g.mode === 'full' || k <= r ? g.col : ROLE.rule)),
      );
      nodes.push(
        txt(g.name, g.cx, -195, 30, g.col, 'serif', 'center')
          .glow(g.lit > 0.7 ? 7 : 0, g.col)
          .opacity((0.35 + 0.65 * g.lit) * alpha),
        glowMatrix({
          cx: g.cx,
          cy: 10,
          rows: 3,
          cols: 3,
          cellW: 112,
          cellH: 88,
          gap: 10,
          values: vals,
          colors: cols,
          dim: (r, k) => g.mode === 'causal' && k > r,
          fontSize: 30,
          bracketColor: g.col,
          opacity: (0.3 + 0.7 * g.lit) * alpha,
        }),
        txt(g.sub, g.cx, 215, 26, COSMOS.muted, 'mono', 'center').opacity(
          (0.35 + 0.65 * g.lit) * alpha,
        ),
      );
    });

    nodes.push(
      txt(
        'Self-attention takes Q, K, V from one sequence  ·  cross-attention separates Q from K, V',
        0,
        365,
        28,
        COSMOS.ink,
        'sans',
        'center',
      ).opacity(alpha),
    );
    return nodes;
  });

  // VIEW 2: T5 span corruption vs GPT next-token shifting
  const tasksLayer = guardedDynamic(vTasks, (alpha) => {
    const sp = spanProg.value;
    const orig = ['function', 'returns', 'the', 'result'];
    const masked = ['function', '<span 0>', 'result'];
    const target = ['returns', 'the'];

    const nodes = [
      txt(
        'T5 encoder-decoder span infilling (schematic)',
        0,
        -255,
        32,
        ROLE.pos,
        'mono',
        'center',
      ).opacity(alpha),
      txt('Original text:', -650, -145, 28, ROLE.stream, 'mono', 'right').opacity(alpha),
      txt('Encoder input:', -650, 15, 28, ROLE.mask, 'mono', 'right').opacity(alpha),
      txt('Decoder target:', -650, 175, 28, ROLE.valid, 'mono', 'right').opacity(sp * alpha),
    ];

    orig.forEach((w, i) => {
      const cx = -420 + i * 310;
      nodes.push(
        lumBar(cx, -145, 265, 74, { color: ROLE.stream, fillOpacity: 0.22, opacity: alpha }),
        txt(w, cx, -145, 30, ROLE.stream, 'mono', 'center').opacity(alpha),
      );
    });

    masked.forEach((w, i) => {
      const cx = -360 + i * 410;
      const isSpan = i === 1;
      nodes.push(
        lumBar(cx, 15, 340, 74, {
          color: isSpan ? ROLE.mask : ROLE.stream,
          fillOpacity: isSpan ? 0.34 : 0.18,
          glow: isSpan ? 10 : 4,
          opacity: alpha,
        }),
        txt(w, cx, 15, 30, isSpan ? COSMOS.ink : ROLE.stream, 'mono', 'center').opacity(alpha),
      );
    });

    if (sp > 0.1) {
      target.forEach((w, i) => {
        const cx = -210 + i * 350;
        nodes.push(
          lumBar(cx, 175, 290, 74, {
            color: ROLE.valid,
            fillOpacity: 0.34,
            glow: 9,
            opacity: sp * alpha,
          }),
          txt(w, cx, 175, 30, COSMOS.ink, 'mono', 'center').opacity(sp * alpha),
        );
      });
    }

    nodes.push(
      txt(
        'GPT trains directly on shifted text; instructions sit ahead of the response in one stream',
        0,
        355,
        28,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );
    return nodes;
  });

  // VIEW 3: Growing target KV cache vs fixed source KV cache
  const cacheLayer = guardedDynamic(vCache, (alpha) => {
    const n = Math.max(1, Math.min(4, Math.round(cacheSteps.value)));
    const sp = sourcePin.value;
    const nodes = [
      txt(
        'Decoding KV cache: growing target vs fixed source',
        0,
        -255,
        32,
        ROLE.query,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        `Decoder self-attention cache: ${n} / 4 positions`,
        0,
        -172,
        28,
        ROLE.stream,
        'mono',
        'center',
      ).opacity(alpha),
    ];

    for (let i = 0; i < 4; i++) {
      const cx = -495 + i * 330;
      const active = i < n;
      nodes.push(
        lumBar(cx, -75, 280, 92, {
          color: active ? ROLE.stream : ROLE.rule,
          fillOpacity: active ? 0.36 : 0.08,
          strokeWidth: active ? 2.8 : 1.5,
          glow: active ? 9 : 0,
          opacity: alpha,
        }),
        txt(
          active ? `target ${i}` : 'next...',
          cx,
          -75,
          30,
          active ? COSMOS.ink : COSMOS.dim,
          'mono',
          'center',
        ).opacity(alpha),
      );
    }

    // Arrows from latest target query down to fixed source K, V
    const qX = -495 + (n - 1) * 330;
    for (let k = 0; k < 3; k++) {
      const sx = -370 + k * 370;
      nodes.push(
        arrow([qX, -18], [sx, 118], {
          stroke: ROLE.valid,
          width: 3,
          tip: 12,
        }).opacity((0.4 + 0.6 * sp) * alpha),
        lumBar(sx, 175, 310, 92, {
          color: ROLE.valid,
          fillOpacity: 0.34,
          strokeWidth: 2.8,
          glow: 9 + 4 * sp,
          opacity: alpha,
        }),
        txt(`source ${k} (fixed)`, sx, 175, 28, COSMOS.ink, 'mono', 'center').opacity(alpha),
      );
    }

    nodes.push(
      txt(
        'Caching avoids recomputing earlier K, V projections by trading memory for compute',
        0,
        355,
        28,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );
    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.attn, ROLE.valid), title, masksLayer, tasksLayer, cacheLayer);

  // Beat 0: Encoder, Decoder, Cross-attention
  playCue(
    s,
    c,
    'tr-architecture-visibility-voice-0',
    (d) => s.play(encLit.to(0.45, { duration: d })),
    {
      dur: 0.4,
    },
  );
  playCue(
    s,
    c,
    'tr-architecture-visibility-encoder',
    (d) => s.play(encLit.to(1, { duration: d })),
    {
      dur: 0.55,
    },
  );
  playCue(
    s,
    c,
    'tr-architecture-visibility-decoder',
    (d) => s.play(decLit.to(1, { duration: d })),
    {
      dur: 0.55,
    },
  );
  playCue(
    s,
    c,
    'tr-architecture-visibility-cross',
    (d) => s.play(crossLit.to(1, { duration: d })),
    {
      dur: 0.55,
    },
  );

  // Beat 1: T5 missing-span task
  playCue(
    s,
    c,
    'tr-architecture-visibility-voice-1',
    (d) => s.play(swapVis(vMasks, vTasks, Math.min(0.65, d * 0.4))),
    { dur: 0.7, offset: -0.65 },
  );
  playCue(
    s,
    c,
    'tr-architecture-visibility-voice-1',
    (d) => s.play(spanProg.to(1, { duration: d })),
    {
      dur: 1.2,
    },
  );

  // Beat 2: Growing target cache vs fixed source cache
  playCue(
    s,
    c,
    'tr-architecture-visibility-voice-2',
    (d) => s.play(swapVis(vTasks, vCache, Math.min(0.65, d * 0.4))),
    { dur: 0.7, offset: -0.65 },
  );
  playCue(
    s,
    c,
    'tr-architecture-visibility-voice-2',
    (d) => s.play(cacheSteps.to(4, { duration: d })),
    { dur: 2.2 },
  );
  playCue(
    s,
    c,
    'tr-architecture-visibility-cache',
    (d) => s.play(sourcePin.to(1, { duration: d })),
    {
      dur: 0.7,
    },
  );
}
