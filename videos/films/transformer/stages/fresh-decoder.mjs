import { clamp, event } from '../arithmetic.mjs';
import { VOCAB } from '../fixtures.mjs';
import { CACHE_RUNS, FRESH } from '../model.mjs';
import { paintPrefix, readSpan } from '../prefix.mjs';
import { withTransformerExtendedFrame } from '../defaults.mjs';

function twoValueRead(ctx, state, api, s, f) {
  const { C } = api;
  const wrong = s.wrongKnown && !s.repaired;
  const colors = [C.blue, C.green];
  const plot = api.teaching.axes({
    x: 185,
    y: 322,
    width: 745,
    height: 477,
    xDomain: [0, 4.5],
    yDomain: [0, 2.65],
    xTicks: [0, 1, 2, 3, 4],
    yTicks: [0, 1, 2],
    xLabel: 'value feature 1',
    yLabel: 'value feature 2',
    equalUnits: true,
    fontSize: 28,
  });
  const pair = (row, digits = 0) => '[' + row.map((v) => f(v, digits)).join(', ') + ']';
  const keys = [
    event(state, 0, 'fresh-blue-key', 0.09, 0.23),
    event(state, 0, 'fresh-green-key', 0.23, 0.35),
  ];
  const points = event(state, 0, 'fresh-inputs', 0.36, 0.48);
  if (points === 1 && !wrong) {
    const [blue, green] = FRESH.values.map((v) => plot.point(...v));
    api.line(ctx, blue.x, blue.y, green.x, green.y, C.muted, 2);
  }
  for (const [i, value] of FRESH.values.entries()) {
    if (2 * points <= i) continue;
    const pt = plot.point(...value);
    api.circle(ctx, pt.x, pt.y, 11, wrong && i === 1 ? C.muted : colors[i]);
  }
  const weights = wrong ? [1, 0] : FRESH.weights;
  const read = wrong ? FRESH.wrong : FRESH.read;
  const readVisible = !wrong || event(state, 2, 'fresh-cropped-read', 0.3, 0.5) === 1;
  const transfer = event(state, 1, 'tr-fresh-decoder-accumulate', 0.46, 0.76);
  if (s.sharesKnown && readVisible && transfer > 0) {
    const x = read[0] * clamp(2 * transfer);
    const y = read[1] * clamp(2 * transfer - 1);
    const a = plot.point(0, 0),
      mid = plot.point(x, 0),
      end = plot.point(x, y);
    api.arrow(ctx, a.x, a.y, mid.x, mid.y, C.blue, 6);
    if (y > 0) api.arrow(ctx, mid.x, mid.y, end.x, end.y, C.green, 6);
  }
  api.text(ctx, 'Query ' + pair(FRESH.q) + '   ·   position 1', 1050, 287, 38, C.yellow);
  const columns = [1410, 1650];
  for (const [i, x] of columns.entries()) {
    const color = wrong && i === 1 ? C.muted : colors[i];
    api.text(ctx, 'key ' + i, x, 410, 34, color, 'center');
    api.text(ctx, keys[i] > 0 ? pair(FRESH.keys[i]) : '·', x, 502, 36, color, 'center');
    api.text(ctx, 2 * points > i ? pair(FRESH.values[i]) : '·', x, 586, 36, color, 'center');
    api.text(ctx, s.scoresKnown ? f(FRESH.scores[i]) : '?', x, 685, 35, C.ink, 'center');
    api.text(ctx, s.sharesKnown && readVisible ? f(weights[i]) : '?', x, 773, 35, color, 'center');
    if (state.beat === 2) {
      api.text(ctx, wrong && i === 1 ? 'blocked' : 'allowed', x, 842, 28, color, 'center');
    }
  }
  for (const [label, y] of [
    ['Key', 502],
    ['Value', 586],
    ['Dot ÷ √2', 685],
    ['Weight', 773],
  ])
    api.text(ctx, label, 1060, y, 31, C.muted);
  const result = s.readKnown && readVisible && transfer === 1;
  api.text(
    ctx,
    result ? (wrong ? 'Read  =  ' + pair(read) : 'Read  ≈  ' + pair(read, 3)) : 'Read  =  [?, ?]',
    560,
    942,
    43,
    C.yellow,
    'center',
  );
  if (state.beat === 2) {
    api.text(
      ctx,
      s.repaired
        ? 'Mask row for absolute position 1'
        : wrong
          ? 'Upper-left mask row 0'
          : 'Both keys available',
      1400,
      942,
      31,
      s.repaired ? C.green : wrong ? C.pink : C.ink,
      'center',
    );
  }
}

