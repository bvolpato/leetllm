import { normalizeVector, stableSoftmax } from 'vizmatic';
import { CAPTIONS, TEMPERATURE } from '../fixtures.mjs';
import { FIXTURE } from '../observations.mjs';
import { spokenProgress } from '../construction.mjs';
import { drawClipText, libraryPhoto } from '../defaults.mjs';
import { drawPolicy, initialPrompts } from '../inspection-policy.mjs';

export function drawZeroShot(ctx, scene, state, api) {
  const beat = state.beat ?? 0;
  const { C } = api;
  if (beat === 2) {
    const templates = [
      ['A photo of a rack hazard', [0.92, 0.2, 0.05]],
      ['A picture of a rack hazard', [0.88, 0.24, 0.07]],
      ['An image showing rack hazard', [0.86, 0.28, 0.08]],
      ['A rack hazard in the wild', [0.82, 0.31, 0.12]],
    ];
    const units = templates.map(([, v]) => normalizeVector(v));
    const average = units[0].map((_, i) => units.reduce((s, v) => s + v[i], 0) / units.length);
    const format = (v) => '[' + v.map((x) => x.toFixed(3)).join(',  ') + ']';
    api.text(ctx, 'Descriptions of one class', 242, 333, 37, C.muted);
    api.text(ctx, 'Normalized text vector', 1087, 333, 37, C.muted);
    templates.forEach(([prompt], i) => {
      api.text(ctx, prompt, 242, 447 + i * 97, 38, C.ink);
      api.text(ctx, format(units[i]), 1087, 447 + i * 97, 38, C.cyan);
    });
    api.focus.target('prompt-average', () => {
      const ready = spokenProgress(state, 'prompt-average-unit', 2) > 0;
      api.line(ctx, 242, 821, 1667, 821, C.line, 3);
      api.text(ctx, 'One class vector', 242, 921, 42, C.ink);
      api.text(
        ctx,
        ready ? format(normalizeVector(average)) : '[   ?   ]',
        1087,
        921,
        42,
        C.yellow,
      );
    });
    return;
  }
  if (beat >= 3) {
    drawPolicy(ctx, api, {
      prompts: initialPrompts,
      question: beat === 3,
      revealGap: spokenProgress(state, 'policy-measure', 4) === 1,
      revealRoute: spokenProgress(state, 'policy-keep', 4) === 1,
    });
    return;
  }
  libraryPhoto(ctx, api, 0, 130, 337, 570, 448);
  drawClipText(ctx, api, 'Photo 17', 415, 865, 41);
  const cosine = FIXTURE.queryScores;
  const solo = spokenProgress(state, 'prompt-remove', 1) > 0;
  const distribution = stableSoftmax(solo ? [cosine[2]] : cosine, TEMPERATURE);
  const showWeights = spokenProgress(state, 'prompt-shares', 0) > 0;
  for (const [x, label] of [
    [800, 'Candidate prompt'],
    [1405, 'Cosine'],
    [1600, 'Share'],
  ])
    api.text(ctx, label, x, 355, 31, C.muted);
  api.focus.target('prompt-set', () => {
    CAPTIONS.forEach((label, i) => {
      const y = 478 + i * 147;
      if (solo && i !== 2) {
        api.line(ctx, 800, y - 13, 1670, y - 13, C.line, 2);
        return;
      }
      api.text(ctx, label, 800, y, 35, C.ink);
      api.text(ctx, cosine[i].toFixed(3), 1405, y, 36, C.cyan);
      if (showWeights) api.text(ctx, distribution[solo ? 0 : i].toFixed(3), 1600, y, 36, C.yellow);
    });
  });
  drawClipText(
    ctx,
    api,
    solo
      ? 'Same photo and cosine   ·   one candidate in the denominator'
      : 'One stored image vector   ·   three text vectors',
    960,
    988,
    35,
    C.muted,
  );
}

export default {
  id: 'zero-shot',
  draw: drawZeroShot,
  cues: ['prompt-shares', 'prompt-remove', 'prompt-average-unit', 'policy-measure', 'policy-keep'],
};
