import { C, avg, fmt, sum } from './press.mjs';
import {
  nextLogits,
  nextProbabilities as probabilities,
  words,
  draws,
  pick,
  tokenDraws,
  phrase,
  conditional,
  product,
  loss,
  sequenceLoss,
  models,
  once,
  twice,
} from './examples.mjs';

const colors = ['#9ad9ce', '#e8b16e', '#91b6e9', '#d19ac5'];
function tokenStrip(p, y, amount = 1) {
  const x = 75,
    width = 1050;
  p.rect(x, y, width, 59, '#38505a');
  let left = x;
  probabilities.forEach((v, i) => {
    const section = width * v;
    p.rect(left, y, section * amount, 59, colors[i]);
    left += section;
  });
}
export function softmax(p) {
  p.head('Next-token model', 'Finish “function returns the …”');
  const hasMass = p.cue(0, 'Exponentiate each score', 0.9);
  if (p.b < 4) {
    const shift = Math.max(...nextLogits) * p.cue(2, 'Subtract the largest logit', 1.2);
    const weights = nextLogits.map((v) => Math.exp(v - shift)),
      total = sum(weights);
    const namesX = [408, 609, 812, 1014];
    p.text('Candidate', 71, 182, 22, p.quiet);
    p.text(shift ? 'Shifted logit' : 'Raw logit', 71, 251, 22, p.quiet);
    if (hasMass > 0) {
      p.text('Exponential', 71, 312, 22, p.quiet);
      p.text('Share', 71, 369, 22, p.quiet);
    }
    words.forEach((word, i) => {
      p.text(word, namesX[i], 182, 28, colors[i], 'center');
      p.mono((nextLogits[i] - shift).toFixed(2), namesX[i], 251, 28, p.ink, 'center');
      if (hasMass > 0) {
        p.mono(weights[i].toFixed(3), namesX[i], 312, 24, p.ink, 'center');
        p.mono((weights[i] / total).toFixed(3), namesX[i], 369, 24, colors[i], 'center');
      }
    });
    if (hasMass > 0) tokenStrip(p, 425);
    p.evidence(
      p.b >= 3
        ? 'The 0.8 logit gap gives odds of ' +
            Math.exp(nextLogits[0] - nextLogits[1]).toFixed(2) +
            ' to 1 for result versus value.'
        : hasMass
          ? 'Divide every weight by their shared sum, ' + total.toFixed(3) + '.'
          : 'Raw logits can be negative. Convert them to positive weights to build a distribution.',
    );
  } else {
    words.forEach((s, i) => {
      p.rect(75 + i * 265, 169, 13, 23, colors[i]);
      p.text(s, 101 + i * 265, 182, 23);
    });
    tokenStrip(p, 288);
    const sampling = p.cue(4, 'To sample', 0);
    if (p.b === 4 && sampling) {
      const i = Number(p.cue(4, 'Make another draw', 0)),
        u = draws[i],
        x = 75 + 1050 * u;
      const selected = i === 0
        ? p.cue(4, 'result. Here the sample', 0)
        : p.cue(4, 'None. Both draws', 0);
      p.line(x, 232, x, 282, p.ink, 4);
      p.dot(x, 282, 7, p.ink);
      p.mono('u = ' + u.toFixed(3), x, 216, 21, p.ink, 'center');
      p.text('Draw ' + (i + 1) + (selected ? ' selects ' + words[pick(u)] : '   Which segment?'),
        75, 386, 28, selected ? colors[pick(u)] : p.ink);
    } else if (!sampling) p.text('Greedy choice   ' + (p.cue(4, 'result, every time', 0) ? words[0] : 'Widest segment'),
      75, 386, 28, colors[0]);
    if (p.b === 5) {
      const count = 2 + Math.floor(998 * p.cue(5, 'Keep drawing', 1.7));
      const counts = words.map((_, i) => tokenDraws.slice(0, count).filter((v) => v === i).length);
      p.text('Observed in ' + fmt(count) + ' draws', 75, 444, 20, p.quiet);
      counts.forEach((v, i) => p.mono(words[i] + ' ' + v, 75 + i * 265, 487, 22, colors[i]));
    }
    (p.b === 5 ? p.evidence : p.foot)(
      p.b === 5
        ? 'Expected copies of result in 1,000 draws ≈ ' +
            Math.round(1000 * probabilities[0]) +
            '. The observed count depends on the draws.'
        : 'A uniform point on the strip samples one token. A wider segment receives more points.',
    );
  }
}

