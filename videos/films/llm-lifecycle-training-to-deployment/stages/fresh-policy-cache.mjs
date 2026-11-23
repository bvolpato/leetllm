import {
  activeChecker,
  activeRule,
  checkReply,
  oldChecker,
  oldRule,
  replayShortKey,
  replyRequest,
  storeReply,
} from '../arithmetic.mjs';
import { sceneCues, verdict } from '../picture.mjs';

function drawLookup(ctx, api, width, storedRule, storedChecker, empty = false) {
  const { C } = api;
  const names = ['Key ID', 'Checkpoint', 'Age', 'Stale?', 'Policy', 'Checker'];
  const xs = [466, 735, 981, 1190, 1445, 1706];
  const fields = (r, policy, checker) => [
    r.id,
    r.model,
    r.age + ' d',
    r.stale ? 'Yes' : 'No',
    policy.version,
    checker.version,
  ];
  const saved = fields(replyRequest, storedRule, storedChecker);
  const query = fields(replyRequest, activeRule, activeChecker);
  const right = 850 + width * (1802 - 850);
  api.text(ctx, 'Cache key', 122, 348, 34, C.yellow);
  api.line(ctx, 363, 338, right, 338, C.yellow, 4);
  api.line(ctx, 363, 338, 363, 357, C.yellow, 4);
  api.line(ctx, right, 338, right, 357, C.yellow, 4);
  api.text(ctx, 'Saved entry', 122, 532, 34, C.muted);
  api.text(ctx, 'This request', 122, 647, 34, C.cyan);
  names.forEach((name, i) => {
    api.text(ctx, name, xs[i], 425, 30, C.muted, 'center');
    api.text(ctx, empty ? '·' : saved[i], xs[i], 532, 42, C.ink, 'center');
    const differs = !empty && saved[i] !== query[i] && xs[i] < right;
    api.text(ctx, query[i], xs[i], 647, 42, differs ? C.yellow : C.ink, 'center');
    if (differs) api.line(ctx, xs[i] - 38, 668, xs[i] + 38, 668, C.yellow, 3);
  });
}

export function drawFreshPolicyCache(ctx, scene, state, api) {
  const { C } = api;
  const cue = sceneCues(scene, state);
  const prior = replayShortKey(replyRequest, replyRequest);
  const live = checkReply(replyRequest);
  const stored = storeReply(live);
  const cacheHit = checkReply(replyRequest, stored);
  const below = { ...replyRequest, age: activeRule.threshold - 1 };
  const edge = { ...replyRequest, age: activeRule.threshold };
  const currentKey = { ...edge, stale: false };
  const edgeAnswer = checkReply(edge, stored);
  const currentAnswer = checkReply(currentKey, storeReply(edgeAnswer));
  api.focus.target('fresh-policy-cache-mechanism', () => {
    if (cue.started('cache-fact')) {
      api.text(ctx, edge.id + '   ·   ' + edge.age + ' days', 960, 311, 65, C.ink, 'center');
      api.text(
        ctx,
        activeRule.version +
          '   ·   Checker ' +
          activeChecker.version +
          '   ·   Checkpoint ' +
          edge.model,
        960,
        405,
        40,
        C.muted,
        'center',
      );
      let newAnswer = '?';
      if (cue.after('cache-last-result')) newAnswer = verdict(currentAnswer.eligible);
      else if (cue.after('cache-last-miss') && currentAnswer.kind === 'recompute')
        newAnswer = 'Lookup misses';
      for (const [x, label, request, answer] of [
        [525, 'Saved reply', edge, verdict(edgeAnswer.eligible)],
        [1395, 'This request', currentKey, newAnswer],
      ]) {
        api.text(ctx, label, x, 506, 36, C.muted, 'center');
        api.text(
          ctx,
          request.stale ? 'Marked stale' : 'Marked current',
          x,
          579,
          48,
          C.cyan,
          'center',
        );
        api.line(ctx, x - 250, 634, x + 250, 634, C.muted, 3);
        api.text(ctx, answer, x, 762, 77, C.ink, 'center');
      }
      if (state.beat === 3 && cue.started('cache-last-question'))
        api.text(ctx, 'Can we reuse the eligible reply?', 960, 939, 44, C.yellow, 'center');
      if (cue.after('cache-replays'))
        api.text(
          ctx,
          'Rotations executed   ' + (Number(edgeAnswer.executed) + Number(currentAnswer.executed)),
          960,
          939,
          37,
          C.muted,
          'center',
        );
      return;
    }
    api.text(ctx, 'Active policy  90 d', 125, 250, 38, C.ink);
    api.text(ctx, 'Delivered passage  90 d', 770, 250, 38, C.ink, 'center');
    api.text(ctx, 'Checker C3  ·  stale and age ≥ 90 d', 1800, 250, 37, C.cyan, 'right');
    if (state.beat === 3) {
      api.text(ctx, 'Boundary replays', 125, 432, 37, C.muted);
      [below, edge].forEach((request, i) => {
        const x = 740 + i * 680;
        const revealed = cue.after(i ? 'cache-equal' : 'cache-below');
        api.text(ctx, request.age + ' days', x, 464, 63, C.ink, 'center');
        api.text(ctx, 'Marked stale', x, 549, 35, C.cyan, 'center');
        api.line(ctx, x - 190, 600, x + 190, 600, C.muted, 2);
        api.text(
          ctx,
          revealed ? verdict(checkReply(request, stored).eligible) : '?',
          x,
          719,
          52,
          revealed ? C.ink : C.muted,
          'center',
        );
      });
      return;
    }
    const savedNew = cue.after('cache-store');
    drawLookup(
      ctx,
      api,
      cue.progress('cache-bind'),
      savedNew ? activeRule : oldRule,
      savedNew ? activeChecker : oldChecker,
      cue.after('cache-retire') && !savedNew,
    );
    let left = '',
      right = '',
      question = '';
    if (state.beat < 2) {
      if (cue.after('cache-returned'))
        left = 'Saved reply    ' + verdict(prior.eligible) + '  (v2)';
      if (cue.after('cache-bypass')) right = 'Bypass    ' + verdict(live.eligible) + '  (v3)';
      if (state.beat === 0 && cue.started('cache-predict'))
        question = 'With reuse bypassed, what will C3 return?';
    } else {
      left = savedNew
        ? 'Stored reply    ' + verdict(live.eligible)
        : cue.after('cache-retire')
          ? 'Old entry retired'
          : 'Saved reply    ' + verdict(prior.eligible) + '  (v2)';
      if (cue.after('cache-miss')) right = 'Miss    ·    Recompute';
      if (cue.after('cache-live'))
        right = 'Checker    ' + verdict(live.eligible) + '    ·    No action';
      if (cue.after('cache-hit') && cacheHit.kind === 'hit')
        right = 'Identical replay    ·    Cache hit';
    }
    if (left) api.text(ctx, left, 125, 812, 40, C.ink);
    if (right) api.text(ctx, right, 1790, 812, 40, C.cyan, 'right');
    if (question) api.text(ctx, question, 960, 948, 44, C.yellow, 'center');
  });
}
export default {
  id: 'fresh-policy-cache',
  draw: drawFreshPolicyCache,
  cues: [
    'cache-returned',
    'cache-key',
    'cache-predict',
    'cache-bypass',
    'cache-retire',
    'cache-bind',
    'cache-miss',
    'cache-live',
    'cache-store',
    'cache-hit',
    'cache-below',
    'cache-equal',
    'cache-fact',
    'cache-last-question',
    'cache-last-miss',
    'cache-last-result',
    'cache-replays',
  ],
};
