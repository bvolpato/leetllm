import { phase } from '../arithmetic.mjs';
import { sampleOriginalModel } from '../construction.mjs';
import { legacyCard, legacyMath, legacyText, refinedCard, refinedText } from '../defaults.mjs';
function drawLegacyIdempotency(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = sampleOriginalModel('idempotency', state);
  {
    legacyText(
      ctx,
      api,
      'A read timeout leaves the remote action outcome uncertain',
      960,
      300,
      31,
      themeColors.ink,
      'center',
    );
    const auth = api.focus.target('write-authorization', () =>
      legacyCard(
        ctx,
        api,
        'Authorize fresh rotation intent',
        180,
        410,
        480,
        105,
        themeColors.blue,
        25,
      ),
    );
    const key = api.focus.target('durable-intent-key', () =>
      legacyCard(ctx, api, 'intent-7e3b', 720, 410, 480, 105, themeColors.yellow, 30),
    );
    const job = api.focus.target('single-rotation-job', () =>
      legacyCard(
        ctx,
        api,
        modelState.jobs ? 'Rotation job · JOB-001' : 'No job yet',
        1260,
        410,
        480,
        105,
        themeColors.green,
        25,
      ),
    );
    api.connect(ctx, auth, key, {
      color: themeColors.cyan,
      gap: 14,
    });
    api.connect(ctx, key, job, {
      color: themeColors.cyan,
      gap: 14,
    });
    if (modelState.step > 0)
      legacyCard(
        ctx,
        api,
        'First dispatch · created · count ' + modelState.jobs,
        250,
        665,
        630,
        95,
        themeColors.green,
        27,
      );
    if (modelState.step > 1)
      api.focus.target('same-job-retry', () =>
        legacyCard(
          ctx,
          api,
          'Retry same intent · same job · count ' + modelState.jobs,
          1040,
          665,
          630,
          95,
          themeColors.yellow,
          27,
        ),
      );
    legacyText(
      ctx,
      api,
      modelState.step === 0
        ? 'The model recommends eligibility; a separate authorized operation writes'
        : 'The durable action key makes this retry return the existing job',
      960,
      900,
      27,
      themeColors.muted,
      'center',
    );
    legacyMath(
      ctx,
      api,
      '\\text{created jobs}=' + modelState.jobs,
      960,
      1010,
      40,
      themeColors.cyan,
    );
  }
}
export function drawIdempotency(ctx, scene, state, api) {
  if (!state.cues) {
    drawLegacyIdempotency(ctx, scene, state, api);
    return;
  }
  const { C: themeColors } = api,
    currentBeat = state.beat,
    u = api.focus.progress('ap-idempotency-' + currentBeat),
    done = u >= 0.999999;
  {
    refinedText(
      ctx,
      api,
      'One authorized intent · retained destination-supported action key',
      960,
      325,
      31,
      themeColors.ink,
      'center',
    );
    api.focus.target('write-authorization', () =>
      refinedCard(ctx, api, 'authorize current state', 210, 425, 450, 100, themeColors.blue, 27),
    );
    api.focus.target('durable-intent-key', () =>
      refinedCard(ctx, api, 'intent 7e3b', 730, 425, 450, 100, themeColors.yellow, 31),
    );
    api.focus.target('single-rotation-job', () =>
      refinedCard(
        ctx,
        api,
        currentBeat === 0
          ? 'no dispatch yet'
          : currentBeat === 1 && u < 0.5
            ? 'awaiting dispatch'
            : 'JOB-001 · count 1',
        1250,
        425,
        450,
        100,
        themeColors.green,
        31,
      ),
    );
    if (currentBeat === 1) {
      const q = phase(u, 0.1, 0.5);
      refinedCard(ctx, api, 'dispatch 7e3b', 320 + 1000 * q, 650, 270, 80, themeColors.cyan, 26);
      if (u > 0.55) {
        api.line(ctx, 1460, 810, 960, 810, themeColors.pink, 4);
        api.line(ctx, 950, 780, 980, 840, themeColors.pink, 5);
        api.line(ctx, 980, 780, 950, 840, themeColors.pink, 5);
        refinedText(
          ctx,
          api,
          'ACK LOST · caller uncertain',
          620,
          890,
          31,
          themeColors.pink,
          'center',
        );
      }
    }
    if (currentBeat === 2) {
      refinedCard(
        ctx,
        api,
        'retry 7e3b',
        320 + 1000 * phase(u, 0.05, 0.45),
        650,
        270,
        80,
        themeColors.yellow,
        28,
      );
      api.focus.target('same-job-retry', () =>
        refinedCard(
          ctx,
          api,
          done ? 'same key → JOB-001 · count stays 1' : 'lookup retained intent → same stored job',
          470,
          850,
          980,
          110,
          themeColors.green,
          30,
        ),
      );
    }
  }
}
export default {
  id: 'idempotency',
  draw: drawIdempotency,
  cues: [
    'write-authorization-b1-1',
    'ap-idempotency-0',
    'durable-intent-key-b2-1',
    'ap-idempotency-1',
    'same-job-retry-b3-1',
    'ap-idempotency-2',
  ],
};
