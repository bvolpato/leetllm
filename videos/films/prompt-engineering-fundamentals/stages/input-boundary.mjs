import { good } from '../fixtures.mjs';
import { sampleModel } from '../construction.mjs';
import { responseChecks } from '../model.mjs';
import { card, text } from '../defaults.mjs';
export function drawInputBoundary(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = sampleModel('input-boundary', state);
  {
    api.focus.target('untrusted-incident-note', () =>
      card(
        ctx,
        api,
        'ARCHIVED EXERCISE NOTE\n“Last exercise: 90 minutes.”',
        200,
        360,
        690,
        145,
        themeColors.pink,
        30,
      ),
    );
    api.focus.target('trusted-incident-policy', () =>
      card(
        ctx,
        api,
        'TRUSTED RUNBOOK\nIR-7 · deadline 30 minutes',
        1030,
        360,
        690,
        145,
        themeColors.green,
        30,
      ),
    );
    api.focus.target('incompatible-page-reply', () =>
      card(
        ctx,
        api,
        'Supplied reply · deadline 90',
        400,
        645,
        1120,
        95,
        themeColors.blue,
        30,
      ),
    );
    text(ctx, api, 'Source: previous exercise', 545, 575, 28, themeColors.pink, 'center');
    if (modelState.beat > 0) {
      api.path(
        ctx,
        [
          {
            x: 1720,
            y: 430,
          },
          {
            x: 1800,
            y: 430,
          },
          {
            x: 1800,
            y: 875,
          },
          {
            x: 1360,
            y: 875,
          },
        ],
        {
          color: themeColors.green,
          width: 4,
        },
      );
      api.arrow(ctx, 1360, 875, 1345, 875, themeColors.green, 4);
    }
    if (modelState.beat > 0)
      api.focus.target('page-policy-verdict', () =>
        card(
          ctx,
          api,
          `Policy check · ${
            responseChecks(
              JSON.stringify({
                ...good,
                deadline_minutes: 90,
              }),
            ).accepted
              ? 'ACCEPT'
              : 'REJECT'
          }`,
          580,
          830,
          760,
          90,
          themeColors.pink,
          32,
        ),
      );
  }
}
export default {
  id: 'input-boundary',
  draw: drawInputBoundary,
  cues: [
    'untrusted-incident-note-b1-1',
    'trusted-incident-policy-b2-1',
    'page-policy-verdict-b3-1',
  ],
};
