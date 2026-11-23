import { freshnessSnapshot } from '../construction.mjs';
import { retainedDrawCard, retainedDrawText } from '../defaults.mjs';
function retainedDraw(ctx, scene, state, api) {
  const { C: themeColors, components: components, phase, teaching: teaching } = api;
  const beat = state.beat ?? 0,
    progress2 = state.beatP ?? 0,
    q = phase(progress2, 0.05, 0.9);
  const route = (from, to, color = themeColors.cyan, progress = q, opacity = 1) =>
    teaching.transfer({
      source: {
        shape: from,
        opacity,
      },
      target: {
        shape: to,
        opacity,
      },
      color,
      progress,
      width: 3,
      gap: 16,
      margin: 2,
      particle: {
        radius: 6,
        fill: color,
      },
    });
  {
    const current = freshnessSnapshot(beat, progress2);
    const hostColor = current.dispatched
      ? themeColors.green
      : current.advanced
        ? themeColors.cyan
        : themeColors.blue;
    components.panel({
      x: 120,
      y: 245,
      width: 1680,
      height: 100,
      fill: themeColors.panel,
      stroke: hostColor,
      radius: 14,
    });
    api.focus.target('host-frame', () =>
      retainedDrawText(
        ctx,
        api,
        'HOST · session-9 · ' +
          current.host.frameId +
          ' · version ' +
          current.host.version +
          ' · ' +
          current.host.view,
        960,
        306,
        31,
        hostColor,
        'center',
      ),
    );
    if (beat === 1 && current.elapsed >= 0.4375)
      retainedDrawText(
        ctx,
        api,
        current.advanced
          ? 'Opened RUN-78432 · host observation advanced'
          : 'Open RUN-78432 · browser action in flight',
        960,
        377,
        25,
        themeColors.cyan,
        'center',
      );
    const emphasis =
      beat === 1 && current.advanced ? Math.max(0, 1 - (current.elapsed - 2.975) / 1.5) : 0;
    teaching.changeCue({
      x: 116,
      y: 241,
      width: 1688,
      height: 108,
      from: 1,
      to: current.host.version,
      progress: Number(current.advanced),
      color: themeColors.cyan,
      emphasis,
    });
    components.panel({
      x: 120,
      y: 390,
      width: 590,
      height: 430,
      fill: 'transparent',
      stroke: themeColors.blue,
      radius: 14,
    });
    retainedDrawText(
      ctx,
      api,
      'Saved dashboard observation',
      415,
      438,
      29,
      themeColors.blue,
      'center',
    );
    retainedDrawText(
      ctx,
      api,
      'session-9 · frame-1 · version 1',
      415,
      500,
      27,
      themeColors.ink,
      'center',
    );
    retainedDrawText(
      ctx,
      api,
      'Same intended run · RUN-78432',
      415,
      550,
      26,
      themeColors.muted,
      'center',
    );
    if (current.oldProposalVisible) {
      const proposal = api.focus.target('stale-proposal', () =>
        retainedDrawCard(
          ctx,
          api,
          'Old proposal · expand failure',
          150,
          605,
          530,
          themeColors.yellow,
          70,
          26,
        ),
      );
      const verdict = api.focus.target('stale-verdict', () =>
        retainedDrawCard(
          ctx,
          api,
          current.staleChecked ? current.staleResult.decision : 'Compare with current host frame',
          150,
          725,
          530,
          current.staleChecked ? themeColors.pink : themeColors.muted,
          65,
          25,
        ),
      );
      route(
        proposal,
        verdict,
        themeColors.pink,
        current.staleChecked ? 1 : phase(current.elapsed, 4.125, 7.4875),
      );
    } else
      retainedDrawText(
        ctx,
        api,
        current.advanced ? 'Run opened · old frame retained' : 'Saved before opening RUN-78432',
        415,
        660,
        24,
        themeColors.muted,
        'center',
      );
    components.panel({
      x: 890,
      y: 390,
      width: 910,
      height: 430,
      fill: 'transparent',
      stroke: current.dispatched ? themeColors.green : themeColors.muted,
      radius: 14,
    });
    const capture = api.focus.target('fresh-capture', () =>
      retainedDrawCard(
        ctx,
        api,
        current.captured ? 'New capture · frame-2 · version 2' : 'New capture pending',
        925,
        410,
        840,
        current.captured ? themeColors.cyan : themeColors.muted,
        68,
        27,
      ),
    );
    const target = api.focus.target('resolved-control', () =>
      retainedDrawCard(
        ctx,
        api,
        current.resolved
          ? 'Unique match · Failed tests · RUN-78432'
          : 'Resolve one named control in the intended run',
        925,
        508,
        840,
        current.resolved ? themeColors.yellow : themeColors.muted,
        68,
        26,
      ),
    );
    const checked = api.focus.target('actionability', () =>
      retainedDrawCard(
        ctx,
        api,
        current.actionable
          ? 'Actionable · visible, enabled, unique'
          : 'Actionability check pending',
        925,
        606,
        840,
        current.actionable ? themeColors.green : themeColors.muted,
        68,
        27,
      ),
    );
    const input = api.focus.target('click-dispatch', () =>
      retainedDrawCard(
        ctx,
        api,
        current.dispatched
          ? 'Click sent · failure-open · frame-3 / v3'
          : 'Input withheld until all checks pass',
        925,
        704,
        840,
        current.dispatched ? themeColors.green : themeColors.muted,
        68,
        26,
      ),
    );
    for (const [from, to, done] of [
      [capture, target, current.resolved],
      [target, checked, current.actionable],
      [checked, input, current.dispatched],
    ]) {
      if (done)
        teaching.transfer({
          source: {
            shape: from,
            opacity: 1,
          },
          target: {
            shape: to,
            opacity: 1,
          },
          progress: 1,
          color: themeColors.green,
          gap: 8,
          margin: 0,
        });
    }
    retainedDrawText(
      ctx,
      api,
      'Failure clicks sent: ' + current.failureClicks + ' · stale proposal sends no browser input',
      960,
      900,
      29,
      current.dispatched ? themeColors.green : themeColors.pink,
      'center',
    );
  }
}
export function drawObservationFreshness(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  {
    retainedDraw(ctx, scene, state, api);
    return;
  }
  const body = () => {};
  api.focus.target('observation-freshness-construction', body);
}
export default {
  id: 'observation-freshness',
  draw: drawObservationFreshness,
  cues: [
    'observation-freshness-b1-1',
    'observation-freshness-b2-1',
    'observation-freshness-b2-2',
    'observation-freshness-b3-1',
    'observation-freshness-b3-2',
    'observation-freshness-b3-3',
  ],
};
