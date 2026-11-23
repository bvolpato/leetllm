import { prefLerp, prefLoss } from '../arithmetic.mjs';
import { progress, heard } from '../clock.mjs';

const replies = [
  { name: 'A  ·  Ticket', ref: -8.5, before: -8.2, after: -9.1 },
  { name: 'B  ·  Grant', ref: -9.1, before: -9.5, after: -11.2 },
];

export function drawLikelihoodDisplacement(ctx, scene, state, api) {
  const { C } = api;
  const q = progress(state, 'displace-move', 1);
  const rows = replies.map((r) => {
    const score = prefLerp(r.before, r.after, q);
    return { ...r, score, relative: score - r.ref };
  });
  const margin = rows[0].relative - rows[1].relative;
  const x = (v) => 1230 + v * 405;
  const signed = (v) => (v < 0 ? '−' : '+') + Math.abs(v).toFixed(1);
  api.focus.target('score-inputs', () => {
    api.text(ctx, 'Whole-reply log score', 125, 286, 34, C.muted);
    for (const [i, r] of rows.entries()) {
      const left = 585 + i * 640;
      api.text(ctx, r.name, left, 285, 35, i === 0 ? C.green : C.blue);
      api.text(
        ctx,
        'Policy ' + r.score.toFixed(1) + '    Ref ' + r.ref.toFixed(1),
        left,
        352,
        34,
        C.ink,
      );
      if (state.beat >= 1 && progress(state, 'displace-inputs', 1) > 0) {
        api.text(
          ctx,
          'Second policy   ' + signed(r.after - r.before) + ' from first',
          left,
          406,
          28,
          C.muted,
        );
      }
    }
  });
  api.focus.target('score-ruler', () => {
    api.text(ctx, 'Change from each reply’s frozen reference', 125, 450, 33, C.muted);
    api.line(ctx, x(-2.4), 635, x(1.25), 635, C.muted, 3);
    for (const n of [-2, -1, 0, 1]) {
      api.line(ctx, x(n), 620, x(n), 652, C.muted, 3);
      api.text(ctx, n === 0 ? '0  ·  reference' : signed(n), x(n), 715, 32, C.muted, 'center');
    }
    for (const [i, r] of rows.entries()) {
      const color = i === 0 ? C.green : C.blue;
      const at = x(r.relative);
      const start = x(r.before - r.ref);
      if (Math.abs(at - start) > 3) {
        api.circle(ctx, start, 635, 12, C.bg, color, 3);
      }
      api.circle(ctx, at, 635, 15, color);
      const left = i === 0 ? 'Ticket  ' : 'Grant  ';
      api.text(ctx, left + signed(r.relative), at, 581, 39, color, 'center');
    }
    const left = x(rows[1].relative),
      right = x(rows[0].relative);
    api.path(
      ctx,
      [
        { x: left, y: 760 },
        { x: left, y: 785 },
        { x: right, y: 785 },
        { x: right, y: 760 },
      ],
      { color: C.yellow, width: 4 },
    );
    api.text(ctx, 'Margin  ' + margin.toFixed(1), (left + right) / 2, 851, 46, C.yellow, 'center');
  });
  api.text(
    ctx,
    'β = 0.1     Loss   ' + prefLoss(0.1 * margin).toFixed(3),
    1780,
    848,
    37,
    C.ink,
    'right',
  );
  const question =
    state.beat === 0
      ? ''
      : heard(state, 'displace-answer', 2)
        ? 'The ticket fell below its reference. Where did that probability go?'
        : 'Is the ticket more or less likely than under the reference?';
  if (question) api.text(ctx, question, 960, 986, 34, C.ink, 'center');
}

export default {
  id: 'likelihood-displacement',
  draw: drawLikelihoodDisplacement,
  cues: ['displace-start', 'displace-inputs', 'displace-move', 'displace-gap', 'displace-answer'],
};
