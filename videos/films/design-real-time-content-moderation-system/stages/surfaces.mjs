import { sampleModel, sensitiveAdmission } from '../model.mjs';
import { card, text } from '../defaults.mjs';
export function drawSurfaces(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel(state);
  const link = (a, b, color = themeColors.cyan) =>
    teaching.transfer({
      source: {
        shape: a,
        opacity: 1,
      },
      target: {
        shape: b,
        opacity: 1,
      },
      color,
      progress: modelState.q,
      particle: {
        radius: 8,
        fill: themeColors.yellow,
      },
    });
  {
    const lower = modelState.b ? 510 : 760;
    const chat = api.focus.target('surfaces-live-chat-before-send', () =>
        card(
          ctx,
          api,
          'Live chat · before send',
          170,
          390,
          650,
          themeColors.blue,
          modelState.b ? 85 : 110,
        ),
      ),
      upload = api.focus.target('surfaces-upload-pending-allowed', () =>
        card(
          ctx,
          api,
          'Upload · pending allowed',
          1090,
          390,
          650,
          themeColors.cyan,
          modelState.b ? 85 : 110,
        ),
      );
    const a = api.focus.target('surfaces-send-or-suppress', () =>
        card(
          ctx,
          api,
          'Send or suppress',
          170,
          lower,
          650,
          themeColors.blue,
          modelState.b ? 85 : 110,
        ),
      ),
      b = api.focus.target('surfaces-publish-or-review', () =>
        card(
          ctx,
          api,
          'Publish or review',
          1090,
          lower,
          650,
          themeColors.cyan,
          modelState.b ? 85 : 110,
        ),
      );
    link(chat, a, themeColors.blue);
    link(upload, b);
    text(ctx, api, 'Chat objective: <200 ms p95', 495, 300, 31, themeColors.blue, 'center');
    text(
      ctx,
      api,
      'Upload: publish or pending in <1 s',
      1415,
      300,
      29,
      themeColors.cyan,
      'center',
    );
    if (modelState.b)
      api.focus.reveal('surfaces-beat-2-focus-2', () => {
        const admission = sensitiveAdmission({
          id: 'SR17',
          modelAgreement: false,
        });
        const checked = state.cues
          ? api.focus.progress('trusted-report-intake', 0) >= 0.65
          : state.beatP > 0.65;
        const admitted = checked && admission.admitted;
        text(
          ctx,
          api,
          'Separate sensitive-report workflow · SR17',
          960,
          660,
          30,
          themeColors.yellow,
          'center',
        );
        const request = api.focus.target('sensitive-report', () =>
          card(
            ctx,
            api,
            'Report SR17\ntrusted intake lookup',
            150,
            715,
            430,
            themeColors.yellow,
            125,
            -17,
          ),
        );
        const gate = api.focus.target('sensitive-intake-gate', () =>
          card(
            ctx,
            api,
            checked
              ? '✓ authenticated intake\n✓ S3 sensitive-review'
              : 'Trusted intake + S3 policy\nchecks pending',
            735,
            715,
            480,
            checked ? themeColors.green : themeColors.muted,
            125,
            -17,
          ),
        );
        const result = api.focus.target('sensitive-review-receipt', () =>
          card(
            ctx,
            api,
            admitted ? 'SR17 · admitted\nAuthorized review' : 'SR17 · pending\nReview admission',
            1370,
            715,
            400,
            admitted ? themeColors.green : themeColors.muted,
            125,
            -17,
          ),
        );
        api.connect(ctx, request, gate, {
          color: checked ? themeColors.green : themeColors.yellow,
          gap: 14,
        });
        api.connect(ctx, gate, result, {
          color: admitted ? themeColors.green : themeColors.muted,
          gap: 14,
        });
        api.focus.target('sensitive-review-receipt', () =>
          text(
            ctx,
            api,
            admitted
              ? `Model agreement: ${admission.modelAgreement} · trusted workflow admits ${admission.id}`
              : 'Model agreement: false · awaiting trusted workflow checks',
            960,
            920,
            30,
            admitted ? themeColors.green : themeColors.muted,
            'center',
          ),
        );
      });
    text(
      ctx,
      api,
      'Deadline expiry preserves the required moderation boundary',
      960,
      990,
      29,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'surfaces',
  draw: drawSurfaces,
  cues: [
    'surfaces-beat-1-focus-1',
    'surfaces-beat-1-focus-2',
    'surfaces-beat-2-focus-1',
    'surfaces-beat-2-focus-2',
    'trusted-report-intake',
    'model-independent-review',
  ],
};
