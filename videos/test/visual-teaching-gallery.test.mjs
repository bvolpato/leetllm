import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mergePlayingFindings,
  playingEditorialScores,
  sourceReviewDisplay,
} from '../visual-teaching-gallery.mjs';

test('the playing movie exposes its bound editorial findings and ignores other exports', () => {
  const result = mergePlayingFindings(
    [],
    [
      {
        bound: true,
        reviewer: 'reviewer',
        recordPath: 'review.json',
        findings: [
          { scene: 'score', issue: 'Score appears before its contribution.', status: 'open' },
        ],
      },
      { bound: false, findings: [{ scene: 'old', issue: 'Stale defect' }] },
    ],
  );
  assert.equal(result.length, 1);
  assert.equal(result[0].scope, 'playing-movie');
  assert.equal(result[0].scene, 'score');
  assert.equal(result[0].reviewer, 'reviewer');
});

test('a source-only fix stays open against the unchanged playing movie', () => {
  const result = mergePlayingFindings(
    [],
    [
      {
        bound: true,
        findings: [{ issue: 'Replay', status: 'resolved-in-source-awaiting-encode' }],
      },
    ],
  );
  assert.equal(result[0].status, 'open-in-playing-movie-source-fix-awaiting-encode');
  assert.equal(result[0].sourceResolutionStatus, 'resolved-in-source-awaiting-encode');
});

test('duplicate source and movie observations display one current finding', () => {
  const before = { scene: 'trace', issue: 'Clear then rebuild', status: 'resolved' };
  const result = mergePlayingFindings(
    [before],
    [{ bound: true, findings: [{ ...before, status: 'open' }] }],
  );
  assert.equal(result.length, 1);
  assert.equal(result[0].status, 'open');
  assert.equal(before.status, 'resolved');
});

test('the displayed score conservatively retains distinct judgments for the playing movie', () => {
  assert.deepEqual(
    playingEditorialScores([
      { bound: false, score: 99 },
      { bound: true, score: 96 },
      { bound: true, score: 95 },
      { bound: true, score: 96 },
    ]),
    [95, 96],
  );
  assert.deepEqual(
    playingEditorialScores([
      { bound: false, score: 90 },
      { bound: true, score: null },
    ]),
    [],
  );
});

test('source labels follow exact playing-movie closures while pending and unbound fixes stay open', () => {
  const review = { sourceReviewStatus: 'revised', remainingIssues: [] };
  const finding = { scene: 'trace', issue: 'The result clears during its recap.', status: 'open' };
  const closed = { ...finding, status: 'resolved-in-current-encoded' };
  assert.equal(
    sourceReviewDisplay(review, true, [finding], []).label,
    'Independent recheck needed',
  );
  const display = sourceReviewDisplay(
    review,
    true,
    [finding],
    [{ bound: true, findings: [closed] }],
  );
  assert.equal(display.label, 'Source revised');
  assert.equal(display.detail, 'Current source reviewed; exact movie acceptance is separate.');
  assert.equal(
    sourceReviewDisplay(review, true, [finding], [{ bound: false, findings: [closed] }]).label,
    'Independent recheck needed',
  );
  assert.equal(
    sourceReviewDisplay(
      review,
      true,
      [finding],
      [{ bound: true, findings: [{ ...closed, status: 'resolved-in-source-awaiting-encode' }] }],
    ).label,
    'Independent recheck needed',
  );
});
