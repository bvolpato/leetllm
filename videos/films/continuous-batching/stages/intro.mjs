import { schedule } from '../model.mjs';
import { cueProgress, drawEstablishedBatchingColor as requestColor } from '../defaults.mjs';

const trace = schedule(true).slice(0, 6);

function drawReplies(ctx, state, api) {
  const { C } = api;
  const second = state.beat === 1 || cueProgress(state, 'finished-seat', 0.23, 0.30) > 0;
  const move = state.beat === 1 ? cueProgress(state, 'admit-replacement', 0.01, 0.18) : 0;
  const third = state.beat === 1 && cueProgress(state, 'generation-boundary', 0.20, 0.32) > 0;
  const step = third ? 3 : second ? 2 : 1;
  const topColor = move === 0 ? C.blue : move === 1 ? C.yellow : undefined;
  api.text(ctx, move > 0 && !third ? 'Between steps' : 'Decode step ' + step, 148, 245, 38, C.ink);
  api.rect(ctx, 148, 285, 1060, 278, C.panel, topColor, 12);
  api.focus.target('intro-readout', () => {
    if (move === 0) api.text(ctx, 'A', 205, 360, 56, C.blue);
    if (move < 1) {
      api.text(ctx, 'Complete this line', 307, 358, 40, C.ink);
      api.text(ctx, 'def add(a, b):', 307, 438, 48, C.muted, 'left', 'mono');
      api.text(ctx, 'return a +', 393, 515, 51, C.ink, 'left', 'mono');
      if (second) api.text(ctx, 'b', 733, 515, 51, C.blue, 'left', 'mono');
      else api.rect(ctx, 730, 464, 6, 59, C.blue, undefined, 0);
      if (second && move === 0) api.text(ctx, 'Finished', 1148, 507, 35, C.blue, 'right');
    } else {
      api.text(ctx, 'Suggest a loop variable', 307, 358, 40, C.ink);
      api.text(ctx, 'Use', 307, 498, 62, C.ink);
      if (third) api.text(ctx, 'i', 442, 498, 62, C.yellow);
    }
    const replies = [
      ['B', 'Explain a test', ['The test', 'The test expects', 'The test expects zero']],
      ['C', 'Plan a change', ['Start', 'Start by', 'Start by adding']],
    ];
    for (const [i, [id, task, words]] of replies.entries()) {
      const y = 613 + i * 167;
      const color = requestColor(ctx, api, id);
      api.rect(ctx, 148, y, 1060, 126, C.panel, color, 10);
      api.text(ctx, id, 205, y + 81, 52, color);
      api.text(ctx, task, 307, y + 78, 36, C.muted);
      api.text(ctx, words[step - 1], 633, y + 81, 44, C.ink);
    }
  });
  api.focus.target('intro-waiting-d', () => {
    if (move === 0) {
      api.text(ctx, 'Ready to decode', 1330, 245, 38, C.muted);
      api.rect(ctx, 1330, 285, 451, 191, C.panel, C.yellow, 12);
      api.text(ctx, 'Suggest a loop variable', 1375, 427, 34, C.ink);
    }
    // The request travels above the replies, then lands in A's seat.
    const p = api.ease(move);
    api.text(ctx, 'D', api.lerp(1375, 205, p), 360 - 145 * Math.sin(Math.PI * p), 56, C.yellow);
  });
}

function drawTrace(ctx, state, api) {
  const { C } = api;
  const ticks = 3 + Math.floor(3 * cueProgress(state, 'intro-six', 0.28, 0.46));
  const x = tick => 556 + tick * 217;
  api.focus.target('intro-readout', () => {
    api.text(ctx, 'Decode step', 180, 288, 38, C.muted);
    for (let tick = 0; tick < 6; tick++)
      api.text(ctx, String(tick + 1), x(tick), 288, 40, tick < ticks ? C.ink : C.muted, 'center');
    for (let seat = 0; seat < 3; seat++) {
      const y = 407 + seat * 163;
      api.text(ctx, 'Seat ' + (seat + 1), 180, y + 15, 43, C.ink);
      api.line(ctx, 455, y + 70, 1755, y + 70, C.muted, 1);
      for (let tick = 0; tick < ticks; tick++) {
        const entry = trace[tick].slots[seat];
        const color = requestColor(ctx, api, entry.id);
        api.rect(ctx, x(tick) - 82, y - 50, 164, 100, C.panel, color, 8);
        api.text(ctx, entry.id + '·' + entry.generated, x(tick), y + 17, 46, color, 'center');
      }
    }
    api.text(ctx, 'One mark per additional decode token', 960, 940, 39, C.muted, 'center');
  });
}

export function drawIntro(ctx, scene, state, api) {
  api.focus.target('intro-mechanism', () => {
    if (state.beat === 2) drawTrace(ctx, state, api);
    else drawReplies(ctx, state, api);
  });
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['mixed-requests', 'finished-seat', 'admit-replacement', 'generation-boundary', 'three-seats', 'intro-six'],
};
