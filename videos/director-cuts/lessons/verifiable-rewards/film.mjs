import assert from 'node:assert/strict';
import { openingFields, capacityScore } from '../../../films/verifiable-rewards/capacity.mjs';
import { rlvrGroupUpdate } from '../../../films/verifiable-rewards/arithmetic.mjs';

const title = 'Why did the wrong revision become more likely?';
const beats = [
  {
    id: 'second-box',
    say: 'Watch that second box. Fourteen times twelve is a hundred and sixty-eight. The model had it, then changed its answer to a hundred and forty-eight. What will the checker see?',
    hold: 1.15,
  },
  {
    id: 'pencil-stops',
    say: 'The rule says to read the first box. There’s the match. The checker gives one point to the whole answer, including the part where the model changed the number.',
    hold: 0.7,
  },
  {
    id: 'same-question',
    say: 'The model sampled three answers to that question. A stopped at the right number. C gave just the wrong one. Two answers earned a point, so B scored above the group average.',
    hold: 0.55,
  },
  {
    id: 'one-step',
    say: 'Suppose these are the only three answers our model can give, each equally likely. Take one training step that favors answers with above-average scores. Follow B. Its chance of being sampled again rises from one in three to nearly thirty-six percent.',
    hold: 0.85,
  },
  {
    id: 'count-the-boxes',
    say: 'Try a different rule on the same three answers. To earn a point, an answer must have exactly one box, and the number inside must match the key. Count the boxes in B.',
    hold: 1.5,
  },
  {
    id: 'same-step',
    say: 'B loses its point. Only A passes, so B is now below the group average. Go back to the starting model and repeat the same step. This time B falls to just under thirty-one percent.',
    hold: 0.7,
  },
  {
    id: 'the-fork',
    say: 'That’s reinforcement learning with verifiable rewards. A program scores the sampled answer. Counting that second box turned the training signal around for the entire response.',
    hold: 2.5,
  },
];

const expected = 14 * 12;
// Use the two submissions from the original opening and a third that boxes only the revision.
const fields = [...openingFields, [openingFields[1][1]]];
const responses = fields.map(row => row.join(' then '));
const numbers = fields.map(row => row.map(field => field.match(/\d+/)[0]));
const rate = 0.3;
const start = 1 / responses.length;

function scoreGroup(singleBox) {
  return responses.map(response => capacityScore(response, expected, singleBox));
}
const firstBox = scoreGroup(false);
const oneBox = scoreGroup(true);
const probabilityB = (rewards, step) => rlvrGroupUpdate(rewards, rate, step).probabilities[1];
const percent = p => (100 * p).toFixed(1) + '%';

function check() {
  assert.deepEqual(numbers, [['168'], ['168', '148'], ['148']]);
  assert.deepEqual(firstBox, [1, 1, 0]);
  assert.deepEqual(oneBox, [1, 0, 0]);
  for (const rewards of [firstBox, oneBox]) {
    assert.equal(probabilityB(rewards, 0), start);
    const update = rlvrGroupUpdate(rewards, rate);
    assert.ok(Math.abs(update.probabilities.reduce((a, b) => a + b) - 1) < 1e-12);
    assert.equal(Math.sign(update.advantages[1]), Math.sign(rewards[1] - update.mean));
  }
  assert.equal(percent(probabilityB(firstBox, 1)), '35.6%');
  assert.equal(percent(probabilityB(oneBox, 1)), '30.9%');
  return true;
}

