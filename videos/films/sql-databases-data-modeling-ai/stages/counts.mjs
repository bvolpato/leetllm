import { mix } from '../arithmetic.mjs';
import { active, joinedRows } from '../model.mjs';
import { directed, sampleModel } from '../construction.mjs';
import {
  drawSqlCaption,
  drawSqlEquation,
  drawSqlRow,
  drawSqlTable,
  drawSqlText,
  withSqlFocus,
} from '../defaults.mjs';
export function drawCounts(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    m = sampleModel('counts', state);
  {
    const source = joinedRows().filter((r) => r.source.workspace === 'w01' && active(r.source));
    drawSqlText(
      ctx,
      api,
      'Current Harbor rows · before reader filtering',
      960,
      270,
      30,
      themeColors.muted,
      'center',
    );
    const destinations = {
      'd7': {
        x: 1040,
        y: 355,
      },
      'd9': {
        x: 1040,
        y: 665,
      },
    };
    if (currentBeat === 0) {
      for (const [i, r] of source.entries()) {
        const to = destinations[r.source.id],
          position = source
            .filter((v) => v.source.id === r.source.id)
            .findIndex((v) => v.id === r.id);
        withSqlFocus(ctx, api, 'source-groups', () =>
          drawSqlRow(
            ctx,
            api,
            r.id + ' → ' + r.source.id,
            r.text,
            mix(130, to.x, m.group),
            mix(355 + i * 170, to.y + position * 135, m.group),
            740,
            r.source.id === 'd7' ? themeColors.cyan : themeColors.blue,
            118,
          ),
        );
      }
      withSqlFocus(ctx, api, 'group-counts', () => {
        if (m.group === 1 && m.count > 0) {
          drawSqlText(
            ctx,
            api,
            'Return Policy: ' + (m.count === 1 ? m.groups.find((g) => g.id === 'd7').count : '?'),
            520,
            420,
            36,
            themeColors.cyan,
            'center',
          );
          drawSqlText(
            ctx,
            api,
            'Staff Guide: ' + (m.count === 1 ? m.groups.find((g) => g.id === 'd9').count : '?'),
            520,
            720,
            36,
            themeColors.blue,
            'center',
          );
        }
      });
    } else {
      drawSqlText(ctx, api, 'd-empty · Draft Guide', 480, 345, 33, themeColors.yellow, 'center');
      withSqlFocus(ctx, api, 'empty-source', () => {
        if (m.empty > 0) {
          drawSqlTable(
            ctx,
            api,
            ['document', 'child.id'],
            [['d-empty', 'NULL']],
            240,
            430,
            [380, 380],
            110,
            themeColors.yellow,
          );
          drawSqlText(
            ctx,
            api,
            'one retained join row',
            620,
            630,
            30,
            themeColors.yellow,
            'center',
          );
        }
      });
      withSqlFocus(ctx, api, 'empty-count', () => {
        if (currentBeat === 2) {
          drawSqlText(ctx, api, 'Count this draft’s paragraphs', 1390, 367, 30, themeColors.muted, 'center');
        }
        if (m.zero === 1) {
          drawSqlEquation(
            ctx,
            api,
            String.raw`\operatorname{COUNT}(\text{child.id})=0`,
            1390,
            470,
            39,
            themeColors.green,
          );
        }
        if (directed(state, 'count-draft-row', 2, 0.58, 0.9) === 1) {
          drawSqlEquation(
            ctx,
            api,
            String.raw`\operatorname{COUNT}(*)=1`,
            1390,
            660,
            39,
            themeColors.pink,
          );
        }
      });
    }
    drawSqlCaption(
      ctx,
      api,
      currentBeat === 0 ? 'Group key: document identity' : 'Draft Guide  /  ingestion audit',
    );
  }
}
export default {
  id: 'counts',
  draw: drawCounts,
  cues: ['form-source-groups', 'count-groups', 'preserve-empty-parent', 'count-child-identity', 'count-draft-row'],
};
