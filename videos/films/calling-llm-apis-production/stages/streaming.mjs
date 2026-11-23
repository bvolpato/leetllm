import { phase } from '../arithmetic.mjs';
import { sampleOriginalModel } from '../construction.mjs';
import { legacyCard, legacyText, refinedCard, refinedText } from '../defaults.mjs';
function drawLegacyStreaming(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleOriginalModel('streaming', state);
  {
    legacyText(
      ctx,
      api,
      'Metadata can arrive before any user-visible text',
      960,
      300,
      31,
      themeColors.ink,
      'center',
    );
    const timeline = teaching.timeline({
      x: 170,
      y: 385,
      width: 1580,
      height: 320,
      domain: [0, 5],
      time: modelState.now,
      lanes: [
        {
          id: 'stream',
          label: 'Response stream',
        },
        {
          id: 'decision',
          label: 'Application gate',
        },
      ],
      intervals: [
        {
          id: 'metadata',
          lane: 'stream',
          start: 0,
          end: 0.5,
          label: 'metadata',
          color: themeColors.muted,
        },
        {
          id: 'text-first',
          lane: 'stream',
          start: 3,
          end: 3.5,
          label: 'first text',
          color: themeColors.blue,
        },
        {
          id: 'text-rest',
          lane: 'stream',
          start: 3.5,
          end: 4.5,
          label: 'text deltas',
          color: themeColors.cyan,
        },
        {
          id: 'terminal',
          lane: 'stream',
          start: 4.5,
          end: 5,
          label: 'completed',
          color: themeColors.green,
        },
      ],
      ticks: [0, 1, 2, 3, 4, 5],
      formatTime: (value) => value.toFixed(0) + ' s',
      labelWidth: 225,
      fontSize: 22,
    });
    const bufferText = modelState.buffer || 'waiting for first visible text';
    api.focus.target('streamed-api-draft', () =>
      legacyCard(
        ctx,
        api,
        bufferText,
        260,
        770,
        1400,
        105,
        modelState.terminal ? themeColors.green : themeColors.blue,
        28,
      ),
    );
    api.focus.target('streaming-timing', () =>
      legacyText(
        ctx,
        api,
        'TTFT ' +
          modelState.ttftSeconds.toFixed(1) +
          ' s · total ' +
          modelState.totalSeconds.toFixed(1) +
          ' s · terminal=' +
          modelState.terminal,
        960,
        925,
        27,
        themeColors.yellow,
        'center',
      ),
    );
    legacyText(
      ctx,
      api,
      modelState.readyForValidation
        ? 'Complete output can enter schema and policy validation'
        : 'Partial text stays provisional',
      960,
      1010,
      27,
      themeColors.muted,
      'center',
    );
    void timeline;
  }
}
export function drawStreaming(ctx, scene, state, api) {
  if (!state.cues) {
    drawLegacyStreaming(ctx, scene, state, api);
    return;
  }
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat,
    u = api.focus.progress('ap-streaming-' + currentBeat),
    done = u >= 0.999999;
  {
    const now = currentBeat === 0 ? 3 * u : currentBeat === 1 ? 3 + 1.9 * u : 5;
    teaching.timeline({
      x: 190,
      y: 375,
      width: 1540,
      height: 310,
      domain: [0, 5],
      time: now,
      lanes: [
        {
          id: 'stream',
          label: 'Stream',
        },
        {
          id: 'gate',
          label: 'Validation',
        },
      ],
      intervals: [
        {
          id: 'meta',
          lane: 'stream',
          start: 0,
          end: 0.5,
          label: 'metadata',
          color: themeColors.muted,
        },
        {
          id: 'txt',
          lane: 'stream',
          start: 3,
          end: 4.8,
          label: 'text deltas',
          color: themeColors.blue,
        },
        ...(currentBeat === 2
          ? [
              {
                id: 'end',
                lane: 'stream',
                start: 4.8,
                end: 5,
                label: 'end',
                color: themeColors.green,
              },
            ]
          : []),
      ],
      ticks: [0, 1, 2, 3, 4, 5],
      fontSize: 22,
    });
    const chunks = ['Account ', 'acct_10234 ', 'is eligible ', 'under P-7.'];
    const draft =
      currentBeat === 0
        ? 'waiting for text'
        : currentBeat === 1
          ? chunks.slice(0, Math.min(4, 1 + Math.floor((now - 3) / 0.475))).join('')
          : 'complete candidate';
    api.focus.target('streamed-api-draft', () =>
      refinedCard(
        ctx,
        api,
        draft,
        250,
        730,
        1400,
        100,
        currentBeat === 2 ? themeColors.green : themeColors.blue,
        30,
      ),
    );
    api.focus.target('streaming-timing', () =>
      refinedText(
        ctx,
        api,
        'First visible text: 3 s · terminal: 5 s',
        960,
        970,
        29,
        themeColors.yellow,
        'center',
      ),
    );
    if (currentBeat === 2) {
      refinedCard(
        ctx,
        api,
        'typed + policy validator',
        400 + 680 * phase(u, 0.1, 0.7),
        840,
        440,
        75,
        themeColors.cyan,
        27,
      );
      refinedText(
        ctx,
        api,
        done
          ? 'Complete object admitted to the same validation path'
          : 'Complete output moves to the validator',
        960,
        1010,
        27,
        done ? themeColors.green : themeColors.muted,
        'center',
      );
    } else
      refinedText(
        ctx,
        api,
        'Displayed draft authorizes no rotation job',
        960,
        1010,
        27,
        themeColors.muted,
        'center',
      );
  }
}
export default {
  id: 'streaming',
  draw: drawStreaming,
  cues: [
    'streaming-timing-b1-1',
    'ap-streaming-0',
    'streamed-api-draft-b2-1',
    'ap-streaming-1',
    'streamed-api-draft-b3-1',
    'ap-streaming-2',
  ],
};
