import { box, constructionFooter, focusProgress, label } from '../defaults.mjs';
export function drawEvidenceAction(ctx, scene, state, api) {
  const { C, components: c, teaching: t, phase } = api,
    beat = state.beat ?? 0,
    p = state.beatP ?? 0,
    q = phase(p, 0.05, 0.88);
  {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    const done = (id) => focusProgress(ctx, api, id) >= 1;
    api.focus.target('sg-evidence-action-mechanism', () => {
      const invented = currentBeat === 0 && focusProgress(ctx, api, 'sg-quote-invented') > 0,
        changed = done('sg-action-change');
      box(
        ctx,
        api,
        'Supplied source',
        ['Run RUN-842 failed in unit-tests', 'after auth-cache timed out.'],
        180,
        295,
        1550,
        165,
        themeColors.yellow,
      );
      box(
        ctx,
        api,
        invented ? 'Separate invented quote' : 'Exact quoted bytes',
        invented
          ? ['RUN-842 needs immediate rollback.']
          : ['Run RUN-842 failed in unit-tests', 'after auth-cache timed out.'],
        180,
        540,
        1000,
        165,
        invented ? themeColors.pink : themeColors.blue,
      );
      box(
        ctx,
        api,
        'Proposed decision',
        [changed ? 'rollback' : 'retry_tests'],
        1260,
        540,
        470,
        165,
        themeColors.blue,
      );
      const member = !invented && (done('sg-quote-pass') || done('sg-membership-still-pass'));
      if (member) label(ctx, api, 'Source membership passes', 680, 805, themeColors.green, 30);
      if (invented && done('sg-quote-invented'))
        label(ctx, api, 'Invented sentence is absent → reject', 960, 865, themeColors.pink, 31);
      if (changed)
        label(
          ctx,
          api,
          'No release / rollback justification supplied',
          1170,
          890,
          themeColors.pink,
          29,
        );
      constructionFooter(
        ctx,
        api,
        invented
          ? 'Compare the invented bytes with the unchanged supplied source.'
          : 'An unchanged true quote can accompany a changed unsupported action.',
      );
    });
  }
}
export default {
  id: 'evidence-action',
  draw: drawEvidenceAction,
  cues: [
    'sg-evidence-action-0',
    'sg-quote-pass',
    'sg-quote-invented',
    'sg-evidence-action-1',
    'sg-action-change',
    'sg-membership-still-pass',
    'sg-evidence-action-2',
  ],
};
