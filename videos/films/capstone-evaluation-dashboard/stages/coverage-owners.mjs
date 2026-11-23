import { dashboardClamp, dashboardCue, dashboardStarted } from '../arithmetic.mjs';
import { plan } from '../fixtures.mjs';
import {
  dashboardBox,
  dashboardCell,
  dashboardLine,
  dashboardNote,
  dashboardText,
} from '../defaults.mjs';
export function drawCoverageOwners(ctx, scene, state, api) {
  const beat = state.beat ?? 0,
    progress2 = dashboardClamp(state.beatP ?? 0),
    q = progress2 * progress2 * (3 - 2 * progress2);
  const { C: themeColors, components: components } = api;
  api.focus.target('coverage-owners-mechanism', () => {
    if (beat === 0) {
      dashboardText(
        ctx,
        api,
        'Disjoint authored plan · one common case-count scale',
        960,
        280,
        35,
        themeColors.blue,
        'center',
      );
      dashboardText(ctx, api, 'OBSERVED', 1440, 355, 25, themeColors.cyan, 'center');
      dashboardText(ctx, api, 'ADD', 1630, 355, 25, themeColors.blue, 'center');
      plan.forEach(([name, total, observed, cue], i) => {
        const y = 405 + i * 105,
          progress = dashboardCue(state, cue, q);
        dashboardText(ctx, api, name, 200, y + 40, 28, themeColors.ink);
        dashboardBox(ctx, api, 655, y, 640, 58, themeColors.muted);
        if (observed > 0)
          components.panel({
            x: 655,
            y,
            width: (640 * observed) / 30,
            height: 58,
            fill: themeColors.cyan,
            stroke: themeColors.cyan,
            radius: 0,
          });
        if (progress > 0)
          components.panel({
            x: 655 + (640 * observed) / 30,
            y,
            width: Math.max(2, ((640 * (total - observed)) / 30) * progress),
            height: 58,
            fill: themeColors.blue,
            stroke: themeColors.blue,
            radius: 0,
          });
        dashboardText(ctx, api, observed, 1440, y + 40, 31, themeColors.cyan, 'center');
        if (progress >= 1)
          dashboardText(ctx, api, total - observed, 1630, y + 40, 31, themeColors.blue, 'center');
      });
      if (dashboardStarted(state, 'coverage-owners-step-1', progress2 > 0.8))
        dashboardText(
          ctx,
          api,
          '4 retained + 106 additions = 110 unique cases',
          960,
          975,
          36,
          themeColors.yellow,
          'center',
        );
      dashboardNote(
        ctx,
        api,
        'These targets describe planned scope; representative sampling and operational budgets still require review.',
      );
    } else if (beat === 1) {
      dashboardText(
        ctx,
        api,
        'Proposed work assignments · retain examples and sources',
        960,
        280,
        35,
        themeColors.blue,
        'center',
      );
      const tasks = [
        ['Policy', 'supported clause + regional effective date', 'policy-US-v3 / date boundary'],
        ['Retrieval', 'reviewed rewording', 'same intent, changed surface form'],
        ['Support', 'unsupported question', 'missing privileged-scope rule'],
        ['Security + Policy', 'untrusted instruction', 'request cites an unreviewed draft'],
      ];
      tasks.forEach(([owner, task, example], i) => {
        const y = 365 + i * 140;
        dashboardCell(ctx, api, owner, 200, y, 350, 105, themeColors.cyan, 30);
        dashboardLine(ctx, api, 565, y + 53, 650, y + 53, themeColors.blue, 4);
        dashboardCell(ctx, api, task + '\n' + example, 675, y, 1050, 105, themeColors.blue, 27);
      });
      dashboardNote(
        ctx,
        api,
        'Proposed roles in this teaching plan · each item retains its reviewed label, source snapshot and stable fixture ID.',
      );
    } else {
      const left = ['A', 'B', 'C', 'D'],
        right = ['C', 'D', 'E', 'F'],
        union = [...new Set([...left, ...right])];
      dashboardText(
        ctx,
        api,
        'Overlapping slices cannot be summed as unique fixtures',
        960,
        280,
        35,
        themeColors.blue,
        'center',
      );
      left.forEach((id, i) =>
        dashboardCell(ctx, api, id, 230 + i * 170, 400, 130, 100, themeColors.cyan, 35),
      );
      right.forEach((id, i) =>
        dashboardCell(
          ctx,
          api,
          id,
          1040 + i * 170,
          400,
          130,
          100,
          id === 'C' || id === 'D' ? themeColors.yellow : themeColors.blue,
          35,
        ),
      );
      dashboardText(ctx, api, 'Slice 1: 4 memberships', 575, 585, 32, themeColors.cyan, 'center');
      dashboardText(ctx, api, 'Slice 2: 4 memberships', 1385, 585, 32, themeColors.blue, 'center');
      const count = Math.min(union.length, Math.floor(q * (union.length + 1)));
      union
        .slice(0, count)
        .forEach((id, i) =>
          dashboardCell(
            ctx,
            api,
            id,
            355 + i * 205,
            730,
            155,
            100,
            id === 'C' || id === 'D' ? themeColors.yellow : themeColors.cyan,
            35,
          ),
        );
      if (count === union.length)
        dashboardText(
          ctx,
          api,
          '4 + 4 − 2 overlapping IDs = 6 unique fixtures',
          960,
          940,
          37,
          themeColors.yellow,
          'center',
        );
      dashboardNote(
        ctx,
        api,
        'Membership is not independent evidence. Plan coverage and sampling separately from display counts.',
      );
    }
  });
}
export default {
  id: 'coverage-owners',
  draw: drawCoverageOwners,
  cues: [
    'coverage-owners-step-1',
    'owner-policy',
    'owner-paraphrase',
    'owner-boundaries',
    'owner-region',
    'coverage-owners-step-2',
    'coverage-owners-step-3',
  ],
};
