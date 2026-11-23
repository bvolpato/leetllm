import { EVENTS } from '../fixtures.mjs';
import { summarize } from '../arithmetic.mjs';

const requests = ['202', '205'].map((id) => EVENTS.find((event) => event.id === id));
const windowCounts = summarize(EVENTS);

function approvalBubble(ctx, api, x, y) {
  const { C } = api;
  api.path(
    ctx,
    [
      { x: x - 111, y: y + 37 },
      { x: x - 137, y: y + 64 },
      { x: x - 133, y: y + 28 },
    ],
    { closed: true, fill: C.cyan, width: 0 },
  );
  api.rect(ctx, x - 177, y - 49, 354, 98, C.cyan, null, 24);
  api.text(ctx, 'Approved.', x, y + 20, 61, C.bg, 'center');
}

function delivery(ctx, api, event, x, approach, crossing) {
  const { C, focus } = api;
  const stop = 552;
  const arrival = Math.max(0, (crossing - 0.32) / 0.68);
  const gap = event.served ? 205 * Math.min(1, crossing / 0.32) : 0;
  const y = 417 + (stop - 417) * approach + (event.served ? 230 * arrival : 0);

  api.text(
    ctx,
    'Request ' + event.id + '    HTTP 200  ·  ' + event.total + ' ms',
    x,
    335,
    36,
    C.ink,
    'center',
  );
  focus.target('output-' + event.id, () => {
    api.rect(ctx, x - 283, 683, 566, 183, C.panel, C.muted, 19);
    api.line(ctx, x, 868, x, 891, C.muted, 7);
    api.line(ctx, x - 72, 893, x + 72, 893, C.muted, 7);
    if (crossing >= 1 && !event.served)
      api.text(ctx, 'No approval received', x, 797, 37, C.muted, 'center');
  });
  focus.target('gate-' + event.id, () => {
    api.line(ctx, x - 265, 628, x - gap, 628, C.blue, 10);
    api.line(ctx, x + gap, 628, x + 265, 628, C.blue, 10);
  });
  focus.target('draft-' + event.id, () => approvalBubble(ctx, api, x, y));
}

export function drawOpening(ctx, scene, state, api) {
  const { C, focus } = api;
  if (state.t < 0.35) ctx.globalAlpha = 1;
  const progress = (id) => focus.progress(id, 0);
  const approach = 1 - (1 - Math.min(1, state.t / 1.9)) ** 2;
  const crossing = progress('follow-delivery');
  const verdict = state.cues?.['page-exemplar']?.phase === 'after';

  api.text(ctx, '“Can I deploy?”', 120, 245, 61, C.ink, 'left', 'serif');
  focus.target('policy-record', () => {
    api.text(ctx, 'Deployment record  /  v17', 850, 238, 34, C.blue);
    if (progress('read-record') > 0) api.text(ctx, 'No approval on file', 1330, 238, 39, C.yellow);
  });
  api.text(ctx, 'Draft reply', 120, 505, 35, C.muted);
  api.text(ctx, 'Serving gate', 120, 638, 35, C.blue);
  api.text(ctx, 'Received', 120, 791, 35, C.muted);
  requests.forEach((event, i) => delivery(ctx, api, event, 683 + 780 * i, approach, crossing));

  if (progress('count-window') > 0) {
    focus.target('window-count', () =>
      api.text(
        ctx,
        'Unsafe deliveries    ' +
          windowCounts.unsafe +
          ' / ' +
          windowCounts.reviewed +
          ' reviewed requests',
        120,
        985,
        37,
        C.blue,
      ),
    );
    if (progress('link-trace') > 0)
      focus.target('example-trace', () =>
        api.text(ctx, 'Trace 205    retrieval → chat → gate', 1030, 985, 37, C.cyan),
      );
    return;
  }
  focus.target('policy-decision', () => {
    focus.target('page-rule', () => {
      if (verdict) {
        api.text(ctx, 'Page on 205. The approval reached the engineer.', 120, 989, 45, C.pink);
      } else if (progress('page-rule') > 0) {
        api.text(
          ctx,
          'Page if an unsupported approval reaches an engineer.',
          120,
          989,
          41,
          C.yellow,
        );
      }
    });
  });
}

export default {
  id: 'opening',
  draw: drawOpening,
  cues: [
    'two-drafts',
    'read-record',
    'page-rule',
    'follow-delivery',
    'choose-request',
    'page-exemplar',
    'count-window',
    'link-trace',
  ],
};
