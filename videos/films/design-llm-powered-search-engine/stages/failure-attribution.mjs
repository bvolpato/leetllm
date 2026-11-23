import { clamp, motion } from '../arithmetic.mjs';
import { chapterFooter, chapterRect, chapterText } from '../defaults.mjs';
export function drawFailureAttribution(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cue = (name, index = 0) => {
    const q = state.cues?.['se-failure-attribution-' + name];
    if (state.cues && !q)
      throw Error('Undeclared or absent current-scene cue se-failure-attribution-' + name);
    return q
      ? {
          progress: q.phase === 'before' ? 0 : q.phase === 'after' ? 1 : q.progress,
          done: q.phase === 'after',
        }
      : {
          progress: currentBeat < index ? 0 : currentBeat > index ? 1 : motion(progress),
          done: currentBeat > index || (currentBeat === index && progress > 0.76),
        };
  };
  const done = (name, index) => cue(name, index).done;
  api.focus.target('se-failure-attribution-mechanism', () => {
    const scenarios = [
        {
          label: 'Current policy absent',
          retrieved: ['Exception'],
          packed: ['Exception'],
          approval: true,
          authorized: true,
        },
        {
          label: 'Exception lost in packing',
          retrieved: ['Policy', 'Exception'],
          packed: ['Policy'],
          approval: true,
          authorized: true,
        },
        {
          label: 'Approval condition omitted',
          retrieved: ['Policy', 'Exception'],
          packed: ['Policy', 'Exception'],
          approval: false,
          authorized: true,
        },
        {
          label: 'Forbidden source exported',
          retrieved: ['Policy', 'Exception'],
          packed: ['Policy', 'Exception'],
          approval: true,
          authorized: false,
        },
      ],
      which =
        currentBeat > 1
          ? 3
          : currentBeat === 1
            ? done('security', 1)
              ? 3
              : done('support', 1)
                ? 2
                : done('pack', 1)
                  ? 1
                  : 0
            : 0,
      v = scenarios[which];
    chapterText(
      ctx,
      api,
      currentBeat === 1 ? v.label : 'Follow one source identity through the observed trace',
      170,
      285,
      33,
      themeColors.blue,
    );
    const stages = [
      ['retrieved', v.retrieved],
      ['packed', v.packed],
    ];
    stages.forEach(([name, values], j) => {
      chapterText(ctx, api, name, 190 + j * 850, 405, 30, themeColors.muted);
      ['Policy', 'Exception'].forEach((name, i) => {
        const x = 190 + j * 850,
          y = 480 + i * 145;
        chapterRect(
          ctx,
          api,
          x,
          y,
          680,
          105,
          themeColors.panel,
          values.includes(name) ? (i ? themeColors.green : themeColors.blue) : themeColors.muted,
        );
        chapterText(
          ctx,
          api,
          values.includes(name) ? name : 'Missing ' + name,
          x + 35,
          y + 66,
          31,
          values.includes(name) ? themeColors.ink : themeColors.pink,
        );
      });
    });
    chapterText(
      ctx,
      api,
      'Answer condition: ' + (v.approval ? 'with security approval' : 'omitted'),
      190,
      850,
      31,
      v.approval ? themeColors.green : themeColors.pink,
    );
    chapterText(
      ctx,
      api,
      'Export authorized: ' + v.authorized,
      1050,
      850,
      29,
      v.authorized ? themeColors.green : themeColors.pink,
    );
    const cause = !v.authorized
      ? 'access'
      : !v.retrieved.includes('Policy')
        ? 'ingestion / retrieval'
        : !v.packed.includes('Exception')
          ? 'packing'
          : !v.approval
            ? 'synthesis / support'
            : 'no demonstrated failure';
    chapterText(ctx, api, 'Investigate: ' + cause, 190, 940, 32, themeColors.yellow);
    if (currentBeat === 2)
      chapterFooter(ctx, api, 'This citation disclosed a source outside the reader’s workspace.');
  });
}
export default {
  id: 'failure-attribution',
  draw: drawFailureAttribution,
  cues: [
    'se-failure-attribution-0',
    'se-failure-attribution-1',
    'se-failure-attribution-pack',
    'se-failure-attribution-support',
    'se-failure-attribution-security',
    'se-failure-attribution-2',
  ],
};
