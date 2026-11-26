// Scene 24: ordered-filters: "Which token crosses eighty percent?"
// View 1 (Beats 0-3): Non-commuting top-k = 3 and top-p = 0.80 on A/B/C/D [0.45, 0.30, 0.15, 0.10].
//   Upper strip cuts D and stretches A,B,C -> B crosses 80% (83.3%, AFTER dec-filters-kp).
//   Lower strip runs top-p = 0.80 first -> C crosses 80% (90.0%, AFTER dec-filters-pk).
// View 2 (Beat 4): 12-token status row at T = 1.0 (3 tokens reach 90%) vs T = 1.5 (9 tokens reach 90%
//   AFTER filter-hot-status).
import { line } from 'vizmatic/stage';
import { COSMOS, guardedDynamic, heroTitle, txt } from '../../cinematic-kit.mjs';
import {
  ROLE,
  STATUS_ROW,
  cinemaAtmosphere,
  decodeSoftmax,
  decodeSupport,
  lumBar,
  playCue,
  probStrip,
  swapVis,
} from '../parts.mjs';

export default function orderedFilters(s, c) {
  const title = heroTitle(['Filter order changes', 'who crosses 80%'], {
    x: -850,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.winner,
  });

  const vOrder = s.value(1);
  const vHot = s.value(0);

  const trimD = s.value(0);
  const stretch = s.value(0);
  const kpDone = s.value(0);
  const showLower = s.value(0);
  const pkDone = s.value(0);
  const hotDone = s.value(0);

  const names = ['A', 'B', 'C', 'D'];
  const row = [0.45, 0.3, 0.15, 0.1];
  const kRes = decodeSupport(row, 'k', 3);
  const kpRes = decodeSupport(kRes.values, 'p', 0.8);
  const pkRes = decodeSupport(decodeSupport(row, 'p', 0.8).values, 'k', 3);

  // VIEW 1: Stacked top-k-then-top-p vs top-p-then-top-k strips
  const orderLayer = guardedDynamic(vOrder, (alpha) => {
    const nodes = [];
    const cut = trimD.value > 0.4;
    const st = stretch.value;
    const upDone = kpDone.value > 0.4;
    const lowVis = showLower.value;
    const loDone = pkDone.value > 0.4;

    const upperVals = cut
      ? row.map((v, i) => (kRes.ids.includes(i) ? v + (kRes.values[i] - v) * st : 0))
      : row;

    // Upper strip: Top-k = 3 first -> Top-p = 0.80
    nodes.push(
      txt(
        'Order 1: Top-k = 3, then Top-p = 0.80',
        -760,
        -255,
        32,
        ROLE.active,
        'mono',
        'left',
      ).opacity(alpha),
      probStrip({
        left: -760,
        y: -135,
        width: 1520,
        height: 58,
        values: upperVals,
        names,
        kept: upDone ? kpRes.ids : null,
        markerU: 0.8,
        markerLabel: '80%',
        labelOffsetY: 74,
        pctOffsetY: 110,
        opacity: alpha,
      }),
      txt(
        upDone
          ? 'Keep A + B  (A + B = 83.3% >= 80%)'
          : st > 0.8
            ? 'Rescaled to 1.00  |  Which token crosses 80%?'
            : cut
              ? 'D dropped  |  retained mass = 0.90'
              : 'Original mass = 1.00',
        -760,
        24,
        28,
        upDone ? ROLE.valid : ROLE.winner,
        'mono',
        'left',
      ).opacity(alpha),
    );

    // Lower strip: Top-p = 0.80 first -> Top-k = 3
    if (lowVis > 0.08) {
      const lA = lowVis * alpha;
      nodes.push(
        txt(
          'Order 2: Top-p = 0.80, then Top-k = 3',
          -760,
          108,
          32,
          ROLE.heat,
          'mono',
          'left',
        ).opacity(lA),
        probStrip({
          left: -760,
          y: 228,
          width: 1520,
          height: 58,
          values: row,
          names,
          kept: loDone ? pkRes.ids : null,
          markerU: 0.8,
          markerLabel: '80%',
          labelOffsetY: 74,
          pctOffsetY: 110,
          opacity: lA,
        }),
        txt(
          loDone
            ? 'Keep A + B + C  (A + B + C = 90.0%)'
            : 'A + B = 75.0%  |  Which token crosses 80%?',
          0,
          398,
          30,
          loDone ? ROLE.valid : ROLE.winner,
          'mono',
          'center',
        ).opacity(lA),
      );
    } else {
      nodes.push(
        txt(
          upDone
            ? 'B crossed 80% because rescaling expanded A + B from 75% to 83.3%.'
            : 'Watch the 80% mark while the surviving slices stretch to 1.00.',
          0,
          230,
          34,
          upDone ? ROLE.winner : COSMOS.muted,
          'serif',
          'center',
        )
          .glow(upDone ? 6 : 0, ROLE.winner)
          .opacity(alpha),
      );
    }

    return nodes;
  });

  // VIEW 2: 12-token status row at T = 1.0 vs T = 1.5 with top-p = 0.90
  const hotLayer = guardedDynamic(vHot, (alpha) => {
    const nodes = [];
    const hd = hotDone.value > 0.4;
    const left = -760;
    const width = 1520;
    const temps = [
      { T: 1.0, y: -115, vis: true, col: ROLE.base },
      { T: 1.5, y: 165, vis: hd, col: ROLE.heat },
    ];

    nodes.push(
      txt(
        '12-token status distribution  |  Top-p = 0.90 cutoff',
        0,
        -275,
        32,
        ROLE.active,
        'mono',
        'center',
      ).opacity(alpha),
    );

    temps.forEach((cfg) => {
      const vals = decodeSoftmax(STATUS_ROW.map(Math.log), cfg.T);
      const sup = decodeSupport(vals, 'p', 0.9);
      const y = cfg.y;

      nodes.push(
        txt(`T = ${cfg.T}`, left, y - 82, 34, cfg.col, 'mono', 'left').opacity(alpha),
        txt(
          cfg.vis ? `${sup.ids.length} of 12 tokens retained` : 'How many tokens reach 90%?',
          left + width,
          y - 82,
          32,
          cfg.vis ? ROLE.winner : COSMOS.muted,
          'mono',
          'right',
        )
          .glow(cfg.vis ? 6 : 0, ROLE.winner)
          .opacity(alpha),
      );

      let cursor = left;
      vals.forEach((v, j) => {
        const w = v * width;
        const kept = cfg.vis && sup.ids.includes(j);
        const segCol = kept ? (cfg.T > 1.2 ? ROLE.heat : ROLE.active) : COSMOS.dim;
        if (w > 2) {
          nodes.push(
            lumBar(cursor + w / 2, y, Math.max(3, w - 3), 68, {
              color: segCol,
              fillOpacity: kept ? 0.5 : 0.14,
              strokeWidth: kept ? 2.2 : 1.2,
              glow: kept ? 8 : 1,
              radius: 4,
              opacity: alpha,
            }),
          );
        }
        cursor += w;
      });

      const mX = left + width * 0.9;
      nodes.push(
        line([mX, y - 48], [mX, y + 48], { stroke: ROLE.winner, width: 4, dash: [7, 5] })
          .glow(10, ROLE.winner)
          .opacity(alpha),
        txt('90%', mX, y + 76, 26, ROLE.winner, 'mono', 'center').opacity(alpha),
      );
    });

    nodes.push(
      txt(
        'Heating preserves token rank (exact top-k unchanged), but swells top-p from 3 to 9 tokens.',
        0,
        385,
        28,
        COSMOS.muted,
        'serif',
        'center',
      ).opacity(alpha),
    );
    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.active, ROLE.heat), title, orderLayer, hotLayer);

  playCue(s, c, 'filter-trim', (d) => s.play(trimD.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });
  playCue(s, c, 'filter-rescale', (d) => s.play(stretch.to(1, { duration: d })), { dur: 0.95 });
  playCue(s, c, 'dec-filters-kp', (d) => s.play(kpDone.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });
  playCue(s, c, 'filter-reverse', (d) => s.play(showLower.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'dec-filters-pk', (d) => s.play(pkDone.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });

  c.onBeat(4, () => s.play(swapVis(vOrder, vHot, 0.55)));
  playCue(s, c, 'filter-hot-status', (d) => s.play(hotDone.to(1, { duration: d })), {
    after: true,
    dur: 0.55,
  });
}
