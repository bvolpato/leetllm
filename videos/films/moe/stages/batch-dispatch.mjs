import { BATCH_ROUTES, ROUTING } from '../fixtures.mjs';
import { circle, packet, path, rect, text } from '../defaults.mjs';
export function drawBatchDispatch(ctx, scene, state, api) {
  const themeColors = api.C;
  const beat = state.beat ?? 0;
  const bp = api.clamp(state.beatP ?? 0, 0, 1);
  const stage = (index, from = 0.06, until = 0.9) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(bp, from, until);
  const colors = [themeColors.blue, themeColors.pink, themeColors.yellow, themeColors.green];
  const tokens = [
    themeColors.cyan,
    themeColors.pink,
    themeColors.yellow,
    themeColors.blue,
    themeColors.green,
    themeColors.red,
    '#c4a9ff',
    '#b2c8f3',
  ];
  const fade = api.components.fade;
  {
    const dispatch = api.focus.progress('group-assignments', stage(0, 0.12, 0.9)),
      execute = api.focus.progress('expert-matrix', stage(1, 0.06, 0.88)),
      combine = api.focus.progress('restore-order', stage(2, 0.01, 0.42));
    const sourceX = 205,
      queueX = 980,
      outputX = 1690;
    const sourceY = (index) => 350 + index * 95;
    const expertY = (index) => 355 + index * 145;
    const grouped = [0, 1, 2, 3].map((expert) =>
      BATCH_ROUTES.flatMap((route, token) => (route.includes(expert) ? [token] : [])),
    );
    api.focus.target('batch-dispatch-token-order', () =>
      text(ctx, api, 'TOKEN ORDER', sourceX, 265, 30, themeColors.muted, 'center'),
    );
    api.focus.target('batch-dispatch-group-by-expert', () =>
      text(ctx, api, 'GROUP BY EXPERT', 960, 265, 30, themeColors.muted, 'center'),
    );
    api.focus.target('batch-dispatch-restore-token-order', () =>
      text(ctx, api, 'RESTORE TOKEN ORDER', outputX, 265, 28, themeColors.muted, 'center'),
    );
    const transfers = [];
    for (let token = 0; token < 6; token += 1)
      for (const [choice, expert] of BATCH_ROUTES[token].entries()) {
        const row = grouped[expert].indexOf(token),
          slotX = queueX - 60 + row * 52;
        const start = {
            x: sourceX + 35,
            y: sourceY(token),
          },
          end = {
            x: slotX,
            y: expertY(expert) + 35,
          };
        const route = [
          start,
          {
            x: 450 + choice * 75,
            y: start.y,
          },
          {
            x: 720,
            y: end.y,
          },
          end,
        ];
        const returnRoute = [
          {
            x: 1143,
            y: end.y,
          },
          {
            x: 1210,
            y: end.y,
          },
          {
            x: 1475 - choice * 55,
            y: sourceY(token),
          },
          {
            x: outputX - 35,
            y: sourceY(token),
          },
        ];
        path(ctx, api, route, '#8d9cb927', 2);
        fade(combine, () => path(ctx, api, returnRoute, '#8d9cb927', 2));
        const travel = api.phase(
          dispatch,
          token * 0.055 + choice * 0.025,
          0.5 + token * 0.055 + choice * 0.025,
        );
        packet(ctx, api, route, travel, tokens[token], 12);
        packet(
          ctx,
          api,
          returnRoute,
          api.phase(combine, token * 0.05 + choice * 0.03, 0.55 + token * 0.05 + choice * 0.03),
          tokens[token],
          12,
        );
        transfers.push({
          token,
          expert,
          row,
          slotX,
          travel,
          returnP: api.phase(
            combine,
            token * 0.05 + choice * 0.03,
            0.55 + token * 0.05 + choice * 0.03,
          ),
        });
      }
    for (let expert = 0; expert < 4; expert += 1) {
      const bounds = api.focus.target('expert-assignment-rows', () =>
        rect(ctx, api, 800, expertY(expert) - 15, 325, 100, themeColors.panel, colors[expert], 13),
      );
      api.focus.target('expert-assignment-rows', () =>
        api.container(
          ctx,
          bounds,
          () => {
            api.focus.target('batch-dispatch-readout', () =>
              text(ctx, api, `E${expert + 1}`, 832, expertY(expert) + 47, 28, colors[expert]),
            );
            for (const transfer of transfers.filter((item) => item.expert === expert))
              fade(api.phase(transfer.travel, 0.92, 1), () => {
                const running = execute > (transfer.row + 1) / 5;
                api.focus.target('assignment-member', () =>
                  rect(
                    ctx,
                    api,
                    transfer.slotX - 22,
                    expertY(expert) + 10,
                    44,
                    50,
                    running ? tokens[transfer.token] : themeColors.bg,
                    tokens[transfer.token],
                    6,
                  ),
                );
                api.focus.target('batch-dispatch-readout-2', () =>
                  text(
                    ctx,
                    api,
                    `t${transfer.token}`,
                    transfer.slotX,
                    expertY(expert) + 44,
                    24,
                    running ? themeColors.bg : tokens[transfer.token],
                    'center',
                    'mono',
                  ),
                );
              });
          },
          {
            padding: 12,
          },
        ),
      );
    }
    for (let token = 0; token < 6; token += 1) {
      api.focus.target('source-token-identities', () =>
        circle(ctx, api, sourceX, sourceY(token), 25, tokens[token], themeColors.bg, 2),
      );
      api.focus.target('batch-dispatch-readout-3', () =>
        text(
          ctx,
          api,
          `t${token}`,
          sourceX - 48,
          sourceY(token) + 10,
          27,
          tokens[token],
          'right',
          'mono',
        ),
      );
      fade(combine, () => {
        api.focus.target('ordered-token-results', () =>
          circle(ctx, api, outputX, sourceY(token), 25, themeColors.panel, tokens[token], 3),
        );
        const arrivals = transfers.filter(
          (item) => item.token === token && item.returnP >= 0.99,
        ).length;
        if (arrivals > 0) circle(ctx, api, outputX - 8, sourceY(token), 7, tokens[token]);
        if (arrivals > 1) circle(ctx, api, outputX + 9, sourceY(token), 7, tokens[token]);
        api.focus.target('batch-dispatch-readout-4', () =>
          text(
            ctx,
            api,
            `t${token}`,
            outputX + 45,
            sourceY(token) + 10,
            27,
            tokens[token],
            'left',
            'mono',
          ),
        );
      });
    }
    if (execute > 0) {
      const selected = transfers.filter((item) => item.token === 0);
      selected.forEach((item, i) => {
        api.focus.target('batch-dispatch-readout-5', () =>
          text(
            ctx,
            api,
            `t0 · gate ${ROUTING.weights[i].toFixed(3)}`,
            962,
            expertY(item.expert) - 30,
            25,
            tokens[0],
            'center',
          ),
        );
      });
    }
  }
}
export default {
  id: 'batch-dispatch',
  draw: drawBatchDispatch,
  cues: [
    'persistent-token',
    'group-assignments',
    'expert-matrix',
    'carried-gates',
    'restore-order',
    'weighted-accumulation',
  ],
};
