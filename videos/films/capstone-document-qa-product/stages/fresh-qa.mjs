import { SHIPPING_EXCEPTION, SHIPPING_PASSAGE, SHIPPING_QUESTION } from '../fixtures.mjs';
import { freshShippingAnswer, sharedTerms } from '../model.mjs';

const variants = [SHIPPING_QUESTION, SHIPPING_EXCEPTION];

export function drawFreshQa(ctx, scene, state, api) {
  const { C, focus } = api;
  const p = (id) => focus.progress(id, 0);
  const changed = state.beat > 0 || p('fresh-question-change') > 0;
  const original = freshShippingAnswer(false);
  const revised = freshShippingAnswer(true);
  const originalReady = state.beat > 0 || p('fresh-original') === 1;
  const revisedReady = state.beat > 1 || p('fresh-response') === 1;

  focus.target('shipping-source', () => {
    api.text(ctx, SHIPPING_PASSAGE.documentId, 112, 254, 32, C.blue, 'left', 'mono');
    api.text(ctx, SHIPPING_PASSAGE.text, 112, 333, 45, C.ink, 'left', 'serif');
    api.line(ctx, 112, 378, 1808, 378, C.blue, 4);
  });
  variants.slice(0, changed ? 2 : 1).forEach((question, index) => {
    const y = 463 + index * 215;
    const result = index ? revised : original;
    const check = result.checks.find((field) => field.field === 'questionSha256');
    const ready = index ? revisedReady : originalReady;
    const target = index ? 'revised-question' : 'reviewed-question';
    focus.target(target, () => {
      api.text(
        ctx,
        index ? 'Revised question' : 'Reviewed question',
        112,
        y,
        29,
        index ? C.yellow : C.blue,
      );
      api.text(
        ctx,
        question.replace(' before hazardous', '\nbefore hazardous'),
        112,
        y + 54,
        36,
        C.ink,
      );
      api.text(
        ctx,
        `${sharedTerms(question, SHIPPING_PASSAGE.text).length} shared terms · rank 1`,
        112,
        y + 153,
        27,
        C.muted,
      );
      api.text(ctx, 'Question SHA', 1120, y, 28, C.muted);
      api.text(ctx, check.current.slice(0, 10), 1120, y + 55, 32, C.ink, 'left', 'mono');
    });
    focus.target('shipping-response', () => {
      api.text(ctx, index ? 'Current response' : 'Receipt on file', 1485, y, 28, C.muted);
      api.text(
        ctx,
        index ? (ready ? result.status : '?') : check.receipt.slice(0, 10),
        1485,
        y + 55,
        32,
        index && ready ? C.pink : C.ink,
        'left',
        'mono',
      );
      if (!index && ready)
        api.text(ctx, 'Cite [0, ' + result.citations[0].span[1] + ')', 1485, y + 114, 30, C.green);
      if (index && ready && (state.beat > 1 || p('fresh-empty-cites') === 1))
        api.text(ctx, 'citations: []', 1485, y + 114, 30, C.pink);
    });
  });
  focus.target('shipping-decision', () => {
    if (state.beat === 0) {
      if (p('fresh-predict') > 0)
        api.text(
          ctx,
          'Can the service cite this passage for the revised question?',
          112,
          972,
          42,
          C.yellow,
        );
      return;
    }
    const reason = state.beat > 1 || p('fresh-reason-complete') === 1;
    if (reason) api.text(ctx, 'ABSTAIN · question-bound review rejected', 112, 908, 32, C.pink);
    else
      api.text(ctx, 'Compare the revised question with the receipt on file.', 112, 908, 32, C.ink);
    if (state.beat === 1 && p('fresh-fallback-complete') === 1)
      api.text(ctx, revised.answer, 112, 983, 42, C.ink, 'left', 'serif');
    if (state.beat > 1)
      api.text(
        ctx,
        'Keep both rows     •     One useful answer     •     One required refusal',
        112,
        983,
        35,
        C.ink,
      );
  });
}

export default {
  id: 'fresh-qa',
  draw: drawFreshQa,
  cues: [
    'fresh-source',
    'fresh-original',
    'fresh-question-change',
    'fresh-predict',
    'fresh-response',
    'fresh-fallback-complete',
    'fresh-reason-complete',
    'fresh-empty-cites',
    'fresh-row',
  ],
};
