import {
  drawSemanticConstructionsArrow,
  drawSemanticConstructionsBox,
  drawSemanticConstructionsCenter,
  drawSemanticConstructionsFoot,
  withSemanticConstructionFrame,
} from '../defaults.mjs';
export function paintCurrentAuthorization(
  ctx,
  scene,
  state,
  api,
  themeColors,
  c,
  t,
  id,
  currentBeat,
  beatProgress,
  done,
  progress,
  op,
) {
  drawSemanticConstructionsCenter(
    ctx,
    api,
    themeColors,
    'The same stored scope can outlive a caller’s permission',
    245,
  );
  drawSemanticConstructionsBox(
    ctx,
    api,
    themeColors,
    c,
    'Stored scope\npublic-policy · tenant docs-public',
    160,
    350,
    740,
    themeColors.blue,
    140,
  );
  drawSemanticConstructionsBox(
    ctx,
    api,
    themeColors,
    c,
    'Current request\nsame declared scope',
    1020,
    350,
    740,
    themeColors.cyan,
    140,
  );
  const revoked = currentBeat === 1 && done(1, 'sc-auth-deny');
  drawSemanticConstructionsBox(
    ctx,
    api,
    themeColors,
    c,
    'Current resource permission',
    160,
    620,
    740,
    themeColors.yellow,
    95,
  );
  drawSemanticConstructionsBox(
    ctx,
    api,
    themeColors,
    c,
    revoked ? 'current permission: false' : 'current permission: true',
    1020,
    620,
    740,
    revoked ? themeColors.pink : themeColors.green,
    95,
  );
  drawSemanticConstructionsArrow(
    ctx,
    api,
    themeColors,
    915,
    666,
    995,
    666,
    revoked ? themeColors.pink : themeColors.green,
  );
  drawSemanticConstructionsBox(
    ctx,
    api,
    themeColors,
    c,
    revoked
      ? 'DENY · no lookup · no fresh generation'
      : 'Fresh permission check required before either read',
    300,
    825,
    1320,
    revoked ? themeColors.pink : themeColors.muted,
    100,
    30,
  );
  drawSemanticConstructionsFoot(
    ctx,
    api,
    themeColors,
    'Ask the authorization service for this caller’s current access to the document.',
  );
}
export function drawCurrentAuthorization(ctx, scene, state, api) {
  withSemanticConstructionFrame(ctx, scene, state, api, paintCurrentAuthorization);
}
export default {
  id: 'current-authorization',
  draw: drawCurrentAuthorization,
  cues: ['sc-current-authorization-b0', 'sc-current-authorization-b1', 'sc-auth-deny'],
};
