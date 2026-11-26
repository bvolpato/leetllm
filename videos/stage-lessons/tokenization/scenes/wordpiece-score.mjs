// Scene 07: wordpiece-score: Raw pair count (t+##h: 90 vs rain+##bow: 42) flips 57x under normalized score!
import {
  BOW,
  COSMOS,
  PROXY_RATIO,
  ROLE,
  TH,
  aura,
  bindCueBeat,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  togetherShare,
  txt,
} from '../parts.mjs';

export default function wordpieceScore(s, c) {
  const showFormula = s.value(0);
  const showRaw = s.value(0.28);
  const showDenom = s.value(0);
  const flipScores = s.value(0); // 0 = raw count bars, 1 = normalized score bars

  const bgAura = aura(120, 40, 720, '#17385c26', '#281e5418');
  const title = heroTitle(['WordPiece:', 'appearance together'], {
    x: -855,
    y: -430,
    size: 56,
    lineHeight: 64,
    accent: ROLE.ok,
  });

  const formula = glowTex(
    String.raw`\text{score}(a,b) = \frac{\text{count}(a,b)}{\text{count}(a)\cdot\text{count}(b)}`,
    { x: 355, y: -365, size: 40, color: ROLE.merge, glow: 6 },
  );

  const stageVis = s.value(1);
  const thShares = togetherShare(TH);
  const bowShares = togetherShare(BOW);

  const layer = guardedDynamic(stageVis, (alpha) => {
    const raw = showRaw.value;
    const den = showDenom.value;
    const fl = flipScores.value;
    const nodes = [];

    const maxBarW = 720;
    const barX = -320;
    const y1 = -65;
    const y2 = 145;

    if (raw > 0.02) {
      const aR = Math.min(1, raw * 1.4) * alpha;
      const barReveal = Math.max(0, Math.min(1, (raw - 0.28) / 0.72));
      // Interpolate bar fractions smoothly from raw counts (90 vs 42) to normalized scores (0.00033 vs 0.01909)
      const thRawFrac = (TH.pair / 100) * (0.18 + 0.82 * barReveal);
      const bowRawFrac = (BOW.pair / 100) * (0.18 + 0.82 * barReveal);
      const thNormFrac = TH.score / 0.021;
      const bowNormFrac = BOW.score / 0.021;

      const thW = maxBarW * (thRawFrac + (thNormFrac - thRawFrac) * fl);
      const bowW = maxBarW * (bowRawFrac + (bowNormFrac - bowRawFrac) * fl);

      nodes.push(
        txt(
          fl > 0.5
            ? 'NORMALIZED ASSOCIATION SCORE'
            : barReveal > 0.5
              ? 'RAW PAIR COUNT (BPE VIEW)'
              : 'WORDPIECE CANDIDATE PAIRS',
          barX,
          -185,
          28,
          fl > 0.5 ? ROLE.ok : ROLE.merge,
          'mono',
          'left',
        )
          .glow(6, fl > 0.5 ? ROLE.ok : ROLE.merge)
          .opacity(aR),

        // Row 1: t + ##h
        txt(TH.name, -855, y1, 40, fl > 0.5 ? ROLE.warn : ROLE.merge, 'mono', 'left').opacity(aR),
        lumBar(barX, y1, thW, 44, fl > 0.5 ? ROLE.warn : ROLE.merge, {
          opacity: aR,
          maxTrackW: maxBarW,
        }),
        txt(
          fl > 0.5 ? TH.score.toFixed(6) : barReveal > 0.5 ? `${TH.pair} pairs` : 'common pair',
          barX + maxBarW + 40,
          y1,
          34,
          fl > 0.5 ? ROLE.warn : ROLE.merge,
          'mono',
          'left',
        ).opacity(aR),

        // Row 2: rain + ##bow
        txt(BOW.name, -855, y2, 40, fl > 0.5 ? ROLE.ok : ROLE.piece, 'mono', 'left').opacity(aR),
        lumBar(barX, y2, bowW, 44, fl > 0.5 ? ROLE.ok : ROLE.piece, {
          opacity: aR,
          maxTrackW: maxBarW,
        }),
        txt(
          fl > 0.5 ? BOW.score.toFixed(5) : barReveal > 0.5 ? `${BOW.pair} pairs` : 'tight pair',
          barX + maxBarW + 40,
          y2,
          34,
          fl > 0.5 ? ROLE.ok : ROLE.piece,
          'mono',
          'left',
        ).opacity(aR),
      );

      // Denominator / individual counts underneath each bar
      if (den > 0.05) {
        nodes.push(
          txt(
            `count(t)=${TH.a} · count(##h)=${TH.b}   (${Math.round(thShares[0] * 100)}% / ${Math.round(thShares[1] * 100)}% together)`,
            barX,
            y1 + 58,
            26,
            COSMOS.muted,
            'mono',
            'left',
          ).opacity(den * aR),
          txt(
            `count(rain)=${BOW.a} · count(##bow)=${BOW.b}   (${Math.round(bowShares[0] * 100)}% / ${Math.round(bowShares[1] * 100)}% together)`,
            barX,
            y2 + 58,
            26,
            ROLE.ok,
            'mono',
            'left',
          ).opacity(den * aR),
        );
      }

      // Winner reversal callout
      if (fl > 0.5) {
        nodes.push(
          txt(
            `rain + ##bow wins by ${Math.round(PROXY_RATIO)}× despite fewer raw pairs (42 vs 90)`,
            0,
            345,
            34,
            ROLE.ok,
            'serif',
            'center',
          )
            .glow(8, ROLE.ok)
            .opacity((fl - 0.5) * 2 * aR),
        );
      }
    }

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  c.show('formula', formula);
  playCue(s, c, 'formula', (d) => s.play(showFormula.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'th-raw', (d) => s.play(showRaw.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'th-counts', (d) => s.play(showDenom.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'scores', (d) => s.play(flipScores.to(1, { duration: d })), { dur: 1.0 });
  bindCueBeat(s, c, s.value(0), [
    'common',
    'origin',
    'question',
    'standin',
    'hash',
    'bow-raw',
    'raw-wins',
    'th-apart',
    'bow-counts',
    'bow-together',
    'flip',
  ]);
}
