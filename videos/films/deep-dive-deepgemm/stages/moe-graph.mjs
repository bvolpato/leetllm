import { routedReturns, sentenceCues } from '../fixtures.mjs';
import { bounded, compareReturnedRows, expertWeightedReturn } from '../arithmetic.mjs';
import { sampleDeepGemmChapter } from '../construction.mjs';
import {
  drawBox,
  drawEquation,
  drawFooter,
  drawLink,
  drawSubtitle,
  drawText,
} from '../defaults.mjs';
export function drawMoeGraph(ctx, scene, state, api) {
  return api.focus.target('moe-graph-construction', () => {
    const { C: themeColors, components: components } = api,
      modelState = sampleDeepGemmChapter('moe-graph', state),
      { b: currentBeat, g: teaching2 } = modelState;
    const scatter = currentBeat === 2 || (currentBeat === 3 && teaching2(3, 1) === 0);
    const done = (beat, index) => teaching2(beat, index) >= 1;
    {
      drawSubtitle(
        ctx,
        api,
        currentBeat === 0
          ? 'One token follows gate, up and down projections'
          : currentBeat === 1
            ? 'Each weighted return belongs to its original source token'
            : scatter
              ? 'Packed arrival order   /   t9 then t7'
              : 'One selected SM100 kernel',
      );
      if (currentBeat === 0) {
        const token = drawBox(ctx, api, 'token t7 · H', 130, 520, 300, 105, themeColors.blue, 36),
          gate = drawBox(ctx, api, 'gate · I', 670, 365, 370, 95, themeColors.pink, 34),
          up = drawBox(ctx, api, 'up · I', 670, 690, 370, 95, themeColors.cyan, 34),
          act = drawBox(ctx, api, 'SiLU(g) × u', 1350, 515, 430, 115, themeColors.green, 38);
        if (teaching2(0, 3) > 0) {
          drawLink(ctx, api, token, gate, teaching2(0, 3), themeColors.pink);
          drawLink(ctx, api, token, up, teaching2(0, 3), themeColors.cyan);
        }
        if (teaching2(0, 4) > 0) {
          drawLink(ctx, api, gate, act, teaching2(0, 4), themeColors.pink);
          drawLink(ctx, api, up, act, teaching2(0, 4), themeColors.cyan);
        }
        if (done(0, 5)) drawEquation(ctx, api, '\\mathrm{SiLU}(g)=g\\,\\sigma(g)', 960, 915, 51);
      } else if (currentBeat === 1) {
        const colors = [themeColors.blue, themeColors.pink];
        routedReturns.forEach(({ token, experts, values, weights }, i) => {
          const y = 430 + i * 262;
          const known = teaching2(1, i === 0 ? 1 : 3) > 0;
          const ready = done(1, i === 0 ? 2 : 3);
          const row = expertWeightedReturn(values, weights);
          drawText(ctx, api, token, 160, y + 70, 58, colors[i]);
          if (known) {
            values.forEach((value, e) => {
              const x = 370 + e * 490;
              drawText(ctx, api, 'Expert ' + experts[e], x, y, 30, themeColors.muted);
              drawText(ctx, api, value + ' × ' + weights[e], x, y + 83, 62, colors[i]);
            });
            drawText(ctx, api, '+', 746, y + 78, 46);
            drawText(ctx, api, '=', 1275, y + 78, 46);
          }
          drawText(
            ctx,
            api,
            ready ? row.total : '?',
            1510,
            y + 82,
            76,
            ready ? colors[i] : themeColors.muted,
          );
        });
      } else if (scatter) {
        const reference = routedReturns.map(
          ({ values, weights }) => expertWeightedReturn(values, weights).total,
        );
        const moves = currentBeat === 2 ? teaching2(2, 0) : 1;
        const judged =
          currentBeat === 3 &&
          (state.cues ? state.cues['moe-row-verdict'].phase === 'after' : teaching2(3, 0) >= 0.45);
        api.focus.target('return-check', () => {
          for (const [lane, label] of [
            'Restore by source ID',
            'Write in arrival order',
          ].entries()) {
            const left = 87 + 910 * lane;
            drawText(ctx, api, label, left + 400, 380, 42, themeColors.ink, 'center');
            drawText(ctx, api, 'Arrival', left + 38, 464, 28, themeColors.muted);
            drawText(ctx, api, 'Output', left + 432, 464, 28, themeColors.muted);
            drawText(ctx, api, 'Reference', left + 636, 464, 28, themeColors.muted);
            const ys = [505, 670];
            routedReturns.forEach(({ token }, i) => {
              api.rect(
                ctx,
                left + 419,
                ys[i] - 6,
                184,
                100,
                themeColors.panel,
                themeColors.muted,
                8,
              );
              drawText(ctx, api, token + ' · ' + reference[i], left + 636, ys[i] + 57, 37);
            });
            const returned = [];
            [1, 0].forEach((source, arrival) => {
              const dest = lane === 0 ? source : arrival;
              const p = bounded(2 * moves - arrival);
              const x = left + 38 + 389 * p;
              const y = ys[arrival] + (ys[dest] - ys[arrival]) * p;
              const tone = source === 0 ? themeColors.blue : themeColors.pink;
              api.rect(ctx, x, y, 168, 88, tone, undefined, 6);
              drawText(
                ctx,
                api,
                routedReturns[source].token + ' · ' + reference[source],
                x + 84,
                y + 57,
                34,
                themeColors.bg,
                'center',
              );
              returned[dest] = reference[source];
            });
            const check = compareReturnedRows(reference, returned);
            if (moves >= 1) {
              const result = judged ? (check.pass ? ' · rows match' : ' · rows swapped') : '';
              drawText(
                ctx,
                api,
                'Sum ' + check.total + result,
                left + 400,
                871,
                38,
                judged ? (check.pass ? themeColors.green : themeColors.pink) : themeColors.ink,
                'center',
              );
            }
          }
        });
      } else {
        components.panel({
          x: 130,
          y: 350,
          width: 1660,
          height: 470,
          fill: themeColors.panel,
          stroke: themeColors.blue,
        });
        drawText(ctx, api, 'Selected SM100 mega-kernel', 960, 410, 34, themeColors.blue, 'center');
        const ops = ['dispatch', 'L1 gate / up', 'SwiGLU', 'L2', 'combine'],
          nodes = ops.map((v, i) =>
            drawBox(
              ctx,
              api,
              v,
              170 + i * 325,
              530,
              270,
              110,
              i === 2 ? themeColors.pink : themeColors.cyan,
              28,
            ),
          );
        nodes
          .slice(0, -1)
          .forEach((n, i) =>
            drawLink(ctx, api, n, nodes[i + 1], teaching2(3, 1), themeColors.cyan),
          );
        drawText(ctx, api, 'NVLink traffic', 600, 750, 32, themeColors.blue, 'center');
        drawText(ctx, api, 'Tensor-core work', 1280, 750, 32, themeColors.pink, 'center');
        if (teaching2(3, 2) > 0)
          drawBox(
            ctx,
            api,
            'Compatible weights + buffer recipe',
            400,
            875,
            1120,
            85,
            themeColors.yellow,
            32,
          );
      }
      drawFooter(
        ctx,
        api,
        scatter
          ? 'Does each output row match its reference?'
          : 'The routing weight belongs to the token and expert pair',
      );
    }
  });
}
export default {
  id: 'moe-graph',
  draw: drawMoeGraph,
  cues: [...sentenceCues('moe-graph'), 'moe-row-verdict'],
};
