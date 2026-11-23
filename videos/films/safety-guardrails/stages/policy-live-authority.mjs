import { guardCue, guardDone } from '../model.mjs';
import {
  drawGuardMechanismBlock,
  drawGuardMechanismLabel,
  drawGuardMechanismLine,
  drawGuardMechanismText,
  withGuardMechanismFocus,
} from '../defaults.mjs';
export function paintPolicyLiveAuthority(
  ctx,
  scene,
  state,
  api,
  themeColors,
  currentBeat,
  cueProgress,
  cueDone,
) {
  const expiry = cueProgress('policy-live-authority-expiry', 0),
    hold = cueDone('policy-live-authority-hold', 1);
  drawGuardMechanismBlock(
    ctx,
    api,
    themeColors,
    'live-authority',
    'Captured content decision',
    ['R1: policy-7 · score 0.91', 'content trigger 0.80 → block'],
    155,
    300,
    740,
    255,
    themeColors.blue,
    32,
  );
  drawGuardMechanismBlock(
    ctx,
    api,
    themeColors,
    'live-authority',
    'Immediately before the effect',
    ['authenticated actor', 'exact operation + payload', 'approval status / expiry / revocation'],
    1020,
    300,
    745,
    310,
    themeColors.yellow,
    31,
  );
  withGuardMechanismFocus(ctx, api, 'live-expiry', () => {
    const x = 170 + 1590 * expiry;
    drawGuardMechanismLine(ctx, api, themeColors, 170, 720, 1760, 720, themeColors.muted, 3);
    drawGuardMechanismLine(ctx, api, themeColors, 1200, 690, 1200, 750, themeColors.pink, 4);
    drawGuardMechanismText(
      ctx,
      api,
      themeColors,
      'approval expires',
      1200,
      800,
      28,
      themeColors.pink,
      'center',
    );
    drawGuardMechanismText(
      ctx,
      api,
      themeColors,
      '00:15',
      1200,
      850,
      30,
      themeColors.pink,
      'center',
    );
    api.circle(ctx, x, 720, 10, themeColors.cyan);
    drawGuardMechanismText(ctx, api, themeColors, 'time', 170, 800, 28, themeColors.muted);
  });
  drawGuardMechanismLabel(
    ctx,
    api,
    themeColors,
    'live-record',
    currentBeat === 1
      ? 'Record captured detector revision AND current authority result'
      : 'Content snapshot cannot move the approval expiry boundary',
    960,
    925,
    31,
    themeColors.cyan,
    'center',
  );
  drawGuardMechanismLabel(
    ctx,
    api,
    themeColors,
    'live-outcome',
    hold ? 'Authority unavailable → effect HELD' : 'Live authority check required',
    1480,
    655,
    30,
    hold ? themeColors.pink : themeColors.yellow,
    'center',
  );
}
export function drawPolicyLiveAuthority(ctx, scene, state, api) {
  const themeColors = api.C,
    currentBeat = state.beat ?? 0,
    beatProgress = state.beatP ?? 0;
  const cueProgress = (id, beat, a, z) => guardCue(state, id, beat, a, z),
    cueDone = (id, beat, a, z) => guardDone(state, id, beat, a, z);
  return paintPolicyLiveAuthority(
    ctx,
    scene,
    state,
    api,
    themeColors,
    currentBeat,
    cueProgress,
    cueDone,
  );
}
export default {
  id: 'policy-live-authority',
  draw: drawPolicyLiveAuthority,
  cues: [
    'policy-live-authority-separate',
    'policy-live-authority-expiry',
    'policy-live-authority-record',
    'policy-live-authority-hold',
  ],
};
