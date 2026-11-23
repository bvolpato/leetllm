import { phase } from '../arithmetic.mjs';
import { sgBegun } from '../construction.mjs';
import { box, cells, clock, extensionText, footer, table, title } from '../defaults.mjs';
export function drawServingReceipt(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat,
    q = phase(state.beatP);
  api.focus.target('serving-receipt-mechanism', () => {
    title(
      ctx,
      api,
      currentBeat === 0
        ? 'Bind one comparison to the actual work and environment'
        : currentBeat === 1
          ? 'Retain the same requests while changing one mechanism'
          : 'Profiler evidence needs an independently fixed replay',
    );
    if (currentBeat === 0)
      table(
        ctx,
        api,
        [
          ['Identity', 'Retained receipt fields'],
          ['runtime', 'model / tokenizer / SGLang / backend'],
          ['hardware', 'accelerator count / topology / precision'],
          ['workload', 'arrival process / lengths / schema / quality'],
          ['collection', 'warmup / duration / cache state / baseline'],
        ],
        200,
        365,
        1520,
        100,
        27,
      );
    else if (currentBeat === 1)
      table(
        ctx,
        api,
        [
          ['Input', 'Baseline', 'Candidate'],
          ['R42 / R43 bytes', 'identical', 'identical'],
          ['schema + quality', 'required', 'required'],
          ['cache trial', 'cold or warm', 'same regime'],
          ['one valid mechanism', 'disabled', 'enabled'],
        ],
        210,
        365,
        1500,
        100,
        27,
      );
    else if (!sgBegun(state, 'receipt-compute', q > 0.45)) {
      clock(
        ctx,
        api,
        [
          {
            id: 'host',
            label: 'Systems: host',
          },
          {
            id: 'gpu',
            label: 'Systems: device',
          },
          {
            id: 'link',
            label: 'Systems: transfer',
          },
        ],
        [
          {
            id: 'q',
            lane: 'host',
            start: 0,
            end: 3,
            color: themeColors.pink,
          },
          {
            id: 'f',
            lane: 'gpu',
            start: 3,
            end: 7,
            color: themeColors.blue,
          },
          {
            id: 't',
            lane: 'link',
            start: 7,
            end: 9,
            color: themeColors.cyan,
          },
        ],
        [0, 10],
        9,
        400,
        350,
        [0, 3, 7, 9],
      );
      extensionText(
        ctx,
        api,
        'Illustrative scope: queues / launches / overlap / transfer',
        960,
        900,
        30,
        themeColors.yellow,
        'center',
      );
    } else {
      box(
        ctx,
        api,
        'Nsight Compute\nselected kernel metrics',
        390,
        400,
        1140,
        120,
        themeColors.cyan,
        36,
      );
      cells(
        ctx,
        api,
        ['occupancy', 'memory traffic', 'instruction work'],
        300,
        650,
        1320,
        95,
        themeColors.blue,
      );
      extensionText(
        ctx,
        api,
        'Kernel evidence does not replace full request latency',
        960,
        870,
        34,
        themeColors.yellow,
        'center',
      );
    }
    footer(
      ctx,
      api,
      'Keep tails, errors, memory, warmup and collection provenance beside throughput',
    );
  });
}
export default {
  id: 'serving-receipt',
  draw: drawServingReceipt,
  cues: [
    'sg-serving-receipt-beat-0',
    'sg-serving-receipt-beat-1',
    'sg-receipt-replay',
    'sg-serving-receipt-beat-2',
    'sg-receipt-compute',
  ],
};
