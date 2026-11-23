import { canaryConversation } from '../fixtures.mjs';
import { sampleModel } from '../construction.mjs';
import { CANDIDATE, STABLE, registry, route } from '../model.mjs';
import { legacyText, recordCard, recordGrid, releaseName } from '../defaults.mjs';
export function drawRecovery(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = sampleModel('recovery', state),
    currentBeat = modelState.beat;
  if (state.cues) {
    const promoted = currentBeat > 0,
      r = registry(promoted ? STABLE : CANDIDATE),
      promotionApplied = promoted && api.focus.visible('production-promotion');
    if (promotionApplied) r.move('production', CANDIDATE, r.aliases.get('production'));
    const failure = api.focus.visible(promoted ? 'failure-observed' : 'abort-canary'),
      recovered = api.focus.visible(promoted ? 'production-rollback' : 'repoint-canary'),
      aborted = new Set(failure ? [CANDIDATE] : []);
    if (recovered)
      r.move(
        promoted ? 'production' : 'canary',
        STABLE,
        r.aliases.get(promoted ? 'production' : 'canary'),
      );
    const assignments = new Map([[canaryConversation, CANDIDATE]]),
      assigned = recovered
        ? route(canaryConversation, 0, assignments, aborted)
        : promoted && !promotionApplied
          ? STABLE
          : CANDIDATE;
    Object.assign(modelState, {
      promotionApplied,
      failure,
      recovered,
      assigned,
      exposure: failure ? 0 : promoted ? (promotionApplied ? 100 : 0) : 10,
      aliases: Object.fromEntries(r.aliases),
      events: r.events,
      aborted,
    });
  }
  {
    legacyText(
      ctx,
      api,
      modelState.kind + ' · separate supplied run',
      960,
      270,
      36,
      themeColors.yellow,
      'center',
    );
    const production = api.focus.target('production-pointer', () =>
        recordCard(
          ctx,
          api,
          'Production alias · r' + modelState.aliases.production.revision,
          170,
          365,
          500,
          themeColors.blue,
          100,
          29,
        ),
      ),
      canary = api.focus.target('canary-pointer', () =>
        recordCard(
          ctx,
          api,
          'Canary alias · r' + modelState.aliases.canary.revision,
          170,
          575,
          500,
          themeColors.yellow,
          100,
          29,
        ),
      ),
      stableWorker = api.focus.target('stable-workers', () =>
        recordCard(ctx, api, 'Retained STABLE workers', 1250, 365, 500, themeColors.green, 100, 29),
      ),
      candidateWorker = api.focus.target('candidate-workers', () =>
        recordCard(
          ctx,
          api,
          modelState.failure ? 'CANDIDATE · failed' : 'CANDIDATE workers',
          1250,
          575,
          500,
          modelState.failure ? themeColors.pink : themeColors.cyan,
          100,
          29,
        ),
      );
    api.connect(
      ctx,
      production,
      modelState.aliases.production.target === STABLE ? stableWorker : candidateWorker,
      {
        color: themeColors.blue,
        gap: 18,
      },
    );
    api.connect(
      ctx,
      canary,
      modelState.aliases.canary.target === STABLE ? stableWorker : candidateWorker,
      {
        color: themeColors.yellow,
        gap: 18,
      },
    );
    legacyText(ctx, api, STABLE.slice(0, 16), 1500, 510, 25, themeColors.green, 'center');
    legacyText(
      ctx,
      api,
      CANDIDATE.slice(0, 16),
      1500,
      715,
      25,
      modelState.failure ? themeColors.pink : themeColors.cyan,
      'center',
    );
    const assignment = modelState.recovered
      ? 'Failed thread reassigned to STABLE'
      : modelState.failure
        ? 'Failed CANDIDATE assignment blocked'
        : 'Existing thread resolves to ' + releaseName(ctx, api, modelState.assigned);
    api.focus.target('thread-assignment', () =>
      recordCard(
        ctx,
        api,
        assignment,
        360,
        750,
        1200,
        modelState.recovered
          ? themeColors.green
          : modelState.failure
            ? themeColors.pink
            : themeColors.cyan,
        65,
        26,
      ),
    );
    const events = modelState.events.map((event, i) => [
      i + 1,
      event.alias,
      event.from ? releaseName(ctx, api, event.from.target) : 'unbound',
      releaseName(ctx, api, event.to.target),
      'r' + event.to.revision,
    ]);
    api.focus.target('transition-records', () =>
      recordGrid(
        ctx,
        api,
        [['Event', 'Alias', 'From', 'To', 'Revision'], ...events],
        210,
        850,
        1500,
        160,
        22,
      ),
    );
    legacyText(
      ctx,
      api,
      'Candidate exposure ' +
        modelState.exposure +
        '% · ' +
        (modelState.failure ? 'failure observed' : 'before failure'),
      960,
      1050,
      27,
      modelState.failure ? themeColors.pink : themeColors.cyan,
      'center',
    );
  }
}
export default {
  id: 'recovery',
  draw: drawRecovery,
  cues: [
    'abort-canary',
    'repoint-canary',
    'production-promotion',
    'failure-observed',
    'production-rollback',
    'retain-transitions',
  ],
};
