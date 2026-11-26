// Scene 5: axes: "Can the next token change this one?"
// 2-token sentence tensor [1,2,4] and [2,5,8] compared under per-token LayerNorm(3) vs
// time+width LayerNorm((2,3)). Strictly withholds outcome until AFTER the "axes-edit" cue
// when +100 surges into Token 2, proving why reducing across time leaks future information.
import {
  COSMOS,
  glowDot,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  txt,
} from '../../cinematic-kit.mjs';
import {
  ROLE,
  arcPts,
  cinemaAtmosphere,
  fmt,
  fmtTrim,
  ln,
  lumBar,
  mean,
  overTime,
  playBeat,
  playCue,
  row1,
  row2,
  scenePulse,
} from '../parts.mjs';

export default function axes(s, c) {
  const title = heroTitle(['Can the next token', 'change this one?'], {
    x: -850,
    y: -435,
    size: 52,
    lineHeight: 60,
    accent: ROLE.write,
  });

  const basePerTokenOut = ln(row1)[0]; // -1.069
  const baseOverTimeOut = overTime(row1, row2)[0]; // -1.131

  const editAmt = s.value(0); // 0 -> 100 on axes-edit (AFTER cue!)
  const revealOutcome = s.value(0); // 0 -> 1 shows unchanged vs leak after edit
  const showShapeNote = s.value(0); // beat 2: PyTorch normalized_shape & BatchNorm note
  const pulse = s.value(0);
  const stageVis = s.value(1);

  const mainLayer = guardedDynamic(stageVis, (alpha) => {
    const nodes = [];
    const delta = editAmt.value;
    const rev = revealOutcome.value;
    const note = showShapeNote.value;
    const p = pulse.value;

    const later = row2.map((v) => v + delta);
    const allNow = [...row1, ...later];
    const perMean = mean(row1);
    const bothMean = mean(allNow);
    const perOutNow = ln(row1)[0];
    const bothOutNow = overTime(row1, later)[0];

    // LEFT: 2-token x 3-feature glowing matrix
    const colXs = [-585, -420, -255];
    const yRow1 = -95;
    const yRow2 = 125;

    nodes.push(
      txt('One sentence (2 tokens)', -830, -215, 28, COSMOS.muted, 'mono', 'left').opacity(alpha),
    );
    ['f₁', 'f₂', 'f₃'].forEach((lbl, j) => {
      nodes.push(txt(lbl, colXs[j], -168, 28, COSMOS.muted, 'mono', 'center').opacity(alpha));
    });

    // Token 1 row
    nodes.push(txt('Token 1', -830, yRow1, 32, COSMOS.ink, 'sans', 'left').opacity(alpha));
    row1.forEach((v, j) => {
      const col = j === 0 ? ROLE.gold : ROLE.write;
      nodes.push(
        lumBar(colXs[j], yRow1, 132, 74, {
          color: col,
          fillOpacity: j === 0 ? 0.32 : 0.16,
          strokeWidth: j === 0 ? 3 : 2,
          glow: j === 0 ? 10 : 5,
          opacity: alpha,
        }),
        txt(
          String(v),
          colXs[j],
          yRow1,
          38,
          j === 0 ? ROLE.gold : COSMOS.ink,
          'mono',
          'center',
        ).opacity(alpha),
      );
    });

    // Token 2 row
    const t2Col = delta > 1 ? ROLE.amber : ROLE.rms;
    nodes.push(txt('Token 2', -830, yRow2, 32, t2Col, 'sans', 'left').opacity(alpha));
    later.forEach((v, j) => {
      nodes.push(
        lumBar(colXs[j], yRow2, 132, 74, {
          color: t2Col,
          fillOpacity: delta > 1 ? 0.34 : 0.16,
          strokeWidth: delta > 1 ? 3 : 2,
          glow: delta > 1 ? 11 : 5,
          opacity: alpha,
        }),
        txt(
          fmtTrim(v, 0),
          colXs[j],
          yRow2,
          36,
          delta > 1 ? ROLE.gold : COSMOS.ink,
          'mono',
          'center',
        ).opacity(alpha),
      );
    });

    // Glowing scope brackets connecting left tensor to the two calculation lanes on right
    const topCol = rev > 0.3 ? ROLE.norm : ROLE.write;
    const botCol = rev > 0.3 ? ROLE.alert : ROLE.rms;

    // Upper bracket: ONLY Token 1
    const b1X = -155;
    nodes.push(
      glowingTrail(
        [
          [b1X - 18, yRow1 - 44],
          [b1X, yRow1 - 44],
          [b1X, yRow1 + 44],
          [b1X - 18, yRow1 + 44],
        ],
        { color: topCol, width: 3.5, glow: 8, core: false, opacity: alpha },
      ),
      glowingTrail(
        [
          [b1X, yRow1],
          [110, -145],
        ],
        { color: topCol, width: 3, glow: 7, core: false, opacity: 0.78 * alpha },
      ),
    );

    // Lower bracket: BOTH Token 1 + Token 2
    const b2X = -95;
    nodes.push(
      glowingTrail(
        [
          [b2X - 18, yRow1 - 54],
          [b2X, yRow1 - 54],
          [b2X, yRow2 + 54],
          [b2X - 18, yRow2 + 54],
        ],
        { color: botCol, width: 3.5, glow: 8, core: false, opacity: alpha },
      ),
      glowingTrail(
        [
          [b2X, 15],
          [110, 145],
        ],
        { color: botCol, width: 3, glow: 7, core: false, opacity: 0.78 * alpha },
      ),
    );

    // Subtle flowing photon along each reduction path
    const tFlow = (p * 3) % 1;
    nodes.push(
      glowDot(b1X + (110 - b1X) * tFlow, yRow1 + (-145 - yRow1) * tFlow, {
        radius: 5,
        color: topCol,
        glow: 10,
        opacity: 0.8 * alpha,
      }),
      glowDot(b2X + (110 - b2X) * tFlow, 15 + (145 - 15) * tFlow, {
        radius: 5,
        color: botCol,
        glow: 10,
        opacity: 0.8 * alpha,
      }),
    );

    // RIGHT UPPER: Per-token calculation (3 numbers)
    const rx = 145;
    nodes.push(
      txt('Per-token norm (3 features)', rx, -220, 34, topCol, 'sans', 'left')
        .glow(6, topCol)
        .opacity(alpha),
      txt(`Mean = ${fmt(perMean, 3)}`, rx, -162, 30, COSMOS.ink, 'mono', 'left').opacity(alpha),
      txt(
        rev > 0.2
          ? `Token 1 f₁: ${fmt(basePerTokenOut, 3)}  ->  ${fmt(perOutNow, 3)}`
          : `Token 1 f₁: ${fmt(basePerTokenOut, 3)}  ->  ?`,
        rx,
        -104,
        32,
        topCol,
        'mono',
        'left',
      ).opacity(alpha),
    );
    if (rev > 0.3) {
      nodes.push(
        txt('Unchanged  (causal safe)', rx, -48, 28, ROLE.norm, 'mono', 'left')
          .glow(6, ROLE.norm)
          .opacity(rev * alpha),
      );
    }

    // RIGHT LOWER: Both tokens calculation (6 numbers)
    nodes.push(
      txt('Both tokens together (6 numbers)', rx, 65, 34, botCol, 'sans', 'left')
        .glow(6, botCol)
        .opacity(alpha),
      txt(`Mean = ${fmt(bothMean, 3)}`, rx, 123, 30, COSMOS.ink, 'mono', 'left').opacity(alpha),
      txt(
        rev > 0.2
          ? `Token 1 f₁: ${fmt(baseOverTimeOut, 3)}  ->  ${fmt(bothOutNow, 3)}`
          : `Token 1 f₁: ${fmt(baseOverTimeOut, 3)}  ->  ?`,
        rx,
        181,
        32,
        botCol,
        'mono',
        'left',
      ).opacity(alpha),
    );
    if (rev > 0.3) {
      nodes.push(
        txt('Changed!  Future token leaked backward', rx, 238, 28, ROLE.alert, 'mono', 'left')
          .glow(7, ROLE.alert)
          .opacity(rev * alpha),
      );
      // Glowing backward leakage arc from Token 2 -> Token 1
      const leakArc = arcPts([colXs[0], yRow2 - 42], [colXs[0], yRow1 + 42], 0, 20).map(
        ([ax, ay], idx) => [ax - Math.sin((idx / 20) * Math.PI) * 58, ay],
      );
      nodes.push(
        glowingTrail(leakArc, {
          color: ROLE.alert,
          width: 4,
          glow: 11,
          opacity: rev * alpha,
        }),
      );
    }

    // Bottom prompt -> PyTorch normalized_shape summary
    if (note > 0.05) {
      nodes.push(
        txt(
          'nn.LayerNorm(3): features only   ·   nn.LayerNorm((2, 3)) & BatchNorm: mix peers',
          0,
          388,
          28,
          ROLE.write,
          'mono',
          'center',
        ).opacity(note * alpha),
      );
    } else if (rev < 0.2) {
      nodes.push(
        txt(
          'Add +100 to every feature of Token 2. Which calculation changes Token 1?',
          0,
          388,
          32,
          ROLE.gold,
          'serif',
          'center',
        )
          .glow(7, ROLE.gold)
          .opacity(alpha),
      );
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.write, ROLE.rms), title, mainLayer);
  scenePulse(s, c, pulse);

  // Beat 1: Strictly on/after axes-edit, surge +100 into Token 2 and reveal unchanged vs leak
  playCue(
    s,
    c,
    'axes-edit',
    (d) => s.play(editAmt.to(100, { duration: d }), revealOutcome.to(1, { duration: d })),
    { after: true, dur: 0.7 },
  );

  // Beat 2: PyTorch normalized_shape and BatchNorm caveat
  playBeat(s, c, 2, (d) => s.play(showShapeNote.to(1, { duration: d })), { offset: 0.2, dur: 0.5 });
}
