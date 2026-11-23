import { labels, referenceLabel, secondContext } from '../fixtures.mjs';
import { phraseEnded } from '../arithmetic.mjs';
import { outputProjection, projectContext } from '../model.mjs';
import { checkReply } from '../workload.mjs';
import { card, text } from '../defaults.mjs';

const firstToken = outputProjection().selected;
const nextToken = projectContext(secondContext).selected;

export function drawOpening(ctx, scene, state, api) {
  const { C } = api;
  if (state.t < 0.35) ctx.globalAlpha = 1;
  const continued = state.beat > 0 || phraseEnded(state, 'print-period', 0.69);
  const checked = state.beat > 1 || (state.beat === 1 && phraseEnded(state, 'exact-match', 0.12));
  const reply = continued ? firstToken + nextToken : firstToken;

  const fold = { x: 620, y: 271 };
  const corner = { x: 720, y: 371 };
  api.path(
    ctx,
    [{ x: 165, y: fold.y }, fold, corner, { x: corner.x, y: 850 }, { x: 165, y: 850 }],
    { closed: true, fill: C.ink, width: 0 },
  );
  api.path(ctx, [fold, corner, { x: fold.x, y: corner.y }], {
    closed: true,
    fill: C.blue,
    width: 0,
  });
  text(ctx, api, 'Review note', 225, 390, 40, C.bg);
  api.line(ctx, 225, 439, 581, 439, C.bg, 3);
  api.text(ctx, 'Stale', 218, 602, 120, C.bg, 'left', 'serif');
  api.text(ctx, 'guide', 218, 746, 120, C.bg, 'left', 'serif');

  text(ctx, api, 'Model reply', 935, 366, 42, C.muted);
  api.focus.target('model-reply', () => {
    api.text(ctx, firstToken, 1355, 584, 170, C.ink, 'right', 'mono');
    if (continued) api.text(ctx, nextToken, 1355, 584, 170, C.yellow, 'left', 'mono');
    if (!checked) {
      const caret = continued ? 1466 : 1365;
      api.rect(ctx, caret, 441, 8, 153, C.yellow, null, 2);
    } else {
      const { allowed } = checkReply(reply);
      text(ctx, api, allowed ? 'Accepted' : 'Rejected', 935, 673, 48, allowed ? C.green : C.pink);
    }
  });
  text(ctx, api, 'Tracker labels', 935, 793, 36, C.muted);
  labels.forEach((label, i) => {
    const drawLabel = () => card(ctx, api, label, 935 + 248 * i, 823, 222, 90, C.blue, 42);
    if (label === referenceLabel) api.focus.target('tracker-label', drawLabel);
    else drawLabel();
  });
}

export default {
  id: 'opening',
  draw: drawOpening,
  cues: ['print-period', 'exact-match', 'allowed-labels', 'whole-reply'],
};
