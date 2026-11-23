import { sampleModel, serialize } from '../model.mjs';
import { completed, firstDifference, movement } from '../replay.mjs';
import { ruler, slot } from '../strips.mjs';

const reference = serialize(0);
const duplicate = serialize(2);
const mismatch = firstDifference(reference.ids, duplicate.ids);
const start = 282;
const width = 151;

export function drawChat(ctx, scene, state, api) {
  const { C } = api;
  const { offset, removal } = sampleModel('chat', state);
  const diagnosis = completed(state, 2, 'chat-first') && removal === 0;
  api.focus.target('chat-strips', () => {
    api.text(ctx, '“Why do birds sing?”', 100, 266, 65, C.ink, 'left', 'serif');
    api.text(ctx, 'Illustrative token IDs', 1780, 264, 30, C.muted, 'right');
    ruler(ctx, api, start, 358, width, duplicate.ids.length);
    const cell = (word, id, column, y, color) =>
      slot(ctx, api, {
        x: start + column * width,
        y,
        width,
        word,
        detail: 'ID ' + id,
        color,
        height: 123,
        size: word === 'assistant' ? 27 : 32,
      });
    api.text(ctx, 'Approved', 100, 455, 33, C.blue);
    api.text(ctx, 'Candidate', 100, 681, 33, C.cyan);
    reference.words.forEach((word, i) => {
      cell(word, reference.ids[i], i, 389, diagnosis && i === mismatch ? C.yellow : C.blue);
      cell(
        word,
        reference.ids[i],
        i + offset,
        615,
        diagnosis && i + offset === mismatch ? C.yellow : C.cyan,
      );
    });
    // Move the repeated BEGIN in vertically only after the existing row has made room.
    if (offset > 0.96) {
      const lift = (1 - offset) / 0.04;
      cell(duplicate.words[0], duplicate.ids[0], 0, 615 - 98 * lift, C.pink);
    }
    if (state.beat === 0) {
      const from = movement(state, 0, 'chat-end') > 0 ? 7 : 2;
      const to = from === 7 ? 9 : 6;
      if (movement(state, 0, 'chat-words') > 0) {
        api.line(ctx, start + from * width + 3, 787, start + to * width - 12, 787, C.yellow, 4);
        api.text(
          ctx,
          from === 7 ? 'Assistant prefix' : 'User’s words',
          start + ((from + to) * width) / 2,
          844,
          33,
          C.yellow,
          'center',
        );
      }
    } else if (diagnosis) {
      const cx = start + (mismatch + 0.5) * width - 3;
      api.line(ctx, cx, 519, cx, 605, C.yellow, 4);
      api.text(ctx, 'First difference', 100, 865, 37, C.yellow);
      api.text(ctx, 'Position ' + mismatch + '     user  /  BEGIN', 490, 865, 43, C.ink);
    } else if (state.beat === 2 && removal > 0) {
      api.text(ctx, 'Separate tokenization', 100, 854, 32, C.muted);
      api.text(ctx, 'add_special_tokens=False', 530, 854, 45, C.cyan, 'left', 'mono');
      if (completed(state, 2, 'chat-equality'))
        api.text(ctx, 'All ' + reference.ids.length + ' IDs match', 530, 942, 43, C.green);
    } else {
      api.text(ctx, 'Separate tokenization', 100, 855, 33, C.muted);
      api.text(ctx, 'Template rendering  +  one leading BEGIN', 530, 855, 40, C.ink);
    }
  });
}

export default {
  id: 'chat',
  draw: drawChat,
  cues: [
    'chat-words',
    'chat-end',
    'chat-insert',
    'chat-compare',
    'chat-first',
    'chat-remove',
    'chat-equality',
  ],
};
