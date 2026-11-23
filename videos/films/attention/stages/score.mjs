import {
  arrow,
  decimal,
  draw,
  dynamic,
  fade as fadeTo,
  fadeIn,
  indicate,
  smoother,
  text,
  tex,
  write,
} from 'vizmatic/stage';
import { sceneHeading } from '../../../stage-lessons/kit.mjs';
import { LINEAR, brief, fadeOut, fade, f2, prose, math } from '../defaults.mjs';
import { dot, SHORT_KEY, LONG_KEY } from '../model.mjs';

/** A match is a dot product. */
export function buildScore(
  stage,
  narration,
  { show },
  {
    plane,
    p,
    qs,
    ks,
    queryArrow,
    birdsKey,
    singKey,
    qLabel,
    bLabel,
    sLabel,
    COLUMN,
    roles,
    toyTag,
  },
) {
  const score = narration.scene('score');
  sceneHeading(stage, score, narration.title('score'));
  const formula = tex('q \\cdot k = q_1 k_1 + q_2 k_2', {
    size: 88,
  })
    .moveTo([0, -270])
    .alignTo([COLUMN, 0], 'left');
  const QLEN = Math.hypot(...qs),
    REST = Math.atan2(qs[1], qs[0]);
  const angle = stage.value(REST);
  const swing = dynamic(() => {
    const a = angle.value,
      x = Math.cos(a) * QLEN,
      y = Math.sin(a) * QLEN;
    return arrow(p(0, 0), p(x, y), {
      stroke: 'yellow',
      width: 6,
      tip: 26,
    });
  });
  swing.opacity(0);
  const swingLabel = dynamic(() => {
    const a = angle.value,
      tip = p(Math.cos(a) * QLEN, Math.sin(a) * QLEN);
    return tex('q_{\\text{sing}}', {
      size: 58,
      color: 'yellow',
    }).moveTo([tip[0] + 62, tip[1] - 30]);
  });
  swingLabel.opacity(0);
  const liveScore = dynamic(() => {
    const a = angle.value,
      value = Math.cos(a) * QLEN * ks[0] + Math.sin(a) * QLEN * ks[1];
    return decimal(() => value, {
      digits: 2,
      font: 'mono',
      size: 240,
      color: 'teal',
    }).at(COLUMN + 320, 100);
  });
  const liveLabel = tex('q \\cdot k_{\\text{sing}}', {
    size: 76,
    color: 'teal',
  })
    .moveTo([0, -90])
    .alignTo([COLUMN, 0], 'left');
  const birdsTag = tex('q \\cdot k_{\\text{birds}}', {
    size: 60,
    color: 'blue',
  })
    .moveTo([0, -170])
    .alignTo([COLUMN, 0], 'left');
  const birdsLine = tex('0.5(0.8) + 1(0.2) = 0.60', {
    size: 72,
    color: 'blue',
  })
    .moveTo([0, -85])
    .alignTo([COLUMN, 0], 'left');
  const singTag = tex('q \\cdot k_{\\text{sing}}', {
    size: 60,
    color: 'teal',
  })
    .moveTo([0, 15])
    .alignTo([COLUMN, 0], 'left');
  const singLine = tex('0.5(0.3) + 1(0.9) = 1.05', {
    size: 72,
    color: 'teal',
  })
    .moveTo([0, 100])
    .alignTo([COLUMN, 0], 'left');
  score.on('multiply', () =>
    stage.play(
      ...roles.map((node) =>
        fade(node, 0, {
          duration: 0.16,
        }),
      ),
      fadeOut(toyTag, {
        duration: 0.16,
      }),
      brief(write(formula), 0.85, 0.12, LINEAR),
      fadeIn(liveLabel),
      fadeIn(liveScore),
      {
        duration: 1,
      },
    ),
  );
  // Word times decide this motion: aligned and high through "it's high", then away during
  // "Pointing apart, it falls", and back only after the line ends.
  const towardKey = Math.atan2(ks[1], ks[0]);
  score.on('turns', () => {
    stage.play(fade(queryArrow, 0), fade(qLabel, 0), fade(swing, 1), fade(swingLabel, 1), {
      duration: 0.2,
    });
    stage.play(
      angle.to(towardKey, {
        duration: Math.max(0.4, score.cue('same-way').start - score.cue('turns').start - 0.2),
        ease: smoother,
      }),
    );
  });
  // The sweep crosses the birds key's label, so the label steps aside until the arrow has passed back.
  score.on('apart', () =>
    stage.play(
      angle.to(0, {
        duration: score.cue('falls').end - score.cue('apart').start,
        ease: smoother,
      }),
      fade(bLabel, 0, {
        duration: 0.2,
      }),
    ),
  );
  score.after(
    'falls',
    () => {
      stage.play(
        angle.to(REST, {
          duration: 0.45,
          ease: smoother,
        }),
        brief(fadeTo(bLabel, 1), 0.2, 0.3, LINEAR),
      );
      stage.play(
        fadeOut([liveLabel, liveScore]),
        fade(queryArrow, 1),
        fade(qLabel, 1),
        fade(swing, 0),
        fade(swingLabel, 0),
        {
          duration: 0.2,
        },
      );
    },
    0.05,
  );
  // Length counts: a long key beats a short key that points exactly along the query.
  const shortArrow = arrow(p(0, 0), p(...SHORT_KEY), {
    stroke: 'pink',
    width: 7,
    tip: 24,
  });
  const longArrow = arrow(p(0, 0), p(...LONG_KEY), {
    stroke: 'orange',
    width: 7,
    tip: 26,
  });
  const shortTag = prose('A short key, pointing the same way', COLUMN, -130, 54, 'pink');
  const shortLine = math(
    `0.5(${SHORT_KEY[0]}) + 1(${SHORT_KEY[1]}) = ${f2(dot(qs, SHORT_KEY))}`,
    COLUMN,
    -40,
    74,
    'pink',
  );
  const longTag = prose('A long key, off to one side', COLUMN, 100, 54, 'orange');
  const longLine = math(
    `0.5(${LONG_KEY[0]}) + 1(${LONG_KEY[1]}) = ${f2(dot(qs, LONG_KEY))}`,
    COLUMN,
    190,
    72,
    'orange',
  );
  const longWins = prose('Length as well as angle.', COLUMN, 320, 70, 'yellow');
  score.on('length', () =>
    stage.play(fade(birdsKey, 0.2), fade(singKey, 0.2), fade(bLabel, 0.2), fade(sLabel, 0.2), {
      duration: 0.3,
    }),
  );
  score.on('longer', () =>
    stage.play(
      draw(shortArrow, {
        lag: 1,
      }),
      draw(longArrow, {
        lag: 1,
      }),
      fadeIn([shortTag, shortLine, longTag, longLine], {
        shift: [0, 8],
      }),
      {
        duration: 0.8,
      },
    ),
  );
  show(score, 'length-angle', longWins);
  score.on('real-ones', () =>
    stage.play(
      fadeOut([shortArrow, longArrow, shortTag, shortLine, longTag, longLine, longWins]),
      fade(birdsKey, 1),
      fade(singKey, 1),
      fade(bLabel, 1),
      fade(sLabel, 1),
      {
        duration: 0.35,
      },
    ),
  );
  score.after('birds-score', () =>
    stage.play(
      write(birdsTag),
      write(birdsLine),
      indicate(birdsKey, {
        color: 'blue',
        scale: 1.02,
      }),
      {
        duration: 1.6,
      },
    ),
  );
  score.on('sing-score', () =>
    stage.play(
      write(singTag),
      write(singLine),
      indicate(singKey, {
        color: 'teal',
        scale: 1.02,
      }),
      {
        duration: 1.3,
      },
    ),
  );
  const insight = text("Sing matches itself better,\nbut birds isn't zero.", {
    font: 'text-serif',
    size: 62,
    color: 'yellow',
    leading: 1.16,
  })
    .moveTo([0, 300])
    .alignTo([COLUMN, 0], 'left');
  score.on('not-zero', () =>
    stage.play(write(insight), {
      duration: 0.9,
    }),
  );
  const planeParts = [
    plane,
    queryArrow,
    birdsKey,
    singKey,
    qLabel,
    bLabel,
    sLabel,
    swing,
    swingLabel,
  ];
  stage.at(score.end - 0.5, () =>
    stage.play(
      ...planeParts.map((node) => fadeOut(node)),
      fadeOut([formula, birdsTag, birdsLine, singTag, singLine, insight]),
      {
        duration: 0.45,
      },
    ),
  );
}
