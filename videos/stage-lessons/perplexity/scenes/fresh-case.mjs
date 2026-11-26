// Scene 9: fresh-case: "What stays fixed when we change the ruler?"
// "The cat sat down" (4 tokens, 16 UTF-8 bytes) with BOS marker.
// Running prefix probability builds 0.40 -> 0.10 -> 0.02 -> 0.01 -> total loss ln(100) = 4.605 nats.
// Token ruler subdivides live into 16 cyan byte ticks while total loss stays pinned -> 0.415 bits/byte.
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
  FRESH_PROBABILITIES,
  ROLE,
  cinemaAtmosphere,
  fmt,
  freshPieces,
  freshReport,
  lumBar,
  playCue,
} from '../parts.mjs';

export default function freshCase(s, c) {
  const rep = freshReport(); // sum=4.605, count=4, mean=1.151, ppl=3.162, bytes=16, bpb=0.415

  const title = heroTitle(['What stays fixed when', 'we change the ruler?'], {
    x: -850,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.prob,
  });

  const sharesVis = s.value(0); // reveals 4 token probabilities
  const prodStep = s.value(0); // 0 -> 1 (0.40) -> 2 (0.10) -> 3 (0.02) -> 4 (0.01)
  const lossVis = s.value(0); // AFTER fresh-loss: ln(100) = 4.605 nats
  const meanVis = s.value(0); // AFTER fresh-mean: 1.151 nats/tok
  const pplVis = s.value(0); // AFTER fresh-ppl: sqrt(10) = 3.162
  const byteRuler = s.value(0); // 0 -> 1 morphs 4-token ticks into 16 byte ticks
  const byteCountVis = s.value(0); // AFTER fresh-byte-count: 16 bytes
  const bitsVis = s.value(0); // AFTER fresh-bits: 6.644 bits
  const bpbVis = s.value(0); // AFTER fresh-bpb: 0.415 bits/byte

  const stageVis = s.value(1);

  const mainLayer = guardedDynamic(stageVis, (alpha) => {
    const nodes = [];
    const sv = sharesVis.value;
    const ps = prodStep.value;
    const lv = lossVis.value;
    const mv = meanVis.value;
    const pv = pplVis.value;
    const br = byteRuler.value;
    const bc = byteCountVis.value;
    const btv = bitsVis.value;
    const bv = bpbVis.value;

    const left = -780;
    const totalW = 1560;
    const unit = totalW / rep.bytes; // 97.5 px per byte
    const textY = -170;
    const rulerY = -58;

    nodes.push(
      txt(
        'BOS supplies context  ·  all 16 UTF-8 bytes of "The cat sat down" are scored',
        left,
        -265,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),
    );

    // Character stream & per-token probabilities
    let charIdx = 0;
    const cuts = new Set([0]);
    freshPieces.forEach((piece, pIdx) => {
      const px0 = left + charIdx * unit;
      const pw = piece.length * unit;
      [...piece].forEach((ch, j) => {
        const cx = px0 + (j + 0.5) * unit;
        nodes.push(
          txt(
            ch === ' ' ? '·' : ch,
            cx,
            textY,
            56,
            ch === ' ' ? ROLE.prob : COSMOS.ink,
            'mono',
            'center',
          ).opacity(alpha),
        );
      });

      // Token probability label under each piece (fades cleanly as byte ticks take over)
      if (sv > 0.1 && br < 0.7) {
        const pOp = Math.min(1, sv * 4 - pIdx) * (1 - br / 0.7);
        if (pOp > 0.04) {
          nodes.push(
            txt(
              `p = ${FRESH_PROBABILITIES[pIdx]}`,
              px0 + pw / 2,
              rulerY + 46,
              30,
              ROLE.context,
              'mono',
              'center',
            ).opacity(pOp * alpha),
          );
        }
      }
      charIdx += piece.length;
      cuts.add(charIdx);
    });

    // Luminous morphing ruler: 4 token boundaries -> 16 byte ticks
    const rulerCol = br > 0.5 ? ROLE.prob : ROLE.context;
    nodes.push(
      glowingTrail(
        [
          [left, rulerY],
          [left + totalW, rulerY],
        ],
        { color: rulerCol, width: 4, glow: 9, opacity: alpha },
      ),
    );

    for (let i = 0; i <= rep.bytes; i++) {
      const isTokCut = cuts.has(i);
      const tickH = isTokCut ? 44 : 44 * br;
      if (tickH > 2) {
        const tx = left + i * unit;
        nodes.push(
          line([tx, rulerY], [tx, rulerY - tickH], {
            stroke: isTokCut && br < 0.5 ? ROLE.context : ROLE.prob,
            width: isTokCut ? 4 : 2.6,
          })
            .glow(isTokCut ? 7 : 5, rulerCol)
            .opacity(alpha),
        );
      }
    }

    // Ruler denominator readout
    const denomText =
      bc > 0.5
        ? '16 scored UTF-8 bytes'
        : br > 0.1
          ? 'Subdividing same text into bytes...'
          : '4 scored tokens';
    nodes.push(
      txt(denomText, left, rulerY + 105, 32, rulerCol, 'mono', 'left')
        .glow(6, rulerCol)
        .opacity(alpha),
    );

    // Lower-left: Invariant total surprise (pinned across ruler change!)
    const boxY = 235;
    let prodText = 'p₁ = 0.40';
    if (ps >= 3.5) prodText = '0.02 × 0.50 = 0.01  (1 in 100)';
    else if (ps >= 2.5) prodText = '0.10 × 0.20 = 0.02  (1 in 50)';
    else if (ps >= 1.5) prodText = '0.40 × 0.25 = 0.10  (1 in 10)';

    nodes.push(
      glowingTrail(
        [
          [-750, boxY - 82],
          [-80, boxY - 82],
        ],
        { color: ROLE.observed, width: 2.5, glow: 6, core: false, opacity: 0.65 * alpha },
      ),
      txt(
        lv > 0.5 ? 'FIXED TOTAL SURPRISE (UNCHANGED)' : 'Running prefix probability',
        -750,
        boxY - 48,
        26,
        lv > 0.5 ? ROLE.observed : COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),
      txt(
        lv > 0.5 ? `ln(100) ≈ ${fmt(rep.sum, 3)} nats` : prodText,
        -750,
        boxY + 12,
        38,
        ROLE.observed,
        'mono',
        'left',
      )
        .glow(8, ROLE.observed)
        .opacity((sv > 0.1 ? 1 : 0.4) * alpha),
    );

    if (btv > 0.1) {
      nodes.push(
        txt(
          `÷ ln(2)  ≈  ${fmt(rep.sum / Math.LN2, 3)} bits for the line`,
          -750,
          boxY + 62,
          28,
          ROLE.prob,
          'mono',
          'left',
        ).opacity(btv * alpha),
      );
    }

    // Lower-right: Dual-ruler comparison (Per token vs Per byte)
    const rx = 120;
    nodes.push(
      glowDot(rx - 28, 178, {
        radius: 8,
        color: pv > 0.5 ? ROLE.good : COSMOS.dim,
        glow: pv > 0.5 ? 12 : 3,
        opacity: alpha,
      }),
      txt(
        pv > 0.5
          ? `Per token:  exp(4.605 / 4) = √10 ≈ ${fmt(rep.ppl, 3)}`
          : mv > 0.5
            ? `Per token:  4.605 / 4 = ${fmt(rep.mean, 3)} nats/tok`
            : 'Per scored token:  ?',
        rx,
        178,
        32,
        pv > 0.5 ? ROLE.good : COSMOS.muted,
        'mono',
        'left',
      )
        .glow(pv > 0.5 ? 7 : 0, ROLE.good)
        .opacity(alpha),

      glowDot(rx - 28, 288, {
        radius: 8,
        color: bv > 0.5 ? ROLE.prob : COSMOS.dim,
        glow: bv > 0.5 ? 12 : 3,
        opacity: alpha,
      }),
      txt(
        bv > 0.5 ? `Per byte:  6.644 / 16 ≈ ${fmt(rep.bpb, 3)} bits/byte` : 'Per scored byte:  ?',
        rx,
        288,
        32,
        bv > 0.5 ? ROLE.prob : COSMOS.muted,
        'mono',
        'left',
      )
        .glow(bv > 0.5 ? 8 : 0, ROLE.prob)
        .opacity(alpha),

      txt(
        bv > 0.5
          ? 'Changing the denominator keeps the same total loss; no rerun needed.'
          : 'Same text, same model probabilities; only the unit ruler changes.',
        0,
        405,
        28,
        bv > 0.5 ? ROLE.prob : COSMOS.muted,
        'serif',
        'center',
      ).opacity(alpha),
    );

    return nodes;
  });

  const bpbEq = glowTex('\\text{BPB} = \\frac{-\\sum \\ln p_i}{B \\ln 2}', {
    x: 560,
    y: -380,
    size: 36,
    color: ROLE.prob,
  });

  s.add(cinemaAtmosphere(ROLE.prob, ROLE.observed), title, mainLayer);

  // Beat 0: show shares -> multiply step by step -> total loss ln(100) = 4.605
  playCue(
    s,
    c,
    'fresh-shares',
    (d) => s.play(sharesVis.to(1, { duration: d }), prodStep.to(1, { duration: d })),
    { dur: 0.7 },
  );
  playCue(s, c, 'fresh-pair', (d) => s.play(prodStep.to(2, { duration: d })), {
    after: true,
    dur: 0.35,
  });
  playCue(s, c, 'fresh-triple', (d) => s.play(prodStep.to(3, { duration: d })), {
    after: true,
    dur: 0.35,
  });
  playCue(s, c, 'fresh-product', (d) => s.play(prodStep.to(4, { duration: d })), {
    after: true,
    dur: 0.35,
  });
  playCue(s, c, 'fresh-loss', (d) => s.play(lossVis.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });

  // Beat 1: per-token mean -> PPL sqrt(10)
  playCue(s, c, 'fresh-mean', (d) => s.play(meanVis.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'fresh-ppl', (d) => s.play(pplVis.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });

  // Beat 2: morph ruler into 16 bytes -> bits -> 0.415 BPB
  c.show('fresh-byte-ruler', bpbEq);
  playCue(s, c, 'fresh-byte-ruler', (d) => s.play(byteRuler.to(1, { duration: d })), { dur: 0.85 });
  playCue(s, c, 'fresh-byte-count', (d) => s.play(byteCountVis.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'fresh-bits', (d) => s.play(bitsVis.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'fresh-bpb', (d) => s.play(bpbVis.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
}
