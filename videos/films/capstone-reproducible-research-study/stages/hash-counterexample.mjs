import { researchEvent } from '../construction.mjs';
import { researchConstructionModel } from '../model.mjs';
import {
  drawResearchConstructionArrow,
  drawResearchConstructionBox,
  drawResearchConstructionFooter,
  drawResearchConstructionHeader,
  drawResearchConstructionLine,
  drawResearchConstructionResult,
} from '../defaults.mjs';
export function drawHashCounterexample(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = researchConstructionModel('hash-counterexample', state),
    currentBeat = modelState.b;
  const E = (beat, sentence) => researchEvent('hash-counterexample', state, beat, sentence),
    resultComplete = (beat, sentence) => E(beat, sentence) === 1;
  api.focus.target('rs-hash-counterexample-mechanism', () => {
    drawResearchConstructionHeader(
      ctx,
      api,
      currentBeat
        ? 'A self-consistent fabricated record still lacks an execution'
        : 'Equal decoded values can have different byte identities',
    );
    if (currentBeat === 0) {
      drawResearchConstructionBox(
        ctx,
        api,
        '{"seed":1,"success":true}',
        200,
        380,
        710,
        120,
        themeColors.blue,
        31,
      );
      drawResearchConstructionBox(
        ctx,
        api,
        '{\n  "seed":1,\n  "success":true\n}',
        1010,
        350,
        710,
        190,
        themeColors.cyan,
        29,
      );
      drawResearchConstructionArrow(ctx, api, 550, 555, 550, 665, themeColors.blue);
      drawResearchConstructionArrow(ctx, api, 1360, 555, 1360, 665, themeColors.cyan);
      drawResearchConstructionBox(
        ctx,
        api,
        'compact byte digest A',
        220,
        690,
        670,
        85,
        themeColors.blue,
      );
      drawResearchConstructionBox(
        ctx,
        api,
        'indented byte digest B',
        1030,
        690,
        670,
        85,
        themeColors.cyan,
      );
      if (resultComplete(0, 1))
        drawResearchConstructionResult(
          ctx,
          api,
          'Decoded values equal · byte digests differ',
          themeColors.yellow,
          915,
        );
    } else {
      drawResearchConstructionBox(
        ctx,
        api,
        'Invented success record',
        210,
        400,
        620,
        100,
        themeColors.pink,
        34,
      );
      drawResearchConstructionArrow(ctx, api, 860, 450, 1050, 450, themeColors.yellow);
      drawResearchConstructionBox(
        ctx,
        api,
        'Checksum made from that record',
        1100,
        400,
        620,
        100,
        themeColors.yellow,
        29,
      );
      drawResearchConstructionLine(ctx, api, 550, 575, 1370, 575, themeColors.muted);
      drawResearchConstructionBox(
        ctx,
        api,
        'Internally consistent\nActual run: not established',
        550,
        695,
        820,
        150,
        themeColors.pink,
        34,
      );
    }
    drawResearchConstructionFooter(
      ctx,
      api,
      'Choose exact bytes or predeclared numeric fields/tolerance before comparing',
    );
  });
}
export default {
  id: 'hash-counterexample',
  draw: drawHashCounterexample,
  cues: [
    'rs-hash-counterexample-0',
    'rsx-hash-counterexample-b0-s0',
    'rsx-hash-counterexample-b0-s1',
    'rsx-hash-counterexample-b0-s2',
    'rs-hash-counterexample-1',
    'rsx-hash-counterexample-b1-s0',
    'rsx-hash-counterexample-b1-s1',
    'rsx-hash-counterexample-b1-s2',
  ],
};
