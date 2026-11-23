import { sampleModel } from '../construction.mjs';
import { placeNeedle } from '../model.mjs';
import { card, text } from '../defaults.mjs';
export function drawPlacement(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api;
  const modelState = sampleModel('placement', state),
    currentBeat = modelState.step;
  if (state.cues) {
    const u = api.focus.progress(
        currentBeat === 0 ? 'initial-fact' : currentBeat === 1 ? 'move-fact' : 'tail-position',
        modelState.p,
      ),
      from = currentBeat === 0 ? 0 : placeNeedle([0, 0.5, 1][currentBeat - 1]).index;
    modelState.displayIndex = from + (modelState.index - from) * u;
    modelState.settled = currentBeat === 0 || u === 1;
  }
  {
    api.focus.target('placement-readout', () =>
      text(
        ctx,
        api,
        modelState.settled
          ? `Needle [99, 98] · actual depth ${(modelState.actualDepth * 100).toFixed(0)}% of filler`
          : 'Repositioning the same two-token fact',
        140,
        270,
        31,
        themeColors.yellow,
      ),
    );
    api.focus.target('placement-field-grid', () =>
      teaching.grid({
        x: 180,
        y: 450,
        width: 1530,
        height: 150,
        rows: 1,
        columns: 18,
        fill: themeColors.panel,
        stroke: themeColors.muted,
        highlights: modelState.document.map((value, i) => ({
          row: 0,
          column: i,
          fill: i < 4 || i >= 14 ? themeColors.blue : themeColors.panel,
          opacity: 0.4,
        })),
      }),
    );
    api.focus.target('placement-99-98', () =>
      card(
        ctx,
        api,
        '99    98',
        180 + modelState.displayIndex * 85 + 5,
        465,
        160,
        themeColors.yellow,
        120,
      ),
    );
    const readIndex = Math.min(7, Math.floor(modelState.p * 8)),
      edgeIndex = readIndex < 4 ? readIndex : readIndex + 10;
    api.focus.target('placement-readout-3', () =>
      api.line(ctx, 184 + edgeIndex * 85, 625, 261 + edgeIndex * 85, 625, themeColors.blue, 7),
    );
    api.focus.target('placement-16-filler-tokens-and-one-two-token-fact-length-stays-f', () =>
      text(
        ctx,
        api,
        '16 filler tokens and one two-token fact · length stays fixed',
        140,
        690,
        29,
        themeColors.muted,
      ),
    );
    api.focus.target('placement-limited-reader-sees-only-the-first-four-and-last-four-', () =>
      text(
        ctx,
        api,
        'Limited reader sees only the first four and last four positions',
        140,
        755,
        29,
        themeColors.blue,
      ),
    );
    api.focus.target('placement-readout-2', () =>
      card(
        ctx,
        api,
        `Full scan: ${modelState.settled ? (modelState.full ? 'found' : 'missed') : 'pending'}`,
        250,
        825,
        620,
        modelState.settled ? themeColors.green : themeColors.muted,
      ),
    );
    api.focus.target('placement-readout-3', () =>
      card(
        ctx,
        api,
        `Edge scan: ${modelState.settled ? (modelState.edge ? 'found' : 'missed') : 'pending'}`,
        1050,
        825,
        620,
        modelState.settled
          ? modelState.edge
            ? themeColors.green
            : themeColors.pink
          : themeColors.muted,
      ),
    );
    api.focus.target('placement-readout-4', () =>
      text(
        ctx,
        api,
        `Input ${modelState.input} + output ${modelState.output} = ${modelState.limit} · executed reader fixture`,
        960,
        975,
        29,
        themeColors.muted,
        'center',
      ),
    );
  }
}
export default {
  id: 'placement',
  draw: drawPlacement,
  cues: [
    'initial-fact',
    'limited-reader',
    'move-fact',
    'edge-miss',
    'tail-position',
    'test-reader',
  ],
};
