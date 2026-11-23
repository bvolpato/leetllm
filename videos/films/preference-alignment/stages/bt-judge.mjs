import { sigmoid } from '../arithmetic.mjs';
import { progress, heard } from '../clock.mjs';

export function drawBtJudge(ctx, scene, state, api) {
  const { C, teaching } = api;
  const swapped = progress(state, 'judge-flip', 2);
  const ticket = 1.8 - 1.1 * swapped,
    grant = 0.7 + 1.1 * swapped;
  const gap = ticket - grant,
    p = sigmoid(gap);
  const showPoint = heard(state, 'judge-prediction', 1);
  api.focus.target('judge-scores', () => {
    api.text(ctx, 'Judge’s reward scores', 135, 280, 38, C.ink);
    api.text(ctx, 'Ticket', 135, 423, 43, C.green);
    api.text(ctx, ticket.toFixed(1), 575, 423, 47, C.green, 'right');
    api.text(ctx, 'Direct grant', 135, 530, 43, C.blue);
    api.text(ctx, grant.toFixed(1), 575, 530, 47, C.blue, 'right');
    api.text(
      ctx,
      'Gap   ' + (gap >= 0 ? '+' : '−') + Math.abs(gap).toFixed(1),
      135,
      686,
      54,
      C.ink,
    );
  });
  api.focus.target('judge-plot', () => {
    api.text(ctx, 'Chance of the ticket winning', 865, 280, 38, C.ink);
    const plot = teaching.axes({
      x: 890,
      y: 360,
      width: 770,
      height: 340,
      xDomain: [-3, 3],
      yDomain: [0, 1],
      xTicks: [-3, -2, -1, 0, 1, 2, 3],
      yTicks: [0, 0.5, 1],
      fontSize: 28,
    });
    const points = Array.from({ length: 121 }, (_, i) => {
      const x = -3 + i / 20;
      return { x, y: sigmoid(x) };
    });
    teaching.curve({ plot, points, color: C.blue, width: 5, progress: 1 });
    if (showPoint) {
      teaching.scatter({ plot, points: [{ x: gap, y: p, color: C.yellow, radius: 13 }] });
      const at = plot.point(gap, p);
      api.text(ctx, (p * 100).toFixed(1) + '%', at.x - 34, at.y - 28, 35, C.yellow, 'right');
    }
    api.text(ctx, 'Ticket score minus grant score', 1275, 811, 30, C.muted, 'center');
  });
  api.focus.target('judge-result', () => {
    const knownLoss =
      swapped === 0 ? heard(state, 'judge-first-loss', 1) : heard(state, 'judge-second-loss', 2);
    const line = showPoint
      ? 'Vote for the ticket    ·    Loss = −ln P(ticket wins)' +
        (knownLoss ? ' = ' + (-Math.log(p)).toFixed(3) : '')
      : 'Will the ticket land above or below even odds?';
    api.text(ctx, line, 130, 957, 41, C.ink);
  });
}

export default {
  id: 'bt-judge',
  draw: drawBtJudge,
  cues: ['judge-scores', 'judge-prediction', 'judge-first-loss', 'judge-flip', 'judge-second-loss'],
};
