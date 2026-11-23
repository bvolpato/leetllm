const tokens = ['[CLS]', 'open', 'on', 'Sunday', '[SEP]', 'Sunday', 'closed', '[SEP]'];

export function drawJointInput(ctx, scene, state, api) {
  const { C, focus } = api;
  const joined = focus.progress('join-pair', 0);
  const interacting = focus.progress('match-day', 0);
  const pairing = focus.progress('match-hours', 0);
  const pooled = focus.progress('read-cls', 0) === 1;
  const left = 141,
    step = 207,
    width = 181,
    y = 508;
  const center = (i) => left + i * step + width / 2;
  api.text(ctx, 'Question and hours slip    /    schematic token groups', 140, 265, 39, C.muted);
  focus.target('tokens', () => {
    api.text(ctx, 'Question', center(2), 450, 38, C.yellow, 'center');
    api.text(ctx, 'Passage', (center(5) + center(6)) / 2, 450, 38, C.green, 'center');
    for (const [i, token] of tokens.entries()) {
      const special = token.startsWith('[');
      if (special && !joined) continue;
      const color = special ? C.cyan : i < 4 ? C.yellow : C.green;
      api.rect(ctx, left + step * i, y, width, 97, C.panel, color, 7);
      api.text(ctx, token, center(i), y + 63, 38, color, 'center');
    }
    if (joined) api.line(ctx, left, 645, left + (7 * step + width) * joined, 645, C.cyan, 3);
  });
  focus.target('interaction', () => {
    const link = (a, b, height, progress) => {
      if (progress <= 0) return;
      const route = [
        { x: center(a), y: y - 10 },
        { x: center(a), y: height },
        { x: center(b), y: height },
        { x: center(b), y: y - 10 },
      ];
      api.trace(ctx, route, progress, C.blue, 5);
    };
    link(3, 5, 377, interacting);
    link(1, 6, 334, pairing);
  });
  focus.target('vectors', () => {
    if (!joined) {
      api.text(ctx, 'Query vector', center(2), 777, 43, C.yellow, 'center');
      api.text(
        ctx,
        'Indexed passage vector',
        (center(5) + center(6)) / 2,
        777,
        43,
        C.green,
        'center',
      );
      return;
    }
    if (!pooled) api.text(ctx, 'One model input at request time', 960, 790, 45, C.cyan, 'center');
    else {
      api.line(ctx, center(0), 668, center(0), 766, C.cyan, 4);
      api.circle(ctx, center(0), 766, 9, C.cyan);
      api.text(ctx, 'Final [CLS] state for this question and this passage', 140, 865, 46, C.cyan);
    }
  });
}
export default {
  id: 'joint-input',
  draw: drawJointInput,
  cues: ['index-passage', 'join-pair', 'match-day', 'match-hours', 'read-cls'],
};
