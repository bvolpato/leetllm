import { freshResumeSnapshot } from '../model.mjs';
import {
  completed,
  editedWords,
  firstDifference,
  movement,
  returnedWords,
  savedPrefix,
  shortPrompt,
  shortReply,
} from '../replay.mjs';
import { bracket, ruler, slot } from '../strips.mjs';

const x = 288;
const width = 139;
const last = returnedWords.length - 1;

export function drawFreshResume(ctx, scene, state, api) {
  const { C } = api;
  const b = state.beat;
  const snapshot = freshResumeSnapshot(state);
  const dealt = Math.ceil(shortReply.length * movement(state, 0, 'fresh-deal'));
  const edited = completed(state, 3, 'fresh-edit');
  const request = edited ? editedWords : returnedWords;
  const rebuilding = movement(state, 4, 'fresh-rebuild') > 0;
  const rebuilt = completed(state, 4, 'fresh-rebuild');
  const differenceShown = completed(state, 4, 'fresh-difference');
  const visibleSequence = request.slice(0, shortPrompt.length + dealt);
  const checkingEdit = b >= 3;
  const prefixLength = snapshot.cacheShown ? savedPrefix.length : shortPrompt.length;
  let cache = returnedWords.slice(0, snapshot.resumed ? returnedWords.length : prefixLength);
  if (checkingEdit) cache = savedPrefix;
  if (rebuilding) cache = rebuilt ? editedWords : [];
  const difference =
    edited && !rebuilt ? firstDifference(savedPrefix, request.slice(0, savedPrefix.length)) : -1;

  api.focus.target('fresh-tracks', () => {
    const question = edited ? 'birds sing?' : 'Why sing?';
    api.text(ctx, '“' + question + '”', 100, 266, 70, C.ink, 'left', 'serif');
    api.text(
      ctx,
      checkingEdit
        ? rebuilt
          ? 'Edited replay'
          : 'Reopened ten-position cache'
        : 'Ordinary greedy run',
      1810,
      260,
      34,
      C.muted,
      'right',
    );
    ruler(ctx, api, x, 350, width, returnedWords.length);
    api.text(ctx, 'Request', 100, 465, 36, C.blue);
    api.text(
      ctx,
      rebuilding ? 'Fresh KV' : checkingEdit ? 'Saved KV' : 'Cached KV',
      100,
      715,
      36,
      C.cyan,
    );
    for (let i = 0; i < returnedWords.length; i++) {
      const left = x + i * width;
      const focusDifference = differenceShown && i === difference;
      const input = visibleSequence[i];
      slot(ctx, api, {
        x: left,
        y: 402,
        width,
        word: input,
        size: input === 'assistant' ? 25 : 32,
        color: focusDifference ? C.pink : C.blue,
      });
      slot(ctx, api, {
        x: left,
        y: 652,
        width,
        word: cache[i],
        size: cache[i] === 'assistant' ? 25 : 32,
        color: focusDifference ? C.pink : C.cyan,
      });
      if (!snapshot.cacheShown && i >= shortPrompt.length && input)
        api.text(ctx, '?', left + width / 2 - 3, 720, 40, C.yellow, 'center');
      if (rebuilding && !rebuilt) {
        const cx = left + width / 2;
        const progress = movement(state, 4, 'fresh-rebuild');
        api.line(ctx, cx, 608, cx, 608 + 36 * progress, C.cyan, 4);
      }
    }
    bracket(ctx, api, x + 5, x + shortPrompt.length * width - 16, 537, '7 prompt tokens', C.muted);
    if (dealt === shortReply.length)
      bracket(
        ctx,
        api,
        x + shortPrompt.length * width + 6,
        x + returnedWords.length * width - 16,
        537,
        '4 selected tokens',
        C.muted,
      );
    if (b === 2 && !snapshot.resumed && snapshot.forwardP > 0) {
      const cx = x + (last + 0.5) * width;
      api.line(ctx, cx, 602, cx, 602 + 41 * snapshot.forwardP, C.cyan, 4);
      api.circle(ctx, cx, 602 + 41 * snapshot.forwardP, 7, C.cyan);
    }
    if (b <= 1) {
      api.text(
        ctx,
        snapshot.sequenceShown ? snapshot.sequence + ' returned' : 'Returned positions ?',
        100,
        915,
        48,
        snapshot.sequenceShown ? C.blue : C.ink,
      );
      api.text(
        ctx,
        snapshot.cacheShown ? snapshot.cache + ' cached' : 'Cached positions ?',
        728,
        915,
        48,
        snapshot.cacheShown ? C.cyan : C.ink,
      );
      api.text(
        ctx,
        snapshot.cacheShown ? 'One slot open' : 'Send which word?',
        1360,
        915,
        44,
        C.yellow,
      );
    } else if (b === 2) {
      api.text(ctx, returnedWords.length + ' returned', 100, 915, 48, C.blue);
      api.text(ctx, cache.length + ' cached', 728, 915, 48, C.cyan);
      api.text(ctx, snapshot.resumed ? 'Scores ready' : 'Forward “mate”', 1360, 915, 44, C.yellow);
    } else {
      let message = 'Can this cache supply the prefix for “mate”?';
      if (completed(state, 4, 'fresh-reference')) {
        message = 'Compare scores at position 10 with the serving runtime.';
      } else if (rebuilt) {
        message = 'Eleven edited positions processed';
      } else if (rebuilding) {
        message = 'Full forward on the eleven edited tokens…';
      } else if (differenceShown) {
        message = 'Position 2: request “birds”   /   saved prefix “Why”';
      }
      api.text(ctx, message, 100, 915, 47, rebuilt ? C.green : b === 4 ? C.pink : C.yellow);
    }
  });
}
export default {
  id: 'fresh-resume',
  draw: drawFreshResume,
  cues: [
    'fresh-deal',
    'fresh-predict',
    'hf-fresh-sequence',
    'hf-fresh-cache',
    'fresh-save',
    'hf-fresh-forward',
    'fresh-filled',
    'fresh-edit',
    'fresh-again',
    'fresh-difference',
    'fresh-rebuild',
    'fresh-reference',
  ],
};
