import { EVENTS } from '../fixtures.mjs';

const request = EVENTS.find((e) => e.id === '205');
const spans = [
  {
    name: 'Retrieval',
    start: 0,
    end: 90,
    cue: 'retrieve-policy',
    output: 'Policy v17',
    detail: 'No recorded approval',
  },
  {
    name: 'Chat',
    start: 90,
    end: 380,
    cue: 'produce-draft',
    output: '“Approved”',
    detail: 'In the draft',
  },
  {
    name: 'Serving gate',
    start: 380,
    end: request.total,
    cue: 'deliver-draft',
    output: '“Approved”',
    detail: 'In the operator’s reply',
  },
];

export function drawTrace(ctx, scene, state, api) {
  const { C, focus } = api;
  const text = (value, x, y, size, color, align = 'left') =>
    api.text(ctx, value, x, y, size, color, align);
  const passed = (id) => state.cues?.[id]?.phase === 'after';
  const tx = (time) => 575 + (670 * time) / request.total;
  const elapsed = spans.reduce(
    (total, s) => total + (s.end - s.start) * focus.progress(s.cue, 0),
    0,
  );

  focus.target('request-root', () => {
    text('Request ' + request.id, 120, 280, 46, C.ink);
    text('Span 0', 120, 334, 31, C.blue);
  });
  text('Example elapsed time (ms)', tx(0), 245, 30, C.muted);
  text('Output of each operation', 1350, 245, 31, C.muted);
  api.line(ctx, tx(0), 339, tx(request.total), 339, C.muted, 2);
  for (const t of [0, 90, 380, request.total]) {
    api.line(ctx, tx(t), 330, tx(t), 348, C.muted, 2);
    text(String(t), tx(t), 311, 27, C.muted, 'center');
  }
  api.line(ctx, 142, 360, 142, 773, C.blue, 3);

  spans.forEach((s, i) => {
    const y = 465 + 154 * i;
    const progress = focus.progress(s.cue, 0);
    const annotated = (i === 1 && passed('locate-defect')) || (i === 2 && passed('locate-escape'));
    const color = annotated ? C.pink : C.cyan;
    api.line(ctx, 142, y, 187, y, C.blue, 3);
    focus.target('span-' + (i + 1), () => {
      text(s.name, 214, y - 3, 39, C.ink);
      text('Span ' + (i + 1) + '  ·  parent 0', 215, y + 46, 27, C.blue);
    });
    focus.target('interval-' + (i + 1), () => {
      const width = tx(s.end) - tx(s.start);
      api.rect(ctx, tx(s.start), y - 26, width, 48, C.panel, C.muted, 3);
      if (progress > 0)
        api.rect(ctx, tx(s.start), y - 26, width * progress, 48, color, undefined, 3);
    });
    if (passed(s.cue)) {
      focus.target('result-' + (i + 1), () => {
        text(s.output, 1350, y - 4, 39, color);
        text(
          annotated ? (i === 1 ? 'First observed defect' : 'Containment escape') : s.detail,
          1350,
          y + 43,
          29,
          annotated ? C.pink : C.muted,
        );
      });
    }
  });
  api.circle(ctx, tx(elapsed), 339, 9, C.yellow);
  focus.target('trace-question', () => {
    const question = focus.progress('inspect-spans', 0) > 0;
    const footer = passed('locate-escape')
      ? 'Next check: replay the claim with the recorded policy and gate configuration.'
      : question
        ? 'Where did the claim first appear? Where did it reach the operator?'
        : 'One request, three operations on the same clock';
    text(footer, 120, 965, 36, question && !passed('locate-escape') ? C.yellow : C.ink);
  });
}

export default {
  id: 'trace',
  draw: drawTrace,
  cues: [
    'request-tree',
    'retrieve-policy',
    'produce-draft',
    'deliver-draft',
    'inspect-spans',
    'locate-defect',
    'locate-escape',
  ],
};
