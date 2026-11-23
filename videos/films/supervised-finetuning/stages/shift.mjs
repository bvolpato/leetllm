import { spoken } from '../construction.mjs';
import { TOKENS } from '../fixtures.mjs';
import { inputStrip, labelStrip, predictionArrow, tokenX } from '../token-strip.mjs';
import { text } from '../defaults.mjs';

function draw(ctx, scene, state, api) {
  const { C } = api;
  api.focus.target('token-input', () => inputStrip(ctx, api, { mark: 5 }));
  api.focus.target('shift-trace', () => {
    labelStrip(
      ctx,
      api,
      TOKENS.map((v, i) => (i ? v : '·')),
      635,
      'Observed target at this position',
    );
    const links = ['first-link', 'ticket-link', 'end-link'].filter((id, i) =>
      spoken(state, id, 1, [0.15, 0.52, 0.75][i]),
    ).length;
    for (let i = 0; i < links; i++) predictionArrow(ctx, api, 5 + i);
    if (links === 0) {
      text(ctx, api, '?', tokenX(5), 575, 52, C.yellow, 'center');
      text(ctx, api, 'Which position predicts open?', 960, 920, 48, C.ink, 'center');
    } else {
      const predictor = 3 + links;
      const msg =
        state.beat === 2
          ? 'Predictor rows  4, 5, 6     →     label positions  5, 6, 7'
          : 'Row ' +
            predictor +
            ' sees ' +
            TOKENS[predictor] +
            '   →   predicts ' +
            TOKENS[predictor + 1];
      text(ctx, api, msg, 960, 920, 42, C.ink, 'center');
    }
  });
}

export default {
  id: 'shift',
  draw: draw,
  cues: ['query-open', 'first-link', 'ticket-link', 'end-link', 'check-shift'],
};
