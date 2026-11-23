import { routingConcentration } from '../arithmetic.mjs';

export function drawEvidence(ctx, scene, state, api) {
  const { C, focus } = api;
  const sample = routingConcentration();
  const x = (i) => 354 + 73 * i;
  const yPrior = 644;
  const yCandidate = 450;
  const p = focus.progress('route-one');
  const write = (s, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);
  const bracket = (left, right, y, color) => {
    api.line(ctx, left, y, right, y, color, 3);
    api.line(ctx, left, y, left, y + 17, color, 3);
    api.line(ctx, right, y, right, y + 17, color, 3);
  };

  write('Illustration • 20 requests from two tenants', 108, 252, 34, C.muted);
  focus.target('tenant-groups', () => {
    write('A', x(0), 330, 37, C.ink, 'center');
    bracket(x(0) - 30, x(0) + 30, 352, C.muted);
    write('Tenant B', (x(1) + x(19)) / 2, 330, 37, C.ink, 'center');
    bracket(x(1) - 30, x(19) + 30, 352, C.muted);
  });
  write('Candidate', 108, yCandidate + 14, 34, C.yellow);
  write('Prior version', 108, yPrior + 14, 32, C.muted);
  for (const y of [yCandidate, yPrior]) api.line(ctx, 306, y, 1810, y, '#545763', 2);
  focus.target('all-requests', () => {
    for (let i = 1; i < sample.total; i++) api.circle(ctx, x(i), yPrior, 22, C.blue);
  });
  focus.target('one-request', () => {
    const y = yPrior + (yCandidate - yPrior) * api.ease(p);
    api.circle(ctx, x(0), y, 24, p > 0 ? C.yellow : C.blue);
  });
  if (focus.visible('route-one'))
    focus.target('overall-share', () => {
      write('All requests', 115, 818, 32, C.muted);
      write(
        p === 1
          ? sample.candidate + ' of ' + sample.total + '   •   ' + sample.overallShare * 100 + '%'
          : 'Routing one request…',
        115,
        893,
        52,
        C.yellow,
      );
    });
  if (focus.visible('tenant-question'))
    focus.target('tenant-share', () => {
      const answer = focus.visible('tenant-answer');
      write('Tenant A’s requests', 980, 818, 32, C.muted);
      write(
        answer
          ? sample.tenantA.candidate +
              ' of ' +
              sample.tenantA.total +
              '   •   ' +
              sample.tenantA.share * 100 +
              '%'
          : 'What share reached the candidate?',
        980,
        893,
        answer ? 52 : 37,
        C.yellow,
      );
    });
  if (focus.visible('frequency-unknown'))
    focus.target('frequency', () =>
      write('Friday’s leakage rate needs a representative sample of real requests.', 112, 1002, 35),
    );
}

export default {
  id: 'evidence',
  draw: drawEvidence,
  cues: ['two-tenants', 'route-one', 'tenant-question', 'tenant-answer', 'frequency-unknown'],
};
