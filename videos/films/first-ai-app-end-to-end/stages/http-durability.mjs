import { text, traceStack } from '../defaults.mjs';
import { cueProgress } from '../receipt.mjs';
import { runFixture } from '../model.mjs';

const run = runFixture();
export function drawHttpDurability(ctx, scene, state, api) {
  const { C } = api,
    during = state.beat === 0;
  api.focus.target('http-durability-mechanism', () => {
    if (state.beat < 2) {
      const show =
        cueProgress(
          scene,
          state,
          during ? 'firstapp-result-committed-running' : 'firstapp-result-committed-completed',
        ) > 0;
      const record = during ? run.journal[2].trace : run.rows[0];
      text(
        ctx,
        api,
        during ? 'Inside the provider call' : 'After the HTTP response',
        145,
        310,
        40,
        C.blue,
      );
      text(ctx, api, 'Stored row', 1125, 310, 40, C.cyan);
      api.rect(ctx, 145, 385, 695, 374, C.panel, C.blue, 12);
      text(ctx, api, during ? 'Separate SQLite connection' : 'Reopened SQLite file', 180, 468, 38);
      text(ctx, api, 'SELECT status, version FROM tasks', 180, 559, 29, C.blue, 'left', true);
      api.line(ctx, 180, 605, 795, 605, C.muted, 2);
      text(
        ctx,
        api,
        show ? record.status + ', ' + record.version : 'Readback pending',
        180,
        701,
        44,
        show ? C.green : C.muted,
      );
      traceStack(
        ctx,
        api,
        1125,
        450,
        record.status,
        record.version,
        record.version === 1 ? C.yellow : C.green,
      );
      if (show) api.arrow(ctx, 1095, 630, 868, 630, C.cyan, 5);
      if (show)
        text(
          ctx,
          api,
          during
            ? 'The provider can already read the committed row.'
            : 'The result can be read after the writer closes its connection.',
          960,
          944,
          38,
          C.ink,
          'center',
        );
    } else {
      text(ctx, api, 'HTTP 200', 960, 340, 62, C.cyan, 'center');
      text(ctx, api, 'Read the status field', 960, 427, 40, C.ink, 'center');
      for (const [i, label] of ['completed', 'failed'].entries()) {
        const x = 230 + i * 800;
        const color = i === 0 ? C.green : C.pink;
        api.rect(ctx, x, 530, 650, 250, C.panel, color, 10);
        text(ctx, api, label, x + 40, 621, 50, color);
        text(
          ctx,
          api,
          i === 0 ? 'Checked policy decision' : 'Recorded error code',
          x + 40,
          711,
          35,
        );
      }
    }
  });
}
export default {
  id: 'http-durability',
  draw: drawHttpDurability,
  cues: [
    'http-durability-b1',
    'firstapp-result-committed-running',
    'http-durability-b2',
    'firstapp-result-committed-completed',
    'http-durability-b3',
  ],
};
