import { cueProgress, moderationBar, moderationNote, moderationText } from '../defaults.mjs';
export function drawCapacityLedger(ctx, scene, state, api) {
  return api.focus.target('capacity-ledger-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    const done = (id) => cueProgress(ctx, api, id) === 1;
    {
      if (currentBeat === 0) {
        moderationText(
          ctx,
          api,
          done('capacity-daily')
            ? '2,400,000 posts / 86,400 s ≈ 27.8/s async average'
            : '2,400,000 posts / 86,400 s / average pending',
          170,
          285,
          32,
          themeColors.muted,
        );
        moderationText(
          ctx,
          api,
          'Separate synchronous burst: 10,000 requests/s',
          170,
          355,
          33,
          themeColors.cyan,
        );
        const stages = [
          ['Rules + cache', 10000, 8000],
          ['Classifier', 2000, 1500],
          ['Judge', 500, 400],
        ];
        stages.forEach(([name, input, exit], i) => {
          const y = 445 + i * 150,
            q = cueProgress(ctx, api, 'capacity-flow'),
            ready = q > i / 3;
          moderationText(ctx, api, name, 170, y + 35, 29, themeColors.ink);
          moderationBar(
            ctx,
            api,
            520,
            y,
            960,
            55,
            ready ? [exit, input - exit] : [0, input],
            10000,
            [themeColors.green, themeColors.blue],
          );
          if (ready)
            moderationText(
              ctx,
              api,
              input.toLocaleString() +
                ' in · ' +
                exit.toLocaleString() +
                ' exit · ' +
                (input - exit).toLocaleString() +
                ' onward',
              520,
              y + 105,
              27,
              themeColors.cyan,
            );
        });
        moderationNote(
          ctx,
          api,
          'Every bar uses the same 10,000/s scale; stage work includes onward traffic.',
        );
      } else if (currentBeat === 1) {
        moderationText(ctx, api, '100 cases/s × 120 s handling', 180, 290, 35, themeColors.yellow);
        moderationText(ctx, api, 'Productive occupancy: 70%', 180, 365, 32, themeColors.muted);
        const busy = done('capacity-busy'),
          staff = done('capacity-staff');
        if (busy) {
          moderationBar(ctx, api, 180, 475, 1520, 115, [12000, staff ? 5143 : 0], 17143, [
            themeColors.blue,
            themeColors.yellow,
          ]);
          moderationText(ctx, api, '12,000 busy', 180, 655, 37, themeColors.blue);
        }
        if (staff) {
          moderationText(
            ctx,
            api,
            '5,143 capacity outside productive handling',
            1700,
            655,
            29,
            themeColors.yellow,
            'right',
          );
          moderationText(
            ctx,
            api,
            'ceil(12,000 / 0.70) = 17,143 concurrent staff',
            960,
            820,
            41,
            themeColors.pink,
            'center',
          );
        }
        moderationNote(
          ctx,
          api,
          'Below the required staffing level, cases accumulate in review.',
        );
      } else {
        moderationText(
          ctx,
          api,
          'Authored full-batch capacity; stability assumptions apply',
          160,
          270,
          31,
        );
        for (let i = 0; i < 32; i++)
          api.rect(ctx, 180 + (i % 8) * 48, 365 + Math.floor(i / 8) * 48, 38, 38, themeColors.blue);
        moderationText(ctx, api, '32 classifier items', 180, 620, 32, themeColors.blue);
        moderationText(ctx, api, '8 ms service', 180, 685, 31, themeColors.yellow);
        if (done('capacity-batch'))
          moderationText(ctx, api, '32 / 0.008 = 4,000 items/s', 180, 790, 35, themeColors.green);
        moderationText(
          ctx,
          api,
          'Judge: 500 arrivals/s × mean residence 0.4 s',
          900,
          375,
          28,
          themeColors.cyan,
        );
        if (done('capacity-flight')) {
          for (let i = 0; i < 200; i++)
            api.rect(
              ctx,
              960 + (i % 20) * 32,
              450 + Math.floor(i / 20) * 32,
              24,
              22,
              themeColors.cyan,
            );
          moderationText(ctx, api, '200 in flight', 1250, 855, 37, themeColors.cyan, 'center');
        }
        moderationNote(
          ctx,
          api,
          'Replica lower bound ≠ provisioned capacity; complete validated decisions own the deadline.',
        );
      }
    }
  });
}
export default {
  id: 'capacity-ledger',
  draw: drawCapacityLedger,
  cues: [
    'capacity-daily',
    'capacity-flow',
    'capacity-busy',
    'capacity-staff',
    'capacity-batch',
    'capacity-flight',
  ],
};
