import assert from 'node:assert/strict';
import { controlledSgd } from '../../../films/continued-pretraining/model.mjs';
import { plate } from './plates.mjs';

const title = 'The diver’s word';
const beats = [
  {
    id: 'cover-the-word',
    say: 'Cover the last word. The model gets to read up to the gap. The tide rises near the ... At this checkpoint, reef and tree have an even chance.',
    hold: 0.95,
  },
  {
    id: 'read-the-log',
    say: 'Lift the corner. The diver wrote reef. There’s our training target, right there in the text. Each ending is a single token in this little model.',
    hold: 0.55,
  },
  {
    id: 'learn-from-reef',
    say: 'Start from the saved model weights. Take one training step on reef, and watch the blue edge.',
    hold: 1.25,
  },
  {
    id: 'the-new-split',
    say: 'A quarter point on the reef score gives reef about fifty-six percent. We resumed a pretrained model’s next-token training on the diver’s log. That’s continued pretraining.',
    hold: 0.65,
  },
  {
    id: 'try-the-park',
    say: 'Turn to the park note. The robin nests in the ... This tiny model shares the same two scores across both sentences. Let it fill the gap with its more likely word.',
    hold: 1.6,
  },
  {
    id: 'under-the-prediction',
    say: 'A robin nesting in a reef? Lift the prediction. The park observer wrote tree. That word had half the probability before we trained on the diver’s note. Now it gets less than forty-four percent.',
    hold: 0.85,
  },
  {
    id: 'keep-the-park-note',
    say: 'A real model also uses context. To find out whether other writing lost ground, measure its predictions on fresh domain text and on familiar kinds of text held out of training.',
    hold: 2.4,
  },
];

// Use the field-note experiment from the full lesson. In this two-token softmax the
// tree logit is the reference, fixed at zero. Only the shared reef logit is trainable.
const baseReefScore = 0;
const learningRate = 0.5;
function distribution(reefScore) {
  const reef = 1 / (1 + Math.exp(-reefScore));
  return { reef, tree: 1 - reef };
}
const base = distribution(baseReefScore);
const reefTargetGradient = base.reef - 1;
const step = controlledSgd(learningRate, reefTargetGradient, baseReefScore);
const after = distribution(step.theta);
const topToken = after.reef > after.tree ? 'reef' : 'tree';
const probabilityLabel = (p) => Number((p * 100).toFixed(1)) + '%';

const W = 1920;
const pageH = 704;
const ink = '#252e34',
  blue = '#205c78',
  clay = '#a64c36';
const ease = (value) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};

function text(ctx, value, x, y, size, options = {}) {
  const { face = 'Sans', style = '', color = ink, align = 'left' } = options;
  ctx.font = `${style} ${size}px "Lesson ${face}"`.trim();
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(value, x, y);
}

function line(ctx, x1, y1, x2, y2, color, weight) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = weight;
  ctx.stroke();
}

function polygon(ctx, points, fill) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

const seaNote = {
  kind: 'reef',
  name: 'Diver’s log',
  first: 'The tide rises',
  second: 'near the',
  answer: 'reef.',
  paper: '#f6ecd7',
  color: blue,
  role: 'Training text',
};
const parkNote = {
  kind: 'tree',
  name: 'Park field note',
  first: 'The robin nests',
  second: 'in the',
  answer: 'tree.',
  paper: '#f8efd9',
  color: clay,
  role: 'Held-out text',
};

