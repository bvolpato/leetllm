// Scene 13: normalization: Identical "café" (4 vs 5 code points) -> NFC vs NFKC one-way ligature fold ("ﬁle" -> "file").
import {
  COMPOSED,
  COSMOS,
  DECOMPOSED,
  LIGATURE,
  ROLE,
  SECOND_IDENTIFIER,
  aura,
  bindCueBeat,
  codePoint,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  tokenPill,
  txt,
} from '../parts.mjs';

export default function normalization(s, c) {
  const showCodePoints = s.value(0);
  const showCacheMiss = s.value(0);
  const showNfc = s.value(0);
  const showNfkc = s.value(0);
  const showOneWay = s.value(0);

  const bgAura = aura(0, 0, 740, '#18375a26', '#461a3618');
  const title = heroTitle(['Unicode Normalization:', 'before any cut'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: ROLE.piece,
  });

  const composedPts = [...COMPOSED].map(codePoint);
  const decomposedPts = [...DECOMPOSED].map(codePoint);

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const cp = showCodePoints.value;
    const cm = showCacheMiss.value;
    const nfc = showNfc.value;
    const nfkc = showNfkc.value;
    const ow = showOneWay.value;
    const nodes = [];

    // Row 1: Composed café (4 code points), quiet slots from t=0, exact U+ codes illuminate on cue
    nodes.push(
      txt('FORM A (4 CODE POINTS)', -855, -225, 26, ROLE.token, 'mono', 'left').opacity(alpha),
      tokenPill(COMPOSED, -745, -145, {
        w: 190,
        h: 74,
        color: ROLE.token,
        size: 38,
        opacity: alpha,
      }),
    );
    composedPts.forEach((pt, idx) => {
      nodes.push(
        tokenPill(cp > 0.2 ? pt : 'U+????', -510 + idx * 175, -145, {
          w: 155,
          h: 64,
          color: cp > 0.2 ? (idx === 3 ? ROLE.ok : ROLE.token) : COSMOS.rule,
          size: 26,
          glow: cp > 0.2 ? 8 : 0,
          opacity: (0.3 + 0.7 * cp) * alpha,
        }),
      );
    });

    // Row 2: Decomposed cafe + combining acute (5 code points)
    nodes.push(
      txt('FORM B (5 CODE POINTS)', -855, -45, 26, ROLE.piece, 'mono', 'left').opacity(alpha),
      tokenPill(DECOMPOSED, -745, 35, {
        w: 190,
        h: 74,
        color: ROLE.piece,
        size: 38,
        opacity: alpha,
      }),
    );
    decomposedPts.forEach((pt, idx) => {
      nodes.push(
        tokenPill(cp > 0.2 ? pt : 'U+????', -510 + idx * 175, 35, {
          w: 155,
          h: 64,
          color: cp > 0.2 ? (idx >= 3 ? ROLE.merge : ROLE.piece) : COSMOS.rule,
          size: 26,
          glow: cp > 0.2 ? 8 : 0,
          opacity: (0.3 + 0.7 * cp) * alpha,
        }),
      );
    });

    // Quiet lower comparison preview before NFC/NFKC appear (eliminates empty space!)
    if (cm <= 0.05 && nfc <= 0.05) {
      nodes.push(
        txt(
          'UNICODE NORMALIZATION FORMS:  NFC (canonical)   ·   NFKC (compatibility)',
          -855,
          215,
          28,
          COSMOS.dim,
          'mono',
          'left',
        ).opacity(alpha),
        glowingTrail(
          [
            [-855, 285],
            [855, 285],
          ],
          { color: '#24355a', width: 2.5, core: false, opacity: 0.7 * alpha },
        ),
      );
    }

    if (cm > 0.05 && nfc < 0.05) {
      nodes.push(
        txt(
          'Without normalization: different token IDs → prompt cache miss',
          -855,
          140,
          30,
          ROLE.warn,
          'sans',
          'left',
        )
          .glow(6, ROLE.warn)
          .opacity(cm * alpha),
      );
    }

    // Bottom: NFC vs NFKC on ligature "ﬁle" vs "file"
    if (nfc > 0.05) {
      const aN = nfc * alpha;
      nodes.push(
        txt('NFC', -855, 195, 28, ROLE.ok, 'mono', 'left').glow(6, ROLE.ok).opacity(aN),
        txt(
          'Unifies café (4 & 5)   ·   preserves "ﬁle" ≠ "file"',
          -740,
          195,
          28,
          COSMOS.ink,
          'sans',
          'left',
        ).opacity(aN),
      );
    }

    if (nfkc > 0.05) {
      const aK = nfkc * alpha;
      nodes.push(
        txt('NFKC', -855, 280, 28, ROLE.merge, 'mono', 'left').glow(6, ROLE.merge).opacity(aK),
        tokenPill(LIGATURE, -620, 280, { w: 160, h: 66, color: ROLE.merge, size: 34, opacity: aK }),
        glowingTrail(
          [
            [-530, 280],
            [-410, 280],
          ],
          { color: ROLE.warn, width: 4, glow: 10, opacity: aK },
        ),
        tokenPill(SECOND_IDENTIFIER, -310, 280, {
          w: 160,
          h: 66,
          color: ROLE.warn,
          size: 34,
          opacity: aK,
        }),
        txt('Two identifiers collapse into one', -180, 280, 28, ROLE.warn, 'sans', 'left').opacity(
          aK,
        ),
      );
    }

    if (ow > 0.05) {
      nodes.push(
        txt(
          'One-way fold: decoding cannot restore "ﬁle". Always ship the checkpoint normalizer.',
          -855,
          370,
          28,
          ROLE.ok,
          'sans',
          'left',
        )
          .glow(6, ROLE.ok)
          .opacity(ow * alpha),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'codepoints-four', (d) => s.play(showCodePoints.to(1, { duration: d })), {
    dur: 0.5,
  });
  playCue(s, c, 'cache', (d) => s.play(showCacheMiss.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'nfc', (d) => s.play(showNfc.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'nfkc', (d) => s.play(showNfkc.to(1, { duration: d })), { dur: 0.55 });
  playCue(s, c, 'one-way', (d) => s.play(showOneWay.to(1, { duration: d })), { dur: 0.5 });
  bindCueBeat(s, c, s.value(0), [
    'identical',
    'forms',
    'codepoints-five',
    'ids',
    'lig',
    'collapse',
    'variant',
    'bundled',
  ]);
}
