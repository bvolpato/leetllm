import { clip, smooth } from '../arithmetic.mjs';
import { auditStarted } from '../construction.mjs';
import {
  auditFocusApi,
  drawAuditExpansionArrow,
  drawAuditExpansionBox,
  drawAuditExpansionCell,
  drawAuditExpansionNote,
  drawAuditExpansionText,
} from '../defaults.mjs';
export function drawCodeContract(ctx, scene, state, api) {
  api = auditFocusApi(api, scene);
  {
    const inherited = [
      ...new Set(
        scene.beats
          .flatMap((beat) => beat.visual_cues ?? [])
          .filter((cue) => !cue.id.startsWith('ba-'))
          .flatMap((cue) => cue.targets),
      ),
    ];
    inherited.reduceRight(
      (paint, id) => () => api.focus.target(id, paint),
      () => {
        const currentBeat = state.beat ?? 0,
          progress = clip(state.beatP ?? 0),
          q = smooth(progress);
        const { C: themeColors } = api;
        const shown = (name, fallback = true) =>
          auditStarted(state, 'ba-code-contract-' + name, fallback);
        {
          if (currentBeat === 0) {
            drawAuditExpansionText(
              ctx,
              api,
              'Different objects are scored',
              960,
              275,
              37,
              themeColors.ink,
              'center',
            );
            drawAuditExpansionCell(
              ctx,
              api,
              'Function synthesis',
              210,
              355,
              660,
              95,
              themeColors.blue,
              36,
            );
            drawAuditExpansionCell(
              ctx,
              api,
              'Repository patch',
              1050,
              355,
              660,
              95,
              themeColors.cyan,
              36,
            );
            drawAuditExpansionCell(
              ctx,
              api,
              'signature + docstring\nimplementation\nfunction unit tests',
              210,
              520,
              660,
              240,
              themeColors.blue,
              32,
            );
            for (let i = 0; i < 3; i++) {
              drawAuditExpansionBox(
                ctx,
                api,
                1100 + i * 170,
                535 + i * 35,
                185,
                210,
                themeColors.cyan,
              );
              drawAuditExpansionText(
                ctx,
                api,
                ['code', 'tests', 'issue'][i],
                1192 + i * 170,
                670 + i * 35,
                28,
                themeColors.cyan,
                'center',
              );
            }
            if (shown('function', progress > 0.1))
              drawAuditExpansionText(
                ctx,
                api,
                'HumanEval: 164 problems',
                540,
                895,
                33,
                themeColors.blue,
                'center',
              );
            if (shown('repo', progress > 0.5))
              drawAuditExpansionText(
                ctx,
                api,
                'Original SWE-bench: 2,294 tasks',
                1380,
                895,
                30,
                themeColors.cyan,
                'center',
              );
          } else if (currentBeat === 1) {
            drawAuditExpansionText(
              ctx,
              api,
              'One submitted patch · selected test assertions',
              960,
              275,
              36,
              themeColors.ink,
              'center',
            );
            drawAuditExpansionCell(ctx, api, 'patch', 200, 470, 370, 180, themeColors.blue, 48);
            const rows = [
              'Fail-to-Pass repair test',
              'Pass-to-Pass regression test',
              'omitted behavior',
            ];
            rows.forEach((v, i) => {
              const y = 350 + i * 190;
              drawAuditExpansionCell(
                ctx,
                api,
                v,
                930,
                y,
                800,
                105,
                i === 2 ? themeColors.muted : themeColors.cyan,
                31,
              );
              drawAuditExpansionArrow(
                ctx,
                api,
                570,
                560,
                930,
                y + 52,
                i === 2 ? themeColors.muted : themeColors.cyan,
              );
              if (i < 2 && shown('selected', progress > 0.15))
                drawAuditExpansionText(
                  ctx,
                  api,
                  'PASS',
                  1680,
                  y + 150,
                  28,
                  themeColors.green,
                  'right',
                );
            });
            if (shown('omitted', progress > 0.6)) {
              drawAuditExpansionText(
                ctx,
                api,
                'UNEXERCISED',
                1680,
                880,
                28,
                themeColors.pink,
                'right',
              );
              drawAuditExpansionText(
                ctx,
                api,
                'Resolved label leaves this behavior unknown',
                480,
                840,
                30,
                themeColors.pink,
                'center',
              );
            }
          } else {
            drawAuditExpansionText(
              ctx,
              api,
              'An attempt contains work, not just one model call',
              960,
              275,
              34,
              themeColors.ink,
              'center',
            );
            const count = 1 + Math.floor(q * 4);
            for (let i = 0; i < 3; i++) {
              const x = 240 + i * 560;
              drawAuditExpansionBox(ctx, api, x, 380, 450, 440, themeColors.blue);
              drawAuditExpansionText(
                ctx,
                api,
                'attempt ' + (i + 1),
                x + 225,
                440,
                32,
                themeColors.blue,
                'center',
              );
              for (let j = 0; j < count; j++)
                drawAuditExpansionCell(
                  ctx,
                  api,
                  (j % 2 ? 'tool' : 'model') + ' call',
                  x + 70,
                  485 + j * 58,
                  310,
                  43,
                  j % 2 ? themeColors.cyan : themeColors.yellow,
                  23,
                );
            }
            drawAuditExpansionNote(
              ctx,
              api,
              'Illustrated call stacks · record all actual calls, timeouts, returned patches and selected tests.',
            );
          }
        }
        return true;
      },
    )();
    return;
  }
}
export default {
  id: 'code-contract',
  draw: drawCodeContract,
  cues: [
    'code-contract-phase-0',
    'ba-code-contract-function',
    'ba-code-contract-repo',
    'code-contract-phase-1',
    'ba-code-contract-selected',
    'ba-code-contract-omitted',
    'code-contract-phase-2',
    'ba-code-contract-attempts',
  ],
};
