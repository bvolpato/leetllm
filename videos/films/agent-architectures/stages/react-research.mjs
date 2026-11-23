import { drawArrow, drawBox, drawCenteredText, drawFocusTarget } from '../defaults.mjs';
export function drawReactResearch(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cueProgress = (id) => (state.cues?.[id] ? api.focus.progress(id, 0) : 0),
    resultComplete = (id) => cueProgress(id) === 1;
  const paintMechanism = () => {
    if (currentBeat === 0) {
      const names = ['Thought', 'Action', 'Observation'];
      const examples = ['Is History open?', 'Read today’s hours', 'Open 13:00 to 18:00'];
      names.forEach((s, i) => {
        drawBox(
          ctx,
          api,
          s,
          240 + i * 540,
          420,
          420,
          100,
          i === 1 ? themeColors.yellow : themeColors.blue,
        );
        if (i < 2) drawArrow(ctx, api, 670 + i * 540, 470, 770 + i * 540, 470, themeColors.muted);
        drawCenteredText(ctx, api, examples[i], 450 + i * 540, 590, 32, themeColors.ink);
      });
      drawCenteredText(
        ctx,
        api,
        'The host records the request and its reply.',
        960,
        710,
        32,
        themeColors.green,
      );
    } else {
      const values = [71, 57, 45, 37, 40, 29.1, 28.7],
        names = [
          'ReAct best',
          'ReAct average',
          'Act best',
          'BUTLER',
          'ReAct',
          'Imitation',
          'Imitation + RL',
        ];
      drawCenteredText(ctx, api, 'ALFWorld · task success', 960, 285, 32, themeColors.yellow);
      values.forEach((v, i) => {
        const first = i < 4,
          x = first ? 230 + i * 395 : 390 + (i - 4) * 540,
          y = first ? 520 : 850,
          known = resultComplete(
            [
              'research-best',
              'research-average',
              'research-act',
              'research-butler',
              'research-webshop',
              'research-imitation',
              'research-rl',
            ][i],
          );
        if (known)
          api.rect(
            ctx,
            x,
            y - v * 2,
            200,
            v * 2,
            i === 0 || i === 4 ? themeColors.green : themeColors.blue,
          );
        drawCenteredText(ctx, api, names[i], x + 100, y + 52, 24, themeColors.muted);
        if (known)
          drawCenteredText(ctx, api, v + '%', x + 100, y - v * 2 - 20, 29, themeColors.cyan);
      });
      drawCenteredText(ctx, api, 'WebShop', 960, 660, 31, themeColors.yellow);
      if (cueProgress('research-act-control') > 0)
        drawCenteredText(
          ctx,
          api,
          'Act control: Action + Observation; explicit Thought removed',
          960,
          350,
          28,
          themeColors.yellow,
        );
    }
  };
  drawFocusTarget(ctx, api, 'aa-react-research-mechanism', paintMechanism);
}
export default {
  id: 'react-research',
  draw: drawReactResearch,
  cues: [
    'aa-react-research-0',
    'aa-react-research-1',
    'research-act-control',
    'research-best',
    'research-average',
    'research-act',
    'research-butler',
    'research-webshop',
    'research-imitation',
    'research-rl',
  ],
};
