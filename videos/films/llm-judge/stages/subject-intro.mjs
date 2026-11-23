import { candidates } from '../fixtures.mjs';
import { wrapLines } from '../defaults.mjs';
import { lessonFont } from '../../../lib/fonts.mjs';

function replyPreview(ctx, api, id, y, fold) {
  const { C } = api;
  const x = 180;
  const size = 68;
  const words = candidates[id].split(' ');
  ctx.save();
  ctx.font = lessonFont(size);
  const measure = (count) => ctx.measureText(words.slice(0, count).join(' ') + '…').width;
  const width = api.lerp(1550, measure(3) + 108, fold);
  let count = 3;
  while (count < words.length && measure(count + 1) + 108 <= width) count++;
  ctx.restore();

  api.focus.target(id + '-answer', () => {
    api.text(
      ctx,
      id === 'compact' ? 'Compact reply' : 'Stepwise reply',
      x + 8,
      y - 24,
      37,
      C.muted,
    );
    api.path(
      ctx,
      [
        { x: x + 16, y: y + 95 },
        { x: x - 20, y: y + 147 },
        { x: x + 70, y: y + 128 },
      ],
      { closed: true, fill: C.ink, width: 0 },
    );
    api.rect(ctx, x, y, width, 142, C.ink, null, 38);
    api.text(ctx, words.slice(0, count).join(' ') + '…', x + 52, y + 94, size, C.bg);
  });
}

function copy(ctx, api, id, x, marked) {
  const { C } = api;
  const compact = id === 'compact';
  const color = compact ? C.green : C.cyan;
  const body = compact
    ? candidates[id]
    : candidates[id].replace(' Next: ', '\nNext:\n').replace(' 2. ', '\n2. ');
  const lines = wrapLines(ctx, api, body, 770, 40);
  api.focus.target(id + '-answer', () => {
    api.line(ctx, x, 354, x + 762, 354, color, 3);
    api.text(ctx, compact ? 'Compact' : 'Stepwise', x, 325, 38, color);
    lines.forEach((line, i) => {
      const y = 438 + 61 * i;
      api.text(ctx, line, x, y, 40, C.ink);
      const match = /stop the rollout/i.exec(line);
      if (!match || !marked) return;
      ctx.save();
      ctx.font = lessonFont(40);
      const left = x + ctx.measureText(line.slice(0, match.index)).width;
      const width = ctx.measureText(match[0]).width;
      ctx.restore();
      api.line(ctx, left, y + 12, left + width * marked, y + 12, color, 6);
    });
  });
}

export function drawSubjectIntro(ctx, scene, state, api) {
  const { C, focus } = api;
  if (state.beat === 0) {
    if (state.t < 0.35) ctx.globalAlpha = 1;
    const fold = api.phase(state.t, -0.15, 1.35);
    replyPreview(ctx, api, 'compact', 310, fold);
    replyPreview(ctx, api, 'stepwise', 620, fold);
    focus.target('scan-question', () =>
      api.text(ctx, 'Which preview tells Maya what to do?', 180, 940, 62, C.ink, 'left', 'serif'),
    );
    return;
  }
  api.text(ctx, 'Payment service   /   Rollback threshold crossed', 130, 231, 31, C.muted);
  copy(ctx, api, 'compact', 130, focus.progress('compact-mark', 0));
  copy(ctx, api, 'stepwise', 1010, focus.progress('step-mark', 0));
  if (focus.visible('judge-pick')) {
    focus.target('judge-receipt', () => {
      api.line(ctx, 130, 832, 1790, 832, C.yellow, 3);
      api.text(ctx, 'Example judgment', 130, 903, 34, C.yellow);
      api.text(ctx, 'Stepwise', 610, 906, 48, C.cyan);
      api.text(ctx, '“The numbered actions are easy to scan.”', 610, 975, 37, C.ink);
    });
  } else if (focus.visible('both-actions')) {
    api.text(ctx, 'Which layout is easier to follow?', 960, 920, 46, C.ink, 'center', 'serif');
  }
}

export default {
  id: 'subject-intro',
  draw: drawSubjectIntro,
  cues: ['find-action', 'compact-mark', 'step-mark', 'both-actions', 'judge-pick', 'test-pick'],
};
