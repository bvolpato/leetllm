import { sigmoid } from '../arithmetic.mjs';
import { fittedWeights, openingRequest, roundedScore } from '../fixtures.mjs';
import { mix, progress, smooth } from '../construction.mjs';
import { M, T, line, mark } from '../defaults.mjs';
import { dotProduct, sampleFunction } from 'vizmatic';

const fittedLogit = dotProduct(fittedWeights, [1, openingRequest.a, openingRequest.s]);
export function drawSigmoid(ctx, scene, state, api) {
  const q = api.teaching.axes({
    x: 210,
    y: 340,
    width: 1000,
    height: 470,
    xDomain: [-6, 7],
    yDomain: [0, 1.05],
    xTicks: [-4, -1, 0, 1, 4, 6],
    yTicks: [0, 0.5, 1],
    xLabel: 'logit z',
    yLabel: 'score p',
  });
  const center = progress(state, 'sigmoid-center', 0),
    tail = progress(state, 'sigmoid-tail', 1),
    currentBeat = state.beat ?? 0;
  api.teaching.curve({
    plot: q,
    points: sampleFunction(sigmoid, -6, 7, 180),
    color: api.C.cyan,
    width: 4,
  });
  const probe = (id, a, z, p, color) => {
    const x = mix(a, z, smooth(p)),
      from = q.point(a, sigmoid(a)),
      to = q.point(x, sigmoid(x));
    mark(api, id, () => {
      line(
        ctx,
        api,
        [
          from,
          {
            x: to.x,
            y: from.y,
          },
          to,
        ],
        color,
        4,
      );
      api.circle(ctx, to.x, to.y, 11, color);
      if (p === 1) {
        line(
          ctx,
          api,
          [
            {
              x: to.x + 20,
              y: from.y,
            },
            {
              x: to.x + 20,
              y: to.y,
            },
          ],
          color,
          4,
        );
      }
    });
  };
  probe('sigmoid-center-probe', -1, 1, center, api.C.yellow);
  if (currentBeat > 0 || tail > 0) probe('sigmoid-tail-probe', 4, 6, tail, api.C.pink);
  else
    mark(api, 'sigmoid-tail-probe', () =>
      api.circle(ctx, ...Object.values(q.point(4, sigmoid(4))), 9, api.C.pink),
    );
  T(ctx, api, 'Equal score step: Δz = 2', 1550, 355, 31, api.C.muted);
  T(
    ctx,
    api,
    center === 1 ? 'center: probability +0.462' : 'center: probability change ?',
    1550,
    435,
    31,
    api.C.yellow,
  );
  if (tail === 1) T(ctx, api, 'tail: probability +0.016', 1550, 515, 31, api.C.pink);
  else T(ctx, api, 'tail: probability change ?', 1550, 515, 31, api.C.pink);
  const rp = progress(state, 'request-probability', 1),
    fullFit = api.focus.progress('full-fit-score', 0) === 1,
    logit = fullFit ? fittedLogit : roundedScore,
    requestPoint = q.point(logit, sigmoid(logit)),
    travel = smooth(rp);
  api.circle(
    ctx,
    mix(1510, requestPoint.x, travel),
    mix(600, requestPoint.y, travel),
    13,
    api.C.cyan,
  );
  if (rp === 1) {
    T(ctx, api, openingRequest.id, requestPoint.x + 170, requestPoint.y - 45, 27, api.C.cyan);
    line(ctx, api, [q.point(logit, 0), requestPoint], api.C.cyan, 2);
  }
  mark(api, 'request-probability', () => {
    T(ctx, api, 'Rounded weights', 1550, 630, 30, api.C.muted);
    M(
      ctx,
      api,
      rp === 1 ? '\\sigma(0.500)\\approx' + sigmoid(roundedScore).toFixed(3) : '\\sigma(0.500)=\\,?',
      1550,
      696,
      40,
      api.C.cyan,
    );
    if (fullFit) {
      T(ctx, api, 'Full fitted weights', 1550, 771, 30, api.C.muted);
      M(
        ctx,
        api,
        '\\sigma(' + fittedLogit.toFixed(3) + ')\\approx' + openingRequest.p.toFixed(3),
        1550,
        837,
        40,
        api.C.cyan,
      );
    }
  });
  if (currentBeat === 2)
    mark(api, 'log-odds-definition', () => T(ctx, api, 'z = ln[p/(1 − p)]', 960, 940, 43));
  else mark(api, 'log-odds-definition', () => M(ctx, api, 'p=1/(1+e^{-z})', 960, 940, 43));
}
export default {
  id: 'sigmoid',
  draw: drawSigmoid,
  cues: ['sigmoid-center', 'sigmoid-tail', 'request-probability', 'full-fit-score', 'logit-definition'],
};
