import { sampleModel } from '../model.mjs';
import { card, text } from '../defaults.mjs';
export function drawIntro(ctx, scene, state, api) {
  if (drawIntroContinuation(ctx, scene, state, api)) return;
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('intro', state),
    currentBeat = modelState.b;
  if (state.cues) {
  }
  const route = (a, z, color = themeColors.cyan) =>
    teaching.transfer({
      source: {
        shape: a,
        opacity: 1,
      },
      target: {
        shape: z,
        opacity: 1,
      },
      progress: modelState.q,
      color,
      particle: {
        radius: 7,
        fill: color,
      },
      margin: 3,
    });
  {
    text(
      ctx,
      api,
      'Alex · ticket 48291 · invoice A10234',
      960,
      300,
      40,
      themeColors.yellow,
      'center',
    );
    text(ctx, api, '“I think I was charged twice.”', 960, 410, 36, themeColors.ink, 'center');
    const invoice = api.focus.target('invoice-record', () =>
        card(ctx, api, 'Verified invoice', 160, 610, 450, themeColors.blue),
      ),
      policy = api.focus.target('published-policy', () =>
        card(ctx, api, 'Published policy', 750, 610, 450, themeColors.cyan),
      ),
      gate = api.focus.target('action-boundary', () =>
        card(ctx, api, 'Application action gate', 1340, 610, 450, themeColors.green),
      );
    route(invoice, policy);
    route(policy, gate, themeColors.green);
    api.focus.target('specialist-route', () =>
      text(
        ctx,
        api,
        '900 USD request → specialist review',
        960,
        880,
        43,
        themeColors.yellow,
        'center',
      ),
    );
    text(
      ctx,
      api,
      'Constructed service · model drafts an explanation from verified business state',
      960,
      1010,
      28,
      themeColors.muted,
      'center',
    );
  }
}
function drawIntroContinuation(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  if (currentBeat < 3) return false;
  const { C } = api;
  return true;
}
export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['invoice-case', 'trusted-boundaries', 'specialist-policy'],
};
