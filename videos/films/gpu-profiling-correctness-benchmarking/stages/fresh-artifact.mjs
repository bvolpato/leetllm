import { spoken } from '../arithmetic.mjs';
import { freshProfileSnapshot, receiptFixture, parseSampleArtifact, sampleDigest, serialPayoff } from '../model.mjs';
import { requestTrace } from '../request-trace.mjs';

const receipt = receiptFixture();
const recordedRow = '4,0,82';
const reformattedRow = '4,0,82.0';
const newBytes = receipt.csv.B.replace(recordedRow + '\n', reformattedRow + '\n');
const currentDigest = sampleDigest(newBytes);

// The new line still parses as the same number. Test it against the original file binding.
let refusal;
try {
  parseSampleArtifact(newBytes, receipt.digests.B, receipt.conditions);
} catch (error) {
  refusal = error.message;
}
if (refusal !== 'sample artifact changed') throw Error('A different candidate file must fail its original binding');

export function drawFreshArtifact(ctx, scene, state, api) {
  const { C, text, rect, line, arrow } = api;
  const s = freshProfileSnapshot(state);
  api.focus.target('fresh-artifact-mechanism', () => {
    if (state.beat < 2) {
      const { n, blocks, threads, launched, lastWrite, logicalOverrun } = s.launch;
      text(ctx, 'Candidate B   /   ' + n + ' results, ' + launched + ' allocated slots', 140, 246, 36, C.ink);
      text(ctx, 'Grid   ' + blocks + ' × ' + threads, 140, 340, 35, C.muted);
      text(ctx, logicalOverrun ? 'if (i <= n)' : 'if (i < n)', 1750, 342, 51, C.yellow, 'right', 'mono');
      const left = 278, cell = 222;
      const boundary = left + 3 * cell;
      text(ctx, 'Last three result slots', left, 454, 34, C.blue);
      text(ctx, 'Spare allocation', boundary + 30, 454, 34, C.muted);
      for (let j = 0; j < 6; j++) {
        const i = n - 3 + j;
        const x = left + cell * j;
        const extra = s.failureRevealed && logicalOverrun && i === lastWrite;
        const color = i < n ? C.blue : extra ? C.pink : C.muted;
        rect(ctx, x, 500, cell - 5, 122, extra ? C.pink : C.panel, color, 3);
        text(ctx, String(i), x + cell / 2, 579, 48, extra ? C.bg : color, 'center');
      }
      line(ctx, boundary - 3, 475, boundary - 3, 664, C.yellow, 5);
      if (s.failureRevealed) {
        const mark = left + (lastWrite - (n - 3) + 0.5) * cell;
        arrow(ctx, mark, 728, mark, 637, logicalOverrun ? C.pink : C.green, 5);
        text(ctx, 'last writer   ' + lastWrite, mark, 795, 34, logicalOverrun ? C.pink : C.green, 'center');
      }
      const tested = spoken(state, 'fresh-grid', 0) === 1;
      const decision = !s.failureRevealed ? 'Which thread writes outside the result?' :
        logicalOverrun ? 'Hold the 1.3× claim.' : 'New binary   ·   verify the guard and collect new timings.';
      text(ctx, tested ? decision : 'Each slot is one float. Indices start at zero.', 960, 911, 44, C.ink, 'center');
      text(ctx, 'Supplied event medians     A  13 µs     B  10 µs', 960, 994, 31, C.muted, 'center');
      return;
    }
    if (spoken(state, 'closing-request', 3) > 0) {
      const original = serialPayoff(95, 5, 2);
      const kernel = original.kernel / original.factor;
      const completed = spoken(state, 'both-replies', 3) === 1;
      requestTrace(ctx, api, {
        original, cpu: original.before - kernel, kernel, bottomLabel: 'Candidate',
        totalLabel: completed ? 'Both replies arrived at ' + original.before + ' ms.' : '',
      });
      return;
    }
    const changed = s.changedBytes;
    text(ctx, 'Timing file   /   candidate.csv', 145, 250, 37, C.ink);
    text(ctx, 'Last record', 150, 387, 33, C.muted);
    text(ctx, 'sample,slot,elapsed_us', 570, 385, 31, C.muted, 'left', 'mono');
    text(ctx, recordedRow, 570, 486, 53, C.ink, 'left', 'mono');
    if (changed) {
      text(ctx, '→', 890, 484, 50, C.muted);
      text(ctx, recordedRow, 1010, 486, 53, C.ink, 'left', 'mono');
      text(ctx, reformattedRow.slice(recordedRow.length), 1202, 486, 53, C.yellow, 'left', 'mono');
    }
    const expected = receipt.digests.B.slice(0, 12) + '…';
    const actual = (changed ? currentDigest : receipt.digests.B).slice(0, 12) + '…';
    const painted = s.bindingRevealed ? C.pink : C.cyan;
    text(ctx, 'SHA-256 prefix', 150, 641, 32, C.muted);
    text(ctx, 'Recorded', 570, 620, 31, C.muted);
    text(ctx, 'Current file', 1110, 620, 31, C.muted);
    text(ctx, expected, 570, 699, 41, C.cyan, 'left', 'mono');
    text(ctx, actual, 1110, 699, 41, painted, 'left', 'mono');
    line(ctx, 145, 767, 1775, 767, C.muted, 2);
    text(ctx, 'compare_pair(*records)', 150, 853, 37, C.ink, 'left', 'mono');
    text(ctx, s.bindingRevealed ? refusal : changed ? 'Does the file match its receipt?' : '102 / 82 ≈ 1.24×',
      1775, 853, 39, s.bindingRevealed ? C.pink : C.yellow, 'right');
    if (s.bindingRevealed)
      text(ctx, 'Recover the recorded file or collect a new matched round.', 960, 972, 37, C.ink, 'center');
  });
}
export default {
  id: 'fresh-artifact',
  draw: drawFreshArtifact,
  cues: ['fresh-grid', 'fresh-extra-write', 'fresh-guard-repair', 'changed-byte-question', 'fresh-binding-answer', 'closing-request', 'both-replies'],
};
