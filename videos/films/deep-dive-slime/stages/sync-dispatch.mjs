import { sampleSlimeChapter } from '../construction.mjs';
import {
  drawSlimeNote,
  drawSlimeRule,
  drawSlimeTile,
  drawSlimeTitle,
  drawSlimeWire,
} from '../defaults.mjs';
export function drawSyncDispatch(ctx, scene, state, api) {
  return api.focus.target('sl-sync-dispatch-mechanism', () =>
    paintSyncDispatch(ctx, scene, state, api),
  );
}
function paintSyncDispatch(ctx, scene, state, api) {
  const modelState = sampleSlimeChapter('sync-dispatch', state),
    currentBeat = modelState.b;
  const { C: themeColors } = api;
  {
    drawSlimeTitle(ctx, api, 'The selected branch determines the actual carrier');
    const cases = [
      ['delta + disk + separate', 'delta disk'],
      ['full + disk', 'full disk'],
      ['full + colocated', 'tensor handles'],
      ['full + separate + no disk', 'NCCL chunks'],
    ];
    cases.forEach(([a, z], i) => {
      const active = i === modelState.mode,
        y = 365 + i * 130;
      drawSlimeTile(
        ctx,
        api,
        a,
        180,
        y,
        790,
        active ? themeColors.yellow : themeColors.muted,
        80,
        30,
      );
      drawSlimeTile(
        ctx,
        api,
        active && !modelState.outcomeReady ? 'follow branch' : z,
        1290,
        y,
        450,
        active ? themeColors.cyan : themeColors.muted,
        80,
        31,
      );
      drawSlimeWire(
        ctx,
        api,
        970,
        y + 40,
        1290,
        y + 40,
        active ? modelState.progress : 0,
        themeColors.cyan,
      );
    });
    drawSlimeRule(
      ctx,
      api,
      currentBeat === 1
        ? 'An NCCL flag can still select tensor handles under colocation'
        : currentBeat === 2
          ? 'Verify destination membership and the live transition independently'
          : modelState.outcomeReady
            ? `Resolved carrier: ${modelState.carrier}`
            : 'Resolve mode, disk transport and placement together',
      950,
      themeColors.yellow,
      31,
    );
    drawSlimeNote(
      ctx,
      api,
      'Delta rejects colocation · transfer carriers do not retain optimizer checkpoints',
    );
    return;
  }
}
export default {
  id: 'sync-dispatch',
  draw: drawSyncDispatch,
  cues: [
    'sl-sync-dispatch-b0-operation',
    'sl-sync-dispatch-b0-s0',
    'sl-sync-dispatch-b0-s1',
    'sl-sync-dispatch-b0-s2',
    'sl-sync-dispatch-b0-s3',
    'sl-sync-dispatch-b1-operation',
    'sl-sync-dispatch-b1-s0',
    'sl-sync-dispatch-b1-s1',
    'sl-sync-dispatch-b1-s2',
    'sl-sync-dispatch-b1-s3',
    'sl-sync-dispatch-b2-operation',
    'sl-sync-dispatch-b2-s0',
    'sl-sync-dispatch-b2-s1',
    'sl-sync-dispatch-b2-s2',
  ],
};