export function chain(p) {
  p.head('Sequence likelihood', 'What chance did the model give this line?');
  if (p.b === 3 || p.b === 4) {
    const n = Math.round(200 * p.cue(3, 'Follow the sum of logs', 2.2));
    const x = 93,
      y = 232,
      w = 596,
      h = 209;
    p.text('A longer line     ·     each token has p = 0.01', 76, 172, 25);
    p.line(x, y, x, y + h, p.rule);
    p.line(x, y, x + w, y, p.rule, 1, [5, 5]);
    p.ruleScale(x, y + h, w, 0, 200, [0, 100, 200], (v) => String(v));
    const yy = y + h * ((-n * Math.log(0.01)) / 1000),
      xx = x + (w * n) / 200;
    p.line(x, y, xx, yy, colors[0], 4);
    p.dot(xx, yy, 7, colors[0]);
    p.mono('0', x - 12, y, 18, p.quiet, 'right');
    p.mono('−1,000', x - 9, y + h, 16, p.quiet, 'right');
    p.text('log probability', x + 12, y - 20, 18, p.quiet);
    p.text('Tokens scored', x + w / 2, 504, 19, p.quiet, 'center');
    p.text('Binary64 product', 766, 262, 22, p.quiet);
    p.mono((0.01 ** n).toExponential(1), 765, 313, 36);
    p.text('Sum of natural logs', 766, 391, 22, p.quiet);
    p.mono((n * Math.log(0.01)).toFixed(2), 765, 442, 36, colors[0]);
    p.evidence(
      p.b === 4
        ? 'Keep the finite log probability. A truly impossible token would contribute −∞.'
        : 'The exact product after ' + n + ' tokens is 10 raised to ' + -2 * n + '.',
    );
    return;
  }
  const lossMode = p.b >= 5;
  phrase.forEach((token, i) => {
    const x = 74 + i * 359;
    p.text('Given ' + ['start', '“rain”', '“rain fell”'][i], x, 179, 22, p.quiet);
    p.ticket(x, 214, 329, 167, '#29444b');
    p.serif(token, x + 22, 270, 48, colors[i]);
    p.mono('p = ' + conditional[i].toFixed(1), x + 24, 339, 26);
    if (lossMode) p.mono(loss(conditional[i]).toFixed(3) + ' nats', x + 4, 438, 25, colors[i]);
  });
  if (!lossMode) {
    p.mono(
      '0.5  ×  0.2  ×  0.1  =  ' +
        (p.b === 2 && p.cue(2, 'Multiply the three') > 0 ? product(conditional).toFixed(2) : '?'),
      74,
      459,
      37,
    );
    p.foot('Each probability conditions on the prefix already supplied.');
  } else {
    p.evidence(
      p.b === 6
        ? 'Perplexity = exp(mean loss) ≈ ' +
            Math.exp(sequenceLoss).toFixed(2) +
            '. Compare like data, tokenization and masks.'
        : 'Mean of the three unrounded losses ≈ ' + sequenceLoss.toFixed(3) + ' nats per scored token.',
    );
  }
}

