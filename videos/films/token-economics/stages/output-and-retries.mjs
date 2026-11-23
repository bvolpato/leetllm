import { cueProgress } from '../construction.mjs';
import { conciseMicro, verboseMicro } from '../fixtures.mjs';
import { text } from '../defaults.mjs';
import { usd } from '../forecast-calendar.mjs';

export default {
  id: 'output-and-retries',
  cues: ['short-reply', 'cut-reply', 'keep-citation'],
  draw(ctx, scene, state, api) {
    const { C } = api;
    const beat = state.beat ?? 0,
      p = state.beatP ?? 0;
    const shorten = beat > 0 ? 1 : cueProgress(state, 'short-reply', p);
    const cut = beat === 1 ? cueProgress(state, 'cut-reply', p) : 0;
    const restore = beat === 2 ? cueProgress(state, 'keep-citation', p) : 0;
    const limit = beat === 2 ? 55 + 75 * restore : 220 - 90 * shorten - 75 * cut;
    const compact = shorten === 1;
    const truncated = limit < 100 && (cut > 0 || beat === 2);
    const fields = compact
      ? ['Refund eligible.', 'Returns policy §3.', 'Confirm your order ID.']
      : [
          'Your refund is eligible.',
          'See section 3 of the returns policy.',
          'Please confirm your order ID to proceed.',
        ];
    const labels = ['Decision', 'Citation', 'Next step'];
    text(ctx, api, 'Customer reply', 175, 283, 43, C.ink, 'left');
    text(ctx, api, 'Output tokens in the full reply', 1190, 283, 35, C.muted, 'left');
    api.focus.target('reply', () => {
      api.rect(ctx, 165, 337, 950, 424, C.panel, C.muted, 7);
      fields.forEach((line, i) => {
        const present = i === 0 || !truncated;
        text(ctx, api, labels[i], 211, 413 + 128 * i, 30, C.muted, 'left');
        if (present) text(ctx, api, line, 211, 466 + 128 * i, 40, C.ink, 'left');
        else api.line(ctx, 214, 465 + 128 * i, 660, 465 + 128 * i, C.muted, 2);
      });
    });
    api.focus.target('output-length', () => {
      const atCandidate = limit === 55 || limit === 130 || limit === 220;
      text(ctx, api, atCandidate ? String(limit) : '…', 1190, 477, 103, C.pink, 'left');
      api.rect(ctx, 1190, 541, 526, 33, C.panel, C.muted, 0);
      api.rect(ctx, 1190, 541, (526 * limit) / 220, 33, C.pink, undefined, 0);
      text(ctx, api, 'Same 2,200 input tokens', 1190, 647, 30, C.muted, 'left');
      text(ctx, api, '1,280 reported cache reads', 1190, 705, 30, C.muted, 'left');
    });
    const saving = verboseMicro - conciseMicro;
    const footer =
      beat === 0
        ? 'The excerpts show what each complete answer contains.'
        : beat === 1
          ? 'Could a customer verify the decision and act on this reply?'
          : usd(saving, 5) + ' saved per attempt   ×   500 attempts   =   ' + usd(saving * 500, 3);
    if (beat < 2 || restore === 1) text(ctx, api, footer, 960, 901, 38, C.ink);
  },
};
