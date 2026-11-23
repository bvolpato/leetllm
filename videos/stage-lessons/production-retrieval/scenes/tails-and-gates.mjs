import { assertEqual, indicate, place, segmentedBar, seq, table } from 'vizmatic/stage';
import { heading, label, note } from '../../kit-narrated.mjs';
import { carryIdentity, evidenceFrame } from '../parts.mjs';
import { ragReleaseGate } from '../../../films/production-retrieval/model.mjs';
import { REQUIRED_RAG_GATES } from '../../../films/production-retrieval/fixtures.mjs';
export default function tailsAndGates(s, c) {
  const f = evidenceFrame(c);
  const [mutationRoom, gatesRoom] = f.work.rows([1, 5], 'normal');
  const within = 0.95,
    stageCount = 5,
    products = Array.from({ length: stageCount }, (_, i) => within ** (i + 1));
  const joint = products.at(-1);
  assertEqual(joint.toFixed(3), '0.774', 'independent joint probability');
  const [headsRoom, ...setRooms] = f.work.rows([1, 1, 1, 1, 1, 1], 'normal');
  const headCols = headsRoom.columns([1, 3, 3], 'wide');
  const heads = ['Stage', 'Independent passing set', 'Intersection: all so far'].map((words, i) =>
    place(note(words), headCols[i], 'left'),
  );
  const sets = setRooms.map((room, i) => {
    const [nameRoom, setRoom, jointRoom] = room.columns([1, 3, 3], 'wide');
    const barWidth = setRoom.width - 4;
    const name = place(note('A' + (i + 1), { color: 'green' }), nameRoom, 'left');
    const pass = place(
      segmentedBar(
        [
          { name: 'pass', value: 0, color: 'green' },
          { name: 'fail', value: 0, color: 'red' },
        ],
        { width: barWidth, height: 36, max: 1, labels: false, readout: false, size: 34 },
      ),
      setRoom,
    );
    const joint = place(
      segmentedBar([{ name: 'intersection', value: 0, color: 'cyan' }], {
        width: barWidth,
        height: 36,
        max: 1,
        labels: false,
        readout: false,
        size: 34,
      }),
      jointRoom,
      'bottom',
    );
    const words = place(
      note(i === 0 ? 'A1' : Array.from({ length: i + 1 }, (_, k) => 'A' + (k + 1)).join(' ∩ '), {
        color: 'cyan',
      }),
      jointRoom,
      'top left',
    );
    return { name, pass, joint, words };
  });
  const probabilityPicture = [heads, sets.map((set) => [set.name, set.pass, set.joint, set.words])];
  const each = place(note('Each stage passes with probability 0.95', { color: 'green' }), f.foot);
  const original = place(
    label('Reviewed fixture candidate', { color: 'cyan' }),
    mutationRoom,
  );
  const mutated = place(
    label('Candidate with the 30-day claim', { color: 'red' }),
    mutationRoom,
  );
  const gates = place(
    table(
      ['gate', 'required', { key: 'report', sample: 'missing' }],
      REQUIRED_RAG_GATES.map((id) => ({
        id,
        gate: id,
        required: 'true',
        report: { value: 'pending', state: 'pending' },
      })),
      { width: f.work.width, size: 29, leading: 1.45 },
    ),
    gatesRoom,
  );
  const probability = place(
    label('0.95 raised to 5 = ' + joint.toFixed(3), { color: 'yellow' }),
    f.foot,
  );
  const completeReport = Object.fromEntries(REQUIRED_RAG_GATES.map((k) => [k, true]));
  const { lifecycle, ...missingReport } = completeReport;
  assertEqual(ragReleaseGate(completeReport), true, 'all six true gates permit promotion');
  assertEqual(ragReleaseGate(missingReport), false, 'missing lifecycle alone blocks promotion');
  assertEqual(ragReleaseGate({ ...completeReport, lifecycle: 1 }), false, 'the number one is not Boolean true');
  const permitted = place(
    label('Promotion permitted · all six gates true', { color: 'green' }),
    f.foot,
  );
  const blocked = place(
    label('Promotion blocked · required result missing', { color: 'yellow' }),
    f.foot,
  );
  const wrongType = place(label('Promotion blocked · lifecycle must be Boolean', { color: 'yellow' }), f.foot);
  s.add(heading(c.title, { size: 44 }), f.nodes, probabilityPicture, each);
  carryIdentity(c, f);
  c.on('pr-independent', () =>
    s.play(
      ...sets.flatMap((set) => [
        set.pass.resize('pass', within, { duration: 0.6 }),
        set.pass.resize('fail', 1 - within, { duration: 0.6 }),
      ]),
    ),
  );
  c.on('pr-all-five', () =>
    s.play(
      seq(
        ...sets.map((set, i) => set.joint.resize('intersection', products[i], { duration: 0.35 })),
      ),
    ),
  );
  c.swap('pr-joint', each, probability, { after: true });
  c.swap('pr-mutation', probabilityPicture, [gates, mutated]);
  c.hide('pr-mutation', probability);
  c.after('pr-mutation', () =>
    s.play(gates.setCell('cases', 'report', { value: 'false', state: 'fail' })),
  );
  c.swap('pr-required', mutated, original);
  c.on('pr-required', () =>
    s.play(
      ...REQUIRED_RAG_GATES.map((id) =>
        gates.setCell(id, 'report', { value: 'true', state: 'pass' }, { duration: 0.5 }),
      ),
    ),
  );
  c.show('pr-required', permitted, { after: true });
  c.on('pr-alltrue', () => s.play(gates.light('lifecycle', 'required')));
  c.hide('pr-missing', permitted, { lead: 0, fade: 0.2 });
  c.on(
    'pr-missing',
    () => s.play(gates.setCell('lifecycle', 'report', { value: 'missing', state: 'fail' })),
    0.25,
  );
  c.show('pr-missing', blocked, { after: true, lead: 0 });
  c.on('pr-number', () => s.play(gates.setCell('lifecycle', 'report', { value: '1', state: 'fail' })));
  c.swap('pr-number', blocked, wrongType, { after: true });
}
