import { CARD_GB, gbX, memoryAxis, memoryRow, onWords } from '../card-memory.mjs';
import { recipeLedger } from '../model.mjs';

const extraGB = 18;
const fmt = gb => Number(gb.toFixed(1));

function candidate(ctx, api, ranks, y, q) {
  const { C } = api;
  const stateGB = recipeLedger(70, ranks).total;
  const peak = stateGB + extraGB;
  memoryRow(ctx, api, y, ranks + ' cards', [[stateGB, C.blue], [extraGB * q, C.cyan]]);
  const explanation = q === 1
    ? fmt(stateGB) + ' + ' + extraGB + ' = ' + fmt(peak) + ' GB'
    : fmt(stateGB) + ' GB of model state';
  api.text(ctx, explanation, gbX(0), y + 130, 34, C.ink);
  if (q === 1)
    api.text(ctx, fmt(Math.abs(CARD_GB - peak)) + (peak > CARD_GB ? ' GB over' : ' GB free'),
      gbX(Math.max(CARD_GB, peak)) + 27, y + 54, 34, peak > CARD_GB ? C.pink : C.green);
}

function drawCluster(ctx, api, state) {
  const { C } = api;
  api.text(ctx, '70B parameters   ×   16 bytes   =   1,120 GB', 120, 255, 43, C.ink);
  api.text(ctx, 'Full sharding   /   assume 18 GB extra live at the peak on each card', 120, 327, 33, C.muted);
  memoryAxis(ctx, api, 430, state.beat === 0 ? 585 : 930);
  const first = onWords(state, api, 1, 'price-sixteen', 0, 0.12);
  api.focus.target('candidate-16', () => candidate(ctx, api, 16, 485, first));
  if (state.beat === 0) {
    api.rect(ctx, gbX(0), 690, gbX(extraGB) - gbX(0), 58, C.cyan, undefined, 1);
    api.text(ctx, '+ 18 GB', gbX(extraGB) / 2 + gbX(0) / 2, 731, 29, C.bg, 'center');
    api.text(ctx, 'Will 18 GB fit in the remaining 10 GB?', gbX(extraGB) + 33, 734, 37, C.ink);
    api.text(ctx, 'State alone fills 14 cards exactly:  1,120 ÷ 80 = 14', 120, 1005, 31, C.muted);
    return;
  }
  for (const [ranks, y, cue, from] of [[24, 660, 'try-twenty-four', 0.3], [32, 835, 'try-thirty-two', 0.72]]) {
    const q = onWords(state, api, 1, cue, from, from + 0.11);
    if (q > 0)
      api.focus.target('candidate-' + ranks, () => candidate(ctx, api, ranks, y, q));
  }
}

function drawStageChoice(ctx, api, state) {
  const { C } = api;
  const n = 16;
  const full = recipeLedger(30, n).full;
  const two = recipeLedger(30, n, 2);
  const three = recipeLedger(30, n, 3);
  const q2 = onWords(state, api, 3, 'try-stage-two', 0.03, 0.2);
  const q3 = onWords(state, api, 3, 'try-stage-three', 0.48, 0.67);
  const extra = onWords(state, api, 3, 'price-stage-three', 0.8, 0.92);
  const trial = onWords(state, api, 4, 'profile-trial', 0.12, 0.32);

  api.text(ctx, '30B parameters   /   16 cards   /   18 GB extra per card', 120, 250, 42, C.ink);
  api.text(ctx, 'Weights   60 GB', 150, 335, 33, C.blue);
  api.text(ctx, 'Gradients   60 GB', 580, 335, 33, C.pink);
  api.text(ctx, 'Master + moments   360 GB', 1040, 335, 33, C.yellow);
  memoryAxis(ctx, api, 443, 921);

  for (const [stage, ledger, q, y] of [[2, two, q2, 509], [3, three, q3, 735]]) {
    if (stage === 2 && trial > 0) {
      api.focus.target('observed-peak', () => {
        memoryRow(ctx, api, y, 'ZeRO-3 trial', []);
        api.text(ctx, 'Peak still to measure', gbX(0) + 26, y + 53, 34, C.ink);
        api.text(ctx, 'Peak across ranks at the target shape',
          gbX(0), y + 147, 30, C.muted);
      });
      continue;
    }
    const target = stage === 2 ? 'stage-two-case' : 'stage-three-case';
    api.focus.target(target, () => {
      const { weights, gradients, optimizer } = ledger.parts;
      memoryRow(ctx, api, y, trial > 0 ? 'ZeRO-3 budget' : 'ZeRO-' + stage, [[weights * q, C.blue], [gradients * q, C.pink],
        [optimizer * q, C.yellow], [stage === 3 ? extraGB * extra : 0, C.cyan]]);
      const formula = stage === 2 ? full.weights + ' + (' + full.gradients + ' + ' + full.optimizer + ') ÷ ' + n
        : '(' + full.weights + ' + ' + full.gradients + ' + ' + full.optimizer + ') ÷ ' + n;
      api.text(ctx, formula + (q === 1 ? ' = ' + ledger.total : ' = ?') + ' GB state', gbX(0), y + 148, 34, C.ink);
      if (q === 1 && stage === 2)
        api.text(ctx, 'Over on state alone', gbX(ledger.total) + 30, y + 54, 35, C.pink);
      if (stage === 3 && extra === 1)
        api.text(ctx, (ledger.total + extraGB) + ' GB with extras', gbX(CARD_GB) + 30, y + 54, 35, C.green);
    });
  }
  const prompt = state.beat === 2 ? 'Compare each request with 80 GB.' : state.beat === 4
    ? 'Compare useful tokens per second and the next update after a restore.'
    : extra === 1 ? 'Measure the joint peak on this mesh.' : '';
  if (prompt) api.text(ctx, prompt, 960, 1005, state.beat === 4 ? 31 : 40, C.ink, 'center');
}

export function drawSizingTransfer(ctx, scene, state, api) {
  if (state.beat < 2) return drawCluster(ctx, api, state);
  const lora = onWords(state, api, 4, 'lora-inventory', 0.78, 0.84);
  if (lora === 0) return drawStageChoice(ctx, api, state);

  const { C } = api;
  api.text(ctx, 'Next lesson   /   LoRA', 244, 312, 44, C.ink);
  const cell = 63;
  api.focus.target('lora-weights', () => {
    for (const [x, y, rows, cols, color] of [
      [244, 453, 4, 6, C.blue], [974, 453, 4, 1, C.green], [1230, 547, 1, 6, C.green],
    ]) {
      for (let row = 0; row < rows; row++)
        for (let col = 0; col < cols; col++)
          api.rect(ctx, x + col * cell, y + row * cell, cell - 4, cell - 4, color, undefined, 0);
    }
    api.text(ctx, '+', 800, 602, 72, C.ink, 'center');
    api.text(ctx, '×', 1133, 602, 65, C.ink, 'center');
    api.text(ctx, 'Frozen base weights', 431, 818, 42, C.blue, 'center');
    api.text(ctx, 'Trainable adapter', 1290, 818, 42, C.green, 'center');
  });
}

export default {
  id: 'sizing-transfer', draw: drawSizingTransfer,
  cues: ['price-sixteen', 'try-twenty-four', 'try-thirty-two', 'try-stage-two', 'try-stage-three', 'price-stage-three', 'profile-trial', 'lora-inventory'],
};
