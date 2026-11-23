import { FUSION_LANES } from '../fixtures.mjs';
import { consensusSnapshot, fusionSnapshot } from '../construction.mjs';
import { card, equation, footer, text } from '../defaults.mjs';
export function drawRankFusion(ctx, scene, state, api) {
  const { C: themeColors, components: components, teaching, phase } = api;
  const beat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const q = phase(progress, 0.06, 0.85);
  {
    const trap = false;
    {
      const directed =
        beat === 1
          ? 0.08 +
            0.68 *
              api.focus.progress(
                'add-rank-terms',
                Math.max(0, Math.min(1, (progress - 0.08) / 0.68)),
              )
          : beat === 2
            ? 0.39 * api.focus.progress('shared-document', Math.min(1, progress / 0.39))
            : progress;
      const snapshot = fusionSnapshot(beat, directed),
        colors = {
          Garden: themeColors.green,
          Cooking: themeColors.pink,
          Travel: themeColors.blue,
        };
      text(ctx, api, 'Lexical ranks', 270, 295, 32, themeColors.blue, 'center');
      text(ctx, api, 'Dense ranks', 780, 295, 32, themeColors.pink, 'center');
      text(ctx, api, 'Same document rows', 1535, 270, 29, themeColors.cyan, 'center');
      text(
        ctx,
        api,
        `${snapshot.received}/4 contributions`,
        1535,
        315,
        27,
        themeColors.cyan,
        'center',
      );
      FUSION_LANES.forEach((lane, l) =>
        lane.forEach((id, i) =>
          api.focus.target('ranked-lanes', () =>
            card(
              ctx,
              api,
              `${i + 1}   ${id}`,
              115 + l * 510,
              365 + i * 170,
              310,
              snapshot.inFlight?.lane === l && snapshot.inFlight?.rank === i + 1
                ? themeColors.yellow
                : l
                  ? themeColors.pink
                  : themeColors.blue,
              90,
            ),
          ),
        ),
      );
      ['Garden', 'Cooking', 'Travel'].forEach((id, i) => {
        const y = 340 + i * 185,
          terms = snapshot.events.filter((event) => event.id === id);
        const total = terms.reduce((sum, event) => sum + event.value, 0);
        api.focus.target('document-scores', () =>
          components.panel({
            x: 1260,
            y,
            width: 550,
            height: 150,
            fill: themeColors.panel,
            stroke: colors[id],
          }),
        );
        text(ctx, api, id, 1290, y + 43, 29, colors[id]);
        api.focus.target('document-scores', () =>
          equation(
            ctx,
            api,
            terms.length
              ? terms.map((term) => String.raw`\frac{1}{${60 + term.rank}}`).join('+') +
                  `=${total.toFixed(5)}`
              : '0',
            1535,
            y + 113,
            33,
            colors[id],
          ),
        );
      });
      const incoming = snapshot.inFlight;
      if (incoming) {
        const firstHalf = Math.min(1, incoming.progress * 2),
          secondHalf = Math.max(0, incoming.progress * 2 - 1);
        const corridor = 500 + incoming.lane * 510,
          sourceY = 410 + (incoming.rank - 1) * 170;
        const x = api.lerp(corridor, 1100, firstHalf);
        const targetY = 410 + ['Garden', 'Cooking', 'Travel'].indexOf(incoming.id) * 185;
        const y = api.lerp(210, targetY, secondHalf);
        const route = [
          {
            x: 440 + incoming.lane * 510,
            y: sourceY,
          },
          {
            x: corridor,
            y: sourceY,
          },
          {
            x: corridor,
            y: 210,
          },
          {
            x: 1100,
            y: 210,
          },
          {
            x: 1100,
            y: targetY,
          },
          {
            x: 1245,
            y: targetY,
          },
        ];
        api.arrow(ctx, 1220, targetY, 1245, targetY, colors[incoming.id], 3);
        api.focus.target('rank-contribution', () =>
          components.panel({
            x: x - 150,
            y: y - 43,
            width: 300,
            height: 86,
            fill: themeColors.panel,
            stroke: colors[incoming.id],
          }),
        );
        text(ctx, api, incoming.id, x, y - 18, 20, colors[incoming.id], 'center');
        api.focus.target('rank-contribution', () =>
          equation(
            ctx,
            api,
            String.raw`\frac{1}{60+${incoming.rank}}=\frac{1}{${60 + incoming.rank}}`,
            x,
            y + 27,
            26,
            themeColors.yellow,
          ),
        );
      }
      text(
        ctx,
        api,
        beat === 0
          ? 'Two score scales become comparable rank contributions'
          : incoming
            ? `${incoming.lane === 0 ? 'Lexical' : 'Dense'} rank ${incoming.rank} adds to ${incoming.id}`
            : beat === 1
              ? 'Lexical contributions recorded · dense lane follows'
              : 'All four rank contributions are now included',
        565,
        780,
        29,
        themeColors.yellow,
        'center',
      );
      api.focus.target('fusion-rule', () =>
        equation(
          ctx,
          api,
          String.raw`\operatorname{RRF}(d)=\sum_{\ell:d\in L_\ell}\frac{1}{60+\operatorname{rank}_\ell(d)}`,
          960,
          955,
          38,
        ),
      );
      text(
        ctx,
        api,
        'One contribution per document per lane · missing document contributes zero',
        960,
        1040,
        26,
        themeColors.muted,
        'center',
      );
      return;
    }
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
  id: 'rank-fusion',
  draw: drawRankFusion,
  cues: ['rank-scales', 'rank-reciprocal', 'add-rank-terms', 'shared-document', 'union-ranking'],
};
