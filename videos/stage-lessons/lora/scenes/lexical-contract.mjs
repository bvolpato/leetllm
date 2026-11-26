// Scene 20: New token IDs need learned rows: Tokenizer growth -> resize before wrap -> train both input & untied lm_head rows -> reload check.
import {
  COSMOS,
  arrow,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function lexicalContract(s, c) {
  const phase = s.value(0);
  const showMismatch = s.value(0);
  const resized = s.value(0);
  const showUntied = s.value(0);
  const trainBoth = s.value(0);
  const showSelective = s.value(0);
  const showReload = s.value(0);

  const bgAura = aura(0, 20, 620, '#ff6b8b1e', '#6ee7b71a');
  const title = heroTitle(['New Token IDs', 'Need Learned Rows'], {
    x: -855,
    y: -420,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.emerald,
    eyebrow: 'VOCABULARY & EMBEDDING CONTRACT',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const rs = resized.value > 0.4;
    const tb = trainBoth.value > 0.4;
    const sel = showSelective.value > 0.4;
    const rel = showReload.value > 0.4;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      // Left: Tokenizer table (V + 2)
      glassCell(-585, -10, 470, 400, COSMOS.cyan, { fill: '#101d35', glow: 8 }),
      txt('TOKENIZER VOCAB', -585, -172, 26, COSMOS.cyan, 'mono'),
      txt('0 .. V − 1 (base)', -585, -90, 28, COSMOS.ink, 'mono'),
      rect(390, 56, { fill: '#2c2210', stroke: COSMOS.gold, width: 2.2, radius: 6 })
        .at(-585, 10)
        .glow(8, COSMOS.gold),
      txt('ID V  <policy_tag>', -585, 10, 26, COSMOS.gold, 'mono'),
      rect(390, 56, { fill: '#2c2210', stroke: COSMOS.gold, width: 2.2, radius: 6 })
        .at(-585, 86)
        .glow(8, COSMOS.gold),
      txt('ID V+1  <rotate>', -585, 86, 26, COSMOS.gold, 'mono'),
      txt(
        rs ? 'len(tokenizer) = V + 2' : 'V + 2 != model V!',
        -585,
        158,
        26,
        rs ? COSMOS.emerald : showMismatch.value > 0.2 ? COSMOS.rose : COSMOS.amber,
        'mono',
      ),

      arrow([-340, -10], [-235, -10], {
        stroke: rs ? COSMOS.emerald : COSMOS.rose,
        width: 4.5,
        tip: 13,
      }),

      // Center: Input Embedding table
      glassCell(15, -10, 475, 400, rs ? (tb ? COSMOS.emerald : COSMOS.amber) : COSMOS.rose, {
        fill: '#12192f',
        glow: tb ? 10 * pulse : 7,
      }),
      txt('INPUT EMBEDDINGS', 15, -172, 26, COSMOS.blue, 'mono'),
      rect(395, 128, { fill: '#142342', stroke: COSMOS.blue, width: 2, radius: 6 }).at(15, -66),
      txt('V frozen rows', 15, -66, 28, COSMOS.blue, 'mono'),
      rect(395, 114, {
        fill: !rs ? '#2a1220' : tb ? '#0e2829' : '#261e12',
        stroke: !rs ? COSMOS.rose : tb ? COSMOS.emerald : COSMOS.amber,
        width: 2.6,
        dash: !rs ? [8, 6] : undefined,
        radius: 6,
      })
        .at(15, 72)
        .glow(rs ? 9 : 4, !rs ? COSMOS.rose : tb ? COSMOS.emerald : COSMOS.amber),
      txt(
        !rs ? 'MISSING 2 ROWS!' : tb ? '2 NEW ROWS: TRAINED' : '2 new rows (frozen!)',
        15,
        72,
        26,
        !rs ? COSMOS.rose : tb ? COSMOS.emerald : COSMOS.amber,
        'mono',
      ),
      txt(
        rs ? 'Resized BEFORE wrapping' : 'resize_token_embeddings()',
        15,
        158,
        26,
        rs ? COSMOS.emerald : COSMOS.muted,
        'mono',
      ),

      arrow([262, -10], [368, -10], {
        stroke: showUntied.value > 0.2 ? COSMOS.gold : COSMOS.blue,
        width: 4.5,
        tip: 13,
      }),

      // Right: Untied lm_head output readout
      glassCell(
        615,
        -10,
        475,
        400,
        tb ? COSMOS.emerald : showUntied.value > 0.2 ? COSMOS.rose : COSMOS.blue,
        {
          fill: '#12192f',
          glow: tb ? 10 * pulse : 7,
        },
      ),
      txt('UNTIED LM_HEAD', 615, -172, 26, COSMOS.violet, 'mono'),
      rect(395, 128, { fill: '#191434', stroke: COSMOS.violet, width: 2, radius: 6 }).at(615, -66),
      txt('V frozen readout rows', 615, -66, 26, COSMOS.violet, 'mono'),
      rect(395, 114, {
        fill: tb ? '#0e2829' : '#261422',
        stroke: tb ? COSMOS.emerald : COSMOS.rose,
        width: 2.6,
        dash: !rs ? [8, 6] : undefined,
        radius: 6,
      })
        .at(615, 72)
        .glow(tb ? 9 : 5, tb ? COSMOS.emerald : COSMOS.rose),
      txt(
        !rs ? 'SIZE MISMATCH' : tb ? '2 OUTPUT ROWS: TRAINED' : 'all-linear skips this',
        615,
        72,
        26,
        tb ? COSMOS.emerald : COSMOS.rose,
        'mono',
      ),
      txt(
        tb ? 'Saved & tied/untied checked' : 'Input row alone != output logit',
        615,
        158,
        26,
        tb ? COSMOS.emerald : COSMOS.muted,
        'sans',
      ),

      // Bottom verification contract bar
      glassCell(0, 342, 1680, 134, rel ? COSMOS.emerald : sel ? COSMOS.gold : COSMOS.cyan, {
        fill: '#10182d',
        glow: rel ? 10 : 5,
      }),
      glowDot(-795, 342, { radius: 7, color: rel ? COSMOS.emerald : COSMOS.gold }),
      txt(
        rel
          ? 'VERIFY: trainable params + nonzero grads on new IDs -> save -> reload -> test generation'
          : sel
            ? 'Row-selective training avoids saving full embedding matrix (check PEFT version support)'
            : 'Attention-only LoRA cannot train frozen input embeddings or an untied output head',
        10,
        342,
        26,
        rel ? COSMOS.emerald : COSMOS.ink,
        'sans',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('lexical-contract-1', () => s.play(showMismatch.to(1, { duration: 0.4 })));
  c.on('lexical-resize', () => s.play(resized.to(1, { duration: 0.45 })));
  c.on('lexical-contract-2', () => s.play(showUntied.to(1, { duration: 0.4 })));
  c.on('lexical-both', () => s.play(trainBoth.to(1, { duration: 0.45 })));
  c.on('lexical-contract-3', () => s.play(showSelective.to(1, { duration: 0.4 })));
  c.on('lexical-reload', () =>
    s.play(showReload.to(1, { duration: remainDuration(c, 'lexical-reload', 0.45) })),
  );
}