export function targetLoss(p) {
  const compareInputs = p.cue(3, 'Look what happens', 0);
  p.head('Cross-entropy on observed targets', compareInputs
    ? 'What does a second softmax do to the target loss?' : 'How much does the fourth token cost?');
  if (p.b === 0) {
    const left = 104,
      w = 650,
      y = 448,
      h = 232;
    p.text('Loss in nats', left, 167, 23, p.quiet);
    p.line(left, y - h, left, y, p.rule);
    p.ruleScale(left, y, w, 0, 1, [0, 0.25, 0.5, 0.75, 1], (v) => String(v));
    const yy = (v) => y - (h * loss(v)) / 5;
    for (let i = 1; i < 200; i++) {
      const a = 0.01 + (0.99 * (i - 1)) / 199,
        b = 0.01 + (0.99 * i) / 199;
      p.line(left + w * a, yy(a), left + w * b, yy(b), colors[0], 3);
    }
    [0.9, 0.01].forEach((v, i) => {
      p.dot(left + w * v, yy(v), 8, colors[i]);
      p.mono('p = ' + v, 838, 223 + i * 127, 25, colors[i]);
      p.serif(loss(v).toFixed(3) + ' nats', 836, 268 + i * 127, 37);
    });
    p.text('Probability of the observed token', left + w / 2, 505, 20, p.quiet, 'center');
    p.foot('−ln(p) increases sharply when the model assigns very little probability to the target.');
  } else if (!compareInputs) {
    const fourth = models[2][3];
    const premise = p.cue(1, 'point zero zero one', 0);
    const cost = p.cue(2, 'eight nats', 0);
    const smallCosts = p.cue(2, 'one zero nats', 0);
    const total = p.cue(2, 'Add the four losses', 0);
    const mean = p.cue(2, 'four nats per token', 0);
    const names = ['Moderate', 'Unsure', 'Confident'];
    p.text('Bar height = loss in nats. Under each bar is the probability of its observed target.', 73, 167, 23, p.quiet);
    models.forEach((values, j) => {
      const x = 80 + 359 * j,
        base = 416;
      p.text(names[j], x, 221, 26, colors[j]);
      for (let k = 0; k < 4; k++) {
        const amount = loss(values[k]) * 24,
          xx = x + k * 67;
        const last = j === 2 && k === 3;
        if (!last || cost) p.rect(xx, base - amount, 46, amount, colors[j]);
        p.mono(last && !premise ? '?' : String(values[k]), xx + 23, base + 25, 17, p.ink, 'center');
        if (last && cost) {
          p.line(xx + 48, base - amount, xx + 61, base - amount, colors[j]);
          p.mono(loss(fourth).toFixed(3), xx + 66, base - amount, 21, colors[j]);
          p.text('nats', xx + 66, base - amount + 25, 18, p.quiet);
        }
      }
      if (j === 2 && smallCosts)
        p.mono('3 × ' + loss(values[0]).toFixed(3) + ' nats', x, base - 32, 19, colors[j]);
      p.line(x - 5, base, x + 258, base, p.rule, 1);
      p.text(
        j === 2 && !mean ? 'Mean   ?' : 'Mean ' + avg(values.map(loss)).toFixed(3) + ' nats',
        x,
        489,
        22,
      );
    });
    if (total) {
      const small = loss(models[2][0]).toFixed(5);
      p.foot('Mean ≈ (3 × ' + small + ' + ' + loss(fourth).toFixed(5) + ') / 4' +
        (mean ? ' ≈ ' + avg(models[2].map(loss)).toFixed(3) + ' nats per token' : ' ≈ ?'));
    } else if (premise) {
      p.foot('Fourth target loss = −ln(' + fourth + ') ' +
        (cost ? '≈ ' + loss(fourth).toFixed(3) + ' nats' : '= ?'));
    }
  } else {
    p.text('Same target B     ·     raw logits [2, 1, 0]', 76, 167, 25);
    [once, twice].forEach((values, i) => {
      const x = 78 + i * 559;
      p.text(i === 0 ? 'Logits → softmax' : 'Probabilities → softmax again', x, 237, 24, colors[i]);
      let offset = x;
      values.forEach((v, j) => {
        p.rect(offset, 292, 492 * v, 65, colors[j]);
        p.text('ABC'[j], offset + (492 * v) / 2, 325, 24, C.ink, 'center');
        offset += 492 * v;
      });
      p.mono('P(B) = ' + values[1].toFixed(3), x, 403, 27);
      p.text('Target loss = ' + loss(values[1]).toFixed(3) + ' nats', x, 469, 22, p.quiet);
    });
    p.evidence('Pass logits to PyTorch CrossEntropyLoss. Check which target tokens enter the mean.');
  }
}
