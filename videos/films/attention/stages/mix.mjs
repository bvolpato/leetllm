import assert from 'node:assert/strict';
import {
  arrow,
  axes,
  draw,
  dynamic,
  fadeIn,
  flash,
  line,
  smoother,
  text,
  tex,
  write,
} from 'vizmatic/stage';
import { clearAxisNumbers, sceneHeading } from '../../../stage-lessons/kit.mjs';
import { fadeOut, fade, f2, bmatrix, prose, mono, midMath } from '../defaults.mjs';
import { V, WEIGHTS, OUTPUT, DROPPED_SHARE, DROPPED_OUTPUT } from '../model.mjs';

/** The answer is a mixture. */
export function buildMix(stage, narration, { show }, { wordNodes }) {
  const mix = narration.scene('mix');
  sceneHeading(stage, mix, narration.title('mix'));
  const vplane = axes({
    x: [0, 2.4],
    y: [0, 2.4],
    width: 800,
    height: 800,
    xStep: 0.5,
    yStep: 0.5,
    grid: true,
    labelSize: 36,
    tips: false,
  }).at(-440, 60);
  clearAxisNumbers(vplane);
  const vp = (x, y) => vplane.world(x, y);
  const vBirds = arrow(vp(0, 0), vp(...V[0]), {
    stroke: 'blue',
    width: 5,
    tip: 24,
  });
  const vSing = arrow(vp(0, 0), vp(...V[1]), {
    stroke: 'teal',
    width: 5,
    tip: 24,
  });
  const vbLabel = tex('v_{\\text{birds}} = [2,\\ 1]', {
    size: 50,
    color: 'blue',
  }).moveTo([vp(...V[0])[0] + 60, vp(...V[0])[1] + 104]);
  const vsLabel = tex('v_{\\text{sing}} = [1,\\ 2]', {
    size: 50,
    color: 'teal',
  }).moveTo([vp(...V[1])[0] + 40, vp(...V[1])[1] - 50]);
  const blend = stage.value(0);
  const w = WEIGHTS[1];
  const legA = dynamic(() => {
    const amount = blend.value;
    if (amount <= 0.001) return null;
    return arrow(vp(0, 0), vp(V[0][0] * w[0] * amount, V[0][1] * w[0] * amount), {
      stroke: 'blue',
      width: 8,
      tip: 22,
    });
  });
  const tail = stage.value(0);
  const legB = dynamic(() => {
    if (blend.value <= 0.001) return null;
    const a = tail.value,
      start = [V[0][0] * w[0] * a, V[0][1] * w[0] * a];
    return arrow(
      vp(...start),
      vp(start[0] + V[1][0] * w[1] * blend.value, start[1] + V[1][1] * w[1] * blend.value),
      {
        stroke: 'teal',
        width: 8,
        tip: 22,
      },
    );
  });
  const resultArrow = arrow(vp(0, 0), vp(...OUTPUT[1]), {
    stroke: 'yellow',
    width: 7,
    tip: 28,
  });
  const between = line(vp(...V[0]), vp(...V[1]), {
    stroke: 'faint',
    width: 2.5,
    dash: [8, 8],
  });
  const MIX_X = 90;
  const vec = (pair) => `[${pair.map(f2).join(',\\ ')}]`;
  const scaledBirds = V[0].map((x) => x * w[0]),
    scaledSing = V[1].map((x) => x * w[1]);
  // The rounded parts on screen still add up to the rounded answer.
  [0, 1].forEach((i) =>
    assert.equal(f2(+f2(scaledBirds[i]) + +f2(scaledSing[i])), f2(OUTPUT[1][i])),
  );
  const mixEq = tex(`o = ${f2(w[0])}\\, v_{\\text{birds}} + ${f2(w[1])}\\, v_{\\text{sing}}`, {
    size: 64,
  })
    .moveTo([0, -310])
    .alignTo([MIX_X, 0], 'left');
  const partBirds = tex(`${f2(w[0])} \\times [2,\\ 1] = ${vec(scaledBirds)}`, {
    size: 62,
    color: 'blue',
  })
    .moveTo([0, -170])
    .alignTo([MIX_X, 0], 'left');
  const partSing = tex(`${f2(w[1])} \\times [1,\\ 2] = ${vec(scaledSing)}`, {
    size: 62,
    color: 'teal',
  })
    .moveTo([0, -60])
    .alignTo([MIX_X, 0], 'left');
  const mixAnswer = tex(`o = [${f2(OUTPUT[1][0])},\\ ${f2(OUTPUT[1][1])}]`, {
    size: 112,
    color: 'yellow',
  })
    .moveTo([0, 110])
    .alignTo([MIX_X, 0], 'left');
  const handsBack = prose('What attention\nhands back to sing', MIX_X, 290, 72, 'ink', {
    leading: 1.12,
  });
  const notCopied = prose('Blended, not copied.', MIX_X, 430, 64, 'yellow');
  // Before the sum starts, the right side recalls the shares and the values they are about to scale.
  const howMuch = text('How much', {
    font: 'text-serif',
    size: 84,
    color: 'dim',
  })
    .moveTo([0, -310])
    .alignTo([MIX_X, 0], 'left');
  const shares = tex(`[${f2(w[0])},\\ ${f2(w[1])}]`, {
    size: 104,
    color: 'yellow',
  })
    .moveTo([0, -180])
    .alignTo([MIX_X, 0], 'left');
  const whatMoves = text('What actually moves', {
    font: 'text-serif',
    size: 84,
    color: 'dim',
  })
    .moveTo([0, 10])
    .alignTo([MIX_X, 0], 'left');
  const valuesTable = tex(bmatrix(V), {
    size: 124,
    color: 'green',
  })
    .moveTo([0, 220])
    .alignTo([MIX_X, 0], 'left');
  mix.at(0.15, () =>
    stage.play(
      draw(vplane.grid, {
        lag: 0.02,
      }),
      draw(vplane.lines),
      fadeIn(vplane.numbers),
      fadeIn([howMuch, shares], {
        shift: [0, 12],
      }),
      {
        duration: 0.8,
      },
    ),
  );
  mix.on('values-appear', () =>
    stage.play(write(whatMoves), write(valuesTable), {
      duration: 0.8,
    }),
  );
  mix.on('birds-value', () =>
    stage.play(
      draw(vBirds, {
        lag: 1,
      }),
      write(vbLabel),
      {
        duration: 0.9,
      },
    ),
  );
  mix.on('sing-value', () =>
    stage.play(
      draw(vSing, {
        lag: 1,
      }),
      write(vsLabel),
      draw(between),
      {
        duration: 0.9,
      },
    ),
  );
  mix.on('scale-values', () => {
    stage.play(fadeOut([howMuch, shares, whatMoves, valuesTable]), {
      duration: 0.2,
    });
    stage.play(
      fadeIn(legA),
      fadeIn(legB),
      fade(vBirds, 0.3),
      fade(vSing, 0.3),
      write(mixEq),
      blend.to(1, {
        duration: 1.6,
        ease: smoother,
      }),
      {
        duration: 1.6,
      },
    );
  });
  mix.after('scale-values', () => stage.play(fadeIn([partBirds, partSing]), { duration: 0.2 }));
  mix.on('tip-to-tail', () =>
    stage.play(
      tail.to(1, {
        duration: 1,
        ease: smoother,
      }),
    ),
  );
  mix.after('result', () =>
    stage.play(
      draw(resultArrow, {
        lag: 1,
      }),
      write(mixAnswer),
      {
        duration: 1.1,
      },
    ),
  );
  mix.on('new-meaning', () => {
    stage.play(
      write(handsBack),
      flash(vp(...OUTPUT[1]), {
        color: 'yellow',
        radius: 70,
      }),
      {
        duration: 0.9,
      },
    );
  });
  show(mix, 'blended', notCopied);
  // The point stays on the line while the shares add to one. Attention dropout can break that.
  const onLine = line(vp(...V[0]), vp(...V[1]), {
    stroke: 'yellow',
    width: 5,
  });
  const lineTag = prose(
    'Shares add to one,\nso the point stays on the line.',
    MIX_X,
    -250,
    66,
    'yellow',
    {
      leading: 1.14,
    },
  );
  const sumOne = midMath(`${f2(w[0])} + ${f2(w[1])} = 1`, MIX_X + 300, -90, 76, 'yellow');
  const dropTag = prose('Dropout at p = 0.5 can drop birds:', MIX_X, 40, 50, 'orange');
  const dropSum = midMath(
    `0 + \\frac{${f2(w[1])}}{0.5} = ${f2(DROPPED_SHARE)}`,
    MIX_X + 300,
    150,
    66,
    'orange',
  );
  const dropArrow = arrow(vp(0, 0), vp(...DROPPED_OUTPUT), {
    stroke: 'orange',
    width: 7,
    tip: 26,
  });
  const dropPoint = mono(
    `[${DROPPED_OUTPUT.map(f2).join(', ')}]`,
    vp(...DROPPED_OUTPUT)[0] + 26,
    vp(...DROPPED_OUTPUT)[1] + 8,
    42,
    'orange',
  );
  const laterTag = prose(
    'Later steps in the model\ncan move the point too.',
    MIX_X,
    330,
    66,
    'dim',
    {
      leading: 1.14,
    },
  );
  mix.on('on-line', () =>
    stage.play(
      fadeOut([mixEq, partBirds, partSing, mixAnswer, handsBack, notCopied], {
        duration: 0.3,
      }),
      draw(onLine),
      fadeIn([lineTag, sumOne], {
        shift: [0, 10],
      }),
      {
        duration: 0.8,
      },
    ),
  );
  mix.on('dropout', () =>
    stage.play(
      fadeOut(vsLabel, {
        duration: 0.2,
      }),
      draw(dropArrow, {
        lag: 1,
      }),
      fadeIn([dropTag, dropSum, dropPoint], {
        shift: [0, 10],
      }),
      {
        duration: 0.8,
      },
    ),
  );
  show(mix, 'later', laterTag);
  const mixParts = [
    vplane,
    vBirds,
    vSing,
    vbLabel,
    legA,
    legB,
    resultArrow,
    between,
    onLine,
    lineTag,
    sumOne,
    dropTag,
    dropSum,
    dropArrow,
    dropPoint,
    laterTag,
    wordNodes[0],
    wordNodes[4],
  ];
  stage.at(mix.end - 0.5, () =>
    stage.play(fadeOut(mixParts), {
      duration: 0.45,
    }),
  );
}
