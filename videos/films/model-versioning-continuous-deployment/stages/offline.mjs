import { sampleModel } from '../construction.mjs';
import { candidate } from '../model.mjs';
import { legacyText, originalCueComplete, recordCard, releaseBundle } from '../defaults.mjs';
export function drawOffline(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = sampleModel('offline', state),
    currentBeat = modelState.beat;
  if (state.cues) {
    Object.assign(
      modelState,
      sampleModel('offline', {
        ...state,
        beat: api.focus.visible('change-evaluator') ? 1 : 0,
      }),
    );
  }
  {
    legacyText(
      ctx,
      api,
      'Supplied report · exact contract comparison',
      590,
      290,
      34,
      themeColors.ink,
      'center',
    );
    api.focus.target('evaluator-identity', () =>
      recordCard(
        ctx,
        api,
        'Evaluator: ' + modelState.evidence.evaluator,
        150,
        370,
        880,
        modelState.allowed ? themeColors.cyan : themeColors.pink,
        95,
        34,
      ),
    );
    api.focus.target('coverage-evidence', () =>
      legacyText(
        ctx,
        api,
        'Coverage: 200 cases · 200 support · 200 latency',
        590,
        555,
        29,
        themeColors.ink,
        'center',
      ),
    );
    api.focus.target('quality-evidence', () =>
      legacyText(
        ctx,
        api,
        'Route F1 ' + modelState.evidence.f1 + ' ≥ 0.92',
        590,
        645,
        35,
        themeColors.green,
        'center',
      ),
    );
    api.focus.target('quality-evidence', () =>
      legacyText(
        ctx,
        api,
        'Rollback F1 ' + modelState.evidence.rollbackF1 + ' ≥ 0.90',
        590,
        715,
        35,
        themeColors.green,
        'center',
      ),
    );
    api.focus.target('operational-evidence', () =>
      legacyText(
        ctx,
        api,
        modelState.evidence.unsupported +
          ' unsupported · p95 ' +
          modelState.evidence.p95 +
          ' ms ≤ 500',
        590,
        810,
        32,
        themeColors.ink,
        'center',
      ),
    );
    releaseBundle(
      ctx,
      api,
      candidate,
      'Report names this bundle',
      1170,
      370,
      600,
      themeColors.cyan,
    );
    api.focus.target('offline-decision', () =>
      legacyText(
        ctx,
        api,
        originalCueComplete(ctx, api, currentBeat ? 'offline-rejection' : 'offline-eligibility')
          ? (modelState.allowed ? 'ELIGIBLE · ' : 'REJECT · ') + modelState.reason
          : 'Contract comparison pending',
        960,
        950,
        35,
        originalCueComplete(ctx, api, currentBeat ? 'offline-rejection' : 'offline-eligibility')
          ? modelState.allowed
            ? themeColors.green
            : themeColors.pink
          : themeColors.muted,
        'center',
      ),
    );
    legacyText(
      ctx,
      api,
      'Supplied report age 2 hours · limit 24 hours',
      960,
      1020,
      27,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'offline',
  draw: drawOffline,
  cues: [
    'report-identity',
    'report-metrics',
    'offline-eligibility',
    'change-evaluator',
    'offline-rejection',
  ],
};
