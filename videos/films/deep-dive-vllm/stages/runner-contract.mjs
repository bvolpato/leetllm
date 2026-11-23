import { vvProgress, vvState } from '../construction.mjs';
import { chapterCard, chapterText, grid } from '../defaults.mjs';
export function drawRunnerContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = vvState('runner-contract', state),
    { b: currentBeat, p: progress } = modelState,
    cueProgress = (name, beat = currentBeat) =>
      vvProgress(state, 'vv-runner-contract-' + name, beat),
    resultComplete = (name, beat = currentBeat) => cueProgress(name, beat) === 1;
  let title = '',
    limit = 'Illustrative source contract · no serving engine or GPU execution';
  const head = (x) => (title = x),
    foot = (x) => (limit = x);
  api.focus.target('vllm-runner-contract-mechanism', () => {
    head(
      currentBeat === 0
        ? 'Keep one complete admitted request record together'
        : currentBeat === 1
          ? 'Use logical position and this request’s physical table'
          : 'Compare the same admitted work under warmed execution',
    );
    const wrong =
        (currentBeat === 0 && resultComplete('wrong-history', 0)) ||
        (currentBeat === 1 && cueProgress('runner-load', 1) === 0),
      table = wrong ? [12, 41] : [12, 73, 90];
    grid(
      ctx,
      api,
      [
        ['ID', 'Assigned inputs', 'Length', 'Block table'],
        ['R1', '5', '9', '[' + table.join(',') + ']'],
      ],
      150,
      380,
      1600,
      200,
      themeColors.blue,
      30,
    );
    grid(
      ctx,
      api,
      [
        ['Slot 12', 'The little bird sat'],
        ['Slot 41', 'on the green branch'],
        ['Slot 73', 'on the stone wall'],
        ['Slot 90', 'today /partial'],
      ],
      150,
      670,
      1060,
      280,
      themeColors.cyan,
      27,
    );
    const slot = table[1],
      token = slot === 41 ? 'green' : 'stone';
    chapterCard(
      ctx,
      api,
      'Position 6 → slot ' + slot + ' · offset 2',
      1300,
      690,
      450,
      themeColors.yellow,
      100,
      25,
    );
    if (currentBeat === 0 && progress === 1)
      chapterCard(ctx, api, 'Wrong table: got ' + token, 1300, 840, 450, themeColors.pink, 90, 26);
    if (currentBeat === 1 && resultComplete('runner-load', 1))
      chapterCard(ctx, api, 'R1 word: ' + token, 1300, 840, 450, themeColors.green, 90, 29);
    if (currentBeat === 2)
      chapterText(
        ctx,
        api,
        'Same shape/dtype/block size/sampling/topology +reference output',
        960,
        1010,
        27,
        themeColors.yellow,
        'center',
      );
    foot('Constructed metadata mix isolates a valid address containing another request’s history');
  });
  chapterText(ctx, api, title, 960, 275, 35, themeColors.yellow, 'center');
  chapterText(ctx, api, limit, 960, 1060, 23, themeColors.muted, 'center');
}
export default {
  id: 'runner-contract',
  draw: drawRunnerContract,
  cues: [
    'vv-runner-contract-op-0',
    'vv-runner-contract-handoff',
    'vv-runner-contract-wrong-history',
    'vv-runner-contract-op-1',
    'vv-runner-contract-runner-load',
    'vv-runner-contract-op-2',
  ],
};
