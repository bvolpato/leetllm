import { spoken } from '../construction.mjs';
import { SEARCH_TEXT } from '../fixtures.mjs';
import { freshSearchState } from '../model.mjs';
import { drawExceptionSpan } from '../source-span.mjs';
import { drawMigrationWindow, migrationDecision } from '../migration-window.mjs';

function drawReleasedQuotes(ctx, api, pack) {
  const { C } = api;
  api.focus.target('fresh-publisher', () => {
    api.text(ctx, 'Both complete current quotations released', 155, 286, 45, C.green);
    for (const [i, quote] of [...pack.quotes].reverse().entries()) {
      const y = 365 + 298 * i;
      const split = quote.quote.indexOf(' after');
      api.rect(ctx, 156, y, 1608, 239, C.panel, i ? C.blue : C.green, 6);
      api.text(
        ctx,
        `${quote.id}@${quote.revision}   [${quote.start},${quote.end})`,
        189,
        y + 50,
        29,
        i ? C.blue : C.green,
        'left',
        'mono',
      );
      api.text(ctx, quote.quote.slice(0, split), 189, y + 122, 38, C.ink, 'left', 'serif');
      api.text(ctx, quote.quote.slice(split + 1), 189, y + 183, 38, C.ink, 'left', 'serif');
    }
  });
}

export function drawFreshSearch(ctx, scene, state, api) {
  const { C } = api;
  const cue = (id) => spoken(scene, state, id);
  const beat = state.beat ?? 0;
  if (beat >= 3) {
    const onFriday = cue('fresh-friday').phase !== 'before';
    const changed = cue('fresh-thursday').phase === 'after';
    const extension = cue('fresh-inside');
    const decision = migrationDecision(2, 40, { granted: true, beforeFriday: changed });
    drawMigrationWindow(ctx, api, decision, {
      base: 1,
      offer: 1,
      extension: extension.progress,
      record: changed
        ? 'Security approval recorded · Thursday morning'
        : onFriday
          ? 'Security approval recorded · Friday morning'
          : '',
      question:
        cue('fresh-ask').phase !== 'before' ? 'Does this approval cover a start on day 40?' : '',
      verdict: changed
        ? extension.phase === 'after'
        : cue('fresh-thursday').phase === 'before' && cue('fresh-outside').phase === 'after',
    });
    return;
  }
  const updated = cue('se-fresh-search-new-input').phase === 'after';
  const short = freshSearchState(1);
  const complete = freshSearchState(2);
  const cached = freshSearchState(0);
  const restore = cue('se-fresh-search-2');
  const released =
    complete.valid &&
    restore.phase === 'after' &&
    cue('se-fresh-search-recheck').phase === 'after' &&
    cue('se-fresh-search-result').phase === 'after';
  if (released) {
    drawReleasedQuotes(ctx, api, complete);
    return;
  }
  const cachedQuote = cached.quotes[1];
  const shortQuote = short.quotes[1];
  const end = updated
    ? Math.round(shortQuote.end + (complete.quotes[1].end - shortQuote.end) * restore.progress)
    : cachedQuote.end;
  drawExceptionSpan(
    ctx,
    api,
    updated ? SEARCH_TEXT.fresh : SEARCH_TEXT.exception,
    updated ? 2 : 1,
    end,
  );
  api.focus.target('fresh-packs', () => {
    api.text(
      ctx,
      `${updated ? 'Both packs keep' : 'Cached policy'}  policy@2   [0,${complete.quotes[0].end})`,
      160,
      751,
      30,
      C.blue,
    );
    api.text(ctx, `Registry · exception@${updated ? 2 : 1}`, 1755, 751, 34, C.ink, 'right');
    const stale = cue('se-fresh-search-rejection').phase === 'after' && !cachedQuote.valid;
    const incomplete = cue('se-fresh-search-short').phase === 'after' && !shortQuote.valid;
    api.text(
      ctx,
      `A   Cached    exception@1   [0,${cachedQuote.end})`,
      160,
      833,
      32,
      C.ink,
      'left',
      'mono',
    );
    if (stale) api.text(ctx, 'Older revision', 1730, 833, 32, C.pink, 'right');
    if (updated) {
      api.text(ctx, `B   Current   exception@2   [0,${end})`, 160, 894, 32, C.ink, 'left', 'mono');
      const status =
        restore.phase === 'after'
          ? 'Full quotation'
          : restore.phase === 'during'
            ? 'Rebuilding quotation'
            : incomplete
              ? 'Friday condition missing'
              : '';
      api.text(ctx, status, 1730, 894, 31, restore.phase === 'after' ? C.green : C.pink, 'right');
    }
  });
  api.focus.target('fresh-publisher', () => {
    const question = cue('se-fresh-search-0').phase !== 'before';
    api.text(
      ctx,
      beat === 0 && question
        ? 'Which pack can the publisher release: A, B, or neither?'
        : cue('se-fresh-search-1').phase !== 'before'
          ? 'Answer withheld while the current evidence is checked.'
          : 'Two quotations from the same workspace',
      160,
      993,
      37,
      C.yellow,
    );
  });
}

export default {
  id: 'fresh-search',
  draw: drawFreshSearch,
  cues: [
    'se-fresh-search-0',
    'se-fresh-search-new-input',
    'se-fresh-search-1',
    'se-fresh-search-rejection',
    'se-fresh-search-short',
    'se-fresh-search-2',
    'se-fresh-search-fetch',
    'se-fresh-search-recheck',
    'se-fresh-search-result',
    'fresh-day',
    'fresh-friday',
    'fresh-ask',
    'fresh-outside',
    'fresh-thursday',
    'fresh-inside',
  ],
};
