import { freshPromotion, mix } from '../arithmetic.mjs';
import { sceneClock, storageStrip, worksheetRow } from '../worksheet.mjs';

const request = freshPromotion();

export function drawFreshPromotion(ctx, scene, state, api) {
  const { C } = api;
  const { progress, after } = sceneClock(state);
  const label = (s, x, y, size = 36, color = C.ink, align = 'left') => api.text(ctx, s, x, y, size, color, align);
  if (state.beat <= 1) {
    const pick = progress('kg-fresh-promotion-pick', 1, 0, 0.16);
    const route = after('kg-fresh-promotion-route', 1, 0.16, 0.25);
    const mean = after('kg-fresh-promotion-mean', 1, 0.36, 0.49);
    const output = after('kg-fresh-promotion-outputs', 1, 0.68, 0.83);
    const count = pick >= 1 ? 2 : pick > 0 ? 1 : 0;
    api.focus.target('fresh-map', () => {
      label('Valid 2 × 2 view   ·   row zero starts at offset 0', 155, 264, 37);
      label('Feature stride   +2', 1740, 264, 34, C.blue, 'right');
      storageStrip(ctx, api, request.fixture.storage, request.addresses.slice(0, count),
        mix(request.addresses[0], request.addresses[1], pick));
      label('Row zero', 320, 675, 35, C.cyan, 'right');
      worksheetRow(ctx, api, request.values.map((x, i) => i < count ? x : '?'), {
        x: 355, y: 617, width: 520, color: C.cyan,
      });
      if (route) label('Weights  [1, 2]     ε = 0.00001', 1050, 673, 36, C.muted);
    });
    api.focus.target('fresh-calculation', () => {
      label(route ? 'Route    ' + request.route : 'Fast path needs packed rows in multiples of 128', 155, 794, 38, route ? C.cyan : C.ink);
      if (mean) label('Mean square    (25 + 144) / 2 = ' + request.mean, 870, 794, 35, C.ink);
      if (output) {
        label('Fresh output', 155, 951, 38, C.green);
        worksheetRow(ctx, api, request.outputs.map(v => v.toFixed(3)), { x: 568, y: 893, width: 822, color: C.green });
      } else if (mean) {
        label('Weighted result    [5 × 1, 12 × 2] / √84.50001', 960, 945, 39, C.ink, 'center');
      } else {
        label('Which values belong to row zero? Which path should run?', 960, 945, 40, C.yellow, 'center');
      }
    });
    return;
  }
  api.focus.target('fresh-release', () => {
    const admitted = after('kg-fresh-fit', 2, 0.45, 0.57) && request.wideEligible;
    const field = after('kg-fresh-field', 2, 0.68, 0.78);
    const hold = after('kg-fresh-promotion-pending', 3, 0, 0.17) && request.safetyReport === null;
    label('New lab call', 200, 324, 43, C.blue);
    label('Release record', 1090, 324, 43, C.ink);
    api.line(ctx, 967, 288, 967, 826, C.muted, 2);
    label('Width  ' + request.wideCall.h + '     ·     packed input and weights', 200, 447, 33);
    label('Tested GPU     ·     gradients off', 200, 522, 33);
    for (let feature = 0; feature < request.wideCall.h; feature++) {
      const group = Math.floor(feature / 8);
      api.rect(ctx, 201 + group * 40 + (feature % 8) * 4, 594, 3.5, 55, C.blue, undefined, 0);
    }
    label('16 groups of 8 features fill one tile.', 200, 705, 31, C.muted);
    if (admitted) label('Dispatch     eligible for fast path', 200, 798, 37, C.cyan);
    label('Loaded candidate     K1', 1090, 446, 36);
    label('Device safety report', 1090, 550, 36);
    api.rect(ctx, 1090, 596, 610, 112, C.panel, field ? C.yellow : C.muted, 6);
    if (field) label('Missing', 1395, 666, 45, C.yellow, 'center');
    if (field) label(hold ? 'Live traffic stays on the trusted path' : 'Enable live traffic?', 960, 918, 50, C.yellow, 'center');
    if (hold) label('Run the device checks and bind their reports to K1 and its dispatch rule.', 960, 1005, 33, C.ink, 'center');
  });
}
export default {
  id: 'fresh-promotion', draw: drawFreshPromotion,
  cues: ['kg-fresh-promotion-voice-0', 'kg-fresh-promotion-pick', 'kg-fresh-promotion-route',
    'kg-fresh-promotion-mean', 'kg-fresh-promotion-outputs', 'kg-fresh-fit', 'kg-fresh-field', 'kg-fresh-promotion-pending'],
};
