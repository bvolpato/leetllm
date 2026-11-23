import { normalize, records } from '../fixtures.mjs';
import { leakageComparison } from '../model.mjs';

const before = leakageComparison(true);
const after = leakageComparison(false);

function drawMessage(ctx, api, row, x, y, role, footer, normalized) {
  const { C, line, path, rect, text } = api;
  const color = role === 'Training' ? C.blue : C.cyan;
  const width = 770;
  const height = 244;
  const tail = role === 'Training' ? [46, 45, 115] : [width - 115, width - 45, width - 46];
  path(
    ctx,
    [
      { x: x + tail[0], y: y + height - 4 },
      { x: x + tail[1], y: y + height + 35 },
      { x: x + tail[2], y: y + height - 4 },
    ],
    {
      closed: true,
      fill: color,
      width: 0,
    },
  );
  rect(ctx, x, y, width, height, color, undefined, 35);
  text(ctx, role + '  #' + row.id, x + 36, y + 60, 37, C.bg);
  text(ctx, 'Thread ' + row.conversation, x + width - 33, y + 59, 31, C.bg, 'right');
  line(ctx, x + 34, y + 84, x + width - 34, y + 84, C.bg, 2);
  text(
    ctx,
    normalized ? normalize(row.text) : '“' + row.text + '”',
    x + 34,
    y + 155,
    normalized ? 48 : 39,
    C.bg,
    'left',
    'mono',
  );
  text(ctx, footer, x + 36, y + 217, 33, C.bg);
}

export function drawIntro(ctx, scene, state, api) {
  const { C, text, line, rect, focus } = api;
  const p = focus.progress;
  const keys = p('lookup-normalize') === 1;
  const scored = p('lookup-score') === 1;
  const lift = p('lookup-remove');
  const rerun = p('lookup-default') === 1;
  if (state.t < 0.35) ctx.globalAlpha = 1;

  focus.target('lookup-messages', () => {
    const source = records[0];
    const question = before.answers[0];
    // Separate the two turns of the thread horizontally before lining up their words.
    const slide = api.clamp(state.t / 1.1);
    const align = api.phase(state.t, 0.88, 1.65);
    const x = api.lerp(580, 1015, slide);
    const y = api.lerp(545, 242, align);
    if (lift < 1) {
      ctx.save();
      try {
        ctx.globalAlpha *= 1 - lift;
        drawMessage(
          ctx,
          api,
          source,
          api.lerp(218, 135, slide),
          242 - 58 * lift,
          'Training',
          'Stored label  ·  ' + source.label,
          keys,
        );
      } finally {
        ctx.restore();
      }
    } else {
      text(ctx, 'Still in training', 170, 310, 34, C.blue);
      text(ctx, records[2].text, 170, 402, 43, C.ink);
      text(ctx, 'No matching build message', 170, 480, 34, C.muted);
    }
    const prediction = lift
      ? rerun
        ? after.answers[0].prediction
        : '?'
      : scored
        ? question.prediction
        : '?';
    drawMessage(
      ctx,
      api,
      question,
      x,
      y,
      'Evaluation',
      'Router prediction  ·  ' + prediction,
      keys,
    );
    if (keys && !lift) text(ctx, '=', 960, 402, 67, C.yellow, 'center');
  });

  focus.target('lookup-answers', () => {
    if (!scored) {
      if (!keys) return;
      text(ctx, 'Match  →  copy the stored label', 960, 704, 44, C.ink, 'center');
      text(ctx, 'Miss  →  predict standard', 960, 782, 38, C.muted, 'center');
      return;
    }
    text(
      ctx,
      'Match  →  copy the stored label     ·     Miss  →  predict standard',
      960,
      575,
      29,
      C.muted,
      'center',
    );
    const xs = [166, 520, 960, 1435];
    ['Eval ticket', 'Reviewed label', 'With 101', 'Without 101'].forEach((label, i) =>
      text(ctx, label, xs[i], 657, 30, i === 3 && !lift ? C.muted : C.ink),
    );
    before.answers.forEach((row, i) => {
      const y = 734 + i * 75;
      const newRow = after.answers[i];
      if (i === 0) rect(ctx, 130, y - 48, 1655, 64, C.panel, C.blue, 5);
      text(ctx, String(row.id), xs[0], y, 36, C.ink, 'left', 'mono');
      text(ctx, row.label, xs[1], y, 36, C.ink);
      const show = (answer, x) =>
        text(
          ctx,
          answer.prediction + (answer.correct ? '   ✓' : '   ×'),
          x,
          y,
          36,
          answer.correct ? C.green : C.pink,
        );
      show(row, xs[2]);
      if (rerun) show(newRow, xs[3]);
      else text(ctx, lift ? '?' : '·', xs[3], y, 36, lift ? C.yellow : C.muted);
    });
    line(ctx, 135, 908, 1785, 908, C.muted, 2);
    text(ctx, 'Correct predictions', xs[0], 975, 35, C.ink);
    if (p('lookup-tally') === 1)
      text(ctx, `${before.correct} / ${before.total}`, xs[2], 975, 49, C.ink);
    if (p('lookup-rescore') === 1)
      text(ctx, `${after.correct} / ${after.total}`, xs[3], 975, 49, C.yellow);
    else if (lift) text(ctx, '? / 3', xs[3], 975, 49, C.yellow);
  });
}
export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'lookup-normalize',
    'lookup-score',
    'lookup-tally',
    'lookup-remove',
    'lookup-default',
    'lookup-rescore',
  ],
};
