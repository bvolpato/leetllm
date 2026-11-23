import { sampleOriginalModel } from '../construction.mjs';
import { drawCard, drawText } from '../defaults.mjs';
export function drawClaim(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleOriginalModel('claim', state);
  {
    drawText(
      ctx,
      api,
      'Protected implementation · one atomic owner transition',
      960,
      285,
      33,
      themeColors.yellow,
      'center',
    );
    api.rect(ctx, 730, 440, 480, 210, null, themeColors.yellow, 3, 12);
    drawText(ctx, api, 'lock: check + insert', 970, 420, 27, themeColors.yellow, 'center');
    drawCard(ctx, api, '/other fetches outside lock', 180, 790, 420, themeColors.cyan, 65, 23);
    const a = api.focus.target('claim-worker-a-docs', () =>
      drawCard(ctx, api, 'Worker A · /docs', 180, 350, 420, themeColors.blue, 120, 30),
    );
    const b = drawCard(ctx, api, 'Worker B · /docs', 180, 620, 420, themeColors.cyan, 120, 30);
    const lock = drawCard(
      ctx,
      api,
      modelState.visible === 0 ? 'visited set empty' : '/docs claimed by A',
      760,
      465,
      420,
      themeColors.yellow,
      150,
      31,
    );
    const winner = api.focus.target(
      'claim-s-fetches-a-fetches-lock-released-s-owners-a-owns-claim-fetch-pendin',
      () =>
        drawCard(
          ctx,
          api,
          modelState.fetches
            ? 'A fetches · lock released'
            : modelState.owners
              ? 'A owns claim · fetch pending'
              : 'A waits to claim',
          1320,
          350,
          480,
          modelState.owners ? themeColors.green : themeColors.muted,
          120,
          28,
        ),
    );
    const skipped = modelState.events.some(
      (event) => event.worker === 'B' && event.kind === 'skipped',
    );
    const skip = api.focus.target('claim-skipped-b-sees-existing-claim-skip-b-waits-to-claim', () =>
      drawCard(
        ctx,
        api,
        skipped ? 'B sees existing claim · skip' : 'B waits to claim',
        1320,
        620,
        480,
        skipped ? themeColors.pink : themeColors.muted,
        120,
        28,
      ),
    );
    const aProgress = modelState.step ? 1 : api.phase(modelState.q, 0, 0.34),
      bProgress = modelState.step ? 1 : api.phase(modelState.q, 0.34, 0.67);
    teaching.transfer({
      source: {
        shape: a,
        opacity: 1,
      },
      target: {
        shape: lock,
        opacity: 1,
      },
      color: themeColors.blue,
      progress: aProgress,
      particle: {
        radius: 8,
        fill: themeColors.blue,
      },
    });
    teaching.transfer({
      source: {
        shape: b,
        opacity: 1,
      },
      target: {
        shape: lock,
        opacity: 1,
      },
      color: themeColors.cyan,
      progress: bProgress,
      particle: {
        radius: 8,
        fill: themeColors.cyan,
      },
    });
    teaching.transfer({
      source: {
        shape: lock,
        opacity: 1,
      },
      target: {
        shape: winner,
        opacity: 1,
      },
      color: themeColors.green,
      progress: modelState.step ? api.phase(modelState.q, 0, 0.5) : aProgress,
      particle: {
        radius: 8,
        fill: themeColors.green,
      },
    });
    teaching.transfer({
      source: {
        shape: lock,
        opacity: 1,
      },
      target: {
        shape: skip,
        opacity: 1,
      },
      color: themeColors.pink,
      progress: bProgress,
      particle: {
        radius: 8,
        fill: themeColors.pink,
      },
    });
    drawText(
      ctx,
      api,
      `Claim owners: ${modelState.owners} · fetches started: ${modelState.fetches}`,
      960,
      830,
      33,
      themeColors.ink,
      'center',
    );
    drawText(
      ctx,
      api,
      'At most one owner · slow I/O occurs after the short claim',
      960,
      900,
      34,
      themeColors.yellow,
      'center',
    );
  }
}
export default {
  id: 'claim',
  draw: drawClaim,
  cues: [
    'claim-beat-1-focus-1',
    'claim-beat-1-focus-2',
    'claim-beat-2-focus-1',
    'claim-beat-2-focus-2',
  ],
};
