import { baselineReview, candidateReview, relabeledReview, silentReview } from '../case-review.mjs';
import { cases, EVIDENCE, draftClaims } from '../fixtures.mjs';
import { releaseEvidence } from '../arithmetic.mjs';
import { incidentSheet, phraseProgress } from '../incident-sheet.mjs';

export function drawPayloadAndRelease(ctx, scene, state, api) {
  const { C, left, right, text, heading, pair, footer } = incidentSheet(ctx, api);
  const cue = (id, beat) => phraseProgress(state, api, id, beat);
  if (state.beat === 0) {
    const relabeled = cue('log-shorten', 0) === 1;
    const silent = cue('silent-policy', 0) === 1;
    const review = silent ? silentReview : relabeled ? relabeledReview : baselineReview;
    heading(left, 'Request log', 'Added estimate   /   one of four test requests', C.blue);
    heading(right, 'What the reader receives', 'Last sentence of this response', C.ink);
    pair(420, 'Recorded route', review.rows[1].route);
    pair(650, 'Runbook estimate', 'No field');
    if (silent) text('Unable to provide a grounded update.', right, 475, 37);
    else {
      text('Full recovery is expected by', right, 475, 44);
      text(draftClaims[3].value + '.', right, 551, 52, C.yellow);
    }
    footer(
      silent
        ? 'Zero substantive answers. Unsafe-serve rate is undefined.'
        : 'Across the suite: ' +
            review.unsafe +
            ' unsafe answers / ' +
            review.served +
            ' substantive answers.',
    );
  } else if (state.beat === 1) {
    heading(left, 'Four test requests', 'Actual evidence gate', C.blue);
    heading(right, 'Count the answers', 'The denominator depends on the question', C.ink);
    const labels = ['Clean update', 'Added estimate', 'Wrong status', 'Unknown source'];
    candidateReview.rows.forEach((row, i) => {
      const y = 430 + i * 103;
      text(labels[i], left, y, 39);
      text(row.route, left + 450, y, 35, row.served ? C.green : C.muted);
    });
    const { unsafe, served, total } = candidateReview;
    const clean = candidateReview.rows.find((row) => row.id === 'clean_update');
    text('Clean cases kept', right, 420, 31, C.muted);
    text(Number(clean.served && !clean.unsafe) + ' of 1', right, 479, 46);
    text('Requests answered', right, 565, 31, C.muted);
    text(served + ' of ' + total, right, 624, 46);
    text('Unsafe among those answered', right, 710, 31, C.muted);
    text(unsafe + ' of ' + served, right, 769, 46);
    footer(
      'These four requests exercise known failure modes. Everyday traffic has a different mix.',
    );
  } else {
    const requirements = {
      regressions: candidateReview.unsafe === 0 && candidateReview.rows[0].served,
      versions: cases
        .flatMap((c) => c.claims)
        .filter((c) => c.sourceId === EVIDENCE.sourceId)
        .every((c) => c.version === EVIDENCE.version),
      holdout: false,
      owner: false,
    };
    const titles = [
      'Known failures fixed and clean answer kept',
      'Admitted source versions recorded',
      'Representative held-out cases and an audited grader',
      'Someone responsible for alerts',
    ];
    const missing = cue('missing-records', 2) === 1;
    text('Release evidence for the candidate', left, 278, 46, C.ink, 'left', 'serif');
    Object.values(requirements).forEach((passed, i) => {
      const y = 402 + i * 120;
      text(titles[i], left, y, 38);
      text(
        passed ? 'Present' : missing ? 'Missing' : 'Unchecked',
        1440,
        y,
        39,
        passed ? C.green : missing ? C.yellow : C.muted,
      );
    });
    footer(
      cue('release-missing-evidence', 2) === 1 && !releaseEvidence(requirements)
        ? 'Hold the release until both missing requirements are met.'
        : 'Which release requirements still need evidence?',
    );
  }
}

export default {
  id: 'payload-and-release',
  draw: drawPayloadAndRelease,
  cues: [
    'log-shorten',
    'payload-and-release-b1',
    'silent-policy',
    'payload-and-release-b2',
    'payload-and-release-b3',
    'missing-records',
    'release-missing-evidence',
  ],
};
