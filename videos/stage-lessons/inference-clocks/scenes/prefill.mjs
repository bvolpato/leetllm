// Scene 02: prefill: 4 prompt tokens share a causal lower-triangular grid -> fill 4 KV cache rows -> emit "at".
import {
  COSMOS,
  ROLE,
  aura,
  bindCueBeat,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  outputs,
  playCue,
  prompt,
  rect,
  txt,
} from '../parts.mjs';

export default function prefill(s, c) {
  const showCausal = s.value(0);
  const showCache = s.value(0);
  const showFirstOut = s.value(0);

  const bgAura = aura(0, 0, 740, '#16355e28', '#103c3618');
  const title = heroTitle(['Inside Reply A:', 'parallel prefill'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: ROLE.prefill,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const cs = showCausal.value;
    const kv = showCache.value;
    const out = showFirstOut.value;
    const nodes = [];

    // Left: 4x4 causal attention grid for ["The", "birds", "sing", "softly"]
    const gx0 = -640;
    const gy0 = -170;
    const cell = 104;
    nodes.push(
      txt(
        'CAUSAL PREFILL GRID (4 × 4)',
        gx0 + 150,
        gy0 - 80,
        26,
        ROLE.prefill,
        'mono',
        'center',
      ).opacity(alpha),
    );
    prompt.forEach((word, row) => {
      nodes.push(
        txt(word, gx0 - 115, gy0 + row * cell, 26, COSMOS.ink, 'mono', 'center').opacity(alpha),
      );
      prompt.forEach((_, col) => {
        const visible = col <= row;
        const focusBirds = cs > 0.3 && row === 1 && visible;
        const colStroke = !visible ? COSMOS.rule : focusBirds ? ROLE.wait : ROLE.prefill;
        const fill = !visible ? '#0d1222' : focusBirds ? '#2f2914' : '#132445';
        nodes.push(
          rect(88, 84, { fill, stroke: colStroke, width: focusBirds ? 3.2 : 2, radius: 10 })
            .at(gx0 + col * cell, gy0 + row * cell)
            .glow(focusBirds ? 10 : visible ? 4 : 0, colStroke)
            .opacity((visible ? 0.95 : 0.35) * alpha),
          txt(
            visible ? '✓' : '×',
            gx0 + col * cell,
            gy0 + row * cell,
            28,
            visible ? colStroke : COSMOS.dim,
            'mono',
            'center',
          ).opacity(alpha),
        );
      });
    });

    // Right: KV Cache stack (4 prompt rows inside, emitted "at" outside!)
    const rx = 250;
    nodes.push(
      txt('KV CACHE (4 PROMPT ROWS)', rx + 180, -250, 26, ROLE.clockA, 'mono', 'center').opacity(
        alpha,
      ),
    );
    prompt.forEach((word, idx) => {
      const y = -165 + idx * 88;
      const active = kv > 0.2;
      nodes.push(
        chipPill(`Row ${idx}: K,V("${word}")`, rx + 180, y, {
          w: 440,
          h: 70,
          color: active ? ROLE.clockA : COSMOS.rule,
          size: 28,
          glow: active ? 10 : 0,
          opacity: (0.35 + 0.65 * kv) * alpha,
        }),
      );
    });

    if (out > 0.05) {
      nodes.push(
        txt(
          'OUTSIDE CACHE (EMITTED AT 320 ms)',
          rx + 180,
          220,
          26,
          ROLE.wait,
          'mono',
          'center',
        ).opacity(out * alpha),
        chipPill(`T1 = "${outputs[0]}"`, rx + 180, 295, {
          w: 280,
          h: 74,
          color: ROLE.wait,
          size: 34,
          glow: 14,
          opacity: out * alpha,
        }),
      );
    }

    nodes.push(
      txt(
        out > 0.5
          ? '4 prompt rows cached; "at" enters the KV cache only on decode step 1'
          : 'All 4 prompt tokens project in parallel before emitting T1',
        -855,
        365,
        28,
        out > 0.5 ? ROLE.wait : COSMOS.muted,
        'sans',
        'left',
      ).opacity(alpha),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'causal-visibility', (d) => s.play(showCausal.to(1, { duration: d })), {
    dur: 0.45,
  });
  playCue(s, c, 'prompt-kv', (d) => s.play(showCache.to(1, { duration: d })), { dur: 0.55 });
  playCue(s, c, 'first-prediction', (d) => s.play(showFirstOut.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  bindCueBeat(s, c, s.value(0), ['known-prompt', 'four-consumed', 'emitted-not-consumed']);
}
