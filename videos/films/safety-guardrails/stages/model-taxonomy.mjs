import { guardCue, guardDone } from '../model.mjs';
import {
  drawGuardMechanismArrow,
  drawGuardMechanismBlock,
  drawGuardMechanismLine,
  drawGuardMechanismNote,
  drawGuardMechanismText,
  withGuardMechanismFocus,
} from '../defaults.mjs';
export function paintModelTaxonomy(ctx, scene, state, api, themeColors, currentBeat, cueProgress) {
  if (currentBeat === 0) {
    const windowTokens = 512;
    const perBlock = 64;
    const blocks = 12;
    const capacity = windowTokens / perBlock;
    const sweep = cueProgress('model-taxonomy-timing', 0);
    drawGuardMechanismBlock(
      ctx,
      api,
      themeColors,
      'models-input',
      'Prompt Guard 2 · input-attack classification',
      ['22M / 86M parameters', '512-token context', 'published A100: 19.3 / 92.4 ms'],
      155,
      300,
      1610,
      310,
      themeColors.blue,
      36,
    );
    withGuardMechanismFocus(ctx, api, 'models-timing', () => {
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        'One block = ' + perBlock + ' input tokens',
        185,
        720,
        33,
        themeColors.yellow,
      );
      for (let i = 0; i < blocks; i++) {
        const x = 185 + i * 130;
        const inspected = i < Math.round(capacity * sweep);
        api.rect(
          ctx,
          x,
          800,
          105,
          45,
          inspected ? themeColors.blue : themeColors.panel,
          inspected ? themeColors.blue : themeColors.muted,
          2,
          2,
        );
      }
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        sweep === 1 ? 'Inspected: ' + windowTokens + ' tokens' : 'First window',
        185,
        920,
        29,
        themeColors.blue,
      );
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        sweep === 1
          ? 'Still to review: ' + (blocks - capacity) * perBlock + ' tokens'
          : 'Remaining text',
        1215,
        920,
        29,
        themeColors.pink,
      );
    });
  } else if (currentBeat === 1) {
    drawGuardMechanismBlock(
      ctx,
      api,
      themeColors,
      'models-tasks',
      'Task and modality determine the comparison',
      [
        'Llama Guard 4 · dense 12B · text + multiple images',
        'Granite Guardian · harm / context relevance / groundedness / answer relevance',
      ],
      155,
      300,
      1610,
      250,
      themeColors.cyan,
      30,
    );
    drawGuardMechanismBlock(
      ctx,
      api,
      themeColors,
      'models-image',
      'ShieldGemma 2',
      ['4B · image-content model · Gemma 3 base'],
      155,
      635,
      1610,
      160,
      themeColors.yellow,
      33,
    );
    drawGuardMechanismNote(
      ctx,
      api,
      themeColors,
      'Choose for the input type, language, and policy you need to check.',
    );
  } else if (currentBeat === 2) {
    drawGuardMechanismBlock(
      ctx,
      api,
      themeColors,
      'models-maintenance',
      'ProtectAI inspected prompt-injection model',
      ['archived · English-oriented', 'example preprocessing: 512-token limit'],
      155,
      300,
      1610,
      230,
      themeColors.yellow,
      35,
    );
    withGuardMechanismFocus(ctx, api, 'models-unsupported', () => {
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        'Image-only input → unsupported category',
        185,
        650,
        34,
        themeColors.cyan,
      );
      drawGuardMechanismArrow(ctx, api, themeColors, 1050, 635, 1250, 635, themeColors.muted);
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        'returned 0',
        1330,
        650,
        36,
        themeColors.yellow,
      );
      drawGuardMechanismLine(ctx, api, themeColors, 185, 740, 1760, 740, themeColors.pink, 4);
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        'Record this category as unevaluated',
        960,
        855,
        38,
        themeColors.pink,
        'center',
      );
    });
  } else {
    drawGuardMechanismBlock(
      ctx,
      api,
      themeColors,
      'models-framework',
      'Configured execution path',
      [
        'Guardrails AI: composed validators',
        'NeMo: rail types',
        'Presidio: recognizers + NLP',
        'Schema library: representation checks',
      ],
      155,
      300,
      900,
      400,
      themeColors.blue,
      32,
    );
    withGuardMechanismFocus(ctx, api, 'models-evaluation', () => {
      const q = cueProgress('model-taxonomy-measure', 3);
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        'same reviewed workload',
        1140,
        345,
        32,
        themeColors.cyan,
      );
      ['false positives', 'harmful misses', 'latency', 'cost'].forEach((s, i) => {
        drawGuardMechanismText(ctx, api, themeColors, s, 1150, 445 + i * 100, 32, themeColors.ink);
        drawGuardMechanismText(
          ctx,
          api,
          themeColors,
          q === 1 ? 'measure' : '?',
          1610,
          445 + i * 100,
          27,
          [themeColors.yellow, themeColors.pink, themeColors.cyan, themeColors.green][i],
        );
      });
    });
    drawGuardMechanismNote(
      ctx,
      api,
      themeColors,
      'Pin actual model, templates, thresholds, versions and detector path',
    );
  }
}
export function drawModelTaxonomy(ctx, scene, state, api) {
  const themeColors = api.C,
    currentBeat = state.beat ?? 0,
    beatProgress = state.beatP ?? 0;
  const cueProgress = (id, beat, a, z) => guardCue(state, id, beat, a, z),
    cueDone = (id, beat, a, z) => guardDone(state, id, beat, a, z);
  return paintModelTaxonomy(ctx, scene, state, api, themeColors, currentBeat, cueProgress);
}
export default {
  id: 'model-taxonomy',
  draw: drawModelTaxonomy,
  cues: [
    'model-taxonomy-input',
    'model-taxonomy-timing',
    'model-taxonomy-tasks',
    'model-taxonomy-image',
    'model-taxonomy-archived',
    'model-taxonomy-zero',
    'model-taxonomy-framework',
    'model-taxonomy-measure',
  ],
};
