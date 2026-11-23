import {
  approvalProgress,
  contractArrow,
  contractNote,
  contractRectangle,
  contractTag,
  contractText,
} from '../defaults.mjs';
export function drawDecisionOutbox(ctx, scene, state, api) {
  const { C: themeColors } = api,
    rawBeat = state.beat ?? 0,
    currentBeat = rawBeat,
    resultComplete = (id) => approvalProgress(ctx, api, id) === 1;
  api.focus.target('decision-outbox-mechanism', () => {
    const won = resultComplete('outbox-race'),
      rollback = approvalProgress(ctx, api, 'outbox-rollback'),
      rolledBack = resultComplete('outbox-rollback');
    if (currentBeat === 0) {
      ['reviewer A', 'reviewer B'].forEach((name, i) => {
        contractTag(
          ctx,
          api,
          name,
          360,
          440 + i * 220,
          i ? themeColors.cyan : themeColors.blue,
          450,
        );
        contractArrow(
          ctx,
          api,
          630,
          440 + i * 220,
          1030,
          550,
          i ? themeColors.cyan : themeColors.blue,
        );
      });
      contractRectangle(ctx, api, 1100, 330, 600, 450, themeColors.panel);
      contractText(ctx, api, 'ONE pending row', 1400, 405, 35, themeColors.yellow);
      ['tenant · status · version', 'full digest · DB time'].forEach((v, i) =>
        contractText(ctx, api, v, 1400, 550 + i * 100, 29, themeColors.muted),
      );
      if (resultComplete('outbox-row'))
        contractText(ctx, api, 'Exactly one affected row wins', 960, 925, 36, themeColors.green);
    } else if (currentBeat === 1) {
      if (!rollback) {
        contractText(
          ctx,
          api,
          'One local transaction · synthetic now 100 / expiry 120',
          960,
          290,
          33,
          themeColors.muted,
        );
        contractTag(
          ctx,
          api,
          won ? 'AUTHORIZED' : 'PENDING',
          500,
          480,
          won ? themeColors.green : themeColors.yellow,
          650,
        );
        contractTag(
          ctx,
          api,
          won ? 'outbox row 1' : 'outbox empty',
          1440,
          480,
          won ? themeColors.green : themeColors.muted,
          650,
        );
        contractArrow(ctx, api, 860, 480, 1060, 480, themeColors.blue);
        if (won) contractText(ctx, api, 'Other connection blocked', 960, 655, 34, themeColors.pink);
      }
      if (rollback) {
        contractText(
          ctx,
          api,
          'Separate injected failure before insertion',
          960,
          430,
          36,
          themeColors.pink,
        );
        contractTag(
          ctx,
          api,
          rolledBack ? 'PENDING restored' : 'Rollback in progress',
          500,
          620,
          themeColors.yellow,
          650,
        );
        contractTag(
          ctx,
          api,
          rolledBack ? 'outbox rows 0' : 'Restoring local outbox',
          1440,
          620,
          themeColors.muted,
          650,
        );
      }
      if (resultComplete('outbox-expiry-complete'))
        contractText(ctx, api, 'Exact expiry is blocked', 960, 920, 32, themeColors.pink);
    } else {
      contractTag(ctx, api, 'Committed decision + outbox', 960, 350, themeColors.blue, 900);
      const p = approvalProgress(ctx, api, 'outbox-delivery');
      for (let i = 0; i < (p ? 2 : 0); i++) {
        const x = 500 + i * 920;
        contractArrow(ctx, api, 680 + i * 560, 405, x, 490, themeColors.yellow);
        contractTag(ctx, api, 'same decision ID', x, 560, themeColors.yellow, 650);
        contractArrow(ctx, api, x, 625, 800 + i * 320, 750, themeColors.yellow);
      }
      contractTag(
        ctx,
        api,
        resultComplete('outbox-reload') ? 'Reload protected grant' : 'Consumer pending',
        960,
        815,
        resultComplete('outbox-reload') ? themeColors.green : themeColors.muted,
        900,
      );
      if (resultComplete('outbox-reload'))
        contractText(
          ctx,
          api,
          'Authorized remains separate from executed',
          960,
          925,
          35,
          themeColors.pink,
        );
    }
    contractNote(
      ctx,
      api,
      'Executed local SQLite race + rollback fixture · remote effects remain separate',
    );
  });
  return;
}
export default {
  id: 'decision-outbox',
  draw: drawDecisionOutbox,
  cues: [
    'outbox-row',
    'outbox-expiry-complete',
    'outbox-race',
    'outbox-rollback',
    'outbox-delivery',
    'outbox-reload',
  ],
};
