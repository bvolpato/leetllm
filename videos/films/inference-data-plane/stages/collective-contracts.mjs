import { L, rectangle, text } from '../defaults.mjs';
export function drawCollectiveContracts(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    { C: themeColors } = api;
  const q = (i, a = 0.12, z = 0.8) =>
    currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  const body = () => {
    if (currentBeat === 3) {
      const steps = [
          'host call returned',
          'group enqueue issued',
          'GPU complete',
          'consumer may read',
        ],
        done = Math.floor(q(3) * 4);
      steps.forEach((v, i) => {
        const x = 160 + i * 435;
        rectangle(ctx, api, x, 440, 385, 185, i < done ? themeColors.green : themeColors.muted);
        text(
          ctx,
          api,
          v,
          x + 192,
          510,
          27,
          i < done ? themeColors.green : themeColors.muted,
          'center',
        );
        text(
          ctx,
          api,
          i < done ? 'receipt' : 'pending',
          x + 192,
          580,
          31,
          i < done ? themeColors.green : themeColors.yellow,
          'center',
        );
      });
      text(
        ctx,
        api,
        'in-progress issuance must resolve before related CUDA synchronization',
        960,
        790,
        34,
        themeColors.yellow,
        'center',
      );
      text(
        ctx,
        api,
        'Then enforce the consumer stream dependency or completion event',
        960,
        910,
        34,
        themeColors.cyan,
        'center',
      );
    } else {
      const cue = (id, fallback) => api.focus.progress(id, fallback),
        mismatch =
          currentBeat === 2 &&
          cue('collective-swapped', q(2, 0.1, 0.3)) > 0 &&
          cue('collective-repaired', q(2, 0.75, 0.9)) === 0,
        inputs = mismatch
          ? [
              [1, 2],
              [20, 10],
            ]
          : [
              [1, 2],
              [10, 20],
            ],
        sum = inputs[0].map((v, i) => v + inputs[1][i]),
        stage =
          currentBeat < 1
            ? 0
            : currentBeat > 1
              ? 1
              : cue('collective-gather-reduced', q(1, 0.8, 0.9)) > 0
                ? 4
                : cue('collective-reduce-scatter', q(1, 0.55, 0.65)) > 0
                  ? 3
                  : cue('collective-all-gather', q(1, 0.3, 0.4)) > 0
                    ? 2
                    : cue('collective-all-reduce', q(1, 0.1, 0.2)) > 0
                      ? 1
                      : 0;
      text(
        ctx,
        api,
        mismatch
          ? 'Layer order swapped: same shapes, wrong meaning'
          : 'R4219 · same indexed contribution on both rank lanes',
        960,
        285,
        35,
        mismatch ? themeColors.pink : themeColors.yellow,
        'center',
      );
      inputs.forEach((values, rank) => {
        const y = 400 + rank * 250;
        text(
          ctx,
          api,
          'rank ' + rank,
          160,
          y + 55,
          34,
          rank ? themeColors.green : themeColors.blue,
        );
        values.forEach((v, i) => {
          rectangle(
            ctx,
            api,
            375 + i * 130,
            y,
            110,
            110,
            rank ? themeColors.green : themeColors.blue,
          );
          text(
            ctx,
            api,
            String(v),
            430 + i * 130,
            y + 70,
            46,
            rank ? themeColors.green : themeColors.blue,
            'center',
          );
          text(
            ctx,
            api,
            'layer ' + (rank === 1 && mismatch ? ['B', 'A'][i] : ['A', 'B'][i]),
            430 + i * 130,
            y - 26,
            23,
            themeColors.muted,
            'center',
          );
        });
        L(ctx, api, 685, y + 55, 1025, y + 55, themeColors.muted, 3);
        api.focus.target('collective-output', () => {
          if (stage > 0) {
            const outputs = stage === 2 ? inputs.flat() : stage === 3 ? [sum[rank]] : sum;
            outputs.forEach((v, i) => {
              const x = 1085 + i * 150;
              rectangle(ctx, api, x, y, 130, 110, mismatch ? themeColors.pink : themeColors.yellow);
              text(
                ctx,
                api,
                String(v),
                x + 65,
                y + 70,
                46,
                mismatch ? themeColors.pink : themeColors.yellow,
                'center',
              );
            });
          } else text(ctx, api, 'await operation', 1420, y + 70, 34, themeColors.muted, 'center');
        });
      });
      const caption = mismatch
        ? 'Wrong layer identities → incorrect sums [21,12]'
        : stage === 0
          ? 'Control authorizes placement; data plane carries tensor contributions'
          : stage === 2
            ? 'all-gather → [1,2,10,20] on both ranks'
            : stage === 3
              ? 'reduce-scatter → rank0 owns[11], rank1 owns[22]'
              : stage === 4
                ? 'gather reduced chunks → reconstruct[11,22]'
                : 'sum all-reduce → both ranks own[11,22]';
      text(
        ctx,
        api,
        caption,
        960,
        930,
        35,
        mismatch ? themeColors.pink : themeColors.green,
        'center',
      );
      text(
        ctx,
        api,
        'Match operation, count, dtype and collective sequence',
        960,
        1020,
        32,
        themeColors.cyan,
        'center',
      );
    }
  };
  if (api.focus)
    api.focus.target('collective-contracts-construction', () => {
      body();
    });
  else body();
}
export default {
  id: 'collective-contracts',
  draw: drawCollectiveContracts,
  cues: [
    'collective-contracts-b1',
    'collective-contracts-b2',
    'collective-all-reduce',
    'collective-all-gather',
    'collective-reduce-scatter',
    'collective-gather-reduced',
    'collective-contracts-b3',
    'collective-swapped',
    'collective-repaired',
    'collective-contracts-b4',
  ],
};
