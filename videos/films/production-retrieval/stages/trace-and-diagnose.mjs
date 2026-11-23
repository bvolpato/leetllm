import { EVAL_DATE, PARENTS, ROTATION_RULE } from '../fixtures.mjs';
import { answerFromEvidence, packParents, requestPath } from '../model.mjs';
import { drawText, footer, paragraph, recordCard } from '../defaults.mjs';
export function drawTraceAndDiagnose(ctx, scene, state, api) {
  const { C: themeColors, components: components, phase } = api;
  const beat = state.beat ?? 0,
    progress2 = state.beatP ?? 0,
    q = phase(progress2, 0.04, 0.92);
  {
    const run = requestPath(),
      wrongVersion = {
        ...PARENTS['eu-access-v2'],
        version: 'eu-access/2025-01-01',
      },
      blockedParent = packParents(run.hits, run.caller, EVAL_DATE, 400, {
        ...PARENTS,
        'eu-access-v2': wrongVersion,
      }),
      probe = answerFromEvidence(
        {
          intent: 'rotation_eligibility',
          staleDays: 10,
          signalHours: 48,
        },
        blockedParent,
      );
    api.focus.target('source-version', () =>
      drawText(
        ctx,
        api,
        'Request luna-48291 · index/42 · child eu-key-v2',
        960,
        290,
        30,
        themeColors.cyan,
        'center',
      ),
    );
    const stages = [
      ['Caller scope', 'EU · support:eu', themeColors.blue],
      ['Candidates', 'eu-key-v2 · eu-session-v1', themeColors.cyan],
      ['Parent check', 'Expected revision: 2026-04-01', themeColors.yellow],
      ['Decision', 'Current rule → eligible · E1', themeColors.green],
    ];
    api.focus.target('request-trace', () =>
      stages.forEach(([name, value, color], i) => {
        const x = 120 + i * 450;
        components.panel({
          x,
          y: 390,
          width: 410,
          height: 140,
          fill: themeColors.panel,
          stroke: color,
        });
        drawText(ctx, api, name, x + 205, 435, 28, color, 'center');
        paragraph(ctx, api, value, x + 20, 485, 375, 23);
      }),
    );
    if (beat === 0) {
      const progress = api.focus.progress('trace-request', q);
      const x = 160 + 1550 * progress;
      api.focus.target('request-trace', () =>
        recordCard(ctx, api, 'eu-key-v2 · rev Apr 1', x - 150, 650, 300, themeColors.cyan, 95, 23),
      );
      drawText(
        ctx,
        api,
        'Owned record ID and revision stay attached while the trace is assembled',
        960,
        850,
        29,
        themeColors.muted,
        'center',
      );
    } else if (beat === 1) {
      const progress = api.focus.progress('parent-miss', q),
        x = api.lerp(580, 1020, progress);
      api.focus.target('request-trace', () =>
        recordCard(ctx, api, 'eu-key-v2 · Apr 1', x - 170, 650, 340, themeColors.cyan, 95, 25),
      );
      api.focus.target('mismatch-result', () => {
        drawText(
          ctx,
          api,
          'Separate mismatch probe: parent returns 2025-01-01',
          960,
          830,
          31,
          themeColors.pink,
          'center',
        );
        if (progress === 1) {
          api.line(ctx, 1220, 625, 1220, 775, themeColors.pink, 7);
          drawText(
            ctx,
            api,
            'Revision mismatch → key parent blocked → ' + probe.decision,
            960,
            925,
            32,
            themeColors.pink,
            'center',
          );
        }
      });
    } else {
      api.focus.target('request-trace', () => {
        components.panel({
          x: 120,
          y: 625,
          width: 800,
          height: 300,
          fill: themeColors.panel,
          stroke: themeColors.cyan,
        });
        drawText(ctx, api, 'Replay exact admitted context · E1', 150, 680, 29, themeColors.cyan);
        paragraph(ctx, api, ROTATION_RULE, 150, 740, 740, 27);
      });
      recordCard(
        ctx,
        api,
        'Candidate invents “30 days”\nClaim check compares with 14',
        1080,
        680,
        700,
        themeColors.pink,
        185,
        29,
      );
    }
    footer(
      ctx,
      api,
      'Request ID, bundle, candidates, parent revision and stage timings remain inspectable',
    );
  }
}
export default {
  id: 'trace-and-diagnose',
  draw: drawTraceAndDiagnose,
  cues: ['trace-request', 'candidate-miss', 'parent-miss', 'replay-context'],
};
