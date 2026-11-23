import { recoveryVerdict } from '../protocols.mjs';
import { drawBox, drawCenteredText, drawFocusTarget, drawLeftText } from '../defaults.mjs';
export function drawIncidentRecovery(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cueProgress = (id) => (state.cues?.[id] ? api.focus.progress(id, 0) : 0),
    resultComplete = (id) => cueProgress(id) === 1,
    operationProgress = cueProgress('aa-incident-recovery-' + currentBeat);
  const paintMechanism = () => {
    const stage =
        currentBeat === 2
          ? resultComplete('recovery-close')
            ? 3
            : cueProgress('recovery-no-approval') > 0
              ? 2
              : cueProgress('recovery-high-latency') > 0
                ? 1
                : 0
          : 0,
      health = {
        region: stage === 0 ? 'eu-west' : 'us-east',
        revision: 'def456',
        at: 990,
        p95: stage === 1 ? 940 : 120,
      },
      verdict = recoveryVerdict(health, {
        approved: stage === 3,
      }),
      closed = verdict === 'closed';
    drawCenteredText(
      ctx,
      api,
      currentBeat === 0
        ? 'Bad trace R2099 · affected us-east still runs abc123'
        : 'Local closure fixture A2099 · us-east · expected def456',
      960,
      275,
      32,
      themeColors.yellow,
    );
    const rows = [
      ['region', health.region, health.region === 'us-east'],
      ['revision', health.revision, currentBeat > 0],
      ['age', '10 s', true],
      ['p95', health.p95 + ' ms', health.p95 <= 200],
      ['closure approval', stage === 3 ? 'A2099 + def456' : 'absent', stage === 3],
    ];
    rows.forEach(([key, value, valid], i) => {
      const y = 380 + i * 104;
      drawLeftText(ctx, api, key, 300, y + 35, 30, themeColors.muted);
      drawBox(ctx, api, value, 750, y, 780, 76, valid ? themeColors.green : themeColors.pink);
    });
    if (currentBeat === 0)
      drawCenteredText(
        ctx,
        api,
        'The incident is in us-east. This sample came from eu-west.',
        960,
        960,
        31,
        themeColors.pink,
      );
    else {
      if (currentBeat === 1)
        drawCenteredText(
          ctx,
          api,
          'Age ∈ [0,60) · finite p95 ∈ [0,200] ms',
          960,
          330,
          29,
          themeColors.cyan,
        );
      drawCenteredText(
        ctx,
        api,
        closed ? 'Exact evidence + approval: incident closes' : 'Incident open: ' + verdict,
        960,
        960,
        35,
        closed ? themeColors.green : themeColors.pink,
      );
    }
  };
  drawFocusTarget(ctx, api, 'aa-incident-recovery-mechanism', paintMechanism);
}
export default {
  id: 'incident-recovery',
  draw: drawIncidentRecovery,
  cues: [
    'aa-incident-recovery-0',
    'aa-incident-recovery-1',
    'aa-incident-recovery-2',
    'recovery-region',
    'recovery-no-approval',
    'recovery-close',
    'recovery-high-latency',
  ],
};
