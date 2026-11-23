import { motion } from '../construction.mjs';
import { arrow, badge, formula, panel, tokenRow } from '../defaults.mjs';
function paintRewardStage(ctx, scene, state, api) {
  const beat = state.beat ?? 0;
  const context = panel(api, ctx, 440, 240, 1040, 124, api.C.cyan);
  badge(api, ctx, 'SHARED CONTEXT', context.cx, 285, api.C.cyan);
  api.focus.target('shared-context', () =>
    badge(api, ctx, 'system rules + prompt + tools + history', context.cx, 336, api.C.ink, 32),
  );
  const left = panel(api, ctx, 170, 470, 700, 238, api.C.green);
  const right = panel(api, ctx, 1050, 470, 700, 238, api.C.red);
  arrow(api, ctx, 730, 364, left.cx, left.y, api.C.green);
  arrow(api, ctx, 1190, 364, right.cx, right.y, api.C.red);
  badge(api, ctx, 'CHOSEN ANSWER', left.cx, 516, api.C.green);
  badge(api, ctx, 'REJECTED ANSWER', right.cx, 516, api.C.red);
  if (beat === 0) {
    const verified = Math.floor(
      api.focus.progress('match-shared-context', motion(state, 0.35, 0.69)) * 3.99,
    );
    ['SYS', 'ASK', 'CTX'].forEach((value, i) => {
      api.focus.target('matched-prefix', () =>
        tokenRow(
          api,
          ctx,
          [value],
          258 + i * 126,
          553,
          verified > i ? api.C.cyan : api.C.blue,
          112,
          14,
          24,
        ),
      );
      api.focus.target('matched-prefix', () =>
        tokenRow(
          api,
          ctx,
          [value],
          1138 + i * 126,
          553,
          verified > i ? api.C.cyan : api.C.blue,
          112,
          14,
          24,
        ),
      );
    });
    tokenRow(api, ctx, ['A'], 665, 553, api.C.green, 90);
    tokenRow(api, ctx, ['B'], 1545, 553, api.C.red, 90);
    badge(api, ctx, 'open the review ticket', left.cx, 664, api.C.ink, 29);
    badge(api, ctx, 'grant access immediately', right.cx, 664, api.C.ink, 29);
  } else if (beat === 1) {
    const distinct =
      api.focus.progress('retain-answer-token', Number((state.beatP ?? state.p) >= 0.67)) >= 0.5;
    const scan = Math.min(
      3,
      Math.floor(api.focus.progress('inspect-scorer-input', motion(state, 0.1, 0.34)) * 4),
    );
    [316, 942, 128, 421].forEach((value, i) => {
      api.focus.target(i === 3 ? 'answer-token' : 'scorer-prefix', () =>
        tokenRow(
          api,
          ctx,
          [value],
          286 + i * 116,
          570,
          i === scan ? api.C.yellow : api.C.green,
          100,
          16,
          25,
        ),
      );
      api.focus.target(i === 3 ? 'answer-token' : 'scorer-prefix', () =>
        tokenRow(
          api,
          ctx,
          [i === 3 && distinct ? 905 : value],
          1166 + i * 116,
          570,
          i === 3 && distinct ? api.C.red : i === scan ? api.C.yellow : api.C.green,
          100,
          16,
          25,
        ),
      );
    });
    badge(api, ctx, 'same chat template', left.cx, 674, api.C.muted, 27);
    badge(api, ctx, 'illustrative token IDs', right.cx, 674, api.C.muted, 27);
    api.focus.reveal('identical-input-scores', () =>
      api.focus.target('input-score-contract', () =>
        formula(
          api,
          ctx,
          distinct
            ? '\\mathrm{ids}_A\\ne\\mathrm{ids}_B'
            : '\\mathrm{ids}_A=\\mathrm{ids}_B\\;\\Longrightarrow\\;r_A=r_B',
          960,
          875,
          47,
          distinct ? api.C.yellow : api.C.ink,
          'center',
        ),
      ),
    );
  } else {
    badge(api, ctx, 'strict preference', left.cx, 598, api.C.green, 36);
    badge(api, ctx, 'strict preference', right.cx, 598, api.C.red, 36);
    badge(api, ctx, 'KEEP ADDITIONAL FIELDS', 960, 787, api.C.yellow, 27);
    const values = ['ties / abstentions', 'model checkpoint', 'annotator cohort'];
    values.forEach((value, i) => {
      const box = panel(api, ctx, 190 + i * 550, 834, 510, 76, api.C.muted);
      api.focus.target('pair-metadata', () => badge(api, ctx, value, box.cx, 883, api.C.ink, 28));
      const recorded = motion(
        state,
        i === 0 ? 0 : i === 1 ? 0.16 : 0.32,
        i === 0 ? 0.12 : i === 1 ? 0.3 : 0.44,
      );
      api.trace(
        ctx,
        [
          {
            x: box.x + 205,
            y: 945,
          },
          {
            x: box.x + 225,
            y: 965,
          },
          {
            x: box.x + 267,
            y: 922,
          },
        ],
        recorded,
        api.C.green,
        5,
      );
    });
  }
}

export function drawPairContract(ctx, scene, state, api) {
  ctx.save();
  paintRewardStage(ctx, scene, state, api);
  ctx.restore();
}
export default {
  id: 'pair-contract',
  draw: drawPairContract,
  cues: [
    'match-shared-context',
    'inspect-scorer-input',
    'identical-input-scores',
    'retain-answer-token',
    'pair-contract-b3-1',
  ],
};
