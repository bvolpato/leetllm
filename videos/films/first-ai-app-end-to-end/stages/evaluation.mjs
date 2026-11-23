import { text } from '../defaults.mjs';
import { invalidRequestFixture, policyCases, runFixture } from '../model.mjs';
import { cueProgress } from '../receipt.mjs';

const cases = policyCases();
const invalid = invalidRequestFixture().map((body) => runFixture({ body }));

export function drawEvaluation(ctx, scene, state, api) {
  const { C } = api;
  const at = (id) => cueProgress(scene, state, id);
  if (state.beat === 0) {
    const count = Math.round(at('run-cases') * cases.length);
    const cols = [120, 580, 1050, 1470];
    for (const [i, label] of ['Account', 'Expected', 'HTTP body', 'Stored trace'].entries())
      text(ctx, api, label, cols[i], 322, 34, C.blue);
    api.focus.target('app-evaluation-result', () => {
      cases.forEach(({ account, expected, run }, i) => {
        const y = 423 + i * 89;
        const inspected = i < count;
        text(ctx, api, account, cols[0], y, 32);
        text(ctx, api, expected.replaceAll('_', ' '), cols[1], y, 35);
        text(
          ctx,
          api,
          inspected ? run.reply.body.decision.replaceAll('_', ' ') : '·',
          cols[2],
          y,
          35,
          inspected ? C.green : C.muted,
        );
        text(
          ctx,
          api,
          inspected ? run.rows[0].status + ' v2' : '·',
          cols[3],
          y,
          30,
          inspected ? C.green : C.muted,
        );
        api.line(ctx, cols[0], y + 28, 1780, y + 28, C.muted, 2);
      });
      const matches = cases
        .slice(0, count)
        .filter((row) => row.expected === row.run.reply.body.decision).length;
      text(
        ctx,
        api,
        matches + ' matching outcomes   /   ' + cases.length + ' fixture cases',
        960,
        953,
        41,
        C.green,
        'center',
      );
    });
  } else if (state.beat === 1) {
    api.focus.target('app-evaluation-result', () =>
      text(
        ctx,
        api,
        'Five matched outcomes with the fixture provider',
        960,
        310,
        42,
        C.green,
        'center',
      ),
    );
    const show = at('firstapp-result-evaluation-invalid') > 0;
    api.focus.target('firstapp-invalid-input-results', () => {
      text(ctx, api, 'Four invalid POST requests', 175, 486, 38);
      const rejected = invalid.filter((run) => run.reply.http === 422).length;
      const calls = invalid.reduce((sum, run) => sum + run.providerCalls, 0);
      const rows = invalid.reduce((sum, run) => sum + run.rows.length, 0);
      text(
        ctx,
        api,
        show ? rejected + ' × HTTP 422' : 'Response pending',
        175,
        579,
        44,
        show ? C.yellow : C.muted,
      );
      text(
        ctx,
        api,
        show ? 'Provider calls  ' + calls + '     New rows  ' + rows : 'Check calls and rows',
        175,
        681,
        30,
        C.muted,
      );
    });
    api.line(ctx, 958, 416, 958, 800, C.muted, 2);
    api.focus.target('health', () => {
      text(ctx, api, 'GET /healthz', 1080, 486, 40, C.blue);
      const read = at('health-read') > 0;
      text(
        ctx,
        api,
        read ? '200   ·   ok' : 'Response pending',
        1080,
        579,
        42,
        read ? C.green : C.muted,
      );
      text(ctx, api, read ? 'Provider calls  0' : 'Simple app path', 1080, 681, 32, C.muted);
    });
  } else if (state.beat === 2) {
    text(ctx, api, 'Same labeled cases', 960, 325, 46, C.ink, 'center');
    api.focus.target('hosted-eval', () => {
      for (const [i, [name, result, detail]] of [
        ['Local fixture', '5 of 5 match', 'Real route, checker and store'],
        ['Hosted adapter', 'Score to measure', 'Errors, latency and cost per attempt'],
      ].entries()) {
        const x = 140 + i * 845;
        api.rect(ctx, x, 445, 785, 338, C.panel, i ? C.blue : C.green, 12);
        text(ctx, api, name, x + 46, 522, 35, C.muted);
        text(ctx, api, result, x + 46, 633, 48, i ? C.blue : C.green);
        text(ctx, api, detail, x + 46, 723, 31);
      }
    });
  } else {
    const replaced = at('replace-container') >= 0.8;
    api.focus.target('deploy-check', () => {
      text(ctx, api, 'SQLite on the container’s local filesystem', 960, 319, 40, C.cyan, 'center');
      for (const [i, [name, value]] of [
        ['Original container', 'T-001    completed    v2'],
        ['Replacement container', replaced ? '(no rows)' : 'What will the app read?'],
      ].entries()) {
        const x = 145 + i * 930;
        api.rect(ctx, x, 422, 685, 336, C.panel, i ? C.yellow : C.blue, 14);
        text(ctx, api, name, x + 36, 506, 36);
        text(ctx, api, 'rotation_tasks.sqlite3', x + 36, 605, 32, C.muted);
        text(ctx, api, value, x + 36, 700, 36, i ? C.yellow : C.green);
      }
      api.arrow(ctx, 856, 591, 1046, 591, C.muted, 4);
      if (replaced)
        text(
          ctx,
          api,
          'Recovery needs a preserved file or a tested backup.',
          960,
          943,
          41,
          C.ink,
          'center',
        );
    });
  }
}
export default {
  id: 'evaluation',
  draw: drawEvaluation,
  cues: [
    'run-cases',
    'app-evaluation-result-b1-1',
    'app-evaluation-result-b2-1',
    'firstapp-result-evaluation-invalid',
    'health-read',
    'measure-hosted',
    'app-evaluation-result-b3-1',
    'replace-container',
  ],
};
