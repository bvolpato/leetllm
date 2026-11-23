import { mix } from '../arithmetic.mjs';
import { sampleModel } from '../construction.mjs';
import {
  drawSqlCaption,
  drawSqlLink,
  drawSqlRow,
  drawSqlTable,
  drawSqlText,
  withSqlFocus,
} from '../defaults.mjs';
export function drawRelations(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    m = sampleModel('relations', state);
  {
    drawSqlText(ctx, api, 'Paragraph', 340, 285, 32, themeColors.cyan, 'center');
    drawSqlText(ctx, api, 'Source document', 980, 285, 32, themeColors.blue, 'center');
    drawSqlText(ctx, api, 'Workspace', 1590, 285, 32, themeColors.green, 'center');
    const chunk = drawSqlTable(
      ctx,
      api,
      ['id', 'document_id'],
      [['c7a', 'd7']],
      100,
      355,
      [210, 270],
      90,
      themeColors.cyan,
      [],
      (_r, j) => (j === 1 ? 'source-reference' : currentBeat === 1 ? 'invalid-row' : undefined),
    );
    const doc = drawSqlTable(
      ctx,
      api,
      ['id', 'workspace_id'],
      [['d7', 'w01']],
      740,
      355,
      [210, 270],
      90,
      themeColors.blue,
      [],
      (_r, j) => (j === 0 ? 'source-reference' : 'owner-reference'),
    );
    const work = drawSqlTable(
      ctx,
      api,
      ['id', 'name'],
      [['w01', 'Harbor Store']],
      1390,
      355,
      [140, 330],
      90,
      themeColors.green,
      [],
      (_r, j) => (j === 0 ? 'owner-reference' : undefined),
    );
    drawSqlText(ctx, api, 'Return items within fourteen days.', 100, 510, 28, themeColors.ink);
    drawSqlText(ctx, api, 'Return Policy · July edition', 740, 510, 28, themeColors.ink);
    withSqlFocus(ctx, api, 'source-reference', () =>
      drawSqlLink(ctx, api, chunk.cell(0, 1), doc.cell(0, 0), m.source, themeColors.cyan),
    );
    withSqlFocus(ctx, api, 'owner-reference', () =>
      drawSqlLink(ctx, api, doc.cell(0, 1), work.cell(0, 0), m.owner, themeColors.blue),
    );
    if (currentBeat === 0) {
      drawSqlText(ctx, api, 'Permission table', 960, 665, 31, themeColors.yellow, 'center');
      drawSqlTable(
        ctx,
        api,
        ['chunk_id', 'reader'],
        [['c7a', 'Bob']],
        690,
        720,
        [270, 270],
        86,
        themeColors.yellow,
      );
    } else
      withSqlFocus(ctx, api, 'invalid-row', () => {
        const duplicate = m.duplicate,
          missing = m.missing;
        const stage =
          missing > 0
            ? 'document_id   TEXT NOT NULL REFERENCES documents(id)'
            : 'Primary key: id = c7a';
        drawSqlText(ctx, api, stage, 960, 645, 32, themeColors.yellow, 'center');
        const p = missing > 0 ? missing : duplicate;
        drawSqlRow(
          ctx,
          api,
          missing > 0 ? 'new paragraph → missing' : 'c7a · second insertion',
          missing > 0 ? 'Bring a receipt.' : 'Keep the receipt for your return.',
          mix(460, 620, Math.sin(p * Math.PI)),
          700,
          1000,
          themeColors.pink,
          125,
        );
        if (p === 1)
          drawSqlText(
            ctx,
            api,
            missing > 0 ? 'FOREIGN KEY constraint failed' : 'UNIQUE constraint failed: chunks.id',
            960,
            895,
            31,
            themeColors.pink,
            'center',
          );
      });
    drawSqlCaption(ctx, api, 'SQLite connection  ·  PRAGMA foreign_keys = ON  ·  immediate checks');
  }
}
export default {
  id: 'relations',
  draw: drawRelations,
  cues: ['follow-source-key', 'follow-owner-key', 'duplicate-row', 'missing-parent'],
};
