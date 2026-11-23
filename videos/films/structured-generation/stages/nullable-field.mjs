import { constructionCode as code, constructionText as text } from '../defaults.mjs';
import { nullableRecord } from '../model.mjs';
import { after } from '../page.mjs';

const run = { run_id: 'RUN-916', status: 'failed' };
const candidates = [run, { ...run, failing_job: null }, { ...run, failing_job: 'tests' }];
const checks = ['sg-omitted-fail', 'sg-null-pass', 'sg-job-string'];

export function drawNullableField(ctx, scene, state, api) {
  const { C, focus } = api;
  focus.target('sg-nullable-field-mechanism', () => {
    api.line(ctx, 150, 224, 150, 345, C.yellow, 6);
    text(ctx, api, 'Build log', 185, 263, 34, C.yellow);
    text(ctx, api, 'Build failed.', 185, 335, 56);
    code(ctx, api, 'failing_job: str | None', 910, 303, 48, C.cyan);
    text(ctx, api, 'Required field', 910, 357, 33, C.muted);
    api.line(ctx, 150, 407, 1760, 407, C.muted, 2);
    text(ctx, api, 'Job field in reply', 155, 488, 34, C.muted);
    text(ctx, api, 'Schema check', 955, 488, 34, C.muted);
    const showString = state.beat >= 2;
    for (const [i, candidate] of candidates.entries()) {
      if (i === 2 && !showString) continue;
      const y = 587 + i * 110;
      if ('failing_job' in candidate)
        code(ctx, api, '"failing_job": ' + JSON.stringify(candidate.failing_job), 155, y, 48);
      else text(ctx, api, '(field omitted)', 155, y, 46);
      if (after(state, checks[i])) {
        const valid = nullableRecord(candidate);
        text(ctx, api, valid ? 'Pass' : 'Missing key', 955, y, 45, valid ? C.green : C.pink);
      }
    }
    if (focus.progress('sg-null-schema', 0) > 0 && state.beat === 1)
      text(
        ctx,
        api,
        'Strict object schema: every key required, extra keys forbidden',
        155,
        928,
        37,
        C.cyan,
      );
    if (after(state, 'sg-null-source')) {
      text(ctx, api, 'No job named in log', 1260, 807, 38, C.pink);
      text(ctx, api, 'Dashboard', 155, 938, 36, C.muted);
      text(ctx, api, 'Failed   /   Job unknown', 420, 938, 54, C.green);
    }
  });
}

export default {
  id: 'nullable-field',
  draw: drawNullableField,
  cues: ['sg-job-question', ...checks, 'sg-null-schema', 'sg-job-evidence', 'sg-null-source'],
};
