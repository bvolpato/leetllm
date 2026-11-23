import { mtEvent } from '../construction.mjs';
import { multiTenantConstructionModel } from '../model.mjs';
import {
  drawConstructionBox,
  drawConstructionCenter,
  drawConstructionFoot,
  drawConstructionLine,
  drawConstructionPacket,
  withConstructionFocus,
} from '../defaults.mjs';
export function drawRolloutAndStreams(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = multiTenantConstructionModel('rollout-and-streams', state),
    currentBeat = modelState.b,
    ev = (beat, sentence) => mtEvent('rollout-and-streams', state, beat, sentence);
  withConstructionFocus(ctx, api, 'rollout-and-streams', () => {
    if (currentBeat === 0) {
      drawConstructionBox(
        ctx,
        api,
        'Old request A-1\n' + modelState.old,
        130,
        335,
        760,
        150,
        themeColors.blue,
        33,
      );
      drawConstructionBox(
        ctx,
        api,
        'New request A-2\n' + modelState.next,
        1030,
        335,
        760,
        150,
        themeColors.cyan,
        33,
      );
      ['old history', 'old cache namespace', 'old references'].forEach((v, i) =>
        drawConstructionBox(ctx, api, v, 160, 565 + i * 125, 690, 90, themeColors.blue, 29),
      );
      if (modelState.newRouting)
        ['new history', 'new cache namespace', 'new references'].forEach((v, i) =>
          drawConstructionBox(ctx, api, v, 1060, 565 + i * 125, 690, 90, themeColors.cyan, 29),
        );
      drawConstructionCenter(
        ctx,
        api,
        'Routing changes new work; A-1 retains the state it began with',
        960,
        985,
        29,
        themeColors.yellow,
      );
    } else if (currentBeat === 1) {
      drawConstructionBox(
        ctx,
        api,
        'Production request\nprivate data stays scoped',
        170,
        420,
        650,
        150,
        themeColors.blue,
        31,
      );
      drawConstructionBox(
        ctx,
        api,
        modelState.shadowAuthorized
          ? 'Approved shadow destination'
          : 'Shadow destination not yet authorized',
        1100,
        420,
        650,
        150,
        modelState.shadowAuthorized ? themeColors.green : themeColors.muted,
        31,
      );
      drawConstructionLine(
        ctx,
        api,
        950,
        355,
        950,
        775,
        modelState.shadowAuthorized ? themeColors.green : themeColors.pink,
        6,
      );
      if (modelState.shadowAuthorized)
        drawConstructionPacket(
          ctx,
          api,
          'rollout-and-streams',
          'authorized copy',
          180,
          700,
          1110,
          700,
          ev(1),
          themeColors.cyan,
          440,
          85,
        );
      drawConstructionCenter(
        ctx,
        api,
        'Quota policy + compute consumption remain explicit',
        960,
        945,
        32,
        themeColors.yellow,
      );
    } else {
      drawConstructionCenter(
        ctx,
        api,
        'Already delivered prefix · pinned state S2',
        960,
        285,
        34,
        themeColors.yellow,
      );
      drawConstructionBox(ctx, api, 'seq 101: token a', 160, 415, 700, 100, themeColors.blue, 32);
      drawConstructionBox(ctx, api, 'seq 102: token b', 1060, 415, 700, 100, themeColors.blue, 32);
      drawConstructionBox(
        ctx,
        api,
        'Fresh restart: x, y',
        160,
        670,
        700,
        110,
        themeColors.pink,
        32,
      );
      drawConstructionLine(ctx, api, 960, 600, 960, 850, themeColors.pink, 6);
      drawConstructionBox(
        ctx,
        api,
        modelState.resumeOrError
          ? 'Resume requires S2 + next seq 103\notherwise partial-result error'
          : 'No silent append to a, b',
        1060,
        635,
        700,
        180,
        themeColors.yellow,
        30,
      );
      drawConstructionCenter(
        ctx,
        api,
        modelState.liveRefs
          ? 'Reference stays live until execution retires'
          : 'Execution retired → state reference may retire',
        960,
        950,
        31,
        modelState.liveRefs ? themeColors.yellow : themeColors.green,
      );
    }
    drawConstructionFoot(
      ctx,
      api,
      'Readiness is separate from quality and isolation; retries preserve ownership and stream identity',
    );
  });
}
export default {
  id: 'rollout-and-streams',
  draw: drawRolloutAndStreams,
  cues: [
    'mt-rollout-and-streams-b0',
    'mt-rollout-and-streams-s0-0',
    'mt-rollout-and-streams-s0-1',
    'mt-rollout-and-streams-b1',
    'mt-rollout-and-streams-s1-1',
    'mt-rollout-and-streams-b2',
    'mt-rollout-and-streams-s2-0',
    'mt-rollout-and-streams-s2-1',
    'mt-rollout-and-streams-s2-2',
    'mt-rollout-and-streams-s2-3',
  ],
};
