import { characterPlan } from '../arithmetic.mjs';
import {
  contractText,
  cueComplete,
  cueProgress,
  footer,
  line,
  rectangle,
  tag,
} from '../defaults.mjs';
export function drawBaselineContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.focus.target('baseline-contract-mechanism', () => {
    if (currentBeat === 0) {
      const amount = cueProgress(ctx, api, 'binary-token-plan'),
        n = Math.floor(16 * amount);
      contractText(
        ctx,
        api,
        '40,000 source tokens → 16 leaves of about 2,500',
        960,
        450,
        35,
        themeColors.blue,
      );
      for (let i = 0; i < 16; i++) {
        const x = 180 + i * 100;
        rectangle(ctx, api, x, 560, 75, 100, i < n ? themeColors.blue : themeColors.panel);
      }
      if (cueComplete(ctx, api, 'binary-total'))
        contractText(ctx, api, 'L leaves + (L - 1) merges', 960, 790, 37, themeColors.yellow);
      if (cueComplete(ctx, api, 'binary-token-plan'))
        contractText(ctx, api, '16 + 15 = 31 requests', 960, 925, 42, themeColors.green);
    } else if (currentBeat === 1) {
      const small = cueProgress(ctx, api, 'half-window') > 0,
        invalid = cueProgress(ctx, api, 'tiny-window') > 0,
        m = characterPlan(small ? 256 : 512);
      contractText(
        ctx,
        api,
        'Executed character fixture · source 5,700 characters',
        960,
        246,
        35,
        themeColors.muted,
      );
      if (invalid) {
        tag(
          ctx,
          api,
          '24 instruction + 16 digest + 1 separator + 16 digest + 32 reserve',
          960,
          500,
          themeColors.blue,
          1570,
        );
        contractText(
          ctx,
          api,
          m.minimumMerge + ' characters needed   /   64 available',
          960,
          699,
          43,
          themeColors.pink,
        );
        if (cueComplete(ctx, api, 'character-reject'))
          contractText(ctx, api, 'Reject before the first call', 960, 857, 39, themeColors.pink);
      } else {
        const scale = 1400 / m.window;
        line(ctx, api, 230, 570, 1630, 570, themeColors.muted, 3);
        let x = 230;
        contractText(
          ctx,
          api,
          m.window +
            ' - ' +
            m.overhead +
            ' - ' +
            m.reserve +
            ' = ' +
            m.allowance +
            ' characters available for source',
          960,
          320,
          33,
          themeColors.yellow,
        );
        [
          [m.overhead, themeColors.yellow],
          [m.largestSource, themeColors.blue],
          [m.reserve, themeColors.cyan],
        ].forEach(([n, color]) => {
          rectangle(ctx, api, x, 500, n * scale, 70, color);
          x += n * scale;
        });
        [
          ['instruction', m.overhead],
          ['largest source slice', m.largestSource],
          ['output reserve', m.reserve],
        ].forEach(([name, n], i) => {
          contractText(
            ctx,
            api,
            name,
            450 + i * 510,
            700,
            29,
            [themeColors.yellow, themeColors.blue, themeColors.cyan][i],
          );
          contractText(
            ctx,
            api,
            String(n),
            450 + i * 510,
            785,
            35,
            [themeColors.yellow, themeColors.blue, themeColors.cyan][i],
          );
        });
        if (cueComplete(ctx, api, small ? 'character-small' : 'character-plan'))
          contractText(
            ctx,
            api,
            m.leaves + ' leaves · ' + m.calls + ' requests',
            960,
            405,
            37,
            themeColors.green,
          );
        if (cueComplete(ctx, api, 'character-max'))
          contractText(
            ctx,
            api,
            'largest complete request ' + m.total + ' / ' + m.window,
            960,
            925,
            36,
            themeColors.yellow,
          );
      }
    } else {
      const corrected = cueComplete(ctx, api, 'fact-correct'),
        dropped = cueComplete(ctx, api, 'fact-drop'),
        values = [
          corrected ? '2026-09-30' : '2026-08-31',
          dropped ? 'missing' : 'audit logging required',
        ];
      contractText(
        ctx,
        api,
        'Separate exact-field fixture · two required facts',
        960,
        300,
        35,
        themeColors.muted,
      );
      ['sunset date', 'audit condition'].forEach((name, i) => {
        const y = 480 + i * 210;
        contractText(ctx, api, name, 380, y, 32, themeColors.blue);
        tag(
          ctx,
          api,
          values[i],
          1190,
          y,
          i
            ? dropped
              ? themeColors.pink
              : themeColors.green
            : corrected
              ? themeColors.green
              : themeColors.pink,
          1050,
        );
      });
      if (cueComplete(ctx, api, 'fact-half'))
        contractText(
          ctx,
          api,
          'required-field recall = ' + ((Number(corrected) + Number(!dropped)) / 2).toFixed(2),
          960,
          875,
          40,
          themeColors.yellow,
        );
      if (cueComplete(ctx, api, 'extra-false'))
        contractText(
          ctx,
          api,
          'Extra claim: “Logging is optional”   ·   unsupported',
          960,
          955,
          33,
          themeColors.pink,
        );
    }
    if (currentBeat === 0) footer(ctx, api, 'Token planning example');
  });
}
export default {
  id: 'baseline-contract',
  draw: drawBaselineContract,
  cues: [
    'binary-total',
    'binary-token-plan',
    'character-plan',
    'character-max',
    'half-window',
    'character-small',
    'tiny-window',
    'character-reject',
    'fact-half',
    'fact-correct',
    'fact-drop',
    'extra-false',
  ],
};
