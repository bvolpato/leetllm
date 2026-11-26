// Scene 19: batch-boundaries: "Does changing the filler change the readout?"
// View 1: Batched incidents A (len 3) & B (len 2) showing unpacked drift on zero vs junk fillers
//         compared against packed invariance locked to B alone ([0.494, 0.641]).
// View 2: Independent incident boundary: Reset (old h = 0 -> 0.310) vs Reuse/Detach (0.764 -> 0.606).
import {
  COSMOS,
  MODEL,
  ROLE,
  cinemaAtmosphere,
  fmt,
  glowArc,
  glowRing,
  guardedDynamic,
  heroTitle,
  lumBar,
  padded,
  playCue,
  scalar,
  states,
  swapVis,
  tokenPill,
  txt,
  vecStr,
} from '../parts.mjs';

export default function batchBoundaries(s, c) {
  const vPack = s.value(1);
  const vReset = s.value(0);

  // View 1 state
  const showZeroCol = s.value(0);
  const showZeroRes = s.value(0);
  const showJunkCol = s.value(0);
  const showJunkRes = s.value(0);
  const showPacked = s.value(0);
  const showPackedVals = s.value(0);
  const showActive = s.value(0);

  // View 2 state
  const showAfter = s.value(0);
  const showDetachNote = s.value(0);

  const packView = guardedDynamic(vPack, (alpha) => {
    const isPacked = showPacked.value > 0.5;
    const nodes = [
      heroTitle(['Does changing the filler', 'change the readout?'], {
        x: -850,
        y: -435,
        size: 46,
        lineHeight: 54,
        accent: ROLE.warn,
      }).opacity(alpha),
    ];

    // Top batch lanes (A len 3, B len 2)
    const slotXs = [-310, 80, 470];
    const yA = -215;
    const yB = -130;
    nodes.push(
      txt('Seq A (len 3)', -735, yA, 28, ROLE.state, 'mono', 'left').opacity(alpha),
      tokenPill('error', slotXs[0], yA, ROLE.input, { w: 220, h: 48, size: 26, opacity: alpha }),
      tokenPill('reproduction', slotXs[1], yA, ROLE.input, {
        w: 250,
        h: 48,
        size: 26,
        opacity: alpha,
      }),
      tokenPill('rollback', slotXs[2], yA, ROLE.cell, { w: 220, h: 48, size: 26, opacity: alpha }),
      txt('Seq B (len 2)', -735, yB, 28, ROLE.gold, 'mono', 'left').opacity(alpha),
      tokenPill('error', slotXs[0], yB, ROLE.input, { w: 220, h: 48, size: 26, opacity: alpha }),
      tokenPill('reproduction', slotXs[1], yB, ROLE.input, {
        w: 250,
        h: 48,
        size: 26,
        opacity: alpha,
      }),
    );
    if (!isPacked) {
      nodes.push(
        tokenPill('filler slot', slotXs[2], yB, COSMOS.dim, {
          w: 220,
          h: 48,
          size: 26,
          dash: [8, 6],
          opacity: alpha,
        }),
      );
    } else {
      nodes.push(txt('packed stop', slotXs[2], yB, 26, ROLE.cell, 'mono', 'center').opacity(alpha));
    }

    // Comparison readout lanes below (clean visual badges, no prose table)
    const xCol1 = -85;
    const xCol2 = 435;
    const yHead = 10;
    const yRun = 120;
    const yPack = 235;

    if (showZeroCol.value > 0.02) {
      nodes.push(
        tokenPill('x = [0, 0, 0]', xCol1, yHead, COSMOS.dim, {
          w: 260,
          h: 48,
          size: 27,
          font: 'mono',
          opacity: showZeroCol.value * alpha,
        }),
        txt('Run all slots', -735, yRun, 30, ROLE.warn, 'serif', 'left').opacity(
          showZeroCol.value * alpha,
        ),
      );
    }
    if (showZeroRes.value > 0.02) {
      nodes.push(
        lumBar(xCol1, yRun, 310, 68, {
          color: ROLE.warn,
          fillOpacity: 0.25,
          glow: 8,
          opacity: showZeroRes.value * alpha,
        }),
        txt(vecStr(padded, 3), xCol1, yRun, 34, ROLE.warn, 'mono', 'center').opacity(
          showZeroRes.value * alpha,
        ),
      );
    }

    if (showJunkCol.value > 0.02) {
      nodes.push(
        tokenPill('x = [9, −9, 9]', xCol2, yHead, ROLE.amber, {
          w: 280,
          h: 48,
          size: 27,
          font: 'mono',
          opacity: showJunkCol.value * alpha,
        }),
      );
    }
    if (showJunkRes.value > 0.02) {
      nodes.push(
        lumBar(xCol2, yRun, 310, 68, {
          color: ROLE.amber,
          fillOpacity: 0.28,
          glow: 9,
          opacity: showJunkRes.value * alpha,
        }),
        txt(vecStr(MODEL.junk, 3), xCol2, yRun, 34, ROLE.amber, 'mono', 'center').opacity(
          showJunkRes.value * alpha,
        ),
      );
    }

    if (showPacked.value > 0.02) {
      nodes.push(
        txt('Pack by length', -735, yPack, 30, ROLE.cell, 'serif', 'left').opacity(
          showPacked.value * alpha,
        ),
      );
    }
    if (showPackedVals.value > 0.02) {
      [xCol1, xCol2].forEach((cx) => {
        nodes.push(
          lumBar(cx, yPack, 310, 68, {
            color: ROLE.cell,
            fillOpacity: 0.3,
            glow: 10,
            opacity: showPackedVals.value * alpha,
          }),
          txt(vecStr(states[2], 3), cx, yPack, 34, ROLE.cell, 'mono', 'center').opacity(
            showPackedVals.value * alpha,
          ),
        );
      });
    }

    // Bottom reference vs active-rows indicator (mutually exclusive)
    if (showActive.value < 0.02) {
      nodes.push(
        txt(
          `Reference (B alone after reproduction):   ${vecStr(states[2], 3)}`,
          0,
          365,
          32,
          ROLE.state,
          'mono',
          'center',
        ).opacity((1 - showActive.value) * alpha),
      );
    } else {
      nodes.push(
        txt(
          'Active packed rows:   t₁: A + B     |     t₂: A + B     |     t₃: A only',
          0,
          365,
          30,
          ROLE.cell,
          'mono',
          'center',
        ).opacity(showActive.value * alpha),
      );
    }

    return nodes;
  });

  // VIEW 2: Independent incident reset vs reuse / detach
  const resetView = guardedDynamic(vReset, (alpha) => {
    const nodes = [
      heroTitle(['Independent sequences:', 'reset, never reuse'], {
        x: -850,
        y: -435,
        size: 46,
        lineHeight: 54,
        accent: ROLE.cell,
      }).opacity(alpha),
      txt(
        'New independent incident   (first event x₁ = 0.4)',
        0,
        -225,
        34,
        ROLE.gold,
        'mono',
        'center',
      ).opacity(alpha),
      glowRing(-600, 55, 96, ROLE.input, { width: 3.4, glow: 10, opacity: alpha }),
      txt('x₁ = 0.4', -600, 55, 30, COSMOS.ink, 'mono', 'center').opacity(alpha),
      // Upper clean Reset path
      glowArc([-500, 26], [-220, -65], -30, {
        color: ROLE.cell,
        width: 3.8,
        glow: 9,
        opacity: alpha,
      }),
      lumBar(-15, -65, 390, 74, { color: ROLE.cell, fillOpacity: 0.24, glow: 8, opacity: alpha }),
      txt('Reset: old h = 0.000', -15, -65, 30, ROLE.cell, 'mono', 'center').opacity(alpha),
      // Lower leaked Reuse / Detach path
      glowArc([-500, 84], [-220, 175], 30, {
        color: ROLE.warn,
        width: 3.8,
        glow: 9,
        opacity: alpha,
      }),
      lumBar(-15, 175, 390, 74, { color: ROLE.warn, fillOpacity: 0.24, glow: 8, opacity: alpha }),
      txt(
        `Reuse: old h ≈ ${fmt(scalar.at(-1), 3)}`,
        -15,
        175,
        30,
        ROLE.warn,
        'mono',
        'center',
      ).opacity(alpha),
    ];

    if (showAfter.value > 0.02) {
      const aA = showAfter.value * alpha;
      nodes.push(
        glowArc([185, -65], [295, -65], 0, { color: ROLE.cell, width: 3.6, glow: 8, opacity: aA }),
        lumBar(565, -65, 520, 78, { color: ROLE.cell, fillOpacity: 0.34, glow: 11, opacity: aA }),
        txt(
          `tanh(0.32) ≈ ${fmt(MODEL.resetNext, 3)}`,
          565,
          -65,
          30,
          ROLE.cell,
          'mono',
          'center',
        ).opacity(aA),
        glowArc([185, 175], [295, 175], 0, { color: ROLE.warn, width: 3.6, glow: 8, opacity: aA }),
        lumBar(565, 175, 520, 78, { color: ROLE.warn, fillOpacity: 0.34, glow: 11, opacity: aA }),
        txt(
          `tanh(0.32 + 0.382) ≈ ${fmt(MODEL.leakedNext, 3)}`,
          565,
          175,
          28,
          ROLE.warn,
          'mono',
          'center',
        ).opacity(aA),
      );
    }

    if (showDetachNote.value > 0.02) {
      nodes.push(
        txt(
          'detach() cuts gradients only; it still leaks the old value into the new incident',
          0,
          355,
          30,
          ROLE.gold,
          'sans',
          'center',
        ).opacity(showDetachNote.value * alpha),
      );
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.warn, ROLE.cell), packView, resetView);

  playCue(s, c, 'padding-zero', (d) => s.play(showZeroCol.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'zero-result', (d) => s.play(showZeroRes.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'padding-junk', (d) => s.play(showJunkCol.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'junk-result', (d) => s.play(showJunkRes.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'packing-prefixes', (d) => s.play(showPacked.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'padding-compare', (d) => s.play(showPackedVals.to(1, { duration: d })), {
    dur: 0.45,
  });
  playCue(s, c, 'active-rows', (d) => s.play(showActive.to(1, { duration: d })), { dur: 0.4 });

  playCue(s, c, 'batch-boundaries-2', (d) => s.play(swapVis(vPack, vReset, d)), { dur: 0.65 });
  playCue(s, c, 'boundary-reset', (d) => s.play(showAfter.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'boundary-detach', (d) => s.play(showDetachNote.to(1, { duration: d })), {
    dur: 0.45,
  });
}
