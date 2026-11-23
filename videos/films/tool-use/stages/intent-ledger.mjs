import { cueProgress } from '../arithmetic.mjs';
import { releasePromotionTarget } from '../model.mjs';
import { chapterText, heading, rectangle, table } from '../defaults.mjs';
export function drawIntentLedger(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0)),
    cueProgress2 = (id, beat = currentBeat) =>
      currentBeat < beat
        ? 0
        : currentBeat > beat
          ? 1
          : cueProgress(state.cues, 'tu-' + id, Math.max(0, Math.min(1, (progress - 0.08) / 0.8))),
    resultComplete = (id, beat = currentBeat) =>
      currentBeat > beat ||
      (currentBeat === beat &&
        (state.cues ? state.cues['tu-' + id]?.phase === 'after' : progress >= 0.9));
  api.focus.target('tu-intent-ledger-mechanism', () => {
    heading(ctx, api, 'One target ledger separates transport retry from a new intent');
    const target = releasePromotionTarget(),
      s = {
        principal: 'alice',
        project: 'search',
        can_promote: true,
      },
      args = {
        release_id: 'reranker-v17',
      },
      lost = resultComplete('intent-lost-reply', 0) || currentBeat > 0,
      replay = resultComplete('intent-replay', 0) || currentBeat > 0;
    let r = target.snapshot();
    if (lost)
      r = target.apply(s, args, 'a', {
        loseResponse: true,
      });
    if (replay) r = target.apply(s, args, 'a');
    const second = currentBeat >= 1 && resultComplete('intent-second', 1),
      collision = currentBeat >= 1 && resultComplete('intent-collision', 1);
    if (second) r = target.apply(s, args, 'b');
    let error = null;
    if (collision)
      error = target.apply(
        s,
        {
          release_id: 'reranker-v18',
        },
        'collision',
      );
    const rows = target.snapshot().ledger;
    table(
      ctx,
      api,
      ['saved operation key', 'bound candidate', 'saved result'],
      rows.map((x) => [x.key, x.result.split(' ').at(-1), x.result]),
      150,
      390,
      [590, 380, 660],
      100,
    );
    const attempted =
      currentBeat > 1 || (currentBeat === 1 && cueProgress2('intent-attempt', 1) > 0);
    if (attempted) {
      rectangle(
        ctx,
        api,
        150,
        650,
        1580,
        155,
        themeColors.panel,
        error ? themeColors.pink : themeColors.yellow,
        2,
      );
      chapterText(
        ctx,
        api,
        'Attempted request · op-A',
        170,
        690,
        29,
        error ? themeColors.pink : themeColors.yellow,
      );
      chapterText(ctx, api, 'reranker-v18 · weights-18', 170, 735, 30, themeColors.cyan);
      chapterText(
        ctx,
        api,
        'alice · search · promote · policy P7',
        170,
        780,
        26,
        themeColors.muted,
      );
      chapterText(ctx, api, 'Stored op-A remains weights-17', 1010, 705, 29, themeColors.blue);
      chapterText(
        ctx,
        api,
        error
          ? 'fingerprints differ · no new effect'
          : 'Compare the changed candidate before applying',
        1010,
        765,
        25,
        error ? themeColors.pink : themeColors.muted,
      );
    }
    chapterText(
      ctx,
      api,
      'Target effects: ' + target.snapshot().effects,
      150,
      875,
      34,
      themeColors.green,
    );
    chapterText(
      ctx,
      api,
      'Transport attempts: ' + target.snapshot().requests,
      850,
      875,
      32,
      themeColors.cyan,
    );
    if (currentBeat === 0)
      chapterText(
        ctx,
        api,
        replay
          ? 'Caller receives saved result'
          : lost
            ? 'Caller: unknown; original operation retained'
            : 'No target operation recorded',
        150,
        970,
        30,
        lost && !replay ? themeColors.yellow : themeColors.green,
      );
    if (currentBeat === 1)
      chapterText(
        ctx,
        api,
        error
          ? error.reason
          : second
            ? 'New approval op-B owns a second intent'
            : 'The original op-A remains a replay',
        150,
        970,
        30,
        error ? themeColors.pink : themeColors.yellow,
      );
    if (currentBeat === 2)
      chapterText(
        ctx,
        api,
        'Atomic effect + record · durability · concurrency · key retention',
        150,
        970,
        29,
        themeColors.yellow,
      );
  });
}
export default {
  id: 'intent-ledger',
  draw: drawIntentLedger,
  cues: [
    'tu-intent-ledger-1',
    'tu-intent-lost-reply',
    'tu-intent-replay',
    'tu-intent-one-effect',
    'tu-intent-ledger-2',
    'tu-intent-second',
    'tu-intent-collision',
    'tu-intent-attempt',
    'tu-intent-ledger-3',
  ],
};
