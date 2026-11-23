import { assertEqual, boxOf, column, grid, indicate, place, rect, to } from 'vizmatic/stage';
import { area, heading, label, mono, note, chip } from '../../kit-narrated.mjs';
import { binomialChoose, exactPairedP, freshAuditDecision, wilsonInterval } from '../parts.mjs';
import { rateRuler } from '../rate-ruler.mjs';

// Identified teaching cases let the viewer open the permission miss in the report.
const brokenIds = ['F031', 'F118'];
const records = Array.from({ length: 200 }, (_, i) => {
  const number = i + 1;
  const id = 'F' + String(number).padStart(3, '0');
  const baseline = number > 10 && number <= 190;
  return {
    id,
    baseline,
    candidate: number <= 190 && !brokenIds.includes(id),
    permission: number >= 22 && number <= 31,
  };
});

export default function fresh(s, c) {
  const reference = freshAuditDecision();
  const fixed = records.filter((r) => !r.baseline && r.candidate);
  const broken = records.filter((r) => r.baseline && !r.candidate);
  const permissions = records.filter((r) => r.permission);
  const passes = permissions.filter((r) => r.candidate).length;
  const missed = permissions.find((r) => !r.candidate);
  const base = records.filter((r) => r.baseline).length;
  const candidate = records.filter((r) => r.candidate).length;
  const discordant = fixed.length + broken.length;
  const common = records.filter((r) => r.baseline && r.candidate).length;
  const neither = records.filter((r) => !r.baseline && !r.candidate).length;
  const p = exactPairedP(fixed.length, broken.length);
  const interval = wilsonInterval(passes, permissions.length);
  const floor = reference.criticalFloor;
  assertEqual(
    [base, candidate, common, neither, p, interval.low].join('/'),
    [
      reference.baselinePass,
      reference.candidatePass,
      reference.bothPass,
      reference.bothFail,
      reference.pairedP,
      reference.criticalLower,
    ].join('/'),
    'archive report recovered from the individual cases',
  );
  assertEqual(missed.id, brokenIds[0], 'retained permission regression');

  const title = heading('Would you sign the archive release?');
  const [policyRow, body, footer] = area.rows([1, 5.5, 1], 'normal');
  const policy = place(
    label('Archive policy    ·    Staff approval required for access', { size: 44 }),
    policyRow,
  );
  const [left, right] = body.columns([1.2, 1], 'loose');
  const [leftHead, sheet, sums] = left.rows([1, 4, 1], 'normal');
  const [rightHead, rulerRow, rulerNote, result] = right.rows([1, 1.6, 1, 1.4], 'normal');
  const contract = place(label('Permission gate', { color: 'yellow', size: 50 }), rightHead);
  const threshold = place(note('Gate uses the 95% Wilson lower end'), rulerNote);
  const ruler = rateRuler(rulerRow.inset('normal'), interval, passes / permissions.length, floor);
  const floorLabel = mono(`${100 * floor}% floor`, { size: 31, color: 'yellow' }).moveTo(
    ruler.at(floor, -58),
  );
  const lowerLabel = mono(`${(100 * interval.low).toFixed(1)}%`, {
    size: 32,
    color: 'cyan',
  }).moveTo(ruler.at(interval.low, 52));
  const sample = place(label('200 paired archive cases', { size: 46 }), leftHead);
  const marks = records.map(() => rect(29, 25, { fill: 'dim', stroke: null }));
  place(grid(marks, { columns: 20, gap: 7 }), sheet);
  const rectFor = (r, color) =>
    rect(29, 25, { fill: color, stroke: null }).moveTo(
      boxOf(marks[records.indexOf(r)]).point('center'),
    );
  const fixMarks = fixed.map((r) => rectFor(r, 'green'));
  const breakMarks = broken.map((r) => rectFor(r, 'red'));
  const [fixZone, breakZone] = sums.columns(2, 'wide');
  const fixText = place(label(`${fixed.length} fixes`, { color: 'green' }), fixZone);
  const breakText = place(label(`${broken.length} regressions`, { color: 'red' }), breakZone);
  const totals = place(mono(`${base}/200 → ${candidate}/200`, { size: 48 }), footer);
  const pairsNote = place(note(`${common} both pass    ·    ${neither} both fail`), leftHead);
  const coefficients = Array.from({ length: broken.length + 1 }, (_, j) =>
    binomialChoose(discordant, j),
  );
  const tail = place(
    mono(`2 × (${coefficients.join(' + ')}) / ${2 ** discordant}`, { size: 39 }),
    footer,
  );
  const pText = place(
    label(`All cases    ${base}/200 → ${candidate}/200      paired p = ${p.toFixed(4)}`, {
      size: 38,
    }),
    footer,
  );
  const file = place(label('Candidate   ·   10 permission cases', { size: 40 }), leftHead);
  const ids = permissions.map((r) =>
    chip(r.id, { size: 32, color: r.candidate ? 'green' : 'red' }),
  );
  place(grid(ids, { columns: 5, gap: 'normal' }), sheet);
  const origins = permissions.map((r) => rectFor(r, r.candidate ? 'green' : 'red'));
  const passCount = place(
    label(`${passes}/${permissions.length} passed`, { size: 45, color: 'blue' }),
    sums,
  );
  const band = place(note('Two-sided 95% interval    ·    0% to 100% scale'), rightHead);
  const ask = place(
    label('Sign or hold? Which end decides?', { color: 'yellow', size: 40 }),
    result,
  );
  const endpoint = place(
    mono(`${(100 * interval.low).toFixed(1)}% < ${100 * floor}%`, { color: 'red', size: 48 }),
    result,
  );
  const hold = place(
    label(interval.low < floor ? 'HOLD' : 'CLEARS PERMISSION GATE', { color: 'red', size: 57 }),
    rightHead,
  );
  const receipt = heading('What happened on the permission case?');
  const [tabs, evidence, action, disposition] = area.rows([1, 3, 1, 1], 'wide');
  const [first, other] = tabs.columns(2, 'loose');
  const retained = broken.map((r, i) =>
    place(chip(r.id + '   pass → fail', { size: 38, color: i ? 'dim' : 'red' }), i ? other : first),
  );
  const [input, output] = evidence.columns(2, 'loose');
  const passage = place(
    column(
      [
        note(missed.id + '   ·   final context'),
        label('Staff approval is required.', { color: 'cyan', size: 48 }),
      ],
      { gap: 'wide' },
    ),
    input,
  );
  const answer = place(
    column(
      [
        note(missed.id + '   ·   returned answer'),
        label('Staff approval is optional.', { color: 'red', size: 48 }),
      ],
      { gap: 'wide' },
    ),
    output,
  );
  const traceQuestion = place(
    label('Where would you investigate first?', { color: 'yellow' }),
    action,
  );
  const target = place(label('Inspect generation and the prompt', { size: 43 }), action);
  const [regHead, regFile] = input.rows([1, 1.8], 'tight');
  const [freshHead, freshFile] = output.rows([1, 1.8], 'tight');
  const regression = place(label('Regression tests', { color: 'pink', size: 48 }), regHead);
  const fresh = place(label('Next release sample', { color: 'cyan', size: 48 }), freshHead);
  const packet = place(
    chip('Untouched permission cases', { dash: true, color: 'cyan', size: 34 }),
    freshFile,
  );
  const held = place(
    label(`Current release on hold    ·    ${(100 * interval.low).toFixed(1)}% < 85%`, {
      size: 44,
      color: 'yellow',
    }),
    disposition,
  );
  const next = heading('Which cases can test the repair?');

  s.add(title, policy, contract);
  c.show('archive-floor', [ruler.axis, ruler.floor, floorLabel, threshold], { after: true });
  c.show('archive-pairs', [sample, marks]);
  c.show('fixes', [fixText, fixMarks], { after: true });
  c.show('breaks', [breakText, breakMarks], { after: true });
  c.show('aggregate', totals, { after: true });
  c.swap('archive-tails', totals, tail);
  c.swap('archive-tails', sample, pairsNote);
  c.swap('archive-p', tail, pText, { after: true });
  c.swap('permission-file', [pairsNote, fixText, breakText], file);
  c.show('permission-file', origins);
  c.on('permission-file', () =>
    s.play(
      ...origins.map((r, i) =>
        to(r, (n) => n.moveTo(boxOf(ids[i]).point('center')), { duration: 0.85 }),
      ),
    ),
  );
  c.on('permission-file', () => {
    s.play(
      ...[...marks, ...fixMarks, ...breakMarks].map((n) =>
        to(n, (v) => v.opacity(0), { duration: 0.35 }),
      ),
    );
  });
  c.swap('permission-rate', origins, [ids, passCount, ruler.observed]);
  c.swap('permission-band', contract, band, { after: true });
  c.show('permission-band', ruler.interval, { after: true });
  c.show('archive-ask', ask);
  c.swap('lower-end', ask, endpoint, { after: true });
  c.show('lower-end', [ruler.low, lowerLabel], { after: true });
  c.swap('archive-hold', band, hold, { after: true });
  c.swapAll('retain-broken', [receipt, retained]);
  c.on('open-case', () => s.play(indicate(retained[0], { scale: 1.08, color: 'yellow' })));
  c.show('trace-source', passage);
  c.show('trace-answer', answer);
  c.show('trace-ask', traceQuestion);
  c.swap('trace-diagnosis', traceQuestion, target, { after: true });
  c.swap(
    'archive-regression',
    [receipt, passage, answer, target, retained[1]],
    [next, fresh, held],
  );
  c.on('archive-regression', () =>
    s.play(to(retained[0], (n) => n.moveTo(regFile.point('center')), { duration: 0.9 })),
  );
  c.show('archive-regression', regression, { lead: -0.9 });
  c.show('next-holdout', packet, { after: true });
}
