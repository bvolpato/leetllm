import { ciOutcome, nullableRecord } from '../model.mjs';
import { constructionCode as code, constructionText as text } from '../defaults.mjs';
import { after } from '../page.mjs';

const project = 'project-gamma';
const record = { run_id: 'RUN-915', status: 'failed', failing_job: null };
const snapshot = { [project + '/' + record.run_id]: 'failed' };
const proposal = { run_id: record.run_id, action: 'rollback', approved: true };
const approvals = [];
export function drawFreshIncident(ctx, scene, state, api) {
  const { C, focus } = api;
  focus.target('incident-desk', () => {
    const switched = after(state, 'fresh-switch');
    const scope = switched ? 'project-delta' : project;
    const outcome = ciOutcome({ ...record, project }, scope, snapshot);
    const show =
      !switched &&
      after(state, 'sg-fresh-show') &&
      nullableRecord(record) &&
      outcome.outcome === 'show snapshot';
    const denied =
      after(state, 'sg-fresh-deny') &&
      !approvals.some((a) => a.action === proposal.action && a.run_id === proposal.run_id);
    const resolved = switched && after(state, 'fresh-stop');
    const proposed = focus.progress('fresh-proposal', 0) > 0;
    const grants = focus.progress('fresh-input', 0) > 0;
    text(ctx, api, 'Completed record', 150, 265, 35, C.cyan);
    code(ctx, api, 'run_id: ' + record.run_id, 150, 349, 46);
    code(ctx, api, 'status: ' + record.status, 150, 433, 42);
    code(ctx, api, 'failing_job: ' + record.failing_job, 150, 513, 42);
    if (proposed) {
      text(ctx, api, 'Proposal', 150, 593, 34, C.cyan);
      code(ctx, api, 'rollback   approved: ' + proposal.approved, 340, 593, 33);
    }
    api.line(ctx, 937, 237, 937, 629, C.muted, 2);
    text(ctx, api, 'Host    /    request for ' + project, 1020, 265, 35, C.yellow);
    code(ctx, api, 'Read scope: ' + scope, 1020, 349, 40, switched ? C.yellow : C.ink);
    text(
      ctx,
      api,
      resolved
        ? 'Scope excludes this project'
        : switched
          ? 'Lookup awaits scope check'
          : 'CI reports failed. Job unidentified.',
      1020,
      441,
      37,
    );
    if (grants) {
      text(ctx, api, 'Rollback approvals: ' + approvals.length, 1020, 523, 37);
      text(ctx, api, 'Deployment evidence: none', 1020, 597, 37);
    }
    api.line(ctx, 145, 662, 1775, 662, C.muted, 2);
    text(ctx, api, 'Dashboard', 150, 750, 33, C.muted);
    text(ctx, api, 'Proposed rollback', 1020, 750, 33, C.muted);
    text(
      ctx,
      api,
      resolved ? 'Access denied' : show ? 'failed snapshot' : '?',
      150,
      854,
      61,
      resolved ? C.pink : show ? C.green : C.ink,
    );
    text(ctx, api, denied ? 'DENY' : '?', 1020, 854, 61, denied ? C.pink : C.ink);
    if (show) text(ctx, api, 'Job unknown', 150, 935, 38, C.muted);
    if (switched)
      text(
        ctx,
        api,
        'Snapshot lookups: ' + (resolved ? Number(outcome.queried) : '?'),
        150,
        935,
        38,
        C.yellow,
      );
    if (denied) text(ctx, api, 'No operation dispatched', 1020, 935, 38, C.muted);
  });
}
export default {
  id: 'fresh-incident',
  draw: drawFreshIncident,
  cues: [
    'fresh-proposal',
    'fresh-input',
    'sg-fresh-show',
    'sg-fresh-deny',
    'fresh-switch',
    'fresh-stop',
  ],
};
