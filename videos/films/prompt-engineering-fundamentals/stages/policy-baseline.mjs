import { facts } from '../fixtures.mjs';
import { triageDecision } from '../model.mjs';
import { card, text } from '../defaults.mjs';
export function drawPolicyBaseline(ctx, scene, state, api) {
  const { C: themeColors, teaching } = api;
  const beat = state.beat ?? 0;
  {
    if (beat === 2) {
      const remove = api.focus.progress('pf-missing-policy'),
        missing = remove >= 0.999;
      api.focus.target('page-deadline', () =>
        card(
          ctx,
          api,
          missing ? 'Applicable IR-7: missing' : 'IR-7: deadline 30',
          260,
          350 + 180 * remove,
          680,
          110,
          missing ? themeColors.muted : themeColors.green,
          32,
        ),
      );
      card(
        ctx,
        api,
        'Same incident · elapsed 31\nPage status: false',
        1050,
        350,
        680,
        150,
        themeColors.blue,
        31,
      );
      if (missing) {
        card(
          ctx,
          api,
          'needs_review\ndeadline null · overdue null\nsource IDs []',
          1050,
          650,
          680,
          230,
          themeColors.yellow,
          33,
        );
        text(
          ctx,
          api,
          'The previous rule is outside the current input facts',
          960,
          1010,
          30,
          themeColors.muted,
          'center',
        );
      } else
        text(
          ctx,
          api,
          'Remove one required fact before computing a new reference answer',
          960,
          1010,
          30,
          themeColors.yellow,
          'center',
        );
      return;
    }
    text(
      ctx,
      api,
      'P1 declared · no prior page · trusted rule IR-7',
      960,
      305,
      28,
      themeColors.muted,
      'center',
    );
    const plot = teaching.axes({
      x: 270,
      y: 425,
      width: 1300,
      height: 270,
      xDomain: [0, 40],
      yDomain: [0, 1],
      xTicks: [0, 10, 20, 30, 40],
      yTicks: [],
      xLabel: 'minutes since P1 declaration',
      yLabel: '',
      fontSize: 25,
    });
    const travel = beat === 1 ? api.focus.progress('clock-to-limit', state.beatP) : 0;
    const pastLimit = beat === 1 && api.focus.progress('page-overdue-state-b2-1') > 0;
    const elapsed = pastLimit
      ? facts.deadline + 1
      : facts.elapsed + Math.floor((facts.deadline - facts.elapsed) * travel);
    const decision = triageDecision({ ...facts, elapsed });
    const boundary = plot.point(facts.deadline, 0),
      point = plot.point(elapsed, 0.5);
    api.focus.target('page-deadline', () =>
      api.line(ctx, boundary.x, 420, boundary.x, 695, themeColors.pink, 4),
    );
    text(ctx, api, 'deadline 30', boundary.x, 390, 27, themeColors.pink, 'center');
    api.focus.target('incident-clock', () =>
      api.circle(
        ctx,
        point.x,
        point.y,
        17,
        decision.overdue ? themeColors.pink : themeColors.green,
      ),
    );
    text(ctx, api, `elapsed ${elapsed}`, point.x, 350, 27, themeColors.yellow, 'center');
    api.focus.target('remaining-page-time', () =>
      card(
        ctx,
        api,
        `Remaining · ${decision.remaining} min`,
        280,
        830,
        600,
        90,
        themeColors.blue,
        30,
      ),
    );
    api.focus.target('page-overdue-state', () =>
      card(
        ctx,
        api,
        `Overdue · ${decision.overdue}`,
        1040,
        830,
        600,
        90,
        decision.overdue ? themeColors.pink : themeColors.green,
        30,
      ),
    );
    text(
      ctx,
      api,
      'Compare elapsed minutes with the first-page limit',
      960,
      1020,
      28,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'policy-baseline',
  draw: drawPolicyBaseline,
  cues: [
    'remaining-page-time-b1-1',
    'clock-to-limit',
    'page-overdue-state-b2-1',
    'page-deadline-b3-1',
    'pf-missing-policy',
  ],
};
