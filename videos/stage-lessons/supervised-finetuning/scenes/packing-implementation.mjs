// Scene 13: Can one packed example change the other?: Perturbation +100 test with strict prediction withholding.
import {
  COSMOS,
  PACK_GLOB_AFTER,
  PACK_GLOB_BEFORE,
  PACK_ISO_AFTER,
  PACK_ISO_BEFORE,
  PACK_ORIG_VALUES,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  packedAttention,
  remainDuration,
  runPhase,
  tokenPill,
  txt,
} from '../parts.mjs';

export default function packingImplementation(s, c) {
  const phase = s.value(0);
  const focusQ4 = s.value(0);
  const isoBeforeKnown = s.value(0);
  const globBeforeKnown = s.value(0);
  const perturbDelta = s.value(0); // 0 -> 100
  const isoAfterKnown = s.value(0);
  const globAfterKnown = s.value(0);
  const showDeltaMath = s.value(0);
  const showPackModes = s.value(0);

  const bgAura = aura(0, 30, 620, '#5ce1e61e', '#ffd16614');
  const title = heroTitle(['Attention Isolation', 'Perturbation Test'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.cyan,
    eyebrow: 'Q = K = 0 · UNIFORM WEIGHT OVER READABLE KEYS',
  });

  const colX = (i) => -445 + i * 192;
  const queryIdx = 4;

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const fq = focusQ4.value;
    const ib = isoBeforeKnown.value > 0.5;
    const gb = globBeforeKnown.value > 0.5;
    const delta = Math.round(perturbDelta.value);
    const ia = isoAfterKnown.value > 0.5;
    const ga = globAfterKnown.value > 0.5;
    const dm = showDeltaMath.value > 0.5;
    const pm = showPackModes.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.6);

    const curValues = PACK_ORIG_VALUES.map((v, i) => (i < 3 ? v + delta : v));
    const curIso = packedAttention(curValues, queryIdx, true);
    const curGlob = packedAttention(curValues, queryIdx, false);
    const wallX = (colX(2) + colX(3)) * 0.5;
    const perturbed = delta > 5;

    const nodes = [
      txt('EXAMPLE A (POS 0–2)', colX(1), -252, 26, perturbed ? COSMOS.amber : COSMOS.blue, 'mono'),
      txt('EXAMPLE B (POS 3–5)', colX(4), -252, 26, COSMOS.cyan, 'mono'),
      line([wallX, -258], [wallX, 240], { stroke: COSMOS.gold, width: 4, dash: [10, 6] }).glow(
        8,
        COSMOS.gold,
      ),
      txt('VALUES', -840, -145, 26, COSMOS.muted, 'mono', 'left'),
    ];

    // 6 live value cells
    curValues.forEach((v, i) => {
      const x = colX(i);
      const isA = i < 3;
      const isQ = i === queryIdx;
      const col =
        isQ && fq > 0.3
          ? COSMOS.gold
          : isA && perturbed
            ? COSMOS.amber
            : isA
              ? COSMOS.blue
              : COSMOS.cyan;
      nodes.push(
        tokenPill(String(v), x, -145, {
          w: 162,
          h: 82,
          color: col,
          fill: isA && perturbed ? '#261b10' : '#101a30',
          textColor: isA && perturbed ? COSMOS.amber : COSMOS.ink,
          glow: isQ || (isA && perturbed) ? 10 * pulse : 5,
          size: 34,
          index: isQ ? 'Q4' : `p${i}`,
          indexColor: isQ ? COSMOS.gold : COSMOS.muted,
          indexOffsetY: -72,
        }),
      );
    });

    // Dual lanes: Lane 0 = Isolated Block-Causal (÷2), Lane 1 = Global Causal (÷5)
    const lanes = [
      {
        name: 'ISOLATED',
        sub: 'Block-causal (÷ 2)',
        independent: true,
        y: 25,
        col: COSMOS.emerald,
        beforeStr: ib ? PACK_ISO_BEFORE.toFixed(1) : '?',
        afterStr: ia ? curIso.toFixed(1) : '?',
        changed: false,
      },
      {
        name: 'GLOBAL CAUSAL',
        sub: 'Leaks Ex A (÷ 5)',
        independent: false,
        y: 178,
        col: ga ? COSMOS.rose : COSMOS.blue,
        beforeStr: gb ? PACK_GLOB_BEFORE.toFixed(1) : '?',
        afterStr: ga ? curGlob.toFixed(1) : '?',
        changed: ga,
      },
    ];

    lanes.forEach((ln) => {
      nodes.push(
        txt(ln.name, -840, ln.y - 16, 28, ln.col, 'mono', 'left'),
        txt(ln.sub, -840, ln.y + 24, 26, COSMOS.muted, 'mono', 'left'),
      );
      curValues.forEach((v, i) => {
        const x = colX(i);
        const allowed = i <= queryIdx && (!ln.independent || i >= 3);
        const leaked = !ln.independent && i < 3;
        const cCol =
          leaked && ga
            ? COSMOS.rose
            : leaked && perturbed
              ? COSMOS.amber
              : allowed
                ? ln.col
                : COSMOS.dim;
        nodes.push(
          glassCell(x, ln.y, 152, 68, cCol, {
            fill: allowed
              ? leaked && ga
                ? '#26101b'
                : leaked && perturbed
                  ? '#241a10'
                  : '#0f1e2e'
              : '#0b0e19',
            dash: allowed ? undefined : [6, 5],
            glow: allowed ? 6 : 0,
            opacity: allowed ? 0.96 : 0.4,
          }),
          txt(allowed ? String(v) : '·', x, ln.y, 30, allowed ? COSMOS.ink : COSMOS.dim, 'mono'),
        );
      });

      // Right-hand output readout box (strictly withholding after-values during Beat 1!)
      const outLabel = perturbed ? `${ln.beforeStr} → ${ln.afterStr}` : ln.beforeStr;
      nodes.push(
        glassCell(755, ln.y, 260, 82, ln.col, {
          fill: ln.changed ? '#26101b' : '#10192b',
          glow: 9 * pulse,
        }),
        txt(outLabel, 755, ln.y, 32, ln.col, 'mono').glow(6, ln.col),
      );
    });

    // Bottom diagnostic footer
    let msg = 'Query 4 averages every key permitted by its attention mask';
    let msgCol = COSMOS.cyan;
    if (pm > 0.5) {
      msg =
        'Verify reset position_ids + no attention_mask + use_cache=False · Check join labels too';
      msgCol = COSMOS.cyan;
    } else if (dm) {
      msg = `Global sum grew by +300  →  +300 ÷ 5 = +60.0  (${PACK_GLOB_BEFORE.toFixed(1)} → ${PACK_GLOB_AFTER.toFixed(1)})`;
      msgCol = COSMOS.rose;
    } else if (ga) {
      msg = `Isolated stays ${PACK_ISO_AFTER.toFixed(1)}  ·  Global leaks Ex A and jumps to ${PACK_GLOB_AFTER.toFixed(1)}!`;
      msgCol = COSMOS.rose;
    } else if (ia) {
      msg = `Isolated output stays fixed at ${PACK_ISO_AFTER.toFixed(1)} (reads only 10 and 20)`;
      msgCol = COSMOS.emerald;
    } else if (perturbed) {
      msg = 'Added +100 to Example A (B unchanged): which average moves?';
      msgCol = COSMOS.gold;
    }

    nodes.push(
      glassCell(0, 355, 1660, 102, msgCol, { fill: '#101829', glow: 8 }),
      txt(msg, 0, 355, 28, msgCol, 'mono'),
      glowDot(-805, 355, { radius: 6, color: msgCol }),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('packing-implementation-b1', () => s.play(focusQ4.to(1, { duration: 0.4 })));
  c.after('isolated-before', () => s.play(isoBeforeKnown.to(1, { duration: 0.2 })));
  c.after('global-before', () => s.play(globBeforeKnown.to(1, { duration: 0.2 })));
  c.on('packing-actual-change', () => s.play(perturbDelta.to(100, { duration: 0.9 })));
  c.after('packing-implementation-b2', () => s.play(isoAfterKnown.to(1, { duration: 0.2 })));
  c.after('global-result', () => s.play(globAfterKnown.to(1, { duration: 0.2 })));
  c.on('mean-increase', () => s.play(showDeltaMath.to(1, { duration: 0.4 })));
  c.on('packing-implementation-b3', () =>
    s.play(showPackModes.to(1, { duration: remainDuration(c, 'packing-implementation-b3', 0.45) })),
  );
}
