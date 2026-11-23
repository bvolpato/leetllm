import { motion, spoken } from '../construction.mjs';
import { text, upgradeBox } from '../defaults.mjs';

function draw(ctx, scene, state, api) {
  const { C } = api;
  text(ctx, api, 'T102   /   Approved response', 180, 300, 33, C.muted);
  text(ctx, api, '“Open a rotation ticket for security review.”', 960, 420, 60, C.ink, 'center');
  api.focus.target('demo-pieces', () => {
    const spread = motion(state, 'reply-pieces', 0, 0.4, 0.75);
    const ending = spoken(state, 'demo-end', 1, 0.59);
    const pieces = ['open', 'ticket', ending ? 'END' : '?'];
    pieces.forEach((piece, i) => {
      if (i === 2 ? spread < 1 : spread <= i / 2) return;
      const x = 495 + i * 465;
      if (i < 2 || ending) api.line(ctx, x, 595, x, 685, i === 2 ? C.yellow : C.green, 3);
      upgradeBox(ctx, api, piece, x - 183, 697, 366, 115, i === 2 ? C.yellow : C.green, 48);
    });
    api.line(ctx, 310, 588, 1143, 588, C.green, 4);
    text(ctx, api, 'Reply text', 725, 558, 34, C.green, 'center');
    if (ending) {
      text(ctx, api, 'Turn boundary', 1425, 558, 34, C.yellow, 'center');
      api.line(ctx, 1240, 588, 1610, 588, C.yellow, 4);
    }
    text(ctx, api, 'Symbols for this example', 960, 941, 31, C.muted, 'center');
  });
}

export default {
  id: 'intro',
  draw: draw,
  cues: ['reply-pieces', 'demo-end'],
};
