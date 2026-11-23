import { submissionFrame } from '../construction.mjs';
import {
  cueProgress,
  readoutCell,
  retainedDrawCard,
  retainedDrawText,
  text,
} from '../defaults.mjs';
import { delayedWriteBranches } from '../validation.mjs';
function retainedDraw(ctx, scene, state, api) {
  const { C: themeColors, components: components, phase } = api;
  const beat = state.beat ?? 0,
    progress2 = state.beatP ?? 0,
    q = phase(progress2, 0.05, 0.9);
  {
    const result = submissionFrame(beat, progress2),
      queued = result.store.queued.length;
    retainedDrawText(
      ctx,
      api,
      'One submission · screen evidence and server evidence',
      960,
      285,
      34,
      themeColors.ink,
      'center',
    );
    const screen = components.panel({
      x: 140,
      y: 350,
      width: 700,
      height: 390,
      fill: 'transparent',
      stroke: themeColors.blue,
    });
    retainedDrawText(
      ctx,
      api,
      'CI PORTAL · unchanged screenshot',
      490,
      401,
      28,
      themeColors.blue,
      'center',
    );
    components.panel(
      {
        x: 185,
        y: 445,
        width: 610,
        height: 115,
        fill: themeColors.panel,
        stroke: themeColors.blue,
        padding: 12,
      },
      () => {
        retainedDrawText(ctx, api, result.screen.draft, 490, 485, 29, themeColors.ink, 'center');
        retainedDrawText(ctx, api, "KeyError: 'status'", 490, 535, 27, themeColors.pink, 'center');
      },
    );
    retainedDrawCard(ctx, api, 'Submit note', 185, 600, 250, themeColors.blue, 76, 27);
    api.focus.target('browser-confirmation', () =>
      retainedDrawCard(
        ctx,
        api,
        result.screen.confirmationBanner ? 'Confirmation shown' : 'No confirmation banner',
        465,
        600,
        330,
        themeColors.muted,
        76,
        23,
      ),
    );
    const backend = components.panel({
      x: 1130,
      y: 350,
      width: 650,
      height: 390,
      fill: 'transparent',
      stroke: themeColors.cyan,
    });
    retainedDrawText(
      ctx,
      api,
      'AUTHORITATIVE NOTE STORE',
      1455,
      401,
      28,
      themeColors.cyan,
      'center',
    );
    api.focus.target('server-state', () =>
      retainedDrawCard(
        ctx,
        api,
        queued
          ? 'N-1 · queued'
          : result.store.pending.length
            ? 'N-1 · pending'
            : 'No request received',
        1175,
        445,
        560,
        queued ? themeColors.green : themeColors.yellow,
        115,
        29,
      ),
    );
    retainedDrawText(
      ctx,
      api,
      `Pending requests: ${result.store.pending.length}`,
      1455,
      620,
      29,
      themeColors.yellow,
      'center',
    );
    retainedDrawText(
      ctx,
      api,
      `Queued notes: ${queued}`,
      1455,
      687,
      31,
      queued ? themeColors.green : themeColors.muted,
      'center',
    );
    const returning = result.probeProgress >= 0.5;
    const channel = api.connect(
      ctx,
      api.groupBounds(returning ? backend : screen),
      api.groupBounds(returning ? screen : backend),
      {
        color: themeColors.muted,
        width: 3,
        gap: 18,
      },
    );
    if (result.inputSent && result.writeProgress < 1)
      components.particle({
        points: [channel.from, channel.to],
        progress: result.writeProgress,
        radius: 8,
        fill: themeColors.cyan,
      });
    if (result.probeProgress > 0 && result.probeProgress < 1) {
      components.particle({
        points: [channel.from, channel.to],
        progress: returning ? result.probeProgress * 2 - 1 : result.probeProgress * 2,
        radius: 8,
        fill: returning ? themeColors.green : themeColors.yellow,
      });
    }
    retainedDrawText(
      ctx,
      api,
      beat < 2
        ? 'Write N-1'
        : result.receipt
          ? 'Receipt N-1'
          : result.probeProgress > 0
            ? 'Status probe'
            : 'Wait, then probe',
      985,
      490,
      25,
      result.receipt ? themeColors.green : themeColors.cyan,
      'center',
    );
    retainedDrawText(
      ctx,
      api,
      `Write requests sent: ${Number(result.inputSent)}`,
      490,
      785,
      29,
      themeColors.blue,
      'center',
    );
    const observed = result.receipt
      ? `HOST · queued confirmed · receipt ${result.receipt.requestId} · ${result.receipt.queuedCount} note`
      : result.probeProgress > 0
        ? 'HOST · outcome unknown · authoritative lookup in flight'
        : 'HOST · outcome unknown · screenshot alone';
    api.focus.target('server-receipt', () =>
      retainedDrawCard(
        ctx,
        api,
        observed,
        140,
        835,
        1640,
        result.receipt ? themeColors.green : themeColors.yellow,
        85,
        30,
      ),
    );
    if (result.deadlineBranchVisible)
      retainedDrawText(
        ctx,
        api,
        'If the deadline expires without evidence: unknown → human review',
        960,
        975,
        27,
        themeColors.muted,
        'center',
      );
    else if (queued)
      retainedDrawText(
        ctx,
        api,
        `Hypothetical second submission: ${result.replayWouldAddAnother} notes`,
        960,
        975,
        28,
        themeColors.pink,
        'center',
      );
    else {
    }
  }
}
export function drawVerifyAfterAction(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    { C: themeColors } = api,
    q = (i, a = 0.1, z = 0.85) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  const custom = currentBeat === 3;
  if (!custom) {
    api.focus.target('verify-after-action-delayed-state', () =>
      retainedDraw(ctx, scene, state, api),
    );
    return;
  }
  const body = () => {
    const f = delayedWriteBranches(),
      blind = cueProgress(ctx, api, 'blind-second-submit', q(3, 0.25, 0.4)) > 0,
      repair = cueProgress(ctx, api, 'wait-single-request', q(3, 0.55, 0.7)) > 0;
    text(
      ctx,
      api,
      'Local delayed-write fixture · same first Submit',
      960,
      280,
      36,
      themeColors.yellow,
      'center',
    );
    ['blind retry', 'wait + inspect original'].forEach((v, i) => {
      const x = 170 + i * 925;
      text(ctx, api, v, x + 325, 390, 36, i ? themeColors.green : themeColors.pink, 'center');
      readoutCell(ctx, api, 'screenshot: note count0', x, 460, 650, themeColors.blue);
      const store = i ? (repair ? f.waitDone : f.one) : blind ? f.blindDone : f.one;
      readoutCell(
        ctx,
        api,
        'pending' + store.pending.length + ' · queued notes' + store.queued.length,
        x,
        670,
        650,
        i ? themeColors.green : themeColors.pink,
      );
      text(
        ctx,
        api,
        store.queued.map((n) => n.id).join(' / ') || 'N-1 outcome unknown',
        x + 325,
        895,
        34,
        i ? themeColors.green : themeColors.pink,
        'center',
      );
    });
    text(
      ctx,
      api,
      'Dispatched without outcome proof → unknown; not dispatched means no input was sent',
      960,
      1030,
      29,
      themeColors.yellow,
      'center',
    );
  };
  api.focus.target('verify-after-action-construction', body);
}
export default {
  id: 'verify-after-action',
  draw: drawVerifyAfterAction,
  cues: [
    'authorized-write-experiment',
    'verify-after-action-b2-1',
    'verify-after-action-b3-1',
    'verify-after-action-construct-3',
    'blind-second-submit',
    'wait-single-request',
  ],
};
