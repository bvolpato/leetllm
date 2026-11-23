import { coords, rankOf, sampleModel } from '../model.mjs';
import { equation, text } from '../defaults.mjs';
export function drawMesh(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('mesh', state),
    currentBeat = modelState.b;
  {
    const active =
        modelState.peers[
          Math.min(modelState.peers.length - 1, Math.floor(modelState.q * modelState.peers.length))
        ],
      coordinate = coords(active);
    text(
      ctx,
      api,
      `Rank 3 · ${modelState.axis.toUpperCase()} group [${modelState.peers.join(', ')}]`,
      960,
      278,
      35,
      themeColors.yellow,
      'center',
    );
    for (let pp = 0; pp < 2; pp++)
      for (let cp = 0; cp < 2; cp++) {
        const x = 385 + pp * 745,
          y = 370 + cp * 290;
        text(ctx, api, `PP ${pp} · CP ${cp}`, x + 300, y - 45, 26, themeColors.blue, 'center');
        for (let tp = 0; tp < 4; tp++)
          text(ctx, api, `TP ${tp}`, x + 75 + 150 * tp, y - 10, 23, themeColors.muted, 'center');
        for (let dp = 0; dp < 4; dp++)
          text(ctx, api, `DP ${dp}`, x - 20, y + 33 + dp * 50, 23, themeColors.muted, 'right');
        api.focus.target(
          'mesh-array-from-length-4-dp-array-from-length-4-tp-rankof-tp-cp-dp-pp',
          () =>
            teaching.grid({
              x,
              y,
              width: 600,
              height: 200,
              rows: 4,
              columns: 4,
              labels: Array.from(
                {
                  length: 4,
                },
                (_, dp) =>
                  Array.from(
                    {
                      length: 4,
                    },
                    (_, tp) =>
                      rankOf({
                        tp,
                        cp,
                        dp,
                        pp,
                      }),
                  ),
              ),
              fontSize: 29,
              fill: themeColors.panel,
              stroke: themeColors.muted,
              textColor: themeColors.ink,
              cellFocusTarget: (dp, tp) => {
                const rank = rankOf({
                  tp,
                  cp,
                  dp,
                  pp,
                });
                return [
                  ...(rank === 3 ? ['mesh-selected-rank'] : []),
                  ...(modelState.peers.includes(rank) ? ['mesh-group-peers'] : []),
                ];
              },
              highlights: modelState.peers.flatMap((rank) => {
                const c = coords(rank);
                return c.pp === pp && c.cp === cp
                  ? [
                      {
                        row: c.dp,
                        column: c.tp,
                        fill: themeColors.panel,
                        stroke:
                          rank === active
                            ? themeColors.green
                            : rank === 3
                              ? themeColors.yellow
                              : themeColors.cyan,
                      },
                    ]
                  : [];
              }),
            }),
        );
      }
    const stride = {
      tp: 1,
      cp: 4,
      dp: 8,
      pp: 32,
    }[modelState.axis];
    text(
      ctx,
      api,
      `Current peer ${active}: TP ${coordinate.tp} · CP ${coordinate.cp} · DP ${coordinate.dp} · PP ${coordinate.pp}`,
      960,
      916,
      29,
      themeColors.green,
      'center',
    );
    api.focus.target('mesh-coordinate-strides', () =>
      equation(
        ctx,
        api,
        String.raw`r=\mathrm{TP}+4\mathrm{CP}+8\mathrm{DP}+32\mathrm{PP}`,
        960,
        974,
        34,
      ),
    );
    text(
      ctx,
      api,
      `${modelState.axis.toUpperCase()} changes on stride ${stride} · ${modelState.world} distinct coordinates · other coordinates stay fixed`,
      960,
      1022,
      26,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'mesh',
  draw: drawMesh,
  cues: ['mesh-rank-three-peers', 'mesh-pipeline-peers', 'mesh-pipeline-stride', 'mesh-data-peers'],
};
