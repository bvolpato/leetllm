import { box, chapterText, footer, heading, table } from '../defaults.mjs';
export function drawToolChoice(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0)),
    resultComplete = (id, beat = currentBeat) =>
      currentBeat > beat ||
      (currentBeat === beat &&
        (state.cues ? state.cues['tu-' + id]?.phase === 'after' : progress >= 0.9));
  api.focus.target('tu-tool-choice-mechanism', () => {
    heading(ctx, api, 'Generation mode chooses proposals, not execution permission');
    if (currentBeat === 0) {
      const modes = [
        ['auto', 'answer OR call(s)'],
        ['required', 'one or more calls'],
        ['none', 'answer; no calls'],
        ['forced function', 'named function proposal'],
      ];
      table(ctx, api, ['mode', 'permitted generation'], modes, 150, 370, [570, 1000], 105);
      const loop = resultComplete('choice-loop', 0),
        ready = resultComplete('choice-required-turn', 0);
      chapterText(
        ctx,
        api,
        loop
          ? 'required again → another call; completion blocked'
          : ready
            ? 'required read → observation → auto answer'
            : 'Two model turns retain separate modes',
        150,
        950,
        31,
        loop ? themeColors.pink : themeColors.green,
      );
    } else if (currentBeat === 1) {
      box(
        ctx,
        api,
        'OpenAI Responses',
        ['type: function', 'name: get_release_status'],
        150,
        410,
        720,
        themeColors.blue,
        170,
      );
      box(
        ctx,
        api,
        'Chat Completions',
        ['type: function', 'function: {name: get_release_status}'],
        1050,
        410,
        680,
        themeColors.cyan,
        170,
      );
      box(
        ctx,
        api,
        'Claude forced tool',
        ['type: tool', 'name: get_release_status'],
        150,
        690,
        720,
        themeColors.blue,
        170,
      );
      box(
        ctx,
        api,
        'Runtime permission',
        'still checked separately',
        1050,
        690,
        680,
        themeColors.yellow,
        135,
      );
      chapterText(
        ctx,
        api,
        'Endpoint/model/thinking compatibility can reject forcing',
        150,
        965,
        29,
        themeColors.pink,
      );
    } else {
      const one = resultComplete('choice-one-call', 2),
        ft = resultComplete('choice-ft-limit', 2);
      box(
        ctx,
        api,
        'parallel_tool_calls: false',
        one ? '0 or 1 generated call' : 'documented generation limit',
        150,
        405,
        720,
        themeColors.blue,
        150,
      );
      box(
        ctx,
        api,
        'Fine-tuned multiple-call turn',
        ft ? 'strict mode disabled for those calls' : 'provider-specific compatibility note',
        1050,
        405,
        680,
        ft ? themeColors.pink : themeColors.yellow,
        150,
      );
      chapterText(
        ctx,
        api,
        'registration → parse → scope → execute → budget',
        150,
        790,
        32,
        themeColors.cyan,
      );
      chapterText(
        ctx,
        api,
        'No generation mode bypasses these host checks',
        150,
        930,
        32,
        themeColors.yellow,
      );
    }
    footer(
      ctx,
      api,
      'Illustrated request settings. Actual endpoint compatibility remains versioned.',
    );
  });
}
export default {
  id: 'tool-choice',
  draw: drawToolChoice,
  cues: [
    'tu-tool-choice-1',
    'tu-choice-required-turn',
    'tu-choice-loop',
    'tu-tool-choice-2',
    'tu-tool-choice-3',
    'tu-choice-one-call',
    'tu-choice-ft-limit',
  ],
};
