import { hidden } from '../fixtures.mjs';
import { combineTrace, sampleModel } from '../construction.mjs';
import { card, equation, text } from '../defaults.mjs';
export function drawCombine(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('combine', state),
    currentBeat = modelState.b,
    result = (name) => state.cues?.['dep-result-' + name]?.phase === 'after';
  {
    const trace = combineTrace(currentBeat, state.beatP ?? 0, state.cues);
    if (currentBeat < 2) {
      text(
        ctx,
        api,
        currentBeat
          ? 'Apply each gate once, then restore source a'
          : 'Inspect source a’s raw expert contributions',
        960,
        280,
        35,
        themeColors.yellow,
        'center',
      );
      const aRows = trace.rows.filter((row) => row.token === 'a');
      aRows.forEach((row, i) => {
        const x = 180 + i * 850,
          color = i ? themeColors.pink : themeColors.blue;
        api.focus.target('combine-a-e-row-expert-saved-slot-row-key', () =>
          card(ctx, api, 'a → E' + row.expert + ' · saved slot ' + row.key, x, 365, 720, color, 95),
        );
        api.focus.target('combine-weighted-contributions', () => {
          text(
            ctx,
            api,
            'Raw ' + row.raw[0] + ' · gate ' + row.weight,
            x + 360,
            560,
            35,
            color,
            'center',
          );
          api.rect(ctx, x + 70, 635, row.raw[0] * 110, 95, themeColors.panel, themeColors.muted, 4);
          teaching.changeCue(
            {
              x: x + 50,
              y: 610,
              width: 650,
              height: 190,
              from: row.raw[0],
              to: row.raw[0] * row.weight,
              progress: row.weightProgress,
              color: themeColors.green,
            },
            (cue) => {
              api.rect(
                ctx,
                x + 70,
                635,
                cue.value * 110,
                95,
                currentBeat ? themeColors.green : color,
                undefined,
                4,
              );
              text(
                ctx,
                api,
                cue.value.toFixed(2),
                x + 360,
                775,
                34,
                currentBeat ? themeColors.green : color,
                'center',
              );
            },
          );
        });
      });
      api.focus.target('dep-combine-summary', () => {
        const ready = result(currentBeat ? 'combine-once' : 'combine-five');
        api.focus.target('combine-weighted-sum', () =>
          ready
            ? equation(
                ctx,
                api,
                'a_0=' +
                  aRows.map((row) => row.value[0].toFixed(2)).join('+') +
                  '=' +
                  trace.output.a[0].toFixed(2),
                960,
                865,
                47,
              )
            : text(ctx, api, 'Source a sum pending', 960, 865, 32, themeColors.muted, 'center'),
        );
        text(
          ctx,
          api,
          currentBeat
            ? result('combine-twice')
              ? 'Applying the gates again would give ' + modelState.doubleWeighted.toFixed(2)
              : result('combine-once')
                ? 'Already weighted contributions enter combine'
                : 'Caller applies each gate to its expert output'
            : ready
              ? 'The raw sum 5 still needs its caller-supplied gates'
              : 'Inspect both raw expert values before reporting their sum',
          960,
          965,
          30,
          currentBeat ? themeColors.pink : themeColors.muted,
          'center',
        );
      });
    } else {
      text(
        ctx,
        api,
        'Reverse result arrivals · saved slot → source-token mapping',
        960,
        280,
        34,
        themeColors.yellow,
        'center',
      );
      trace.rows.forEach((row, i) => {
        const x = 140 + (i % 4) * 445,
          y = 340 + Math.floor(i / 4) * 155,
          arrived = i < trace.count;
        card(
          ctx,
          api,
          'slot ' + row.key + ' → ' + row.token,
          x,
          y,
          405,
          arrived ? themeColors.green : themeColors.muted,
          75,
        );
        text(
          ctx,
          api,
          arrived ? '[' + row.value.map((v) => v.toFixed(2)).join(', ') + ']' : 'return pending',
          x + 202,
          y + 118,
          25,
          arrived ? themeColors.green : themeColors.muted,
          'center',
        );
      });
      Object.entries(trace.output).forEach(([token, value], i) => {
        const x = 140 + i * 445;
        api.focus.target('combine-source-token-accumulator', () => {
          card(ctx, api, 'Source ' + token + ' accumulator', x, 745, 405, themeColors.cyan, 75);
          text(
            ctx,
            api,
            '[' + value.map((v) => v.toFixed(2)).join(', ') + ']',
            x + 202,
            890,
            32,
            themeColors.green,
            'center',
          );
        });
      });
      if (trace.count > 0 && trace.count < trace.rows.length) {
        const row = trace.rows[trace.count - 1],
          from = 140 + ((trace.count - 1) % 4) * 445 + 202,
          to = 140 + Object.keys(hidden).indexOf(row.token) * 445 + 202;
        api.arrow(ctx, from, 650, to, 730, themeColors.green, 3);
      }
      text(
        ctx,
        api,
        result('combine-duplicate')
          ? 'Repeat slot 0:0   →   duplicate identity rejected'
          : result('combine-missing')
            ? 'Omit slot 0:0   →   one required identity missing'
            : trace.count + '/8 unique result identities restored through the saved map',
        960,
        1000,
        29,
        result('combine-missing') ? themeColors.pink : themeColors.muted,
        'center',
      );
    }
  }
}
export default {
  id: 'combine',
  draw: drawCombine,
  cues: [
    'combine-beat-1-focus-1',
    'dep-result-combine-five',
    'de-combine-e0',
    'de-combine-e3',
    'dep-result-combine-once',
    'dep-result-combine-twice',
    'de-combine-reverse',
    'dep-result-combine-missing',
    'dep-result-combine-duplicate',
  ],
};
