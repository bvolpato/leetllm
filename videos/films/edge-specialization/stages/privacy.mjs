import { trustedAssets } from '../fixtures.mjs';
import { policyDecision } from '../model.mjs';
import { cueProgress, fieldDrawing } from '../field-drawing.mjs';

export function drawPrivacy(ctx, scene, state, api) {
  const p = fieldDrawing(ctx, api),
    { C, text, rect, line, target } = p;
  const b = state.beat ?? 0;
  const cue = (id, beat, from, to) => cueProgress(state, id, beat, from, to);
  const crash = b > 0;
  const hasPage = cue('manual-attached', 1, 0.19, 0.31) === 1;
  const stamped = cue('caller-label', 1, 0.36, 0.47) === 1;
  const decision = cue('blocked-upload', 2, 0.02, 0.13);
  const reviewing = cue('local-review-ticket', 2, 0.48, 0.63) === 1;
  const cloud = crash && !reviewing;
  const assets = reviewing
    ? ['manual', 'incident']
    : crash
      ? hasPage
        ? ['metrics', 'manual']
        : ['metrics']
      : ['manual', 'incident'];
  const route = policyDecision(assets, cloud ? 'cloud' : 'device', stamped ? 'public' : undefined);
  target('packet-boundary', () => {
    line(1250, 335, 1250, 808, C.yellow, 5);
    text('Handheld boundary', 1250, 287, 37, C.yellow, 'center');
    text('Cloud service', 1555, 536, 40, C.muted, 'center');
    if (cloud && decision > 0 && !route.allowed) {
      line(1130, 559, 1221, 559, C.pink, 5);
      line(1224, 521, 1224, 598, C.pink, 8);
    }
  });
  const left = 170 + (cloud ? 151 * decision : 0);
  rect(left, 354, 762, 434, C.panel, C.muted, 17);
  target('packet-heading', () => {
    text(
      reviewing ? 'Local review ticket' : cloud ? 'Crash report' : 'Local answer request',
      left + 45,
      430,
      46,
    );
    if (cloud && stamped) text('Caller: public', left + 45, 488, 30, C.muted);
  });
  target('packet-assets', () => {
    assets.forEach((asset, i) => {
      const name = {
        metrics: 'Timing metric',
        manual: 'Manual M7',
        incident: reviewing ? 'Incident · A / E9' : 'Incident · A / E2',
      }[asset];
      const classification = trustedAssets[asset].class;
      const y = 583 + i * 110;
      line(left + 45, y - 57, left + 713, y - 57, C.muted);
      text(name, left + 45, y, 38);
      text(
        classification,
        left + 715,
        y,
        34,
        classification === 'public' ? C.cyan : C.yellow,
        'right',
      );
    });
  });
  const message = reviewing
    ? 'No source for A / E9   →   Review on this handheld'
    : cloud && decision === 1
      ? route.allowed
        ? 'May transmit this report'
        : 'Report stays here   /   restricted page attached'
      : cloud
        ? 'May this report leave if the connection returns?'
        : 'Manual, incident and computation stay here.';
  text(message, 960, 940, 43, decision === 1 && cloud ? C.pink : C.ink, 'center');
}
export default {
  id: 'privacy',
  draw: drawPrivacy,
  cues: [
    'local-payload',
    'metric',
    'manual-attached',
    'caller-label',
    'blocked-upload',
    'local-review-ticket',
  ],
};
