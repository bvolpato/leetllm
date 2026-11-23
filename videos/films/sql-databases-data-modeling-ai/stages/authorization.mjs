import { clamp, mix } from '../arithmetic.mjs';
import { permissions } from '../fixtures.mjs';
import { active, joinedRows } from '../model.mjs';
import { sampleModel } from '../construction.mjs';
import { drawSqlCaption, drawSqlText, withSqlFade, withSqlFocus } from '../defaults.mjs';
export function drawAuthorization(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    m = sampleModel('authorization', state);
  {
    drawSqlText(
      ctx,
      api,
      'Test request   /   Bob   /   Harbor Store   /   August 12',
      960,
      265,
      32,
      themeColors.yellow,
      'center',
    );
    const rows = joinedRows(),
      checks = [
        {
          title: 'Reader',
          p: m.reader,
          color: themeColors.cyan,
          id: 'reader-check',
        },
        {
          title: 'Workspace',
          p: m.owner,
          color: themeColors.blue,
          id: 'workspace-check',
        },
        {
          title: 'Time',
          p: m.time,
          color: themeColors.yellow,
          id: 'time-check',
        },
      ];
    const contextFade = currentBeat === 2 ? Math.max(0, 1 - 5 * m.admit) : 1,
      travel = clamp((m.admit - 0.2) / 0.8);
    withSqlFocus(ctx, api, 'candidate-rows', () => {
      rows.forEach((r, i) => {
        if (currentBeat === 2 && m.allowed.includes(r.id)) return;
        withSqlFade(ctx, api, contextFade, () => {
          const y = 355 + i * 100;
          drawSqlText(ctx, api, r.id, 120, y + 40, 24, themeColors.muted);
          drawSqlText(ctx, api, r.text, 260, y + 40, 27, themeColors.ink);
        });
      });
    });
    checks.forEach((check, j) =>
      withSqlFocus(ctx, api, check.id, () =>
        withSqlFade(ctx, api, contextFade, () => {
          const x = 1120 + j * 260;
          drawSqlText(ctx, api, check.title, x, 310, 28, check.color, 'center');
          rows.forEach((r, i) => {
            const readers = permissions.filter(([id]) => id === r.id).map(([, name]) => name);
            const inHarbor = r.source.workspace === 'w01';
            const inForce = active(r.source);
            const pass = [readers.includes('Bob'), inHarbor, inForce][j];
            const value = [readers.join(', '), inHarbor ? 'Harbor' : 'Birch',
              inForce ? 'In force' : 'Ended July 1'][j];
            const y = 395 + i * 100;
            drawSqlText(ctx, api, value, x, y, 27, themeColors.ink, 'center');
            if (check.p > 0) {
              const color = pass ? themeColors.green : themeColors.pink;
              api.line(ctx, x - 78, y + 15, mix(x - 78, x + 78, check.p), y + 15, color, 4);
              if (!pass && check.p === 1)
                drawSqlText(ctx, api, 'exclude', x, y + 49, 23, color, 'center');
            }
          });
        }),
      ),
    );
    withSqlFocus(ctx, api, 'answer-context', () => {
      if (currentBeat === 2) {
        if (m.admit > 0.2)
          withSqlFade(ctx, api, clamp((m.admit - 0.2) / 0.2), () =>
            drawSqlText(
              ctx,
              api,
              'Admitted answer context',
              960,
              325,
              34,
              themeColors.green,
              'center',
            ),
          );
        rows
          .filter((r) => m.allowed.includes(r.id))
          .forEach((r, i) => {
            const fromY = 395 + rows.findIndex((v) => v.id === r.id) * 100;
            drawSqlText(
              ctx,
              api,
              r.id,
              mix(120, 300, travel),
              mix(fromY, 475 + i * 180, travel),
              24,
              themeColors.green,
            );
            drawSqlText(
              ctx,
              api,
              r.text,
              mix(260, 300, travel),
              mix(fromY, 535 + i * 180, travel),
              27,
              themeColors.ink,
            );
            if (travel === 1)
              drawSqlText(
                ctx,
                api,
                'Return Policy · d7 · Harbor',
                300,
                585 + i * 180,
                25,
                themeColors.muted,
              );
          });
      }
    });
    drawSqlCaption(
      ctx,
      api,
      'All conditions apply to the same retained row identity before it enters the answer',
    );
  }
}
export default {
  id: 'authorization',
  draw: drawAuthorization,
  cues: [
    'inspect-candidates',
    'require-reader',
    'require-workspace',
    'require-time',
    'admit-context',
  ],
};
