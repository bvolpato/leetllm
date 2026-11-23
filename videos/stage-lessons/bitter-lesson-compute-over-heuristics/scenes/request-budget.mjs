import { place, row, segmentedBar, assertEqual } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { BODY } from '../parts.mjs';

export default function request(s, c) {
  const prompt = 8,
    hidden = 6,
    answer = 2,
    cap = 8;
  const perCandidate = prompt + hidden + answer;
  assertEqual(hidden + answer, cap, 'generated tokens in a completed candidate');
  assertEqual(2 * perCandidate, 32, 'two independently processed candidates');
  const [key, first, second, read, foot] = BODY.rows([0.7, 1.45, 1.45, 1.1, 1.0], 'normal');
  const legend = place(
    row(
      [
        label('Uncached input', { color: 'dim' }),
        label('Hidden generation', { color: 'blue' }),
        label('Answer tokens', { color: 'green' }),
      ],
      { gap: 'loose' },
    ),
    key,
  );
  const candidate = (index, band) => {
    const [nameBand, workBand] = band.columns([1, 3], 'wide');
    const [receiptBand, track] = workBand.rows([1, 1], 'tight');
    const name = place(label('Candidate ' + index, { size: 46 }), nameBand, 'left');
    const bar = place(
      segmentedBar(
        [
          { name: 'input', value: prompt, color: 'dim' },
          { name: 'hidden', value: hidden, color: 'blue' },
          { name: 'answer', value: answer, color: 'green' },
        ],
        { width: track.width - 18, height: 60, max: perCandidate, labels: false, readout: false },
      ),
      track,
    );
    const receipt = (h, a) =>
      place(
        mono(
          prompt +
            ' input  +  ' +
            h +
            ' hidden  +  ' +
            a +
            ' answer  =  ' +
            (prompt + h + a) +
            ' tokens',
          { size: 39 },
        ),
        receiptBand,
        'left',
      );
    return { name, bar, track, tally: receipt(hidden, answer), capped: receipt(cap, 0) };
  };
  const a = candidate(1, first),
    b = candidate(2, second);
  const waiting = place(
    segmentedBar(
      [
        { name: 'input', value: prompt, color: 'dim' },
        { name: 'hidden', value: 0, color: 'blue' },
      ],
      { width: a.track.width - 18, height: 60, max: perCandidate, labels: false, readout: false },
    ),
    a.track,
  );
  const count = (n, returned) =>
    place(
      row(
        [
          mono(n + ' tokens processed', { size: 43 }),
          label('·', { size: 43 }),
          mono(returned + ' answer tokens returned', {
            size: 43,
            color: returned ? 'green' : 'yellow',
          }),
        ],
        { gap: 'normal' },
      ),
      read,
    );
  const one = count(perCandidate, answer),
    two = count(perCandidate * 2, answer),
    none = count(prompt + cap, 0);
  const rules = place(
    note('Fixed weights  ·  each candidate reads the prompt separately', { size: 35 }),
    foot,
  );
  const costs = place(
    note('Also measure difficulty estimation, routing and verification.', { size: 38 }),
    foot,
  );
  const capQuestion = place(
    label('Generation cap: 8 tokens. How many are left for the answer?', {
      size: 42,
      color: 'yellow',
    }),
    read,
  );
  const capRule = place(
    note('One candidate  ·  8 hidden tokens  ·  prompt tokens are outside the generation cap', {
      size: 35,
    }),
    foot,
  );
  const measure = place(
    note('Same untouched tasks  ·  quality, failures, latency and cost', { size: 37 }),
    foot,
  );

  s.add(heading(c.title), legend, rules);
  c.show('first-candidate', [a.name, a.bar, a.tally]);
  c.show('one-answer', one, { after: true });
  c.show('another-candidate', [b.name, b.bar, b.tally]);
  c.hide('another-candidate', one);
  c.show('two-candidates', two, { after: true });
  c.swap('other-work', rules, costs);
  c.hide('one-again', [b.name, b.bar, b.tally, two]);
  c.swap('one-again', costs, capRule);
  c.hide('cap-premise', a.tally);
  c.swap('cap-premise', a.bar, waiting);
  c.after('empty-answer', () => s.play(waiting.resize('hidden', cap, { duration: 0.65 })));
  c.show('cap-question', capQuestion);
  c.show('empty-answer', a.capped, { after: true });
  c.swap('empty-answer', capQuestion, none, { after: true });
  c.swap('measure-request', capRule, measure);
}
