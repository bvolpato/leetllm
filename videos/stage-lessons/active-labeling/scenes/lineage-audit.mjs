import {
  appear,
  vanish,
  assertEqual,
  boxOf,
  column,
  dot,
  grid,
  indicate,
  line,
  place,
  rect,
  row,
  seq,
  to,
} from 'vizmatic/stage';
import { chip, label, mono, note, tint } from '../../kit-narrated.mjs';
import { hash, normalized } from '../../../films/active-labeling/arithmetic.mjs';
import { testRows } from '../../../films/active-labeling/fixtures.mjs';
import { footer, open, picture } from '../parts.mjs';
export default function lineageAudit(s, c) {
  open(s, c);
  const strings = [
    testRows[0].text,
    '  SKIP  approval AND deploy.  ',
    'Deploy without requesting approval.',
  ];
  const cleaned = strings.map(normalized),
    digests = cleaned.map(hash);
  assertEqual(digests[0], digests[1], 'case and space variants normalize equally');
  assertEqual(digests[0] !== digests[2], true, 'a paraphrase can retain a different hash');
  const rows = picture.rows([1, 2, 2, 2], 'normal');
  const regions = rows.map((r) => r.columns([4, 4, 2], 'wide'));
  const heads = ['Raw ASCII text', 'Normalized text', 'SHA-256 prefix'].map((v, j) =>
    place(note(v), regions[0][j]),
  );
  const raw = strings.map((v, i) => place(mono(v, { size: 29, color: 'blue' }), regions[i + 1][0]));
  const norms = cleaned.map((v, i) =>
    place(mono(v, { size: 29, color: 'cyan' }), regions[i + 1][1]),
  );
  const hashes = digests.map((v, i) =>
    place(
      mono(v.slice(0, 12) + '…', { size: 29, color: i === 2 ? 'blue' : 'yellow' }),
      regions[i + 1][2],
    ),
  );
  const frames = rows
    .slice(1)
    .map((r) =>
      place(rect(r.width - 8, r.height - 8, { stroke: 'dim', width: 3, radius: 12 }), r).zIndex(-1),
    );
  const tokens = raw.map((v, i) => dot(11, 'cyan').moveTo([boxOf(v).right, boxOf(v).bottom + 24]));
  const target = norms.map((v) => [boxOf(v).right, boxOf(v).bottom + 24]);
  const premise = place(
    note('Case and extra spaces collapse to the same text here.'),
    footer,
  );
  const phase1 = [heads, raw, norms, hashes, frames, premise, tokens];
  const [familyHeading, familyArea, checksArea] = picture.rows([1, 4, 2], 'wide');
  const familyTitle = place(label('Source → child → grandchild'), familyHeading);
  const familyRegions = familyArea.columns(3, 'loose');
  const ids = ['attack-014', 'copy-014', 'rewrite-014'];
  const parents = ['none', ids[0], ids[1]];
  const familyFrames = familyRegions.map((r) =>
    place(rect(r.width - 8, r.height - 8, { stroke: 'dim', width: 3, radius: 12 }), r).zIndex(-1),
  );
  const fields = familyRegions.map((r) => r.inset('normal').rows(3, 'normal'));
  const familyNodes = ids.map((id, i) =>
    place(mono('id: ' + id, { size: 34, color: i ? 'cyan' : 'pink' }), fields[i][0]),
  );
  const parentFields = parents.map((id, i) =>
    place(mono('parent: ' + id, { size: 31 }), fields[i][1]),
  );
  const familyTags = ids.map((_, i) =>
    place(chip('family: attack-014', { color: 'dim' }), fields[i][2]),
  );
  const links = familyRegions
    .slice(1)
    .map((r, i) =>
      line(r.point('left'), familyRegions[i].point('right'), { stroke: 'dim', width: 3 }),
    );
  const direct = dot(12, 'yellow').moveTo(familyRegions[1].point('left'));
  const bounded = dot(12, 'red').moveTo(familyRegions[2].point('left'));
  const checkRows = checksArea.columns(2, 'wide');
  const table = [
    ['Article', 'supplied family tags', 'bounded word trigrams'],
    ['Film', 'IDs + normalized content', 'family tags + direct parent'],
  ].map((r, i) =>
    place(
      column([label(r[0], { color: 'dim' }), note(r[1]), note(r[2])], { gap: 'tight' }),
      checkRows[i],
    ),
  );
  const stop = place(
    note('STOP at copy-014 · no second hop to attack-014', { color: 'red' }),
    familyHeading,
  );
  const phase2 = [familyFrames, familyTitle, familyNodes, parentFields, familyTags, links, table];
  const limit = place(
    note('The family tag links the rewrite to the frozen test.', { color: 'yellow' }),
    footer,
  );
  s.add(heads, raw, frames, premise);
  c.show('normalized-copy', tokens.slice(0, 2));
  c.on(
    'normalized-copy',
    () =>
      s.play(
        ...tokens.slice(0, 2).map((d, i) => to(d, (n) => n.moveTo(target[i]), { duration: 1 })),
      ),
    0.35,
  );
  c.show('normalized-copy', [norms.slice(0, 2), hashes.slice(0, 2)], { after: true });
  c.show('paraphrase-hash', [norms[2], hashes[2]], { after: true });
  c.hide('paraphrase-hash', tokens.slice(0, 2));
  c.onBeat(1, () => s.play(vanish([heads, raw, norms, hashes, frames, premise]), appear(phase2)));
  c.on('source-family', () => s.play(...familyTags.map((n) => tint(n, 'pink'))));
  c.on('article-detector', () => s.play(indicate(table[0], { color: 'yellow', scale: 1 })));
  c.on('film-detector', () =>
    s.play(indicate([table[1], parentFields[1]], { color: 'yellow', scale: 1 })),
  );
  c.show('film-detector', direct);
  c.on(
    'film-detector',
    () => s.play(to(direct, (n) => n.moveTo(familyRegions[0].point('right')), { duration: 1.1 })),
    0.4,
  );
  c.hide('film-detector', direct, { after: true });
  c.show('ancestor-limit', bounded);
  c.on(
    'ancestor-limit',
    () => s.play(to(bounded, (n) => n.moveTo(familyRegions[1].point('right')), { duration: 1.1 })),
    0.3,
  );
  c.swap('ancestor-limit', familyTitle, stop, { after: true });
  c.show('detector-scope', limit, { after: true });
  c.clear(links, 0.8, 0.2);
}
