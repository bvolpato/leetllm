import { rayMix } from '../arithmetic.mjs';
import { rayChapterState, rayProgress } from '../construction.mjs';
import { chapterCard, chapterText, footer, heading, packet, panel } from '../defaults.mjs';
export function drawLostResult(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = rayChapterState('lost-result', state),
    { b: currentBeat, p: progress } = modelState,
    cueProgress = (id, beat = currentBeat) => rayProgress(state, 'ray-' + id, beat);
  api.focus.target('ray-lost-result-mechanism', () => {
    heading(
      ctx,
      api,
      currentBeat === 0
        ? 'Lose a copy, then all copies, with the owner alive'
        : currentBeat === 1
          ? 'Same copy on B, different owner failure'
          : 'Input stored directly with ray.put',
    );
    const ownerGone = currentBeat === 1 && !modelState.ownerAlive;
    chapterCard(
      ctx,
      api,
      ownerGone ? 'Owner D · lost' : 'Owner D · metadata',
      170,
      350,
      680,
      ownerGone ? themeColors.pink : themeColors.yellow,
    );
    chapterCard(
      ctx,
      api,
      currentBeat === 2 ? 'ray.put value' : 'Task A · lineage',
      1070,
      350,
      680,
      themeColors.blue,
    );
    const { onA: showA, onB: showB } = modelState;
    panel(ctx, api, 170, 610, 680, 200, themeColors.blue);
    panel(ctx, api, 1070, 610, 680, 200, themeColors.cyan);
    chapterText(
      ctx,
      api,
      showA ? 'Node A · bytes' : 'Node A · no copy',
      510,
      725,
      34,
      showA ? themeColors.green : themeColors.muted,
      'center',
    );
    chapterText(
      ctx,
      api,
      showB ? 'Node B · bytes survive' : 'Node B · no copy',
      1410,
      725,
      34,
      showB ? themeColors.green : themeColors.muted,
      'center',
    );
    if (currentBeat === 0 && cueProgress('reconstruct', 0) > 0) {
      const x = rayMix(1100, 200, cueProgress('reconstruct', 0));
      packet(
        ctx,
        api,
        modelState.reconstructed ? 'replayed A' : 'replaying A',
        x,
        835,
        themeColors.green,
        250,
      );
    }
    if (modelState.resultReady)
      chapterText(
        ctx,
        api,
        modelState.status,
        960,
        950,
        40,
        modelState.usable ? themeColors.green : themeColors.pink,
        'center',
      );
    else
      chapterText(
        ctx,
        api,
        currentBeat === 2
          ? showB
            ? 'One accessible input copy'
            : 'Which task could regenerate this input?'
          : currentBeat === 1
            ? 'Who owns the handle for these bytes?'
            : 'Which copy can supply the result?',
        960,
        950,
        30,
        themeColors.muted,
        'center',
      );
    footer(
      ctx,
      api,
      'Separate cases retain their declared owner/copy/lineage premises; distributed faults were not executed',
    );
  });
}
export default {
  id: 'lost-result',
  draw: drawLostResult,
  cues: [
    'ray-lost-result-op-0',
    'ray-copy-survives',
    'ray-copy-a-lost',
    'ray-all-copies',
    'ray-reconstruct',
    'ray-lost-result-op-1',
    'ray-owner-dies',
    'ray-owner-error',
    'ray-lost-result-op-2',
    'ray-put-no-lineage',
    'ray-put-last-copy',
  ],
};
