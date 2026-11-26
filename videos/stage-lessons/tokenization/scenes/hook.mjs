// Scene 01: hook: "rain falls softly" -> piece split -> dual ID comparison -> silent row mismatch.
import { linear } from 'vizmatic/stage';
import {
  COSMOS,
  IDS_A,
  IDS_B,
  PIECES,
  PIECE_COLORS,
  ROLE,
  SENTENCE,
  TABLE,
  arcPts,
  aura,
  glowDot,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  swapVis,
  tokenPill,
  txt,
} from '../parts.mjs';

export default function hook(s, c) {
  const splitT = s.value(0); // 0 = softly joined, 1 = soft | ly split
  const phase0Vis = s.value(1); // 1 -> 0 before phase 1 enters
  const showSentence = s.value(0); // 0 -> 1 reveal all 4 pieces
  const spaceGlow = s.value(0); // highlight leading-space dots
  const showTrainIds = s.value(0);
  const showReplIds = s.value(0);
  const showQuestion = s.value(0);
  const revealFirst = s.value(0); // strictly withheld until after `first`!
  const followRow = s.value(0); // beam down to row 1
  const showLearned = s.value(0); // row 1 was trained for ·soft
  const showRoundTrip = s.value(0); // replacement still decodes back cleanly
  const pulse = s.value(0);

  const bgAura = aura(0, -40, 740, '#1e3a6e28', '#0d1b3614');
  const title = heroTitle(['How a Model Reads', 'rain falls softly'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: ROLE.piece,
  });

  const stageVis = s.value(1);
  const xs = [-540, -180, 180, 540];
  const pieceY = -145;
  const trainY = -20;
  const replY = 90;

  const mainLayer = guardedDynamic(stageVis, (alpha) => {
    const sp = splitT.value;
    const sent = showSentence.value;
    const sg = spaceGlow.value;
    const tr = showTrainIds.value;
    const rp = showReplIds.value;
    const q = showQuestion.value;
    const first = revealFirst.value;
    const fol = followRow.value;
    const lrn = showLearned.value;
    const rt = showRoundTrip.value;
    const p = 0.65 + 0.35 * Math.sin(pulse.value * Math.PI * 2);
    const nodes = [];

    // Phase 0: "softly" pulling apart before full sentence enters (strictly disjoint from Phase 1)
    const p0 = phase0Vis.value;
    if (p0 > 0.02) {
      const a0 = alpha * p0;
      const sep = sp * 115;
      nodes.push(
        tokenPill('soft', -105 - sep, pieceY, {
          w: 200,
          h: 90,
          color: ROLE.path,
          size: 46,
          glow: 10 * p,
          opacity: a0,
        }),
        tokenPill('ly', 75 + sep, pieceY, {
          w: 140,
          h: 90,
          color: ROLE.byte,
          size: 46,
          glow: 10 * p,
          opacity: a0,
        }),
      );
      if (sp > 0.15) {
        nodes.push(
          glowingTrail(
            [
              [0, pieceY - 68],
              [0, pieceY + 68],
            ],
            { color: ROLE.merge, width: 3.5, glow: 10, opacity: sp * a0 },
          ),
        );
      }
    }

    // Persistent luminous embedding table rail across lower canvas (zero empty space!)
    const railY = 305;
    if (lrn < 0.05 && rt < 0.05) {
      nodes.push(
        glowingTrail(
          [
            [-800, railY],
            [800, railY],
          ],
          { color: '#2b3c68', width: 2.5, glow: 5, core: false, opacity: 0.7 * alpha },
        ),
      );
      for (let row = 0; row < 8; row++) {
        const rx = -700 + row * 200;
        const active = (tr > 0.3 && [1, 2, 5, 6].includes(row)) || (fol > 0.3 && row === 1);
        nodes.push(
          glowDot(rx, railY, {
            radius: active ? 9 : 5,
            color: row === 1 && fol > 0.3 ? ROLE.warn : active ? ROLE.piece : COSMOS.dim,
            glow: active ? 12 : 4,
            opacity: alpha,
          }),
          txt(
            `row ${row}`,
            rx,
            railY + 38,
            26,
            active ? ROLE.piece : COSMOS.dim,
            'mono',
            'center',
          ).opacity(alpha),
        );
      }
    }

    // Phase 1+: 4 pieces of "rain falls softly"
    if (sent > 0.02) {
      const a1 = alpha * sent;
      PIECES.forEach(([piece], i) => {
        const isMismatch = i === 1 && first > 0.2;
        const col = isMismatch ? ROLE.warn : PIECE_COLORS[i];
        nodes.push(
          tokenPill(piece, xs[i], pieceY, {
            w: 250,
            h: 82,
            color: col,
            size: 42,
            glow: isMismatch ? 14 * p : 8,
            opacity: a1,
            strokeWidth: isMismatch ? 4 : 2.6,
          }),
        );
        if (sg > 0.05 && piece.startsWith('·')) {
          nodes.push(
            glowDot(xs[i] - 102, pieceY - 26, {
              radius: 7,
              color: ROLE.merge,
              glow: 14,
              opacity: sg * a1,
            }),
          );
        }
      });

      if (sg > 0.05) {
        nodes.push(
          txt('· = leading space', 580, -345, 28, ROLE.merge, 'mono', 'center')
            .glow(6, ROLE.merge)
            .opacity(sg * a1),
        );
      }
    }

    // Training IDs row
    if (tr > 0.02) {
      const aT = alpha * tr;
      nodes.push(txt('TRAINING IDs', -855, trainY, 26, ROLE.piece, 'mono', 'left').opacity(aT));
      PIECES.forEach(([piece], i) => {
        const id = IDS_A[piece];
        const col = i === 1 && first > 0.2 ? ROLE.merge : ROLE.piece;
        nodes.push(
          txt(String(id), xs[i], trainY, 44, col, 'mono', 'center')
            .glow(i === 1 && first > 0.2 ? 10 : 4, col)
            .opacity(aT),
        );
      });
    }

    // Replacement IDs row
    if (rp > 0.02) {
      const aR = alpha * rp;
      nodes.push(txt('REPLACEMENT', -855, replY, 26, COSMOS.muted, 'mono', 'left').opacity(aR));
      PIECES.forEach(([piece], i) => {
        const id = IDS_B[piece];
        const isFirst = i === 1 && first > 0.2;
        const col = isFirst ? ROLE.warn : COSMOS.ink;
        nodes.push(
          txt(String(id), xs[i], replY, 44, col, 'mono', 'center')
            .glow(isFirst ? 12 * p : 4, col)
            .opacity(aR),
        );
      });
    }

    // Prediction prompt (strictly withheld answer while q > 0 and first === 0)
    if (q > 0.02 && first < 0.15) {
      nodes.push(
        txt(
          'Read left to right: which piece first selects a different row?',
          0,
          255,
          36,
          ROLE.merge,
          'serif',
          'center',
        )
          .glow(8, ROLE.merge)
          .opacity(q * (1 - first * 6) * alpha),
      );
    }

    // Answer reveal: beam from replacement ID 1 (under ·falls) to embedding table Row 1
    if (first > 0.02) {
      const aF = alpha * first;
      nodes.push(
        txt('First mismatch: ·falls  (5 → 1)', 140, 225, 34, ROLE.warn, 'mono', 'left')
          .glow(8, ROLE.warn)
          .opacity(aF),
      );
    }

    if (fol > 0.02) {
      const aFol = alpha * fol;
      const beamPts = arcPts([xs[1], replY + 36], [-180, 315], 20, 24);
      const cnt = Math.max(2, Math.round(beamPts.length * fol));
      nodes.push(
        glowingTrail(beamPts.slice(0, cnt), {
          gradientColors: [ROLE.warn, ROLE.merge],
          width: 4.5,
          glow: 12,
          opacity: aFol,
        }),
        glowDot(beamPts[cnt - 1][0], beamPts[cnt - 1][1], {
          radius: 7,
          color: ROLE.merge,
          glow: 14,
          opacity: aFol,
        }),
      );
    }

    if (lrn > 0.02) {
      const aL = alpha * lrn;
      const r1 = TABLE[1].map((v) => v.toFixed(1)).join(', ');
      nodes.push(
        txt(`Row 1: [${r1}]   ← trained for ·soft`, -180, 355, 32, ROLE.merge, 'mono', 'center')
          .glow(6, ROLE.merge)
          .opacity(aL),
      );
    }

    if (rt > 0.02) {
      const aRt = alpha * rt;
      nodes.push(
        txt(
          `Replacement decodes [2, 1, 5, 6] → "${SENTENCE}"`,
          -855,
          420,
          28,
          ROLE.ok,
          'mono',
          'left',
        )
          .glow(6, ROLE.ok)
          .opacity(aRt),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, mainLayer);

  const totalDur = Math.max(1, c.end - c.start - 0.5);
  c.at(0.1, () => {
    s.play(pulse.to(6, { duration: totalDur, ease: linear }));
  });

  playCue(s, c, 'split', (d) => s.play(splitT.to(1, { duration: d })), { dur: 0.9 });
  playCue(s, c, 'cuts', (d) => s.play(swapVis(phase0Vis, showSentence, d)), { dur: 0.65 });
  playCue(s, c, 'space', (d) => s.play(spaceGlow.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'training', (d) => s.play(showTrainIds.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'replacement', (d) => s.play(showReplIds.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'question', (d) => s.play(showQuestion.to(1, { duration: d })), { dur: 0.5 });
  // Strictly withhold mismatch reveal until AFTER `first` clause!
  playCue(s, c, 'first', (d) => s.play(revealFirst.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'follow', (d) => s.play(followRow.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'learned', (d) => s.play(showLearned.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });
  playCue(s, c, 'round-trip', (d) => s.play(showRoundTrip.to(1, { duration: d })), { dur: 0.6 });
}
