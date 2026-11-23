import { sampleModel } from '../model.mjs';
import {
  chapterFooter,
  chapterGrid,
  chapterRows,
  chapterText,
  chapterTitle,
} from '../defaults.mjs';
export function drawTokenizerFields(ctx, scene, state, api) {
  return api.focus.target('hf-tokenizer-fields-mechanism', () => {
    const { C: themeColors } = api,
      modelState = sampleModel('tokenizer-fields', state),
      { b: currentBeat, p: progress } = modelState;
    {
      chapterTitle(
        ctx,
        api,
        currentBeat === 0
          ? 'Supplied left truncation removes an old prefix'
          : 'Two ways to tokenize the same chat',
      );
      if (currentBeat === 0) {
        const words =
          progress > 0.35
            ? ['removed', 'removed', 'current user', 'assistant']
            : ['old policy', 'old evidence', 'current user', 'assistant'];
        chapterGrid(ctx, api, [words], 210, 440, 1500, 120, themeColors.blue, 27);
        if (progress > 0.35)
          chapterText(
            ctx,
            api,
            'Oldest prefix removed by supplied left truncation',
            960,
            630,
            30,
            themeColors.pink,
            'center',
          );
        chapterGrid(
          ctx,
          api,
          [
            ['Retained token', 'Original source span'],
            ['current user', 'same text offsets'],
          ],
          350,
          700,
          1220,
          180,
          themeColors.cyan,
          28,
        );
      } else {
        chapterRows(
          ctx,
          api,
          [
            ['Jinja rendering', 'System + user + assistant prefix'],
            ['Combined tokenization', 'Same IDs as separate, special insertion off'],
            ['Local template', 'ChatML-style role markers'],
          ],
          390,
          165,
        );
      }
      chapterFooter(
        ctx,
        api,
        'Vocabulary, merges, special IDs, masks, truncation and offsets are input contracts',
      );
      return;
    }
  });
}
export default {
  id: 'tokenizer-fields',
  draw: drawTokenizerFields,
  cues: ['hf-tokenizer-fields-0', 'hf-tokenizer-fields-1'],
};
