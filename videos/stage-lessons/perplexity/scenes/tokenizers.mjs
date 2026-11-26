// Scene 18: tokenizers: "Which model spent fewer bits on this line?"
// Grand finale: "Rain falls now" (14 UTF-8 bytes) cut into 4 subwords (8.4 nats) vs
// 14 characters (9.0 nats). Raw token PPL favors character (1.90 vs 8.17), then both
// rows unify onto the shared 14-byte cyan ruler, flipping the winner to subword
// (0.866 vs 0.927 bits/byte) strictly AFTER spoken reveals!
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  txt,
} from '../../cinematic-kit.mjs';
import {
  ROLE,
  cinemaAtmosphere,
  fmt,
  lumBar,
  playCue,
  scoredRuns,
  tokenizerText,
  utf8Length,
} from '../parts.mjs';

export default function tokenizers(s, c) {
  const byteCount = utf8Length(tokenizerText); // 14

  const title = heroTitle(['Which model spent', 'fewer bits on this line?'], {
    x: -850,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.prob,
  });

  const subCut = s.value(0); // 4 subword pieces
  const charCut = s.value(0); // 14 character pieces
  const showMeans = s.value(0); // AFTER token-means: 2.100 vs 0.643 nats/tok
  const showTokPpl = s.value(0); // AFTER token-ppl: 8.17 vs 1.90
  const unifyBytes = s.value(0); // morphs both rows onto shared 14-byte cyan ruler
  const showBits = s.value(0); // AFTER convert-bits: 12.12 vs 12.98 bits
  const showSubBpb = s.value(0); // AFTER subword-bpb: 0.866
  const showCharBpb = s.value(0); // AFTER tokenizers-bpb: 0.927
  const crownWinner = s.value(0); // AFTER choose-fit: crowns Subword model!

  const stageVis = s.value(1);

  const mainLayer = guardedDynamic(stageVis, (alpha) => {
    const nodes = [];
    const sc = subCut.value;
    const cc = charCut.value;
    const sm = showMeans.value;
    const tp = showTokPpl.value;
    const ub = unifyBytes.value;
    const sb = showBits.value;
    const sBpb = showSubBpb.value;
    const cBpb = showCharBpb.value;
    const cw = crownWinner.value;

    const stripL = -365;
    const unit = 64; // 14 * 64 = 896 px -> spans -365..+531
    const stripW = byteCount * unit;
    const scoreX = 720;

    nodes.push(
      txt(
        `Held-out line: "${tokenizerText}"  (${byteCount} UTF-8 bytes  ·  BOS included)`,
        -850,
        -255,
        28,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),
    );

    const rowYs = [-80, 155];
    const rowCols = [ROLE.context, ROLE.warn];
    const cutsArr = [sc, cc];

    scoredRuns.forEach((run, i) => {
      const ry = rowYs[i];
      const baseCol = rowCols[i];
      const cutProg = cutsArr[i];
      const bitsVal = run.nats / Math.LN2;
      const bpbVal = bitsVal / byteCount;
      const meanTok = run.nats / run.pieces.length;
      const tokPpl = Math.exp(meanTok);
      const isWinner = i === 0 && cw > 0.5;
      const rowCol = isWinner ? ROLE.good : ub > 0.65 ? ROLE.prob : baseCol;

      // Left model label & invariant total loss (nats -> bits)
      nodes.push(
        txt(run.name, -850, ry - 20, 34, isWinner ? ROLE.good : baseCol, 'serif', 'left')
          .glow(isWinner ? 9 : 0, ROLE.good)
          .opacity(alpha),
        txt(
          sb > 0.5
            ? `${fmt(run.nats, 1)} nats  ≈  ${fmt(bitsVal, 2)} bits`
            : `${fmt(run.nats, 1)} nats total`,
          -850,
          ry + 30,
          28,
          ROLE.observed,
          'mono',
          'left',
        ).opacity(alpha),
      );

      // Central 14-byte character strip with glowing laser cuts
      nodes.push(
        lumBar(stripL + stripW / 2, ry, stripW, 78, {
          color: rowCol,
          fillOpacity: isWinner ? 0.24 : 0.14,
          strokeWidth: isWinner ? 3 : 2,
          glow: isWinner ? 11 : 5,
          radius: 10,
          opacity: alpha,
        }),
      );

      let accLen = 0;
      const tokBoundaries = new Set(run.pieces.map((p) => (accLen += p.length)));

      [...tokenizerText].forEach((ch, j) => {
        const cx = stripL + (j + 0.5) * unit;
        nodes.push(
          txt(
            ch === ' ' ? '·' : ch,
            cx,
            ry,
            34,
            ch === ' ' ? ROLE.prob : COSMOS.ink,
            'mono',
            'center',
          ).opacity(alpha),
        );

        if (j + 1 < byteCount) {
          const isTok = tokBoundaries.has(j + 1);
          const hFrac = isTok ? Math.min(1, Math.max(ub, cutProg)) : ub;
          if (hFrac > 0.04) {
            const cutX = stripL + (j + 1) * unit;
            nodes.push(
              line([cutX, ry + 39], [cutX, ry + 39 - 78 * hFrac], {
                stroke: ub > 0.6 ? ROLE.prob : baseCol,
                width: isTok && ub < 0.6 ? 3.5 : 2.2,
              })
                .glow(isTok ? 8 : 4, ub > 0.6 ? ROLE.prob : baseCol)
                .opacity(alpha),
            );
          }
        }
      });

      // Denominator label beneath strip
      if (cutProg > 0.5 || ub > 0.5) {
        nodes.push(
          txt(
            ub > 0.65 ? `${byteCount} shared UTF-8 bytes` : `${run.pieces.length} scored tokens`,
            stripL + stripW / 2,
            ry + 68,
            26,
            ub > 0.65 ? ROLE.prob : baseCol,
            'mono',
            'center',
          ).opacity(alpha),
        );
      }

      // Right-hand score gauge (nats/tok -> token PPL -> bits/byte!)
      const metricHeading = ub > 0.25 ? 'bits / byte' : tp > 0.5 ? 'token PPL' : 'nats / token';
      let displayNum = '…';
      let numCol = COSMOS.ink;

      if (ub > 0.25) {
        if ((i === 0 && sBpb > 0.5) || (i === 1 && cBpb > 0.5)) {
          displayNum = fmt(bpbVal, 3);
          numCol = isWinner ? ROLE.good : ROLE.prob;
        }
      } else if (tp > 0.5) {
        displayNum = fmt(tokPpl, 2);
        numCol = baseCol;
      } else if (sm > 0.5) {
        displayNum = fmt(meanTok, 3);
        numCol = baseCol;
      }

      nodes.push(
        txt(metricHeading, scoreX, ry - 48, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
        txt(displayNum, scoreX, ry + 14, 48, numCol, 'mono', 'center')
          .glow(isWinner ? 12 : 6, numCol)
          .opacity(alpha),
      );

      if (tp > 0.5 && ub < 0.25) {
        nodes.push(
          txt(
            `exp(${fmt(run.nats, 1)} / ${run.pieces.length})`,
            scoreX,
            ry + 68,
            26,
            COSMOS.muted,
            'mono',
            'center',
          ).opacity(alpha),
        );
      }
      if (isWinner) {
        nodes.push(
          glowDot(scoreX - 110, ry + 14, {
            radius: 8,
            color: ROLE.good,
            glow: 14,
            opacity: cw * alpha,
          }),
        );
      }
    });

    // Bottom verdict / question line (strict withholding until choose-fit!)
    const bottomText =
      cw > 0.5
        ? 'Rank flips: the subword model spent fewer bits per byte (0.866 < 0.927).'
        : tp > 0.5 && ub < 0.25
          ? 'Character token PPL looks 4× smaller: which model wins by the byte?'
          : 'Compare different tokenizers on the same shared byte ruler.';
    const bottomCol = cw > 0.5 ? ROLE.good : ROLE.observed;

    nodes.push(
      txt(bottomText, 0, 365, cw > 0.5 ? 34 : 30, bottomCol, 'serif', 'center')
        .glow(cw > 0.5 ? 10 : 5, bottomCol)
        .opacity(alpha),
    );

    return nodes;
  });

  const bpbEq = glowTex('\\text{BPB} = \\frac{-\\sum \\ln p_i}{14 \\ln 2}', {
    x: 560,
    y: -380,
    size: 36,
    color: ROLE.prob,
  });

  s.add(cinemaAtmosphere(ROLE.prob, ROLE.good), title, mainLayer);

  // Beat 0: cut subwords (4) and characters (14)
  playCue(s, c, 'tokenizers-subword-cut', (d) => s.play(subCut.to(1, { duration: d })), {
    dur: 0.7,
  });
  playCue(s, c, 'tokenizers-character-cut', (d) => s.play(charCut.to(1, { duration: d })), {
    dur: 0.75,
  });

  // Beat 1: per-token means -> per-token PPL (8.17 vs 1.90)
  playCue(s, c, 'token-means', (d) => s.play(showMeans.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'token-ppl', (d) => s.play(showTokPpl.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });

  // Beat 2: unify onto 14 shared bytes -> bits -> 0.866 & 0.927 BPB
  c.show('shared-bytes', bpbEq);
  playCue(s, c, 'shared-bytes', (d) => s.play(unifyBytes.to(1, { duration: d })), { dur: 0.85 });
  playCue(s, c, 'convert-bits', (d) => s.play(showBits.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'subword-bpb', (d) => s.play(showSubBpb.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'tokenizers-bpb', (d) => s.play(showCharBpb.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });

  // Beat 3: crown subword model AFTER choose-fit
  playCue(s, c, 'choose-fit', (d) => s.play(crownWinner.to(1, { duration: d })), {
    after: true,
    dur: 0.55,
  });
}
