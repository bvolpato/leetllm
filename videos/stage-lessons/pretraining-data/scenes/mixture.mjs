// Scene 13: How much practice fits in ten draws?: 10-column glowing token tower morphing across 50/50 docs -> 90/10 docs -> 100-token equal blocks.
import {
  COSMOS,
  DOCUMENT_DRAWS,
  aura,
  documentSample,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function mixture(s, c) {
  const phase = s.value(0);
  const drawsCount = s.value(0); // 0..10 columns visible
  const askNine = s.value(0);
  const revealNine = s.value(0);
  const codeProb = s.value(0.5);
  const equalBlocks = s.value(0);
  const revealFive = s.value(0);

  const bgAura = aura(0, 20, 660, '#1826522a', '#a78bfa14');
  const title = heroTitle(['Document Length', 'Skews Token Share'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.violet,
    eyebrow: 'SAMPLING UNIT · 10 DRAWS · 1 TILE = 100 TOKENS',
  });

  const live = guardedDynamic(s.value(1), () => {
    const vis = Math.round(drawsCount.value);
    const prob = codeProb.value;
    const isBlk = equalBlocks.value > 0.5;
    const an = askNine.value;
    const rn = revealNine.value;
    const rf = revealFive.value;

    const lengths = [100, isBlk ? 100 : 900];
    const sample = documentSample(prob, lengths);

    const leftX = -650;
    const pitch = 144;
    const baseY = 230;
    const tileH = 42;
    const tileW = 92;

    let codeMass = 0;
    let proseMass = 0;

    const nodes = [
      // Right-hand live probability & unit indicator
      txt(
        isBlk ? 'UNIT: 100-TOKEN BLOCK' : 'UNIT: WHOLE DOCUMENT',
        855,
        -420,
        28,
        COSMOS.cyan,
        'mono',
        'right',
      ),
      txt(
        `CODE DRAW PROB: ${Math.round(prob * 100)}%`,
        855,
        -356,
        42,
        COSMOS.violet,
        'mono',
        'right',
      ).glow(8, COSMOS.violet),

      // Reference scale lines (100 and 900)
      line([leftX - 70, baseY + 26], [leftX + 9 * pitch + 70, baseY + 26], {
        stroke: '#3c4d73',
        width: 3,
      }),
      txt('100', leftX - 90, baseY - 2, 26, COSMOS.muted, 'mono', 'right'),
      txt('900', leftX - 90, baseY - 8 * tileH - 2, 26, COSMOS.muted, 'mono', 'right'),
      txt('u =', leftX - 90, baseY + 62, 26, COSMOS.dim, 'mono', 'right'),
    ];

    // Glowing threshold divider between code draws and prose draws
    const cutIdx = Math.round(prob * 10);
    if (cutIdx > 0 && cutIdx < 10) {
      const divX = leftX + (cutIdx - 0.5) * pitch;
      nodes.push(
        glowingTrail(
          [
            [divX, baseY - 9 * tileH - 18],
            [divX, baseY + 42],
          ],
          { color: COSMOS.gold, width: 3.5, glow: 10 },
        ),
      );
    }

    DOCUMENT_DRAWS.forEach((d, i) => {
      const cx = leftX + i * pitch;
      const kind = sample.categories[i]; // 0 = code, 1 = prose
      const col = kind === 0 ? COSMOS.violet : COSMOS.blue;
      const tiles = lengths[kind] / 100;

      if (i < vis) {
        if (kind === 0) codeMass += lengths[0];
        else proseMass += lengths[1];

        for (let t = 0; t < tiles; t++) {
          const ty = baseY - t * tileH;
          nodes.push(
            rect(tileW, tileH - 7, {
              fill: kind === 0 ? '#2b1e54' : '#112548',
              stroke: col,
              width: 2.2,
              radius: 5,
            })
              .at(cx, ty)
              .glow(t === tiles - 1 ? 7 : 3, col),
          );
        }
      }

      nodes.push(txt(d.uniform.toFixed(2), cx, baseY + 62, 26, COSMOS.muted, 'mono'));
    });

    // Live token totals
    nodes.push(
      txt(`CODE: ${codeMass} tokens`, -360, 342, 38, COSMOS.violet, 'mono').glow(6, COSMOS.violet),
      txt(`PROSE: ${proseMass} tokens`, 360, 342, 38, COSMOS.blue, 'mono').glow(6, COSMOS.blue),
    );

    // Bottom prompt / reveal (strictly withholding 9 and 5 until after spoken reveal cues!)
    let caption = 'Draw value u < P(code) picks a code record';
    if (isBlk && rf < 0.5) {
      caption = 'Equal 100-token blocks at 90% · how many of 10 blocks for 50% code?';
    } else if (isBlk && rf >= 0.5) {
      caption = '5 code blocks (50% prob) -> 500 code vs 500 prose tokens';
    } else if (prob > 0.85) {
      caption = '90% code draws: 9 programs (900 tok) balance 1 prose page (900 tok)';
    } else if (rn > 0.5) {
      caption = 'Answer: 9 short programs balance 1 long prose page';
    } else if (an > 0.5) {
      caption = '5 draws each gave 500 vs 4,500 tokens · how many programs balance 1 page?';
    }

    nodes.push(
      txt(
        caption,
        0,
        420,
        32,
        an > 0.5 && rn < 0.5 ? COSMOS.gold : isBlk && rf < 0.5 ? COSMOS.gold : COSMOS.emerald,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('pt-mixture-draws', () =>
    s.play(drawsCount.to(5, { duration: remainDuration(c, 'pt-mixture-draws', 0.9) })),
  );
  c.on('pt-mixture-pages', () =>
    s.play(drawsCount.to(10, { duration: remainDuration(c, 'pt-mixture-pages', 0.9) })),
  );
  c.on('pt-mixture-ask', () =>
    s.play(askNine.to(1, { duration: remainDuration(c, 'pt-mixture-ask', 0.4) })),
  );
  // Strict prediction withholding: reveal "9 programs" only after spoken reveal
  c.after('pt-mixture-nine', () =>
    s.play(revealNine.to(1, { duration: remainAfterDuration(c, 'pt-mixture-nine', 0.4) })),
  );
  c.on('pt-mixture-rebalance', () =>
    s.play(codeProb.to(0.9, { duration: remainDuration(c, 'pt-mixture-rebalance', 1.1) })),
  );
  c.on('pt-mixture-blocks', () =>
    s.play(equalBlocks.to(1, { duration: remainDuration(c, 'pt-mixture-blocks', 0.7) })),
  );
  // Strict prediction withholding: reveal "5 code blocks" only after spoken reveal
  c.after('pt-mixture-five', () =>
    s.play(revealFive.to(1, { duration: remainAfterDuration(c, 'pt-mixture-five', 0.4) })),
  );
  c.on('pt-mixture-even', () =>
    s.play(codeProb.to(0.5, { duration: remainDuration(c, 'pt-mixture-even', 0.9) })),
  );
}
