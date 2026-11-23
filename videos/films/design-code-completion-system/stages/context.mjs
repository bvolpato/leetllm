import { completionCue, sampleModel } from '../construction.mjs';
import { promptParts } from '../model.mjs';
import { text } from '../defaults.mjs';
export function drawContext(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel(state);
  {
    const beat = state.beat;
    const baseParts = promptParts(false),
      boundaries = beat || completionCue(state, 'context-preserve-edit-boundaries') > 0,
      nearby = beat || completionCue(state, 'context-nearby-code') > 0,
      extra = beat && completionCue(state, 'context-additional-snippet') > 0;
    const parts = [
      ...baseParts.map((part) => ({
        ...part,
        value: (part.id === 'suffix' || part.id === 'framing' ? boundaries : nearby)
          ? part.value
          : 0,
      })),
      ...(beat
        ? [
            {
              id: 'snippet',
              label: 'Additional snippet slice',
              value: extra ? 500 : 0,
            },
          ]
        : []),
    ].map((v, i) => ({
      ...v,
      focusTarget: 'context-' + v.id,
      color: [
        themeColors.muted,
        themeColors.blue,
        themeColors.green,
        themeColors.cyan,
        themeColors.yellow,
      ][i],
    }));
    const allocation = api.focus.target('context-allocation-context', () =>
      teaching.allocation({
        x: 300,
        y: 350,
        width: 1320,
        height: 550,
        capacity: 8000,
        parts,
        fontSize: 29,
        unit: 'tokens',
      }),
    );
    text(
      ctx,
      api,
      'Entire prompt budget includes framing and the suffix',
      960,
      280,
      35,
      themeColors.ink,
      'center',
    );
    text(
      ctx,
      api,
      'Remaining capacity: ' + allocation.remaining + ' tokens',
      960,
      960,
      33,
      themeColors.yellow,
      'center',
    );
    if (beat)
      text(
        ctx,
        api,
        'Candidate snippet: 900 tokens · admit at most 500 · preserved suffix: 1,000',
        960,
        1030,
        26,
        themeColors.cyan,
        'center',
      );
  }
}
export default {
  id: 'context',
  draw: drawContext,
  cues: [
    'context-preserve-edit-boundaries',
    'context-nearby-code',
    'context-additional-snippet',
    'context-retain-suffix',
  ],
};