// The strip physically covers the printed word. Its underside can move away
// without changing the text or the model state.
function wordCover(ctx, left, baseline, angle, printed, isPark) {
  const stripW = 326,
    stripH = 150;
  ctx.save();
  ctx.translate(left, baseline);
  ctx.rotate(angle);
  const top = -112;
  const corners = [
    [-23, top + 3],
    [stripW - 32, top],
    [stripW - 6, top + 23],
    [stripW - 4, top + stripH - 4],
    [-22, top + stripH],
  ];
  ctx.save();
  ctx.translate(1, 7);
  polygon(ctx, corners, '#4b443b28');
  ctx.restore();
  polygon(ctx, corners, isPark ? '#cde0e1' : '#e5d7b8');
  line(ctx, -19, top + 4, stripW - 35, top + 1, '#fff9e9b5', 2.5);
  polygon(
    ctx,
    [
      [stripW - 32, top],
      [stripW - 34, top + 26],
      [stripW - 6, top + 23],
    ],
    isPark ? '#91b7be' : '#c5b48d',
  );
  if (isPark) {
    text(ctx, 'Model pick', 5, -72, 34, { color: '#315c68' });
    if (printed > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(-1, -69, 269 * printed, 94);
      ctx.clip();
      text(ctx, topToken + '.', 3, 10, 87, { face: 'Serif', style: 'italic', color: blue });
      ctx.restore();
    }
  } else {
    line(ctx, 7, 2, 242, 1, '#8e846b', 2.5);
  }
  ctx.restore();
}

function page(ctx, note, slideX, state) {
  const park = note === parkNote;
  ctx.save();
  ctx.translate(slideX, 0);
  ctx.beginPath();
  ctx.rect(0, 0, W, pageH);
  ctx.clip();
  ctx.fillStyle = note.paper;
  ctx.fillRect(0, 0, W, pageH);
  ctx.drawImage(plate(note.kind), 0, 0);

  // A small irregular border keeps the inked plate on the field-note stock.
  for (let y = 0; y < pageH; y += 2) {
    const edge = 2.3 + 1.4 * Math.sin(y * 0.063) + Math.sin(y * 0.56);
    ctx.fillRect(700 - edge, y, edge + 1, 2);
  }
  const x = 788;
  text(ctx, note.name, x, 118, 54, { face: 'Serif', style: 'italic', color: note.color });
  text(ctx, note.role, 1838, 112, 38, { color: note.color, align: 'right' });
  line(ctx, x, 151, 1839, 151, note.color, 2.2);
  text(ctx, note.first, x, 324, 104, { face: 'Serif' });
  text(ctx, note.second, x, 451, 104, { face: 'Serif' });
  const endingX = x + ctx.measureText(note.second).width + 34;
  text(ctx, note.answer, endingX, 451, 104, { face: 'Serif', style: 'italic', color: note.color });
  if (!park && state.target > 0) {
    const wordWidth = ctx.measureText(note.answer).width;
    line(ctx, endingX + 4, 471, endingX + 4 + wordWidth * state.target, 471, blue, 3);
    ctx.save();
    ctx.globalAlpha = state.target;
    text(ctx, 'Training target', endingX, 529, 39, { color: blue });
    ctx.restore();
  }
  if (park) {
    const lifted = state.parkLift;
    if (lifted > 0) {
      line(ctx, endingX + 2, 467, endingX + 2 + 184 * lifted, 467, clay, 3);
    }
    wordCover(
      ctx,
      endingX - 2 + 20 * lifted,
      451 + 167 * lifted,
      0.019 - 0.049 * lifted,
      state.printed,
      true,
    );
  } else if (state.seaLift < 1 || state.cover < 1) {
    const fold = 1 - state.cover;
    wordCover(
      ctx,
      endingX - 2 + 438 * fold + 758 * state.seaLift,
      451 - 126 * fold - 48 * state.seaLift,
      0.012 - 0.1 * fold + 0.09 * state.seaLift,
      0,
      false,
    );
  }
  ctx.restore();
}

