import { clamp, completed, mix } from '../arithmetic.mjs';
import { paragraph } from '../fixtures.mjs';
import { sampleModel } from '../construction.mjs';
import {
  drawSqlCaption,
  drawSqlLink,
  drawSqlRow,
  drawSqlTable,
  drawSqlText,
  withSqlFocus,
} from '../defaults.mjs';
export function drawJoin(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    m = sampleModel('join', state);
  {
    const para = drawSqlRow(
      ctx,
      api,
      'c7a · document_id: d7',
      paragraph,
      120,
      315,
      700,
      themeColors.cyan,
    );
    drawSqlText(ctx, api, 'document candidates', 1430, 280, 31, themeColors.blue, 'center');
    const sources = drawSqlTable(
      ctx,
      api,
      ['id', 'title'],
      [
        ['d7', 'Return Policy'],
        ['d9', 'Staff Guide'],
      ],
      1080,
      335,
      [170, 600],
      115,
      themeColors.blue,
    );
    withSqlFocus(ctx, api, 'join-fields', () => {
      const pass = completed(m.compare, 2);
      if (m.compare > 0)
        drawSqlLink(
          ctx,
          api,
          para,
          sources.cell(0, 0),
          Math.min(1, m.compare * 2),
          themeColors.green,
        );
      if (pass > 0) drawSqlText(ctx, api, 'd7 = d7', 965, 380, 27, themeColors.green, 'center');
      if (pass > 1) drawSqlText(ctx, api, 'd7 ≠ d9', 965, 500, 27, themeColors.muted, 'center');
    });
    withSqlFocus(ctx, api, 'joined-result', () => {
      if (m.attach > 0) {
        drawSqlTable(
          ctx,
          api,
          ['paragraph', 'text', 'source title'],
          [['c7a', paragraph, m.attach === 1 ? 'Return Policy' : '']],
          150,
          705,
          [170, 1030, 420],
          95,
          themeColors.green,
        );
        api.trace(
          ctx,
          [
            {
              x: 1862,
              y: 392.5,
            },
            {
              x: 1880,
              y: 392.5,
            },
            {
              x: 1880,
              y: 620,
            },
          ],
          clamp(m.attach * 2),
          themeColors.green,
          4,
        );
        if (m.attach > 0.5) {
          const p = clamp((m.attach - 0.5) * 2);
          api.arrow(ctx, 1880, 620, mix(1880, 1782, p), mix(620, 752.5, p), themeColors.green, 4);
        }
      }
    });
    withSqlFocus(ctx, api, 'second-join', () => {
      if (m.second > 0)
        drawSqlTable(
          ctx,
          api,
          ['', '', ''],
          [
            [
              'c7b',
              'Bring the receipt when you return an item.',
              m.second === 1 ? 'Return Policy' : '',
            ],
          ],
          150,
          800,
          [170, 1030, 420],
          95,
          themeColors.cyan,
        );
    });
    drawSqlCaption(
      ctx,
      api,
      'JOIN condition: chunks.document_id = documents.id · exact IDs preserve the source edition',
    );
  }
}
export default {
  id: 'join',
  draw: drawJoin,
  cues: ['compare-join-fields', 'attach-source-title', 'join-second-paragraph'],
};
