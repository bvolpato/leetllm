import { mix } from '../arithmetic.mjs';
import { sampleModel } from '../construction.mjs';
import { literalSubstringPattern } from '../model.mjs';
import { drawSqlBox, drawSqlCaption, drawSqlText, withSqlFocus } from '../defaults.mjs';
export function drawQuery(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    m = sampleModel('query', state);
  const workspaceName = (id) => (id === 'w01' ? 'Harbor Store' : 'Birch Store');
  {
    if (currentBeat === 0) {
      drawSqlBox(ctx, api, 105, 285, 920, 205, themeColors.blue);
      drawSqlText(ctx, api, 'SQL statement · fixed structure', 155, 325, 27, themeColors.blue);
      withSqlFocus(ctx, api, 'selected-columns', () => {
        drawSqlText(ctx, api, 'SELECT', 155, 380, 32, themeColors.muted);
        drawSqlText(ctx, api, 'id, title', 285, 380, 32, themeColors.cyan);
        drawSqlText(ctx, api, 'FROM documents', 155, 425, 31, themeColors.ink);
        drawSqlText(ctx, api, 'WHERE workspace_id =', 155, 470, 31, themeColors.ink);
      });
      drawSqlBox(ctx, api, 596, 432, 78, 54, themeColors.yellow);
      drawSqlText(ctx, api, '?', 635, 470, 34, themeColors.yellow, 'center');
      api.line(ctx, 685, 458, 1025, 458, themeColors.yellow, 2);
      withSqlFocus(ctx, api, 'bound-value', () => {
        const x = mix(1450, 1035, m.bindTravel),
          y = mix(360, 430, m.bindTravel);
        drawSqlBox(ctx, api, x, y, 190, 64, themeColors.yellow);
        drawSqlText(ctx, api, 'Harbor · w01', x + 95, y + 41, 24, themeColors.yellow, 'center');
        drawSqlText(
          ctx,
          api,
          'Harbor Store identity · bind parameter 1',
          1390,
          330,
          23,
          themeColors.muted,
          'center',
        );
      });
      drawSqlText(ctx, api, 'documents · stored rows', 410, 530, 27, themeColors.blue, 'center');
      const card = (doc, index) => {
        const y = 565 + index * 78,
          processed = index < m.processedCount,
          active = index === m.activeIndex && m.filterProgress < 1,
          color = active
            ? themeColors.yellow
            : processed
              ? doc.workspace === 'w01'
                ? themeColors.green
                : themeColors.pink
              : themeColors.blue;
        drawSqlBox(ctx, api, 105, y, 620, 68, color);
        drawSqlText(ctx, api, doc.title, 130, y + 29, 26, themeColors.ink);
        drawSqlText(
          ctx,
          api,
          doc.id + ' · ' + workspaceName(doc.workspace),
          130,
          y + 55,
          21,
          themeColors.muted,
        );
        if (processed)
          drawSqlText(
            ctx,
            api,
            doc.workspace === 'w01' ? 'kept' : 'excluded',
            690,
            y + 42,
            20,
            doc.workspace === 'w01' ? themeColors.green : themeColors.pink,
            'right',
          );
      };
      withSqlFocus(ctx, api, 'document-rows', () => m.values.forEach(card));
      drawSqlBox(ctx, api, 820, 610, 280, 205, themeColors.cyan);
      drawSqlText(ctx, api, 'WHERE filter', 960, 650, 27, themeColors.cyan, 'center');
      drawSqlText(ctx, api, 'workspace_id =', 960, 700, 27, themeColors.ink, 'center');
      drawSqlText(ctx, api, m.bind === 1 ? 'w01' : '?', 960, 742, 33, themeColors.yellow, 'center');
      drawSqlText(
        ctx,
        api,
        m.bind === 1 ? 'Harbor Store' : m.bindTravel >= 0.98 ? 'ready to bind' : 'value in transit',
        960,
        785,
        22,
        m.bind === 1 ? themeColors.green : themeColors.muted,
        'center',
      );
      if (m.filterProgress > 0) {
        const active = m.values[m.activeIndex],
          fromY = 565 + m.activeIndex * 78 + 34;
        api.arrow(ctx, 728, fromY, 814, 711, themeColors.yellow, 4);
      }
      if (m.filterProgress > 0) api.arrow(ctx, 1107, 711, 1215, 711, themeColors.green, 4);
      withSqlFocus(ctx, api, 'returned-fields', () => {
        drawSqlBox(ctx, api, 1220, 530, 585, 330, themeColors.green);
        drawSqlText(
          ctx,
          api,
          'Returned fields · SELECT id, title',
          1512,
          570,
          26,
          themeColors.green,
          'center',
        );
        if (m.selectedRows.length) {
          m.selectedRows.forEach(([id, title], i) => {
            const y = 600 + i * 78;
            drawSqlBox(ctx, api, 1250, y, 525, 64, themeColors.green);
            drawSqlText(ctx, api, title, 1272, y + 28, 26, themeColors.ink);
            drawSqlText(ctx, api, id, 1750, y + 51, 19, themeColors.muted, 'right');
          });
        } else
          drawSqlText(
            ctx,
            api,
            m.bind === 1 ? 'Waiting to test matching rows' : 'Rows appear after the value binds',
            1512,
            700,
            25,
            themeColors.muted,
            'center',
          );
      });
    } else {
      drawSqlBox(ctx, api, 110, 285, 1000, 185, themeColors.blue);
      drawSqlText(ctx, api, 'SQL statement · unchanged', 160, 325, 27, themeColors.blue, 'left');
      drawSqlText(
        ctx,
        api,
        "WHERE chunk_text LIKE ? ESCAPE '!'",
        160,
        390,
        32,
        themeColors.cyan,
        'left',
      );
      drawSqlBox(ctx, api, 1140, 285, 660, 185, themeColors.yellow);
      drawSqlText(
        ctx,
        api,
        'Bound search value · data',
        1470,
        325,
        27,
        themeColors.yellow,
        'center',
      );
      withSqlFocus(ctx, api, 'bound-value', () => {
        const x = mix(1280, 1160, m.inputTravel);
        drawSqlBox(ctx, api, x, 355, 500, 80, themeColors.yellow);
        drawSqlText(ctx, api, literalSubstringPattern(m.searchText), x + 250, 405, 29, themeColors.yellow, 'center');
        if (m.input === 1) {
          drawSqlText(
            ctx,
            api,
            '0 paragraphs contain this literal text',
            1470,
            510,
            25,
            themeColors.pink,
            'center',
          );
          drawSqlText(
            ctx,
            api,
            'SQL syntax stays fixed',
            1470,
            550,
            23,
            themeColors.muted,
            'center',
          );
        }
      });
      withSqlFocus(ctx, api, 'literal-result', () => {
        if (m.percent > 0) {
          drawSqlBox(ctx, api, 140, 600, 1080, 240, themeColors.green);
          drawSqlText(ctx, api, 'Save 10% on this coat.', 190, 665, 34, themeColors.ink);
          drawSqlText(ctx, api, 'literal character', 980, 663, 22, themeColors.muted, 'right');
          drawSqlBox(ctx, api, 1010, 626, 48, 48, themeColors.yellow);
          drawSqlText(ctx, api, '%', 1034, 662, 29, themeColors.yellow, 'center');
          drawSqlText(ctx, api, 'bound LIKE pattern', 190, 735, 24, themeColors.muted);
          drawSqlText(ctx, api, literalSubstringPattern('%'), 470, 735, 30, themeColors.yellow);
          drawSqlText(ctx, api, '1 matching paragraph', 190, 795, 27, themeColors.green);
        }
      });
      withSqlFocus(ctx, api, 'literal-underscore', () => {
        if (m.underscore > 0) {
          drawSqlBox(ctx, api, 1280, 600, 520, 240, themeColors.cyan);
          drawSqlText(ctx, api, 'Field name', 1540, 642, 24, themeColors.muted, 'center');
          drawSqlText(ctx, api, 'document_id', 1540, 696, 30, themeColors.ink, 'center');
          drawSqlText(
            ctx,
            api,
            literalSubstringPattern('document_id'),
            1540,
            756,
            28,
            themeColors.yellow,
            'center',
          );
          drawSqlText(
            ctx,
            api,
            'the underscore is literal',
            1540,
            806,
            22,
            themeColors.cyan,
            'center',
          );
        }
      });
    }
    drawSqlCaption(
      ctx,
      api,
      'The SQL text remains fixed · the separately bound value controls which records match',
    );
  }
}
export default {
  id: 'query',
  draw: drawQuery,
  cues: [
    'project-fields',
    'bind-workspace',
    'filter-bound-rows',
    'bind-input',
    'literal-percent',
    'literal-underscore',
  ],
};
