import { drawLine, drawRectangle, drawText } from '../defaults.mjs';
import { voice } from '../voice.mjs';

export function drawThreatSurfaces(ctx, scene, state, api) {
  const c = api.C;
  const cue = voice(scene, state);
  const done = (id) => cue(id).phase === 'after';
  const label = (s, x, y, size, color = c.ink) => drawText(ctx, api, s, x, y, size, color);

  api.focus.target('desk-hours', () => {
    label('Reviewed desk schedule', 130, 315, 40, c.blue);
    label('Proposed incident guide', 1030, 315, 40, c.blue);
    drawRectangle(ctx, api, 130, 363, 720, 228, c.blue);
    drawRectangle(ctx, api, 1030, 363, 750, 228, c.blue);
    label('Review desk opens', 162, 424, 34);
    label('Review desk opens', 1062, 424, 34);
    label('09:00', 160, 543, 87);
    if (cue('guide-hour').phase !== 'before') label('11:00', 1060, 543, 87, c.yellow);
    if (done('guide-poison')) label('False opening time', 1305, 538, 33, c.yellow);
    if (done('guide-signer')) label('Signature verified', 1030, 635, 30, c.blue);
  });

  api.focus.target('calendar', () => {
    drawLine(ctx, api, 130, 654, 1780, 654);
    label('Calendar', 130, 735, 40);
    if (cue('guide-request').phase !== 'before') {
      label('Guide requests a calendar edit', 130, 820, 36);
      label('Assistant has read access', 1050, 820, 36, c.blue);
    }
    if (done('guide-effect')) label('Edit held', 1050, 917, 45, c.pink);
  });
  if (done('guide-quarantine'))
    label('Keep the proposed guide out of search pending review.', 130, 1015, 33, c.yellow);
}
export default {
  id: 'threat-surfaces',
  draw: drawThreatSurfaces,
  cues: [
    'guide-hour',
    'guide-poison',
    'guide-request',
    'guide-signer',
    'guide-effect',
    'guide-quarantine',
  ],
};
