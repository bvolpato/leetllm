// Scene 02 (scores): "Read the gaps between scores"
// Luminous score ruler + glowing gap brackets + +1000 shift-invariance proof + live MathJax.
import {
  COSMOS,
  LOGITS,
  MARK_COLOR,
  PROBS,
  TARGET_COLOR,
  WORD_COLOR,
  aura,
  buildRulerBars,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  tweenCue,
  txt,
} from '../parts.mjs';

export default function scores(s, c) {
  const showLogits = s.value(0);
  const showGaps = s.value(0);
  const offset = s.value(0);
  const showNext = s.value(0);

  const bgAura = aura(-200, 40, 560, '#152c5432', '#171b3d14');
  const title = heroTitle(['Read the Gaps', 'Between Scores'], {
    x: -855,
    y: -425,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.cyan,
    eyebrow: 'LOGITS & SHIFT INVARIANCE',
  });

  const eqLogits = glowTex('z^{(0)} = [3,\\ 1,\\ 0]', {
    x: 495,
    y: -270,
    size: 46,
    color: COSMOS.cyan,
    glow: 7,
  });
  const eqShift = glowTex('z_i + 1000 \\;\\Longrightarrow\\; \\Delta z_{ij}\\text{ unchanged}', {
    x: 495,
    y: -120,
    size: 34,
    color: MARK_COLOR,
    glow: 6,
  });
  const eqNext = glowTex('w_i = e^{z_i} > 0', {
    x: 495,
    y: 165,
    size: 46,
    color: TARGET_COLOR,
    glow: 8,
  });

  const live = guardedDynamic(s.value(1), () => {
    const off = offset.value;
    const gOn = showGaps.value;
    const lOn = showLogits.value;
    const nOn = showNext.value;

    const { nodes, xOf } = buildRulerBars(-810, 40, 120, 310, LOGITS, PROBS, {
      offset: off,
      solidScales: [0.18, 0.22, 0.18],
      readMode: 'none',
    });

    // Floating score tags above each bar
    LOGITS.forEach((z, i) => {
      const val = z + off;
      const lbl = Math.abs(val) >= 100 ? `${Math.round(val)}` : `${z}`;
      nodes.push(
        txt(
          `z = ${lbl}`,
          xOf(z),
          -195 + (i === 0 ? -42 : i === 1 ? 155 : 210),
          28,
          WORD_COLOR[i],
          'mono',
        ).opacity(0.4 + 0.6 * lOn),
      );
    });

    // Glowing gap brackets under the ruler (invariant even when offset = +1000!)
    if (gOn > 0.02) {
      const xAte = xOf(LOGITS[2]);
      const xSlept = xOf(LOGITS[1]);
      const xRan = xOf(LOGITS[0]);
      const gy = 278;
      nodes.push(
        glowingTrail(
          [
            [xSlept, gy - 14],
            [xSlept, gy],
            [xRan, gy],
            [xRan, gy - 14],
          ],
          { color: MARK_COLOR, width: 4.0, glow: 10, opacity: gOn },
        ),
        txt('gap = +2.0', (xSlept + xRan) / 2, gy + 38, 30, MARK_COLOR, 'mono').opacity(gOn),
        glowingTrail(
          [
            [xAte, gy - 14],
            [xAte, gy],
            [xSlept - 14, gy],
            [xSlept - 14, gy - 14],
          ],
          { color: COSMOS.cyan, width: 3.2, glow: 8, opacity: gOn * 0.85 },
        ),
        txt('+1.0', (xAte + xSlept - 14) / 2, gy + 38, 28, COSMOS.cyan, 'mono').opacity(gOn * 0.85),
      );
    }

    // Right-side visual logit spectrum gauge (keeps canvas balanced from frame 0)
    const gx = 240;
    nodes.push(txt('RELATIVE LEAD ON REAL LINE', 495, -360, 26, COSMOS.cyan, 'mono'));
    LOGITS.forEach((z, i) => {
      const gy = 305 + i * 52;
      const w = 120 + z * 115;
      nodes.push(
        txt(`${['ran', 'slept', 'ate'][i]}`, gx - 20, gy, 26, WORD_COLOR[i], 'sans', 'right'),
        glowingTrail(
          [
            [gx, gy],
            [gx + w, gy],
          ],
          { color: WORD_COLOR[i], width: 8, glow: 9, core: false },
        ),
        txt(`${(z + off).toFixed(0)}`, gx + w + 22, gy, 26, WORD_COLOR[i], 'mono', 'left'),
      );
    });

    // Offset badge on right side
    if (off > 1) {
      nodes.push(
        txt(`COMMON OFFSET  +${Math.round(off)}`, 495, 25, 34, MARK_COLOR, 'mono', 'center').glow(
          8,
          MARK_COLOR,
        ),
        txt('Ticks climb, gaps stay locked at +2 and +1', 495, 76, 26, COSMOS.muted, 'sans'),
      );
    } else if (nOn > 0.02) {
      nodes.push(
        txt(
          'Next: exponentiate gaps into positive weights',
          495,
          232,
          28,
          TARGET_COLOR,
          'sans',
        ).opacity(nOn),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, live);

  tweenCue(s, c, 'score-values', showLogits, 1, { duration: 0.55 });
  c.show('score-logits', eqLogits);
  tweenCue(s, c, 'score-gaps', showGaps, 1, { duration: 0.55 });
  c.on('score-offset', () => {
    s.play(offset.to(1000, { duration: 1.0 }));
  });
  c.show('score-offset', eqShift);
  c.on('score-restore', () => {
    s.play(offset.to(0, { duration: 0.9 }));
  });
  c.show('score-next', eqNext);
  tweenCue(s, c, 'score-next', showNext, 1, { duration: 0.5 });
}
