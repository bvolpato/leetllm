import { THRESHOLD } from '../fixtures.mjs';
import { candidateRows, fixtureResult, offsetRows } from '../model.mjs';
import {
  auditBoard,
  routeLedger,
  isAuto,
  wordings,
  wordingColor,
  wordingLabel,
} from '../audit-board.mjs';

const candidate = candidateRows();
const rerun = offsetRows();
const edited = rerun.filter((row, i) => row.conversational !== candidate[i].conversational);
const productionChecks = [
  'Representative candidate evaluation',
  'Reviewed uncertainty on paired gaps',
  'Required slices represented',
  'Minimum independent cases per slice',
  'Approved groups and privacy review',
  'Production monitoring owner',
];

export function drawReleaseGate(ctx, scene, state, api) {
  const b = auditBoard(ctx, scene, state, api);
  const { C, text, line, rect, ticket, focus, started, after, progress } = b;
  const second = started('swap-inputs') && !started('original-back');
  const decided = second && after('fail-rerun');
  const rows = second ? rerun : candidate;
  const result = fixtureResult(rows);
  const ready = rows.filter((r) => r.ready);
  const releaseBlocked = after('release-still-blocked');
  const releaseVerdict = 'Release BLOCKED · representative and governance evidence still required';
  if (!started('evidence')) {
    focus('ledger', () => {
      text(
        second ? 'Second run   /   Ready claims' : 'First candidate   /   Ready claims',
        112,
        257,
        46,
      );
      text('Auto-service cutoff  ≥  ' + THRESHOLD.toFixed(2), 1810, 257, 33, C.yellow, 'right');
      routeLedger(
        b,
        ready,
        (row, key) => {
          const changed = second && key === 'conversational' && edited.some((r) => r.id === row.id);
          const slot = isAuto(row[key]) ? 0 : 1;
          if (!changed) return slot;
          const editedCue = row.id === 'p1' ? 'lower-p-one' : 'swap-complete';
          if (!started(editedCue)) {
            const original = candidate.find((r) => r.id === row.id);
            return isAuto(original[key]) ? 0 : 1;
          }
          if (!decided) return 0.5;
          return 0.5 + (slot - 0.5) * progress(row.id === 'p1' ? 'lose-place' : 'gain-place');
        },
        (key) =>
          second && key === 'conversational' && !after('gain-place') ? null : result[key].tp,
      );
    });
    focus('rerun', () => {
      const original = candidate.filter((row) => edited.some((r) => r.id === row.id));
      const score = edited.map((r, i) => {
        const newScore = started(i === 0 ? 'lower-p-one' : 'swap-complete')
          ? r.conversational.toFixed(2)
          : '?';
        return r.id + '   ' + original[i].conversational.toFixed(2) + ' → ' + newScore;
      });
      const note = !second
        ? 'Unclear claims served   ' +
          result.formal.fp +
          ' / ' +
          result.formal.unclear +
          ' in both wordings'
        : after('gain-place')
          ? 'Ready-rate gap   ' +
            100 * result.tprGap +
            ' pp      ·      Unsafe-route gap   ' +
            100 * result.fprGap +
            ' pp      ·      Paired flips   ' +
            result.pairFlips.length
          : 'New conversational scores     ' + score.join('       ');
      text(note, 960, 946, 36, C.ink, 'center');
      text(
        second
          ? decided
            ? result.passed
              ? 'Pass the second run'
              : 'Block the second run'
            : 'Does this run pass the no-flip rule?'
          : 'Every verified pair must keep its route.',
        960,
        1024,
        31,
        second ? C.yellow : C.muted,
        'center',
      );
    });
  } else if (!started('blender-record')) {
    focus('record', () => {
      const { formal, conversational: casual } = result;
      text('First candidate restored', 115, 264, 39, C.muted);
      text('Fixture record', 115, 368, 49, C.blue);
      text('Ready claims on the fast path', 115, 462, 35);
      ready
        .filter((r) => isAuto(r.formal))
        .forEach((row, i) => ticket(row.id, 156 + 118 * i, 552, C.blue));
      text(
        formal.tp +
          ' / ' +
          formal.ready +
          ' formal    ·    ' +
          casual.tp +
          ' / ' +
          casual.ready +
          ' conversational',
        115,
        668,
        35,
      );
      text(result.pairFlips.length + ' paired flips', 115, 763, 46, C.green);
      line(845, 304, 845, 849, '#484d56', 3);
      text('Production evidence still needed', 941, 367, 41);
      productionChecks.forEach((s, i) => {
        const y = 441 + 74 * i;
        rect(944, y - 26, 26, 26, null, C.muted, 3);
        text(s, 1004, y, 32);
      });
      text(
        releaseBlocked ? releaseVerdict : 'Does passing this fixture clear the model for release?',
        960,
        977,
        41,
        C.yellow,
        'center',
      );
    });
  } else {
    focus('outcomes', () => {
      if (started('reply-evidence')) {
        text('Blender replacement', 112, 279, 40, C.muted);
        text('Example customer reply', 112, 424, 38, C.blue);
        text('“Your replacement has shipped.”', 112, 529, 68);
        line(112, 595, 1795, 595, C.muted, 2);
        text('Record to check', 112, 733, 38, C.yellow);
        text('Shipment confirmation for this claim', 112, 838, 55);
        if (releaseBlocked) text(releaseVerdict, 960, 1008, 34, C.yellow, 'center');
        return;
      }
      const p4 = candidate.find((row) => row.id === 'p4');
      const routesKnown = after('release-pair-result');
      text('p4    /    Broken blender    /    Day 12 of 30', 112, 282, 45);
      text('Auto-service cutoff  ≥  ' + THRESHOLD.toFixed(2), 1810, 282, 33, C.yellow, 'right');
      const columns = [112, 540, 863, 1250, 1558];
      ['Wording', 'Candidate score', 'Fixture route', 'Actual wait', 'Resolution quality'].forEach(
        (label, i) => text(label, columns[i], 421, 31, C.muted),
      );
      wordings.forEach((key, j) => {
        const y = 565 + j * 168,
          color = wordingColor(C, key);
        line(112, y - 81, 1822, y - 81, '#454a54', 2);
        text(wordingLabel(key), columns[0], y, 36, color);
        text(p4[key].toFixed(2), columns[1], y, 49, color);
        const route = isAuto(p4[key]) ? 'automatic service' : 'human review';
        text(routesKnown ? route : '?', columns[2], y, 35, color);
        for (const x of columns.slice(3))
          text(after('missing-outcomes') ? 'Unmeasured' : '?', x, y, 35, C.yellow);
      });
      const question = routesKnown
        ? 'How long did either customer actually wait?'
        : 'Which route does each score earn?';
      text(
        after('missing-outcomes') ? 'Measure waiting time and resolution quality by slice.' : question,
        960,
        903,
        40,
        C.ink,
        'center',
      );
      if (releaseBlocked) text(releaseVerdict, 960, 1008, 34, C.yellow, 'center');
    });
  }
}
export default { id: 'release-gate', draw: drawReleaseGate };
