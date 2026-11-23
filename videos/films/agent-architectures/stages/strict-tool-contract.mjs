import { drawArrow, drawBox, drawCenteredText, drawFocusTarget, drawFooter } from '../defaults.mjs';
export function drawStrictToolContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cueProgress = (id) => (state.cues?.[id] ? api.focus.progress(id, 0) : 0),
    resultComplete = (id) => cueProgress(id) === 1;
  const paintMechanism = () => {
    const requests = [
      ['run ID: R1842 · logs: false', 'tool-one', 'accepted read'],
      ['run ID: R1842 · logs: "yes"', 'tool-shape', 'invalid Boolean'],
      ['run ID: R9999 · logs: false', 'tool-denied', 'scope denied'],
    ];
    drawCenteredText(
      ctx,
      api,
      'Exact application request → actor/run check → backend',
      960,
      280,
      34,
      themeColors.yellow,
    );
    requests.forEach(([s, cue, result], i) => {
      const y = 390 + i * 160;
      const known = resultComplete(cue);
      drawBox(ctx, api, s, 190, y, 850, 90, themeColors.blue);
      drawBox(
        ctx,
        api,
        known ? result : 'pending',
        1210,
        y,
        490,
        90,
        known ? (i ? themeColors.pink : themeColors.green) : themeColors.muted,
      );
      drawArrow(ctx, api, 1060, y + 45, 1190, y + 45, themeColors.muted);
    });
    if ((currentBeat === 0 && resultComplete('tool-one')) || currentBeat > 0)
      drawCenteredText(
        ctx,
        api,
        'Backend reads: [R1842] · count 1',
        960,
        950,
        33,
        themeColors.green,
      );
    if (currentBeat === 1)
      drawCenteredText(
        ctx,
        api,
        'Provider strict: every property required; nullable represents absence',
        960,
        330,
        28,
        themeColors.yellow,
      );
    drawFooter(
      ctx,
      api,
      'Valid shape is separate from authorized run scope and actual observation',
    );
  };
  drawFocusTarget(ctx, api, 'aa-strict-tool-contract-mechanism', paintMechanism);
}
export default {
  id: 'strict-tool-contract',
  draw: drawStrictToolContract,
  cues: [
    'aa-strict-tool-contract-0',
    'tool-shape',
    'tool-denied',
    'tool-one',
    'aa-strict-tool-contract-1',
  ],
};
