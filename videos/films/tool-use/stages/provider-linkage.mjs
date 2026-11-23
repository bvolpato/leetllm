import { cueProgress } from '../arithmetic.mjs';
import { box, chapterLine, chapterText, footer, heading } from '../defaults.mjs';
export function drawProviderLinkage(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0)),
    cueProgress2 = (id, beat = currentBeat) =>
      currentBeat < beat
        ? 0
        : currentBeat > beat
          ? 1
          : cueProgress(state.cues, 'tu-' + id, Math.max(0, Math.min(1, (progress - 0.08) / 0.8))),
    resultComplete = (id, beat = currentBeat) =>
      currentBeat > beat ||
      (currentBeat === beat &&
        (state.cues ? state.cues['tu-' + id]?.phase === 'after' : progress >= 0.9));
  api.focus.target('tu-provider-linkage-mechanism', () => {
    heading(ctx, api, 'Keep each endpoint’s actual call and result linkage');
    if (currentBeat === 0) {
      box(
        ctx,
        api,
        'Responses item',
        ['id: fc_item_1', 'call_id: status-1', 'name: get_release_status'],
        150,
        390,
        720,
        themeColors.blue,
        210,
      );
      box(
        ctx,
        api,
        'function_call_output',
        ['call_id: status-1', 'output: serialized service result'],
        1050,
        390,
        680,
        themeColors.cyan,
        170,
      );
      const q = cueProgress2('response-call-link', 0);
      chapterLine(ctx, api, 890, 490, 890 + 130 * q, 490, themeColors.cyan, 4);
      if (resultComplete('response-call-link', 0))
        chapterText(ctx, api, 'Match call_id, not item id', 1050, 650, 32, themeColors.green);
      if (resultComplete('response-wrong-id', 0)) {
        box(ctx, api, 'Wrong link', 'call_id: fc_item_1', 1050, 760, 680, themeColors.pink, 110);
        chapterLine(ctx, api, 1045, 810, 1740, 810, themeColors.pink, 3);
      }
    } else if (currentBeat === 1) {
      const claude = resultComplete('claude-result-link', 1);
      box(
        ctx,
        api,
        'Chat Completions',
        ['assistant.tool_calls[0].id = call-7', 'function.arguments: JSON string'],
        150,
        390,
        735,
        themeColors.blue,
        170,
      );
      box(
        ctx,
        api,
        'tool message',
        'tool_call_id: call-7',
        1050,
        390,
        680,
        resultComplete('chat-call-link', 1) ? themeColors.green : themeColors.muted,
        125,
      );
      box(
        ctx,
        api,
        'Claude assistant tool_use',
        ['id: toolu_7', 'input: argument object'],
        150,
        680,
        735,
        themeColors.blue,
        170,
      );
      box(
        ctx,
        api,
        'next user message',
        [
          claude ? 'tool_result.tool_use_id: toolu_7' : 'tool_result linked to tool-use ID',
          'result block before new text',
        ],
        1050,
        680,
        680,
        claude ? themeColors.green : themeColors.muted,
        160,
      );
      chapterLine(ctx, api, 905, 475, 1025, 475, themeColors.blue, 3);
      if (claude) chapterLine(ctx, api, 905, 765, 1025, 765, themeColors.green, 3);
    } else {
      box(
        ctx,
        api,
        'Gemini function_call',
        ['id: step-7', 'name + argument object'],
        150,
        390,
        730,
        themeColors.blue,
        165,
      );
      box(
        ctx,
        api,
        'function_result',
        [
          resultComplete('gemini-result-link', 2) ? 'call_id: step-7' : 'call_id: pending match',
          'name + result content blocks',
        ],
        1050,
        390,
        680,
        themeColors.cyan,
        165,
      );
      chapterLine(ctx, api, 900, 470, 1025, 470, themeColors.cyan, 3);
      chapterText(ctx, api, 'Continuation', 150, 675, 31, themeColors.yellow);
      const parts = ['returned call step', 'returned result step', 'thought steps'];
      parts.forEach((v, i) => {
        if (i < 2 || resultComplete('gemini-history', 2))
          box(
            ctx,
            api,
            v,
            'preserved stateless history',
            150 + i * 550,
            740,
            500,
            i === 2 ? themeColors.yellow : themeColors.blue,
            125,
          );
      });
      chapterText(
        ctx,
        api,
        'Stateful alternative: previous_interaction_id',
        150,
        950,
        29,
        themeColors.cyan,
      );
    }
    footer(
      ctx,
      api,
      'Endpoint-specific wire contracts. No API request is performed by this drawing.',
    );
  });
}
export default {
  id: 'provider-linkage',
  draw: drawProviderLinkage,
  cues: [
    'tu-provider-linkage-1',
    'tu-response-call-link',
    'tu-response-wrong-id',
    'tu-provider-linkage-2',
    'tu-chat-call-link',
    'tu-claude-result-link',
    'tu-provider-linkage-3',
    'tu-gemini-result-link',
    'tu-gemini-history',
  ],
};
