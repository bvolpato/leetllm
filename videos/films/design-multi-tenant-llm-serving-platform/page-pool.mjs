const PAGE_SIZE = 16;
const PAGE_COUNT = 5;

// Token positions in the lesson start at one. Block indices and slot offsets start at zero.
export function locatePosition(table, position) {
  const block = Math.floor((position - 1) / PAGE_SIZE);
  const page = table[block];
  return page === undefined ? null : { page, slot: (position - 1) % PAGE_SIZE };
}

export function privateHistory({ bTokens = 31, retired = false, reassigned = false } = {}) {
  const tables = { A: retired ? [] : [0, 2, 4], B: reassigned ? [1, 3, 4] : [1, 3] };
  const tokens = { A: retired ? 0 : 47, B: bTokens };
  if (reassigned && !retired) throw Error('P4 still has an A reader');
  const pages = Array.from({ length: PAGE_COUNT }, (_, id) => ({
    id,
    owner: null,
    block: null,
    used: 0,
  }));
  for (const [owner, table] of Object.entries(tables)) {
    if (tokens[owner] > table.length * PAGE_SIZE) throw Error('A write requires an owned page');
    table.forEach((id, block) => {
      pages[id] = {
        id,
        owner,
        block,
        used: Math.min(PAGE_SIZE, Math.max(0, tokens[owner] - block * PAGE_SIZE)),
      };
    });
  }
  return { tables, tokens, pages, freePages: pages.filter((p) => !p.owner).length };
}

export function drawPagePool(
  ctx,
  api,
  history,
  { pendingPosition, markedPosition, tracedPage, note, noteColor },
) {
  const { C } = api;
  const ink = { A: C.blue, B: C.pink };
  api.focus.target('history-tables', () => {
    for (const [row, owner] of ['A', 'B'].entries()) {
      const y = 238 + row * 80;
      api.text(ctx, owner, 136, y + 37, 43, ink[owner]);
      const table = history.tables[owner];
      api.text(
        ctx,
        table.length ? history.tokens[owner] + ' cached positions' : 'request retired',
        220,
        y + 33,
        36,
        table.length ? C.ink : C.muted,
      );
      if (!table.length) api.text(ctx, 'no page mappings', 755, y + 33, 37, C.muted);
      table.forEach((id, i) => {
        const x = 755 + 139 * i;
        api.text(ctx, 'P' + id, x, y + 33, 37, id === tracedPage ? C.yellow : ink[owner]);
        if (i < table.length - 1) api.text(ctx, '→', x + 75, y + 33, 34, ink[owner]);
      });
    }
    api.text(ctx, 'Logical order', 755, 217, 26, C.muted);
  });
  const mark = markedPosition ? locatePosition(history.tables.B, markedPosition) : null;
  api.focus.target('worker-pages', () => {
    history.pages.forEach((page) => {
      const x = 132 + page.id * 342;
      const color = ink[page.owner] ?? C.muted;
      const border = page.id === tracedPage ? C.yellow : color;
      api.text(ctx, 'P' + page.id, x + 144, 464, 44, border, 'center');
      api.rect(ctx, x, 490, 288, 260, C.panel, border, 13);
      for (let i = 0; i < PAGE_SIZE; i++) {
        const cx = x + 22 + (i % 4) * 64;
        const cy = 512 + Math.floor(i / 4) * 57;
        const marked = mark?.page === page.id && mark.slot === i;
        api.rect(
          ctx,
          cx,
          cy,
          51,
          43,
          marked ? C.yellow : i < page.used ? color : C.bg,
          i < page.used ? undefined : C.muted,
          4,
        );
        if (marked) api.text(ctx, String(markedPosition), cx + 25.5, cy + 32, 28, C.bg, 'center');
      }
      api.text(
        ctx,
        page.owner ? page.owner + ' · ' + page.used + ' / ' + PAGE_SIZE : 'free page',
        x + 144,
        803,
        32,
        color,
        'center',
      );
    });
  });
  api.focus.target('pending-write', () => {
    api.text(
      ctx,
      pendingPosition ? 'B needs position ' + pendingPosition : 'Worker page pool',
      136,
      897,
      39,
      pendingPosition ? C.pink : C.ink,
    );
    api.text(
      ctx,
      'Free pages   ' + history.freePages + ' / ' + PAGE_COUNT,
      1780,
      897,
      36,
      C.ink,
      'right',
    );
    api.text(ctx, note, 136, 991, 41, noteColor ?? C.ink);
  });
}
