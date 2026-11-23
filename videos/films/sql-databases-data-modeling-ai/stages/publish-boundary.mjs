import { directed } from '../construction.mjs';
import { drawSqlRow, drawSqlText } from '../defaults.mjs';

export function drawPublishBoundary(ctx, scene, state, api) {
  const { C } = api;
  const at = (id, beat) => directed(state, id, beat);
  const closed = at('close-api-edition', 0) === 1;
  const read = at('reader-queries-gap', 1) === 1;
  const staged = at('stage-api-edition', 1) === 1;
  const rolled = at('rollback-api-edition', 1) === 1;
  const original = ['d7   /   c7a', 'API keys rotate within seven days.'];
  const next = ['d7-next   /   c7-next', 'API keys rotate within five days.'];

  drawSqlText(
    ctx,
    api,
    'SQLite lab   /   Acme Cloud   /   API Key Policy   /   August 12',
    145,
    273,
    33,
    C.ink,
  );
  if (state.beat < 2) {
    api.focus.target('writer-edition', () => {
      drawSqlText(ctx, api, 'Writer’s active source', 145, 392, 35, C.blue);
      api.line(ctx, 145, 427, 895, 427, C.blue, 3);
      const active = rolled || !closed ? original : staged ? next : null;
      if (active) drawSqlRow(ctx, api, active[0], active[1], 145, 503, 750, C.cyan);
      else {
        drawSqlText(ctx, api, 'Active document IDs: [ ]', 170, 590, 36, C.yellow);
        drawSqlText(ctx, api, 'Old interval closed on this connection', 145, 740, 28, C.muted);
      }
      if (staged && !rolled)
        drawSqlText(ctx, api, 'Grant for agent:u3 staged', 145, 740, 29, C.cyan);
      if (rolled) drawSqlText(ctx, api, 'ROLLBACK', 145, 740, 29, C.blue);
    });
    api.focus.target('reader-edition', () => {
      drawSqlText(ctx, api, 'Second connection’s query', 1025, 392, 35, C.blue);
      api.line(ctx, 1025, 427, 1775, 427, C.blue, 3);
      if (read) {
        drawSqlRow(ctx, api, original[0], original[1], 1025, 503, 750, C.cyan);
        drawSqlText(ctx, api, 'Read while the writer saw an empty result', 1025, 740, 28, C.muted);
      } else drawSqlText(ctx, api, 'Which edition will it read?', 1050, 590, 33, C.muted);
    });
  } else {
    const blocked = at('attempt-writer-slot', 2) === 1;
    api.focus.target('writer-slot', () => {
      drawSqlText(ctx, api, 'Rewind   /   before the version check', 145, 395, 33, C.ink);
      drawSqlText(ctx, api, 'SQLite writer slot', 145, 535, 29, C.muted);
      drawSqlRow(ctx, api, 'Publisher A owns the slot', 'BEGIN IMMEDIATE', 155, 590, 730, C.cyan);
      drawSqlRow(
        ctx,
        api,
        'Publisher B  /  timeout = 0',
        'BEGIN IMMEDIATE',
        1025,
        590,
        730,
        C.blue,
      );
      if (blocked) drawSqlText(ctx, api, 'SQLITE_BUSY', 1025, 854, 36, C.yellow);
    });
  }
}
export default {
  id: 'publish-boundary',
  draw: drawPublishBoundary,
  cues: [
    'close-api-edition',
    'reader-queries-gap',
    'stage-api-edition',
    'rollback-api-edition',
    'attempt-writer-slot',
  ],
};
