import { chunks, publicationInput, replacement } from '../fixtures.mjs';
import { directed, sampleModel } from '../construction.mjs';
import {
  drawSqlBox,
  drawSqlCaption,
  drawSqlText,
  withSqlFade,
  withSqlFocus,
} from '../defaults.mjs';
export function drawPublication(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    m = sampleModel('publication', state);
  {
    if (currentBeat === 3) {
      drawSqlText(
        ctx,
        api,
        'SQLite grants one writer slot at a time',
        960,
        300,
        31,
        themeColors.blue,
        'center',
      );
      drawSqlBox(ctx, api, 150, 420, 470, 205, themeColors.cyan);
      drawSqlText(ctx, api, 'Publisher 1', 385, 465, 29, themeColors.cyan, 'center');
      drawSqlText(ctx, api, 'BEGIN IMMEDIATE', 385, 525, 28, themeColors.ink, 'center');
      drawSqlText(
        ctx,
        api,
        m.slot === 1 ? 'slot acquired' : 'request the slot',
        385,
        580,
        25,
        m.slot === 1 ? themeColors.green : themeColors.muted,
        'center',
      );
      withSqlFocus(ctx, api, 'writer-slot', () => {
        drawSqlBox(ctx, api, 735, 400, 450, 245, themeColors.yellow);
        drawSqlText(ctx, api, 'one writer slot', 960, 455, 29, themeColors.yellow, 'center');
        drawSqlText(
          ctx,
          api,
          m.slot === 1 ? 'publisher 1 holds it' : 'claim before checking d7',
          960,
          520,
          26,
          themeColors.ink,
          'center',
        );
        drawSqlText(ctx, api, 'read, replace, commit', 960, 580, 24, themeColors.muted, 'center');
        if (m.slot > 0) api.arrow(ctx, 630, 520, 725, 520, themeColors.cyan, 5);
      });
      drawSqlBox(ctx, api, 1300, 420, 470, 205, themeColors.pink);
      drawSqlText(ctx, api, 'Publisher 2', 1535, 465, 29, themeColors.pink, 'center');
      drawSqlText(ctx, api, 'BEGIN IMMEDIATE', 1535, 525, 28, themeColors.ink, 'center');
      drawSqlText(
        ctx,
        api,
        m.slot === 1 ? 'wait, then retry' : 'competing writer waits',
        1535,
        580,
        24,
        m.slot === 1 ? themeColors.pink : themeColors.muted,
        'center',
      );
      api.line(ctx, 1185, 520, 1290, 520, themeColors.muted, 3);
      drawSqlText(ctx, api, 'after release', 1237, 680, 20, themeColors.muted, 'center');
      drawSqlText(
        ctx,
        api,
        'Claim the slot before checking the open edition. Remote embedding work needs a separate publication step.',
        960,
        820,
        27,
        themeColors.muted,
        'center',
      );
    } else {
      drawSqlText(
        ctx,
        api,
        m.committed
          ? 'Writer connection · committed edition'
          : 'Writer connection · private transaction',
        650,
        275,
        29,
        themeColors.cyan,
        'center',
      );
      drawSqlText(
        ctx,
        api,
        'SQLite readers  /  WAL mode',
        1540,
        275,
        25,
        themeColors.green,
        'center',
      );
      drawSqlBox(ctx, api, 100, 325, 1120, 590, themeColors.cyan);
      drawSqlBox(ctx, api, 1280, 325, 520, 590, themeColors.green);
      withSqlFocus(ctx, api, 'writer-private', () => {
        drawSqlText(
          ctx,
          api,
          'd7 · July edition · end: ' + (m.oldEnded ? 'August 12' : 'NULL'),
          660,
          375,
          27,
          m.oldEnded ? themeColors.yellow : themeColors.muted,
          'center',
        );
        if (m.writerHasDocument) {
          drawSqlBox(ctx, api, 160, 420, 1000, 78, themeColors.cyan);
          drawSqlText(
            ctx,
            api,
            'd7-next · Return Policy · starts August 12',
            660,
            468,
            28,
            themeColors.ink,
            'center',
          );
          const children = replacement.slice(0, m.completedChildren);
          if (children.length === 0)
            drawSqlText(
              ctx,
              api,
              'replace the edition’s paragraphs and grants',
              660,
              590,
              25,
              themeColors.muted,
              'center',
            );
          children.forEach((r, i) => {
            const y = 535 + i * 76;
            const readers = publicationInput.grants
              .filter(([chunkId]) => chunkId === r.id)
              .map(([, principal]) => principal);
            drawSqlBox(ctx, api, 145, y, 1025, 65, themeColors.cyan);
            drawSqlText(
              ctx,
              api,
              r.id + ' · grant: ' + (readers.join(', ') || 'none'),
              167,
              y + 42,
              26,
              themeColors.cyan,
            );
            drawSqlText(ctx, api, r.text, 402, y + 42, 26, themeColors.ink);
            if (m.committed)
              drawSqlText(
                ctx, api, r.id + ' · new edition', 1145, y + 42, 25, themeColors.cyan, 'right',
              );
          });
        } else
          drawSqlText(
            ctx,
            api,
            currentBeat === 1 && m.rollback === 1
              ? 'ROLLBACK · d7 is open again'
              : 'new edition not yet staged',
            660,
            565,
            29,
            themeColors.muted,
            'center',
          );
      });
      withSqlFocus(ctx, api, 'pending-child', () => {
        if (currentBeat === 1 && m.reject > 0)
          withSqlFade(ctx, api, 1 - m.rollback, () => {
            drawSqlBox(ctx, api, 180, 790, 960, 84, themeColors.pink);
            drawSqlText(
              ctx,
              api,
              'Return with the tags attached. · document_id: missing',
              660,
              824,
              25,
              themeColors.ink,
              'center',
            );
            drawSqlText(
              ctx,
              api,
              m.reject === 1 ? 'FOREIGN KEY rejects this row' : 'checking its parent',
              660,
              855,
              21,
              themeColors.pink,
              'center',
            );
          });
      });
      withSqlFocus(ctx, api, 'committed-reader', () => {
        const july = chunks.filter((row) => row.document === 'd7');
        const readEdition = (y, label, edition, rows, color) => {
          drawSqlText(ctx, api, label, 1314, y, 28, color);
          drawSqlText(
            ctx,
            api,
            rows[0].document + '   /   ' + rows.length + ' paragraphs',
            1314,
            y + 49,
            29,
            themeColors.ink,
          );
          rows.forEach((r, i) => {
            const role = r.text.includes('receipt')
              ? 'receipt'
              : r.text.includes('tags')
                ? 'clothing tags'
                : 'deadline';
            const rowY = y + 103 + 46 * i;
            drawSqlText(ctx, api, r.id + ' · ' + edition, 1314, rowY, 26, themeColors.ink);
            drawSqlText(ctx, api, role, 1765, rowY, 26, themeColors.ink, 'right');
          });
        };
        readEdition(390, 'Read opened before commit', 'July edition', july, themeColors.green);
        api.line(ctx, 1315, 593, 1765, 593, themeColors.muted, 2);
        if (m.committed && directed(state, 'read-after-commit', 2, 0.75, 0.88) === 1) {
          readEdition(652, 'Read opened after commit', 'new edition', replacement, themeColors.cyan);
        } else {
          drawSqlText(ctx, api, 'Second read has yet to start', 1314, 652, 25, themeColors.muted);
        }
      });
    }
    drawSqlCaption(
      ctx,
      api,
      currentBeat === 1
        ? 'The failed insert changed no row. Rollback removes the writer’s pending edits.'
        : currentBeat === 3
          ? 'BEGIN IMMEDIATE reserves SQLite’s writer slot for this transaction.'
          : m.committed
            ? 'A read transaction keeps the snapshot it opened.'
            : 'The writer stages one complete source, paragraph set and grant set',
    );
  }
}
export default {
  id: 'publication',
  draw: drawPublication,
  cues: [
    'stage-new-edition',
    'reject-broken-reference',
    'rollback-publication',
    'finish-publication',
    'commit-publication',
    'read-after-commit',
    'serialize-publisher',
  ],
};
