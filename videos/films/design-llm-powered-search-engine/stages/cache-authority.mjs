import { SEARCH_TEXT } from '../fixtures.mjs';
import { clamp, motion } from '../arithmetic.mjs';
import { quoteReceipt } from '../model.mjs';
import { chapterFooter, chapterRect, chapterSource, chapterText } from '../defaults.mjs';
export function drawCacheAuthority(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cue = (name, index = 0) => {
    const q = state.cues?.['se-cache-authority-' + name];
    if (state.cues && !q)
      throw Error('Undeclared or absent current-scene cue se-cache-authority-' + name);
    return q
      ? {
          progress: q.phase === 'before' ? 0 : q.phase === 'after' ? 1 : q.progress,
          done: q.phase === 'after',
        }
      : {
          progress: currentBeat < index ? 0 : currentBeat > index ? 1 : motion(progress),
          done: currentBeat > index || (currentBeat === index && progress > 0.76),
        };
  };
  const prog = (name, index) => cue(name, index).progress,
    done = (name, index) => cue(name, index).done;
  api.focus.target('se-cache-authority-mechanism', () => {
    const changed = currentBeat > 1 || (currentBeat === 1 && done('invalidate', 1)),
      current = changed ? 3 : 2,
      receipt = quoteReceipt(SEARCH_TEXT.policy, 2, {
        current,
      }),
      rows = [
        ['Authenticated scope', 'workspace-a / engineering'],
        ['Policy source', 'cached@2 / current@' + current],
        ['Model / prompt', 'same chosen configuration'],
        ['Evidence identity', 'policy@2 + exception@1'],
        ['Reuse decision', changed ? 'stale dependency → reject' : 'await current policy check'],
      ];
    chapterSource(
      ctx,
      api,
      'Stored answer candidate' + (changed ? ' · invalidated' : ''),
      '60 days with security approval [policy@2, exception@1]',
      170,
      310,
      1560,
      changed ? themeColors.pink : themeColors.yellow,
    );
    rows.forEach(([name, value], i) => {
      const y = 585 + i * 66;
      chapterText(ctx, api, name, 190, y + 37, 26, themeColors.muted);
      chapterRect(
        ctx,
        api,
        650,
        y,
        1050,
        52,
        themeColors.panel,
        i === 1 && changed ? themeColors.pink : themeColors.blue,
      );
      chapterText(
        ctx,
        api,
        value,
        675,
        y + 36,
        25,
        i === 1 && changed ? themeColors.pink : themeColors.ink,
      );
    });
    if (currentBeat === 1 && changed)
      chapterText(
        ctx,
        api,
        'Actual quote predicate: ' + receipt.valid + ' · cached content unchanged',
        190,
        970,
        29,
        themeColors.pink,
      );
    if (currentBeat === 2) {
      const q = prog('miss', 2);
      chapterText(
        ctx,
        api,
        q
          ? 'Authorized miss: request current policy@3; answer held'
          : 'Current lookup pending; no stale answer sent',
        190,
        970,
        28,
        themeColors.yellow,
      );
    }
    chapterFooter(
      ctx,
      api,
      'Same cached text, changed authoritative dependency. Similarity and TTL cannot make it current.',
    );
  });
}
export default {
  id: 'cache-authority',
  draw: drawCacheAuthority,
  cues: [
    'se-cache-authority-0',
    'se-cache-authority-1',
    'se-cache-authority-invalidate',
    'se-cache-authority-2',
    'se-cache-authority-miss',
  ],
};
