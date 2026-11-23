import { phase } from '../arithmetic.mjs';
import { sampleOriginalModel } from '../construction.mjs';
import { legacyCard, legacyText, refinedCard, refinedText } from '../defaults.mjs';
function drawLegacyTimeoutRetry(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleOriginalModel('timeout-retry', state);
  {
    legacyText(
      ctx,
      api,
      'One 20-second budget covers work, backoff, and another attempt',
      960,
      300,
      31,
      themeColors.ink,
      'center',
    );
    const trace = teaching.timeline({
      x: 180,
      y: 375,
      width: 1560,
      height: 370,
      domain: [0, modelState.deadline],
      time: modelState.time,
      lanes: [
        {
          id: 'provider',
          label: 'Provider call',
        },
        {
          id: 'wait',
          label: 'Backoff',
        },
      ],
      intervals: [
        {
          id: 'attempt-1',
          lane: 'provider',
          start: modelState.firstAttempt.start,
          end: modelState.firstAttempt.end,
          label: 'Attempt 1 · 14 s',
          color: themeColors.blue,
        },
        ...(modelState.step > 0
          ? [
              {
                id: 'wait-1',
                lane: 'wait',
                start: modelState.firstAttempt.end,
                end: modelState.secondAttempt.start,
                label: '2.5 s wait',
                color: themeColors.yellow,
              },
            ]
          : []),
        ...(modelState.step > 1
          ? [
              {
                id: 'attempt-2',
                lane: 'provider',
                start: modelState.secondAttempt.start,
                end: modelState.secondAttempt.end,
                label: 'Attempt 2 · 3 s',
                color: themeColors.green,
              },
            ]
          : []),
      ],
      ticks: [0, 5, 10, 15, 20],
      formatTime: (value) => value.toFixed(0) + ' s',
      fontSize: 23,
    });
    const remaining = modelState.deadline - trace.time;
    teaching.changeCue(
      {
        x: 232,
        y: 802,
        width: 616,
        height: 102,
        from: modelState.step === 0 ? 0 : modelState.step === 1 ? 14 : 16.5,
        to: modelState.time,
        progress: 1,
        color: themeColors.cyan,
        emphasis: 0.3,
      },
      () =>
        api.focus.target('retry-clock', () =>
          legacyCard(
            ctx,
            api,
            'Current time · ' + trace.time.toFixed(1) + ' s',
            240,
            810,
            600,
            86,
            themeColors.cyan,
            27,
          ),
        ),
    );
    api.focus.target('retry-budget', () =>
      legacyCard(
        ctx,
        api,
        'Budget remaining · ' + remaining.toFixed(1) + ' s',
        1080,
        810,
        600,
        86,
        themeColors.yellow,
        27,
      ),
    );
    if (modelState.shortComparison)
      legacyText(
        ctx,
        api,
        'Separate short-budget case: 1.2 s < required 2 s → stop',
        960,
        960,
        27,
        themeColors.pink,
        'center',
      );
    else void 0;
  }
}
export function drawTimeoutRetry(ctx, scene, state, api) {
  if (!state.cues) {
    drawLegacyTimeoutRetry(ctx, scene, state, api);
    return;
  }
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat,
    u = api.focus.progress('ap-timeout-retry-' + currentBeat),
    done = u >= 0.999999;
  {
    const short = currentBeat === 2 && u > 0.58;
    if (short) {
      refinedText(
        ctx,
        api,
        'Separate short-budget case · duration comparison',
        960,
        325,
        32,
        themeColors.yellow,
        'center',
      );
      const left = 320,
        scale = 550;
      api.rect(ctx, left, 460, 1.2 * scale, 100, themeColors.blue);
      api.rect(ctx, left, 650, 2 * scale, 100, themeColors.pink);
      refinedText(ctx, api, 'remaining 1.2 s', left, 425, 30, themeColors.blue);
      refinedText(ctx, api, 'required wait 2 s', left, 615, 30, themeColors.pink);
      api.line(ctx, left + 1.2 * scale, 450, left + 1.2 * scale, 770, themeColors.yellow, 3);
      refinedText(ctx, api, '0', left, 805, 26, themeColors.muted);
      refinedText(ctx, api, '2.5 s', left + 2.5 * scale, 805, 26, themeColors.muted, 'right');
      api.focus.target('retry-clock', () =>
        refinedCard(
          ctx,
          api,
          'Short case · remaining 1.2 s',
          250,
          840,
          660,
          90,
          themeColors.blue,
          29,
        ),
      );
      api.focus.target('retry-budget', () =>
        refinedCard(
          ctx,
          api,
          done ? '2 s cannot fit → STOP' : 'required wait exceeds available',
          1010,
          840,
          660,
          90,
          themeColors.pink,
          29,
        ),
      );
    } else {
      const time =
        currentBeat === 0
          ? 14 * u
          : currentBeat === 1
            ? 14 + 2.5 * u
            : 16.5 + 3 * phase(u, 0, 0.55);
      teaching.timeline({
        x: 180,
        y: 390,
        width: 1560,
        height: 350,
        domain: [0, 20],
        time,
        lanes: [
          {
            id: 'work',
            label: 'Provider',
          },
          {
            id: 'wait',
            label: 'Backoff',
          },
        ],
        intervals: [
          {
            id: 'a',
            lane: 'work',
            start: 0,
            end: 14,
            label: 'Attempt 1 · 14 s',
            color: themeColors.blue,
          },
          ...(currentBeat >= 1
            ? [
                {
                  id: 'w',
                  lane: 'wait',
                  start: 14,
                  end: 16.5,
                  label: '2 + 0.5 s',
                  color: themeColors.yellow,
                },
              ]
            : []),
          ...(currentBeat >= 2
            ? [
                {
                  id: 'b',
                  lane: 'work',
                  start: 16.5,
                  end: 19.5,
                  label: 'Attempt 2 · 3 s',
                  color: themeColors.green,
                },
              ]
            : []),
        ],
        ticks: [0, 5, 10, 15, 20],
        fontSize: 23,
      });
      api.focus.target('retry-clock', () =>
        refinedCard(
          ctx,
          api,
          'Clock ' + time.toFixed(1) + ' s',
          250,
          850,
          650,
          90,
          themeColors.cyan,
          30,
        ),
      );
      api.focus.target('retry-budget', () =>
        refinedCard(
          ctx,
          api,
          'Remaining ' + (20 - time).toFixed(1) + ' s',
          1020,
          850,
          650,
          90,
          themeColors.yellow,
          30,
        ),
      );
    }
  }
}
export default {
  id: 'timeout-retry',
  draw: drawTimeoutRetry,
  cues: [
    'retry-budget-b1-1',
    'ap-timeout-retry-0',
    'retry-clock-b2-1',
    'ap-timeout-retry-1',
    'retry-clock-b3-1',
    'ap-timeout-retry-2',
  ],
};
