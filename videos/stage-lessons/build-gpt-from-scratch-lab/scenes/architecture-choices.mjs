// Scene 16: What can change inside the decoder? (GPT-2 vs Llama 2, LayerNorm vs RMSNorm, SwiGLU & GQA)
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  NORM_CMP,
  aura,
  box3d,
  cinematic3d,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  line,
  orbitScene,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function architectureChoices(s, c) {
  const phase = s.value(0);
  const showPart1 = s.value(1);
  const showLlama = s.value(0);

  const showPart2 = s.value(0);
  const showNorms = s.value(0);
  const showRope = s.value(0);

  const showPart3 = s.value(0);
  const showGqa = s.value(0);

  const bgAura = aura(300, 0, 560, '#1c326a26', '#3d206014');

  // Orbiting 3D KV cache slabs for Beat 3 (MHA 4 KV heads vs GQA 2 KV heads = 50% volume)
  const kv3d = cinematic3d({
    theta: -0.78,
    phi: 1.04,
    distance: 15.0,
    unit: 102,
    focus: [0, 0, 0.3],
  }).at(420, 40);
  // Top: 4 cyan MHA KV slabs; Bottom: 2 emerald GQA KV slabs (half the volume)
  for (let i = 0; i < 4; i++) {
    kv3d.add(...box3d(-2.2 + i * 1.15, 0.45, -0.4, 0.88, 1.5, 0.8, '#102944', COSMOS.cyan, 0.72));
  }
  for (let i = 0; i < 2; i++) {
    kv3d.add(
      ...box3d(-2.2 + i * 1.15, -1.95, -0.4, 0.88, 1.5, 0.8, '#0f342d', COSMOS.emerald, 0.85),
    );
  }

  // Beat 1: Modular decoder comparison (GPT-2 lab vs Llama 2 historical stack)
  const part1 = guardedDynamic(showPart1, (a) => {
    const ll = showLlama.value;
    const partsGpt = [
      'Learned Abs Pos',
      'Pre-LN (LayerNorm)',
      'Multi-Head Attn',
      'GELU MLP',
      'Tied Output',
    ];
    const partsLlama = [
      'Rotary (RoPE)',
      'RMSNorm',
      'MHA (7B/13B) · GQA (70B)',
      'SwiGLU Gate',
      'Causal Next-Token',
    ];

    const nodes = [
      heroTitle(['What Can Change', 'Inside the Decoder?'], {
        x: -855,
        y: -415,
        size: 56,
        lineHeight: 66,
        accent: COSMOS.cyan,
        eyebrow: 'SAME CAUSAL OBJECTIVE · SWAPPABLE COMPONENTS',
      }).opacity(a),
      txt('OUR LAB (GPT-2 STYLE)', -560, -210, 26, COSMOS.cyan, 'mono').opacity(a),
    ];

    partsGpt.forEach((label, i) => {
      const y = -125 + i * 96;
      nodes.push(
        glassCell(-560, y, 520, 72, COSMOS.cyan, { fill: '#102138', glow: 5, opacity: a }),
        txt(label, -560, y + 2, 30, COSMOS.ink, 'mono').opacity(a),
      );
    });

    const llOp = Math.max(0.72, ll) * a;
    nodes.push(txt('LLAMA 2 (HISTORICAL STACK)', 360, -210, 26, COSMOS.gold, 'mono').opacity(llOp));
    partsLlama.forEach((label, i) => {
      const y = -125 + i * 96;
      const col = i === 4 ? COSMOS.emerald : COSMOS.gold;
      nodes.push(
        glassCell(360, y, 540, 72, ll > 0.3 ? col : COSMOS.muted, {
          fill: i === 4 ? '#0d2623' : '#241e0e',
          glow: ll > 0.3 ? 6 : 2,
          opacity: llOp,
        }),
        txt(label, 360, y + 2, 28, ll > 0.3 ? col : COSMOS.muted, 'mono').opacity(llOp),
      );
      if (ll > 0.05) {
        nodes.push(glowingArc([-295, y], [85, y], 0, { color: col, width: 3, opacity: ll * a }));
      }
    });

    return group(...nodes);
  });

  // Beat 2: Live 2D vector geometry for LayerNorm vs RMSNorm on x = (1, 3) + RoPE rotation dial
  const part2 = guardedDynamic(showPart2, (a) => {
    const nm = showNorms.value;
    const rp = showRope.value;
    const p = phase.value;

    const ox = -320;
    const oy = 180;
    const sc = 96;
    const pt = (v) => [ox + v[0] * sc, oy - v[1] * sc];
    const [ix, iy] = pt(NORM_CMP.x); // (1, 3)
    const [lx, ly] = pt(NORM_CMP.layer); // (-1, 1)
    const [rx, ry] = pt(NORM_CMP.rms); // (0.447, 1.342)

    const nodes = [
      heroTitle(['LayerNorm vs RMSNorm', 'on x = (1, 3)'], {
        x: -855,
        y: -415,
        size: 56,
        lineHeight: 66,
        accent: COSMOS.gold,
        eyebrow: 'UNIT GAIN · ZERO OFFSET · ZERO EPSILON',
      }).opacity(a),

      // 2D axes
      line([ox - 240, oy], [ox + 260, oy], { stroke: COSMOS.rule, width: 2 }).opacity(a),
      line([ox, oy + 70], [ox, oy - 340], { stroke: COSMOS.rule, width: 2 }).opacity(a),
      txt('x_0', ox + 278, oy + 2, 26, COSMOS.muted, 'mono').opacity(a),
      txt('x_1', ox, oy - 365, 26, COSMOS.muted, 'mono').opacity(a),

      // Input vector x = (1, 3)
      line([ox, oy], [ix, iy], { stroke: COSMOS.cyan, width: 4.2 }).opacity(a),
      glowDot(ix, iy, { radius: 8, color: COSMOS.cyan, opacity: a }),
      txt('x = (1, 3)', ix + 24, iy - 6, 28, COSMOS.cyan, 'mono', 'left').opacity(a),
    ];

    if (nm > 0.05) {
      nodes.push(
        // LayerNorm: (-1, +1) crosses into negative x_0!
        line([ox, oy], [lx, ly], { stroke: COSMOS.rose, width: 4.8 })
          .glow(8, COSMOS.rose)
          .opacity(nm * a),
        glowDot(lx, ly, { radius: 8, color: COSMOS.rose, opacity: nm * a }),
        txt('LayerNorm: (-1, +1)', lx - 22, ly - 38, 28, COSMOS.rose, 'mono', 'right')
          .glow(6, COSMOS.rose)
          .opacity(nm * a),

        // RMSNorm: (1/sqrt5, 3/sqrt5) stays on same positive ray!
        line([ox, oy], [rx, ry], { stroke: COSMOS.emerald, width: 5.2 })
          .glow(9, COSMOS.emerald)
          .opacity(nm * a),
        glowDot(rx, ry, { radius: 8, color: COSMOS.emerald, opacity: nm * a }),
        txt(
          `RMSNorm: (${NORM_CMP.rms[0].toFixed(2)}, ${NORM_CMP.rms[1].toFixed(2)})`,
          rx + 18,
          ry + 36,
          28,
          COSMOS.emerald,
          'mono',
          'left',
        )
          .glow(6, COSMOS.emerald)
          .opacity(nm * a),

        txt(
          'LayerNorm subtracts mean (2) -> first coord turns negative',
          -830,
          315,
          26,
          COSMOS.rose,
          'sans',
          'left',
        ).opacity(nm * a),
        txt(
          'RMSNorm divides by sqrt(5) -> preserves ray & both signs',
          -830,
          362,
          26,
          COSMOS.emerald,
          'sans',
          'left',
        ).opacity(nm * a),
      );
    }

    // Right side: live rotating RoPE query/key pair (pre-framed from Beat 2 start at luminance >= 40)
    const cx = 480;
    const cy = 20;
    const r = 150;
    const angQ = -0.3 + p * 0.45;
    const angK = angQ - 0.85;
    const rpOp = Math.max(0.75, rp) * a;
    nodes.push(
      txt('ROTARY POSITIONS (RoPE)', cx, -210, 26, COSMOS.gold, 'mono').opacity(rpOp),
      glassCell(cx, cy, r * 2.2, r * 2.2, COSMOS.muted, {
        fill: '#12182b',
        radius: r * 1.1,
        glow: 3,
        opacity: 0.78 * rpOp,
      }),
      line([cx, cy], [cx + Math.cos(angQ) * r, cy + Math.sin(angQ) * r], {
        stroke: COSMOS.gold,
        width: 4.5,
      })
        .glow(8, COSMOS.gold)
        .opacity(rpOp),
      line([cx, cy], [cx + Math.cos(angK) * r, cy + Math.sin(angK) * r], {
        stroke: COSMOS.cyan,
        width: 4.5,
      })
        .glow(8, COSMOS.cyan)
        .opacity(rpOp),
      glowDot(cx + Math.cos(angQ) * r, cy + Math.sin(angQ) * r, {
        radius: 8,
        color: COSMOS.gold,
        opacity: rpOp,
      }),
      glowDot(cx + Math.cos(angK) * r, cy + Math.sin(angK) * r, {
        radius: 8,
        color: COSMOS.cyan,
        opacity: rpOp,
      }),
      txt('Dot product depends on relative angle Δ', cx, 238, 28, COSMOS.gold, 'sans').opacity(
        rpOp,
      ),
    );

    return group(...nodes);
  });

  // Beat 3: SwiGLU branch + 4 query heads sharing 2 KV heads (50% KV cache volume)
  const part3 = guardedDynamic(showPart3, (a) => {
    const gq = showGqa.value;
    const gqOp = Math.max(0.75, gq) * a;
    const nodes = [
      heroTitle(['SwiGLU Gating', '& Grouped-Query KV'], {
        x: -855,
        y: -415,
        size: 56,
        lineHeight: 66,
        accent: COSMOS.emerald,
        eyebrow: 'FEED-FORWARD GATE · 4 QUERY HEADS -> 2 KV HEADS',
      }).opacity(a),

      txt(
        'SwiGLU(x) = (SiLU(x W_gate) * (x W_val)) W_out',
        -855,
        -185,
        30,
        COSMOS.violet,
        'mono',
        'left',
      )
        .glow(5, COSMOS.violet)
        .opacity(a),
    ];

    // 4 query heads paired into 2 shared KV heads (visible from Beat 3 start at balanced opacity)
    const qy = -32;
    const kvy = 148;
    const qx = [-740, -560, -340, -160];
    qx.forEach((x, idx) => {
      const kvX = idx < 2 ? -650 : -250;
      nodes.push(
        glassCell(x, qy, 140, 74, COSMOS.gold, { fill: '#241d0e', glow: 6, opacity: gqOp }),
        txt(`Q${idx}`, x, qy + 2, 32, COSMOS.gold, 'mono').opacity(gqOp),
        glowingArc([x, qy + 40], [kvX, kvy - 42], 24, {
          color: COSMOS.emerald,
          width: 3.2,
          opacity: gqOp,
        }),
      );
    });
    [-650, -250].forEach((kvX, idx) => {
      nodes.push(
        glassCell(kvX, kvy, 270, 82, COSMOS.emerald, {
          fill: '#0e2824',
          glow: 8,
          opacity: gqOp,
        }),
        txt(`Shared KV ${idx}`, kvX, kvy + 2, 30, COSMOS.emerald, 'mono').opacity(gqOp),
      );
    });
    nodes.push(
      txt(
        '4 -> 2 KV heads = 50% stored KV elements (half ideal cache bytes)',
        -855,
        290,
        28,
        COSMOS.emerald,
        'mono',
        'left',
      )
        .glow(6, COSMOS.emerald)
        .opacity(gqOp),
      txt(
        '3D KV CACHE VOLUME: 4 MHA (CYAN) vs 2 GQA (EMERALD)',
        420,
        -345,
        26,
        COSMOS.cyan,
        'mono',
      ).opacity(gqOp),
      txt(
        'Timed run + quality & checkpoint check still required',
        -855,
        345,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ).opacity(gqOp),
    );

    return group(...nodes);
  });

  s.add(bgAura, part1, part2, part3);
  runPhase(s, c, phase, 16);

  c.on('architecture-choices-1', () => s.play(phase.to(1.2, { duration: 0.4 })));
  c.on('historical-stack', () => s.play(showLlama.to(1, { duration: 0.6 })));

  c.on('architecture-choices-2', () => {
    s.play(
      par(showPart1.to(0, { duration: 0.2 }), delay(showPart2.to(1, { duration: 0.25 }), 0.16)),
    );
  });
  c.on('norm-compare', () => s.play(showNorms.to(1, { duration: 0.6 })));
  c.on('relative-rotation', () => s.play(showRope.to(1, { duration: 0.6 })));

  c.on('architecture-choices-3', () => {
    s.play(
      par(showPart2.to(0, { duration: 0.2 }), delay(showPart3.to(1, { duration: 0.25 }), 0.16)),
    );
  });
  c.on('shared-kv', () => {
    s.play(showGqa.to(1, { duration: remainDuration(c, 'shared-kv', 0.6) }));
  });
  c.show('shared-kv', kv3d, { fade: 0.4 });
  orbitScene(
    s,
    c,
    kv3d,
    { theta: -0.22, phi: 0.92 },
    { startOffset: Math.max(0.1, c.cue('shared-kv').start - c.start) },
  );
}
