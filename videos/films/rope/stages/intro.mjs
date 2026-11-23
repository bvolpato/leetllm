import { directedCue } from '../construction.mjs';
import { contentOutputs } from '../model.mjs';

const words = ['dogs', 'chase', 'cats'];
const columns = [550, 1060, 1570];
const dogValue = contentOutputs[0][0].toFixed(3);

function shiftedSentence(ctx, state, api) {
  const { C, text, line, circle } = api;
  const shift = 8 * api.ease(directedCue(state, 'move-sentence', 2));
  const at = (position) => 210 + (position - 3) * 150;
  const label = (value, x, y, size, color) => text(ctx, value, x, y, size, color, 'center');
  api.focus.target('sentence-positions', () => {
    line(ctx, at(3), 650, at(13), 650, C.muted, 3);
    for (let p = 3; p <= 13; p++) {
      line(ctx, at(p), 638, at(p), 664, C.muted, 3);
      label(String(p), at(p), 729, 37, C.muted);
    }
    const left = at(3 + shift);
    const right = at(5 + shift);
    line(ctx, left, 425, right, 425, C.pink, 5);
    for (const x of [left, right]) line(ctx, x, 412, x, 447, C.pink, 5);
    label('2 places', (left + right) / 2, 383, 47, C.pink);
    ['cats', 'chase', 'dogs'].forEach((word, i) => {
      const color = [C.yellow, C.ink, C.cyan][i];
      const x = at(3 + shift + i);
      label(word, x, 567, 46, color);
      circle(ctx, x, 650, 13, color);
    });
  });
  label('Logical token position', 960, 869, 40, C.ink);
}

export function drawIntro(ctx, scene, state, api) {
  const { C, text, line, focus, components } = api;
  if (state.beat >= 2) return shiftedSentence(ctx, state, api);
  const t = state.t ?? 0;
  if (t < 0.35) ctx.globalAlpha = 1;
  const swap = api.clamp((t + 0.12) / 2.35);
  const lift = Math.sin(Math.PI * swap);
  const answer = directedCue(state, 'dogs-output', 1);
  const colors = [C.cyan, C.ink, C.yellow];
  const label = (value, x, y, size, color) => text(ctx, value, x, y, size, color, 'center');

  text(ctx, 'First pass', 100, 282, 37, C.muted);
  words.forEach((word, i) => label(word, columns[i], 291, 54, colors[i]));
  focus.target('output-row', () => {
    label(dogValue, columns[0], 394, 72, C.cyan);
    label('first output coordinate', columns[0], 440, 29, C.muted);
  });

  text(ctx, 'After swap', 100, 670, 37, C.muted);
  words.forEach((word, i) => {
    const x = api.lerp(columns[i], columns[2 - i], swap);
    const y = 650 + (i - 1) * 151 * lift;
    focus.target(i === 1 ? 'verb' : 'nouns', () => {
      if (i === 1) {
        label(word, x, y + 25, 70, C.ink);
      } else {
        components.card({
          id: 'moving-' + word,
          label: word,
          x: x - 153,
          y: y - 53,
          width: 306,
          height: 106,
          fontSize: 68,
          radius: 15,
          fill: colors[i],
          textColor: C.bg,
        });
      }
    });
  });
  focus.target('output-row', () => {
    if (answer === 0) {
      label('Where does ' + dogValue + ' go?', columns[1], 900, 49, C.ink);
      for (const x of [columns[0], columns[2]]) {
        label('?', x, 901, 58, C.muted);
        line(ctx, x - 96, 925, x + 96, 925, C.muted, 3);
      }
    } else {
      const y = api.lerp(794, 901, api.ease(answer));
      label(dogValue, columns[2], y, 72, C.cyan);
    }
  });
  label('All three words visible   ·   No position signal', 960, 1020, 34, C.muted);
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['swap-nouns', 'mark-output', 'track-output', 'dogs-output', 'move-sentence'],
};
