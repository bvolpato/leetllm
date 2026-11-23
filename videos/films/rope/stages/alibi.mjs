import { directedCue } from '../construction.mjs';
import { softmax } from '../arithmetic.mjs';

export function drawAlibi(ctx, scene, state, api) {
  const { C, text, line, rect, focus } = api;
  const label = (v, x, y, size, color) => text(ctx, v, x, y, size, color, 'center');
  const cue = (id, b) => directedCue(state, id, b);
  const distance = 1 + Math.round(3 * api.ease(cue('move-key-back', 1)));
  const future = state.beat >= 2;
  const showShares = cue('read-shares', 1) > 0;
  label('Query at 10    ·    Both content logits start at 4 after scaling', 960, 260, 37, C.ink);
  const at = (p) => 270 + (p - 6) * 264;
  focus.target('key-distance', () => {
    line(ctx, at(6), 386, at(11), 386, C.muted, 3);
    for (let p = 6; p <= 11; p++) {
      line(ctx, at(p), 375, at(p), 398, C.muted, 2);
      label(String(p), at(p), 449, 31, C.muted);
    }
    api.circle(ctx, at(10), 386, 12, C.cyan);
    label('Q + self', at(10), 347, 32, C.cyan);
    api.circle(ctx, at(10 - distance), 386, 12, C.yellow);
    label('K', at(10 - distance), 347, 39, C.yellow);
    if (future) {
      api.circle(ctx, at(11), 386, 12, C.red);
      label('future K', at(11), 347, 36, C.red);
    }
  });

  label('Slope', 272, 546, 30, C.muted);
  label('Older key’s logit', 843, 546, 30, C.muted);
  label('Older key’s share vs. self', 1485, 546, 30, C.muted);
  [1 / 2, 1 / 16].forEach((slope, i) => {
    const y = 648 + i * 132,
      color = i === 0 ? C.yellow : C.blue;
    const logit = 4 - slope * distance,
      share = softmax([logit, 4])[0];
    const fraction = '1/' + 1 / slope;
    focus.target('slope-' + i, () => {
      label(fraction, 272, y, 49, color);
      label('4 - ' + distance + ' × ' + fraction + ' = ' + logit.toFixed(2), 843, y, 43, C.ink);
      line(ctx, 1240, y - 12, 1480, y - 12, C.muted, 4);
      if (showShares) rect(ctx, 1240, y - 20, 240 * share, 16, color);
      label(
        showShares ? (100 * share).toFixed(1) + '%' : '?',
        1635,
        y,
        40,
        showShares ? color : C.muted,
      );
    });
  });
  focus.target('future-mask', () => {
    const note = future
      ? 'K at 11    ·    masked logit: -infinity    ·    attention weight 0'
      : state.beat === 0
        ? 'Four positions back: which head gives this key the larger share?'
        : 'Compare each older key with its own self-key at logit 4.';
    label(note, 960, 970, 38, future ? C.red : C.ink);
  });
}
export default {
  id: 'alibi',
  draw: drawAlibi,
  cues: ['compare-slopes', 'move-key-back', 'read-shares', 'mask-future'],
};
