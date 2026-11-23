import { drawArrow, drawBox, drawCenteredText, drawFocusTarget, drawLine } from '../defaults.mjs';
export function drawLostReply(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cueProgress = (id) => (state.cues?.[id] ? api.focus.progress(id, 0) : 0),
    resultComplete = (id) => cueProgress(id) === 1,
    operationProgress = cueProgress('aa-lost-reply-' + currentBeat);
  const paintMechanism = () => {
    const create = currentBeat > 0 || resultComplete('proposal-create'),
      lost = currentBeat === 0 && resultComplete('proposal-lost'),
      replay = currentBeat === 1 && resultComplete('proposal-replay'),
      conflict = currentBeat === 1 && resultComplete('proposal-conflict'),
      changed = currentBeat === 1 && cueProgress('proposal-change-input') > 0;
    drawCenteredText(
      ctx,
      api,
      'Local proposal service · operation-17 · release-bot / R1842 / c1841',
      960,
      280,
      30,
      themeColors.yellow,
    );
    drawBox(
      ctx,
      api,
      changed ? 'New attempt · R2099' : 'Caller request',
      170,
      400,
      420,
      100,
      changed && conflict ? themeColors.pink : themeColors.blue,
    );
    drawBox(ctx, api, 'Durable-contract boundary', 740, 400, 440, 100, themeColors.yellow);
    drawBox(
      ctx,
      api,
      create ? 'RB2041 · proposal exists' : 'No proposal record',
      1300,
      400,
      470,
      100,
      create ? themeColors.green : themeColors.muted,
    );
    drawLine(ctx, api, 600, 450, 730, 450, themeColors.cyan, 4);
    drawLine(ctx, api, 1190, 450, 1290, 450, themeColors.cyan, 4);
    if (changed) {
      drawBox(
        ctx,
        api,
        'release-bot · R2099 · c1841',
        170,
        555,
        660,
        90,
        conflict ? themeColors.pink : themeColors.cyan,
      );
      drawBox(ctx, api, 'RB2041 · R1842 · c1841', 1110, 555, 660, 90, themeColors.green);
      drawCenteredText(ctx, api, 'Attempt: same operation-17', 500, 685, 26, themeColors.muted);
      drawCenteredText(ctx, api, 'Retained accepted record', 1440, 685, 26, themeColors.muted);
      drawArrow(ctx, api, 850, 600, 1090, 600, conflict ? themeColors.pink : themeColors.cyan);
    }
    if (lost) {
      drawLine(ctx, api, 1300, 620, 420, 620, themeColors.pink, 3);
      drawLine(ctx, api, 850, 590, 910, 650, themeColors.pink, 5);
      drawLine(ctx, api, 910, 590, 850, 650, themeColors.pink, 5);
      drawCenteredText(
        ctx,
        api,
        'Reply lost · caller outcome unknown',
        960,
        750,
        33,
        themeColors.pink,
      );
    } else if (changed && !conflict)
      drawCenteredText(
        ctx,
        api,
        'Compare new payload with retained acceptance · pending',
        960,
        770,
        31,
        themeColors.muted,
      );
    else if (replay)
      drawCenteredText(
        ctx,
        api,
        conflict
          ? 'Changed approved payload + same key → conflict'
          : 'Same request + same key → replay RB2041',
        960,
        770,
        34,
        conflict ? themeColors.pink : themeColors.green,
      );
    else
      drawCenteredText(
        ctx,
        api,
        'Request record and reply are different state',
        960,
        740,
        32,
        themeColors.muted,
      );
    if ((currentBeat === 1 && resultComplete('proposal-count')) || currentBeat === 2)
      drawCenteredText(ctx, api, 'Proposal ledger count = 1', 960, 890, 39, themeColors.green);
    if (currentBeat === 2)
      drawCenteredText(
        ctx,
        api,
        'Current authorization checked again · pending outcomes stay unresolved',
        960,
        350,
        28,
        themeColors.yellow,
      );
  };
  drawFocusTarget(ctx, api, 'aa-lost-reply-mechanism', paintMechanism);
}
export default {
  id: 'lost-reply',
  draw: drawLostReply,
  cues: [
    'aa-lost-reply-0',
    'proposal-create',
    'proposal-lost',
    'aa-lost-reply-1',
    'proposal-replay',
    'proposal-change-input',
    'proposal-conflict',
    'proposal-count',
    'aa-lost-reply-2',
  ],
};
