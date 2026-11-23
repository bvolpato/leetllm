import { releaseSentenceProgress } from '../construction.mjs';
import {
  drawReleaseArrow,
  drawReleaseBox,
  drawReleaseFooter,
  drawReleaseHeading,
  drawReleaseText,
} from '../defaults.mjs';
export function drawAtomicPublication(ctx, scene, state, api) {
  if (paintAtomicPublication(ctx, scene, state, api)) return;
}
function paintAtomicPublication(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const cueProgress = (beat, i = 0) =>
      releaseSentenceProgress(state, 'atomic-publication', beat, i),
    resultComplete = (beat, i = 0) => cueProgress(beat, i) >= 1;
  api.focus.target('atomic-publication-construction', () => paintReleaseContent());
  return true;
  function paintReleaseContent() {
    drawReleaseHeading(
      ctx,
      api,
      currentBeat === 2
        ? 'Same candidate bytes · separate deployment generations'
        : 'One local SQLite transaction · same starting token R / generation 4',
    );
    if (currentBeat === 0) {
      drawReleaseBox(
        ctx,
        api,
        'WHERE release = R AND generation = 4',
        250,
        345,
        1420,
        100,
        themeColors.blue,
        34,
      );
      if (cueProgress(0, 1) > 0) {
        drawReleaseBox(
          ctx,
          api,
          'uncommitted UPDATE → S / generation 5',
          250,
          570,
          1420,
          100,
          themeColors.yellow,
          34,
        );
        drawReleaseArrow(ctx, api, 960, 470, 960, 545, themeColors.cyan);
      }
      if (resultComplete(0, 3))
        drawReleaseText(
          ctx,
          api,
          'Affected rows must equal 1; otherwise reject',
          960,
          840,
          36,
          themeColors.pink,
          'center',
        );
      drawReleaseFooter(ctx, api, 'Read and conditional update are one atomic database decision');
    } else if (currentBeat === 1) {
      const commit = resultComplete(1, 1),
        rollback = resultComplete(1, 2);
      [
        ['normal transaction', commit, false],
        ['audit insertion fault', rollback, true],
      ].forEach(([name, done, fault], i) => {
        const x = 160 + i * 900,
          col = done ? (fault ? themeColors.pink : themeColors.green) : themeColors.yellow;
        drawReleaseText(ctx, api, name, x + 350, 355, 34, col, 'center');
        drawReleaseBox(
          ctx,
          api,
          done ? (fault ? 'R / generation 4' : 'S / generation 5') : 'uncommitted S / generation 5',
          x,
          480,
          700,
          110,
          col,
          33,
        );
        if (cueProgress(1, 0) > 0)
          drawReleaseBox(
            ctx,
            api,
            done
              ? fault
                ? 'no new audit row'
                : 'committed audit: R → S / generation 5'
              : 'audit INSERT pending commit',
            x,
            710,
            700,
            110,
            col,
            29,
          );
        if (done)
          drawReleaseText(
            ctx,
            api,
            fault ? 'ROLL BACK both writes' : 'COMMIT both writes',
            x + 350,
            920,
            34,
            col,
            'center',
          );
      });
    } else {
      drawReleaseBox(
        ctx,
        api,
        'Delayed command: C / generation 1',
        140,
        365,
        750,
        110,
        themeColors.pink,
        32,
      );
      drawReleaseBox(
        ctx,
        api,
        'Current pointer: C / generation 3',
        1040,
        365,
        750,
        110,
        themeColors.blue,
        32,
      );
      drawReleaseArrow(ctx, api, 915, 420, 1010, 420, themeColors.muted);
      if (cueProgress(2, 1) > 0) {
        drawReleaseBox(
          ctx,
          api,
          'Same artifact · unequal generation',
          380,
          610,
          1160,
          110,
          themeColors.yellow,
          35,
        );
        if (resultComplete(2, 1))
          drawReleaseBox(
            ctx,
            api,
            'REJECT · pointer and audit remain unchanged',
            300,
            835,
            1320,
            100,
            themeColors.green,
            34,
          );
      }
      drawReleaseFooter(ctx, api, 'Reassess current evidence before a new authorized action');
    }
  }
}
export default {
  id: 'atomic-publication',
  draw: drawAtomicPublication,
  cues: [
    'atomic-publication-b1',
    'atomic-publication-s0-0',
    'atomic-publication-s0-1',
    'atomic-publication-s0-2',
    'atomic-publication-s0-3',
    'atomic-publication-b2',
    'atomic-publication-s1-0',
    'atomic-publication-s1-1',
    'atomic-publication-s1-2',
    'atomic-publication-s1-3',
    'atomic-publication-b3',
    'atomic-publication-s2-0',
    'atomic-publication-s2-1',
    'atomic-publication-s2-2',
    'atomic-publication-s2-3',
  ],
};
