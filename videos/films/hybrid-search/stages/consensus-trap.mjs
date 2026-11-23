import { consensusSnapshot } from '../construction.mjs';
import { card, equation, footer, text } from '../defaults.mjs';
export function drawConsensusTrap(ctx, scene, state, api) {
  const { C: themeColors, components: components, teaching, phase } = api;
  const beat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const q = phase(progress, 0.06, 0.85);
  {
    const trap = true;
    const snap = consensusSnapshot(beat, progress),
      colors = {
        Garden: themeColors.green,
        Cooking: themeColors.pink,
        Travel: themeColors.blue,
      };
    if (state.cues?.['settle-terms']) {
      const all = consensusSnapshot(1, 1).events;
      snap.arrived = Math.ceil(4 * api.focus.progress('settle-terms', 0));
      snap.events = all.slice(0, snap.arrived);
      snap.cutoff = api.focus.visible('final-cutoff');
    }
    text(ctx, api, 'Lexical ranks', 300, 285, 32, themeColors.blue, 'center');
    text(ctx, api, 'Dense ranks', 850, 285, 32, themeColors.pink, 'center');
    snap.lanes.forEach((lane, l) =>
      lane.forEach((id, i) =>
        api.focus.target('trap-lanes', () =>
          card(
            ctx,
            api,
            i + 1 + '   ' + id,
            130 + l * 550,
            350 + i * 155,
            340,
            l ? themeColors.pink : themeColors.blue,
          ),
        ),
      ),
    );
    text(ctx, api, 'Contributions to the same document', 1515, 285, 29, themeColors.cyan, 'center');
    ['Garden', 'Cooking', 'Travel'].forEach((id, i) => {
      const y = 345 + i * 180,
        terms = snap.events.filter((e) => e.id === id),
        value = terms.reduce((a, e) => a + e.value, 0),
        latest = snap.events.at(-1),
        changed = latest?.id === id && beat === 0;
      api.focus.target('trap-scores', () =>
        components.panel({
          x: 1230,
          y,
          width: 570,
          height: 145,
          fill: themeColors.panel,
          stroke: snap.cutoff && id !== 'Cooking' ? themeColors.muted : colors[id],
        }),
      );
      text(ctx, api, id, 1260, y + 38, 28, colors[id]);
      if (!terms.length)
        text(
          ctx,
          api,
          'Awaiting rank contributions',
          1515,
          y + 105,
          25,
          themeColors.muted,
          'center',
        );
      else {
        api.focus.target('trap-terms', () =>
          equation(
            ctx,
            api,
            terms.map((e) => String.raw`\frac{1}{${60 + e.rank}}`).join('+'),
            1515,
            y + 86,
            32,
            colors[id],
          ),
        );
        teaching.changeCue(
          {
            x: 1400,
            y: y + 105,
            width: 230,
            height: 35,
            from: value - (latest?.id === id ? latest.value : 0),
            to: value,
            progress: 1,
            emphasis: changed ? 0.7 : 0,
            color: colors[id],
          },
          (s) => text(ctx, api, '= ' + s.value.toFixed(5), 1515, y + 133, 27, s.color, 'center'),
        );
      }
    });
    if (snap.arrived === 4)
      text(
        ctx,
        api,
        'Cooking receives two second-place contributions',
        680,
        760,
        31,
        themeColors.pink,
        'center',
      );
    if (snap.cutoff)
      api.focus.target('trap-context', () =>
        card(
          ctx,
          api,
          beat === 2 ? 'Broader pool can retain Garden' : 'Context budget 1: Cooking',
          235,
          835,
          825,
          themeColors.yellow,
          80,
        ),
      );
    else if (beat === 0 && snap.arrived < 4)
      text(
        ctx,
        api,
        snap.arrived ? 'Add one reciprocal term at a time' : 'Predict before the terms arrive',
        680,
        760,
        30,
        themeColors.yellow,
        'center',
      );
    equation(
      ctx,
      api,
      String.raw`\operatorname{RRF}(d)=\sum_{\ell:d\in L_\ell}\frac{1}{60+\operatorname{rank}_\ell(d)}`,
      960,
      970,
      38,
    );
    footer(ctx, api, '');
  }
}
export default {
  id: 'consensus-trap',
  draw: drawConsensusTrap,
  cues: [
    'predict-agreement',
    'settle-terms',
    'reinforced-error',
    'final-cutoff',
    'preserve-candidate',
  ],
};
