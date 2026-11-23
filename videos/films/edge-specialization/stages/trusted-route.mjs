import { edgeRoute } from '../arithmetic.mjs';
import { edgeState } from '../model.mjs';
import { drawEdgeCard, drawEdgeRow, drawEdgeText } from '../defaults.mjs';
export function drawTrustedRoute(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = edgeState('trusted-route', state),
    { b: currentBeat, q, done, progress } = modelState;
  let edgeHeading = '',
    edgeNote = '';
  const note = (v) => (edgeNote = v),
    heading = (v) => (edgeHeading = v);
  api.focus.target('edge-trusted-route-mechanism', () => {
    heading('Evaluate actual input types and branch order before a route');
    const cases =
      currentBeat === 0
        ? [
            {
              id: 'A',
              score: true,
              supported: true,
            },
            {
              id: 'B',
              score: 0.8,
              supported: true,
              data: 'restricted',
              online: false,
            },
          ]
        : currentBeat === 1
          ? [
              {
                id: 'C',
                score: 0.41,
                data: 'public',
                approval: true,
                redaction: true,
                online: true,
              },
              {
                id: 'D',
                score: 0.41,
                data: 'restricted',
                approval: true,
                redaction: true,
                online: false,
              },
            ]
          : [
              {
                id: 'payload P',
                score: 0.41,
                data: 'public',
                approval: true,
                redaction: true,
                online: true,
              },
              {
                id: 'mutated P′',
                score: 0.41,
                data: 'restricted',
                approval: true,
                redaction: true,
                online: true,
              },
            ];
    cases.forEach((r, i) => {
      const y = 370 + i * 280;
      drawEdgeCard(ctx, api, `${r.id} · score ${r.score}`, 150, y, 520, themeColors.blue, 105);
      const ready =
        currentBeat === 0
          ? done(i ? 'local' : 'invalid')
          : currentBeat === 1
            ? done(i ? 'review' : 'cloud')
            : done('mutate');
      drawEdgeRow(
        ctx,
        api,
        currentBeat === 0
          ? [`type ${typeof r.score}`, `support ${r.supported}`, `data ${r.data ?? 'unknown'}`]
          : [r.data, `approval ${r.approval}`, `redaction ${r.redaction}`, `online ${r.online}`],
        740,
        y,
        1010,
        105,
        themeColors.cyan,
      );
      if (ready)
        drawEdgeCard(
          ctx,
          api,
          edgeRoute(r),
          980,
          y + 135,
          650,
          edgeRoute(r) === 'local review' ? themeColors.pink : themeColors.green,
          80,
        );
    });
    note(
      currentBeat === 2
        ? 'Authorization must bind the assembled bytes and destination just before transmission'
        : 'Pure function decision only; no redaction, permission lookup or network enforcement',
    );
  });
  if (edgeHeading) drawEdgeText(ctx, api, edgeHeading, 960, 270, 33, themeColors.yellow, 'center');
  if (edgeNote) drawEdgeText(ctx, api, edgeNote, 960, 1020, 26, themeColors.muted, 'center');
}
export default {
  id: 'trusted-route',
  draw: drawTrustedRoute,
  cues: [
    'edge-trusted-route-op-0',
    'edge-trusted-route-invalid',
    'edge-trusted-route-local',
    'edge-trusted-route-op-1',
    'edge-trusted-route-cloud',
    'edge-trusted-route-review',
    'edge-trusted-route-op-2',
    'edge-trusted-route-mutate',
  ],
};
