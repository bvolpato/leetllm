import { betaDensity } from '../arithmetic.mjs';
import { clauseEnded, event } from '../construction.mjs';
import { areaFill, caption, chart, curve, target, text } from '../defaults.mjs';
import { lastEvaluation, releasePolicy } from '../fixtures.mjs';
import { lastTaskCases } from '../model.mjs';
import { massRuler, percent } from '../release-scale.mjs';

const { rateCutoff, requiredMass } = releasePolicy;

export function drawLastTask(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const firstTasks = lastEvaluation.passes + lastEvaluation.failures;
  const replay = beat >= 3;
  const premise = clauseEnded(state, 0, 'last-task-premise', 0.42);
  const received = replay
    ? clauseEnded(state, 3, 'last-task-fail', 0.42)
    : clauseEnded(state, 1, 'last-task-pass', 0.19);
  const updated = replay
    ? clauseEnded(state, 3, 'add-last-failure', 0.5)
    : clauseEnded(state, 1, 'add-last-pass', 0.32);
  const measured = replay
    ? event(state, 3, 'measure-failure', 0.5, 0.75)
    : event(state, 1, 'measure-pass', 0.32, 0.67);
  const verdict = replay
    ? clauseEnded(state, 4, 'failure-decision', 0.21)
    : clauseEnded(state, 2, 'pass-decision', 0.24);
  const original = lastTaskCases.sealed;
  const result = updated ? (replay ? lastTaskCases.fail : lastTaskCases.pass) : original;
  const color = received ? (replay ? C.red : C.green) : C.muted;

  target(ctx, api, 'last-evaluation', () => {
    text(ctx, api, firstTasks + 1 + ' planned tasks', 148, 297, 40, C.ink);
    text(
      ctx,
      api,
      premise
        ? 'First twenty: ' +
            lastEvaluation.passes +
            ' passes, ' +
            lastEvaluation.failures +
            ' failures'
        : 'First twenty results',
      148,
      360,
      32,
      C.ink,
    );
  });
  target(ctx, api, 'last-result', () => {
    api.components.card({
      x: 740,
      y: 249,
      width: 365,
      height: 106,
      label: firstTasks + 1 + '   ' + (received ? (replay ? 'FAIL' : 'PASS') : 'SEALED'),
      fill: C.panel,
      stroke: color,
      textColor: color,
      fontSize: 40,
    });
  });

  const q = chart(ctx, api, {
    x: 148,
    y: 470,
    width: 960,
    height: 355,
    max: 6,
    xLabel: 'success rate on the intended traffic',
    ticks: [0, 0.25, 0.5, 0.7, 1],
  });
  const bottom = q.point(rateCutoff, 0),
    top = q.point(rateCutoff, 6);
  api.line(ctx, bottom.x, bottom.y, top.x, top.y, C.yellow, 3);
  text(
    ctx,
    api,
    Math.round(100 * rateCutoff) + '% cutoff',
    top.x - 16,
    top.y + 37,
    27,
    C.yellow,
    'right',
  );
  if (premise) {
    target(ctx, api, 'last-density', () => {
      if (updated) curve(ctx, api, q, original.a, original.b, C.muted + '90', 3);
      curve(ctx, api, q, result.a, result.b, C.blue, 5);
      const sweep = updated ? measured : 1;
      areaFill(
        ctx,
        api,
        q,
        (p) => betaDensity(result.a, result.b, p),
        rateCutoff,
        rateCutoff + (1 - rateCutoff) * sweep,
        C.blue,
        '55',
      );
    });
    target(ctx, api, 'last-parameters', () => {
      const a = received && !updated && !replay ? original.a + ' + 1' : result.a;
      const b = received && !updated && replay ? original.b + ' + 1' : result.b;
      text(ctx, api, 'Beta(' + a + ', ' + b + ')', 148, 951, 34, C.blue);
      if (!received || updated)
        text(
          ctx,
          api,
          'Mean rate ' + percent(result.a / (result.a + result.b)),
          445,
          951,
          30,
          C.ink,
        );
    });
    if (updated) text(ctx, api, 'Gray curve: first twenty', 1108, 951, 26, C.muted, 'right');
  }
  target(ctx, api, 'last-measurement', () => {
    text(ctx, api, 'Probability above the cutoff', 1210, 355, 36, C.ink);
    const mass = premise && (!updated || measured >= 1) ? result.tail : null;
    text(ctx, api, mass == null ? '?' : percent(mass), 1500, 515, 82, C.blue, 'center');
    massRuler(ctx, api, {
      x: 1190,
      y: 665,
      width: 615,
      mass,
      low: 0.85,
      reference: updated ? original.tail : null,
    });
  });
  target(ctx, api, 'last-decision', () => {
    const decision = result.tail >= requiredMass ? 'Increase traffic' : 'Hold traffic';
    text(
      ctx,
      api,
      verdict ? decision : 'Release decision pending',
      1500,
      881,
      verdict ? 46 : 32,
      verdict ? C.ink : C.muted,
      'center',
    );
  });
  if (replay && verdict) {
    text(
      ctx,
      api,
      'With a pass   ' + percent(lastTaskCases.pass.tail),
      1330,
      975,
      30,
      C.green,
      'center',
    );
    text(
      ctx,
      api,
      'With a failure   ' + percent(lastTaskCases.fail.tail),
      1655,
      975,
      30,
      C.red,
      'center',
    );
  } else {
    caption(
      ctx,
      api,
      replay
        ? 'Replay of task 21   ·   the first twenty results and the release rule stay fixed'
        : 'Fresh representative evaluation   ·   Beta(2,2) prior   ·   decision at the planned sample size',
    );
  }
}

export default {
  id: 'last-task',
  draw: drawLastTask,
  cues: [
    'last-task-premise',
    'last-task-pass',
    'add-last-pass',
    'measure-pass',
    'pass-decision',
    'last-task-fail',
    'add-last-failure',
    'measure-failure',
    'failure-decision',
  ],
};
