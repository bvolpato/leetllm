// Scene 29: Replay the last key: Changing v=40 -> v=4 changes ONLY weighted sum N; m=3 & ℓ=1.503 stay locked.
import {
  COSMOS,
  MERGED_ALL,
  TRANSFER_EX,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function transfer(s, c) {
  const swappedInput = s.value(0);
  const askState = s.value(0);
  const revealChanged = s.value(0);
  const replaceVal = s.value(0);
  const highlightLocked = s.value(0);
  const revealOutput = s.value(0);
  const discardScratch = s.value(0);

  const bgAura = aura(120, 30, 560, '#5ce1e622', '#6ee7b716');
  const title = heroTitle(['Replay', 'the Last Key'], {
    x: -855,
    y: -410,
    size: 58,
    lineHeight: 68,
    accent: COSMOS.emerald,
    eyebrow: 'TRANSFER CHECK · SCORES [1, 2, 3] FIXED',
  });

  const trackX0 = -220;
  const trackMaxW = 960;
  const wScale = trackMaxW / 1.7;
  const vScale = trackMaxW / 54;

  const live = guardedDynamic(1, () => {
    const sw = swappedInput.value;
    const ask = askState.value;
    const rc = revealChanged.value;
    const rv = replaceVal.value;
    const hl = highlightLocked.value;
    const ro = revealOutput.value;
    const ds = discardScratch.value;

    const firstWPx = (MERGED_ALL.l - 1) * wScale;
    const lastWPx = 1.0 * wScale;
    const firstVPx = TRANSFER_EX.firstOnFinalScale * vScale;
    const curLastV = 40 + (4 - 40) * rv;
    const lastVPx = curLastV * vScale;
    const curTotalV = TRANSFER_EX.firstOnFinalScale + curLastV;

    const nodes = [
      // Left input card: scores unchanged, value 40 -> 4
      glassCell(-585, -135, 500, 142, ds > 0.5 ? COSMOS.dim : COSMOS.gold, {
        fill: '#1b1812',
        dash: ds > 0.5 ? [8, 6] : undefined,
        glow: ds > 0.5 ? 0 : 8,
      }),
      txt(
        ds > 0.5 ? 'SCORE TILE DISCARDED' : 'LAST KEY ("test")',
        -585,
        -174,
        26,
        ds > 0.5 ? COSMOS.dim : COSMOS.muted,
        'mono',
      ),
      txt('score = 3  (unchanged)', -585, -132, 28, COSMOS.cyan, 'mono'),
      txt(sw > 0.5 ? 'value: 40 → 4' : 'value: 40', -585, -88, 32, COSMOS.gold, 'mono').glow(
        6,
        COSMOS.gold,
      ),

      // Locked reference m = 3
      glassCell(-585, 45, 500, 108, hl > 0.5 ? COSMOS.emerald : COSMOS.gold, {
        fill: '#10192b',
        glow: hl > 0.5 ? 10 : 5,
      }),
      txt(
        hl > 0.5 ? 'REFERENCE m = 3  (LOCKED)' : 'REFERENCE MAX',
        -585,
        16,
        26,
        hl > 0.5 ? COSMOS.emerald : COSMOS.muted,
        'mono',
      ),
      txt(`m = ${MERGED_ALL.m}`, -585, 64, 38, COSMOS.gold, 'mono'),

      // Upper track: Total weight ℓ (UNCHANGED!)
      txt(
        hl > 0.5 ? 'TOTAL WEIGHT ℓ = 1.503  (UNCHANGED)' : 'TOTAL WEIGHT  ℓ',
        trackX0,
        -238,
        26,
        hl > 0.5 ? COSMOS.emerald : COSMOS.cyan,
        'mono',
        'left',
      ),
      line([trackX0, -125], [trackX0 + trackMaxW, -125], { stroke: '#273557', width: 2.2 }),
      rect(firstWPx, 64, { fill: COSMOS.blue, stroke: '#ffffff', width: 1.2, radius: 6 })
        .at(trackX0 + firstWPx * 0.5, -162)
        .opacity(0.9),
      rect(lastWPx, 64, { fill: COSMOS.cyan, stroke: '#ffffff', width: 1.2, radius: 6 })
        .at(trackX0 + firstWPx + lastWPx * 0.5, -162)
        .glow(hl > 0.5 ? 10 : 6, COSMOS.cyan)
        .opacity(0.92),
      txt(`ℓ = ${MERGED_ALL.l.toFixed(3)}`, trackX0, -82, 30, COSMOS.cyan, 'mono', 'left'),

      // Lower track: Weighted value N (last segment shrinks 40 -> 4!)
      txt(
        rc > 0.5 ? 'WEIGHTED SUM N  (ONLY THIS CHANGES!)' : 'WEIGHTED VALUE  N',
        trackX0,
        42,
        26,
        rc > 0.5 ? COSMOS.gold : COSMOS.emerald,
        'mono',
        'left',
      ),
      line([trackX0, 155], [trackX0 + trackMaxW, 155], { stroke: '#273557', width: 2.2 }),
      // Ghost outline of original 48.711 bar
      rect(MERGED_ALL.u * vScale, 64, {
        fill: null,
        stroke: COSMOS.dim,
        width: 2,
        dash: [8, 5],
        radius: 6,
      })
        .at(trackX0 + MERGED_ALL.u * vScale * 0.5, 118)
        .opacity(0.65),
      // Tile 1's 8.711 stays locked!
      rect(firstVPx, 64, { fill: COSMOS.blue, stroke: '#ffffff', width: 1.2, radius: 6 })
        .at(trackX0 + firstVPx * 0.5, 118)
        .opacity(0.92),
      // Last key's segment shrinks 40 -> 4
      rect(Math.max(12, lastVPx), 64, {
        fill: COSMOS.gold,
        stroke: '#ffffff',
        width: 1.4,
        radius: 6,
      })
        .at(trackX0 + firstVPx + Math.max(12, lastVPx) * 0.5, 118)
        .glow(9, COSMOS.gold)
        .opacity(0.95),
      txt(
        `N = ${TRANSFER_EX.firstOnFinalScale.toFixed(2)} + ${curLastV.toFixed(0)} = ${curTotalV.toFixed(2)}`,
        trackX0,
        198,
        30,
        COSMOS.gold,
        'mono',
        'left',
      ),
    ];

    // Prediction question -> Answer -> Final output readout
    if (ro > 0.02) {
      nodes.push(
        glassCell(250, 345, 920, 116, COSMOS.emerald, { fill: '#0d2626', glow: 12, opacity: ro }),
        txt(
          `New output = ${TRANSFER_EX.tiled.u.toFixed(3)} / ${TRANSFER_EX.tiled.l.toFixed(3)} ≈ ${TRANSFER_EX.dense.toFixed(3)}`,
          250,
          345,
          34,
          COSMOS.emerald,
          'mono',
        )
          .glow(8, COSMOS.emerald)
          .opacity(ro),
      );
    } else if (rc > 0.5) {
      nodes.push(
        glassCell(250, 345, 920, 116, COSMOS.cyan, { fill: '#0e1b2c', glow: 9 }),
        txt(
          'Only weighted sum N changes · m = 3 and ℓ = 1.503 stay put',
          250,
          345,
          28,
          COSMOS.cyan,
          'sans',
        ),
      );
    } else if (ask > 0.02) {
      nodes.push(
        glassCell(250, 345, 920, 116, COSMOS.gold, { fill: '#1c1812', glow: 9, opacity: ask }),
        txt(
          'Before dividing: which saved quantity (m, ℓ, or N) must change?',
          250,
          345,
          28,
          COSMOS.gold,
          'sans',
        ).opacity(ask),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('swap-value', () => s.play(swappedInput.to(1, { duration: 0.45 })));
  c.on('predict-state', () => s.play(askState.to(1, { duration: 0.45 })));
  c.on('changed-sum', () => s.play(revealChanged.to(1, { duration: 0.45 })));
  c.on('replace-term', () => s.play(replaceVal.to(1, { duration: 0.85 })));
  c.on('unchanged-weight', () => s.play(highlightLocked.to(1, { duration: 0.45 })));
  c.after('replay-output', () => s.play(revealOutput.to(1, { duration: 0.45 })));
  c.on('finish-row', () =>
    s.play(discardScratch.to(1, { duration: remainDuration(c, 'finish-row', 0.45) })),
  );
}
