import { cueProgress, motion } from '../construction.mjs';
import { SUPPORT_SCREEN } from '../fixtures.mjs';
import { rewardEnsemble } from '../arithmetic.mjs';
import { rewardFreshScreen } from '../model.mjs';
import { badge, label, line, panel } from '../defaults.mjs';

export function drawFreshScorerScreen(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const seen = (id, from, to) => beat > 0 || cueProgress(state, id, motion(state, from, to)) > 0;
  const inputs = SUPPORT_SCREEN;
  const hits = inputs.agreements.filter(Boolean).length;
  const n = inputs.agreements.length;
  const accuracy = hits / n;
  const sourceFound = inputs.sections.includes(inputs.citedSection);
  const aggregate = rewardEnsemble(inputs.memberScores);
  const v = rewardFreshScreen(state);
  const haveVotes = seen('screen-pairs', 0.12, 0.28);
  const haveSource = seen('screen-source', 0.45, 0.65);
  const haveScores = seen('screen-members', 0.31, 0.42);
  api.focus.target('screen-pairs', () => {
    label(api, ctx, 'Fresh reviewed pairs', 150, 280, 45, C.ink);
    label(
      api,
      ctx,
      'Trial floor   ≥ ' + Math.round(inputs.floor * 100) + '% agreement',
      150,
      358,
      34,
      C.yellow,
    );
    inputs.agreements.forEach((hit, i) => {
      const x = 155 + 90 * (i % 8);
      const y = 425 + 87 * Math.floor(i / 8);
      api.rect(ctx, x, y, 68, 62, haveVotes ? (hit ? C.cyan : C.pink) : C.panel, C.muted, 6);
      badge(api, ctx, String(i + 1), x + 34, y + 42, haveVotes ? C.bg : C.muted, 28);
    });
    label(
      api,
      ctx,
      haveVotes ? hits + ' agree' : 'Awaiting votes',
      155,
      742,
      34,
      haveVotes ? C.cyan : C.muted,
    );
    if (haveVotes) label(api, ctx, n - hits + ' disagree', 478, 742, 34, C.pink);
    label(
      api,
      ctx,
      v.pair
        ? hits +
            ' / ' +
            n +
            ' = ' +
            (100 * accuracy).toFixed(0) +
            '%   •   ' +
            (accuracy >= inputs.floor ? 'PASS' : 'FAIL')
        : 'Agreement   ?',
      155,
      858,
      43,
      v.pair ? C.ink : C.muted,
    );
  });
  line(api, ctx, 945, 245, 945, 874, C.muted, 2);
  api.focus.target('screen-source', () => {
    label(api, ctx, 'Support guide • current edition', 1030, 280, 41, C.ink);
    panel(api, ctx, 1030, 322, 720, 292, C.muted);
    label(api, ctx, 'Complete contents', 1074, 384, 31, C.muted);
    if (haveSource) {
      ['Access requests', 'Ticket review', 'Renewals'].forEach((title, i) => {
        label(api, ctx, '§' + inputs.sections[i] + '    ' + title, 1074, 452 + i * 62, 34, C.ink);
      });
    }
    label(
      api,
      ctx,
      haveSource
        ? '“See §' + inputs.citedSection + ' for renewal dates.”'
        : 'Citation awaiting review',
      1030,
      685,
      35,
      haveSource ? C.yellow : C.muted,
    );
    if (v.source)
      label(api, ctx, 'Source check   ' + (sourceFound ? 'PASS' : 'FAIL'), 1030, 858, 40, C.ink);
  });
  api.focus.target('screen-members', () => {
    const scores = inputs.memberScores.join('  /  ');
    label(
      api,
      ctx,
      v.ensemble
        ? scores +
            '     →     ' +
            aggregate.mean +
            ' − ' +
            aggregate.sd +
            ' = ' +
            aggregate.aggregate
        : haveScores
          ? 'Aligned scores   ' + scores
          : 'Scorer panel',
      1030,
      759,
      33,
      C.cyan,
    );
  });
  api.focus.target('screen-decision', () => {
    const failed = accuracy < inputs.floor || !sourceFound;
    badge(
      api,
      ctx,
      v.hold
        ? failed
          ? 'Hold the trial. Retain the pair IDs and the cited edition.'
          : 'Continue evaluation.'
        : 'Do the reviewed pairs and the cited section permit a trial?',
      960,
      985,
      v.hold ? C.ink : C.yellow,
      38,
    );
  });
}
export default {
  id: 'fresh-scorer-screen',
  draw: drawFreshScorerScreen,
  cues: [
    'screen-pairs',
    'screen-members',
    'screen-source',
    'fresh-pair-result',
    'fresh-ensemble-result',
    'fresh-source-result',
    'screen-decision',
  ],
};
