import { incidentFrame } from '../construction.mjs';
import { incidentModel } from '../model.mjs';
import { formatNumber, incidentNote, incidentText, strokeArrow, strokeLine } from '../defaults.mjs';
export function drawEarnedTransfer(ctx, scene, state, api) {
  const { C: themeColors } = api,
    m = incidentModel(),
    f = incidentFrame('earned-transfer', state),
    { b: currentBeat, p: progress, cue, started } = f;
  const colors = [themeColors.blue, themeColors.pink, themeColors.green];
  api.focus.target('earned-transfer-operation', () => {
    const names = ['real event', 'real event', 'padding'],
      values = [0.2, 0.8, 0],
      xs = [410, 960, 1510];
    incidentText(
      ctx,
      api,
      'New scalar incident · h₀ = 0,  Wₓ = 0.8,  Wₕ = 0.5',
      960,
      280,
      31,
      themeColors.muted,
      'center',
    );
    xs.forEach((x, i) => {
      const color = i < 2 ? colors[i] : themeColors.muted;
      incidentText(ctx, api, names[i], x, 395, 28, color, 'center');
      incidentText(ctx, api, 'x = ' + values[i], x, 460, 39, color, 'center');
      if (i < 2) strokeArrow(ctx, api, x + 175, 610, x + 365, 610, themeColors.muted, 3);
      if (i < f.freshVisible)
        incidentText(
          ctx,
          api,
          'h' + (i + 1) + ' = ' + formatNumber(ctx, api, m.fresh[i + 1], 6),
          x,
          624,
          40,
          i === 2 ? themeColors.pink : themeColors.green,
          'center',
        );
      else incidentText(ctx, api, 'h' + (i + 1) + ' = ?', x, 624, 40, themeColors.muted, 'center');
    });
    if (currentBeat === 0) {
      incidentText(
        ctx,
        api,
        'Which state should the classifier read?',
        960,
        800,
        42,
        themeColors.yellow,
        'center',
      );
      incidentText(
        ctx,
        api,
        'Does detaching the filler update change its numerical value?',
        960,
        883,
        31,
        themeColors.ink,
        'center',
      );
    } else {
      if (started('rnn-transfer-result', progress > 0.3) || currentBeat > 1) {
        const target = xs[1];
        strokeLine(ctx, api, target - 230, 668, target + 230, 668, themeColors.green, 5);
        strokeArrow(ctx, api, target, 680, target, 760, themeColors.green, 3);
        incidentText(
          ctx,
          api,
          'classifier reads the real ending',
          target,
          812,
          33,
          themeColors.green,
          'center',
        );
      }
      if (f.freshVisible > 2) {
        strokeLine(ctx, api, 1300, 675, 1720, 675, themeColors.pink, 4);
        incidentText(
          ctx,
          api,
          cue('fresh-detach-consequence', progress > 0.8 ? 1 : 0) === 1
            ? 'detach keeps this wrong value'
            : 'filler state after the real ending',
          1510,
          736,
          27,
          themeColors.pink,
          'center',
        );
      }
      if (currentBeat > 1) {
        incidentText(
          ctx,
          api,
          'Change padded values → same true final state',
          960,
          900,
          34,
          themeColors.green,
          'center',
        );
        incidentText(
          ctx,
          api,
          'Compare with the individual run · reset the next independent incident',
          960,
          967,
          28,
          themeColors.muted,
          'center',
        );
      } else
        incidentNote(
          ctx,
          api,
          cue('fresh-skip-preservation', progress > 0.97 ? 1 : 0) === 1
            ? 'Skip or mask padding, or pack length 2, to preserve h₂.'
            : cue('fresh-detach-consequence', progress > 0.8 ? 1 : 0) === 1
              ? 'Detaching changes the graph; the filler value remains unchanged.'
              : cue('rnn-transfer-result', progress > 0.4 ? 1 : 0) === 1
                ? 'Read the last real state; inspect the filler update separately.'
                : 'Complete the real-state and filler-state trace before answering.',
        );
    }
  });
}
export default {
  id: 'earned-transfer',
  draw: drawEarnedTransfer,
  cues: [
    'earned-transfer-0',
    'earned-transfer-1',
    'rnn-transfer-result',
    'fresh-first-result',
    'fresh-second-result',
    'fresh-pad-result',
    'fresh-detach-consequence',
    'fresh-skip-preservation',
    'earned-transfer-2',
  ],
};
