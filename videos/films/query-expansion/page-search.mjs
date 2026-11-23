import { lessonFont } from '../../lib/fonts.mjs';
import { FOLLOW_UP, RECOVERY_QUERY, SUPPORT_PAGES } from './fixtures.mjs';
import { search, terms } from './model.mjs';

// Keep both pages in place when the query changes so every new match has a visible source.
export function drawPageSearch(
  ctx,
  api,
  { query, result, prompt, emphasizeHistory, delivery = 1, carry = 0 },
) {
  const { C, focus } = api;
  const label = (s, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);
  function width(s, size) {
    ctx.save();
    ctx.font = lessonFont(size);
    const measured = ctx.measureText(s).width;
    ctx.restore();
    return measured;
  }
  focus.target('prior-turn', () => {
    label('Support chat', 128, 232, 32, C.muted);
    api.rect(ctx, 122, 255, 578, 99, C.panel, undefined, 30);
    const keyX = 159 + width('My ', 54);
    label('My API key leaked.', 159, 325, 54);
    if (emphasizeHistory) {
      api.line(ctx, keyX, 346, keyX + width('API key', 54), 346, C.yellow, 4);
    }
  });

  focus.target('search-input', () => {
    api.circle(ctx, 949, 217, 17, null, C.blue, 5);
    api.line(ctx, 962, 230, 976, 244, C.blue, 5);
    label('Search support docs', 996, 233, 34, C.blue);
    api.path(
      ctx,
      [
        { x: 913, y: 264 },
        { x: 1775, y: 264 },
        { x: 1796, y: 285 },
        { x: 1796, y: 477 },
        { x: 1775, y: 498 },
        { x: 913, y: 498 },
      ],
      { fill: C.panel, color: C.blue, width: 3 },
    );
    const endX = 964 + width('a leaked ', 48);
    if (query === RECOVERY_QUERY) {
      label('How do I revoke and rotate', 964, 364, 48);
      label('a leaked', 964, 438, 48);
      label('API key?', endX, 438, 48, C.yellow);
    } else if (carry > 0) {
      const startX = 159 + width('My ', 54);
      const drop = api.phase(carry, 0.55, 1);
      label('API key', api.lerp(startX, endX, carry), api.lerp(390, 438, drop), 48, C.yellow);
    }
  });

  api.rect(ctx, 166, 408, 514, 94, C.panel, undefined, 30);
  label(FOLLOW_UP, 202, 471, 46);
  if (query === FOLLOW_UP) {
    const x = api.lerp(717, 1016, delivery);
    const y = api.lerp(408, 324, delivery);
    if (delivery < 1) {
      const tail = Math.min(x - 680, 130 * (1 - delivery));
      api.line(ctx, x - tail, y + 54, x, y + 54, C.cyan, 4);
    }
    focus.target('latest-turn', () =>
      focus.target('search-input', () => {
        api.rect(ctx, x, y, 535, 108, C.cyan, undefined, 30);
        label(FOLLOW_UP, x + 36, y + 73, 50, C.bg);
      }),
    );
  }

  const hits = query ? search(query, SUPPORT_PAGES) : [];
  const queryTerms = terms(query ?? '');
  SUPPORT_PAGES.forEach((page, i) => {
    const x = 122 + i * 875;
    const right = x + 799;
    const score = hits.find((hit) => hit.document.id === page.id)?.score ?? 0;
    const best = result && hits[0]?.document.id === page.id;
    const edge = best ? C.green : C.muted;
    api.path(
      ctx,
      [
        { x, y: 592 },
        { x: right - 55, y: 592 },
        { x: right, y: 647 },
        { x: right, y: 909 },
        { x, y: 909 },
      ],
      { closed: true, fill: C.panel, color: edge, width: 2 },
    );
    api.path(
      ctx,
      [
        { x: right - 55, y: 593 },
        { x: right - 55, y: 647 },
        { x: right - 1, y: 647 },
      ],
      { color: edge, width: 2 },
    );
    focus.target('search-pages', () => {
      label(page.id, x + 39, 677, 47, best ? C.green : C.ink);
      let tokenX = x + 39;
      const y = 768;
      ctx.save();
      ctx.font = lessonFont(38);
      for (const token of page.text.split(' ')) {
        const matched = result && queryTerms.has([...terms(token)][0]);
        const width = ctx.measureText(token).width;
        label(token, tokenX, y, 38, matched ? C.cyan : C.ink);
        if (matched) api.line(ctx, tokenX, y + 11, tokenX + width, y + 11, C.cyan, 3);
        tokenX += width + ctx.measureText(' ').width;
      }
      ctx.restore();
    });
    focus.target('match-count', () => {
      label('Distinct matches', x + 39, 866, 32, C.muted);
      label(result ? score : '?', right - 43, 870, 51, best ? C.green : C.muted, 'right');
    });
  });
  label(prompt, 960, 1002, 36, C.yellow, 'center');
}

export { FOLLOW_UP, RECOVERY_QUERY };
