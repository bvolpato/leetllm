import { SEARCH_TEXT } from '../fixtures.mjs';
import { spoken } from '../construction.mjs';
import { quoteReceipt } from '../model.mjs';
import { drawExceptionSpan } from '../source-span.mjs';

export function drawExactSpan(ctx, scene, state, api) {
  const { C } = api;
  const cue = (id) => spoken(scene, state, id);
  const text = SEARCH_TEXT.exception;
  const cut = text.indexOf(' only');
  const shorten = cue('span-shorten').progress,
    restore = cue('span-restore').progress;
  const end = Math.round(text.length - (text.length - cut) * (shorten - restore));
  const advanced = cue('span-revision').phase === 'after';
  const policy = quoteReceipt(SEARCH_TEXT.policy, 2, { current: advanced ? 3 : 2 });
  const exception = quoteReceipt(text, 1, { end });
  const passes = policy.valid && exception.valid;
  drawExceptionSpan(ctx, api, text, 1, end);
  api.focus.target('span-policy', () => {
    api.text(ctx, `policy@2   [0,${policy.end})`, 160, 784, 33, C.blue);
    api.text(ctx, `Registry · policy@${policy.current}`, 730, 784, 33, advanced ? C.pink : C.blue);
    api.text(ctx, 'Exception slice · exact match', 1760, 784, 33, C.cyan, 'right');
  });
  api.focus.target('span-publication', () => {
    api.line(ctx, 160, 842, 1760, 842, C.muted, 2);
    const repairing = cue('span-restore').phase === 'during';
    const waiting =
      cue('span-withhold').phase === 'before' ||
      repairing ||
      (restore === 1 && cue('span-release').phase === 'before');
    const status = waiting
      ? cue('span-predict').phase !== 'before' && !restore
        ? 'Can this pack publish as it stands?'
        : 'Checking the two quotations…'
      : passes
        ? 'Publish both complete quotations.'
        : advanced
          ? 'Withhold · the indexed policy is out of date.'
          : 'Withhold · the exception ends before its condition.';
    api.text(ctx, status, 160, 943, 44, waiting ? C.yellow : passes ? C.green : C.pink);
  });
}

export default {
  id: 'exact-span',
  draw: drawExactSpan,
  cues: [
    'span-origin',
    'span-shorten',
    'span-predict',
    'span-withhold',
    'span-restore',
    'span-release',
    'span-revision',
  ],
};
