import { eligibilityFrame } from '../construction.mjs';
import { answerFromEvidence, requestPath } from '../model.mjs';
import { drawText, equation, recordCard } from '../defaults.mjs';
export function drawAnswerFromEvidence(ctx, scene, state, api) {
  const { C: themeColors, components: components, phase } = api;
  const beat = state.beat ?? 0,
    progress2 = state.beatP ?? 0,
    q = phase(progress2, 0.04, 0.92);
  {
    const run = requestPath(),
      frame = eligibilityFrame(beat, progress2);
    frame.ageProgress = api.focus.progress('outside-window', frame.ageProgress);
    frame.staleDays = 10 + Math.round(5 * frame.ageProgress);
    frame.agePass = frame.staleDays <= 14;
    if (state.cues?.['typed-values'])
      frame.requestVisible = frame.signalVisible = api.focus.visible('typed-values');
    if (state.cues?.['check-limits'])
      frame.ageChecked = frame.signalChecked = api.focus.visible('check-limits');
    const resultCue = frame.unsupported ? 'abstain' : 'cite-current';
    if (state.cues?.[resultCue]) frame.outcomeVisible = api.focus.visible(resultCue);
    api.focus.target('evidence-source', () =>
      drawText(
        ctx,
        api,
        'Luna · EU · support:eu · E1 = eu-access-v2 · current',
        960,
        270,
        28,
        themeColors.cyan,
        'center',
      ),
    );
    components.panel({
      x: 120,
      y: 350,
      width: 720,
      height: 200,
      fill: themeColors.panel,
      stroke: themeColors.cyan,
    });
    drawText(ctx, api, 'Packed current rule · E1', 480, 397, 31, themeColors.cyan, 'center');
    api.focus.target('age-rule', () =>
      drawText(ctx, api, 'Stale key age ≤ 14 days', 480, 459, 30, themeColors.ink, 'center'),
    );
    api.focus.target('signal-rule', () =>
      drawText(ctx, api, 'Risk signal age ≤ 48 hours', 480, 518, 30, themeColors.ink, 'center'),
    );
    components.panel({
      x: 1080,
      y: 350,
      width: 720,
      height: 200,
      fill: themeColors.panel,
      stroke: frame.unsupported ? themeColors.pink : themeColors.blue,
    });
    api.focus.target('request-intent', () =>
      drawText(
        ctx,
        api,
        frame.unsupported
          ? 'Typed intent: approve a sandbox'
          : 'Typed intent: rotation eligibility',
        1440,
        397,
        29,
        frame.unsupported ? themeColors.pink : themeColors.blue,
        'center',
      ),
    );
    if (frame.requestVisible && !frame.unsupported)
      api.focus.target('requested-age', () =>
        api.teaching.changeCue(
          {
            x: 1100,
            y: 420,
            width: 680,
            height: 60,
            from: 10,
            to: frame.staleDays,
            progress: 1,
            emphasis: frame.ageProgress > 0 && frame.ageProgress < 1 ? 0.8 : 0,
            color: themeColors.yellow,
            restColor: themeColors.ink,
          },
          (cue) =>
            drawText(
              ctx,
              api,
              'Stale key: ' + cue.value.toFixed(0) + ' days',
              1440,
              463,
              30,
              cue.color,
              'center',
            ),
        ),
      );
    if (frame.signalVisible && !frame.unsupported)
      api.focus.target('requested-signal', () =>
        drawText(ctx, api, 'Risk signal: 48 hours', 1440, 518, 30, themeColors.ink, 'center'),
      );
    if (frame.unsupported) {
      api.focus.target('missing-values', () =>
        drawText(
          ctx,
          api,
          'Required rotation values absent',
          1440,
          459,
          29,
          themeColors.pink,
          'center',
        ),
      );
      api.focus.target('missing-values', () =>
        drawText(
          ctx,
          api,
          'Permitted evidence: none for this intent',
          1440,
          518,
          27,
          themeColors.pink,
          'center',
        ),
      );
      drawText(
        ctx,
        api,
        'Intent and evidence checks reject this requested claim',
        960,
        665,
        33,
        themeColors.pink,
        'center',
      );
    } else {
      if (frame.ageChecked)
        api.focus.target('age-comparison', () =>
          equation(
            ctx,
            api,
            String.raw`${frame.staleDays}${frame.agePass ? '\\le' : '>'}14\quad\text{${frame.agePass ? 'within limit' : 'outside limit'}}`,
            480,
            665,
            43,
            frame.agePass ? themeColors.green : themeColors.pink,
          ),
        );
      else
        api.focus.target('age-comparison', () =>
          drawText(
            ctx,
            api,
            'Stale-age comparison pending',
            480,
            665,
            30,
            themeColors.muted,
            'center',
          ),
        );
      if (frame.signalChecked)
        api.focus.target('signal-comparison', () =>
          equation(ctx, api, String.raw`48\le48\quad\text{pass}`, 1440, 665, 43, themeColors.green),
        );
      else
        api.focus.target('signal-comparison', () =>
          drawText(
            ctx,
            api,
            'Signal-age comparison pending',
            1440,
            665,
            30,
            themeColors.muted,
            'center',
          ),
        );
    }
    if (!frame.unsupported && frame.requestVisible) {
      api.line(ctx, 160, 740, 960, 740, themeColors.muted, 3);
      api.line(ctx, 720, 705, 720, 775, themeColors.pink, 5);
      drawText(ctx, api, '14 d limit', 720, 805, 25, themeColors.pink, 'center');
      api.focus.target('requested-age', () => {
        api.circle(
          ctx,
          160 + frame.staleDays * 40,
          740,
          14,
          frame.agePass ? themeColors.yellow : themeColors.pink,
        );
        drawText(
          ctx,
          api,
          frame.staleDays + ' d',
          160 + frame.staleDays * 40,
          705,
          26,
          frame.agePass ? themeColors.yellow : themeColors.pink,
          'center',
        );
      });
    }
    if (frame.outcomeVisible) {
      const request = frame.unsupported
          ? {
              intent: 'sandbox_approval',
            }
          : {
              intent: 'rotation_eligibility',
              staleDays: frame.staleDays,
              signalHours: frame.signalHours,
            },
        result = answerFromEvidence(request, frame.unsupported ? [] : run.packed),
        color =
          result.decision === 'eligible'
            ? themeColors.green
            : result.decision === 'ineligible'
              ? themeColors.yellow
              : themeColors.pink;
      api.focus.target('answer-result', () =>
        recordCard(
          ctx,
          api,
          result.decision === 'abstain'
            ? 'Abstain · no citation'
            : result.decision + ' · cite ' + result.cited[0],
          530,
          865,
          860,
          color,
          105,
          33,
        ),
      );
    }
  }
}
export default {
  id: 'answer-from-evidence',
  draw: drawAnswerFromEvidence,
  cues: [
    'age-limit',
    'signal-limit',
    'typed-values',
    'check-limits',
    'cite-current',
    'outside-window',
    'unsupported-input',
    'abstain',
    'exact-support',
  ],
};
