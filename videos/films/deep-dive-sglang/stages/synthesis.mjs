import { settled } from '../construction.mjs';
import { line, slot, text } from '../defaults.mjs';

const expected = 'feature';
const replies = ['{"label":"bug"}', '{"label":"feature"}'];

export function drawSynthesis(ctx, scene, state, api) {
  const { C } = api;
  const showShape = settled(state, 'synthesis-parse', 0, 0.72);
  const compared = settled(state, 'synthesis-compare', 1, 0.57);
  api.focus.target('synthesis-ticket', () => {
    text(ctx, api, 'R42   ·   Add dark mode to settings', 155, 309, 49, C.ink);
    text(ctx, api, 'Expected category for this ticket: feature', 155, 393, 35, C.yellow);
  });
  text(ctx, api, 'Complete reply', 155, 544, 34, C.muted);
  text(ctx, api, 'Schema', 984, 544, 34, C.muted);
  text(ctx, api, 'Ticket check', 1408, 544, 34, C.muted);
  for (const [i, reply] of replies.entries()) {
    const record = JSON.parse(reply);
    const label = record.label;
    const y = 593 + 169 * i;
    api.focus.target('synthesis-reply', () => slot(ctx, api, reply, 155, y, 660, 98, C.blue, 44));
    line(ctx, api, 833, y + 49, 961, y + 49, C.muted, 3);
    api.focus.target('synthesis-schema', () => {
      const valid =
        Object.keys(record).length === 1 && ['bug', 'feature', 'question'].includes(label);
      slot(
        ctx,
        api,
        showShape ? (valid ? 'Valid' : 'Invalid') : 'Unchecked',
        981,
        y,
        300,
        98,
        showShape ? C.cyan : C.muted,
      );
    });
    api.focus.target('synthesis-meaning', () => {
      const correct = expected === label;
      slot(
        ctx,
        api,
        compared ? (correct ? 'Accept' : 'Review') : 'Unchecked',
        1405,
        y,
        340,
        98,
        compared ? (correct ? C.green : C.pink) : C.muted,
        38,
      );
    });
  }
  text(ctx, api, 'Two example replies to the same ticket', 960, 975, 33, C.muted, 'center');
}

export default {
  id: 'synthesis',
  draw: drawSynthesis,
  cues: ['synthesis-output', 'synthesis-parse', 'synthesis-compare'],
};
