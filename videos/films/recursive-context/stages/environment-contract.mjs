import {
  arrow,
  contractText,
  cueComplete,
  cueProgress,
  footer,
  rectangle,
  tag,
} from '../defaults.mjs';
export function drawEnvironmentContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.focus.target('environment-contract-mechanism', () => {
    if (currentBeat === 0) {
      contractText(ctx, api, 'Authoritative snapshot', 490, 300, 35, themeColors.blue);
      rectangle(ctx, api, 170, 350, 650, 450, themeColors.panel);
      contractText(ctx, api, 'manual-v12 / p6', 495, 430, 32, themeColors.blue);
      contractText(ctx, api, 'Expires 2026-09-30', 495, 575, 37, themeColors.blue);
      contractText(ctx, api, 'read-only source identity', 495, 720, 29, themeColors.muted);
      contractText(ctx, api, 'Writable interpreter variable', 1430, 300, 35, themeColors.cyan);
      tag(
        ctx,
        api,
        cueProgress(ctx, api, 'writable-rebind')
          ? 'source = another value'
          : 'source = selected text',
        1430,
        500,
        cueProgress(ctx, api, 'writable-rebind') ? themeColors.pink : themeColors.cyan,
        690,
      );
      if (cueProgress(ctx, api, 'authoritative-source'))
        arrow(ctx, api, 860, 575, 1040, 575, themeColors.blue);
      if (cueComplete(ctx, api, 'writable-rebind'))
        contractText(
          ctx,
          api,
          'Rebinding leaves the trusted original available',
          960,
          925,
          34,
          themeColors.yellow,
        );
    } else if (currentBeat === 1) {
      contractText(
        ctx,
        api,
        'Authorized slice + mission + constraints',
        960,
        285,
        35,
        themeColors.blue,
      );
      ['llm_query', 'rlm_query'].forEach((name, i) => {
        const x = 490 + i * 940;
        rectangle(ctx, api, x - 360, 375, 720, 79, themeColors.panel);
        api.text(ctx, name, x, 430, 39, i ? themeColors.cyan : themeColors.blue, 'center', 'mono');
        const ready = cueProgress(ctx, api, i ? 'nested-call' : 'plain-call');
        if (ready) {
          for (let j = 0; j < (i ? 3 : 1); j++) {
            rectangle(ctx, api, x - 220, 520 + j * 95, 440, 60, themeColors.panel);
            contractText(
              ctx,
              api,
              i
                ? ['inspect variables', 'bounded observation', 'next inspection'][j]
                : 'one finite request',
              x,
              562 + j * 95,
              29,
              i ? themeColors.cyan : themeColors.blue,
            );
          }
        }
      });
      if (cueComplete(ctx, api, 'child-string'))
        contractText(
          ctx,
          api,
          'Parent receives the response text',
          960,
          925,
          34,
          themeColors.yellow,
        );
    } else {
      contractText(
        ctx,
        api,
        'Same numeral · different versioned interfaces',
        960,
        300,
        36,
        themeColors.muted,
      );
      tag(
        ctx,
        api,
        'Paper depth 0 → REPL retained, no sub-calls',
        960,
        475,
        themeColors.blue,
        1430,
      );
      if (cueProgress(ctx, api, 'depth-mismatch')) {
        tag(
          ctx,
          api,
          'Pinned maximum depth 0 → plain-LM fallback',
          960,
          705,
          themeColors.pink,
          1430,
        );
        arrow(ctx, api, 960, 535, 960, 645, themeColors.pink);
      }
      footer(ctx, api, 'Pin the runtime contract · a private namespace is not a security boundary');
    }
  });
}
export default {
  id: 'environment-contract',
  draw: drawEnvironmentContract,
  cues: [
    'authoritative-source',
    'writable-rebind',
    'plain-call',
    'nested-call',
    'child-string',
    'depth-mismatch',
  ],
};
