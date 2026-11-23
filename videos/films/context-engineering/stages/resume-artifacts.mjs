import { boundedContext, contextDone } from '../arithmetic.mjs';
import { completeResume, contextResumeFixture } from '../recovery.mjs';
import {
  drawCompleteFocus,
  drawCompleteFooter,
  drawCompleteHeading,
  drawCompleteLine,
  drawCompleteRecord,
  drawCompleteText,
} from '../defaults.mjs';
export function drawResumeArtifacts(ctx, scene, state, api) {
  if (paintResumeArtifacts(ctx, scene, state, api)) return;
}
function paintResumeArtifacts(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = boundedContext(state.beatP ?? 0);
  const resultComplete = (id, beat = currentBeat, end = 0.88) => contextDone(state, id, beat, end);
  drawCompleteFocus(ctx, api, 'ce-resume-artifacts-mechanism', () => {
    const fixture = contextResumeFixture(),
      ready = completeResume(fixture.tasks, fixture.files, fixture.receipts),
      names = ['tasks.json', 'progress.jsonl', 'bootstrap check', 'work receipt', 'recovery rules'];
    drawCompleteHeading(
      ctx,
      api,
      currentBeat < 2
        ? 'Five durable artifacts own five different responsibilities'
        : 'Verify the same receipt before advancing the dependency graph',
    );
    if (currentBeat < 2) {
      names.forEach((name, i) => {
        const x = 150 + (i % 3) * 560,
          y = 400 + Math.floor(i / 3) * 250;
        drawCompleteRecord(
          ctx,
          api,
          name,
          [
            [
              'unique IDs + dependencies',
              'attempts / errors / findings',
              'environment precondition',
              'artifact + input digests',
              'timeouts / retry / escalation',
            ][i],
          ],
          x,
          y,
          510,
          i === 3 ? themeColors.green : themeColors.blue,
          130,
        );
      });
      if (currentBeat === 1)
        drawCompleteText(
          ctx,
          api,
          'Read the progress log to find the last step. Check its receipt before reusing the result.',
          150,
          1000,
          29,
          themeColors.yellow,
        );
    } else {
      fixture.tasks.forEach((task, i) => {
        const x = 150 + i * 550,
          verified = task.status === 'done';
        drawCompleteRecord(
          ctx,
          api,
          task.id,
          verified ? 'trusted receipt matches' : 'pending dependency',
          x,
          470,
          490,
          verified ? themeColors.green : themeColors.muted,
          130,
        );
        if (i < 2) drawCompleteLine(ctx, api, x + 505, 535, x + 535, 535, themeColors.muted, 3);
      });
      drawCompleteRecord(
        ctx,
        api,
        'progress note',
        '“all done” cannot certify task status',
        150,
        760,
        950,
        themeColors.yellow,
        100,
      );
      if (resultComplete('ce-next-ready', 2))
        drawCompleteRecord(
          ctx,
          api,
          'next ready',
          ready.next,
          1200,
          760,
          530,
          themeColors.green,
          100,
        );
    }
    drawCompleteFooter(ctx, api, 'The receipt binds a result to the inputs the evaluator checked.');
  });
  return true;
}
export default {
  id: 'resume-artifacts',
  draw: drawResumeArtifacts,
  cues: [
    'ce-resume-artifacts-1',
    'ce-resume-artifacts-2',
    'ce-resume-artifacts-3',
    'ce-next-ready',
  ],
};
