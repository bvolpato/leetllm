import { cueBegun } from '../arithmetic.mjs';
import { DETECTOR_EXAMPLES } from '../observations.mjs';
import { PROPOSAL, TRUSTED } from '../fixtures.mjs';
import { promotionAllowed } from '../model.mjs';
import { drawPromptText } from '../defaults.mjs';

export function drawLayeredSignals(ctx, scene, state, api) {
  const { C } = api;
  const begun = (id) => cueBegun(state.cues, id, false);
  const text = (s, x, y, size, color = C.ink) => drawPromptText(ctx, api, s, x, y, size, color);
  const rows = [
    { input: 'layered-signals-beat-1-focus-1', source: 'External evaluation', action: 'release' },
    { input: 'signals-paraphrase', source: 'Second evaluation', action: 'release' },
    { input: 'signals-benign-manual', source: 'Security manual', action: 'summary' },
  ];
  text('Passage', 126, 288, 32, C.blue);
  text('Detector', 945, 288, 32, C.blue);
  text('Host decision', 1340, 288, 32, C.cyan);
  const allowWrite = promotionAllowed(PROPOSAL, TRUSTED);
  const readableByThisUser = new Set(['Security manual']);
  rows.forEach(({ input, source, action }, i) => {
    if (i > 0 && !begun(input)) return;
    const example = DETECTOR_EXAMPLES[i];
    const y = 425 + i * 194;
    api.focus.target('signals-' + example.id, () => {
      text(source, 128, y - 30, 28, C.muted);
      text(example.text, 128, y + 30, 34);
    });
    api.focus.target('signals-' + example.id + '-detector', () => {
      text(
        begun(input) ? (example.flagged ? 'Flagged' : 'No alert') : 'Waiting',
        945,
        y + 16,
        40,
        example.flagged ? C.yellow : C.muted,
      );
    });
    api.focus.target('signals-policy-gates', () => {
      const checked =
        action === 'release' ? begun('signals-writes') : begun('layered-signals-beat-2-focus-1');
      if (checked) {
        const allowed = action === 'release' ? allowWrite : readableByThisUser.has(source);
        const label = action === 'release' ? 'Write' : 'Summary';
        text(
          label + (allowed ? ' permitted' : ' denied'),
          1340,
          y + 16,
          36,
          allowed ? C.green : C.pink,
        );
      }
    });
    api.line(ctx, 125, y + 77, 1785, y + 77, C.muted, 2);
  });
}
export default {
  id: 'layered-signals',
  draw: drawLayeredSignals,
  cues: [
    'layered-signals-beat-1-focus-1',
    'signals-paraphrase',
    'signals-benign-manual',
    'signals-writes',
    'layered-signals-beat-2-focus-1',
  ],
};
