import { assertEqual, passage, pipeline, place, segmentedBar, seq, table } from 'vizmatic/stage';
import { heading, label, note } from '../../kit-narrated.mjs';
import { carryIdentity, evidenceFrame, CORPUS, RULE } from '../parts.mjs';
import { packParents, parentPackingFixture } from '../../../films/production-retrieval/model.mjs';
import { EVAL_DATE, PARENTS } from '../../../films/production-retrieval/fixtures.mjs';
export default function contextBudget(s, c) {
  const f = evidenceFrame(c);
  const [previewRoom, charactersRoom, tokensRoom] = f.work.rows([4, 2, 2], 'normal');
  const fixture = parentPackingFixture();
  const sourceLine = (e) => '[' + e.sourceId + '] ' + e.parentId + ' (' + e.version + '): ' + e.text;
  const sources = fixture.packed.map(sourceLine);
  const cap = 400;
  const sizes = [sources[0].length, sources[1].length + 1];
  const contextSize = sizes.reduce((a, b) => a + b, 0);
  // Try a longer section from the same policy revision between the two real hits.
  const appendix = {
    ...PARENTS['eu-access-v2'],
    id: 'eu-access-history',
    text: 'Current key rule: ' + CORPUS[0].text + '\nHistorical key rule: ' + CORPUS[1].text,
  };
  const appendixHit = { record: { ...CORPUS[0], id: 'history-span', parentId: appendix.id } };
  const [keyHit, sessionHit] = fixture.run.hits;
  const trial = [keyHit, appendixHit, sessionHit, keyHit];
  const store = { ...PARENTS, [appendix.id]: appendix };
  const [, candidate] = packParents(trial, fixture.run.caller, EVAL_DATE, 1000, store);
  const appendedSize = 1 + sourceLine(candidate).length;
  const accepted = packParents(trial, fixture.run.caller, EVAL_DATE, cap, store);
  assertEqual(accepted.map(sourceLine).join('\n'), sources.join('\n'), 'skip the long section and deduplicate the key');
  assertEqual(contextSize <= cap, true, 'complete source-labeled parents fit');
  assertEqual(appendedSize > cap - sizes[0], true, 'labeled appendix with its separator exceeds remaining room');
  const sentences = [
    'EU Access Policy, key rotation.',
    CORPUS[0].text,
    'Effective from ' + CORPUS[0].from + '.',
  ];
  const preview = place(
    passage(sentences.join(' '), {
      width: f.work.width,
      size: 34,
      leading: 1.3,
      title: 'Sentence window · selected boundary',
      titleSize: 29,
    }),
    previewRoom,
    'top left',
  );
  const largePreview = place(
    table(
      ['Illustrative parent', 'Complete section'],
      [
        {
          id: 'current',
          'Illustrative parent': 'Current rule',
          'Complete section': RULE.days + ' days AND ' + RULE.hours + ' hours',
        },
        {
          id: 'history',
          'Illustrative parent': 'Historical rule',
          'Complete section': 'Manual rotation · ' + CORPUS[1].text.match(/\d+/)[0] + ' days',
        },
      ],
      { width: f.work.width, size: 34, leading: 1.6 },
    ),
    previewRoom,
    'top',
  );
  const smallPreview = place(
    passage(fixture.packed[1].text, {
      width: f.work.width,
      size: 34,
      leading: 1.3,
      title: 'E2 · eu-session-v1 · complete smaller parent',
      titleSize: 29,
      color: 'pink',
    }),
    previewRoom,
    'top left',
  );
  const references = place(
    pipeline(['Child references', 'Parent identity', 'Packed once'], {
      width: f.work.width,
      size: 31,
      lanes: 2,
    }),
    previewRoom,
  );
  const chars = place(
    segmentedBar(
      [
        { name: 'E1', value: 0, color: 'cyan' },
        { name: 'larger parent', value: 0, color: 'red' },
        { name: 'E2', value: 0, color: 'pink' },
      ],
      {
        width: f.work.inset('normal').width,
        capacity: cap,
        max: sizes[0] + appendedSize,
        size: 34,
        labels: false,
        title: 'Trial context · chars',
      },
    ),
    charactersRoom,
  );
  const whole = place(
    segmentedBar(
      [
        { name: 'input', value: 0, color: 'blue' },
        { name: 'output reserve', value: 0, color: 'dim' },
      ],
      {
        width: f.work.inset('normal').width,
        capacity: fixture.budget.limit + fixture.budget.reservedOutput,
        size: 34,
        labels: false,
        title: 'Whole request + output reserve · toy bytes',
      },
    ),
    tokensRoom,
  );
  const outside = place(note('Outside this local window: distant definitions'), f.foot);
  const largeNote = place(
    label('Appendix needs ' + appendedSize + ' characters   ·   ' + (cap - sizes[0]) + ' free', {
      color: 'red',
    }),
    f.foot,
  );
  const smaller = place(
    label('Skip whole parent. Admit complete E2: ' + sizes[1] + ' characters.', {
      color: 'yellow',
    }),
    f.foot,
  );
  const duplicate = place(
    label('Two E1 references → one parent. Occupancy stays ' + contextSize + '.', {
      color: 'yellow',
    }),
    f.foot,
  );
  const limit = place(note('Toy tokenizer   ·   ' + fixture.budget.total + ' input tokens   +   ' + fixture.budget.reservedOutput + ' reserved for output'), f.foot);
  s.add(heading(c.title), f.nodes, preview, chars, outside);
  carryIdentity(c, f);
  c.onBeat(0, () => s.play(preview.select(sentences[1], { duration: 0.4 })));
  c.on('pr-window', () => s.play(preview.select(preview.text, { duration: 1.2 })));
  c.on('pr-characters', () => s.play(chars.resize('E1', sizes[0], { duration: 0.9 })));
  c.swap('pr-oversized', outside, largeNote);
  c.swap('pr-oversized', preview, largePreview);
  c.on('pr-oversized', () =>
    s.play(chars.resize('larger parent', appendedSize, { duration: 0.9 })),
  );
  c.on('pr-skip', () =>
    s.play(
      seq(
        chars.resize('larger parent', 0, { duration: 0.6 }),
        chars.resize('E2', sizes[1], { duration: 0.7 }),
      ),
    ),
  );
  c.swap('pr-skip', largeNote, smaller, { after: true });
  c.swap('pr-skip', largePreview, smallPreview);
  c.swap('pr-dedup', smallPreview, references);
  c.swap('pr-dedup', smaller, duplicate, { after: true });
  c.on(
    'pr-dedup',
    () =>
      s.play(
        seq(
          references.put(
            [
              { id: 'E1-a', color: 'cyan' },
              { id: 'E1-b', color: 'cyan' },
            ],
            { duration: 0.3 },
          ),
          references.move(['E1-a', 'E1-b'], 'Parent identity', { duration: 0.6 }),
          references.join('E1-b', 'E1-a', { duration: 0.6 }),
          references.move('E1-a', 'Packed once', { duration: 0.6 }),
        ),
      ),
    0.5,
  );
  c.show('pr-tokens', whole, { lead: 0.45 });
  c.on('pr-tokens', () =>
    s.play(
      whole.resize('input', fixture.budget.total, { duration: 1.1 }),
      whole.resize('output reserve', fixture.budget.reservedOutput, { duration: 1.1 }),
    ),
  );
  c.swap('pr-tokens', duplicate, limit);
  c.on('pr-position', () => s.play(f.page.select(CORPUS[0].text, { duration: 0.8 })));
  c.clear(
    references.items.map((n) => n.content),
    0.8,
    0.01,
  );
  c.clear(references.rails, 0.7, 0.2);
}
