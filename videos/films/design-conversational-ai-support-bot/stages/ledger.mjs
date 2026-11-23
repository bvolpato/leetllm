import { money } from '../arithmetic.mjs';
import { confirmed } from '../fixtures.mjs';
import { enqueue, payload, sampleModel } from '../model.mjs';
import {
  card,
  drawSupportArrow,
  drawSupportFooter,
  drawSupportHeading,
  drawSupportRectangle,
  drawSupportText,
  supportCueVisible,
  text,
  withSupportFocus,
} from '../defaults.mjs';
export function drawLedger(ctx, scene, state, api) {
  if (drawLedgerContinuation(ctx, scene, state, api)) return;
  const { C: themeColors, components: components, teaching: teaching } = api,
    modelState = sampleModel('ledger', state),
    currentBeat = modelState.b;
  if (state.cues) {
    modelState.store = [];
    modelState.inserted = currentBeat > 0 || api.focus.visible('insert-credit');
    const first = modelState.inserted
      ? enqueue(modelState.store, 'credit:48291', payload(confirmed))
      : {
          status: 'PREPARED',
          entry: null,
        };
    modelState.result =
      currentBeat === 0
        ? first
        : enqueue(
            modelState.store,
            'credit:48291',
            currentBeat === 1
              ? payload(confirmed)
              : {
                  ...payload(confirmed),
                  amount: 4000,
                },
          );
    modelState.responseLost = currentBeat === 0 && api.focus.visible('lose-reply');
  }
  {
    const invoiceDuplicate =
      currentBeat === 2 ? enqueue(modelState.store, 'credit:49302', payload(confirmed)) : null;
    api.focus.target('operation-key', () =>
      text(ctx, api, 'Operation key: credit:48291', 960, 270, 40, themeColors.yellow, 'center'),
    );
    const request = api.focus.target('credit-request', () =>
      card(
        ctx,
        api,
        `${currentBeat ? 'Retry' : 'Confirmed request'} · ${money(modelState.attempted)}\nInvoice A10234`,
        150,
        385,
        540,
        currentBeat === 2 ? themeColors.pink : themeColors.blue,
        150,
      ),
    );
    const entry = api.focus.target('queue-entry', () =>
      components.panel({
        x: 1150,
        y: 385,
        width: 620,
        height: 270,
        fill: themeColors.panel,
        stroke: modelState.inserted ? themeColors.green : themeColors.muted,
        padding: 18,
      }),
    );
    text(ctx, api, 'CREDIT QUEUE · retained entry', 1460, 350, 27, themeColors.green, 'center');
    if (modelState.inserted) {
      api.focus.target('queue-entry', () =>
        text(ctx, api, 'credit:48291', 1460, 448, 33, themeColors.yellow, 'center'),
      );
      api.focus.target('queue-entry', () =>
        text(ctx, api, 'A10234 · gpu-usage · 35.00 USD', 1460, 520, 28, themeColors.ink, 'center'),
      );
      api.focus.target('queue-entry', () =>
        card(ctx, api, 'PENDING · downstream processing', 1190, 555, 540, themeColors.green, 72),
      );
    } else
      text(ctx, api, '0 entries · awaiting insert', 1460, 525, 29, themeColors.muted, 'center');
    const transferProgress = currentBeat ? modelState.q : Math.min(1, modelState.q / 0.3);
    teaching.transfer({
      source: {
        shape: request,
        opacity: 1,
      },
      target: {
        shape: entry,
        opacity: 1,
      },
      progress: transferProgress,
      color: currentBeat === 2 ? themeColors.pink : themeColors.cyan,
      particle: {
        radius: 8,
        fill: themeColors.yellow,
      },
      gap: 18,
    });
    if (modelState.inserted && currentBeat !== 2) {
      const reply = api.focus.target('delivery-receipt', () =>
        card(
          ctx,
          api,
          currentBeat
            ? 'Replay existing result'
            : modelState.responseLost
              ? 'Reply lost in transit'
              : 'Insert receipt',
          390,
          715,
          540,
          modelState.responseLost ? themeColors.pink : themeColors.cyan,
          80,
        ),
      );
      if (!modelState.responseLost)
        teaching.transfer({
          source: {
            shape: entry,
            opacity: 1,
          },
          target: {
            shape: reply,
            opacity: 1,
          },
          progress: modelState.replyProgress,
          color: themeColors.green,
          particle: {
            radius: 7,
            fill: themeColors.green,
          },
          gap: 18,
        });
      if (currentBeat)
        text(
          ctx,
          api,
          'Same key + same payload → same entry',
          1260,
          770,
          29,
          themeColors.green,
          'center',
        );
    }
    if (currentBeat === 2)
      api.focus.reveal('invoice-unique-fence', () => {
        const second = api.focus.target('other-ticket', () =>
          card(
            ctx,
            api,
            'Ticket49302 · key credit:49302\nA10234 / gpu-usage / $35.00',
            150,
            680,
            650,
            themeColors.blue,
            165,
            27,
          ),
        );
        const fence = api.focus.target('invoice-unique-fence', () =>
          card(
            ctx,
            api,
            'Invoice/item uniqueness\n' + invoiceDuplicate.status + ' · no insert',
            1100,
            680,
            660,
            themeColors.pink,
            165,
            27,
          ),
        );
        api.connect(ctx, second, fence, {
          color: themeColors.pink,
          gap: 18,
        });
      });
    api.focus.target('queue-outcome', () =>
      text(
        ctx,
        api,
        modelState.responseLost
          ? 'Entry persists while the client outcome is uncertain'
          : modelState.result.status === 'CONFLICT'
            ? 'CONFLICT · changed amount rejected'
            : modelState.result.status,
        960,
        905,
        36,
        modelState.result.status === 'CONFLICT' ? themeColors.pink : themeColors.yellow,
        'center',
      ),
    );
    api.focus.target('queue-outcome', () =>
      text(
        ctx,
        api,
        `Actual queue entries: ${modelState.store.length} · invoice uniqueness is a separate atomic fence`,
        960,
        1010,
        28,
        themeColors.muted,
        'center',
      ),
    );
  }
}
function drawLedgerContinuation(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  if (currentBeat < 3) return false;
  const { C: themeColors } = api;
  {
    drawSupportHeading(ctx, api, 'Local dictionaries do not arbitrate concurrent processes');
    const race = supportCueVisible(ctx, api, 'local-race'),
      atomic = supportCueVisible(ctx, api, 'atomic-outbox'),
      version = supportCueVisible(ctx, api, 'destination-version');
    ['Process A', 'Process B'].forEach((name, i) => {
      const x = 160 + i * 820;
      drawSupportText(ctx, api, name, x + 310, 365, 31, themeColors.blue, 'center');
      drawSupportRectangle(ctx, api, x, 405, 620, 230, themeColors.blue);
      drawSupportText(
        ctx,
        api,
        race ? 'Local read: 0 entries' : 'Local serial demonstration',
        x + 310,
        475,
        29,
        themeColors.blue,
        'center',
      );
      if (race)
        drawSupportText(
          ctx,
          api,
          atomic ? 'Submit same invoice/item' : 'Both can prepare an insert',
          x + 310,
          565,
          28,
          atomic ? themeColors.yellow : themeColors.pink,
          'center',
        );
    });
    withSupportFocus(ctx, api, 'local-race', () => {
      if (race && !atomic)
        drawSupportText(
          ctx,
          api,
          'Two empty local views supply no shared exclusion',
          960,
          715,
          33,
          themeColors.pink,
          'center',
        );
    });
    withSupportFocus(ctx, api, 'atomic-outbox', () => {
      if (atomic) {
        drawSupportRectangle(ctx, api, 360, 705, 1200, 140, themeColors.green);
        drawSupportText(
          ctx,
          api,
          'Shared transaction: unique invoice/item + balance + outbox',
          960,
          755,
          30,
          themeColors.green,
          'center',
        );
        drawSupportText(
          ctx,
          api,
          '1 pending operation · later worker revalidates before applying',
          960,
          810,
          27,
          themeColors.green,
          'center',
        );
        drawSupportArrow(ctx, api, 470, 650, 700, 695, themeColors.green);
        drawSupportArrow(ctx, api, 1290, 650, 1220, 695, themeColors.green);
      }
    });
    withSupportFocus(ctx, api, 'destination-version', () => {
      if (version)
        drawSupportText(
          ctx,
          api,
          'Stripe v1: retained executed result   |   v2: failed-work retry contract differs',
          960,
          945,
          28,
          themeColors.yellow,
          'center',
        );
    });
    drawSupportFooter(
      ctx,
      api,
      'Destination API version, parameter identity and key retention govern replay.',
    );
  }
  return true;
}
export default {
  id: 'ledger',
  draw: drawLedger,
  cues: [
    'insert-credit',
    'lose-reply',
    'retry-payload',
    'recover-entry',
    'changed-payload',
    'invoice-unique-fence',
    'local-race',
    'atomic-outbox',
    'destination-version',
  ],
};
