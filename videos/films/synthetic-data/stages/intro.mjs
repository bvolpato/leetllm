import { CANDIDATES, firstPageOnlyClient } from '../fixtures.mjs';
import { runSearchFixture } from '../model.mjs';

const printed = runSearchFixture({ run: firstPageOnlyClient }).result.items;
const pages = runSearchFixture(CANDIDATES[0])
  .trace.map((event) => event.response)
  .filter((response) => response.status === 200);

function searchResult(ctx, api, page, lastName, endToken) {
  const { C, rect, text, circle, line, focus } = api;
  rect(ctx, 116, 228, 762, 356, C.blue, undefined, 16);
  circle(ctx, 181, 284, 17, null, C.bg, 6);
  line(ctx, 195, 299, 210, 314, C.bg, 6);
  text(ctx, 'Search results', 236, 299, 43, C.bg);
  text(ctx, 'PAGE 1', 827, 295, 29, C.bg, 'right', 'mono');
  line(ctx, 158, 332, 832, 332, C.bg, 2);
  pages[0].items.forEach((name, i) => text(ctx, name, 165, 426 + 98 * i, 72, C.bg));
  focus.target('returned-token', () => {
    rect(ctx, 460, 491, 374, 72, C.yellow, undefined, 9);
    text(ctx, 'Next', 482, 540, 34, C.bg);
    text(ctx, pages[0].nextCursor, 610, 541, 39, C.bg, 'left', 'mono');
    line(ctx, 776, 527, 806, 527, C.bg, 4);
    line(ctx, 794, 515, 806, 527, C.bg, 4);
    line(ctx, 794, 539, 806, 527, C.bg, 4);
  });
  if (page > 0)
    focus.target('next-page', () => {
      const y = 620 + 31 * (1 - page);
      line(ctx, 652, 584, 652, 584 + (y - 584) * page, C.yellow, 5);
      rect(ctx, 116, y, 762, 211, C.panel, C.blue, 16);
      text(ctx, 'Page 2', 165, y + 64, 39, C.blue);
      if (lastName) text(ctx, pages[1].items.join(', '), 165, y + 160, 72, C.ink);
      if (endToken) text(ctx, 'Next: null', 827, y + 152, 35, C.muted, 'right', 'mono');
    });
}

function printOutput(ctx, api, time, stopped, withheld) {
  const { C, rect, text, line, focus } = api;
  focus.target('printed-names', () => {
    rect(ctx, 990, 228, 810, 602, C.panel, C.cyan, 16);
    text(ctx, 'Generated client', 1050, 305, 45, C.cyan);
    line(ctx, 991, 341, 1799, 341, C.cyan, 3);
    text(ctx, '> Fetch every name', 1050, 420, 43, C.muted, 'left', 'mono');
    text(ctx, printed[0], 1050, 548, 78, C.ink, 'left', 'mono');
    const letters = Math.min(printed[1].length, 1 + Math.floor(time * 6));
    const partial = printed[1].slice(0, letters);
    text(ctx, partial + (stopped ? '' : '▍'), 1050, 666, 78, C.ink, 'left', 'mono');
    if (stopped)
      text(
        ctx,
        withheld ? 'Skip this training example' : 'End of output',
        1050,
        774,
        41,
        withheld ? C.pink : C.muted,
      );
  });
}

export function drawIntro(ctx, scene, state, api) {
  const p = (cue) => api.focus.progress(cue, 0);
  if (state.t < 0.35) ctx.globalAlpha = 1;
  searchResult(ctx, api, p('follow-token'), p('last-name') === 1, p('end-token') === 1);
  printOutput(ctx, api, state.t, p('client-stops') === 1, p('withhold-incomplete') === 1);
  if (p('missing-case') > 0) {
    api.focus.target('new-task', () => {
      api.text(ctx, 'Reviewed task', 125, 940, 30, api.C.muted);
      api.text(ctx, 'Fetch every name', 125, 1002, 45, api.C.blue);
      api.arrow(ctx, 573, 982, 755, 982, api.C.yellow, 5);
      api.text(ctx, 'Generated variation', 827, 940, 30, api.C.muted);
      api.text(ctx, 'Retry, then fetch the next page', 827, 1002, 45, api.C.yellow);
    });
  }
}
export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'client-output',
    'client-stops',
    'page-token',
    'keep-question',
    'follow-token',
    'last-name',
    'end-token',
    'withhold-incomplete',
    'missing-case',
  ],
};
