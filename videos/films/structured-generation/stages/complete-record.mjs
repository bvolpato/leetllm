import { decode, rankedSteps } from '../model.mjs';
import { constructionCode as code, constructionText as text } from '../defaults.mjs';
import { after } from '../page.mjs';

const steps = rankedSteps(4);
function result(budget) {
  try {
    return decode(rankedSteps(budget));
  } catch (error) {
    return error.message;
  }
}

export function drawCompleteRecord(ctx, scene, state, api) {
  const { C, focus } = api;
  focus.target('stop-trace', () => {
    text(ctx, api, 'Sampled tokens', 145, 303, 36, C.muted);
    const count = 1 + Math.floor(2 * focus.progress('stop-three', 0));
    const fourth = after(state, 'stop-eos');
    const xs = [150, 635, 895, 1280],
      ws = [435, 210, 330, 345];
    const n = fourth ? 4 : count;
    steps.forEach((token, i) => {
      if (i === 3 && focus.progress('stop-extra', 0) === 0) return;
      api.rect(ctx, xs[i], 363, ws[i], 118, C.panel, i < n ? C.cyan : C.muted, 9);
      if (i < n) code(ctx, api, token, xs[i] + ws[i] / 2, 439, 44, C.cyan, 'center');
      text(ctx, api, 'Step ' + (i + 1), xs[i], 536, 32, C.muted);
    });
    const emitted = steps.slice(0, Math.min(3, count)).join('');
    text(ctx, api, 'Text in the buffer', 145, 628, 32, C.muted);
    code(ctx, api, emitted, 145, 709, 62);
    if (after(state, 'stop-three')) {
      code(ctx, api, 'decode(max_steps=3)', 148, 838, 38, C.ink);
      text(
        ctx,
        api,
        after(state, 'stop-budget') ? result(3) : 'Return a record?',
        790,
        838,
        39,
        after(state, 'stop-budget') ? C.pink : C.yellow,
      );
    }
    if (focus.progress('stop-extra', 0) > 0) {
      code(ctx, api, 'decode(max_steps=4)', 148, 946, 38, C.ink);
      if (fourth) code(ctx, api, result(4), 790, 946, 44, C.green);
    }
  });
}
export default {
  id: 'complete-record',
  draw: drawCompleteRecord,
  cues: ['stop-three', 'stop-budget', 'stop-extra', 'stop-eos'],
};
