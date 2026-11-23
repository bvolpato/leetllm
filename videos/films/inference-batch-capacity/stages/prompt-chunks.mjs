import { sceneClock } from '../clock.mjs';

const promptLength = 10;
const capacity = 6;
const replies = 2;
const perStep = capacity - replies;
const pitch = 136;
const cellWidth = 120;
const cellHeight = 81;
const queueX = 370;
const scheduleX = 575;
const stepY = (i) => 548 + 136 * i;

export function drawPromptChunks(ctx, scene, state, api) {
  const { C, focus } = api;
  const clock = sceneClock(scene, state);
  const moves = ['first', 'second', 'third'].map(clock.progress);
  const spent = moves.map((p, step) =>
    Math.floor(p * Math.min(perStep, promptLength - step * perStep)),
  );
  const label = (s, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);
  function tile(x, y, value, fill) {
    api.rect(ctx, x, y, cellWidth, cellHeight, fill ?? C.panel, fill ?? C.muted, 5);
    if (value) label(value, x + cellWidth / 2, y + 56, 40, C.bg, 'center');
  }

  focus.target('prompt-queue', () => {
    label('New prompt', 135, 330, 38, C.cyan);
    const arrived = Math.ceil(promptLength * clock.progress('arrival'));
    for (let i = 0; i < promptLength; i++) {
      const waiting = i < arrived && i % perStep >= spent[Math.floor(i / perStep)];
      tile(queueX + i * pitch, 275, waiting ? String(i + 1) : '', waiting ? C.cyan : null);
    }
  });

  focus.target('schedule', () => {
    label('Replies A and B each need one token', 135, 455, 41, C.blue);
    label('6 slots per step', 1400, 455, 39, C.ink, 'right');
    for (let i = 0; i < moves.length; i++) {
      if (i > 0 && moves[i] === 0) continue;
      const y = stepY(i);
      label('Step ' + (i + 1), 265, y + 55, 42);
      const active = i === 0 ? clock.progress('budget') : moves[i];
      for (let j = 0; j < capacity; j++) {
        const x = scheduleX + j * pitch;
        if (j < replies) {
          const filled = i === 0 ? j < Math.ceil(active * replies) : true;
          tile(x, y, filled ? ['A', 'B'][j] : '', filled ? C.blue : null);
          if (!filled) label(['A', 'B'][j], x + cellWidth / 2, y + 56, 40, C.blue, 'center');
        } else {
          const pos = j - replies;
          const filled = pos < spent[i];
          tile(x, y, filled ? String(i * perStep + pos + 1) : '', filled ? C.cyan : null);
        }
      }
    }
  });
}
export default { id: 'prompt-chunks', draw: drawPromptChunks };
