import { column, connector, dot, place, row } from 'vizmatic/stage';
import { label, namedBox, note, tint } from '../../kit-narrated.mjs';
import { WORK, open, finish } from '../parts.mjs';
export default function coordination(s, c) {
  const b = open(s, c, 'parameter-coordination'),
    [left, right] = WORK.columns([2, 3], 'loose');
  const [weightArea, readerArea, accessArea] = left.rows([2, 2, 1], 'normal');
  const weight = place(
    namedBox('existing tied W0', { width: 400, height: 90, color: 'blue' }),
    weightArea,
  );
  const reader = place(
    namedBox('external reader', { width: 400, height: 90, color: 'dim' }),
    readerArea,
  );
  const access = connector(weight, reader, { color: 'blue' });
  const registered = place(note('Register reader or gather access scope'), accessArea);
  const [first, second, scopeArea] = right.rows([2, 2, 1], 'normal');
  const experts = [],
    requests = [],
    edges = [],
    forwards = [];
  [first, second].forEach((region, i) => {
    const a = namedBox('expert A', { width: 200, height: 80, color: 'dim' });
    const request = namedBox(`R${i} gather`, { width: 260, height: 80, color: 'dim' });
    const z = namedBox('expert B', { width: 200, height: 80, color: 'dim' });
    const forward = note(`conditional forward: expert ${i ? 'B' : 'A'}`);
    place(
      column([row([a, request, z], { gap: 'wide' }), forward], { gap: 'normal', align: 'center' }),
      region,
    );
    forwards.push(forward);
    experts.push([a, z]);
    requests.push(request);
    edges.push([connector(request, a, { color: 'dim' }), connector(request, z, { color: 'dim' })]);
  });
  const leaf = place(
    namedBox('ZeRO leaf: gather both descendants', { width: 850, height: 76, color: 'yellow' }),
    scopeArea,
  );
  s.add(weight, reader, access, experts, requests, edges, forwards);
  c.show('register', registered);
  c.on('register', () =>
    s.play(access.send(dot(12, 'blue'), { duration: 1.5 }), tint(reader, 'blue')),
  );
  c.on('diverge', () =>
    s.play(
      edges[0][0].send(dot(12, 'blue'), { duration: 1.3 }),
      edges[1][1].send(dot(12, 'blue'), { duration: 1.3 }),
      tint(experts[0][0], 'blue'),
      tint(experts[1][1], 'blue'),
    ),
  );
  c.show('leaf', leaf);
  c.on(
    'leaf',
    () =>
      s.play(
        ...edges.flat().map((edge) => edge.send(dot(12, 'blue'), { duration: 1.5 })),
        ...experts.flat().map((expert) => tint(expert, 'blue')),
      ),
    0.4,
  );
  c.on('causes', () =>
    s.play(
      access.send(dot(12, 'blue'), { duration: 1.2 }),
      ...edges.flat().map((edge) => edge.send(dot(10, 'blue'), { duration: 1.2 })),
    ),
  );
  finish(c, b, 'parameter-coordination');
}