function openingReplay(ctx, state, api) {
  const { C } = api;
  const ids = [0, 1, 2];
  const { full, upperLeft, aligned } = CACHE_RUNS[0];
  const crop = event(state, 3, 'crop-history', 0.19, 0.42);
  const inspect = event(state, 3, 'cache-scores', 0.3, 0.59);
  const wrongWinner = event(state, 4, 'cache-choice', 0.02, 0.14);
  const move = event(state, 4, 'restore-prefix', 0.35, 0.62);
  const compare = event(state, 4, 'compare-scores', 0.64, 0.8);
  const finalChoice = event(state, 4, 'restored-choice', 0.83, 0.98);
  const run = move === 1 ? aligned : upperLeft;
  const choice =
    finalChoice === 1 ? aligned.choice : wrongWinner === 1 && move === 0 ? upperLeft.choice : null;
  paintPrefix(ctx, api, ids, { y: 295, selected: true, choice, choiceColor: move === 1 ? C.green : C.pink });
  const right = 2 * (1 - crop + move);
  const spanLabel =
    move === 1
      ? 'cached query can read all three'
      : move > 0
        ? 'restoring history'
        : crop === 0
          ? 'full prefix'
          : crop === 1
            ? 'only readable key'
            : 'upper-left mask';
  const spanColor = move === 1 ? C.green : move > 0 || crop === 0 ? C.cyan : C.pink;
  readSpan(ctx, api, ids.length, right, 440, spanLabel, spanColor);
  const x0 = 443,
    cell = 219;
  api.text(ctx, 'Vocabulary logits', 135, 631, 34, C.ink);
  api.text(ctx, 'Full prefix', 135, 735, 33, C.blue);
  api.text(ctx, 'Cached query', 135, 842, 33, C.yellow);
  for (let i = 0; i < VOCAB.length; i++) {
    const x = x0 + i * cell,
      center = x + cell / 2;
    api.text(ctx, VOCAB[i], center, 631, 31, C.ink, 'center');
    for (const [j, scores] of [full.logits, run.logits].entries()) {
      const y = 681 + 107 * j;
      const show = j === 0 || (i < Math.ceil(inspect * VOCAB.length) && (move === 0 || move === 1));
      const best = j === 0 ? full.choice : choice;
      const color = !j ? C.blue : C.yellow;
      api.rect(ctx, x + 6, y, cell - 12, 82, C.panel, show && best === i ? color : undefined, 7);
      api.text(
        ctx,
        show ? scores[i].toFixed(3) : '·',
        center,
        y + 54,
        34,
        show ? color : C.muted,
        'center',
      );
    }
  }
  if (compare === 1) {
    api.text(
      ctx,
      'Largest absolute score difference   ' + aligned.maxLogitDifference.toFixed(3),
      960,
      974,
      37,
      C.green,
      'center',
    );
  } else if (wrongWinner === 1 && move === 0) {
    api.text(
      ctx,
      'Largest absolute score difference   ' + upperLeft.maxLogitDifference.toFixed(3),
      960,
      974,
      37,
      C.pink,
      'center',
    );
  }
}

export function paintFreshDecoder(ctx, scene, state, api, C, id, s, b, p, f) {
  if (b < 3) twoValueRead(ctx, state, api, s, f);
  else openingReplay(ctx, state, api);
}
export function drawFreshDecoderStage(ctx, scene, state, api) {
  withTransformerExtendedFrame(ctx, scene, state, api, paintFreshDecoder);
}
export default {
  id: 'fresh-decoder',
  draw: drawFreshDecoderStage,
  cues: [
    'fresh-blue-key',
    'fresh-green-key',
    'fresh-inputs',
    'tr-fresh-decoder-scores',
    'tr-fresh-decoder-shares',
    'tr-fresh-decoder-accumulate',
    'tr-fresh-decoder-read',
    'tr-fresh-decoder-wrong',
    'fresh-cropped-read',
    'tr-fresh-decoder-repair',
    'crop-history',
    'cache-scores',
    'cache-choice',
    'restore-prefix',
    'compare-scores',
    'restored-choice',
  ],
};
