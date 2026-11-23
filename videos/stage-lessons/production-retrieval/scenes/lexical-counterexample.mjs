import { assertEqual, barChart, place } from 'vizmatic/stage';
import { heading, label, note } from '../../kit-narrated.mjs';
import { carryIdentity, evidenceFrame, RUN } from '../parts.mjs';
import { retrieve, zeroScoreFixture } from '../../../films/production-retrieval/model.mjs';
export default function lexicalCounterexample(s, c) {
  const f = evidenceFrame(c);
  const [queryRoom, chartRoom] = f.work.rows([1, 5], 'wide');
  const normal = place(label(RUN.query, { color: 'blue', size: 32 }), queryRoom);
  const replay = zeroScoreFixture();
  const paraphrase = place(label(replay.query, { color: 'blue' }), queryRoom);
  const matches = retrieve(replay.query, RUN.caller);
  assertEqual(RUN.hits.map((hit) => hit.score).join(), '7,2', 'worked query');
  assertEqual(replay.hits.map((hit) => hit.score).join(), '0,0', 'paraphrase');
  assertEqual(matches.length, 0, 'minimum two terms');
  const counts = (hits) => place(
    barChart(
      hits.map((h, i) => ({
        label: i ? 'sessions' : 'key rule',
        value: h.score,
        color: i ? 'pink' : 'cyan',
      })),
      {
        width: chartRoom.inset('wide').width,
        height: chartRoom.height * 0.65,
        max: RUN.hits[0].score,
        labelSize: 34,
        showValues: true,
        format: (n) => String(Math.round(n)),
        ticks: [0, 2, 7],
      },
    ),
    chartRoom,
  );
  const originalCounts = counts(RUN.hits);
  const replayCounts = counts(replay.hits);
  const scoreNote = place(note('Distinct shared terms · deterministic test double'), f.foot);
  const wrong = place(label('Zero match → reader still says eligible', { color: 'red' }), f.foot);
  const gate = place(label('Minimum 2 shared terms   ·   ' + matches.length + ' passages returned', { color: 'yellow' }), f.foot);
  s.add(heading(c.title), f.nodes, normal, scoreNote);
  carryIdentity(c, f);
  c.show('pr-scores', originalCounts, { after: true });
  c.swap('pr-zero', normal, paraphrase);
  c.hide('pr-zero', originalCounts);
  c.show('pr-score-zero', replayCounts, { after: true });
  c.swap('pr-false-answer', scoreNote, wrong, { after: true });
  c.on('pr-gate', () => s.play(replayCounts.cutAt(2, { label: '', duration: 0.6 })));
  c.swap('pr-gate', wrong, gate, { after: true });
}
