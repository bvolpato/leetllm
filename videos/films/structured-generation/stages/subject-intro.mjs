import { lessonFont } from '../../../lib/fonts.mjs';
import { CI_RUN, OPENING_REPLIES, RUN_LOG } from '../fixtures.mjs';
import { constructionCode as code, constructionText as text } from '../defaults.mjs';
import { after } from '../page.mjs';

export function drawSubjectIntro(ctx, scene, state, api) {
  const { C, focus } = api;
  focus.target('run-replies', () => {
    const stopped = after(state, 'intro-byte');
    const parsed = after(state, 'intro-parse');
    const compared = after(state, 'intro-compare');
    const size = 60;
    ctx.save();
    ctx.font = lessonFont(size, 'mono');
    const advance = ctx.measureText('S').width;
    ctx.restore();

    code(ctx, api, 'json.loads(reply)', 150, 280, 42, C.blue);
    OPENING_REPLIES.forEach((raw, i) => {
      const y = 448 + i * 173;
      text(ctx, api, i === 0 ? 'A' : 'B', 150, y, 48, C.cyan);
      code(ctx, api, raw, 267, y, size);
      const position =
        i === 0 ? 0 : Math.floor(focus.progress('intro-parse', 0) * (raw.length - 1));
      const x = 267 + position * advance;
      const ink = i === 0 && stopped ? C.pink : i === 1 && parsed ? C.green : C.yellow;
      api.line(ctx, x + 2, y + 21, x + advance - 2, y + 21, ink, 6);
      if (i === 0 && stopped) text(ctx, api, 'Stopped at S', 1740, y, 43, C.pink, 'right');
      if (i === 1 && parsed) text(ctx, api, 'Parsed', 1740, y, 43, C.green, 'right');
    });

    if (focus.progress('intro-log', 0) > 0) {
      api.line(ctx, 150, 738, 150, 865, C.yellow, 6);
      text(ctx, api, 'Runner log', 184, 776, 33, C.yellow);
      text(ctx, api, RUN_LOG, 184, 850, 44);
      if (compared) {
        const status = JSON.parse(OPENING_REPLIES[1]).status;
        code(ctx, api, 'B: ' + status + '    CI: ' + CI_RUN.status, 184, 955, 48);
        const matches = status === CI_RUN.status;
        text(
          ctx,
          api,
          matches ? 'Show snapshot' : 'Send B to review',
          1740,
          955,
          46,
          matches ? C.green : C.pink,
          'right',
        );
      }
    }
  });
}

export default {
  id: 'subject-intro',
  draw: drawSubjectIntro,
  cues: ['intro-ask', 'intro-byte', 'intro-parse', 'intro-log', 'intro-compare'],
};
