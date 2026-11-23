import { sourceLookup } from '../model.mjs';
import { defaultDays } from '../fixtures.mjs';
import { detailText, heading, line, phraseProgress, tile } from '../defaults.mjs';
function freshReport(ctx, api, state) {
  const { C } = api;
  const beat = state.beat;
  const c = sourceLookup(true);
  const d = sourceLookup(true, 'D');
  const transfer = beat < 4 ? 0 : beat > 4 ? 1 : api.phase(state.beatP ?? 0, 0, 0.34);
  detailText(ctx, api, 'Frozen lookup', 130, 252, 41, C.ink);
  detailText(ctx, api, 'Known page C → ' + c.prediction + ' days', 130, 326, 34, C.blue);
  detailText(ctx, api, 'Unknown page → ' + defaultDays + ' days', 130, 387, 34, C.blue);
  detailText(ctx, api, 'New-source report', 1415, 252, 42, C.ink, 'center');
  detailText(
    ctx,
    api,
    'Exact retention period · one question per page',
    1415,
    326,
    29,
    C.muted,
    'center',
  );
  line(ctx, api, 1070, 360, 1760, 360, C.muted, 2);
  api.rect(ctx, 130, 459, 678, 165, C.panel, C.blue, 10);
  detailText(ctx, api, 'C  ·  used in tuning', 154, 520, 37, C.ink);
  detailText(
    ctx,
    api,
    c.prediction + ' predicted    /    ' + c.truth + ' days in the policy',
    154,
    586,
    31,
    C.ink,
  );
  if (beat < 4) detailText(ctx, api, 'Awaiting a result', 1415, 520, 36, C.muted, 'center');
  const x = api.lerp(130, 1080, transfer);
  const y = api.lerp(662, 436, api.phase(transfer, 0.73, 1));
  if (phraseProgress(state, api, 'page-d-arrives', 2, 0.23, 0.4) > 0) {
    api.focus.target('page-d', () => {
      api.rect(ctx, x, y, 678, 165, C.panel, transfer === 1 ? C.green : C.blue, 10);
      detailText(ctx, api, 'D  ·  first seen after freeze', x + 24, y + 61, 37, C.ink);
      const predicted = phraseProgress(state, api, 'page-d-predicted', 2, 0.7, 0.82) >= 1;
      const prediction = predicted ? d.prediction + ' predicted' : 'Prediction pending';
      const opened = phraseProgress(state, api, 'page-d-policy', 3, 0.07, 0.23) === 1;
      const truth = opened ? d.truth + ' days in the policy' : 'policy sealed';
      detailText(ctx, api, prediction + '    /    ' + truth, x + 24, y + 127, 31, C.ink);
    });
  }
  if (transfer === 1) {
    detailText(ctx, api, Number(d.correct) + ' / 1', 1415, 743, 91, C.green, 'center');
    detailText(ctx, api, 'correct on a previously unseen page', 1415, 806, 32, C.ink, 'center');
  }
  if (beat === 3 && phraseProgress(state, api, 'page-d-policy', 3, 0.07, 0.23) === 1)
    detailText(
      ctx,
      api,
      'Both answers match. Which one goes in the report?',
      960,
      960,
      44,
      C.yellow,
      'center',
    );
  const next = phraseProgress(state, api, 'next-manual', 5, 0.42, 0.65);
  if (next > 0)
    api.focus.target('next-page', () => {
      const left = api.lerp(1220, 1080, next);
      api.rect(ctx, left, 865, 678, 124, C.panel, C.blue, 10);
      detailText(ctx, api, 'Next unseen manual', left + 24, 913, 32, C.ink);
      detailText(ctx, api, 'Prediction pending    /    policy sealed', left + 24, 962, 29, C.muted);
    });
}
export function drawSourceTransfer(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const currentBeat = state.beat ?? 0;
  if (currentBeat >= 2) return freshReport(ctx, api, state);

  heading(ctx, api, 'The report covers manuals the assistant has never used in tuning.');
  const group = phraseProgress(state, api, 'source-group', 1, 0, 0.1);
  const exposed = phraseProgress(state, api, 'source-exposed', 1, 0.21, 0.34);
  const matched = phraseProgress(state, api, 'source-match', 1, 0.36, 0.47);
  const remove = phraseProgress(state, api, 'source-remove', 1, 0.55, 0.66);
  const fallback = phraseProgress(state, api, 'source-fallback', 1, 0.7, 0.81);
  const checked = phraseProgress(state, api, 'source-result', 1, 0.82, 0.88) === 1;
  const removed = remove === 1;
  const on = sourceLookup(true);
  const off = sourceLookup(false);
  const first = phraseProgress(state, api, 'c-first-passage', 0, 0.33, 0.5) > 0;
  const sibling = phraseProgress(state, api, 'c-sibling', 0, 0.53, 0.7) > 0;
  const question = phraseProgress(state, api, 'c-question', 0, 0.72, 0.85) > 0;
  line(ctx, api, 960, 320, 960, 925, themeColors.yellow, 3);
  detailText(ctx, api, 'Tuning', 510, 310, 31, themeColors.blue, 'center');
  detailText(
    ctx,
    api,
    group < 1 ? 'Awaiting a split' : 'Held out',
    1400,
    310,
    31,
    themeColors.pink,
    'center',
  );
  api.focus.target('source-children', () => {
    const dx = 860 * remove;
    if (currentBeat === 0) {
      if (first) line(ctx, api, 360, 452, 360, 568, themeColors.blue, 3);
      if (sibling) {
        line(ctx, api, 872, 400, 1255, 400, themeColors.muted, 3);
        line(ctx, api, 1255, 400, 1255, 568, themeColors.muted, 3);
      }
      if (question) line(ctx, api, 1255, 662, 1255, 748, themeColors.muted, 3);
    }
    tile(
      ctx,
      api,
      first ? 'Source C: retention 7 days' : 'Source C: retention policy',
      220 + dx,
      350,
      650,
      100,
      removed ? themeColors.pink : themeColors.blue,
    );
    if (first)
      tile(
        ctx,
        api,
        'C1: 7-day rule',
        220 + dx,
        570,
        280,
        90,
        removed ? themeColors.pink : themeColors.blue,
      );
    if (sibling)
      tile(
        ctx,
        api,
        'C2: after a week',
        1080 - 560 * group + dx,
        570,
        350,
        90,
        removed ? themeColors.pink : themeColors.blue,
      );
    if (question)
      tile(
        ctx,
        api,
        'Q: retention period?',
        1080 - 860 * group + dx,
        750,
        650,
        90,
        removed ? themeColors.pink : group === 1 ? themeColors.blue : themeColors.yellow,
      );
  });
  if (currentBeat === 0 && question)
    detailText(
      ctx,
      api,
      'C1 entered tuning. Where does its sibling question go?',
      960,
      975,
      39,
      themeColors.yellow,
      'center',
    );
  if (currentBeat >= 1) {
    api.focus.target('lookup-result', () => {
      tile(
        ctx,
        api,
        removed
          ? 'Lookup memory: C entry removed'
          : exposed === 1
            ? 'Lookup memory: C → 7 days'
            : 'Lookup memory: C entry not stored yet',
        220,
        465,
        650,
        75,
        removed ? themeColors.muted : exposed === 1 ? themeColors.green : themeColors.muted,
      );
      if (matched === 1) {
        if (remove === 0)
          detailText(
            ctx,
            api,
            'Exposed lookup: ' + on.prediction + ' days → correct',
            545,
            911,
            31,
            themeColors.green,
            'center',
          );
        else
          detailText(
            ctx,
            api,
            'Earlier exposed result: 7 days → correct',
            545,
            700,
            29,
            themeColors.muted,
            'center',
          );
      }
      if (removed) {
        detailText(
          ctx,
          api,
          'Held-out question · truth: ' + off.truth + ' days',
          545,
          800,
          29,
          themeColors.blue,
          'center',
        );
        detailText(
          ctx,
          api,
          fallback === 1
            ? 'Recomputed fallback: ' + off.prediction + ' days' + (checked ? ' → wrong' : '')
            : 'Recompute without C: ?',
          545,
          875,
          30,
          fallback === 1 ? themeColors.pink : themeColors.muted,
          'center',
        );
      }
    });
    detailText(
      ctx,
      api,
      remove > 0
        ? 'Separate replay · rebuild the lookup without policy C'
        : 'Lookup rule · return the stored period, or ' +
            defaultDays +
            ' days for an unknown source',
      960,
      1010,
      31,
      themeColors.yellow,
      'center',
    );
  }
}
export default {
  id: 'source-transfer',
  draw: drawSourceTransfer,
  cues: [
    'c-first-passage',
    'c-sibling',
    'c-question',
    'source-group',
    'source-result',
    'source-exposed',
    'source-match',
    'source-remove',
    'source-fallback',
    'page-d-arrives',
    'page-d-predicted',
    'page-d-policy',
    'next-manual',
  ],
};
