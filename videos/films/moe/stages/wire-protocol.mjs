import { fmt, mc, vec } from '../arithmetic.mjs';
import { moeCue } from '../construction.mjs';
import { moeWire } from '../model.mjs';
import { footer, mechanismLine, mechanismText, rectangle, tag, tiles } from '../defaults.mjs';
export function drawWireProtocol(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = mc(state.beatP ?? 0),
    resultComplete = (id) => moeCue(state, id),
    Q = (id) => moeCue(state, id, 'settle'),
    cueProgress = (i) => moeCue(state, 'wire-protocol-op-' + i, 'progress'),
    cols = [themeColors.blue, themeColors.pink, themeColors.yellow, themeColors.green];
  api.focus.target('mo-wire-protocol-mechanism', () => {
    mechanismText(
      ctx,
      api,
      currentBeat === 0
        ? 'Count vector bytes in both directions'
        : 'Same token, same two experts, different message protocol',
      960,
      285,
      34,
      themeColors.yellow,
    );
    if (currentBeat === 0) {
      tiles(ctx, api, 64, 200, 400, themeColors.cyan, 16, 25, 25, 16);
      mechanismText(ctx, api, '4,096 coordinates × 2 bytes', 530, 605, 33, themeColors.cyan);
      if (resultComplete('wire-vector'))
        tag(ctx, api, '8 KiB per vector', 530, 740, 500, themeColors.blue);
      if (resultComplete('wire-three'))
        tag(ctx, api, '3 routes × 2 directions = 48 KiB', 1330, 500, 780, themeColors.yellow);
      if (resultComplete('wire-five'))
        tag(ctx, api, '5 routes × 2 directions = 80 KiB', 1330, 760, 780, themeColors.pink);
    } else if (currentBeat === 2) {
      const f = moeWire(),
        a = api.teaching.axes({
          x: 230,
          y: 440,
          width: 650,
          height: 430,
          xDomain: [0, 2.5],
          yDomain: [0, 2.5],
          equalUnits: true,
          xTicks: [0, 1, 2],
          yTicks: [0, 1, 2],
          fontSize: 23,
        });
      mechanismText(
        ctx,
        api,
        'Illustrative same two expert outputs and gates',
        960,
        350,
        30,
        themeColors.yellow,
      );
      api.teaching.vectorAccumulation({
        plot: a,
        terms: f.outputs.map((values, i) => ({
          id: 'wire-output-' + i,
          label: 'E' + (i + 2),
          weight: f.gates[i],
          values,
          color: cols[i],
        })),
        progress: cueProgress(2),
        ledger: {
          x: 1050,
          y: 440,
          width: 680,
          height: 350,
        },
        fontSize: 28,
        revealTotal: resultComplete('wire-protocol-op-2'),
        totalLabel: 'Destination combined output',
        color: themeColors.cyan,
        format: (value) => fmt(value),
      });
      if (resultComplete('wire-protocol-op-2')) {
        tag(ctx, api, 'Separate return sum ' + vec(f.separate), 1390, 860, 690, themeColors.blue);
        tag(
          ctx,
          api,
          'Coalesced return ' + vec(f.destinationCombined),
          1390,
          955,
          690,
          themeColors.green,
        );
      }
    } else {
      tag(ctx, api, 'Source G0 · token x', 370, 420, 460, themeColors.cyan);
      tag(ctx, api, 'G1 · selected E2 and E3', 1420, 420, 640, themeColors.yellow);
      const coalesced = currentBeat > 1 || resultComplete('wire-coalesced'),
        progress = coalesced ? Q('wire-coalesced') : cueProgress(1),
        ys = coalesced ? [600, 790] : [560, 660, 760, 860];
      ys.forEach((y, i) => {
        mechanismLine(ctx, api, 300, y, 1590, y, themeColors.muted, 2);
        const forward = coalesced ? i === 0 : i % 2 === 0,
          start = forward ? 300 : 1590,
          end = forward ? 1590 : 300;
        rectangle(
          ctx,
          api,
          start + (end - start) * progress - 22,
          y - 20,
          44,
          40,
          i % 2 ? themeColors.yellow : themeColors.cyan,
        );
        mechanismText(
          ctx,
          api,
          coalesced
            ? i
              ? 'weighted return 8 KiB'
              : 'one input 8 KiB'
            : ['E2 input 8 KiB', 'E2 output 8 KiB', 'E3 input 8 KiB', 'E3 output 8 KiB'][i],
          960,
          y - 40,
          27,
          i % 2 ? themeColors.yellow : themeColors.cyan,
        );
      });
      if (resultComplete(coalesced ? 'wire-coalesced' : 'wire-separate'))
        mechanismText(
          ctx,
          api,
          coalesced ? 'Coalesced: 16 KiB' : 'Separate assignments: 32 KiB',
          960,
          960,
          35,
          coalesced ? themeColors.green : themeColors.blue,
        );
      if (currentBeat === 2) {
        mechanismText(
          ctx,
          api,
          'Same weighted function: 0.6 E2(x) + 0.4 E3(x)',
          960,
          330,
          30,
          themeColors.cyan,
        );
      }
    }
    footer(
      ctx,
      api,
      'Payload convention only; metadata, topology, kernels and overlap determine physical latency.',
    );
  });
}
export default {
  id: 'wire-protocol',
  draw: drawWireProtocol,
  cues: [
    'mo-wire-protocol-op-0',
    'mo-wire-vector',
    'mo-wire-three',
    'mo-wire-five',
    'mo-wire-protocol-op-1',
    'mo-wire-separate',
    'mo-wire-coalesced',
    'mo-wire-protocol-op-2',
  ],
};
