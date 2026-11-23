import { cueMotion, visionCueStarted, visionFreshState } from '../construction.mjs';
import { labeledId, nextId, nextStrip, pixelStrip } from '../incident.mjs';
import { patchComparison } from '../patch-comparison.mjs';

function compareReadings(ctx, state, api) {
  const { C } = api;
  const label = nextId;
  const checked = cueMotion(state, 4, 'fresh-check-strings', 0.05, 0.38);
  const started = (id, at) =>
    state.beat === 4 && visionCueStarted(state.cues, id, state.beatP >= at);
  const matched = started('fresh-match', 0.62);
  const lookup = started('fresh-lookup', 0.83);
  api.focus.target('labeled-crop', () => {
    api.text(ctx, 'Next failed deployment', 110, 320, 39, C.ink);
    pixelStrip(ctx, api, nextStrip, 110, 400, 15);
    if (checked > 0) {
      api.text(ctx, 'Reference label for this crop', 110, 669, 32, C.muted);
      api.text(ctx, label, 110, 762, 71, C.ink, 'left', 'mono');
    }
  });
  api.focus.target('supplied-readings', () => {
    api.text(
      ctx,
      checked > 0 ? 'reading === label' : 'Proposed readings',
      1010,
      320,
      39,
      C.ink,
      'left',
      checked > 0 ? 'mono' : 'sans',
    );
    [labeledId, nextId].forEach((reading, i) => {
      const y = 465 + i * 208;
      [...reading].forEach((ch, j) => {
        const mismatch = checked > 0 && ch !== label[j];
        api.text(ctx, ch, 1010 + j * 51, y, 65, mismatch ? C.red : C.ink, 'left', 'mono');
        if (mismatch) api.line(ctx, 1010 + j * 51, y + 16, 1049 + j * 51, y + 16, C.red, 4);
      });
      const matches = reading === label;
      if (matched)
        api.text(
          ctx,
          matches ? 'Exact match' : 'Mismatch',
          1010,
          y + 73,
          36,
          matches ? C.green : C.red,
        );
    });
  });
  if (lookup)
    api.focus.target('trace-id', () =>
      api.text(ctx, 'Trace lookup   ' + label, 960, 947, 49, C.green, 'center', 'mono'),
    );
  else if (!matched)
    api.text(ctx, 'Which reading opens the right trace?', 960, 947, 42, C.ink, 'center');
}

export function drawFreshDetailBoundary(ctx, scene, state, api) {
  if (state.beat >= 3) return compareReadings(ctx, state, api);
  const example = visionFreshState(state.beat, state.beatP, state.cues);
  patchComparison(ctx, api, {
    original: example.a,
    edited: example.b,
    motion: cueMotion(state, 0, 'fresh-move'),
    answer: example.reveal,
    third: example.repair,
    thirdAnswer: example.showThird,
    question: !example.reveal
      ? 'Can the same token-wise bridge tell these patches apart?'
      : state.beat === 1
        ? 'Same projected input  →  same output from the same token-wise bridge'
        : '',
  });
}
export default {
  id: 'fresh-detail-boundary',
  draw: drawFreshDetailBoundary,
  cues: [
    'fresh-move',
    'fresh-projection-equality',
    'fresh-third-coordinate',
    'fresh-distinguishable',
    'fresh-reference',
    'fresh-check-strings',
    'fresh-match',
    'fresh-lookup',
  ],
};
