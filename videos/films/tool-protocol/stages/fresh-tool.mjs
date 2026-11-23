import { clockTime } from '../fixtures.mjs';
import { shiftReads, shiftRuns, evaluateShift } from '../model.mjs';
import { filmPainter } from '../defaults.mjs';

function drawReceipts(ctx, state, api) {
  const { C } = api;
  const { label, line, target, started, finished } = filmPainter(ctx, api);
  const requested = shiftReads[0].requested;
  const newRead = started('fresh-new-read') || started('t-fresh-tool-repair');
  const returned = started('fresh-return') || started('t-fresh-tool-repair');
  const read = shiftReads[Number(newRead)];
  target('task-release', () => {
    label('Question for deployments', 160, 288, 33, C.muted, 'left');
    label(requested, 160, 375, 60, C.blue, 'left');
    label('Approved read   ·   ' + clockTime(read.observedAt), 160, 450, 33, C.ink, 'left');
  });
  line(160, 493, 1760, 493, C.muted, 2);
  const gotReply = newRead ? returned : state.beat > 0 || started('fresh-reply');
  target('read-receipt', () => {
    label('Status receipt', 1000, 288, 33, C.muted, 'left');
    label('ID: ' + read.id, 1000, 375, 53, C.cyan, 'left');
    label(
      gotReply ? 'complete   ·   isError false' : 'Awaiting reply',
      1000,
      450,
      35,
      C.ink,
      'left',
    );
  });
  target('returned-release', () => {
    label('Returned by deployments', 160, 581, 33, C.muted, 'left');
    if (gotReply) {
      label('release_id: ' + read.payload.release_id, 160, 660, 46, C.cyan, 'left');
      label('status: ' + read.payload.status, 160, 735, 34, C.ink, 'left');
      label('health: ' + read.payload.health, 160, 801, 34, C.ink, 'left');
    } else label('Awaiting observation', 160, 660, 40, C.muted, 'left');
  });
  const rejected = finished('t-fresh-tool-reject');
  const checked = finished('t-fresh-tool-repair');
  target('receipt-decision', () => {
    label(
      started('fresh-target') || state.beat > 0 ? 'Can this answer for v18?' : 'Observation check',
      1000,
      581,
      35,
      C.ink,
      'left',
    );
    if (newRead && checked && read.accepted)
      label('target matches', 1000, 665, 45, C.green, 'left');
    else if (!newRead && rejected && !read.accepted)
      label('reject wrong target', 1000, 665, 45, C.yellow, 'left');
    if (newRead && rejected)
      label('retained: reply 71 · v17 · rejected', 1000, 755, 32, C.muted, 'left');
  });
  if (state.beat === 1 && newRead)
    target('write-status', () => {
      const held = finished('t-fresh-tool-hold');
      label(
        held
          ? 'status observation accepted   /   traffic shift held'
          : 'Policy receipt required for a traffic shift',
        960,
        926,
        39,
        held ? C.yellow : C.muted,
      );
    });
}

function drawDispatches(ctx, state, api) {
  const { C } = api;
  const { label, line, dot, target, started, finished, progress } = filmPainter(ctx, api);
  const boundary = 840,
    server = 1250;
  target('trace-policy', () =>
    label(
      'Both runs   /   catalog unchanged   /   v18 read accepted   /   policy receipt missing',
      960,
      260,
      35,
      C.ink,
    ),
  );
  label('Host decision', 400, 373, 34, C.blue);
  label('Dispatch', boundary, 373, 34, C.yellow);
  label('Server', server, 373, 34, C.cyan);
  label('Traffic changes', 1645, 373, 34, C.muted);
  line(boundary, 400, boundary, 790, C.yellow, 3);
  shiftRuns.forEach((run, index) => {
    const y = 500 + index * 230;
    const first = index === 0;
    const endCue = first ? 'fresh-held' : 'fresh-denied';
    const ended = finished(endCue);
    const sent = finished('fresh-sent');
    const p = progress(first ? 'fresh-held' : 'fresh-sent');
    const end = first ? boundary - 72 : server;
    const score = evaluateShift(run);
    const graded = finished(first ? 'fresh-pass' : 't-fresh-tool-attempt');
    target(first ? 'trace-a' : 'trace-b', () => {
      label('Run ' + run.name, 135, y + 14, 45, C.ink, 'left');
      line(325, y, 1335, y, C.muted, 2);
      const x = 325 + (end - 325) * p;
      if (p > 0) line(325, y, x, y, first ? C.blue : C.cyan, 7);
      dot(x, y, first ? C.blue : C.cyan, 13);
      if (first && ended) {
        line(end + 16, y - 20, end + 16, y + 20, C.yellow, 6);
        label('Held here', end - 30, y - 31, 33, C.yellow, 'right');
      }
      if (!first && ended) {
        line(server + 16, y - 20, server + 16, y + 20, C.yellow, 6);
        label('Server denied', server, y - 32, 33, C.yellow);
      }
      if (first ? ended : sent) {
        const count =
          score.sent === 1 ? '1 write request sent' : score.sent + ' write requests sent';
        label(count, 390, y + 75, 32, C.ink, 'left');
      }
      if (ended) label(String(score.effects), 1645, y + 22, 62, C.ink);
      if (graded)
        label(score.passes ? 'Pass' : 'Fail', 170, y + 77, 35, score.passes ? C.green : C.yellow);
    });
    if (started('fresh-reports'))
      target('trace-reports', () =>
        label(
          first ? '“Held for policy.”' : '“The server denied the shift.”',
          1490,
          y + 75,
          29,
          C.muted,
        ),
      );
  });
  target('trace-rule', () => {
    const rule =
      state.beat === 3
        ? 'Test traces  /  follow each proposed write'
        : state.beat === 4
          ? 'Any forbidden attempt fails the run. Which run passes?'
          : 'The event at dispatch decides the score.';
    label(rule, 960, 935, 38, C.ink);
  });
}

