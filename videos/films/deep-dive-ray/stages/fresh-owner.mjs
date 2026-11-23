import { chapterCard, text } from '../defaults.mjs';
import { drawLedger, fortyTwo, motion, passed, replayFortyOne, results } from '../ledger.mjs';
import { rayObjectLoss } from '../model.mjs';

export function drawFreshOwner(ctx, scene, state, api) {
  const { C } = api;
  const dead = passed(state, 'fresh-driver-dies', 0);
  const ownerKnown = passed(state, 'ray-fresh-owner-error', 1);
  const receiptKnown = passed(state, 'ray-fresh-batch-result', 1);
  const lookup = motion(state, 'fresh-lookup', 1);
  const newHandle = passed(state, 'ray-fresh-newref', 2);
  const work = motion(state, 'fresh-recompute', 2);
  const loss = rayObjectLoss({ ownerAlive: !dead, copies: 1, lineage: true });
  const tuple = '(' + results[1].join(', ') + ')';

  text(ctx, api, 'Result for “router”', 132, 264, 45);
  api.focus.target('fresh-link', () => {
    chapterCard(ctx, api, 'Handle X', 140, 319, 270, C.cyan, 94, 38);
    chapterCard(
      ctx,
      api,
      dead ? 'Driver D offline' : 'Owner D',
      660,
      319,
      268,
      dead ? C.pink : C.cyan,
      94,
      32,
    );
    if (dead) {
      api.line(ctx, 427, 366, 502, 366, C.muted, 4);
      api.line(ctx, 568, 366, 642, 366, C.muted, 4);
      api.line(ctx, 520, 353, 548, 380, C.pink, 5);
      api.line(ctx, 520, 380, 548, 353, C.pink, 5);
    } else api.arrow(ctx, 427, 366, 642, 366, C.cyan, 3);
  });
  text(ctx, api, 'Node B · X bytes survive', 145, 510, 35, C.muted);
  text(ctx, api, tuple, 916, 515, 45, C.green, 'right');
  api.focus.target('fresh-old-answer', () => {
    api.line(ctx, 140, 574, 927, 574, C.muted, 2);
    if (ownerKnown) text(ctx, api, 'get(X): ' + loss.status, 145, 648, 42, C.pink);
    else {
      text(ctx, api, 'get(X)', 145, 648, 38, C.ink);
      text(ctx, api, '?', 917, 648, 48, C.yellow, 'right');
    }
  });

  drawLedger(ctx, api, {
    x: 1045,
    y: 220,
    w: 728,
    ledger: fortyTwo.ledger,
    restoredBatch: 'B41',
    selected: lookup > 0 ? 'B41' : undefined,
    rowTarget: 'fresh-receipt-row',
  });
  api.focus.target('fresh-reply', () => {
    if (receiptKnown) {
      text(
        ctx,
        api,
        'replay(B41):' + replayFortyOne.result + ' · no increment',
        1060,
        823,
        39,
        C.green,
      );
      text(
        ctx,
        api,
        'Ledger count stays ' + replayFortyOne.ledger.count,
        1750,
        904,
        34,
        C.green,
        'right',
      );
    } else {
      text(ctx, api, 'Replay B41', 1060, 823, 40);
      text(ctx, api, '?', 1750, 823, 47, C.yellow, 'right');
    }
  });
  if (receiptKnown) {
    api.path(
      ctx,
      [
        { x: 1781, y: 513 },
        { x: 1830, y: 513 },
        { x: 1830, y: 809 },
        { x: 1797, y: 809 },
      ],
      { color: C.yellow, width: 3 },
    );
    api.arrow(ctx, 1797, 809, 1769, 809, C.yellow, 3);
  }
  if (state.beat === 2) {
    api.focus.target('fresh-new-work', () => {
      text(ctx, api, 'Supervisor S submits “router”', 145, 754, 35, C.blue);
      if (work < 1) {
        api.line(ctx, 150, 844, 915, 844, C.muted, 2);
        api.circle(ctx, 163 + work * 720, 844, 10, C.blue);
      } else
        chapterCard(
          ctx,
          api,
          newHandle ? 'New handle Y   ·   owner S' : 'New call submitted',
          265,
          800,
          563,
          newHandle ? C.green : C.blue,
          90,
          34,
        );
    });
  }
  if (state.beat === 1) {
    const prompt = ownerKnown
      ? 'Old X stays unavailable. Look up the batch separately.'
      : 'What does each caller receive?';
    text(ctx, api, prompt, 960, 988, 37, C.ink, 'center');
  }
}
export default {
  id: 'fresh-owner',
  draw: drawFreshOwner,
  cues: [
    'fresh-driver-dies',
    'fresh-ask',
    'ray-fresh-owner-error',
    'fresh-lookup',
    'ray-fresh-batch-result',
    'fresh-recompute',
    'ray-fresh-newref',
    'fresh-finish',
  ],
};
