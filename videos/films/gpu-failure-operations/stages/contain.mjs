import { containmentTrace } from '../arithmetic.mjs';
import { card, text, withGpuLegacyFrame } from '../defaults.mjs';
export function paintGpuLegacyContain(ctx, scene, state, api, C, c, t, s, b) {
  const trace = containmentTrace(b, state.beatP ?? 0, state.cues);
  api.focus.target('contain-admission-router-gpu-0-closed', () =>
    card(ctx, api, C, c, 'Admission router · GPU-0 closed', 660, 275, 600, C.blue, 90, 31),
  );
  text(ctx, api, C, 'New-arrival queue', 915, 410, 27, C.blue, 'center');
  text(ctx, api, C, 'Healthy GPU-1/P8', 1545, 410, 27, C.green, 'center');
  trace.rows.forEach((request, i) => {
    const y = 450 + i * 75;
    if (request.progress === 1) {
      card(ctx, api, C, c, '', 820, y, 190, C.muted, 60, 27);
      api.arrow(ctx, 1025, y + 30, 1435, y + 30, C.green, 2);
    }
    api.focus.target('contain-request-id', () =>
      card(
        ctx,
        api,
        C,
        c,
        request.id,
        820 + 630 * request.progress,
        y,
        190,
        request.progress === 1 ? C.green : request.progress > 0 ? C.yellow : C.muted,
        60,
        28,
      ),
    );
  });
  api.focus.target('contain-gpu-0-trace-process', () =>
    card(ctx, api, C, c, 'GPU-0 · ' + trace.process, 150, 465, 550, C.pink, 90, 29),
  );
  trace.existing.forEach((request, i) =>
    api.focus.target('contain-existing-owners', () =>
      card(
        ctx,
        api,
        C,
        c,
        `${request.id} · ${request.owner}\n${trace.fatal ? 'unresolved · reconcile separately' : 'existing work remains owned here'}`,
        150,
        600 + i * 145,
        550,
        C.yellow,
        115,
        26,
      ),
    ),
  );
  if (trace.fatal)
    api.focus.target('contain-cuda-error-illegal-address', () =>
      c.card({
        label: 'CUDA_ERROR_ILLEGAL_ADDRESS',
        x: 150,
        y: 375,
        width: 550,
        height: 70,
        fontSize: 25,
        font: 'mono',
        baselineOffset: 8.5,
        padding: 14,
        fill: C.panel,
        stroke: C.pink,
        textColor: C.pink,
      }),
    );
  text(
    ctx,
    api,
    C,
    trace.relaunched
      ? 'New process remains quarantined pending validation'
      : trace.stopped
        ? 'Old process ended; request outcomes remain separately recorded'
        : trace.fatal
          ? 'Fatal process state: preserve evidence, then terminate'
          : 'Readiness closes future admission; R1/R2 keep their original owner',
    960,
    980,
    28,
    C.muted,
    'center',
  );
}
export function drawContainStage(ctx, scene, state, api) {
  withGpuLegacyFrame(ctx, scene, state, api, paintGpuLegacyContain);
}
export default {
  id: 'contain',
  draw: drawContainStage,
  cues: [
    'contain-beat-1-focus-1',
    'contain-beat-1-focus-2',
    'contain-beat-2-focus-1',
    'contain-beat-2-focus-2',
    'contain-relaunch',
  ],
};
