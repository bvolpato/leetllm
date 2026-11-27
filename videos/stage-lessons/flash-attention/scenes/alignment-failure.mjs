// Scene 27: Which keys did this call average?: PyTorch upper-left causal mask bug (10) vs absolute mask repair (37.5).
import {
  ALIGN_ABS,
  ALIGN_UPPER,
  ALIGN_VALUES,
  COSMOS,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function alignmentFailure(s, c) {
  const phase = s.value(0);
  const showTen = s.value(0);
  const revealUpper = s.value(0);
  const showAbsolute = s.value(0);
  const reveal375 = s.value(0);
  const showOpen = s.value(0);
  const showMaskRule = s.value(0);
  const showDrop0 = s.value(0);
  const showBottomRight = s.value(0);

  const bgAura = aura(0, 20, 560, '#ff6b8b20', '#5ce1e616');
  const title = heroTitle(['Decode Mask', 'Alignment Bug'], {
    x: -855,
    y: -410,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.rose,
    eyebrow: 'QUERY AT POS 3 · 4 VALID CACHE KEYS',
  });

  const live = guardedDynamic(1, () => {
    const ten = showTen.value;
    const up = revealUpper.value;
    const abs = showAbsolute.value;
    const r375 = reveal375.value;
    const opn = showOpen.value;
    const mr = showMaskRule.value;
    const d0 = showDrop0.value;
    const br = showBottomRight.value;

    const usingAbs = abs > 0.5;
    const row = usingAbs ? ALIGN_ABS : ALIGN_UPPER;
    const maskKnown = up > 0.5 || usingAbs;

    const nodes = [
      txt('ALL SCORES = 0  ·  QUERY AT ABSOLUTE POS 3', 310, -355, 26, COSMOS.gold, 'mono').glow(
        5,
        COSMOS.gold,
      ),
    ];

    // 4 cached key columns
    for (let i = 0; i < 4; i++) {
      const cx = -510 + i * 340;
      const allowed = row.allowed[i];
      const active = !maskKnown || allowed;
      const col = !maskKnown
        ? COSMOS.cyan
        : allowed
          ? usingAbs
            ? COSMOS.emerald
            : COSMOS.rose
          : COSMOS.dim;

      nodes.push(
        txt(`pos ${i}`, cx, -210, 28, col, 'mono'),
        glassCell(cx, -110, 265, 118, col, {
          fill: active ? '#111d30' : '#0c0f1c',
          glow: active ? 8 : 0,
        }),
        txt(`v = ${ALIGN_VALUES[i]}`, cx, -110, 40, active ? COSMOS.ink : COSMOS.dim, 'mono'),
      );

      if (maskKnown) {
        nodes.push(
          txt(allowed ? 'ADMITTED' : 'MASKED OUT', cx, -12, 26, col, 'mono'),
          txt(
            allowed ? (usingAbs ? 'weight = 1/4' : 'weight = 1') : 'weight = 0',
            cx,
            36,
            26,
            allowed ? COSMOS.gold : COSMOS.dim,
            'mono',
          ),
        );
      }
    }

    // PyTorch SDPA call bar
    const callArg =
      opn > 0.5 ? 'is_causal=False' : usingAbs ? 'attn_mask=allowed' : 'is_causal=True';
    const dropTxt = d0 > 0.5 ? ', dropout_p=0.0  ← ALWAYS 0 IN INFERENCE' : ', dropout_p=0.0';
    nodes.push(
      glassCell(0, 155, 1660, 92, usingAbs ? COSMOS.emerald : COSMOS.rose, {
        fill: '#101628',
        glow: 8,
      }),
      txt(
        `F.scaled_dot_product_attention(q, k, v, ${callArg}${dropTxt})`,
        0,
        155,
        28,
        COSMOS.ink,
        'mono',
      ),
    );

    // Output readout (withholds "Just col 0" during beat 0 question!)
    const outCol = r375 > 0.5 ? COSMOS.emerald : COSMOS.rose;
    const outMsg =
      r375 > 0.5
        ? `Absolute mask output = ${ALIGN_ABS.output.toFixed(1)}  (all 4 keys)`
        : usingAbs
          ? 'Comparing keys to absolute query pos 3...'
          : up > 0.5
            ? `Upper-left causal mask read ONLY pos 0 → ${ALIGN_UPPER.output}`
            : ten > 0.5
              ? `Returns ${ALIGN_UPPER.output}: which of the 4 keys did it average?`
              : 'Output = ?';
    nodes.push(
      glassCell(0, 295, 1340, 108, outCol, { fill: '#121728', glow: 10 }),
      txt(outMsg, 0, 295, 34, outCol, 'mono').glow(6, outCol),
    );

    // Footer contract note
    if (mr > 0.02 || br > 0.02) {
      const note =
        br > 0.5
          ? 'FlashAttention v2.1+ uses bottom-right alignment · verify outputs before timing'
          : 'SDPA attn_mask: True admits key   ·   MHA key_padding_mask: True excludes key';
      nodes.push(
        rect(1580, 56, { fill: '#10182b', stroke: COSMOS.cyan, width: 1.6, radius: 8 })
          .at(0, 405)
          .opacity(0.9),
        txt(note, 0, 405, 26, COSMOS.cyan, 'mono').opacity(Math.max(mr, br)),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('cache-inputs', () => s.play(phase.to(2, { duration: 0.35 })));
  c.on('ten-returned', () => s.play(showTen.to(1, { duration: 0.4 })));
  c.on('upper-corner', () => s.play(revealUpper.to(1, { duration: 0.45 })));
  c.on('match-absolute', () => s.play(showAbsolute.to(1, { duration: 0.45 })));
  c.after('fa-absolute-repair', () => s.play(reveal375.to(1, { duration: 0.45 })));
  c.on('valid-here', () => s.play(showOpen.to(1, { duration: 0.4 })));
  c.on('mask-contract', () => s.play(showMaskRule.to(1, { duration: 0.4 })));
  c.on('zero-dropout', () => s.play(showDrop0.to(1, { duration: 0.4 })));
  c.on('package-alignment', () =>
    s.play(showBottomRight.to(1, { duration: remainDuration(c, 'package-alignment', 0.45) })),
  );
}
