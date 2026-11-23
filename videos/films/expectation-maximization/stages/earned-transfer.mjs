import { constructedFrame } from '../construction.mjs';
import { drawMembership } from '../membership.mjs';
import { priorTransfer } from '../model.mjs';

const quarter = priorTransfer(0.25);
const tenth = priorTransfer(0.1);

export function drawEarnedTransfer(ctx, scene, state, api) {
  const f = constructedFrame(state);
  const changed = f.progress('em-fresh-prior', 2) > 0;
  const first = f.progress('transfer-build', 1);
  if (f.beat >= 4) {
    const { C } = api;
    const left = 290, width = 1340, split = width * tenth.responsibilities[0];
    api.focus.target('request-share', () => {
      api.text(ctx, 'How the model counts this 45 ms request', left, 335, 42, C.ink);
      api.rect(ctx, left, 393, split, 104, C.blue, undefined, 0);
      api.rect(ctx, left + split, 393, width - split, 104, C.pink, undefined, 0);
      tenth.responsibilities.forEach((share, i) => {
        const center = i === 0 ? left + split / 2 : left + (width + split) / 2;
        api.text(ctx, (i === 0 ? 'Fast   ' : 'Slow   ') + (share * 100).toFixed(1) + '%',
          center, 462, 42, C.bg, 'center');
      });
    });
    api.focus.target('request-record', () => {
      api.text(ctx, 'Example request trace', left, 665, 39, C.ink);
      api.rect(ctx, left, 709, width, 137, C.panel, C.muted, 14);
      api.text(ctx, 'duration    45 ms', left + 62, 796, 39, C.ink, 'left', 'mono');
      api.text(ctx, 'cache.status', left + 684, 796, 39, C.ink, 'left', 'mono');
      const recorded = f.completed('transfer-trace', 5);
      api.text(ctx, recorded ? 'HIT' : '?', left + width - 70, 797, 48,
        recorded ? C.green : C.yellow, 'right', 'mono');
    });
    return;
  }
  drawMembership(ctx, api, {
    model: changed ? tenth : quarter,
    slice: f.progress('transfer-slice', 0),
    blue: f.progress('transfer-ratio', 0),
    pinkCopies: changed ? 9 * f.progress('transfer-extend', 3) : 3 * first,
    answer: changed ? f.priorChanged : f.freshRevealed,
    prompt: 'Which component gets more?',
    previous: changed ? quarter : undefined,
    wideShare: true,
  });
}
export default {
  id: 'earned-transfer',
  draw: drawEarnedTransfer,
  cues: [
    'transfer-slice', 'transfer-ratio', 'transfer-predict', 'transfer-build', 'em-fresh-first',
    'em-fresh-prior', 'transfer-extend', 'em-fresh-flip', 'transfer-trace',
  ],
};
