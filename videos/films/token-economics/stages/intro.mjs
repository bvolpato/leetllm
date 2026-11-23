import { cueProgress } from '../construction.mjs';
import { text } from '../defaults.mjs';
import { batch, coldEvaluationMicro, evaluationMicro, nightlyCalls } from '../fixtures.mjs';
import { usd } from '../forecast-calendar.mjs';

function nightReceipt(ctx, api, { x, feed, tonight, priced }) {
  const { C } = api;
  const width = 664;
  const paperTop = 322;
  const bottom = 840 + feed;
  const edge = [
    { x, y: paperTop },
    { x: x + width, y: paperTop },
  ];
  for (let tooth = 32; tooth >= 0; tooth--) {
    edge.push({ x: x + (tooth * width) / 32, y: bottom - (tooth % 2) * 12 });
  }
  api.path(ctx, edge, { fill: C.ink, closed: true, width: 0 });
  api.rect(ctx, x - 16, paperTop - 10, width + 32, 18, C.muted, undefined, 8);

  const left = x + 44;
  const right = x + width - 44;
  const ink = C.bg;
  const outputCharge = nightlyCalls * 80 * batch.output;
  const total = tonight ? coldEvaluationMicro : evaluationMicro;
  const show = !tonight || priced;
  const y = 380 + feed;
  api.text(ctx, tonight ? 'Tonight' : 'Last night', left, y, 62, ink, 'left', 'serif');
  text(ctx, api, nightlyCalls.toLocaleString('en-US') + ' checks', right, y - 4, 30, ink, 'right');
  text(
    ctx,
    api,
    tonight ? 'Saved instructions expired' : 'Saved instructions reused',
    left,
    y + 66,
    33,
    ink,
    'left',
  );
  api.line(ctx, left, y + 106, right, y + 106, ink, 2);
  if (tonight && priced) api.rect(ctx, left - 13, y + 128, width - 62, 74, C.yellow, undefined, 5);
  text(ctx, api, 'Read the prompts', left, y + 180, 37, ink, 'left');
  text(ctx, api, show ? usd(total - outputCharge) : '?', right, y + 180, 44, ink, 'right');
  text(ctx, api, 'Write the answers', left, y + 260, 37, ink, 'left');
  text(ctx, api, show ? usd(outputCharge) : '?', right, y + 260, 44, ink, 'right');
  api.line(ctx, left, y + 302, right, y + 302, ink, 2);
  text(ctx, api, 'Total', left, y + 400, 48, ink, 'left');
  api.text(ctx, show ? usd(total) : '?', right, y + 400, 82, ink, 'right', 'mono');
}

export default {
  id: 'intro',
  cues: ['reprice-night-input'],
  draw(ctx, scene, state, api) {
    const beat = state.beat ?? 0;
    const p = state.beatP ?? 0;
    const t = state.t ?? 0;
    if (t < 0.35) ctx.globalAlpha = 1;
    const feed = 116 * api.clamp(t / 1.25);
    const priced = beat === 1 && cueProgress(state, 'reprice-night-input', p) > 0;
    text(
      ctx,
      api,
      'Same prompts and answer lengths. Which charge changes?',
      960,
      247,
      39,
      api.C.ink,
    );
    nightReceipt(ctx, api, { x: 209, feed: 116, tonight: false, priced: true });
    api.focus.target('tonight-receipt', () =>
      nightReceipt(ctx, api, { x: 1047, feed, tonight: true, priced }),
    );
  },
};
