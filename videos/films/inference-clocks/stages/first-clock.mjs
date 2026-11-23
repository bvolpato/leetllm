import { outputs, prompt } from '../fixtures.mjs';
import { sampleModel } from '../model.mjs';
import { text } from '../defaults.mjs';
export function drawFirstClock(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api;
  const modelState = sampleModel('first-clock', state),
    currentBeat = modelState.step;
  if (state.cues && true) {
    const q =
      currentBeat === 0
        ? 70
        : currentBeat === 1
          ? 70 * (1 - api.focus.progress('remove-queue', 0))
          : 70 * api.focus.progress('restore-queue', 0);
    let end = 0;
    modelState.spans = ['Queue', 'Tokenization', 'Prefill', 'First-logit work'].map((name, i) => {
      const start = end,
        duration = [q, 10, 230, 10][i];
      end += duration;
      return {
        name,
        start,
        duration,
        end,
      };
    });
    modelState.constructionClock =
      currentBeat === 0 ? end * api.focus.progress('construct-first-clock', 0) : end;
    modelState.clientExtra =
      currentBeat === 2 ? Math.round(30 * api.focus.progress('client-boundaries', 0)) : 0;
    Object.assign(modelState, {
      serverFirst: end,
      clientSend: -modelState.clientExtra,
      clientFirst: end + modelState.clientExtra,
      serverTtft: end,
      clientTtft: end + 2 * modelState.clientExtra,
    });
  }
  if (state.cues && false) {
    modelState.cached = api.focus.progress('prompt-kv', 0) > 0 ? prompt : [];
    modelState.prediction = api.focus.progress('first-prediction', 0) > 0 ? outputs[0] : null;
  }
  if (state.cues && false) {
    modelState.consumed =
      currentBeat === 0
        ? api.focus.progress('predict-next', 0) > 0
          ? 1
          : 0
        : currentBeat === 1
          ? api.focus.progress('punctuation', 0) > 0
            ? 2
            : 1
          : 2;
    modelState.cached = [...prompt, ...outputs.slice(0, modelState.consumed)];
    modelState.prediction = outputs[modelState.consumed];
    modelState.emitted = modelState.consumed + 1;
  }
  {
    const x = (ms) => 570 + ((ms + 30) / 410) * 1090;
    const complete = modelState.constructionClock >= modelState.serverFirst;
    modelState.spans.forEach((span, i) =>
      api.focus.target('first-token-spans', () => {
        const y = 320 + i * 125;
        api.focus.target('first-clock-readout', () =>
          text(ctx, api, span.name, 140, y + 42, 29, themeColors.ink),
        );
        const elapsed = complete
          ? span.duration
          : Math.max(0, Math.min(span.duration, modelState.constructionClock - span.start));
        if (elapsed > 0)
          api.rect(
            ctx,
            x(span.start),
            y,
            x(span.start + elapsed) - x(span.start),
            65,
            [themeColors.pink, themeColors.muted, themeColors.blue, themeColors.cyan][i],
            undefined,
            0,
          );
        api.focus.target('first-clock-readout-2', () =>
          text(
            ctx,
            api,
            elapsed === span.duration
              ? `${span.duration.toFixed(0)} ms`
              : elapsed > 0
                ? `${elapsed.toFixed(0)} / ${span.duration.toFixed(0)} ms`
                : 'Awaiting prior span',
            1710,
            y + 42,
            elapsed === span.duration ? 27 : 22,
            currentBeat > 0 && i === 0 ? themeColors.yellow : themeColors.muted,
            'center',
          ),
        );
      }),
    );
    api.line(
      ctx,
      x(modelState.constructionClock),
      295,
      x(modelState.constructionClock),
      800,
      themeColors.yellow,
      2,
    );
    api.focus.target('first-clock-readout-3', () =>
      text(
        ctx,
        api,
        !complete
          ? `Trace clock: ${modelState.constructionClock.toFixed(0)} ms · first token pending`
          : `Server first token: ${modelState.serverFirst.toFixed(0)} ms after arrival`,
        140,
        885,
        32,
        themeColors.yellow,
      ),
    );
    if (currentBeat > 0)
      teaching.changeCue(
        {
          x: 125,
          y: 830,
          width: 1650,
          height: 85,
          from: currentBeat === 1 ? 320 : 250,
          to: currentBeat === 1 ? 250 : 320,
          progress: currentBeat === 1 ? modelState.p : Math.min(1, modelState.p / 0.55),
          color: themeColors.yellow,
          restColor: themeColors.yellow,
          emphasis: modelState.p > 0 && modelState.p < 1 ? 0.8 : 0,
        },
        () => {},
      );
    if (currentBeat === 2 && modelState.clientExtra > 0) {
      api.focus.target('client-clock', () =>
        api.line(ctx, x(-modelState.clientExtra), 815, x(0), 815, themeColors.pink, 5),
      );
      api.focus.target('client-clock', () =>
        api.line(
          ctx,
          x(modelState.serverFirst),
          815,
          x(modelState.clientFirst),
          815,
          themeColors.green,
          5,
        ),
      );
    }
    const roundedClientSend = Math.round(modelState.clientSend),
      roundedClientFirst = Math.round(modelState.clientFirst);
    api.focus.target('first-clock-readout-4', () =>
      text(
        ctx,
        api,
        currentBeat === 2
          ? `Client send ${roundedClientSend} ms → first visible ${roundedClientFirst} ms · client TTFT ${roundedClientFirst - roundedClientSend} ms`
          : currentBeat === 1
            ? 'Only queue duration changes; tokenization, prefill and first-logit work stay fixed'
            : 'Same server origin · spans appear when the trace reaches them',
        140,
        975,
        28,
        themeColors.muted,
      ),
    );
  }
}
export default {
  id: 'first-clock',
  draw: drawFirstClock,
  cues: [
    'construct-first-clock',
    'first-token-endpoint',
    'remove-queue',
    'fixed-prefill',
    'restore-queue',
    'client-boundaries',
    'observation-point',
  ],
};
