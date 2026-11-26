// Scene 05: boundaries: Regex pre-tokenization walls + chunk boundary blocking a merge.
import {
  CHUNKS,
  COSMOS,
  ROLE,
  SPANS,
  WHOLE,
  aura,
  bindCueBeat,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  spanClass,
  tokenPill,
  txt,
} from '../parts.mjs';

export default function boundaries(s, c) {
  const showRegex = s.value(0);
  const showWalls = s.value(0);
  const showChunks = s.value(0);
  const showBlocked = s.value(0);
  const cueEnergy = s.value(0);

  const bgAura = aura(0, 0, 720, '#36194f26', '#16375916');
  const title = heroTitle(['Boundaries decide', 'which merges happen'], {
    x: -855,
    y: -430,
    size: 56,
    lineHeight: 64,
    accent: ROLE.warn,
  });

  const colorMap = {
    blue: ROLE.token,
    yellow: ROLE.merge,
    dim: COSMOS.dim,
    pink: ROLE.warn,
  };

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const rx = showRegex.value;
    const wl = showWalls.value;
    const ch = showChunks.value;
    const bl = showBlocked.value;
    const nodes = [];

    // Top row: raw punctuation waste vs regex pre-tokenized spans
    if (rx < 0.5) {
      nodes.push(
        txt('WITHOUT PRE-TOKENIZATION', -855, -210, 26, ROLE.warn, 'mono', 'left').opacity(alpha),
        tokenPill('failed.', -640, -110, { w: 220, h: 78, color: ROLE.warn, opacity: alpha }),
        tokenPill('failed!', -380, -110, { w: 220, h: 78, color: ROLE.warn, opacity: alpha }),
        tokenPill('failed?', -120, -110, { w: 220, h: 78, color: ROLE.warn, opacity: alpha }),
        txt(
          'Separate vocabulary rows wasted on punctuation variants',
          -855,
          -15,
          30,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(alpha),
      );
    } else {
      nodes.push(
        txt('REGEX PRE-TOKENIZER SPANS', -855, -210, 26, ROLE.piece, 'mono', 'left').opacity(alpha),
      );
      let sx = -820;
      SPANS.forEach((span, idx) => {
        const cls = spanClass(span);
        const col = colorMap[cls] ?? ROLE.piece;
        const label = span === ' ' ? '·' : span;
        const w = Math.max(78, label.length * 36 + 44);
        nodes.push(
          tokenPill(label, sx + w * 0.5, -110, {
            w,
            h: 78,
            color: col,
            size: 36,
            opacity: alpha,
          }),
        );
        if (wl > 0.2 && idx < SPANS.length - 1) {
          const wallX = sx + w + 16;
          nodes.push(
            glowingTrail(
              [
                [wallX, -170],
                [wallX, -50],
              ],
              { color: ROLE.merge, width: 3.5, glow: 8, opacity: wl * alpha },
            ),
          );
        }
        sx += w + 32;
      });
      if (wl > 0.2) {
        nodes.push(
          txt(
            'Merges stay sealed inside each category span',
            -855,
            -15,
            28,
            ROLE.merge,
            'sans',
            'left',
          ).opacity(wl * alpha),
        );
      }
    }

    // Quiet lower comparison preview before chunk-cut arrives (eliminates empty space!)
    if (ch <= 0.05) {
      nodes.push(
        txt(
          'REGEX CATEGORIES:  Letters · Digits · Whitespace · Punctuation',
          -855,
          225,
          28,
          COSMOS.dim,
          'mono',
          'left',
        ).opacity(alpha),
        glowingTrail(
          [
            [-855, 290],
            [855, 290],
          ],
          { color: '#24355a', width: 2.5, core: false, opacity: 0.7 * alpha },
        ),
        txt(
          'Pre-tokenization draws hard merge walls before BPE runs',
          -855,
          345,
          28,
          COSMOS.dim,
          'sans',
          'left',
        ).opacity(alpha),
      );
    }

    // Bottom: whole string ("rain" -> 1 token) vs cut in two ("ra" | "in" -> 3 tokens)
    if (ch > 0.05) {
      const aC = ch * alpha;
      nodes.push(
        txt('WHOLE STRING', -855, 120, 26, ROLE.ok, 'mono', 'left').opacity(aC),
        tokenPill(WHOLE[0], -710, 205, { w: 220, h: 78, color: ROLE.ok, opacity: aC }),
        txt(`= ${WHOLE.length} token`, -535, 205, 32, ROLE.ok, 'mono', 'left').opacity(aC),
      );
      nodes.push(
        txt('SPLIT INTO CHUNKS: "ra"  |  "in"', 20, 120, 26, ROLE.warn, 'mono', 'left').opacity(aC),
        tokenPill(CHUNKS[0][0], 110, 205, { w: 145, h: 78, color: ROLE.piece, opacity: aC }),
        glowingTrail(
          [
            [205, 145],
            [205, 265],
          ],
          { color: ROLE.warn, width: 4.5, glow: 12, opacity: (0.4 + 0.6 * bl) * aC },
        ),
        tokenPill(CHUNKS[1][0], 280, 205, { w: 100, h: 78, color: ROLE.warn, opacity: aC }),
        tokenPill(CHUNKS[1][1], 405, 205, { w: 100, h: 78, color: ROLE.warn, opacity: aC }),
        txt(`= ${CHUNKS.flat().length} tokens`, 510, 205, 32, ROLE.warn, 'mono', 'left')
          .glow(8, ROLE.warn)
          .opacity(aC),
      );
      if (bl > 0.2) {
        nodes.push(
          txt(
            'A chunk cut blocks ra + i → rai. Encode the exact text you send.',
            -855,
            345,
            30,
            ROLE.ok,
            'sans',
            'left',
          )
            .glow(6, ROLE.ok)
            .opacity(bl * aC),
        );
      }
    }

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'regex', (d) => s.play(showRegex.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'spans', (d) => s.play(showWalls.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'chunks', (d) => s.play(showChunks.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'blocked', (d) => s.play(showBlocked.to(1, { duration: d })), { dur: 0.5 });
  bindCueBeat(s, c, cueEnergy, ['glue', 'entries', 'authors', 'separates', 'own-pattern', 'exact']);
}
