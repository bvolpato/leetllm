import {
  dynamic,
  fadeIn,
  indicate,
  morphMatching,
  rect,
  smoother,
  text,
  tex,
  write,
} from 'vizmatic/stage';
import { sceneHeading } from '../../../stage-lessons/kit.mjs';
import { fadeOut, arrive, f2, midProse, midMono, midMath, shareBar } from '../defaults.mjs';
import { softmax, SCORES, SCALED, WEIGHTS, EXPS } from '../model.mjs';

/** Scores become shares. */
export function buildSoftmax(stage, narration, { show, leave }) {
  const soft = narration.scene('softmax');
  sceneHeading(stage, soft, narration.title('softmax'));
  const eqA = tex('s_j = q \\cdot k_j', {
    size: 92,
  }).at(0, -305);
  const eqB = tex('s_j = \\frac{q \\cdot k_j}{\\sqrt{d}}', {
    size: 92,
  }).at(0, -305);
  const eqC = tex('a_j = \\text{softmax}\\left(\\frac{q \\cdot k_j}{\\sqrt{d}}\\right)', {
    size: 92,
  }).at(0, -305);
  const BASE_Y = 410,
    BAR_W = 440,
    UNIT = 300,
    BX = [-330, 330];
  const heightA = stage.value(SCORES[1][0]),
    heightB = stage.value(SCORES[1][1]);
  const barsVisible = stage.value(1),
    barNumbersVisible = stage.value(1);
  const bars = dynamic(() => {
    const out = [];
    if (barsVisible.value <= 0.01) return out;
    [
      [heightA, 'blue', 'birds'],
      [heightB, 'teal', 'sing'],
    ].forEach(([value, color, name], i) => {
      const h = value.value * UNIT;
      out.push(
        rect(BAR_W, h, {
          radius: 6,
          fill: color,
          stroke: null,
        })
          .at(BX[i], BASE_Y - h / 2)
          .opacity(0.85 * barsVisible.value),
      );
      out.push(
        text(f2(value.value), {
          font: 'mono',
          size: 80,
          color,
        })
          .at(BX[i], BASE_Y - h - 56)
          .opacity(barsVisible.value * barNumbersVisible.value),
      );
      out.push(
        text(name, {
          font: 'text-serif',
          size: 60,
          color,
        })
          .at(BX[i], BASE_Y + 56)
          .opacity(barsVisible.value),
      );
    });
    return out;
  });
  soft.at(0.15, () =>
    stage.play(write(eqA), fadeIn(bars), {
      duration: 0.9,
    }),
  );
  soft.on('divide', () =>
    stage.play(
      indicate(eqA, {
        color: 'yellow',
        scale: 1.03,
      }),
      {
        duration: 0.7,
      },
    ),
  );
  // The equation changes with the bars, so it never sits over raw scores.
  // Keep the scaling motion, then earn the rounded result labels at the complete pair.
  soft.on('scaled', () =>
    stage.play(
      barNumbersVisible.to(0, { duration: 0 }),
      morphMatching(eqA, eqB),
      heightA.to(SCALED[1][0]),
      heightB.to(SCALED[1][1]),
      { duration: soft.span('scaled') + 0.02, ease: smoother },
    ),
  );
  soft.after('scaled', () => stage.play(barNumbersVisible.to(1, { duration: 0 }), { duration: 0 }));
  soft.on('softmax', () =>
    stage.play(morphMatching(eqB, eqC), {
      duration: 1.2,
    }),
  );
  const logitsTag = midProse('logits', 0, 280, 60, 'yellow');
  const eFormula = midMath(
    `\\frac{e^{${SCALED[1][0].toFixed(3)}}}{e^{${SCALED[1][0].toFixed(3)}} + e^{${SCALED[1][1].toFixed(3)}}} = \\frac{${f2(EXPS[0])}}{${f2(EXPS[0] + EXPS[1])}} = ${f2(WEIGHTS[1][0])}`,
    0,
    -66,
    64,
  );
  const SHARE_W = 1660,
    SHARE_Y = 170,
    SHARE_H = 250;
  const boost = stage.value(0),
    shareOn = stage.value(0);
  const shareNow = () => softmax([SCALED[1][0], SCALED[1][1] + boost.value]);
  const singShareBar = dynamic(() =>
    shareOn.value <= 0.01
      ? []
      : shareBar(shareNow(), 0, SHARE_Y, SHARE_W, SHARE_H, ['blue', 'teal'], 110),
  );
  const birdsName = text('birds', {
    font: 'text-serif',
    size: 70,
    color: 'blue',
  }).at(-SHARE_W / 2 + 120, SHARE_Y + 190);
  const singName = text('sing', {
    font: 'text-serif',
    size: 70,
    color: 'teal',
  }).at(SHARE_W / 2 - 110, SHARE_Y + 190);
  const weightsTag = midProse('attention weights', -640, -205, 52, 'yellow');
  const sumLine = dynamic(() => {
    const [a, b] = shareNow();
    return midMono(`${f2(a)} + ${f2(b)} = ${f2(a + b)}`, 0, -80, 92, 'yellow');
  });
  show(soft, 'names', [logitsTag, weightsTag]);
  soft.after('exp', () => stage.play(fadeIn(eFormula), { duration: 0.3 }));
  soft.after('shares', () => {
    stage.play(
      barsVisible.to(0, {
        duration: 0.25,
      }),
      fadeOut(logitsTag, {
        duration: 0.25,
      }),
      {
        duration: 0.25,
      },
    );
    stage.play(
      shareOn.to(1, {
        duration: 0.2,
      }),
      fadeIn(singShareBar, {
        scale: 0.96,
      }),
      fadeIn([birdsName, singName]),
      {
        duration: 0.6,
      },
    );
  });
  soft.on('compete', () =>
    stage.play(
      fadeOut(eFormula, {
        duration: 0.16,
      }),
      arrive(fadeIn(sumLine)),
      {
        duration: 0.42,
      },
    ),
  );
  soft.on('turn-up', () =>
    stage.play(
      boost.to(1, {
        duration: 1.5,
        ease: smoother,
      }),
    ),
  );
  soft.on('total', () =>
    stage.play(
      boost.to(0, {
        duration: 0.9,
        ease: smoother,
      }),
    ),
  );
  leave(soft, [singShareBar, birdsName, singName, weightsTag, sumLine, eqC, bars]);
}
