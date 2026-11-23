import { sampleOriginalModel } from '../construction.mjs';
import { drawText } from '../defaults.mjs';
export function drawScheduler(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleOriginalModel('scheduler', state);
  {
    const frame = modelState.frame;
    const states = frame.state;
    const colorFor = (name) =>
      ({
        complete: themeColors.green,
        retry: themeColors.yellow,
        failed: themeColors.pink,
        blocked: themeColors.muted,
        ready: themeColors.cyan,
        waiting: themeColors.muted,
      })[states[name]] ?? themeColors.muted;
    drawText(
      ctx,
      api,
      'Policy: at most ' +
        modelState.maxAttempts +
        ' attempt' +
        (modelState.maxAttempts === 1 ? '' : 's'),
      960,
      295,
      30,
      themeColors.yellow,
      'center',
    );
    teaching.flowGraph({
      nodes: [
        {
          id: 'docs',
          label: `docs · ${states.docs}`,
          x: 240,
          y: 365,
          width: 500,
          height: 112,
          color: colorFor('docs'),
          focusTarget: 'scheduler-node-docs',
        },
        {
          id: 'test',
          label: `test · ${states.test}`,
          x: 1110,
          y: 365,
          width: 500,
          height: 112,
          color: colorFor('test'),
          focusTarget: 'scheduler-node-test',
        },
        {
          id: 'deploy',
          label: `deploy · ${states.deploy}`,
          x: 1110,
          y: 665,
          width: 500,
          height: 112,
          color: colorFor('deploy'),
          focusTarget: 'scheduler-node-deploy',
        },
      ],
      edges: [
        {
          from: 'test',
          to: 'deploy',
          color: colorFor('test'),
          progress: states.test === 'complete' ? 1 : 0,
        },
      ],
    });
    api.focus.target('scheduler-dependency', () =>
      drawText(
        ctx,
        api,
        'deploy dependency count: ' + (states.test === 'complete' ? 0 : 1),
        830,
        620,
        27,
        states.test === 'complete' ? themeColors.green : themeColors.pink,
        'center',
      ),
    );
    drawText(
      ctx,
      api,
      `Executed in this snapshot: ${frame.executed.join(' → ') || 'none yet'}`,
      960,
      850,
      34,
      themeColors.ink,
      'center',
    );
    drawText(
      ctx,
      api,
      `Attempts: test ${frame.attempts.test} · completed: ${frame.completed.join(', ') || 'none'} · failed: ${frame.failed.join(', ') || 'none'} · blocked: ${frame.blocked.join(', ') || 'none'}`,
      960,
      935,
      25,
      themeColors.yellow,
      'center',
    );
  }
}
export default {
  id: 'scheduler',
  draw: drawScheduler,
  cues: [
    'scheduler-docs-complete',
    'scheduler-beat-1-focus-1',
    'scheduler-retry-success',
    'scheduler-beat-1-focus-2',
    'scheduler-test-exhausted',
    'scheduler-beat-2-focus-1',
  ],
};
