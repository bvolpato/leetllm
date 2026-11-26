// Scene 11: Which weights should learn from the reply?: Objective routing + orbiting 3D W + BA LoRA/QLoRA.
import {
  COSMOS,
  aura,
  box3d,
  cinematic3d,
  glassCell,
  glowTex,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function objectiveSurface(s, c) {
  const phase = s.value(0);
  const highlightSft = s.value(0);
  const paramView = s.value(0);
  const frozenLora = s.value(0);
  const qlora4bit = s.value(0);
  const showStudy = s.value(0);

  const bgAura = aura(240, 20, 620, '#a78bfa24', '#6ee7b716');
  const title = heroTitle(['Objective vs.', 'Parameterization'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: COSMOS.violet,
    eyebrow: 'FULL TUNING · LoRA · QLoRA',
  });

  const eqLora = glowTex(String.raw`h = W_{\text{frozen}}\,x \;+\; B\,A\,x`, {
    x: 450,
    y: -365,
    size: 40,
    color: COSMOS.violet,
  });

  // Orbiting 3D weight tensor slab W + low-rank B and A adapter slabs (shown in Beats 1-2)
  const view3d = cinematic3d({
    theta: -0.76,
    phi: 1.04,
    distance: 15.6,
    unit: 104,
    focus: [0, 0, 0.2],
  }).at(330, -5);

  // Frozen base matrix W (4x4 slab)
  view3d.add(...box3d(-2.8, -1.6, -0.35, 2.6, 3.2, 0.7, '#162447', COSMOS.blue, 0.78));
  // Low-rank adapter B (tall thin) & A (wide thin)
  view3d.add(...box3d(0.5, -1.6, -0.25, 0.55, 3.2, 0.55, '#2b1b52', COSMOS.violet, 0.88));
  view3d.add(...box3d(1.45, -0.32, -0.25, 1.9, 0.64, 0.55, '#123a36', COSMOS.emerald, 0.88));

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const hs = highlightSft.value;
    const pv = paramView.value;
    const fl = frozenLora.value;
    const q4 = qlora4bit.value;
    const st = showStudy.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.4);

    const nodes = [];

    if (pv < 0.5) {
      // Beat 0: Separating learning objectives (3 glowing paths)
      const a = 1 - pv * 2;
      const rows = [
        {
          obs: 'Unfamiliar vocabulary',
          ev: 'Raw domain text',
          obj: 'Continued Pretraining',
          col: COSMOS.blue,
        },
        {
          obs: 'Knows policy, misses action',
          ev: 'Approved replies',
          obj: 'Supervised Fine-Tuning',
          col: COSMOS.emerald,
        },
        {
          obs: 'Multiple valid replies',
          ev: 'Ranked comparisons',
          obj: 'Preference Training',
          col: COSMOS.violet,
        },
      ];
      const xs = [-590, 0, 580];
      ['OBSERVED FAILURE', 'TRAINING EVIDENCE', 'LEARNING OBJECTIVE'].forEach((h, i) => {
        nodes.push(txt(h, xs[i], -195, 26, COSMOS.muted, 'mono').opacity(a));
      });
      rows.forEach((r, i) => {
        const y = -65 + i * 175;
        const isSft = i === 1;
        const glowAmt = isSft && hs > 0.3 ? 11 * pulse : 4;
        const borderCol = isSft ? COSMOS.emerald : '#394b76';
        nodes.push(
          glassCell(xs[0], y, 470, 102, borderCol, { fill: '#10182b', glow: glowAmt, opacity: a }),
          txt(r.obs, xs[0], y, 28, COSMOS.ink, 'sans').opacity(a),
          glowingArc([xs[0] + 240, y], [xs[1] - 210, y], -10, {
            color: r.col,
            width: 3,
            opacity: a,
          }),

          glassCell(xs[1], y, 410, 102, borderCol, { fill: '#10182b', glow: glowAmt, opacity: a }),
          txt(r.ev, xs[1], y, 28, isSft ? COSMOS.cyan : COSMOS.muted, 'sans').opacity(a),
          glowingArc([xs[1] + 210, y], [xs[2] - 245, y], -10, {
            color: r.col,
            width: 3,
            opacity: a,
          }),

          glassCell(xs[2], y, 480, 102, r.col, {
            fill: isSft ? '#0c2624' : '#11182c',
            glow: isSft ? 11 * pulse : 6,
            opacity: a,
          }),
          txt(r.obj, xs[2], y, 30, r.col, 'mono').opacity(a),
        );
      });
    } else {
      // Beats 1-2: Left-side Parameterization ladder + right-side 3D W + BA
      const a = Math.min(1, (pv - 0.5) * 2);
      const isLora = fl > 0.5;
      const isQ = q4 > 0.5;

      nodes.push(
        glassCell(-495, -170, 710, 86, COSMOS.emerald, { fill: '#0c2424', glow: 8, opacity: a }),
        txt('SAME SFT LOSS: open · ticket · END', -495, -170, 28, COSMOS.emerald, 'mono').opacity(
          a,
        ),
      );

      // 3 parameterization modes (Full / LoRA / QLoRA)
      const tiers = [
        {
          name: 'FULL FINE-TUNING',
          desc: 'All base weights + full optimizer state move',
          active: !isLora,
          col: COSMOS.blue,
          y: -45,
        },
        {
          name: 'LoRA ADAPTERS (W + B·A)',
          desc: 'Freeze base W · Train low-rank B and A only',
          active: isLora && !isQ,
          col: COSMOS.violet,
          y: 95,
        },
        {
          name: 'QLoRA (4-BIT NF4 BASE)',
          desc: '4-bit frozen W · Dequantize on matmul · Paged opt',
          active: isQ,
          col: COSMOS.gold,
          y: 235,
        },
      ];
      tiers.forEach((t) => {
        nodes.push(
          glassCell(-495, t.y, 710, 114, t.active ? t.col : '#2a3759', {
            fill: t.active ? '#141d34' : '#0c101d',
            glow: t.active ? 11 * pulse : 0,
            opacity: (t.active ? 1 : 0.58) * a,
          }),
          txt(t.name, -815, t.y - 22, 28, t.active ? t.col : COSMOS.muted, 'mono', 'left').opacity(
            a,
          ),
          txt(
            t.desc,
            -815,
            t.y + 24,
            26,
            t.active ? COSMOS.ink : COSMOS.dim,
            'sans',
            'left',
          ).opacity(a),
        );
      });

      // Labels underneath 3D slab
      nodes.push(
        txt(
          isQ ? '4-bit NF4 Frozen W' : isLora ? 'Frozen Base W' : 'Trainable Base W',
          190,
          342,
          28,
          isQ ? COSMOS.gold : isLora ? COSMOS.cyan : COSMOS.blue,
          'mono',
        ).opacity(a),
        txt('Trainable B × A', 555, 342, 28, COSMOS.emerald, 'mono').opacity(
          (isLora ? 1 : 0.35) * a,
        ),
      );

      if (st > 0.05) {
        nodes.push(
          rect(1660, 74, { fill: '#12182d', stroke: COSMOS.violet, width: 2.2, radius: 10 })
            .at(0, 434)
            .glow(8, COSMOS.violet)
            .opacity(st * a),
          txt(
            'LoRA 175B study: up to 10,000× fewer trainable params · 3× lower GPU memory than full Adam',
            0,
            434,
            27,
            COSMOS.violet,
            'mono',
          ).opacity(st * a),
        );
      }
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('objective-surface-b1', () => s.play(highlightSft.to(1, { duration: 0.5 })));
  c.onBeat(1, () => s.play(paramView.to(1, { duration: 0.01 })));
  c.show(1, [view3d, eqLora]);
  orbitScene(
    s,
    c,
    view3d,
    { theta: -0.18, phi: 0.92 },
    { startOffset: Math.max(0.2, c.beats[1].start - c.start + 0.1), endMargin: 0.55 },
  );
  c.on('base-frozen', () => s.play(frozenLora.to(1, { duration: 0.5 })));
  c.on('objective-surface-b2', () => s.play(qlora4bit.to(1, { duration: 0.5 })));
  c.on('objective-surface-b3', () =>
    s.play(showStudy.to(1, { duration: remainDuration(c, 'objective-surface-b3', 0.55) })),
  );
}
