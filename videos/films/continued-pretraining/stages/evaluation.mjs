import { phraseProgress } from '../construction.mjs';
import { evaluationSnapshot } from '../model.mjs';
import { RETAINED_CHECKS } from '../fixtures.mjs';

export function drawEvaluation(ctx, scene, state, api) {
  const { C } = api;
  const data = evaluationSnapshot(2, 1);
  const domainCount = 1 + Math.ceil(4 * phraseProgress(state, 'eval-domain', 0));
  const taskCount = 1 + Math.ceil(4 * phraseProgress(state, 'eval-probe', 1));
  const generalCount = Math.ceil(5 * phraseProgress(state, 'eval-general', 2));
  const x = (i) => 475 + 295 * i;
  const y = (v) => 618 - (v - 15) * 9;
  api.text(ctx, 'Held-out text', 155, 355, 38, C.ink);
  api.text(ctx, 'Perplexity', 155, 412, 33, C.muted);
  api.text(ctx, 'Lower is better', 155, 462, 27, C.muted);
  const trace = (series, count, color, above) => {
    for (let i = 0; i < count; i++) {
      const py = y(series[i]);
      if (i > 0) api.line(ctx, x(i - 1), y(series[i - 1]), x(i), py, color, 4);
      api.circle(ctx, x(i), py, 9, color);
      const dx = above && i === 4 && generalCount > 0 ? -43 : 0;
      api.text(
        ctx,
        series[i].toFixed(above ? 0 : 1),
        x(i) + dx,
        py + (above ? -20 : 46),
        31,
        color,
        'center',
      );
    }
  };
  api.focus.target('fit-trace', () => {
    api.text(ctx, 'Domain text', x(0), 255, 36, C.cyan);
    trace(data.domain, domainCount, C.cyan, true);
    if (generalCount > 0) {
      api.text(ctx, 'General text', x(2), 255, 36, C.pink);
      trace(data.general, generalCount, C.pink, false);
    }
  });
  api.focus.target('task-trace', () => {
    api.text(ctx, 'Task accuracy', 140, 732, 34, C.ink);
    api.text(ctx, 'Checkpoint', 155, 823, 30, C.muted);
    for (let i = 0; i < data.domain.length; i++) {
      api.text(
        ctx,
        i < taskCount ? data.tasks[i] + '%' : '?',
        x(i),
        735,
        49,
        i < taskCount ? C.green : C.muted,
        'center',
      );
      api.text(ctx, i === 0 ? 'Base' : String(i), x(i), 825, 31, C.muted, 'center');
    }
  });
  api.focus.target('required-cases', () => {
    const measured = phraseProgress(state, 'eval-cases', 2, 0.5, 0.85) > 0;
    if (measured) {
      const count = (name) => RETAINED_CHECKS[name].at(-1).filter(Boolean).length;
      api.text(ctx, 'Last checkpoint', 155, 974, 34, C.ink);
      api.text(ctx, 'Safety   ' + count('safety') + '/10   (needs 9)', 548, 974, 36, C.pink);
      api.text(ctx, 'Reasoning   ' + count('reasoning') + '/10   (needs 7)', 1150, 974, 36, C.pink);
    } else {
      api.text(
        ctx,
        state.beat === 0
          ? 'Has the assistant learned to do the task better?'
          : 'Use the same task protocol at every checkpoint.',
        960,
        969,
        39,
        C.ink,
        'center',
      );
    }
  });
}

export default {
  id: 'evaluation',
  draw: drawEvaluation,
  cues: ['eval-domain', 'eval-probe', 'eval-general', 'eval-cases'],
};
