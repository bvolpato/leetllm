import { active, joinedRows } from '../model.mjs';
import { sampleModel } from '../construction.mjs';
import {
  drawSqlBox,
  drawSqlCaption,
  drawSqlTable,
  drawSqlText,
  withSqlFocus,
  wrapSqlText,
} from '../defaults.mjs';
export function drawIndexes(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    m = sampleModel('indexes', state);
  {
    if (currentBeat === 0) {
      if (m.build === 0) {
        drawSqlText(
          ctx,
          api,
          'Before publication  /  August 12 request  /  seven permission rows',
          960,
          300,
          32,
          themeColors.blue,
          'center',
        );
        withSqlFocus(ctx, api, 'permission-table', () =>
          drawSqlTable(
            ctx,
            api,
            ['row', 'paragraph', 'reader'],
            m.rows.map((r) => [r.id, r.chunkId, r.principal]),
            345,
            420,
            [180, 470, 310],
            58,
            themeColors.blue,
            m.rows.slice(0, m.scanCount).map((_, i) => ({
              row: i,
              column: 0,
              fill: '#183744',
              stroke: themeColors.cyan,
            })),
          ),
        );
        drawSqlText(
          ctx,
          api,
          m.scanCount === 7 ? 'seven rows inspected' : 'scanning permission rows',
          960,
          885,
          27,
          themeColors.muted,
          'center',
        );
      } else {
        drawSqlText(
          ctx,
          api,
          'Before publication  /  build an ordered index on the same seven rows',
          960,
          290,
          29,
          themeColors.muted,
          'center',
        );
        drawSqlBox(ctx, api, 125, 360, 255, 490, themeColors.blue);
        drawSqlText(ctx, api, 'Original table', 252, 410, 26, themeColors.blue, 'center');
        drawSqlText(ctx, api, '7 rows', 252, 465, 34, themeColors.ink, 'center');
        drawSqlText(ctx, api, 'unchanged', 252, 510, 24, themeColors.muted, 'center');
        withSqlFocus(ctx, api, 'permission-table', () => {});
        withSqlFocus(ctx, api, 'principal-index', () => {
          const zoomed = m.seek === 1 && m.built === 7,
            visible = zoomed
              ? m.sorted.filter((r) => r.principal === 'Bob')
              : m.sorted.slice(0, m.built),
            rows = visible.map((r) => [r.principal, r.chunkId, r.id]);
          drawSqlText(
            ctx,
            api,
            zoomed
              ? 'Zoom · Bob’s four-entry range'
              : 'Index key: reader → paragraph → row pointer',
            1070,
            365,
            28,
            themeColors.yellow,
            'center',
          );
          if (rows.length)
            drawSqlTable(
              ctx,
              api,
              ['reader', 'paragraph', 'row pointer'],
              rows,
              465,
              430,
              [255, 370, 260],
              zoomed ? 82 : 58,
              themeColors.yellow,
            );
          if (m.built < 7)
            drawSqlText(
              ctx,
              api,
              'building ordered entries · ' + m.built + ' / 7',
              1070,
              885,
              25,
              themeColors.muted,
              'center',
            );
          if (m.seek > 0 && m.built === 7 && !zoomed) {
            const y = 430 + 3 * 58;
            api.rect(ctx, 458, y - 5, 895, 4 * 58 + 10, 'transparent', themeColors.yellow, 3);
            drawSqlText(
              ctx,
              api,
              'Bob’s four-entry range',
              895,
              y + 4 * 58 + 36,
              27,
              themeColors.yellow,
              'center',
            );
          }
        });
      }
    } else if (currentBeat === 1) {
      const current = m.bob[m.walkIndex],
        candidate = joinedRows().find((row) => row.id === current.chunkId),
        workspacePass = candidate.source.workspace === 'w01',
        timePass = active(candidate.source),
        finished = m.walkProgress === 1;
      drawSqlText(
        ctx,
        api,
        'Before publication  /  Bob’s four grants',
        960,
        290,
        31,
        themeColors.yellow,
        'center',
      );
      drawSqlBox(ctx, api, 120, 365, 790, 260, themeColors.cyan);
      drawSqlText(
        ctx,
        api,
        'Bob · candidate ' + (m.walkIndex + 1) + ' of 4',
        515,
        410,
        26,
        themeColors.cyan,
        'center',
      );
      drawSqlText(
        ctx,
        api,
        wrapSqlText(ctx, api, candidate.text, 700, 33),
        170,
        490,
        33,
        themeColors.ink,
      );
      drawSqlText(
        ctx,
        api,
        candidate.source.title + ' · ' + candidate.source.id + ' · ' + current.chunkId,
        170,
        590,
        22,
        themeColors.muted,
      );
      drawSqlBox(ctx, api, 1000, 365, 800, 260, themeColors.blue);
      drawSqlText(
        ctx,
        api,
        'The request still asks for Harbor’s current policy',
        1400,
        410,
        25,
        themeColors.blue,
        'center',
      );
      drawSqlBox(ctx, api, 1045, 460, 330, 112, themeColors.blue);
      drawSqlText(ctx, api, 'Harbor Store', 1210, 500, 27, themeColors.ink, 'center');
      drawSqlText(
        ctx,
        api,
        finished ? (workspacePass ? 'PASS' : 'STOP · other store') : 'checking',
        1210,
        548,
        23,
        finished ? (workspacePass ? themeColors.green : themeColors.pink) : themeColors.muted,
        'center',
      );
      drawSqlBox(ctx, api, 1415, 460, 330, 112, themeColors.blue);
      drawSqlText(ctx, api, 'Current on August 12', 1580, 500, 26, themeColors.ink, 'center');
      drawSqlText(
        ctx,
        api,
        finished ? (timePass ? 'PASS' : 'STOP · retired version') : 'checking',
        1580,
        548,
        22,
        finished ? (timePass ? themeColors.green : themeColors.pink) : themeColors.muted,
        'center',
      );
      drawSqlText(
        ctx,
        api,
        'Bob’s reader check is already satisfied by this range',
        1400,
        602,
        21,
        themeColors.muted,
        'center',
      );
      withSqlFocus(ctx, api, 'principal-index', () => {
        drawSqlBox(ctx, api, 120, 660, 790, 95, themeColors.yellow);
        drawSqlText(
          ctx,
          api,
          'Bob’s principal index · 4 candidates',
          515,
          719,
          28,
          themeColors.yellow,
          'center',
        );
      });
      withSqlFocus(ctx, api, 'index-result', () => {
        if (m.result > 0 && m.walkedAllowed.length) {
          drawSqlText(
            ctx,
            api,
            'Same two paragraphs survive both filters',
            960,
            805,
            27,
            themeColors.green,
            'center',
          );
          for (const [i, id] of m.walkedAllowed.entries()) {
            const match = joinedRows().find((row) => row.id === id),
              x = 150 + i * 850;
            drawSqlBox(ctx, api, x, 840, 790, 105, themeColors.green);
            drawSqlText(ctx, api, match.text, x + 24, 883, 26, themeColors.ink);
            drawSqlText(ctx, api, id, x + 760, 926, 19, themeColors.muted, 'right');
          }
        }
      });
    } else {
      drawSqlText(
        ctx,
        api,
        'Same permission index · inspect the path SQLite actually chose',
        960,
        300,
        31,
        themeColors.blue,
        'center',
      );
      drawSqlBox(ctx, api, 230, 390, 1460, 150, themeColors.yellow);
      drawSqlText(ctx, api, 'permission_principal_idx', 960, 435, 34, themeColors.yellow, 'center');
      drawSqlText(
        ctx,
        api,
        'reader → paragraph → row pointer',
        960,
        490,
        27,
        themeColors.ink,
        'center',
      );
      drawSqlBox(ctx, api, 400, 590, 1120, 120, themeColors.blue);
      drawSqlText(ctx, api, 'Bob’s range', 960, 630, 25, themeColors.blue, 'center');
      drawSqlText(
        ctx,
        api,
        m.bob.map((row) => row.chunkId).join('     ·     '),
        960,
        675,
        28,
        themeColors.ink,
        'center',
      );
      withSqlFocus(ctx, api, 'query-plan', () => {
        if (m.plan > 0) {
          drawSqlBox(ctx, api, 330, 765, 1260, 150, themeColors.cyan);
          drawSqlText(
            ctx,
            api,
            'SQLite’s measured plan',
            960,
            810,
            25,
            themeColors.muted,
            'center',
          );
          drawSqlText(
            ctx,
            api,
            'SEARCH chunk_permissions USING COVERING INDEX',
            960,
            855,
            29,
            themeColors.cyan,
            'center',
          );
          drawSqlText(
            ctx,
            api,
            'permission_principal_idx (principal=?)',
            960,
            895,
            25,
            themeColors.ink,
            'center',
          );
        }
      });
    }
    drawSqlCaption(
      ctx,
      api,
      'The index narrows candidate rows; measure actual latency and keep the result rule fixed',
    );
  }
}
export default {
  id: 'indexes',
  draw: drawIndexes,
  cues: [
    'scan-permissions',
    'build-principal-index',
    'seek-reader-range',
    'walk-reader-range',
    'preserve-result-rule',
    'inspect-real-plan',
  ],
};