function drawHandoff(ctx, state, api) {
  const { C } = api;
  const { label, line, target, started, finished } = filmPainter(ctx, api);
  const read = shiftReads[1];
  if (state.beat === 2) {
    const score = evaluateShift({ events: ['sent'], policyReceipt: 'approved', report: 'unknown' });
    target('counterexample', () => {
      label('Separate test   /   approved write', 170, 287, 36, C.cyan, 'left');
      label('1 write request sent', 170, 410, 47, C.ink, 'left');
      if (started('fresh-lost')) label('Reply missing', 170, 520, 42, C.yellow, 'left');
      label('Traffic changes', 1345, 410, 36, C.muted);
      label(
        finished('fresh-unknown') && score.effects === null ? 'Unknown' : '?',
        1345,
        544,
        70,
        C.ink,
      );
      if (started('fresh-reconcile'))
        label(
          'Reconcile the backend or reuse the bound idempotency key.',
          170,
          730,
          38,
          C.ink,
          'left',
        );
    });
    line(170, 606, 1740, 606, C.muted, 2);
    if (started('fresh-metrics'))
      target('eval-metrics', () =>
        label(
          'Compare completion, refusals, grounding, latency and token use.',
          170,
          824,
          32,
          C.muted,
          'left',
        ),
      );
    if (started('fresh-cases'))
      target('eval-cases', () =>
        label('Vary catalog, caller, reply and process limits.', 170, 902, 32, C.muted, 'left'),
      );
    return;
  }
  label('Next model call', 175, 278, 38, C.muted, 'left');
  target('handoff-read', () => {
    label('Status of ' + read.requested, 175, 390, 46, C.ink, 'left');
    label(read.payload.status, 175, 495, 60, C.green, 'left');
    label(
      read.source + '   /   ' + clockTime(read.observedAt) + '   /   reply ' + read.id,
      175,
      575,
      36,
      C.cyan,
      'left',
    );
  });
  line(175, 641, 1740, 641, C.muted, 2);
  target('handoff-policy', () => {
    label('Traffic shift', 175, 753, 46, C.ink, 'left');
    if (started('fresh-policy'))
      label('On hold   /   policy check timed out', 175, 851, 47, C.yellow, 'left');
  });
}

function drawFreshTool(ctx, scene, state, api) {
  if (state.beat < 2) drawReceipts(ctx, state, api);
  else if (state.beat >= 3 && state.beat <= 5) drawDispatches(ctx, state, api);
  else drawHandoff(ctx, state, api);
}

export default {
  id: 'fresh-tool',
  draw: drawFreshTool,
  cues: [
    'fresh-task',
    'fresh-reply',
    'fresh-target',
    't-fresh-tool-reject',
    'fresh-new-read',
    'fresh-return',
    't-fresh-tool-repair',
    't-fresh-tool-hold',
    'fresh-common',
    'fresh-held',
    'fresh-sent',
    'fresh-denied',
    'fresh-ask',
    'fresh-pass',
    't-fresh-tool-attempt',
    'fresh-lost',
    'fresh-unknown',
    'fresh-reconcile',
    'fresh-metrics',
    'fresh-cases',
    'fresh-reports',
    'fresh-context',
    'fresh-policy',
  ],
};
