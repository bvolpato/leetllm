import { sentenceCounts } from '../fixtures.mjs';
import { replayRows } from '../model.mjs';
import { constructionCell, constructionNote, constructionText } from '../defaults.mjs';
export function drawDiagnosticReplay(ctx, scene, state, api) {
  api.focus.target('pl-diagnostic-replay-trace', () => {
    const { C, components: c } = api,
      b = state.beat,
      beatP = state.beatP ?? 0;
    const op = (beat, sentence) => {
      if (
        !sentenceCounts['diagnostic-replay'] ||
        sentence < 0 ||
        sentence >= sentenceCounts['diagnostic-replay'][beat]
      )
        throw Error('Invalid placement sentence diagnostic-replay/' + beat + '/' + sentence);
      if (b > beat) return 1;
      if (b < beat) return 0;
      return state.cues
        ? api.focus.progress(`pl-${'diagnostic-replay'}-${beat}-${sentence}`, 0)
        : Math.max(0, Math.min(1, beatP * sentenceCounts['diagnostic-replay'][beat] - sentence));
    };
    const done = (beat, sentence) => op(beat, sentence) >= 1;
    {
      if (b === 0) {
        constructionText(
          ctx,
          api,
          'Change one workload coordinate; retain the rest',
          150,
          285,
          33,
          C.cyan,
        );
        const rows = replayRows('context');
        rows.forEach((r, i) => {
          const y = 420 + i * 220;
          constructionCell(
            ctx,
            api,
            r.context.toLocaleString() + ' tokens',
            150,
            y,
            420,
            90,
            C.cyan,
          );
          constructionCell(ctx, api, '4 sessions', 690, y, 350, 90, C.blue);
          constructionText(ctx, api, r.total.toFixed(3) + ' GB modeled', 1220, y + 60, 34, C.green);
        });
        if (done(0, 1))
          constructionText(
            ctx,
            api,
            'Inspect cache reservation and phase peak after the sweep',
            150,
            925,
            32,
            C.yellow,
          );
        constructionNote(ctx, api, 'CPU thread/locality sweeps diagnose a different failure phase');
      } else {
        constructionText(
          ctx,
          api,
          'A live HTTP server can still have a failed model worker',
          150,
          285,
          32,
          C.yellow,
        );
        constructionCell(ctx, api, 'GET /health → 200', 150, 420, 620, 110, C.blue);
        constructionCell(ctx, api, 'Controlled inference → failure', 980, 420, 760, 110, C.pink);
        if (done(1, 1)) {
          constructionCell(
            ctx,
            api,
            'Match the inference request ID to its worker log entry',
            150,
            720,
            1590,
            100,
            C.green,
          );
        }
        if (done(1, 3))
          constructionNote(ctx, api, 'Read the model and execution phase from that entry.');
      }
    }
  });
}
export default {
  id: 'diagnostic-replay',
  draw: drawDiagnosticReplay,
  cues: [
    'pl-diagnostic-replay-0-0',
    'pl-diagnostic-replay-0-1',
    'pl-diagnostic-replay-0-2',
    'pl-diagnostic-replay-0-3',
    'pl-diagnostic-replay-1-0',
    'pl-diagnostic-replay-1-1',
    'pl-diagnostic-replay-1-2',
    'pl-diagnostic-replay-1-3',
  ],
};
