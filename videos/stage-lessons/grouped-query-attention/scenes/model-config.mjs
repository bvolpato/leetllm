// Scene 09: model-config - Llama 3.1 head ratios + Gemma 2 alternating retention vs Mistral 7B v0.3.
import {
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  range,
  rect,
  rule,
  runPhase,
  txt,
} from '../parts.mjs';

export default function modelConfig(s, c) {
  const phase = s.value(0);
  const showCounts = s.value(0);
  const showRatios = s.value(0);
  const showContext = s.value(0);
  const showGemma = s.value(0);
  const showMistral = s.value(0);
  const footStage = s.value(0); // 0=none, 1=context, 2=sum, 3=learned, 4=test

  const title = heroTitle(['Read the checkpoint', 'before sizing cache'], {
    x: -855,
    y: -445,
    size: 50,
    lineHeight: 58,
    accent: ROLE.query,
    eyebrow: 'REAL-WORLD ARCHITECTURES · RETENTION RULES',
  });

  const live = guardedDynamic(1, () => {
    const cnt = showCounts.value;
    const rat = showRatios.value;
    const ctx = showContext.value;
    const gem = showGemma.value;
    const mis = showMistral.value;
    const fs = Math.round(footStage.value);

    const nodes = [
      rule(15, -315, 15, 390, COSMOS.rule, 1.6).opacity(0.6),
      txt('LLAMA 3.1 FAMILY · ALL 8 KV HEADS', -855, -265, 26, COSMOS.muted, 'mono', 'left'),
    ];

    // Left: Llama 3.1 8B / 70B / 405B query head scaling bars
    const llamaRows = [
      { name: '8B', q: 32, kv: 8, y: -155, col: ROLE.key },
      { name: '70B', q: 64, kv: 8, y: -10, col: ROLE.query },
      { name: '405B', q: 128, kv: 8, y: 135, col: ROLE.gold },
    ];
    const barLeft = -855;
    const barW = 790;
    const barH = 38;

    for (const r of llamaRows) {
      const ratio = r.q / r.kv;
      const headText =
        rat > 0.5
          ? `${r.name}   ·   ${r.q} Q / ${r.kv} KV   (${ratio}:1 sharing)`
          : cnt > 0.5
            ? `${r.name}   ·   ${r.q} query heads / ${r.kv} KV`
            : `Llama 3.1 ${r.name}`;
      nodes.push(
        txt(headText, barLeft, r.y - 46, 30, cnt > 0.5 ? r.col : COSMOS.ink, 'mono', 'left'),
        rect(barW, barH, { fill: '#0d1527', stroke: '#27375c', width: 1.6, radius: 6 }).at(
          barLeft + barW / 2,
          r.y,
        ),
      );
      const w = (r.q / 128) * barW * cnt;
      if (w > 4) {
        nodes.push(
          lumBar(barLeft + w / 2, r.y, w, barH - 4, {
            color: r.col,
            fillOpacity: 0.48,
            strokeWidth: 2,
            glow: 7,
            radius: 5,
          }),
        );
      }
    }

    // Llama 3.1 vs Llama 3 context comparison beneath left bars
    if (ctx > 0.02) {
      nodes.push(
        txt('Llama 3.1: 128K context', barLeft, 265, 30, ROLE.value, 'mono', 'left')
          .glow(6, ROLE.value)
          .opacity(ctx),
        txt(
          'Llama 3 (Apr 2024): 8K context',
          barLeft,
          316,
          28,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(ctx),
      );
    }

    // --- RIGHT: Per-Layer Retention Profiles (Gemma 2 alternating wave + Mistral 7B v0.3) ---
    const rx = 85;
    nodes.push(
      txt('RETAINED POSITIONS PER LAYER', rx, -265, 26, COSMOS.muted, 'mono', 'left'),
      txt('Gemma 2: alternating 4K local / 8K global', rx, -205, 30, ROLE.key, 'sans', 'left'),
    );

    // 8 alternating vertical layer retention pillars for Gemma 2
    const waveBaseY = 45;
    const maxH = 195;
    const colW = 72;
    const colGap = 24;
    for (const l of range(8)) {
      const isGlobal = l % 2 === 1;
      const h = (isGlobal ? maxH : maxH * 0.5) * gem;
      const cx = rx + 42 + l * (colW + colGap);
      const col = isGlobal ? ROLE.query : ROLE.pos;
      nodes.push(
        rect(colW, maxH, { fill: '#0c1324', stroke: '#223052', width: 1.4, radius: 5 }).at(
          cx,
          waveBaseY - maxH / 2,
        ),
        txt(`L${l}`, cx, waveBaseY + 30, 26, COSMOS.dim, 'mono', 'center'),
      );
      if (h > 4) {
        nodes.push(
          lumBar(cx, waveBaseY - h / 2, colW - 6, h, {
            color: col,
            fillOpacity: 0.5,
            strokeWidth: 2,
            glow: 7,
            radius: 5,
          }),
          txt(isGlobal ? '8K' : '4K', cx, waveBaseY - h - 24, 26, col, 'mono', 'center').opacity(
            gem,
          ),
        );
      }
    }

    // Mistral 7B v0.3 full retention bar
    if (mis > 0.02) {
      nodes.push(
        txt(
          'Mistral 7B v0.3: full 32K global (no sliding window)',
          rx,
          145,
          28,
          ROLE.value,
          'sans',
          'left',
        ).opacity(mis),
        lumBar(rx + 375, 200, 750 * mis, 34, {
          color: ROLE.value,
          fillOpacity: 0.45,
          strokeWidth: 2.2,
          glow: 8,
          radius: 6,
          opacity: mis,
        }),
      );
    }

    // Needle-in-haystack retrieval strip on 'test'
    if (fs === 4) {
      const p = (phase.value * 0.25) % 1;
      const needleX = rx + 70 + p * 600;
      nodes.push(
        txt('RETRIEVAL CHECK: MOVE FACT ACROSS PROMPT', rx, 278, 26, ROLE.gold, 'mono', 'left'),
        rect(750, 28, { fill: '#111a30', stroke: '#334875', width: 1.8, radius: 6 }).at(
          rx + 375,
          326,
        ),
        glowDot(needleX, 326, { radius: 9, color: ROLE.gold, glow: 14 }),
      );
    }

    // Floating footer caption
    const footMap = [
      '',
      'Always verify both head counts and supported context length in config.json',
      'Total KV cache = sum of retained positions across every layer',
      'Checkpoint weights fix the learned K/V head count',
      'Test retrieval quality at multiple fact depths and prompt lengths',
    ];
    if (fs > 0) {
      nodes.push(
        txt(footMap[fs], 0, 444, 28, fs === 4 ? ROLE.gold : COSMOS.muted, 'sans', 'center'),
      );
    }

    return group(...nodes);
  });

  s.add(cinemaAtmosphere(ROLE.query, ROLE.pos), title, live);
  runPhase(s, c, phase, 14);

  playCue(s, c, 'counts', (d) => s.play(showCounts.to(1, { duration: d })), {
    after: true,
    dur: 0.65,
  });
  playCue(s, c, 'ratios', (d) => s.play(showRatios.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(
    s,
    c,
    'context',
    (d) => s.play(showContext.to(1, { duration: d }), footStage.to(1, { duration: 0.2 })),
    { after: true, dur: 0.45 },
  );
  playCue(s, c, 'gemma', (d) => s.play(showGemma.to(1, { duration: d })), {
    after: true,
    dur: 0.65,
  });
  playCue(s, c, 'mistral', (d) => s.play(showMistral.to(1, { duration: d })), {
    after: true,
    dur: 0.55,
  });
  playCue(s, c, 'sum', (d) => s.play(footStage.to(2, { duration: Math.min(0.25, d) })), {
    dur: 0.3,
  });
  playCue(s, c, 'learned', (d) => s.play(footStage.to(3, { duration: Math.min(0.25, d) })), {
    dur: 0.3,
  });
  playCue(s, c, 'test', (d) => s.play(footStage.to(4, { duration: Math.min(0.25, d) })), {
    dur: 0.3,
  });
}
