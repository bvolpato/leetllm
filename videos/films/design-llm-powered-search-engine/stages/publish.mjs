import { sampleModel } from '../model.mjs';
import { originalCard, originalText } from '../defaults.mjs';
export function drawPublish(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = sampleModel('publish', state);
  {
    const delivery = modelState;
    api.focus.target('publish-active-draft-2-source-revision-2', () =>
      originalCard(
        ctx,
        api,
        'Request R1 · active draft 2 · source revision 2',
        170,
        310,
        1580,
        themeColors.blue,
        110,
        38,
      ),
    );
    api.focus.target(
      'publish-s-events-some-e-e-draft-2-matching-check-decision-stale-acceptance-d',
      () =>
        api.focus.target('publish-check-decision', () =>
          originalCard(
            ctx,
            api,
            delivery.accepted
              ? 'Matching decision 2 · ACCEPT'
              : 'Stale decision 1: draft 1 / revision 1',
            170,
            500,
            1580,
            delivery.accepted ? themeColors.green : themeColors.pink,
            110,
            36,
          ),
        ),
    );
    originalCard(
      ctx,
      api,
      'Decision 1 · draft 1 / revision 1\nIGNORED · stale identity',
      170,
      660,
      490,
      themeColors.pink,
      115,
      26,
    );
    if (delivery.accepted)
      api.focus.target('publish-event-2', () =>
        originalCard(
          ctx,
          api,
          'Decision 2 · draft 2 / revision 2\nACCEPTED · current identity',
          715,
          660,
          490,
          themeColors.green,
          115,
          26,
        ),
      );
    if (delivery.replayed)
      api.focus.target('publish-event-2', () =>
        originalCard(
          ctx,
          api,
          'Replay decision 2\nDUPLICATE · already seen',
          1260,
          660,
          490,
          themeColors.yellow,
          115,
          26,
        ),
      );
    api.focus.target('publish-delivery', () =>
      originalCard(
        ctx,
        api,
        delivery.emitted
          ? 'Published: 60 days with security approval\nR1 · draft 2 · revision 2'
          : 'Draft 2: 60 days with security approval\nPENDING · no claim sent',
        170,
        815,
        1160,
        delivery.emitted ? themeColors.green : themeColors.muted,
        130,
        30,
      ),
    );
    api.focus.target('publish-emitted-count', () =>
      originalCard(
        ctx,
        api,
        'Publications\n' + delivery.emitted,
        1400,
        815,
        350,
        delivery.emitted ? themeColors.green : themeColors.yellow,
        130,
        30,
      ),
    );
    originalText(
      ctx,
      api,
      delivery.replayed
        ? 'Same decision ID · one delivered claim'
        : delivery.accepted
          ? 'Current acceptance releases the identified claim'
          : 'A stale decision leaves the current claim pending',
      960,
      1010,
      29,
      themeColors.muted,
      'center',
    );
  }
}

// These local models mirror the article fixtures; no provider or retrieval service runs here.
export default {
  id: 'publish',
  draw: drawPublish,
  cues: [
    'publish-beat-1-focus-1',
    'publish-current-accept',
    'publish-replayed-event',
    'publish-beat-2-focus-2',
  ],
};
