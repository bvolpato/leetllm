import { sampleModel } from '../construction.mjs';
import { allocationStrip, card, text } from '../defaults.mjs';
export function drawIntro(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const modelState = sampleModel('intro', state),
    currentBeat = modelState.step;
  {
    const scroll = currentBeat === 0 ? modelState.p : currentBeat === 1 ? 1 : 1 - modelState.p;
    const fact = api.focus.target('intro-fact', () => {
      const node = card(
        ctx,
        api,
        'D1 · rollback approved by lead',
        140,
        370 - scroll * 100,
        680,
        themeColors.yellow,
        110,
      );
      for (let i = 0; i < 4; i++) {
        api.rect(
          ctx,
          150,
          510 + i * 35 - scroll * 90,
          660,
          22,
          themeColors.panel,
          themeColors.muted,
          1,
        );
      }
      return node;
    });
    const task = api.focus.target('intro-task', () =>
      card(ctx, api, 'Was the rollback approved?', 1120, 370, 640, themeColors.cyan, 110),
    );
    if (currentBeat === 2)
      api.connect(ctx, fact, task, {
        color: themeColors.yellow,
        gap: 16,
      });
    api.focus.target('intro-fact', () =>
      text(
        ctx,
        api,
        currentBeat === 0
          ? 'More recent exchanges push D1 away'
          : currentBeat === 1
            ? 'Newest-only packet omits the approval'
            : 'Retain the original evidence before answering',
        960,
        670,
        32,
        currentBeat === 1 ? themeColors.pink : themeColors.yellow,
        'center',
      ),
    );
    allocationStrip(
      ctx,
      api,
      'intro',
      currentBeat === 2
        ? [
            {
              id: 'D1 checked note',
              units: 4,
            },
          ]
        : [],
      690,
    );
    api.focus.target('intro-the-needed-fact-lives-in-an-older-exchange', () =>
      text(ctx, api, 'The needed fact lives in an older exchange', 140, 975, 29, themeColors.muted),
    );
  }
}
export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'source-approval',
    'current-task',
    'context-capacity',
    'complete-packets',
    'answer-reserve',
    'older-fact',
  ],
};