const ink = '#28223d';
const blue = '#304abb';
const raspberry = '#ae224f';
const paper = '#fff8e4';
const bound = t => Math.max(0, Math.min(1, t));
const ease = t => { t = bound(t); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;

function line(c, points, color, width) {
  c.beginPath();
  c.moveTo(...points[0]);
  for (const p of points.slice(1)) c.lineTo(...p);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}

function polygon(c, points, color) {
  c.beginPath();
  c.moveTo(...points[0]);
  for (const p of points.slice(1)) c.lineTo(...p);
  c.closePath();
  c.fillStyle = color;
  c.fill();
}

function type(c, value, x, y, size, face = 'Sans', color = ink, align = 'left', weight = 500) {
  c.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  c.textAlign = align;
  c.fillStyle = color;
  c.fillText(value, x, y);
}

function layer(c, alpha, paint) {
  if (alpha <= 0) return;
  c.save();
  c.globalAlpha *= bound(alpha);
  paint();
  c.restore();
}

const punctures = [223, 545, 864];
const page = [[82, 44], [1851, 44], [1855, 138], [1850, 412], [1855, 979],
  [1828, 1005], [1533, 1007], [995, 1001], [563, 1006], [82, 1002]];

function exercisePaper(c) {
  c.save();
  c.shadowColor = '#14266772';
  c.shadowBlur = 18;
  c.shadowOffsetX = 8;
  c.shadowOffsetY = 16;
  polygon(c, page, '#eee5d1');
  c.restore();
  const wash = c.createLinearGradient(84, 130, 1850, 1030);
  wash.addColorStop(0, '#fffbed');
  wash.addColorStop(0.65, paper);
  wash.addColorStop(1, '#f0e5cb');
  polygon(c, page, wash);
  c.save();
  c.clip();
  for (const spacing of [38, 190]) {
    c.beginPath();
    for (let x = 132; x <= 1855; x += spacing) {
      c.moveTo(x, 44);
      c.lineTo(x + 0.8, 1008);
    }
    for (let y = 114; y < 1010; y += spacing) {
      c.moveTo(82, y);
      c.lineTo(1855, y - 0.8);
    }
    c.strokeStyle = spacing === 38 ? '#6683a82c' : '#567ca92c';
    c.lineWidth = spacing === 38 ? 1.45 : 1.9;
    c.stroke();
  }
  line(c, [[205, 44], [204, 1005]], '#d77e876c', 2.6);
  line(c, [[214, 44], [213, 1005]], '#d77e874f', 1.3);
  // A shallow crease catches light on the side used for the probability sketch.
  const crease = c.createLinearGradient(1158, 0, 1210, 0);
  crease.addColorStop(0, '#55467400');
  crease.addColorStop(0.64, '#55467412');
  crease.addColorStop(0.69, '#fffdf263');
  crease.addColorStop(1, '#fffdf200');
  c.fillStyle = crease;
  c.fillRect(1158, 44, 52, 966);
  for (const y of punctures) {
    c.beginPath();
    c.ellipse(143, y + 2, 18, 19, 0, 0, Math.PI * 2);
    c.fillStyle = '#fffcf4';
    c.fill();
    const hole = c.createLinearGradient(132, y - 16, 148, y + 8);
    hole.addColorStop(0, '#273c86');
    hole.addColorStop(1, '#657bce');
    c.beginPath();
    c.ellipse(143, y, 18, 18.5, 0, 0, Math.PI * 2);
    c.fillStyle = hole;
    c.fill();
  }
  c.restore();
  polygon(c, [[1828, 1005], [1834, 977], [1855, 979]], '#d7cbb6');
}

// Each control-point sequence is one pencil stroke. Sample the curves once so the graphite
// and the pencil tip use the same arc length, including around both loops of the eight.
function penStroke(from, curves) {
  const points = [from];
  for (const [a, b, d, e, x, y] of curves) {
    const [ox, oy] = points.at(-1);
    for (let k = 1; k <= 16; k++) {
      const t = k / 16, s = 1 - t;
      points.push([s**3 * ox + 3*s*s*t*a + 3*s*t*t*d + t**3*x,
                   s**3 * oy + 3*s*s*t*b + 3*s*t*t*e + t**3*y]);
    }
  }
  return points;
}
const glyphs = {
  1: [penStroke([5, 23], [[12, 18, 19, 12, 27, 5], [25, 23, 20, 51, 19, 67]]),
    [[8, 67], [33, 67]]],
  4: [penStroke([30, 5], [[23, 17, 11, 35, 4, 44], [12, 45, 32, 43, 42, 42]]),
    penStroke([33, 18], [[31, 36, 28, 55, 28, 68]])],
  6: [penStroke([38, 6], [[22, 5, 5, 34, 4, 49], [1, 74, 30, 74, 36, 55],
    [42, 36, 23, 29, 6, 46]])],
  8: [penStroke([25, 35], [[12, 28, 9, 18, 16, 10], [27, -3, 47, 7, 39, 21],
    [33, 33, 15, 36, 7, 51], [-2, 71, 25, 78, 35, 60], [43, 47, 34, 40, 25, 35]])],
};

function makeTrace(strokes) {
  const edges = [];
  let length = 0;
  for (const stroke of strokes) {
    for (let i = 1; i < stroke.length; i++) {
      const a = stroke[i - 1], b = stroke[i];
      const distance = Math.hypot(b[0] - a[0], b[1] - a[1]);
      edges.push({ a, b, start: length, distance, lift: i === 1 });
      length += distance;
    }
  }
  return { edges, length };
}

function trace(c, path, amount, color, width) {
  let tip = path.edges[0].a;
  const stop = bound(amount) * path.length;
  c.beginPath();
  c.moveTo(...tip);
  for (const edge of path.edges) {
    if (edge.start >= stop) break;
    if (edge.lift) c.moveTo(...edge.a);
    const f = bound((stop - edge.start) / edge.distance);
    tip = [mix(edge.a[0], edge.b[0], f), mix(edge.a[1], edge.b[1], f)];
    c.lineTo(...tip);
  }
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
  return tip;
}

function numeral(s) {
  return makeTrace([...s].flatMap((digit, n) =>
    glyphs[digit].map(stroke => stroke.map(([x, y]) => [x + 51 * n, y]))));
}
const numerals = new Map([...new Set(numbers.flat())].map(s => [s, numeral(s)]));
const frame = makeTrace([[[2, 3], [78, 1], [202, 3], [199, 111],
  [122, 109], [0, 111], [2, -1], [13, 0]]]);

function box(c, s, x, y, written, enclosed) {
  c.save();
  c.translate(x, y);
  c.lineJoin = 'round';
  c.lineCap = 'round';
  c.save();
  c.translate(31, 23);
  const digitTip = trace(c, numerals.get(s), written, ink, 6.8);
  c.restore();
  const boxTip = trace(c, frame, enclosed, ink, 3.6);
  c.restore();
  const tip = enclosed > 0 ? boxTip : [digitTip[0] + 31, digitTip[1] + 23];
  return [x + tip[0], y + tip[1]];
}

function pencil(c, x, y, color, raised) {
  c.save();
  c.translate(x + 48 * raised, y - 110 * raised);
  c.rotate(-0.83 + 0.07 * raised);
  c.shadowColor = '#3e294c4b';
  c.shadowOffsetX = 8 + 6 * raised;
  c.shadowOffsetY = 13 + 12 * raised;
  c.shadowBlur = 9 + 7 * raised;
  const silhouette = [[0, 0], [48, -13], [356, -13], [378, -10],
    [381, 0], [377, 11], [356, 13], [48, 13]];
  polygon(c, silhouette, '#d9b68a');
  c.shadowColor = 'transparent';
  polygon(c, [[0, 0], [49, -13], [57, -4], [51, 5], [49, 13]], '#ddb888');
  polygon(c, [[0, 0], [15, -4], [13, 4]], '#302a42');
  polygon(c, [[48, -13], [340, -13], [340, 13], [48, 13], [52, 4], [56, -4]], color);
  polygon(c, [[48, -13], [340, -13], [340, -6], [56, -4]], '#ffffff4a');
  polygon(c, [[52, 4], [340, 4], [340, 13], [48, 13]], '#20204040');
  c.fillStyle = '#aaa3ad';
  c.fillRect(339, -13, 24, 26);
  c.fillStyle = '#e2e1d5';
  for (const dx of [342, 346, 357]) c.fillRect(dx, -12, 2, 24);
  polygon(c, [[363, -12], [375, -12], [382, -8], [382, 8], [375, 12], [363, 12]], '#d99491');
  c.restore();
}

const underline = makeTrace([penStroke([0, 0], [[72, 4, 151, -3, 202, -2]])]);
const brace = makeTrace([penStroke([0, -9], [[1, 2, 4, 10, 19, 10],
  [108, 9, 170, 7, 239, 9], [253, 9, 262, 14, 267, 23],
  [271, 13, 278, 9, 292, 9], [385, 7, 460, 9, 520, 7], [539, 8, 541, -1, 541, -11]])]);

const yB = 512;
const rows = [320, yB, 706];
const xFirst = 333;
const xSecond = 673;
const baseY = yB + 9;
const plotX = 1269;
const endX = 1568;
const plotY = probability => baseY - (probability - start) * 7230;

function chanceTrace(c, rewards, step, color, rule, above, emphasis) {
  const end = probabilityB(rewards, step);
  const x = mix(plotX, endX, step), y = plotY(end);
  c.save();
  c.globalAlpha *= emphasis;
  if (step > 0) {
    line(c, [[plotX, baseY], [x, y]], color, 6.5);
    c.fillStyle = color;
    c.beginPath();
    c.arc(x, y, 10, 0, 2 * Math.PI);
    c.fill();
  }
  layer(c, ease((step - 0.74) / 0.26), () => {
    type(c, percent(probabilityB(rewards, 1)), endX + 28, y + 21, 72, 'Serif', color);
    type(c, rule, endX + 30, y + (above ? -43 : 72), 42, 'Sans', color);
  });
  if (step > 0 && step < 1) {
    layer(c, Math.min(step, 1 - step) * 9, () => pencil(c, x, y, color, 0));
  }
  c.restore();
}

function draw(c, clock) {
  const { index, elapsed } = clock;
  const cue = (beat, phrase, span) =>
    index > beat ? 1 : index < beat ? 0 : ease(clock.reveal(phrase, span));
  const read = cue(1, 'The rule says', 1.25);
  const firstPoint = cue(1, 'There’s the match', 0.45);
  const wide = cue(2, 'The model sampled', 1.55);
  const answerA = cue(2, 'The model sampled', 1.2);
  const answerC = cue(2, 'three answers', 1.2);
  const mean = cue(2, 'Two answers earned', 0.55);
  const plot = cue(3, 'Suppose these', 0.85);
  const oldStep = cue(3, 'Take one training step', 2.0);
  const newRule = cue(4, 'Try a different rule', 1.0);
  const counted = cue(4, 'Count the boxes', 1.1);
  const rescored = cue(4, 'in B', 0.95);
  const newStep = cue(5, 'repeat the same step', 1.9);
  const finish = cue(5, 'Go back to the starting model', 1.8);
  const openingTime = index === 0 ? elapsed : 6;
  const written = 0.54 + 0.46 * ease(openingTime / 1.12);
  const enclosed = ease((openingTime - 1.12) / 0.82);
  const lift = ease((openingTime - 2) / 0.75);

  const daylight = c.createLinearGradient(0, 0, 1690, 1020);
  daylight.addColorStop(0, '#859be5');
  daylight.addColorStop(1, '#465bb3');
  c.fillStyle = daylight;
  c.fillRect(0, 0, 1920, 1080);

  c.save();
  c.lineJoin = 'round';
  c.lineCap = 'round';
  const zoom = mix(1.72, 1, wide) + 0.18 * finish;
  c.translate(mix(905, 960, wide), mix(530, 540, wide));
  c.scale(zoom, zoom);
  c.rotate(mix(-0.023, -0.011, wide));
  c.translate(-mix(622, 960, wide) - 67 * finish, -mix(393, 540, wide));
  exercisePaper(c);
  type(c, 'Answer key', 257, 125, 34, 'Sans', '#615d72');
  type(c, '14 × 12 = ' + expected, 252, 211, 85, 'Serif');
  layer(c, 1 - wide, () => type(c, 'Model answer B', xFirst, yB - 84, 38, 'Sans', ink));

  const ruleColor = newRule > 0.5 ? raspberry : blue;
  layer(c, read, () => {
    type(c, 'Reward', 1016, 205, 40, 'Serif', ink, 'center');
    layer(c, 1 - newRule, () => type(c, 'Read first box', 1016, 255, 33, 'Sans', blue, 'center'));
    layer(c, newRule, () => type(c, 'Require one box', 1016, 255, 33, 'Sans', raspberry, 'center'));
  });

  let movingTip;
  for (const [i, row] of numbers.entries()) {
    const visibility = [answerA, 1, answerC][i];
    const y = rows[i];
    layer(c, visibility, () => {
      layer(c, wide, () => type(c, ['A', 'B', 'C'][i], 271, y + 23, 67, 'Serif', ink, 'center'));
      box(c, row[0], xFirst, y - 53, 1, 1);
      if (row.length > 1) {
        type(c, 'then', 604, y + 17, 41, 'Serif', '#615d72', 'center');
        movingTip = box(c, row[1], xSecond, y - 53, written, enclosed);
      }
      const scored = i === 1 ? firstPoint : 1;
      layer(c, read * (1 - newRule), () => {
        c.translate(xFirst, y + 72);
        trace(c, underline, i === 1 ? read : 1, blue, 6);
      });
      if (i === 1) {
        layer(c, counted, () => {
          c.translate(xFirst, y + 73);
          trace(c, brace, counted, raspberry, 5);
          type(c, '2 boxes', 268, 65, 34, 'Sans', raspberry, 'center');
        });
      } else {
        layer(c, newRule, () => {
          c.translate(xFirst, y + 73);
          trace(c, underline, newRule, raspberry, 5);
        });
      }
      layer(c, scored, () => {
        // As the checker is replaced, leave the new score unwritten until it has run.
        layer(c, 1 - newRule, () => type(c, firstBox[i], 1016, y + 32, 90, 'Serif', blue, 'center'));
        layer(c, i === 1 ? rescored : newRule, () => type(c, oneBox[i], 1016, y + 32, 90, 'Serif', raspberry, 'center'));
      });
    });
  }

  layer(c, mean * (1 - newRule + rescored), () => {
    line(c, [[865, 810], [1125, 809]], '#514e6977', 2.5);
    const rewards = rescored > 0 ? oneBox : firstBox;
    const total = rewards.reduce((a, b) => a + b);
    type(c, 'Average   ' + total + '/' + rewards.length, 995, 859, 39, 'Sans', ruleColor, 'center');
  });

  layer(c, plot, () => {
    type(c, 'Chance of sampling B', 1236, 204, 55, 'Serif');
    c.save();
    c.setLineDash([6, 12]);
    line(c, [[plotX, baseY], [1770, baseY]], '#6863788c', 3);
    c.restore();
    type(c, 'Start', plotX, baseY + 65, 35, 'Sans', ink, 'center');
    type(c, '⅓', plotX, baseY + 126, 63, 'Serif', ink, 'center');
    chanceTrace(c, firstBox, oldStep, blue, 'First box', true, 1 - 0.23 * newRule);
    chanceTrace(c, oneBox, newStep, raspberry, 'One box', false, 1);
    c.beginPath();
    c.arc(plotX, baseY, 12, 0, 2 * Math.PI);
    c.fillStyle = ink;
    c.fill();
  });

  layer(c, 1 - lift, () => pencil(c, ...movingTip, '#5e5274', lift));
  if (index === 1) {
    const leave = ease((elapsed - 1.7) / 0.8);
    layer(c, 1 - leave, () => pencil(c, xFirst + read * 202, yB + 72, blue, leave));
  }
  c.restore();
}

export default { title, beats, draw, check };
