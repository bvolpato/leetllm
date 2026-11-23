import { cueProgress, governancePermission } from '../construction.mjs';
import { evidenceNames, manifest } from '../fixtures.mjs';
import { packageDecision, sampleModel } from '../model.mjs';

export function drawPackage(ctx, scene, state, api) {
  const { C, text, line, focus } = api;
  const b = state.beat;
  const supplied = b > 1 || (b === 1 && governancePermission(state, 'package-dataset'));
  const closed = b > 1 || (b === 1 && governancePermission(state, 'package-close-findings'));
  const edited = b > 1 || (b === 1 && governancePermission(state, 'package-edit'));
  const compared = b > 2 || (b === 2 && governancePermission(state, 'package-changed'));
  const visibleVerdict =
    b === 0 ||
    (b === 1 && governancePermission(state, 'package-eligible')) ||
    compared;
  const draft = sampleModel('package', { beat: 0, beatP: 0 });
  const complete = sampleModel('package', { beat: 1, beatP: 0 });
  const reviews = supplied ? complete.reviews : draft.reviews;
  const unsafe = closed ? complete.unsafe : draft.unsafe;
  const accessibility = closed ? complete.accessibility : draft.accessibility;
  const current = edited ? { ...manifest, policy: 'G8' } : manifest;
  const result = packageDecision(current, reviews, unsafe, accessibility, complete.legalSignoff);
  const recorded = reviews['Workflow memo'].manifest;
  const pending = edited && !compared;

  focus.target('manifest-and-reviews', () => {
    focus.target('current-manifest', () => {
      text(ctx, 'Host manifest   /   C17', 110, 265, 46, C.ink);
      line(ctx, 110, 302, 790, 302, C.muted, 2);
      const fields = [
        ['Model', current.model],
        ['Prompt', current.prompt],
        ['Policy', current.policy],
        ['Tools', current.tools.join(', ')],
        ['Evaluation', current.evaluation],
        ['Environment', current.environment],
      ];
      fields.forEach(([label, value], i) => {
        const y = 378 + i * 61;
        text(ctx, label, 110, y, 33, C.muted);
        text(
          ctx,
          value,
          405,
          y,
          38,
          label === 'Policy' && (edited || cueProgress(state, 'package-edit') > 0)
            ? C.yellow
            : C.ink,
        );
      });
      text(ctx, 'Current digest', 110, 794, 30, C.muted);
      text(
        ctx,
        result.expected.slice(0, 12),
        390,
        797,
        39,
        edited ? C.yellow : C.cyan,
        'left',
        'mono',
      );
    });
    focus.target('review-sheet', () => {
      text(ctx, 'Signed reviews   /   C17', 925, 265, 46, C.ink);
      line(ctx, 925, 302, 1800, 302, C.muted, 2);
      evidenceNames.forEach((name, i) => {
        const x = 925 + Math.floor(i / 4) * 455,
          y = 373 + (i % 4) * 90;
        const hasReview = Object.hasOwn(reviews, name);
        api.circle(
          ctx,
          x + 14,
          y - 10,
          11,
          hasReview ? C.cyan : C.bg,
          hasReview ? C.cyan : C.pink,
          3,
        );
        text(ctx, name, x + 44, y, 32, hasReview ? C.ink : C.pink);
        if (!hasReview) {
          text(ctx, 'missing', x + 44, y + 40, 26, C.pink);
        } else if (pending) {
          text(
            ctx,
            `Accepted ${manifest.policy} / compare ${current.policy}`,
            x + 44,
            y + 40,
            27,
            C.blue,
          );
        } else if (compared && !result.matching.includes(name)) {
          text(ctx, 'Required binding missing', x + 44, y + 40, 27, C.pink);
        }
      });
      text(ctx, 'Recorded digest', 925, 794, 30, C.muted);
      text(ctx, recorded.slice(0, 12), 1245, 797, 39, C.cyan, 'left', 'mono');
    });
    if (compared && result.expected !== recorded) text(ctx, '≠', 850, 795, 47, C.yellow, 'center');
  });

  focus.target('package-checks', () => {
    line(ctx, 110, 848, 1800, 848, C.muted, 2);
    text(
      ctx,
      `${unsafe} unsafe effect${unsafe === 1 ? '' : 's'}   ·   ${accessibility} accessibility finding${accessibility === 1 ? '' : 's'}   ·   Legal signoff on file`,
      110,
      916,
      31,
      C.ink,
    );
    const verdict = pending
      ? 'Do the eight signatures apply?'
      : !visibleVerdict
        ? 'Checking release eligibility'
        : result.ready
          ? `${result.matching.length} of 8 match   ·   Eligible for release approval`
          : compared
            ? `${result.reasons.join('   ·   ')}   ·   Hold ${current.policy} for review`
            : `${result.matching.length} of 8 match   ·   Draft held for review`;
    text(ctx, verdict, 110, 1000, 44, visibleVerdict && result.ready ? C.green : C.yellow);
  });
}

export default {
  id: 'package',
  draw: drawPackage,
  cues: [
    'gov-draft-artifacts',
    'gov-draft-findings',
    'gov-package-dataset',
    'gov-package-close-findings',
    'gov-package-eligible',
    'gov-package-edit',
    'gov-package-changed',
    'gov-package-reviewer-identity',
  ],
};
