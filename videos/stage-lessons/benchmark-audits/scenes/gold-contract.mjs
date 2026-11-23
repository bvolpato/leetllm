import { grid, place, indicate } from 'vizmatic/stage';
import { heading, label, note, chip } from '../../kit-narrated.mjs';
import { caseBoard, MAIN, FOOT, POLICY } from '../parts.mjs';
export default function gold(s, c) {
  const board = caseBoard();
  const [table, operation] = MAIN.rows([3, 1], 'loose');
  const rows = table.rows(4, 'wide');
  const headers = ['case', 'source clause', 'required fact'].map((v, i) =>
    place(note(v), rows[0].columns([1, 3, 3], 'wide')[i]),
  );
  const records = POLICY.map((p, i) => {
    const cells = rows[i + 1].columns([1, 3, 3], 'wide');
    const id = place(chip(p.id, { color: 'cyan' }), cells[0]);
    const fact = place(label(p.fact, { color: 'cyan', size: 34 }), cells[1]);
    const gold = place(label(p.fact, { size: 34 }), cells[2]);
    return { id, fact, gold, slot: cells[2] };
  });
  const duplicate = place(chip('P1', { color: 'red' }), operation, 'left');
  const unsupported = place(label('keep deploying', { color: 'red', size: 34 }), records[1].slot);
  const repaired = place(label(POLICY[1].fact, { color: 'green', size: 34 }), records[1].slot);
  const caption = place(
    note('Example policies    ·    Check the required fact against its source'),
    FOOT,
  );
  s.add(
    heading('Repair the answer key first'),
    headers,
    records.map((r) => [r.id, r.fact, r.gold]),
    caption,
  );
  c.take(board.nodes);
  c.on('gold-contract-phase-0', () =>
    s.play(indicate(records[0].id, { scale: 1, color: 'yellow' })),
  );
  c.on('ba-gold-contract-approval', () =>
    s.play(indicate(records[0].fact, { scale: 1, color: 'yellow' })),
  );
  c.on('gold-contract-phase-1', () =>
    s.play(
      indicate(
        records.map((r) => r.id),
        { scale: 1, color: 'yellow' },
      ),
    ),
  );
  c.show('ba-gold-contract-unique', duplicate);
  c.hide('ba-gold-contract-gold', duplicate);
  c.on('ba-gold-contract-gold', () =>
    s.play(
      indicate(
        records.map((r) => r.gold),
        { scale: 1, color: 'yellow' },
      ),
    ),
  );
  c.on('gold-contract-phase-2', () =>
    s.play(indicate(records[1].fact, { scale: 1, color: 'yellow' })),
  );
  c.swap('ba-gold-contract-unsupported', records[1].gold, unsupported);
  c.swap('ba-gold-contract-repair', unsupported, repaired, { after: true });
}
