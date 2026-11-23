import { createHash } from 'node:crypto';
import { assertEqual, column, place } from 'vizmatic/stage';
import { parserIdentities } from '../../../films/sandbox-execution/model.mjs';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { COLOR, REPORT_XML, wall } from '../parts.mjs';

const expected = ['ReportParser::rejectsFailure', 'ReportParser::handlesError'];
const tested = { base: 'R18', files: 'tree 7', image: 'I7', dependencies: 'D3', grader: 'G4' };
// All five entries are fixed-format classroom identifiers. Compare the full SHA-256 digests.
const fingerprint = (manifest) =>
  createHash('sha256')
    .update(JSON.stringify(Object.keys(tested).map((key) => manifest[key])))
    .digest('hex');

export default function separatedAuthority(s, c) {
  const received = parserIdentities(REPORT_XML);
  const agrees = (rows) =>
    rows.length === expected.length && rows.every((value, i) => value === expected[i]);
  const grade = (rows) => (agrees(rows) ? 'PASS' : 'HOLD');
  assertEqual(
    [grade([]), grade(received)],
    ['HOLD', 'PASS'],
    'only the repaired rows match the protected expectation',
  );
  const [board, answerBox] = area.rows([7, 2], 'wide');
  const [left, right] = board.inset('none', 'tight').columns(2, 'loose');
  const leftWall = wall(left, 'worker A / 7');
  const rightWall = wall(right, 'trusted validator', { color: COLOR.host });
  const leftRows = left.inset('wide', 'wide').rows([1, 3, 1], 'normal');
  const rightRows = right.inset('wide', 'wide').rows([1, 3, 1], 'normal');
  const shownRows = (rows, region, color) =>
    place(
      column(
        rows.map((value) => mono(value, { size: 36, color })),
        { gap: 'normal', align: 'left' },
      ),
      region,
      'left',
    );
  const returned = place(note('returned rows'), leftRows[0], 'left');
  const protectedRows = place(
    note('expected rows  /  held outside the worker'),
    rightRows[0],
    'left',
  );
  const empty = place(mono('[]', { size: 66 }), leftRows[1], 'left');
  const expectedRows = shownRows(expected, rightRows[1], COLOR.evidence);
  const outputRows = shownRows(received, leftRows[1], COLOR.evidence);
  const exit = place(mono('process exit  0', { size: 37 }), leftRows[2], 'left');
  const prompt = place(
    label('Does this output pass?', { size: 46, color: COLOR.mark }),
    answerBox,
    'left',
  );
  const checked = (rows, detail) =>
    place(
      label(`${grade(rows)}   /   ${detail}`, {
        size: 44,
        color: agrees(rows) ? COLOR.pass : COLOR.fail,
      }),
      answerBox,
      'left',
    );
  const hold = checked([], 'both expected rows are missing');
  const pass = checked(received, 'both rows match in order');

  const title = heading(c.title);
  s.add(title, leftWall, rightWall, returned, protectedRows);
  c.show('sa-empty', empty);
  c.show('sa-exit', exit);
  c.show('sa-expected', expectedRows);
  c.show('sa-ask', prompt);
  c.swap('sa-hold', prompt, hold, { after: true });
  c.swap('sa-repair', empty, outputRows);
  c.swap('sa-pass', hold, pass, { after: true });

  // The receipt stays fixed on the left while one input to acceptance changes on the right.
  const receiptBox = wall(left, 'protected passing receipt', { color: COLOR.pass });
  const requestBox = wall(right, 'submitted for review', { color: COLOR.host });
  const current = { ...tested, image: 'I8' };
  const digest = fingerprint(tested);
  assertEqual(
    [tested, current].map((m) => fingerprint(m) === digest),
    [true, false],
    'image I8 requires a new result',
  );
  const fieldNames = ['base', 'file tree', 'image', 'dependencies', 'grader'];
  function manifestPanel(region, manifest) {
    const rows = region.inset('wide', 'wide').rows(6, 'tight');
    const cells = Object.values(manifest).map((value, i) => {
      const [key, val] = rows[i].columns([3, 2], 'normal');
      return {
        key: place(note(fieldNames[i]), key, 'left'),
        val: place(mono(value, { size: 38 }), val, 'left'),
        region: val,
      };
    });
    const hash = place(
      mono(`SHA-256  ${fingerprint(manifest).slice(0, 12)}…`, {
        size: 29,
        color: COLOR.evidence,
      }),
      rows[5],
      'left',
    );
    return { cells, hash, nodes: [...cells.flatMap((cell) => [cell.key, cell.val]), hash] };
  }
  const receipt = manifestPanel(left, tested);
  const submission = manifestPanel(right, tested);
  const changed = place(
    mono(current.image, { size: 38, color: COLOR.mark }),
    submission.cells[2].region,
    'left',
  );
  const changedHash = place(
    mono(`SHA-256  ${fingerprint(current).slice(0, 12)}…`, {
      size: 29,
      color: COLOR.mark,
    }),
    right.inset('wide', 'wide').rows(6, 'tight')[5],
    'left',
  );
  const aligned = place(
    label('Same tested inputs', { size: 44, color: COLOR.pass }),
    answerBox,
    'left',
  );
  const question = place(
    label('Can this receipt cover image I8?', { size: 44, color: COLOR.mark }),
    answerBox,
    'left',
  );
  const action = place(
    label('Hold for a run on image I8', { size: 48, color: COLOR.mark }),
    answerBox,
    'left',
  );
  c.swapAll('sa-receipt', [receiptBox, ...receipt.nodes, requestBox, ...submission.nodes], {
    keep: [title],
  });
  c.show('sa-same', aligned);
  c.hide('sa-image', aligned);
  c.swap('sa-image', [submission.cells[2].val, submission.hash], [changed, changedHash]);
  c.show('sa-which', question);
  c.swap('sa-retest', question, action, { after: true });
}
