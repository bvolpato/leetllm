import { ARTICLE_RECORD } from './fixtures.mjs';
import { exactIdentity } from './model.mjs';

export const paraphrase = 'How long do revoked keys stay in audit logs?';
export const liveQuestion = "What is incident INC-48192's current status?";
const storedKey = exactIdentity(ARTICLE_RECORD.source_query).slice(0, 10);
const incomingKey = exactIdentity(paraphrase).slice(0, 10);

export function drawDeskHeadings(ctx, api) {
  const { C } = api;
  api.line(ctx, 112, 253, 865, 253, C.blue, 4);
  api.line(ctx, 1055, 253, 1808, 253, C.cyan, 4);
  api.text(ctx, 'Saved public policy', 112, 228, 32, C.blue);
  api.text(ctx, 'Incoming request', 1055, 228, 32, C.cyan);
}

export function policyDesk(
  ctx,
  api,
  { arrival, message, compare, showKeys, field, transfer, route },
) {
  const { C, focus } = api;
  const text = (str, x, y, size, color = C.ink, align = 'left', font = 'sans') =>
    api.text(ctx, str, x, y, size, color, align, font);

  focus.target('stored-value', () => {
    const x = 115,
      y = 247,
      w = 720;
    api.rect(ctx, x + 10, y + 14, w, 384, C.muted, undefined, 16);
    api.rect(ctx, x, y, w, 384, C.ink, undefined, 16);
    api.rect(ctx, x, y, w, 88, C.blue, undefined, 14);
    for (const dx of [70, w - 70])
      api.rect(ctx, x + dx - 10, y - 18, 20, 40, C.muted, undefined, 8);
    text('Saved public policy', x + w / 2, y + 58, 36, C.bg, 'center');
    text('Revoked API keys remain visible\nin audit logs for', x + 42, y + 158, 40, C.bg);
    text('30 days', x + 39, y + 342, 122, C.bg, 'left', 'serif');
  });

  focus.target('incoming-question', () => {
    const x = 972 + 104 * (1 - arrival),
      y = 258 + 88 * (1 - arrival),
      w = 758;
    api.rect(ctx, x, y, w, 238, C.panel, C.cyan, 36);
    api.path(
      ctx,
      [
        { x: x + 59, y: y + 236 },
        { x: x + 40, y: y + 267 },
        { x: x + 111, y: y + 236 },
      ],
      {
        color: C.cyan,
        fill: C.panel,
        width: 3,
      },
    );
    text('Incoming message', x + 42, y + 66, 32, C.cyan);
    text(message, x + 42, y + 137, 48);
  });

  if (compare) {
    focus.target('saved-question', () => {
      text('Original question', 118, 710, 30, C.muted);
      text(ARTICLE_RECORD.source_query, 118, 770, 37);
    });
  }
  if (showKeys) {
    focus.target('exact-keys', () => {
      text('Key  ' + storedKey, 118, 836, 32, C.blue, 'left', 'mono');
      text('Key  ' + incomingKey, 994, 600, 32, C.cyan, 'left', 'mono');
    });
  }
  if (field) focus.target('requested-field', () => text(field, 994, 686, 43, C.yellow));

  focus.target('reply-slot', () => {
    if (route) {
      api.arrow(ctx, 990, 802, 1085, 802, C.cyan, 5);
      text(route, 1112, 817, 45);
    } else if (transfer > 0) {
      const x = api.lerp(118, 977, api.ease(transfer));
      api.rect(ctx, x, 862, 806, 146, C.panel, C.green, 22);
      text(ARTICLE_RECORD.response.replace(' in audit logs', '\nin audit logs'), x + 33, 921, 43);
    } else {
      api.line(ctx, 992, 854, 1776, 854, C.muted, 3);
      text('Reply', 993, 815, 32, C.muted);
    }
  });
}
