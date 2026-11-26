// Scene 18: Would you train on this batch? (Final transfer: future probe + shifted label repair)
import {
  COSMOS,
  PROBE_CHANGED,
  PROBE_ORIG,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function changedContract(s, c) {
  const phase = s.value(0);
  const changedFuture = s.value(0);
  const showDelta = s.value(0);
  const showPrefix = s.value(0);
  const showInvariant = s.value(0);
  const showCopyBug = s.value(0);
  const slideFixed = s.value(0);
  const showLastPair = s.value(0);

  const bgAura = aura(0, 20, 640, '#18346628', '#2f1e5614');
  const title = heroTitle(['Would You Train', 'on This Batch?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'FRESH 16-TOKEN VOCABULARY · MASK vs SHIFT AUDIT',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const cf = changedFuture.value;
    const sd = showDelta.value;
    const sp = showPrefix.value;
    const si = showInvariant.value;
    const sc = showCopyBug.value;
    const sf = slideFixed.value;
    const sl = showLastPair.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const source = [2, 5, 8, 9, 12];
    const tileW = 166;
    const gap = 22;
    const stride = tileW + gap;
    const x0 = -740;
    const srcY = -162;
    const inpY = 12;
    const lblY = 198;

    const delta = Math.max(
      ...PROBE_ORIG.rows
        .slice(0, 3)
        .flatMap((r, i) => r.logits.map((v, j) => Math.abs(v - PROBE_CHANGED.rows[i].logits[j]))),
    );

    const nodes = [
      txt('FROZEN SOURCE (5 LOCAL IDs)', -855, srcY - 70, 26, COSMOS.muted, 'mono', 'left'),
      txt(
        cf > 0.5 ? 'DISPOSABLE INPUT COPY (9 -> 14)' : 'MODEL INPUTS  x[0..3]',
        -855,
        inpY - 74,
        26,
        cf > 0.5 ? COSMOS.amber : COSMOS.cyan,
        'mono',
        'left',
      ),
      txt(
        sf > 0.5 ? 'FIXED SHIFTED LABELS  y = source[1..4]' : 'LOADER LABELS  (INSPECT!)',
        -855,
        lblY + 78,
        26,
        sf > 0.5 ? COSMOS.emerald : sc > 0.5 ? COSMOS.rose : COSMOS.gold,
        'mono',
        'left',
      ),
    ];

    // Row 1: Frozen source [2, 5, 8, 9, 12]
    source.forEach((id, i) => {
      const cx = x0 + i * stride;
      const isNine = i === 3 && sf > 0.5;
      const isTwelve = i === 4 && sl > 0.5;
      const stroke = isNine || isTwelve ? COSMOS.emerald : COSMOS.dim;
      nodes.push(
        glassCell(cx, srcY, tileW, 74, stroke, {
          fill: isNine || isTwelve ? '#0d2623' : '#0e1322',
          glow: isNine || isTwelve ? 8 * pulse : 2,
        }),
        txt(String(id), cx, srcY + 2, 34, stroke, 'mono'),
      );
    });

    // Row 2: Model inputs (pos 3 mutates 9 -> 14 on probe, restores to 9 on lastPair)
    for (let i = 0; i < 4; i++) {
      const cx = x0 + i * stride;
      const val = i === 3 && cf > 0.5 && sl < 0.5 ? 14 : source[i];
      const isPos2 = i === 2;
      const isMutated = i === 3 && cf > 0.5 && sl < 0.5;
      const isLastOrigin = i === 3 && sl > 0.5;
      const stroke = isLastOrigin
        ? COSMOS.emerald
        : isMutated
          ? COSMOS.amber
          : isPos2
            ? COSMOS.gold
            : COSMOS.cyan;
      nodes.push(
        glassCell(cx, inpY, tileW, 82, stroke, {
          fill: isMutated ? '#281910' : isPos2 ? '#251e0e' : '#102138',
          glow: isPos2 || isMutated || isLastOrigin ? 9 * pulse : 4,
        }),
        txt(String(val), cx, inpY + 2, 36, stroke, 'mono'),
      );
    }

    // Causal bracket for pos 2 (readable prefix [2, 5, 8]) revealed on answer-prefix
    if (sp > 0.05) {
      const bL = x0 - tileW * 0.5 - 10;
      const bR = x0 + 2 * stride + tileW * 0.5 + 10;
      nodes.push(
        line([bL, inpY + 50], [bL, inpY + 62], { stroke: COSMOS.emerald, width: 3.4 }).opacity(sp),
        line([bL, inpY + 62], [bR, inpY + 62], { stroke: COSMOS.emerald, width: 3.4 })
          .glow(8, COSMOS.emerald)
          .opacity(sp),
        line([bR, inpY + 62], [bR, inpY + 50], { stroke: COSMOS.emerald, width: 3.4 }).opacity(sp),
      );
    }

    // Row 3: Loader labels (buggy [2, 5, 8, 9] sliding cleanly left to [5, 8, 9, 12] on slideFixed!)
    for (let i = 0; i < 5; i++) {
      const cx = x0 + (i - sf) * stride;
      const alpha = i === 0 ? Math.max(0, 1 - sf * 2.2) : i === 4 ? Math.min(1, sf * 1.4) : 1;
      if (alpha < 0.03) continue;
      const isBugEight = i === 2 && sc > 0.5 && sf < 0.5;
      const isFixedNine = i === 3 && sf > 0.5;
      const isFixedTwelve = i === 4 && sl > 0.5;
      const stroke =
        isFixedTwelve || isFixedNine
          ? COSMOS.emerald
          : isBugEight
            ? COSMOS.rose
            : sf > 0.5
              ? COSMOS.emerald
              : COSMOS.dim;
      nodes.push(
        glassCell(cx, lblY, tileW, 82, stroke, {
          fill: isBugEight ? '#2b1018' : sf > 0.5 ? '#0d2623' : '#121626',
          glow: isBugEight || isFixedNine || isFixedTwelve ? 10 * pulse : 2,
          opacity: alpha,
        }),
        txt(String(source[i]), cx, lblY + 2, 36, stroke, 'mono').opacity(alpha),
      );
    }

    // Supervision arrow at pos 2 (8 -> 8 bug vs 8 -> 9 fix) and pos 3 (9 -> 12)
    if (sc > 0.05 && sf < 0.5) {
      const x2 = x0 + 2 * stride;
      nodes.push(
        glowingArc([x2, inpY + 46], [x2, lblY - 46], 0, {
          color: COSMOS.rose,
          width: 4.2,
          opacity: sc,
        }),
        glowDot(x2, lblY - 48, { radius: 6, color: COSMOS.rose, opacity: sc }),
      );
    }
    if (sf > 0.5) {
      const x2 = x0 + 2 * stride;
      nodes.push(
        glowingArc([x2, inpY + 46], [x2, lblY - 46], 0, { color: COSMOS.emerald, width: 4.2 }),
        glowDot(x2, lblY - 48, { radius: 6, color: COSMOS.emerald }),
      );
    }
    if (sl > 0.2) {
      const x3 = x0 + 3 * stride;
      nodes.push(
        glowingArc([x3, inpY + 46], [x3, lblY - 46], 0, {
          color: COSMOS.emerald,
          width: 4.4,
          opacity: sl,
        }),
        glowDot(x3, lblY - 48, { radius: 6, color: COSMOS.emerald, opacity: sl }),
      );
    }

    // Right column: Live causal invariance readout & verdict (pre-framed with "?" before cues so answer stays strictly withheld!)
    const rx = 580;
    const probeReady = sd > 0.05;
    nodes.push(
      txt('PREFIX PROBE (POS 0..2)', rx, -195, 26, COSMOS.cyan, 'mono').opacity(
        probeReady ? sd : 0.85,
      ),
      glassCell(rx, -100, 500, 108, probeReady ? COSMOS.emerald : COSMOS.muted, {
        fill: probeReady ? '#0e2524' : '#12182b',
        glow: probeReady ? 8 : 2,
        opacity: probeReady ? sd : 0.82,
      }),
      txt(
        probeReady ? `max |Δ logits| = ${delta.toFixed(3)}` : 'max |Δ logits| = ?',
        rx,
        -98,
        36,
        probeReady ? COSMOS.emerald : COSMOS.gold,
        'mono',
      )
        .glow(probeReady ? 7 : 3, probeReady ? COSMOS.emerald : COSMOS.gold)
        .opacity(probeReady ? sd : 0.88),
      glassCell(rx, 86, 520, 186, si > 0.05 || sc > 0.05 || sf > 0.5 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#101628',
        glow: 2,
        opacity: 0.78,
      }),
      txt(
        si > 0.05 ? 'Causal mask: PASS' : 'Causal mask: ?',
        rx,
        28,
        30,
        si > 0.05 ? COSMOS.emerald : COSMOS.muted,
        'mono',
      ).opacity(si > 0.05 ? si : 0.82),
      txt(
        sf > 0.5
          ? 'Shifted fix:  8 -> 9'
          : sc > 0.05
            ? 'Labels: FAIL (8 -> 8)'
            : 'Labels: ? (check pos 2)',
        rx,
        92,
        30,
        sf > 0.5 ? COSMOS.emerald : sc > 0.05 ? COSMOS.rose : COSMOS.muted,
        'mono',
      ).opacity(sf > 0.5 ? 1 : sc > 0.05 ? sc : 0.82),
      txt(
        sl > 0.2 ? 'Last pair:    9 -> 12' : 'Last pair:    9 -> ?',
        rx,
        150,
        30,
        sl > 0.2 ? COSMOS.gold : COSMOS.muted,
        'mono',
      ).opacity(sl > 0.2 ? sl : 0.78),
    );

    if (sl > 0.2) {
      nodes.push(
        txt(
          'Keep the causal mask + train on shifted labels y = source[1..4]',
          0,
          348,
          32,
          COSMOS.emerald,
          'sans',
        )
          .glow(6, COSMOS.emerald)
          .opacity(sl),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('future-input-change', () => s.play(changedFuture.to(1, { duration: 0.55 })));
  c.on('compare-probe', () => s.play(showDelta.to(1, { duration: 0.5 })));
  c.on('answer-prefix', () => s.play(showPrefix.to(1, { duration: 0.45 })));
  c.on('answer-invariant', () => s.play(showInvariant.to(1, { duration: 0.45 })));
  c.on('answer-copy', () => s.play(showCopyBug.to(1, { duration: 0.45 })));
  c.after('answer-target', () =>
    s.play(slideFixed.to(1, { duration: remainDuration(c, 'answer-target', 0.75) })),
  );
  c.after('last-label', () =>
    s.play(showLastPair.to(1, { duration: remainDuration(c, 'last-label', 0.45) })),
  );
}
