import { place, dot, to, indicate, assertEqual } from 'vizmatic/stage';
import { heading, label, note, para } from '../../kit-narrated.mjs';
import { caseBoard, MAIN, FOOT } from '../parts.mjs';
const literal =
  'freeze deployments require commander approval before any release enters the live production environment';
const forms = [
  ['literal copy', literal],
  ['paraphrased policy', 'Commander sign-off is required before shipping during a freeze.'],
  ['renamed code', 'if deployment_frozen: require(commander_signoff)'],
  ['translated policy', 'Pendant le gel, obtenir l’accord du commandant avant le déploiement.'],
];
assertEqual(literal.split(' ').length, 13, 'authored literal screen window');
export default function screen(s, c) {
  const board = caseBoard();
  const rows = MAIN.rows(4, 'normal');
  const probes = forms.map(([name, content], i) => {
    const [head, body] = rows[i].rows([1, 2], 'normal');
    const literalMatch = content.includes(literal);
    return {
      name: place(label(name, { size: 34, color: 'dim' }), head, 'left'),
      fact: place(
        para(content, body.width, { size: 34, color: i ? 'blue' : 'cyan' }),
        body,
        'left',
      ),
      status: place(
        note(literalMatch ? '13-gram match' : 'no literal match', {
          color: literalMatch ? 'pink' : 'dim',
        }),
        head,
        'right',
      ),
    };
  });
  const phases = place(
    note('Authored variants of one fact · training exposure and development exposure differ'),
    FOOT,
  );
  const point = (r) => {
    const p = r.point('left');
    return [p[0] - 24, p[1]];
  };
  const scan = dot(10, 'yellow').moveTo(point(rows[0]));
  const captions = [
    'After a case guides a choice → regression',
    'Same policy    ·    different wording',
    'Canary exclusion depends on collectors',
    'Dates + checkpoint + tools + exposure history',
  ].map((v) => place(note(v), FOOT));
  s.add(
    heading('A screen has a detection boundary'),
    phases,
    probes.map((p) => [p.name, p.fact]),
  );
  c.take(board.nodes);
  c.on('exposure-screen-phase-0', () => s.play(indicate(phases, { scale: 1, color: 'yellow' })));
  c.on('ba-exposure-screen-train', () =>
    s.play(indicate(probes[0].fact, { scale: 1, color: 'pink' })),
  );
  c.on('ba-exposure-screen-dev', () =>
    s.play(indicate(probes[1].fact, { scale: 1, color: 'pink' })),
  );
  c.swap('ba-exposure-screen-regression', phases, captions[0], { after: true });
  c.show('exposure-screen-phase-1', scan);
  c.show('ba-exposure-screen-ngram', probes[0].status);
  c.on('ba-exposure-screen-paraphrase', () =>
    s.play(to(scan, (n) => n.moveTo(point(rows[3])), { duration: 2.4 })),
  );
  c.show(
    'ba-exposure-screen-paraphrase',
    probes.slice(1).map((p) => p.status),
  );
  c.swap('ba-exposure-screen-paraphrase', captions[0], captions[1]);
  c.swap('ba-exposure-screen-canary', captions[1], captions[2]);
  c.on('exposure-screen-phase-2', () =>
    s.play(indicate(probes[3].fact, { scale: 1, color: 'yellow' })),
  );
  c.swap('ba-exposure-screen-dated', captions[2], captions[3]);
  c.on('ba-exposure-screen-cutoff', () =>
    s.play(indicate(captions[3], { scale: 1, color: 'yellow' })),
  );
  c.keep(board.nodes);
}
