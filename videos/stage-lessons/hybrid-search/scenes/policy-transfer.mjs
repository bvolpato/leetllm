import { assertEqual, boxOf, column, fade, group, place, recolor, rect, to } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { fuse } from '../../../films/hybrid-search/model.mjs';
import { cutoff } from '../rank-sheet.mjs';

export default function transfer(s, c) {
  const lanes = [
    ['FAQ', 'Index', 'Key'],
    ['Audit', 'Session', 'Key'],
  ];
  const run = (depth) =>
    fuse(
      lanes.map((lane) => lane.slice(0, depth)),
      10,
    );
  const shallow = run(2);
  const deep = run(3);
  assertEqual(
    shallow.some((row) => row.id === 'Key'),
    false,
    'Key missing at depth two',
  );
  assertEqual(deep[0].id, 'Key', 'Key leads at depth three');
  assertEqual(deep[0].score.toFixed(5), '0.15385', 'two third-place votes');
  const [banner, body, foot] = area.rows([0.65, 4, 1.1], 'normal');
  const experiment = place(
    note(
      'Supplied ranks for “stale key rotation”     ·     five eligible passages     ·     k = 10',
      { size: 36 },
    ),
    banner,
  );
  const [lists, fused] = body.columns([1.2, 1], 'loose');
  const [header, ...rows] = lists.rows([0.75, 1, 1, 1], 'normal');
  const lc = header.columns(2, 'normal');
  const heads = ['Lexical', 'Dense'].map((v, i) =>
    place(label(v, { color: i ? 'pink' : 'cyan' }), lc[i]),
  );
  const cards = lanes.flatMap((lane, i) =>
    lane.map((id, j) => {
      const slot = rows[j].columns(2, 'normal')[i];
      const hue = i ? 'pink' : 'cyan';
      const tile = group(
        rect(slot.width - 12, 95, { fill: 'surface', stroke: hue, width: 3, radius: 6 }),
        label(j + 1 + '     ' + id, { color: hue, size: 46 }),
      );
      return place(tile, slot);
    }),
  );
  const third = [cards[2], cards[5]];
  third.forEach((card) => card.opacity(0.55));
  const limit = cutoff(s, rows, lists.left, lists.right, 2);
  const [work, result] = fused.rows([1, 1.5], 'normal');
  const status = place(
    column(
      [
        note('Candidates that reach fusion'),
        label(shallow.map((row) => row.id).join(' · '), { size: 38 }),
        mono('Key   absent', { size: 48, color: 'yellow' }),
      ],
      { gap: 'normal' },
    ),
    fused,
  );
  const term = place(
    column([note('Key’s rank contributions'), mono('1/13 + 1/13', { size: 56, color: 'green' })], {
      gap: 'normal',
    }),
    work,
  );
  const verdict = place(
    column(
      [
        mono('Key      ' + deep[0].score.toFixed(5), { size: 47, color: 'green' }),
        mono('Best single   ' + deep[1].score.toFixed(5), { size: 35 }),
        label('One context slot    ' + deep[0].id, { size: 43 }),
      ],
      { gap: 'normal' },
    ),
    result,
  );
  const caption = (words) => place(label(words, { size: 41, color: 'yellow' }), foot);
  const setup = caption('Only the ranks above the line leave each lane');
  const ask = caption('Which limit must grow before Key can get a vote?');
  const changed = caption('Three returns per lane    ·    one context slot');
  s.add(heading(c.title), experiment, heads, cards, limit.mark, status, setup);
  c.swap('lane-question', setup, ask);
  c.after('deepen-lanes', () =>
    s.play(limit.move(3), ...third.map((card) => fade(card, 1, { duration: 0.7 }))),
  );
  c.swap('deepen-lanes', [status, ask], [term, changed], { after: true });
  c.show('key-wins', verdict, { after: true });

  const [queryStrip, traceRegion, excerpts, choice] = area.rows([1.1, 0.6, 3.3, 0.8], 'normal');
  const query = place(
    label('refresh expired machine credential', { size: 70, color: 'cyan' }),
    queryStrip,
  );
  const trace = place(
    mono('Lexical: empty     Dense: Key, Session     Retained: Key, Session', { size: 34 }),
    traceRegion,
  );
  const [key, session] = excerpts.columns(2, 'wide');

  function passage(region, title, lines) {
    const border = place(
      rect(region.width, region.height, {
        fill: 'surface',
        stroke: 'grid',
        width: 3,
        radius: 10,
      }),
      region,
    );
    const [name, excerpt] = boxOf(border).inset(40).rows([1, 3], 'normal');
    const header = place(label(title, { size: 54 }), name, 'left');
    const body = place(column(lines, { gap: 'tight', align: 'left' }), excerpt, 'top left');
    return { border, nodes: [border, header, ...body.nodes] };
  }

  const deadline = label('Up to 14 days after the key goes stale', { size: 41 });
  const risk = label('Risk signal at most 48 hours old', { size: 41 });
  const keyRule = passage(key, 'Key rule   /   KROT-14', [
    note('Automated rotation', { size: 36 }),
    deadline,
    risk,
  ]);
  const sessionRule = passage(session, 'Session rule', [
    note('Browser sign-out', { size: 36 }),
    label('Idle browser sessions expire', { size: 41 }),
    label('after 30 days of inactivity.', { size: 41 }),
  ]);
  const lastQuestion = place(
    label('Which passage tells Luna when she can rotate the key?', { color: 'yellow' }),
    choice,
  );
  const inspect = place(
    label('Rerank the two passages against Luna’s question', { color: 'green' }),
    choice,
  );
  c.swapAll('original-search', [
    heading('Luna’s shortlist'),
    query,
    trace,
    keyRule.nodes,
    sessionRule.nodes,
  ]);
  c.show('source-question', lastQuestion);
  c.hide('source-return', lastQuestion, { after: true });
  c.after('source-return', () => s.play(to(keyRule.border, (border) => border.stroke('green', 5))));
  c.on('key-deadline', () => s.play(recolor(deadline, 'green')));
  c.on('risk-age', () => s.play(recolor(risk, 'green')));
  c.show('rerank-handoff', inspect);
}
