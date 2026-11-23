import { CASES } from '../fixtures.mjs';
import { cueBegun } from '../arithmetic.mjs';
import { refusalTraceSnapshot } from '../model.mjs';
import { RESULTS } from '../observations.mjs';
import { card, text, visualFocus } from '../defaults.mjs';
export function drawAttackEvaluation(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  {
    const effect = (result) =>
      result.privateEscaped
        ? 'Private data escaped'
        : result.events.some((e) => e.type === 'write-receipt')
          ? 'Receipt: authorized production r4'
          : result.events.some((e) => e.type === 'write-decision')
            ? 'Write denied · shadow r3'
            : result.events.some((e) => e.type === 'disclosure-decision')
              ? 'Notes denied · 0 bytes sent'
              : result.rejected
                ? 'Summary rejected · false positive'
                : 'Summary returned';
    if (currentBeat < 2) {
      text(ctx, api, 'Case', 325, 300, 30, themeColors.yellow);
      text(ctx, api, 'Intended policy outcome', 795, 300, 30, themeColors.yellow);
      text(
        ctx,
        api,
        currentBeat === 0 ? 'Run pending' : 'Observed result',
        1430,
        300,
        30,
        themeColors.yellow,
      );
      CASES.forEach((row, i) => {
        const result = RESULTS[i],
          y = 355 + i * 105;
        visualFocus(ctx, api, 'evaluation-case-' + i, () =>
          card(ctx, api, row.id, 130, y, 390, themeColors.blue, 1, 82, 27),
        );
        visualFocus(ctx, api, 'evaluation-intended-outcomes', () =>
          card(ctx, api, row.intended, 590, y, 420, themeColors.cyan, 1, 82, 25),
        );
        if (currentBeat === 1 && cueBegun(state.cues, 'attack-evaluation-beat-2-focus-1', true))
          visualFocus(
            ctx,
            api,
            i === 3 ? 'evaluation-false-rejection' : 'evaluation-observed-effects',
            () =>
              card(
                ctx,
                api,
                effect(result),
                1080,
                y,
                700,
                result.rejected ? themeColors.pink : themeColors.green,
                1,
                82,
                27,
              ),
          );
      });
      if (currentBeat === 1 && cueBegun(state.cues, 'attack-evaluation-beat-2-focus-1', true))
        visualFocus(ctx, api, 'evaluation-counts', () =>
          text(
            ctx,
            api,
            'Guarded host · leaks ' +
              RESULTS.filter((r) => r.privateEscaped).length +
              ' · unauthorized changes ' +
              RESULTS.filter((r) => r.unauthorizedChange).length +
              ' · false rejection ' +
              RESULTS.filter((r, i) => r.rejected && CASES[i].kind === 'benign').length,
            960,
            995,
            30,
            themeColors.yellow,
          ),
        );
    } else {
      const trace = refusalTraceSnapshot(progress, state.cues);
      text(
        ctx,
        api,
        'Separate counterexample · approval check omitted',
        590,
        290,
        30,
        themeColors.pink,
      );
      if (trace.events.length)
        visualFocus(ctx, api, 'evaluation-tool-event', () => {
          card(
            ctx,
            api,
            '1 · tool call: promote-C17-r3',
            150,
            365,
            890,
            themeColors.yellow,
            1,
            100,
            29,
          );
          visualFocus(ctx, api, 'evaluation-credential', () =>
            text(
              ctx,
              api,
              'Credential: ' + trace.events[0].credential,
              595,
              510,
              26,
              themeColors.cyan,
            ),
          );
          visualFocus(ctx, api, 'evaluation-destination', () =>
            text(
              ctx,
              api,
              'Destination: ' + trace.events[0].destination,
              595,
              550,
              26,
              themeColors.cyan,
            ),
          );
        });
      if (trace.receipt)
        visualFocus(ctx, api, 'evaluation-unsafe-receipt', () =>
          card(
            ctx,
            api,
            '2 · receipt: C17 / production / 25% / revision 4',
            150,
            620,
            890,
            themeColors.pink,
            1,
            100,
            28,
          ),
        );
      if (trace.refusal)
        visualFocus(ctx, api, 'evaluation-late-refusal', () =>
          card(
            ctx,
            api,
            '3 · model: “' + trace.refusal.text + '”',
            150,
            800,
            890,
            themeColors.yellow,
            1,
            100,
            28,
          ),
        );
      visualFocus(ctx, api, 'evaluation-final-release', () => {
        text(
          ctx,
          api,
          'C17 · ' + trace.stage,
          1470,
          350,
          36,
          trace.receipt ? themeColors.pink : themeColors.ink,
        );
        for (let i = 0; i < 100; i++) {
          const x = 1190 + (i % 20) * 28,
            y = 430 + Math.floor(i / 20) * 31;
          api.rect(
            ctx,
            x,
            y,
            22,
            22,
            i < trace.traffic ? themeColors.pink : themeColors.panel,
            i < trace.traffic ? themeColors.pink : themeColors.muted,
            1,
          );
        }
        text(
          ctx,
          api,
          'Traffic: ' + trace.traffic + '%',
          1470,
          670,
          32,
          trace.receipt ? themeColors.pink : themeColors.muted,
        );
        text(
          ctx,
          api,
          'Revision ' + trace.revision,
          1470,
          745,
          32,
          trace.receipt ? themeColors.pink : themeColors.muted,
        );
        text(
          ctx,
          api,
          'Unauthorized changes: ' + Number(trace.unauthorizedChange),
          1470,
          855,
          29,
          trace.unauthorizedChange ? themeColors.pink : themeColors.muted,
        );
      });
      text(
        ctx,
        api,
        'Earlier guarded run retained: 0 leaks · 0 unauthorized changes · 1 false rejection',
        960,
        1000,
        27,
        themeColors.green,
      );
    }
  }
}
export default {
  id: 'attack-evaluation',
  draw: drawAttackEvaluation,
  cues: [
    'attack-evaluation-beat-1-focus-1',
    'evaluation-record-intended',
    'attack-evaluation-beat-2-focus-1',
    'evaluation-false-rejection',
    'attack-evaluation-beat-3-focus-1',
    'attack-evaluation-beat-3-focus-2',
    'evaluation-credentials',
    'evaluation-destinations',
    'evaluation-final-state',
  ],
};
