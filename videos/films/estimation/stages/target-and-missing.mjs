import { afterCue, cue, event } from '../construction.mjs';
import { drawAuditTray } from '../audit-tray.mjs';
import { caption, equation, focusTarget, panel, text } from '../defaults.mjs';
import { readerPairs } from '../fixtures.mjs';

function drawPairedLabels(ctx, api, state) {
  const { C } = api;
  const pairs =
    1 + Math.ceil((readerPairs.length - 1) * event(state, 4, 'paired-cases', 0.48, 0.73));
  const comparing = event(state, 5, 'matching-pairs', 0.02, 0.16);
  const matched = readerPairs.filter((r) => r.a === r.b).length;
  const known = state.beat === 5 && afterCue(state, 'agreement-rate', 0.28, 0.42);
  text(ctx, api, 'Original labels · recorded in private', 960, 267, 40, C.ink, 'center');
  focusTarget(ctx, api, 'review-pair', () => {
    const columns = [445, 790, 1145, 1490];
    ['Case', 'Reviewer A', 'Reviewer B', 'Comparison'].forEach((name, i) =>
      text(ctx, api, name, columns[i], 390, 32, C.muted, 'center'),
    );
    readerPairs.slice(0, pairs).forEach(({ id, a, b }, i) => {
      const y = 491 + i * 85;
      api.line(ctx, 315, y + 25, 1600, y + 25, C.muted, 1);
      text(ctx, api, String(id), columns[0], y, 35, C.ink, 'center');
      for (const [col, label] of [
        [1, a],
        [2, b],
      ])
        text(ctx, api, label, columns[col], y, 36, label === 'Routine' ? C.blue : C.pink, 'center');
      if (i === 0 || i <= comparing * (readerPairs.length - 1))
        text(
          ctx,
          api,
          a === b ? 'Match' : 'Differ',
          columns[3],
          y,
          34,
          a === b ? C.green : C.yellow,
          'center',
        );
    });
  });
  focusTarget(ctx, api, 'agreement', () => {
    text(
      ctx,
      api,
      known
        ? matched +
            ' matches / ' +
            readerPairs.length +
            ' pairs = ' +
            (100 * matched) / readerPairs.length +
            '% agreement'
        : 'How many pairs match?',
      960,
      875,
      43,
      known ? C.green : C.ink,
      'center',
    );
    if (state.beat === 5 && afterCue(state, 'adjudicate', 0.6, 0.74))
      caption(ctx, api, 'Case 17 goes to adjudication · original labels retained');
  });
}

export function drawTargetAndMissing(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    if (currentBeat === 0) {
      panel(ctx, api, 190, 360, 1540, 470, () => {});
      text(
        ctx,
        api,
        'Population: this week’s message queue',
        960,
        430,
        38,
        themeColors.cyan,
        'center',
      );
      panel(
        ctx,
        api,
        350,
        515,
        610,
        220,
        () => {
          text(ctx, api, 'Sample: selected labels', 655, 580, 34, themeColors.blue, 'center');
          equation(ctx, api, '\\hat p=k/n', 655, 670, 58, themeColors.yellow, 'center');
        },
        themeColors.blue,
      );
      text(
        ctx,
        api,
        'Estimand: unknown specialist share',
        1320,
        570,
        31,
        themeColors.ink,
        'center',
      );
      text(
        ctx,
        api,
        'Estimate: one realized fraction',
        1320,
        675,
        31,
        themeColors.yellow,
        'center',
      );
      focusTarget(ctx, api, 'target-denominator-comparison', () =>
        caption(
          ctx,
          api,
          cue(state, 'target-flagged-comparison') > 0.2
            ? 'Separate article example: abuse among flags = review precision'
            : 'Weekly target: specialist share among all messages',
        ),
      );
    } else if (
      currentBeat < 3 ||
      (currentBeat === 3 && cue(state, 'review-case', 0.31, 0.38) === 0)
    ) {
      text(ctx, api, 'A second audit · 100 cases', 565, 264, 38, themeColors.ink, 'center');
      const trayState = currentBeat === 3 ? { ...state, beatP: 1 } : state;
      drawAuditTray(ctx, api, trayState, {
        selected: 100,
        resolved: 80,
        positive: 16,
        columns: 10,
        answering: currentBeat >= 2,
        cues: trayCues,
        tray: 'audit-tray',
        tally: 'audit-count',
      });
    } else if (
      currentBeat >= 5 ||
      (currentBeat === 4 && cue(state, 'paired-cases', 0.48, 0.73) > 0)
    ) {
      drawPairedLabels(ctx, api, state);
    } else {
      const pair = event(state, 3, 'blind-review', 0.66, 0.78);
      const locked = currentBeat > 3 || afterCue(state, 'lock-labels', 0.81, 0.96);
      const compared = currentBeat === 4 && afterCue(state, 'compare-labels', 0.04, 0.17);
      const recorded = currentBeat === 4 && afterCue(state, 'record-disagreement', 0.31, 0.47);
      focusTarget(ctx, api, 'case-file', () => {
        text(ctx, api, 'Case 17 · repeat lockout', 960, 320, 43, themeColors.ink, 'center');
        text(
          ctx,
          api,
          '“I got back in. Then my account locked again.”',
          960,
          407,
          37,
          themeColors.ink,
          'center',
        );
        text(ctx, api, 'Model score concealed', 960, 482, 28, themeColors.muted, 'center');
      });
      if (pair > 0)
        focusTarget(ctx, api, 'review-pair', () => {
          ['A', 'B'].forEach((name, i) => {
            const x = 235 + i * 775;
            const color = compared
              ? i === 0
                ? themeColors.blue
                : themeColors.pink
              : themeColors.cyan;
            panel(
              ctx,
              api,
              x,
              562,
              675,
              190,
              () => {
                text(
                  ctx,
                  api,
                  'Reviewer ' + name + ' · case 17',
                  x + 338,
                  630,
                  33,
                  themeColors.ink,
                  'center',
                );
                text(
                  ctx,
                  api,
                  compared
                    ? i === 0
                      ? readerPairs[0].a
                      : readerPairs[0].b
                    : locked
                      ? 'Label submitted privately'
                      : 'Independent review',
                  x + 338,
                  710,
                  36,
                  color,
                  'center',
                );
              },
              color,
            );
          });
        });
      if (compared)
        focusTarget(ctx, api, 'agreement', () => {
          text(
            ctx,
            api,
            recorded ? 'Disagreement recorded' : 'Do the labels agree?',
            960,
            855,
            39,
            themeColors.yellow,
            'center',
          );
        });
    }
  }
}

const trayCues = [
  'bracket-resolved',
  'resolved-share',
  'include-unopened',
  'missing-none',
  'missing-low',
  'missing-all',
  'missing-high',
];
export default {
  id: 'target-and-missing',
  draw: drawTargetAndMissing,
  cues: [
    'target-flagged-comparison',
    ...trayCues,
    'review-case',
    'blind-review',
    'lock-labels',
    'compare-labels',
    'record-disagreement',
    'paired-cases',
    'matching-pairs',
    'agreement-rate',
    'adjudicate',
  ],
};
