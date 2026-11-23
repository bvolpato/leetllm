import { resultDone } from '../arithmetic.mjs';
import { completed, cpuIds } from '../replay.mjs';
import { sampleModel } from '../model.mjs';
import {
  chapterBox,
  chapterFooter,
  chapterGrid,
  chapterRows,
  chapterText,
  chapterTitle,
} from '../defaults.mjs';
export function drawRealCpu(ctx, scene, state, api) {
  return api.focus.target('hf-real-cpu-mechanism', () => {
    const { C: themeColors } = api,
      modelState = sampleModel('real-cpu', state),
      { b: currentBeat } = modelState,
      done = (name) => resultDone(state, name);
    {
      chapterTitle(ctx, api, 'Actual random CPU model · no trained answer-quality result');
      if (currentBeat === 0) {
        chapterBox(ctx, api, '2 layers · width 32', 180, 400, 650, themeColors.blue);
        chapterBox(ctx, api, '4 query / 2 KV heads', 1090, 400, 650, themeColors.pink);
        chapterGrid(
          ctx,
          api,
          [cpuIds.map((id) => 'ID ' + id)],
          350,
          650,
          1220,
          100,
          themeColors.cyan,
          28,
        );
        chapterText(
          ctx,
          api,
          done('cpu-shape') ? 'Logits [1,5,32]' : 'Logit shape pending',
          960,
          895,
          41,
          done('cpu-shape') ? themeColors.green : themeColors.yellow,
          'center',
        );
      } else if (currentBeat === 1) {
        chapterGrid(
          ctx,
          api,
          [
            ['Input position', '0', '1', '2', '3', '4'],
            ['Input ID', ...cpuIds],
            [
              'Target label',
              ...cpuIds.map((id, i) =>
                i === 3 && completed(state, 1, 'cpu-mask-four') ? '−100' : id,
              ),
            ],
          ],
          200,
          390,
          1520,
          215,
          themeColors.blue,
          27,
        );
        chapterRows(
          ctx,
          api,
          [
            [
              'Shifted active loss',
              done('cpu-loss') ? 'Matches model loss' : 'pending',
              done('cpu-loss') ? themeColors.green : themeColors.muted,
            ],
            [
              'Backward / tying',
              done('cpu-gradient')
                ? done('cpu-tie')
                  ? 'Gradient present; weights shared'
                  : 'Gradient present'
                : 'pending',
            ],
            ['Local safetensors reload', done('cpu-reload') ? 'Logits match' : 'pending'],
          ],
          650,
          110,
        );
      } else {
        chapterRows(
          ctx,
          api,
          [
            ['Four-token prefill + fifth', done('cpu-cached') ? 'Matches full forward' : 'pending'],
            [
              'Change final input',
              completed(state, 2, 'cpu-causal')
                ? 'Earlier logits remain unchanged'
                : 'Compare earlier positions',
            ],
            [
              'Three greedy choices',
              completed(state, 2, 'cpu-manual')
                ? 'Manual loop matches generate'
                : 'Compare returned IDs',
            ],
          ],
          390,
          170,
        );
        chapterFooter(
          ctx,
          api,
          'Real CPU assertions · no convergence, accelerator or serving-capacity measurement',
        );
      }
      return;
    }
  });
}
export default {
  id: 'real-cpu',
  draw: drawRealCpu,
  cues: [
    'hf-real-cpu-0',
    'hf-cpu-shape',
    'hf-real-cpu-1',
    'cpu-mask-four',
    'hf-cpu-loss',
    'hf-cpu-gradient',
    'hf-cpu-tie',
    'hf-cpu-reload',
    'hf-real-cpu-2',
    'hf-cpu-cached',
    'cpu-causal',
    'cpu-manual',
  ],
};
