import {
  approvalProgress,
  contractArrow,
  contractNote,
  contractRectangle,
  contractTag,
  contractText,
} from '../defaults.mjs';
export function drawLanggraphReplay(ctx, scene, state, api) {
  const { C: themeColors } = api,
    rawBeat = state.beat ?? 0,
    currentBeat = rawBeat,
    resultComplete = (id) => approvalProgress(ctx, api, id) === 1;
  api.focus.target('langgraph-replay-mechanism', () => {
    const reopened = approvalProgress(ctx, api, 'graph-reopen'),
      saved = approvalProgress(ctx, api, 'graph-save');
    if (currentBeat === 0) {
      contractTag(
        ctx,
        api,
        reopened ? 'New graph instance' : 'First graph instance',
        420,
        350,
        themeColors.cyan,
        600,
      );
      api.text(ctx, 'release_reranker_v17', 420, 521, 32, themeColors.yellow, 'center', 'mono');
      contractText(ctx, api, 'Thread ID', 420, 588, 29, themeColors.muted);
      contractRectangle(ctx, api, 1100, 320, 600, 480, themeColors.panel);
      contractText(ctx, api, 'SQLite checkpoint', 1400, 385, 34, themeColors.blue);
      if (saved)
        api.text(
          ctx,
          resultComplete('graph-result') ? 'apr_123 · v3 · authorized' : 'apr_123 · v3 · pending',
          1400,
          540,
          30,
          themeColors.yellow,
          'center',
          'mono',
        );
      contractArrow(ctx, api, 750, 520, 1060, 520, themeColors.blue);
      if (reopened) contractArrow(ctx, api, 1100, 700, 750, 700, themeColors.green);
      if (resultComplete('graph-result'))
        contractText(
          ctx,
          api,
          'Node starts 2 · state authorized · production writes 0',
          960,
          925,
          36,
          themeColors.green,
        );
    } else if (currentBeat === 1) {
      const restart = approvalProgress(ctx, api, 'graph-restart');
      contractTag(
        ctx,
        api,
        'review node starts ' + (restart ? 2 : 1),
        420,
        365,
        themeColors.cyan,
        650,
      );
      contractTag(ctx, api, 'notification before interrupt', 420, 585, themeColors.yellow, 650);
      contractTag(ctx, api, 'interrupt / saved state', 1420, 585, themeColors.blue, 650);
      contractArrow(ctx, api, 800, 585, 1040, 585, themeColors.blue);
      if (approvalProgress(ctx, api, 'graph-notify'))
        contractText(ctx, api, 'notification may run again', 420, 760, 33, themeColors.pink);
      if (resultComplete('graph-repair')) {
        contractTag(
          ctx,
          api,
          'Use an earlier completed node or a durable deduplication key',
          960,
          895,
          themeColors.green,
          1450,
        );
        contractArrow(ctx, api, 790, 670, 790, 810, themeColors.green);
      }
    } else {
      contractText(
        ctx,
        api,
        'Same edited arguments · different policy contracts',
        960,
        300,
        36,
        themeColors.muted,
      );
      contractTag(
        ctx,
        api,
        'middleware edit → immediate tool call',
        960,
        445,
        themeColors.pink,
        1450,
      );
      if (approvalProgress(ctx, api, 'graph-edit')) {
        contractTag(
          ctx,
          api,
          'our edit → new proposal → new applicable decision',
          960,
          635,
          themeColors.yellow,
          1450,
        );
        contractArrow(ctx, api, 960, 500, 960, 575, themeColors.yellow);
      }
      if (resultComplete('graph-respond'))
        contractTag(
          ctx,
          api,
          'respond = tool result · reject = denial',
          960,
          830,
          themeColors.blue,
          1450,
        );
    }
    contractNote(
      ctx,
      api,
      'The thread ID selects the saved state. The host authenticates the reviewer.',
    );
  });
  return;
}
export default {
  id: 'langgraph-replay',
  draw: drawLanggraphReplay,
  cues: [
    'graph-save',
    'graph-reopen',
    'graph-result',
    'graph-restart',
    'graph-notify',
    'graph-repair',
    'graph-edit',
    'graph-respond',
  ],
};
