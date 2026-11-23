import { limit } from '../construction.mjs';
import { box, constructionText, footer, line, title } from '../defaults.mjs';
export function drawAdapterContract(ctx, scene, state, api) {
  api.focus.target('adapter-contract-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0,
      progress = limit(state.beatP ?? 0);
    {
      title(
        ctx,
        api,
        currentBeat === 0
          ? 'Protocol reconstruction precedes metric selection'
          : 'Supplied events · apply pinned October adapter rules',
      );
      const events = [
        {
          t: 100,
          label: 'choices: empty text',
          kind: 'choices',
        },
        {
          t: 320,
          label: 'choices: visible text',
          kind: 'choices',
        },
        {
          t: 500,
          label: 'usage only',
          kind: 'usage',
        },
        {
          t: 520,
          label: '[DONE]',
          kind: 'done',
        },
      ];
      events.forEach((e, i) => {
        const y = 410 + i * 110,
          col = i < 2 ? themeColors.cyan : themeColors.muted;
        constructionText(ctx, api, `${e.t} ms`, 220, y + 32, 29, col);
        box(ctx, api, e.label, 430, y - 12, 660, 85, col, 29);
        if (currentBeat >= 1)
          constructionText(
            ctx,
            api,
            i < 2 ? 'timestamp advances' : 'excluded by this adapter',
            1240,
            y + 35,
            27,
            i < 2 ? themeColors.cyan : themeColors.yellow,
          );
      });
      if (currentBeat >= 1) line(ctx, api, 1190, 420, 1190, 545, themeColors.cyan, 7);
      if (currentBeat === 1)
        box(ctx, api, 'reported last event: 320 ms', 1100, 860, 650, 75, themeColors.cyan, 28);
      if (currentBeat === 2)
        box(
          ctx,
          api,
          'finite-rate summary: adapter latency + client queue',
          230,
          860,
          1510,
          75,
          themeColors.yellow,
          29,
        );
      footer(
        ctx,
        api,
        currentBeat === 2
          ? 'Successful requests only; separate schedule-lag and terminal accounting'
          : 'Responses adapter uses text / reasoning deltas; retain the actual installed rules',
      );
    }
    return true;
  });
}
export default {
  id: 'adapter-contract',
  draw: drawAdapterContract,
  cues: [
    'adapter-contract-beat-0',
    'adapter-contract-beat-1',
    'adapter-choices',
    'adapter-end',
    'adapter-contract-beat-2',
  ],
};
