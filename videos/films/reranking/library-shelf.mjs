import { passageIds } from './fixtures.mjs';

export const sundayQuestion = 'Is the library open on Sunday?';
export const libraryText = [
  'Saturday story time starts at ten.',
  'Holiday hours vary by branch.',
  'Sunday: the library is closed.',
];

export function libraryShelf(ctx, api, { count, depth, destination, highlight = false }) {
  const { C, focus } = api;
  const rowY = (i) => 342 + 165 * i;
  focus.target('shelf', () => {
    api.text(ctx, 'Search rank', 122, 308, 28, C.muted);
    api.text(ctx, 'Retrieved passage', 338, 308, 28, C.muted);
    for (let i = 0; i < count; i++) {
      const y = rowY(i);
      const color = i === 2 && highlight ? C.green : C.blue;
      api.text(ctx, String(i + 1), 195, y + 87, 56, C.ink, 'center');
      api.rect(ctx, 285, y, 1090, 132, C.panel, color, 8);
      api.text(ctx, passageIds[i], 338, y + 43, 29, color, 'left', 'mono');
      api.text(ctx, libraryText[i], 338, y + 102, 46, C.ink);
    }
  });
  focus.target('cutoff', () => {
    const x = 1430,
      top = rowY(0),
      bottom = rowY(depth - 1) + 132;
    api.path(
      ctx,
      [
        { x: x - 29, y: top },
        { x, y: top },
        { x, y: bottom },
        { x: x - 29, y: bottom },
      ],
      { color: C.yellow, width: 5 },
    );
    api.text(ctx, destination, x + 36, (top + bottom) / 2 - 7, 35, C.yellow);
    const changing = !Number.isInteger(depth);
    api.text(
      ctx,
      changing ? 'Widening…' : `${depth} passages`,
      x + 36,
      (top + bottom) / 2 + 47,
      33,
      C.ink,
    );
  });
}
