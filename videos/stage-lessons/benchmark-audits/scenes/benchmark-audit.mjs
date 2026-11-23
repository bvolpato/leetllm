import { column, place, rect, dynamic, indicate, to } from 'vizmatic/stage';
import { heading, label, note } from '../../kit-narrated.mjs';
import { caseBoard, MAIN, FOOT } from '../parts.mjs';
export default function audit(s, c) {
  const board = caseBoard();
  const [universe, subset, pro] = MAIN.rows(3, 'wide');
  const full = place(rect(universe.width, 100, { fill: 'grid', stroke: null }), universe);
  const selected = place(
    rect((universe.width * 138) / 500, 100, { fill: 'cyan', stroke: null }),
    universe,
    'left',
  );
  const selectedLabel = place(label('Verified · 500 tasks', { color: 'ink' }), universe, 'top');
  const subFrame = place(rect(subset.width, 100, { fill: 'grid', stroke: null }), subset);
  const issues = place(
    rect(subset.width * 0.594, 100, { fill: 'red', stroke: null }),
    subset,
    'left',
  );
  const subsetLabel = place(
    label('Selected 138 · 59.4% with material issues', { size: 34 }),
    subset,
    'top',
  );
  const proFrame = place(rect(pro.width, 100, { fill: 'grid', stroke: null }), pro);
  const proIssue = place(rect(pro.width * 0.3, 100, { fill: 'red', stroke: null }), pro, 'left');
  const proLabel = place(label('Pro · 731 public tasks · ≈30% broken', { size: 34 }), pro, 'top');
  const captions = [
    'February 2026 · 138 tasks o3 solved inconsistently or missed',
    'July 2026 · Pro recommendation retracted',
    'Inspect verifier, environment and exposure',
  ].map((v) => place(note(v), FOOT));
  s.add(heading('Keep each audit inside its denominator'), full, selectedLabel, subFrame, proFrame);
  s.add(board.nodes);
  c.on('benchmark-audit-phase-0', () =>
    s.play(indicate(selectedLabel, { scale: 1, color: 'yellow' })),
  );
  c.show('ba-benchmark-audit-subset', selected);
  c.show('audit-issues', [issues, subsetLabel, captions[0]], { after: true });
  c.on('ba-benchmark-audit-denominator', () =>
    s.play(indicate(subsetLabel, { scale: 1, color: 'yellow' })),
  );
  c.on('benchmark-audit-phase-1', () => s.play(indicate(selected, { scale: 1, color: 'pink' })));
  c.swap('ba-benchmark-audit-retract', captions[0], captions[1]);
  c.show('ba-benchmark-audit-pro', [proIssue, proLabel], { after: true });
  c.swap('benchmark-audit-phase-2', captions[1], captions[2]);
  c.on('ba-benchmark-audit-verifier', () =>
    s.play(indicate(proFrame, { scale: 1, color: 'yellow' })),
  );
  c.keep(board.nodes);
}
