import { extendedSqlState, sqlCueStep } from '../construction.mjs';
import {
  drawExtendedSqlCard,
  drawExtendedSqlFooter,
  drawExtendedSqlHeading,
  drawExtendedSqlText,
} from '../defaults.mjs';
export function drawDeleteOrder(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    stepProgress = (beat, i = 0) => sqlCueStep('delete-order', state, beat, i);
  api.focus.target('delete-order-construction', () => {
    drawExtendedSqlHeading(
      ctx,
      api,
      currentBeat === 0
        ? 'Acme Cloud  /  API Key Policy  /  SQLite rehearsal'
        : 'Acme Cloud  /  policy restored after rollback',
    );
    const { removedCount: removed, rolledBack } = extendedSqlState('delete-order', state),
      names = ['Permission rows', 'Chunks', 'Document'],
      values = ['4 grants on c7a and c7b', 'c7a   ·   c7b', 'd7   ·   API Key Policy'];
    names.forEach((name, i) => {
      const x = 180 + i * 570;
      drawExtendedSqlCard(
        ctx,
        api,
        i < removed ? '0 rows' : values[i],
        x,
        425,
        450,
        130,
        i < removed
          ? themeColors.muted
          : [themeColors.yellow, themeColors.cyan, themeColors.blue][i],
        29,
      );
      drawExtendedSqlText(ctx, api, name, x + 225, 388, 31, themeColors.ink, 'center');
      if (i < 2) api.arrow(ctx, x + 470, 490, x + 550, 490, themeColors.muted, 4);
    });
    if (currentBeat === 0 && stepProgress(0, 1) === 1 && removed === 0 && !rolledBack)
      drawExtendedSqlText(
        ctx,
        api,
        stepProgress(0, 2) === 1
          ? 'DELETE c7a, c7b   →   their permission rows still reference them'
          : 'DELETE d7   →   c7a and c7b still reference it',
        960,
        700,
        31,
        themeColors.pink,
        'center',
      );
    if (currentBeat === 0 && rolledBack)
      drawExtendedSqlText(
        ctx,
        api,
        'ROLLBACK    ·    4 grants    ·    2 chunks    ·    1 document',
        960,
        900,
        34,
        themeColors.green,
        'center',
      );
    if (currentBeat === 1) {
      drawExtendedSqlCard(
        ctx,
        api,
        'remote vector / cache',
        560,
        770,
        800,
        100,
        themeColors.pink,
        34,
      );
      drawExtendedSqlText(
        ctx,
        api,
        'External copies need their own deletion and confirmation.',
        960,
        945,
        29,
        themeColors.yellow,
        'center',
      );
    }
    drawExtendedSqlFooter(ctx, api, 'No ON DELETE CASCADE was declared in this schema');
  });
}
export default {
  id: 'delete-order',
  draw: drawDeleteOrder,
  cues: [
    'delete-order-b1',
    'delete-order-voice-1',
    'delete-order-step-0-1',
    'delete-order-step-0-2',
    'delete-order-step-0-3',
    'delete-order-step-0-4',
    'delete-order-b2',
    'delete-order-voice-2',
    'delete-order-step-1-1',
    'delete-order-step-1-2',
    'delete-order-step-1-3',
    'delete-order-step-1-4',
  ],
};
