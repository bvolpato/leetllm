import { CI_RUN } from '../fixtures.mjs';
import { ciOutcome } from '../model.mjs';
import { constructionCode as code, constructionText as text } from '../defaults.mjs';
import { after } from '../page.mjs';

const snapshot = { [CI_RUN.project + '/' + CI_RUN.run_id]: CI_RUN.status };
const rows = [
  ['project-beta', 'failed', 'ci-deny'],
  ['project-alpha', 'passed', 'ci-review'],
  ['project-alpha', 'failed', 'ci-show'],
];
export function drawCiSnapshot(ctx, scene, state, api) {
  const { C, focus } = api;
  focus.target('ci-lookups', () => {
    text(ctx, api, 'Caller may read', 145, 262, 34, C.muted);
    code(ctx, api, CI_RUN.project, 145, 350, 56, C.yellow);
    text(ctx, api, 'Requested run', 1020, 262, 34, C.muted);
    code(ctx, api, CI_RUN.run_id, 1020, 350, 56);
    ['Candidate project', 'Claim', 'CI read', 'Decision'].forEach((label, i) =>
      text(ctx, api, label, [145, 600, 947, 1370][i], 484, 34, C.muted),
    );
    rows.slice(0, state.beat + 1).forEach(([project, status, cue], i) => {
      if (i === 1 && !after(state, 'ci-second')) return;
      if (i === 2 && !after(state, 'ci-change')) return;
      const y = 610 + i * 155;
      const result = ciOutcome(
        { project, run_id: CI_RUN.run_id, status },
        CI_RUN.project,
        snapshot,
      );
      const visible = after(state, cue);
      code(ctx, api, project, 145, y, 42);
      code(ctx, api, status, 600, y, 42);
      const read = visible || (i === 1 && after(state, 'ci-status'));
      text(
        ctx,
        api,
        read ? (result.queried ? CI_RUN.status : 'Skipped') : '?',
        947,
        y,
        43,
        read && result.queried ? C.yellow : C.muted,
      );
      text(
        ctx,
        api,
        visible ? result.outcome : '?',
        1370,
        y,
        43,
        visible ? (result.outcome === 'show snapshot' ? C.green : C.pink) : C.muted,
      );
      api.line(ctx, 145, y + 46, 1775, y + 46, C.muted, 2);
    });
  });
}
export default {
  id: 'ci-snapshot',
  draw: drawCiSnapshot,
  cues: ['ci-deny', 'ci-second', 'ci-status', 'ci-review', 'ci-change', 'ci-show'],
};
