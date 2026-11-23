import { abClamp } from '../arithmetic.mjs';
import { abStarted } from '../construction.mjs';
import { abExtendedScenes, assignedArm } from '../model.mjs';
import {
  drawExpansionBox,
  drawExpansionCell,
  drawExpansionNote,
  drawFlow,
  withExpansionFocus,
  withFocus,
  writeExpansionText,
  writeText,
} from '../defaults.mjs';
import { drawConcept } from '../../../lib/concepts.mjs';
export function drawIntro(ctx, scene, state, api) {
  if (drawABExpansion(ctx, scene, state, api)) return;
  const { C: themeColors } = api;
  const currentBeat = state.beat ?? 0;
  const progress = api.clamp(state.beatP ?? 0);
  const phaseForBeat = (i, a = 0.08, z = 0.88) =>
    currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  {
    if (currentBeat === 0) {
      drawFlow(
        ctx,
        api,
        [
          {
            focusTarget: 'recovery-question',
            id: 'question',
            label: 'recover payment service',
            x: 150,
            y: 465,
            width: 440,
            height: 125,
            color: themeColors.yellow,
          },
          {
            focusTarget: 'clearer-runbook',
            id: 'runbook',
            label: 'clearer runbook',
            x: 750,
            y: 465,
            width: 380,
            height: 125,
            color: themeColors.cyan,
          },
          {
            focusTarget: 'resolution-outcome',
            id: 'answer',
            label: 'usable resolution?',
            x: 1340,
            y: 465,
            width: 430,
            height: 125,
            color: themeColors.green,
          },
        ],
        [
          {
            from: 'question',
            to: 'runbook',
            progress: phaseForBeat(0, 0.12, 0.34),
            color: themeColors.cyan,
          },
          {
            from: 'runbook',
            to: 'answer',
            progress: phaseForBeat(0, 0.38, 0.58),
            color: themeColors.green,
          },
        ],
      );
      writeText(
        ctx,
        api,
        'Will clearer retrieval improve recovery?',
        960,
        340,
        34,
        themeColors.ink,
        'center',
      );
    } else {
      const assignment = phaseForBeat(1, 0.2, 0.42);
      writeText(ctx, api, 'Eligible incidents', 340, 315, 34, themeColors.yellow, 'center');
      writeText(
        ctx,
        api,
        'One stored assignment per incident',
        1275,
        315,
        34,
        themeColors.ink,
        'center',
      );
      for (const [i, id] of ['inc-17', 'inc-42'].entries()) {
        const arm = assignedArm(id),
          y = 410 + i * 220,
          color = arm ? themeColors.pink : themeColors.blue;
        withFocus(ctx, api, 'experiment-arms', () =>
          api.components.panel(
            {
              x: 1080,
              y: y - 20,
              width: 660,
              height: 160,
              fill: themeColors.panel,
              padding: 0,
            },
            () => {
              writeText(
                ctx,
                api,
                arm ? 'TREATMENT · rewrite' : 'CONTROL · raw query',
                1490,
                y + 76,
                31,
                color,
                'center',
              );
            },
          ),
        );
        api.line(ctx, 1095, y - 20, 1725, y - 20, color, 3);
        withFocus(ctx, api, 'eligible-incidents', () =>
          drawConcept(ctx, api, 'prompt', api.lerp(300, 1135, assignment), y, 75, {
            label: id,
            labelSize: 26,
          }),
        );
      }
    }
    writeText(
      ctx,
      api,
      'Same model · same decoder · one retrieval change',
      960,
      825,
      34,
      themeColors.cyan,
      'center',
    );
  }
}
function drawABExpansion(ctx, scene, state, api) {
  const beat = state.beat ?? 0,
    progress = abClamp(state.beatP ?? 0),
    q = progress * progress * (3 - 2 * progress);
  if (beat === 1) return false;
  if (!abExtendedScenes.has('intro')) return false;
  const { C: themeColors } = api;
  withExpansionFocus(ctx, api, 'intro-mechanism', () => {
    withExpansionFocus(ctx, api, 'recovery-question', () =>
      drawExpansionCell(
        ctx,
        api,
        '“The canary is at 7% errors and the owner acked.\nCan we roll it back?”',
        200,
        255,
        1520,
        125,
        themeColors.yellow,
        33,
      ),
    );
    withExpansionFocus(ctx, api, 'experiment-arms', () => {
      drawExpansionCell(
        ctx,
        api,
        'CONTROL · raw incident question',
        200,
        455,
        710,
        105,
        themeColors.blue,
        29,
      );
      drawExpansionCell(
        ctx,
        api,
        'TREATMENT · rewritten retrieval query',
        1010,
        455,
        710,
        105,
        themeColors.pink,
        28,
      );
    });
    writeExpansionText(
      ctx,
      api,
      'canary rollback error-rate policy',
      1365,
      605,
      28,
      themeColors.pink,
      'center',
    );
    writeExpansionText(
      ctx,
      api,
      'owner acknowledgement',
      1365,
      650,
      28,
      themeColors.pink,
      'center',
    );
    withExpansionFocus(ctx, api, 'resolution-outcome', () =>
      writeExpansionText(
        ctx,
        api,
        'More usable resolutions within the declared budgets?',
        960,
        690,
        29,
        themeColors.yellow,
        'center',
      ),
    );
    withExpansionFocus(ctx, api, 'clearer-runbook', () =>
      writeExpansionText(
        ctx,
        api,
        'Same pinned runbook · generator · prompt · greedy decoder',
        960,
        735,
        29,
        themeColors.cyan,
        'center',
      ),
    );
    if (beat === 0) {
      if (abStarted(state, 'intro-evidence', progress > 0.6)) {
        drawExpansionBox(ctx, api, 200, 785, 1520, 145, themeColors.cyan);
        writeExpansionText(
          ctx,
          api,
          'Supplied source: rollback requires owner acknowledgement.',
          250,
          835,
          29,
          themeColors.cyan,
        );
        writeExpansionText(
          ctx,
          api,
          'Candidate: acknowledgement alone authorizes rollback.',
          250,
          890,
          29,
          themeColors.ink,
        );
      }
      if (abStarted(state, 'intro-overclaim', progress > 0.8))
        writeExpansionText(
          ctx,
          api,
          'Required condition ≠ sufficient permission',
          960,
          975,
          33,
          themeColors.pink,
          'center',
        );
      if (!abStarted(state, 'intro-evidence', progress > 0.6))
        drawExpansionNote(
          ctx,
          api,
          'A clearer sentence still needs supported evidence and a measured incident outcome.',
        );
    } else if (beat === 1) {
      withExpansionFocus(ctx, api, 'eligible-incidents', () => {
        drawExpansionCell(ctx, api, 'inc-17 · CONTROL', 200, 805, 710, 110, themeColors.blue, 33);
        drawExpansionCell(
          ctx,
          api,
          'inc-42 · TREATMENT',
          1010,
          805,
          710,
          110,
          themeColors.pink,
          33,
        );
      });
      drawExpansionNote(
        ctx,
        api,
        'Store one assigned policy with each incident and its later events.',
      );
    } else {
      ['Mature resolution', 'Grounding audit', 'First-request p95', 'New human pages'].forEach(
        (v, i) =>
          drawExpansionCell(
            ctx,
            api,
            v,
            165 + i * 435,
            825,
            405,
            90,
            [themeColors.cyan, themeColors.pink, themeColors.yellow, themeColors.blue][i],
            27,
          ),
      );
      drawExpansionNote(
        ctx,
        api,
        'Four distinct evidence streams stay attached to the same locked experiment.',
      );
    }
  });
  return true;
}
export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'intro-beat-1-focus-1',
    'intro-beat-1-focus-2',
    'intro-beat-1-focus-3',
    'intro-evidence',
    'intro-overclaim',
    'intro-beat-2-focus-1',
    'intro-beat-2-focus-2',
    'intro-beat-3-focus-1',
  ],
};
