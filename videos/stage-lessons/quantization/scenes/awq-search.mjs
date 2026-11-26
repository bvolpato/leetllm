// Scene 17: awq-search: Candidate factors s=1,2,4 (MSE 0.0167) -> s=8 (MSE 0.0033, held-out 0.0008) -> s=32 overshoots -> 20-exponent alpha grid.
import {
  COSMOS,
  ROLE,
  aura,
  awqError,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  txt,
} from '../parts.mjs';

export default function awqSearch(s, c) {
  const showBest = s.value(0);
  const showRef = s.value(0);

  const e1 = awqError(1);
  const e4 = awqError(4);
  const e8 = awqError(8);
  const e32 = awqError(32);

  const bgAura = aura(0, 0, 740, '#14335c28', '#20184422');
  const title = heroTitle(['AWQ Scale Search:', 'Sweet Spot Between Too Small & Too Large'], {
    x: -855,
    y: -430,
    size: 46,
    lineHeight: 54,
    accent: ROLE.gold,
  });

  const rows = [
    { lbl: 's = 1, 2, 4', err: e1, col: ROLE.weight, note: `${e1.toFixed(4)} (w1 -> 2/7)` },
    {
      lbl: 's = 8 (BEST)',
      err: e8,
      col: ROLE.ok,
      note: `${e8.toFixed(4)} (w1 exact; held-out ~0.0008!)`,
    },
    {
      lbl: 's = 32 (OVER)',
      err: e32,
      col: ROLE.err,
      note: `${e32.toFixed(4)} (starves quiet channel!)`,
    },
  ];

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const bst = showBest.value;
    const rf = showRef.value;

    const barX = -520;
    const maxW = 860;
    const maxErr = Math.max(e1, e4, e32) * 1.05;
    const px = maxW / maxErr;

    const nodes = [
      txt(
        'CALIBRATION OUTPUT MSE ACROSS CANDIDATE RESCALE FACTORS s',
        -855,
        -220,
        26,
        ROLE.grid,
        'mono',
        'left',
      ).opacity(alpha),
    ];

    rows.forEach((r, idx) => {
      const y = -110 + idx * 105;
      const op = idx === 2 ? alpha * (0.48 + 0.52 * bst) : alpha;
      nodes.push(
        txt(r.lbl, -855, y, 28, r.col, 'mono', 'left').opacity(op),
        lumBar(barX, y, r.err * px, 44, r.col, { opacity: op, maxTrackW: maxW }),
        txt(r.note, barX + maxW + 24, y, 26, r.col, 'mono', 'left').opacity(op),
      );
    });

    nodes.push(
      chipPill(
        rf > 0.35
          ? 'Reference AWQ sweeps 20 exponents alpha in [0, 0.95]: s = (mean |x|)^alpha, restores weights each trial'
          : 'Too large a factor pushes the quiet channel into zero-collapse, raising output MSE again!',
        0,
        245,
        {
          w: 1640,
          h: 78,
          color: rf > 0.35 ? ROLE.gold : ROLE.ok,
          size: 26,
          opacity: alpha,
        },
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'awq-search-build-0', (d) => s.play(showBest.to(0.4, { duration: d })));
  playCue(s, c, 'awq-search-build-1', (d) => s.play(showBest.to(1, { duration: d })));
  playCue(s, c, 'awq-search-build-2', (d) => s.play(showRef.to(1, { duration: d })));
}
