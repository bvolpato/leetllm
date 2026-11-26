// Scene 10: unigram-path: Glowing Viterbi DAG lattice for "▁rain" -> probability flip (0.30 -> 0.01) -> Viterbi DP.
import { linear } from 'vizmatic/stage';
import {
  BEST,
  COSMOS,
  LOWERED,
  P,
  PATHS,
  ROLE,
  arcPts,
  aura,
  bindCueBeat,
  glowDot,
  glowTex,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  logOf,
  playCue,
  txt,
} from '../parts.mjs';

export default function unigramPath(s, c) {
  const showP1 = s.value(0);
  const showP2 = s.value(0);
  const showP3 = s.value(0);
  const showQuestion = s.value(0);
  const revealWin1 = s.value(0); // strictly withheld until after `win`!
  const lowerProb = s.value(0); // 0 -> 1 drops whole piece 0.30 -> 0.01
  const revealFlip = s.value(0); // strictly withheld until after `flip`!
  const showLogs = s.value(0);
  const showViterbi = s.value(0);
  const pulse = s.value(0);

  const bgAura = aura(0, 0, 740, '#2a1b5c2a', '#103b5418');
  const title = heroTitle(['Unigram LM:', 'three paths across rain'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: ROLE.path,
  });

  const logEq = glowTex(String.raw`\log P(x) = \sum_i \log P(t_i)`, {
    x: 520,
    y: -380,
    size: 38,
    color: ROLE.piece,
    glow: 6,
  });

  // 6 character boundaries for "▁ r a i n": b0..b5
  const bXs = [-720, -432, -144, 144, 432, 720];
  const symChars = ['▁', 'r', 'a', 'i', 'n'];
  const railY = -10;

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const p1 = showP1.value;
    const p2 = showP2.value;
    const p3 = showP3.value;
    const q = showQuestion.value;
    const w1 = revealWin1.value;
    const low = lowerProb.value;
    const fl = revealFlip.value;
    const lg = showLogs.value;
    const vit = showViterbi.value;
    const t = pulse.value;
    const nodes = [];

    // Characters centered between boundaries + glowing boundary nodes
    symChars.forEach((ch, i) => {
      const mx = (bXs[i] + bXs[i + 1]) * 0.5;
      nodes.push(txt(ch, mx, railY, 44, COSMOS.ink, 'mono', 'center').opacity(alpha));
    });
    bXs.forEach((bx, idx) => {
      const activeVit = vit > 0.3 && (idx === 0 || idx === 1 || idx === 3 || idx === 5);
      nodes.push(
        glowDot(bx, railY, {
          radius: activeVit ? 11 : 7,
          color: activeVit ? ROLE.ok : ROLE.piece,
          glow: activeVit ? 14 : 8,
          opacity: alpha,
        }),
      );
    });

    // Quiet lower lattice preview before Path 2 & Path 3 illuminate (zero empty space!)
    if (p2 <= 0.05 && p3 <= 0.05) {
      nodes.push(
        txt(
          'PATH SCORE  =  ∏ P(piece_i)   (multiply every arc along one complete cut)',
          -855,
          245,
          28,
          COSMOS.dim,
          'mono',
          'left',
        ).opacity(alpha),
        glowingTrail(
          [
            [-855, 310],
            [855, 310],
          ],
          { color: '#24355a', width: 2.5, core: false, opacity: 0.7 * alpha },
        ),
      );
    }

    // Path 1 (top arc): ▁rain (b0 -> b5)
    const wholeProb = P.whole + (LOWERED - P.whole) * low;
    const p1Win = w1 > 0.5 && fl < 0.5;
    const p1Col = low > 0.5 ? ROLE.warn : p1Win ? ROLE.ok : ROLE.merge;
    if (p1 > 0.05) {
      const pts1 = arcPts([bXs[0], railY - 12], [bXs[5], railY - 12], -220, 40);
      nodes.push(
        glowingTrail(pts1, {
          color: p1Col,
          width: p1Win ? 6 : 4,
          glow: p1Win ? 14 : 8,
          opacity: p1 * alpha,
        }),
        txt(
          lg > 0.5
            ? `▁rain  p=${wholeProb.toFixed(2)}  (ln=${logOf(wholeProb)})`
            : `Path 1: ▁rain   p = ${wholeProb.toFixed(2)}`,
          0,
          railY - 160,
          30,
          p1Col,
          'mono',
          'center',
        )
          .glow(p1Win ? 8 : 0, p1Col)
          .opacity(p1 * alpha),
      );
    }

    // Path 2 (mid lower arc): ▁ (b0->b1) + rain (b1->b5)
    const p2Win = fl > 0.5;
    const p2Col = p2Win ? ROLE.ok : ROLE.piece;
    if (p2 > 0.05) {
      const pts2a = arcPts([bXs[0], railY + 12], [bXs[1], railY + 12], 95, 20);
      const pts2b = arcPts([bXs[1], railY + 12], [bXs[5], railY + 12], 135, 32);
      nodes.push(
        glowingTrail(pts2a, {
          color: p2Col,
          width: p2Win ? 6 : 4,
          glow: p2Win ? 14 : 8,
          opacity: p2 * alpha,
        }),
        glowingTrail(pts2b, {
          color: p2Col,
          width: p2Win ? 6 : 4,
          glow: p2Win ? 14 : 8,
          opacity: p2 * alpha,
        }),
        txt(
          `Path 2: ▁ (${P.marker}) × rain (${P.rain}) = ${PATHS[1].toFixed(3)}`,
          -855,
          245,
          28,
          p2Col,
          'mono',
          'left',
        )
          .glow(p2Win ? 8 : 0, p2Col)
          .opacity(p2 * alpha),
      );
      if (p2Win) {
        const idxPt = Math.floor((t * 14) % pts2b.length);
        nodes.push(
          glowDot(pts2b[idxPt][0], pts2b[idxPt][1], {
            radius: 8,
            color: ROLE.ok,
            glow: 14,
            opacity: alpha,
          }),
        );
      }
    }

    // Path 3 (deep arc): ▁ (b0->b1) + ra (b1->b3) + in (b3->b5)
    if (p3 > 0.05) {
      const pts3a = arcPts([bXs[1], railY + 16], [bXs[3], railY + 16], 195, 24);
      const pts3b = arcPts([bXs[3], railY + 16], [bXs[5], railY + 16], 195, 24);
      nodes.push(
        glowingTrail(pts3a, { color: ROLE.path, width: 3.2, glow: 6, opacity: 0.85 * p3 * alpha }),
        glowingTrail(pts3b, { color: ROLE.path, width: 3.2, glow: 6, opacity: 0.85 * p3 * alpha }),
        txt(
          `Path 3: ▁ (${P.marker}) × ra (${P.ra}) × in (${P.in}) = ${PATHS[2].toFixed(5)}`,
          -855,
          302,
          28,
          ROLE.path,
          'mono',
          'left',
        ).opacity(p3 * alpha),
      );
    }

    // Prediction prompt (strictly withheld answer!)
    if (q > 0.05 && w1 < 0.2) {
      nodes.push(
        txt('Which complete path wins?', -855, 365, 38, ROLE.merge, 'serif', 'left')
          .glow(8, ROLE.merge)
          .opacity(q * (1 - w1 * 5) * alpha),
      );
    }

    // Verdict & Viterbi readout along bottom
    if (w1 > 0.5 && fl < 0.5 && vit < 0.2) {
      nodes.push(
        txt('Winner: ▁rain (0.300 beats 0.015)', -855, 365, 34, ROLE.ok, 'mono', 'left')
          .glow(8, ROLE.ok)
          .opacity(alpha),
      );
    }
    if (fl > 0.5 && vit < 0.2) {
      nodes.push(
        txt(
          `Flip! ▁ + rain (${BEST[3].toFixed(3)}) beats ▁rain (${LOWERED.toFixed(2)})`,
          -855,
          365,
          34,
          ROLE.ok,
          'mono',
          'left',
        )
          .glow(8, ROLE.ok)
          .opacity(alpha),
      );
    }
    if (vit > 0.2) {
      nodes.push(
        txt(
          `Viterbi DP best at boundaries: 1.0 → ${BEST[1]} → ${BEST[2].toFixed(3)} → ${BEST[3].toFixed(3)}`,
          -855,
          365,
          30,
          ROLE.ok,
          'mono',
          'left',
        )
          .glow(8, ROLE.ok)
          .opacity(vit * alpha),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  c.show('logs', logEq);

  const totalDur = Math.max(1, c.end - c.start - 0.5);
  c.at(0.1, () => {
    s.play(pulse.to(6, { duration: totalDur, ease: linear }));
  });

  playCue(s, c, 'p1', (d) => s.play(showP1.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'p2', (d) => s.play(showP2.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'p3', (d) => s.play(showP3.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'which', (d) => s.play(showQuestion.to(1, { duration: d })), { dur: 0.4 });
  // Strictly withhold winner until AFTER `win`!
  playCue(s, c, 'win', (d) => s.play(revealWin1.to(1, { duration: d })), { after: true, dur: 0.4 });
  playCue(s, c, 'lower', (d) => s.play(lowerProb.to(1, { duration: d })), { dur: 0.6 });
  // Strictly withhold flip winner until AFTER `flip`!
  playCue(s, c, 'flip', (d) => s.play(revealFlip.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'logs', (d) => s.play(showLogs.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'viterbi', (d) => s.play(showViterbi.to(1, { duration: d })), { dur: 0.5 });
  bindCueBeat(s, c, s.value(0), [
    'path',
    'score',
    'made-up',
    'p2-result',
    'p3-result',
    'not-longest',
    'many',
    'best',
  ]);
}
