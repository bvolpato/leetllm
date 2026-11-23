import { REPEATED_CURSOR_PAGES } from '../../../films/ai-lab-technical-presentation/fixtures.mjs';
import { place, rect, line, dot, to } from 'vizmatic/stage';
import { addTitle, work, caption, CASE } from '../parts.mjs';

export default function argument(s, c) {
  addTitle(s, c);
  const [names, chain, samples, question] = work.rows([1, 1, 1.35, 1.1], 'normal');
  const roles = ['Problem', 'Constraint', 'Decision', 'Alternative', 'Evidence', 'Limit'];
  const evidence = [
    '8 sources',
    '< 800 ms',
    '1 contract',
    'Split service',
    'Page receipts',
    'Source mix',
  ];
  const links = chain
    .columns(6, 'none')
    .map((r, i) =>
      place(rect(r.width * 0.85, 100, { radius: 50, stroke: 'dim', fill: 'surface', width: 5 }), r),
    );
  const joints = chain
    .columns(6, 'none')
    .slice(0, -1)
    .map((r) => dot(11, 'cyan').moveTo(r.point('right')));
  const arts = evidence.map((name, i) => caption(samples.columns(6, 'none')[i], name, 'cyan', 35));
  const glyphs = chain.columns(6, 'none').map((region, i) => {
    const [x, y] = region.point('center'),
      w = region.width * 0.55;
    const join = (a, b, color = 'cyan') => line(a, b, { stroke: color, width: 4 });
    const pin = (a, color = 'cyan') => dot(6, color).moveTo(a);
    const p = (fraction, dy = 0) => [x + (fraction - 0.5) * w, y + dy];
    if (i === 0 || i === 2) {
      const pins = Array.from({ length: CASE.sources }, (_, k) =>
        p(0, (k - (CASE.sources - 1) / 2) * 7),
      );
      return [
        ...pins.flatMap((a) => [join(a, p(0.7)), pin(a)]),
        pin(p(0.7)),
        ...(i === 2 ? [join(p(0.7), p(1)), pin(p(1))] : []),
      ];
    }
    if (i === 1)
      return [
        join(p(0), p(1), 'dim'),
        join(p(0), p(CASE.service.successfulP95Ms / CASE.service.latencyLimitMs)),
        join(p(1, -18), p(1, 18), 'yellow'),
      ];
    if (i === 3)
      return [
        join(p(0), p(0.4)),
        join(p(0.4), p(1, -20)),
        join(p(0.4), p(1, 20)),
        pin(p(0)),
        pin(p(1, -20)),
        pin(p(1, 20)),
      ];
    if (i === 4)
      return [pin(p(0.15), 'pink'), join(p(0.25), p(0.75), 'pink'), pin(p(0.85), 'pink')];
    return [
      join(p(0, -18), p(0.7), 'dim'),
      join(p(0, 18), p(0.7), 'yellow'),
      pin(p(0, -18), 'dim'),
      pin(p(0, 18), 'yellow'),
      pin(p(0.7)),
    ];
  });
  const ask = caption(question, 'What did the source return?', 'yellow');
  const slots = question.columns([1, 1, 1.2], 'wide');
  const receipts = REPEATED_CURSOR_PAGES.map((page, i) => {
    const r = slots[i];
    const frame = place(
      rect(r.width * 0.96, r.height * 0.65, { stroke: 'dim', fill: 'surface', radius: 12 }),
      r,
    );
    return [frame, caption(r, 'Page ' + page.page + ' returned ' + page.nextCursor, 'ink', 36)];
  });
  const decision = caption(slots[2], 'Adapter reports incomplete', 'yellow', 37);
  const drop = chain.columns(6, 'none')[4].height * 0.3;
  s.add(
    roles.map((name, i) => caption(names.columns(6, 'none')[i], name, 'ink', 36)),
    links,
    joints,
  );
  c.on('links', () =>
    s.play(...links.map((link) => to(link, (n) => n.stroke('cyan'))), { duration: 0.8 }),
  );
  for (const [cue, i] of [
    ['sources', 0],
    ['constraint', 1],
    ['choice', 2],
    ['split', 3],
    ['cost', 5],
  ])
    c.show(cue, [arts[i], glyphs[i]], { after: true });
  c.show('challenge', ask);
  c.on('challenge', () => s.play(to(links[4], (n) => n.shift(0, drop).stroke('yellow'))));
  c.after('receipt', () => s.play(to(links[4], (n) => n.shift(0, -drop).stroke('cyan'))));
  c.show('receipt', [arts[4], glyphs[4]], { after: true });
  c.swap('receipt', ask, [receipts, decision], { after: true });
}
