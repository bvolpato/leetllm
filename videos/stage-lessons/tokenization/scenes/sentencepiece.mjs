// Scene 09: sentencepiece: Raw sentences, visible ▁ space markers, decode round-trip & caveats.
import {
  COSMOS,
  ROLE,
  aura,
  bindCueBeat,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  tokenPill,
  txt,
} from '../parts.mjs';

export default function sentencepiece(s, c) {
  const showRaw = s.value(0);
  const showMarkers = s.value(0);
  const showDecode = s.value(0);
  const showCaveat = s.value(0);

  const bgAura = aura(0, 0, 740, '#133a4e26', '#2c1f5218');
  const title = heroTitle(['SentencePiece:', 'visible spaces'], {
    x: -855,
    y: -430,
    size: 56,
    lineHeight: 64,
    accent: ROLE.ok,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const raw = showRaw.value;
    const mk = showMarkers.value;
    const dec = showDecode.value;
    const cav = showCaveat.value;
    const nodes = [];

    // Top-right toolkit badge strip (floating labels, zero boxes)
    nodes.push(
      txt(
        'TOOLKIT: BPE  |  UNIGRAM  |  NORMALIZER  |  DECODER',
        855,
        -395,
        26,
        ROLE.piece,
        'mono',
        'right',
      ).opacity(alpha),
    );

    if (mk < 0.5) {
      // Raw stream vs whitespace-free scripts
      nodes.push(
        txt('NO WHITESPACE BETWEEN WORDS', -855, -185, 26, ROLE.warn, 'mono', 'left').opacity(
          alpha,
        ),
        tokenPill('Japanese / Chinese / Thai', -550, -90, {
          w: 580,
          h: 86,
          color: ROLE.piece,
          size: 34,
          opacity: alpha,
        }),
        txt('Trains directly on raw Unicode streams', -855, 35, 34, ROLE.ok, 'serif', 'left')
          .glow(6, ROLE.ok)
          .opacity((0.35 + 0.65 * raw) * alpha),
        txt(
          'Default still prevents pieces from crossing whitespace, script, or number boundaries',
          -855,
          105,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(raw * alpha),
        // Bottom pipeline diagram preview so canvas stays visually balanced from t=0
        tokenPill('Raw Text', -680, 275, {
          w: 260,
          h: 72,
          color: ROLE.token,
          size: 30,
          opacity: alpha,
        }),
        glowingTrail(
          [
            [-535, 275],
            [-365, 275],
          ],
          { color: ROLE.piece, width: 3.5, opacity: alpha },
        ),
        tokenPill('Normalizer', -210, 275, {
          w: 280,
          h: 72,
          color: ROLE.piece,
          size: 30,
          opacity: alpha,
        }),
        glowingTrail(
          [
            [-55, 275],
            [115, 275],
          ],
          { color: ROLE.ok, width: 3.5, opacity: alpha },
        ),
        tokenPill('BPE / Unigram', 290, 275, {
          w: 320,
          h: 72,
          color: ROLE.ok,
          size: 30,
          opacity: alpha,
        }),
      );
    } else {
      // Visible space marker pipeline: "rain falls" -> "▁rain" | "▁falls" -> "rain falls"
      nodes.push(
        txt('INPUT TEXT', -855, -210, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
        tokenPill('rain falls', -615, -125, {
          w: 340,
          h: 78,
          color: ROLE.token,
          size: 38,
          opacity: alpha,
        }),
        glowingTrail(
          [
            [-430, -125],
            [-275, -125],
          ],
          { color: ROLE.merge, width: 4, glow: 10, opacity: alpha },
        ),
        txt('VISIBLE MARKER (U+2581 ▁)', -245, -210, 26, ROLE.merge, 'mono', 'left').opacity(alpha),
        tokenPill('▁rain', -120, -125, {
          w: 220,
          h: 78,
          color: ROLE.merge,
          size: 38,
          glow: 10,
          opacity: alpha,
        }),
        tokenPill('▁falls', 140, -125, {
          w: 240,
          h: 78,
          color: ROLE.merge,
          size: 38,
          glow: 10,
          opacity: alpha,
        }),
      );

      const decOp = (0.28 + 0.72 * dec) * alpha;
      const cavOp = (0.28 + 0.72 * cav) * alpha;
      nodes.push(
        glowingTrail(
          [
            [275, -125],
            [420, -125],
          ],
          {
            color: dec > 0.05 ? ROLE.ok : COSMOS.rule,
            width: 4,
            glow: dec > 0.05 ? 10 : 0,
            opacity: decOp,
          },
        ),
        txt('DECODE', 450, -210, 26, dec > 0.05 ? ROLE.ok : COSMOS.dim, 'mono', 'left').opacity(
          decOp,
        ),
        tokenPill(dec > 0.05 ? 'rain falls' : '...', 625, -125, {
          w: 340,
          h: 78,
          color: dec > 0.05 ? ROLE.ok : COSMOS.rule,
          size: 38,
          glow: dec > 0.05 ? 10 : 0,
          opacity: decOp,
        }),
        txt(
          'Join pieces → drop leading ▁ → replace remaining ▁ with space',
          -855,
          20,
          28,
          dec > 0.05 ? ROLE.piece : COSMOS.dim,
          'mono',
          'left',
        ).opacity(decOp),
        txt(
          'ROUND-TRIP CAVEATS (NORMALIZATION & FALLBACK)',
          -855,
          165,
          28,
          cav > 0.05 ? ROLE.warn : COSMOS.dim,
          'mono',
          'left',
        )
          .glow(cav > 0.05 ? 6 : 0, ROLE.warn)
          .opacity(cavOp),
        txt(
          'Defaults strip leading, trailing & repeated spaces ("  rain  " → "rain")',
          -855,
          235,
          28,
          cav > 0.05 ? COSMOS.ink : COSMOS.dim,
          'sans',
          'left',
        ).opacity(cavOp),
        txt(
          'Without byte fallback, an unseen character becomes [UNK] and its identity is lost',
          -855,
          300,
          28,
          cav > 0.05 ? ROLE.warn : COSMOS.dim,
          'sans',
          'left',
        ).opacity(cavOp),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'raw', (d) => s.play(showRaw.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'visible', (d) => s.play(showMarkers.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'decode-1', (d) => s.play(showDecode.to(1, { duration: d })), { dur: 0.55 });
  playCue(s, c, 'spaces-lost', (d) => s.play(showCaveat.to(1, { duration: d })), { dur: 0.55 });
  bindCueBeat(s, c, s.value(0), [
    'toolkit',
    'train',
    'packages',
    'split-first',
    'no-spaces',
    'segmenter',
    'default',
    'to-marker',
    'one-more',
    'example',
    'decode-2',
    'decode-3',
    'exact-q',
    'unseen',
    'gone',
  ]);
}
