import { money } from '../arithmetic.mjs';
import { sampleModel } from '../model.mjs';
import {
  card,
  drawSupportFooter,
  drawSupportHeading,
  drawSupportRectangle,
  drawSupportText,
  supportCueVisible,
  text,
  withSupportFocus,
} from '../defaults.mjs';
export function drawState(ctx, scene, state, api) {
  if (drawStateContinuation(ctx, scene, state, api)) return;
  const { C: themeColors, components: components, teaching: teaching } = api,
    modelState = sampleModel('state', state),
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
      currentBeat === 0 ? 'Original case · R4' : 'Customer switched invoice · R5',
      960,
      285,
      40,
      themeColors.yellow,
      'center',
    );
    const live = api.focus.target('current-invoice', () =>
        card(
          ctx,
          api,
          `Current ${modelState.current.invoice} / R${modelState.current.revision}`,
          160,
          440,
          650,
          themeColors.blue,
        ),
      ),
      receipt = api.focus.target('worker-receipt', () =>
        card(
          ctx,
          api,
          `Worker ${modelState.receipt.invoice} / R${modelState.receipt.revision}`,
          1120,
          440,
          650,
          modelState.accepted ? themeColors.green : themeColors.pink,
        ),
      );
    const fence = api.focus.target('merge-fence', () =>
      components.card({
        label: 'Check',
        x: 865,
        y: 440,
        width: 210,
        height: 100,
        fontSize: 26,
        textColor: modelState.accepted ? themeColors.green : themeColors.pink,
        fill: themeColors.panel,
        stroke: modelState.accepted ? themeColors.green : themeColors.pink,
        padding: 12,
      }),
    );
    route(receipt, fence, modelState.accepted ? themeColors.green : themeColors.pink);
    if (modelState.accepted) route(fence, live, themeColors.green);
    api.focus.target('current-invoice', () =>
      text(
        ctx,
        api,
        `State amount ${money(modelState.current.amount)}`,
        485,
        690,
        38,
        themeColors.blue,
        'center',
      ),
    );
    api.focus.target('worker-receipt', () =>
      text(
        ctx,
        api,
        `Observed amount ${money(modelState.receipt.amount)}`,
        1445,
        690,
        38,
        themeColors.cyan,
        'center',
      ),
    );
    api.focus.target('merge-fence', () =>
      text(
        ctx,
        api,
        modelState.accepted
          ? 'Merge accepted · customer + invoice + revision match'
          : 'Stale receipt rejected · invoice and revision differ',
        960,
        900,
        37,
        modelState.accepted ? themeColors.green : themeColors.pink,
        'center',
      ),
    );
    text(
      ctx,
      api,
      'Authoritative amount in integer cents · summaries stay outside the authorization path',
      960,
      1010,
      27,
      themeColors.muted,
      'center',
    );
  }
}
function drawStateContinuation(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  if (currentBeat < 3) return false;
  const { C: themeColors } = api;
  {
    drawSupportHeading(ctx, api, 'A fluent summary can lose a digit');
    const conflict = supportCueVisible(ctx, api, 'summary-conflict'),
      trusted = supportCueVisible(ctx, api, 'trusted-amount');
    withSupportFocus(ctx, api, 'summary-conflict', () => {
      drawSupportRectangle(ctx, api, 150, 390, 640, 245, themeColors.pink);
      drawSupportText(ctx, api, 'Conversation summary', 470, 450, 30, themeColors.pink, 'center');
      drawSupportText(
        ctx,
        api,
        conflict ? '“Request: $90.00”' : 'Lossy dialogue summary',
        470,
        550,
        40,
        themeColors.pink,
        'center',
      );
    });
    const source = withSupportFocus(ctx, api, 'trusted-amount', () => {
      const a = drawSupportRectangle(ctx, api, 1130, 390, 640, 245, themeColors.blue);
      drawSupportText(
        ctx,
        api,
        'Validated invoice / application state',
        1450,
        450,
        28,
        themeColors.blue,
        'center',
      );
      drawSupportText(ctx, api, '90000 cents = $900.00', 1450, 550, 38, themeColors.blue, 'center');
      return a;
    });
    const gate = drawSupportRectangle(
      ctx,
      api,
      650,
      760,
      620,
      120,
      trusted ? themeColors.green : themeColors.muted,
    );
    drawSupportText(
      ctx,
      api,
      trusted ? 'Action gate reads 90000 cents' : 'Gate awaits authoritative facts',
      960,
      835,
      32,
      trusted ? themeColors.green : themeColors.muted,
      'center',
    );
    if (trusted)
      api.connect(ctx, source, gate, {
        color: themeColors.green,
        gap: 20,
      });
    drawSupportText(
      ctx,
      api,
      'Server: identity · tenant · region',
      960,
      940,
      28,
      themeColors.cyan,
      'center',
    );
    drawSupportFooter(
      ctx,
      api,
      'A schema checks representation. Invoice evidence establishes the amount.',
    );
  }
  return true;
}
export default {
  id: 'state',
  draw: drawState,
  cues: [
    'typed-invoice',
    'invoice-switch',
    'reject-stale',
    'fresh-receipt',
    'summary-conflict',
    'trusted-amount',
  ],
};
