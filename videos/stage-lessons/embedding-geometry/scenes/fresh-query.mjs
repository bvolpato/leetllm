// Scene 23: fresh-query: "Rescoring the upward query"
// Grand Finale: luminous 2-lane optical rescore pipeline paired with upward-query [0, 1]
// shortlist gates showing K=1 starvation of D vs K=2 fetch recovering D (0.2800 > 0.1302).
import { dynamic, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  QUANTIZATION_FIXTURE as F,
  ROLE,
  cinemaAtmosphere,
  cosine,
  glowDot,
  glowRing,
  heroTitle,
  lumBar,
  playCue,
  quantize,
  rule,
  runPhase,
  txt,
} from '../parts.mjs';

export default function freshQuery(s, c) {
  const qUp = [0, 1];
  const rows = F.candidates.map((v, i) => {
    const code = quantize(v, F.step);
    return {
      name: ['C', 'D'][i],
      color: [ROLE.A, ROLE.B][i],
      original: v,
      code,
      exact: cosine(qUp, v), // 0.1302, 0.2800
      approx: cosine(qUp, code), // 0.1961, 0.1961
    };
  });

  const phase = s.value(0);
  const showRef = s.value(0);
  const showCodes = s.value(0);
  const showTie = s.value(0);
  const showSlot1 = s.value(0);
  const showAsk = s.value(0);
  const cAdmit = s.value(0); // 0..1
  const cFetch = s.value(0); // 0..1
  const showScoreC = s.value(0);
  const showOnly = s.value(0);
  const showSlot2 = s.value(0);
  const dAdmit = s.value(0); // 0..1
  const dFetch = s.value(0); // 0..1
  const showScoreD = s.value(0);
  const showWin = s.value(0);

  const title = heroTitle(['Rescoring the', 'upward query'], {
    x: -855,
    y: -445,
    size: 50,
    lineHeight: 58,
    accent: ROLE.B,
    eyebrow: 'SHORTLIST DEPTH · EXACT RESCORE',
  });

  const colXs = [-665, -210, 215, 650];
  const rowYs = [-60, 145];

  const stageLayer = dynamic(() => {
    const p = phase.value;
    const pulse = 0.8 + 0.2 * Math.sin(p * 3.0);

    const nodes = [
      // Top-right query & tie rule badge
      txt(
        showTie.value > 0.5
          ? 'q = [0, 1]   ·   Tie order: C before D'
          : 'Upward query  q = [0, 1]   ·   both eligible',
        855,
        -395,
        30,
        ROLE.query,
        'mono',
        'right',
      ).glow(6, ROLE.query),

      // Four column headers across the optical pipeline (always visible for balanced composition)
      txt('ORIGINAL VECTOR', colXs[0], -205, 26, COSMOS.muted, 'mono'),
      txt(
        '0.2 GRID CODE',
        colXs[1],
        -205,
        26,
        showCodes.value > 0.3 ? ROLE.code : COSMOS.dim,
        'mono',
      ),
      txt(
        showSlot2.value > 0.5 ? 'SHORTLIST (K = 2)' : 'SHORTLIST (K = 1)',
        colXs[2],
        -205,
        26,
        showSlot1.value > 0.3 ? ROLE.gold : COSMOS.dim,
        'mono',
      ),
      txt('ORIGINAL COSINE', colXs[3], -205, 26, cFetch.value > 0.3 ? ROLE.A : COSMOS.dim, 'mono'),
    ];

    rows.forEach((r, i) => {
      const ry = rowYs[i];
      const admitP = i === 0 ? cAdmit.value : dAdmit.value;
      const fetchP = i === 0 ? cFetch.value : dFetch.value;
      const scoreP = i === 0 ? showScoreC.value : showScoreD.value;
      const slotP = i === 0 ? showSlot1.value : showSlot2.value;
      const isWinner = i === 1 && showWin.value > 0.5;

      // Column 0: Original passage coordinates + bright optical pipeline tracks from t=0
      nodes.push(
        txt(`Passage ${r.name}`, colXs[0], ry - 26, 36, r.color, 'serif').glow(5, r.color),
        txt(`[${r.original.join(', ')}]`, colXs[0], ry + 26, 34, COSMOS.ink, 'mono'),
        line([colXs[0] + 150, ry], [colXs[1] - 120, ry], { stroke: '#4c67a3', width: 3.2 }).opacity(
          0.85,
        ),
        line([colXs[1] + 120, ry], [colXs[2] - 98, ry], { stroke: '#4c67a3', width: 3.2 }).opacity(
          0.85,
        ),
        line([colXs[2] + 98, ry], [colXs[3] - 130, ry], { stroke: '#4c67a3', width: 3.2 }).opacity(
          0.85,
        ),
        lumBar(colXs[1], ry, 230, 108, {
          color: '#5b79ba',
          fillAlpha: 0.14,
          strokeWidth: 2.2,
          dash: [8, 6],
          glow: 4,
        }),
        lumBar(colXs[2], ry, 185, 112, {
          color: '#5b79ba',
          fillAlpha: 0.14,
          strokeWidth: 2.2,
          dash: [8, 6],
          glow: 4,
        }),
        lumBar(colXs[3], ry, 250, 108, {
          color: '#5b79ba',
          fillAlpha: 0.14,
          strokeWidth: 2.2,
          dash: [8, 6],
          glow: 4,
        }),
      );
      if (showCodes.value < 0.05) {
        nodes.push(txt('0.2 grid', colXs[1], ry, 26, COSMOS.dim, 'mono'));
      }
      if (slotP < 0.05) {
        nodes.push(txt(`slot ${i + 1}`, colXs[2], ry, 26, COSMOS.dim, 'mono'));
      }
      if (scoreP < 0.05) {
        nodes.push(txt('rescore', colXs[3], ry, 26, COSMOS.dim, 'mono'));
      }

      // Column 1: Rounded 0.2 grid code
      if (showCodes.value > 0.02) {
        nodes.push(
          line([colXs[0] + 150, ry], [colXs[1] - 130, ry], {
            stroke: '#3c507c',
            width: 2.6,
          }).opacity(showCodes.value),
          lumBar(colXs[1], ry, 230, 108, {
            color: ROLE.code,
            fillAlpha: 0.14,
            strokeWidth: 2,
            glow: 5,
            opacity: showCodes.value,
          }),
          txt(`[${r.code.join(', ')}]`, colXs[1], ry - 20, 32, COSMOS.ink, 'mono').opacity(
            showCodes.value,
          ),
          txt(`cos ≈ ${r.approx.toFixed(3)}`, colXs[1], ry + 26, 26, ROLE.code, 'mono').opacity(
            showCodes.value,
          ),
        );
      }

      // Column 2: Shortlist slot gate
      if (slotP > 0.02) {
        nodes.push(
          lumBar(colXs[2], ry, 185, 112, {
            color: admitP > 0.85 ? r.color : ROLE.gold,
            fillAlpha: admitP > 0.85 ? 0.22 : 0.1,
            strokeWidth: 3,
            glow: admitP > 0.85 ? 10 * pulse : 7,
            opacity: slotP,
          }),
          txt(`slot ${i + 1}`, colXs[2], ry - 76, 26, COSMOS.dim, 'mono').opacity(slotP),
        );
      }

      // Admission conduit + gliding photon orb + letter illuminating cleanly inside slot
      if (admitP > 0.01) {
        const sx = colXs[1] + 120;
        const ex = colXs[2];
        const px = sx + (ex - sx) * admitP;
        const letterOp = Math.max(0, (admitP - 0.78) / 0.22);
        nodes.push(
          line([sx, ry], [colXs[2] - 96, ry], { stroke: r.color, width: 3.4 })
            .glow(6, r.color)
            .opacity(Math.min(1, admitP * 2)),
        );
        if (admitP < 0.85) {
          nodes.push(
            glowDot(px, ry, {
              radius: 10,
              color: r.color,
              glow: 13 * pulse,
              opacity: Math.max(0, 1 - Math.max(0, admitP - 0.65) / 0.2),
            }),
          );
        }
        if (letterOp > 0.02) {
          nodes.push(txt(r.name, ex, ry, 48, r.color, 'mono').glow(9, r.color).opacity(letterOp));
        }
      }

      // Fetch photon traveling from shortlist slot to retained originals
      if (fetchP > 0.01) {
        const sx = colXs[2] + 98;
        const ex = colXs[3] - 138;
        const px = sx + (ex - sx) * fetchP;
        nodes.push(
          line([sx, ry], [ex, ry], { stroke: r.color, width: 3.4, dash: [8, 6] })
            .glow(6, r.color)
            .opacity(Math.min(1, fetchP * 2)),
          glowDot(px, ry, { radius: 9, color: r.color, glow: 13 * pulse }),
        );
      }

      // Column 3: Exact rescored cosine
      if (scoreP > 0.02) {
        nodes.push(
          lumBar(colXs[3], ry, 250, 108, {
            color: isWinner ? ROLE.gold : r.color,
            fillAlpha: isWinner ? 0.28 : 0.18,
            strokeWidth: isWinner ? 3.4 : 2.4,
            glow: isWinner ? 13 * pulse : 8,
            opacity: scoreP,
          }),
          txt(r.exact.toFixed(4), colXs[3], ry, 44, isWinner ? ROLE.gold : r.color, 'mono')
            .glow(isWinner ? 9 : 6, isWinner ? ROLE.gold : r.color)
            .opacity(scoreP),
        );
        if (isWinner) {
          nodes.push(
            glowRing(colXs[3] + 178, ry, 28, ROLE.gold, {
              width: 3,
              glow: 10,
              opacity: showWin.value,
            }),
            txt('#1', colXs[3] + 178, ry, 28, ROLE.gold, 'mono').opacity(showWin.value),
          );
        }
      }
    });

    // Bottom horizontal rule + sequential verdict strip (strictly non-overlapping!)
    nodes.push(rule(-855, 290, 855, 290, COSMOS.rule, 1.8).opacity(0.6));

    if (showWin.value > 0.5) {
      nodes.push(
        txt(
          'K = 2 fetches D (0.2800 > 0.1302)  →  D comes back first!',
          0,
          368,
          40,
          ROLE.B,
          'serif',
        )
          .glow(9, ROLE.B)
          .opacity(showWin.value),
      );
    } else if (showOnly.value > 0.5 && showSlot2.value < 0.5) {
      nodes.push(
        txt(
          'K = 1 fetched only C (0.1302)  ·  rescoring cannot recover omitted D',
          0,
          368,
          36,
          ROLE.A,
          'serif',
        )
          .glow(7, ROLE.A)
          .opacity(showOnly.value * (1 - showSlot2.value)),
      );
    } else if (showAsk.value > 0.5 && cAdmit.value < 0.1) {
      nodes.push(
        txt(
          'One slot (K = 1). Can rescoring that shortlist return D?',
          0,
          368,
          40,
          ROLE.gold,
          'serif',
        )
          .glow(9, ROLE.gold)
          .opacity(showAsk.value),
      );
    } else if (showRef.value > 0.5 && showTie.value < 0.5) {
      nodes.push(
        txt(
          'Full-precision reference:  D reaches higher and wins on cosine',
          0,
          368,
          36,
          ROLE.B,
          'serif',
        )
          .glow(7, ROLE.B)
          .opacity(showRef.value * (1 - showTie.value)),
      );
    } else if (showSlot2.value > 0.5 && showWin.value < 0.5) {
      nodes.push(
        txt(
          'Widen shortlist to K = 2  ·  query, grid & tie rule unchanged',
          0,
          368,
          34,
          ROLE.gold,
          'mono',
        ).opacity(showSlot2.value),
      );
    } else if (showRef.value < 0.5 && showTie.value < 0.5) {
      nodes.push(
        txt(
          'Compare Passage C [0.99, 0.13] and Passage D [0.96, 0.28] against q = [0, 1]',
          0,
          368,
          30,
          COSMOS.muted,
          'sans',
        ),
      );
    }

    return group(...nodes);
  });

  s.add(cinemaAtmosphere(ROLE.B, ROLE.A), title, stageLayer);

  runPhase(s, c, phase, 12);

  playCue(s, c, 'reference', (d) => s.play(showRef.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'codes', (d) => s.play(showCodes.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });
  playCue(s, c, 'tie', (d) => s.play(showTie.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'one', (d) => s.play(showSlot1.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'ask', (d) => s.play(showAsk.to(1, { duration: d })), { dur: 0.4 });
  playCue(
    s,
    c,
    'omit',
    (d) => s.play(showAsk.to(0, { duration: 0.2 }), cAdmit.to(1, { duration: d })),
    {
      dur: 0.85,
    },
  );
  playCue(s, c, 'fetchc', (d) => s.play(cFetch.to(1, { duration: d })), { dur: 0.85 });
  playCue(s, c, 'scorec', (d) => s.play(showScoreC.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'only', (d) => s.play(showOnly.to(1, { duration: d })), { after: true, dur: 0.4 });
  playCue(s, c, 'widen', (d) => s.play(showSlot2.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'admit', (d) => s.play(dAdmit.to(1, { duration: d })), { dur: 0.85 });
  playCue(s, c, 'fetchd', (d) => s.play(dFetch.to(1, { duration: d })), { dur: 0.85 });
  playCue(s, c, 'scored', (d) => s.play(showScoreD.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'win', (d) => s.play(showWin.to(1, { duration: d })), { after: true, dur: 0.45 });
}
