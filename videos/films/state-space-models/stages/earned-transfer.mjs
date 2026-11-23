import { timingFixture } from '../model.mjs';
import { cueDone, cueMotion, extensionText, footer } from '../defaults.mjs';

function timing(ctx, state, api) {
  const { C } = api;
  const fresh = state.beat > 0,
    question = state.beat === 1;
  const tokens = fresh ? 256 : 16,
    steps = tokens - 1;
  const v = timingFixture(tokens),
    id = fresh ? 'ssm-timing256' : 'ssm-timing16';
  const build = question ? 0 : cueMotion(state, id, fresh ? 2 : 0, 0.55, 0.76);
  const done = !question && cueDone(state, id, fresh ? 2 : 0, 0.76);
  const crossing = !question && cueDone(state, 'ssm-timing-crossing', 2, 0.94);
  const txt = (value, x, y, size, color, align = 'center') =>
    extensionText(ctx, api, value, x, y, size, color, align);
  const startX = 400,
    scale = 1.15;
  txt(
    'Token 1 from prefill   +   ' + steps + ' later steps   =   ' + tokens + ' outputs',
    960,
    295,
    42,
    C.ink,
  );
  for (const [i, total] of [v.attention, v.ssm].entries()) {
    const y = 475 + i * 210,
      color = i ? C.pink : C.blue;
    const prefill = timingFixture(1);
    const startup = i ? prefill.ssm : prefill.attention;
    const rate = i ? 1.8 : 3.2;
    txt(i ? 'SSM' : 'Attention', 310, y + 52, 42, color, 'right');
    txt(
      startup + ' ms prefill   +   ' + steps + ' × ' + rate + ' ms',
      startX,
      y - 30,
      37,
      C.ink,
      'left',
    );
    api.rect(ctx, startX, y, startup * scale, 62, color);
    if (build > 0)
      api.rect(
        ctx,
        startX + startup * scale,
        y,
        (total - startup) * scale * build,
        62,
        color + '77',
      );
    api.line(ctx, startX, y + 80, startX + 1000 * scale, y + 80, C.muted, 2);
    txt(done ? total + ' ms' : '? ms', 1680, y + 52, 50, done ? color : C.muted);
  }
  txt(
    crossing
      ? '30 ms extra at startup ÷ 1.4 ms saved per later step ≈ 21.43 steps'
      : question
        ? 'Predict the totals and which model wins'
        : done
          ? fresh
            ? 'SSM finishes 327 ms earlier at 256 outputs'
            : 'Attention finishes 9 ms earlier at 16 outputs'
          : 'Elapsed time from request to final token',
    960,
    885,
    37,
    question || crossing ? C.yellow : C.ink,
  );
  footer(
    ctx,
    api,
    crossing
      ? 'First integer SSM win at output 23   ·   At 256 outputs the saving is 327 ms.'
      : 'Supplied times for this worksheet   ·   Both rows use the same millisecond scale.',
  );
}

export function drawEarnedTransfer(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const currentBeat = state.beat ?? 0;
  const progress = api.clamp(state.beatP ?? 0);
  const cueProgress = (id) => (state.cues ? (state.cues[id]?.progress ?? 0) : progress);
  const resultComplete = (id) =>
    state.cues ? state.cues[id]?.phase === 'after' : progress >= 0.98;
  const build = (id) => (resultComplete(id) ? 1 : 0.96 * cueProgress(id));
  const target =
    currentBeat < 3
      ? 'earned-transfer-mechanism'
      : 'earned-transfer-extension-' + (currentBeat + 1);
  api.focus.target(target, () => {
    if (currentBeat < 3) {
      timing(ctx, state, api);
    } else if (currentBeat === 3) {
      extensionText(ctx, api, 'Every token traverses the same fixed 32-layer stack', 960, 280, 38);
      const q = build('ssm-hybrid-cache');
      for (let i = 0; i < 32; i++) {
        const attention = [3, 11, 19, 27].includes(i),
          x = 240 + (i % 16) * 90,
          y = 420 + Math.floor(i / 16) * 220;
        api.rect(ctx, x, y, 60, 110, attention ? themeColors.pink : themeColors.blue);
        if (attention && q > 0) api.rect(ctx, x, y + 125, 60, 55 * q, themeColors.pink + '66');
      }
      extensionText(
        ctx,
        api,
        resultComplete('ssm-hybrid-cache')
          ? '32 GiB × 4/32 = 4 GiB of growing KV'
          : 'Keep KV only for the four attention layers',
        960,
        925,
        36,
        themeColors.pink,
      );
      footer(
        ctx,
        api,
        'Count recurrent state, separate snapshots and runtime allocations in addition to KV',
      );
    } else {
      extensionText(
        ctx,
        api,
        'Layer-count conventions describe different objects',
        960,
        280,
        38,
        themeColors.yellow,
      );
      const jamba = build('jamba-mixers');
      const q = build('ssm-hybrid-models');
      for (let i = 0; i < Math.ceil(jamba * 8); i++)
        api.rect(ctx, 300 + i * 175, 420, 120, 100, i ? themeColors.blue : themeColors.pink);
      extensionText(
        ctx,
        api,
        resultComplete('jamba-mixers')
          ? 'Original Jamba: 1 attention + 7 Mamba mixers, each paired with an MLP'
          : 'Construct the eight mixer roles',
        960,
        625,
        30,
      );
      for (let i = 0; i < Math.ceil(q * 52); i++)
        api.rect(
          ctx,
          250 + (i % 26) * 55,
          750 + Math.floor(i / 26) * 80,
          38,
          55,
          i < 4 ? themeColors.pink : i < 28 ? themeColors.blue : themeColors.green,
        );
      extensionText(
        ctx,
        api,
        resultComplete('ssm-hybrid-models')
          ? '2025 Nemotron-H: 4 attention / 24 Mamba 2 / 24 feed-forward sublayers'
          : 'Count separately defined sublayers',
        960,
        955,
        30,
      );
      footer(
        ctx,
        api,
        'These count strips do not prescribe a layer order or establish comparable compute shares',
      );
    }
  });
}
export default { id: 'earned-transfer', draw: drawEarnedTransfer };