function probabilities(ctx, score, changed, showScores) {
  const p = distribution(score);
  const x = 82,
    barY = 803,
    barHeight = 95,
    barWidth = W - 2 * x;
  const startEdge = x + barWidth * base.reef;
  const currentEdge = x + barWidth * p.reef;

  ctx.fillStyle = '#faf4e7';
  ctx.fillRect(0, pageH, W, 1080 - pageH);
  line(ctx, 0, pageH + 1, W, pageH + 1, '#544d402e', 3);
  text(ctx, 'Next-token probability', x, 770, 41, { face: 'Serif' });
  ctx.fillStyle = blue;
  ctx.fillRect(x, barY, currentEdge - x, barHeight);
  ctx.fillStyle = clay;
  ctx.fillRect(currentEdge, barY, x + barWidth - currentEdge, barHeight);
  if (p.reef > base.reef) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(startEdge, barY, currentEdge - startEdge, barHeight);
    ctx.clip();
    for (let dx = -barHeight; dx < currentEdge - startEdge + barHeight; dx += 13) {
      line(
        ctx,
        startEdge + dx,
        barY + barHeight,
        startEdge + dx + barHeight * 0.6,
        barY,
        '#addad47d',
        3,
      );
    }
    ctx.restore();
  }
  text(ctx, 'reef', x + 30, barY + 66, 57, { face: 'Serif', style: 'italic', color: '#fff8e4' });
  text(ctx, probabilityLabel(p.reef), x + 161, barY + 64, 48, { face: 'Mono', color: '#fff8e4' });
  text(ctx, probabilityLabel(p.tree), x + barWidth - 184, barY + 64, 48, {
    face: 'Mono',
    color: '#fff8e4',
    align: 'right',
  });
  text(ctx, 'tree', x + barWidth - 34, barY + 66, 57, {
    face: 'Serif',
    style: 'italic',
    color: '#fff8e4',
    align: 'right',
  });
  if (changed > 0) {
    ctx.save();
    ctx.globalAlpha = changed;
    line(ctx, startEdge, barY + barHeight, startEdge, barY + barHeight + 18, ink, 3);
    text(ctx, 'Before this step', startEdge, 952, 37, { align: 'center' });
    ctx.restore();
  }
  if (showScores > 0) {
    ctx.save();
    ctx.globalAlpha = showScores;
    text(ctx, 'score  ' + score.toFixed(2), x, 952, 38, { face: 'Mono', color: blue });
    text(ctx, 'score  0.00', x + barWidth, 952, 38, { face: 'Mono', color: clay, align: 'right' });
    ctx.restore();
  }
}

function draw(ctx, clock) {
  const { index, elapsed, reveal } = clock;
  const cover = index > 0 ? 1 : ease(elapsed / 0.78);
  const seaLift = index > 1 ? 1 : index === 1 ? ease(reveal('Lift the corner', 0.85)) : 0;
  const target = index > 1 ? 1 : index === 1 ? ease(reveal('our training target', 0.65)) : 0;
  const showScores =
    index > 2 ? 1 : index === 2 ? ease(reveal('Start from the saved model weights', 0.55)) : 0;
  const training = index > 2 ? 1 : index === 2 ? ease(reveal('Take one training step', 1.35)) : 0;
  const turn = index > 4 ? 1 : index === 4 ? ease(reveal('Turn to the park note', 1.22)) : 0;
  const printed = index > 4 ? 1 : index === 4 ? ease(reveal('fill the gap', 0.62)) : 0;
  const parkLift = index > 5 ? 1 : index === 5 ? ease(reveal('Lift the prediction', 0.92)) : 0;
  const state = { cover, seaLift, target, printed, parkLift };

  ctx.fillStyle = '#f6ecd7';
  ctx.fillRect(0, 0, W, 1080);
  if (turn < 1) page(ctx, seaNote, -W * turn, state);
  if (turn > 0) page(ctx, parkNote, W * (1 - turn), state);
  probabilities(ctx, baseReefScore + (step.theta - baseReefScore) * training, training, showScores);
}

function check() {
  assert.deepEqual(base, { reef: 0.5, tree: 0.5 });
  assert.equal(reefTargetGradient, -0.5);
  assert.equal(step.theta, 0.25);
  assert.equal(after.reef, step.probabilities[0]);
  assert.equal(after.tree, step.probabilities[1]);
  assert.equal(probabilityLabel(after.reef), '56.2%');
  assert.equal(probabilityLabel(after.tree), '43.8%');
  assert.equal(topToken, 'reef');
  assert.equal(parkNote.answer, 'tree.');
  assert.ok(step.domainLoss < -Math.log(base.reef));
  assert.ok(step.broadLoss > -Math.log(base.tree));
}

export default { title, beats, draw, check };
