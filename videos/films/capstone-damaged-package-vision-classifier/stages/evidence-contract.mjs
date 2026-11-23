import { visionFrame } from '../model.mjs';
import {
  visionCard,
  visionLine,
  visionNote,
  visionPhoto,
  visionText,
  visionValue,
} from '../defaults.mjs';
export function drawEvidenceContract(ctx, scene, state, api) {
  const frameState = visionFrame('evidence-contract', state);
  return api.focus.target('dv-evidence-contract-mechanism', () => {
    const { C: themeColors } = api;
    const currentBeat = frameState.beat,
      resultComplete = frameState.after;
    {
      if (currentBeat === 1) {
        visionText(
          ctx,
          api,
          'What the fixture actually supplies',
          960,
          290,
          39,
          themeColors.ink,
          'center',
        );
        ['Invented metadata', 'Supplied scores', 'Invented outcomes'].forEach((label, i) =>
          visionCard(
            ctx,
            api,
            label,
            150 + i * 550,
            350,
            500,
            100,
            [themeColors.blue, themeColors.yellow, themeColors.green][i],
          ),
        );
        const show = resultComplete('training-evidence', 1);
        visionValue(
          ctx,
          api,
          'Training views',
          show ? '2 of one case' : '',
          190,
          540,
          show,
          themeColors.blue,
        );
        visionValue(
          ctx,
          api,
          'Negative training cases',
          show ? '0' : '',
          740,
          540,
          show,
          themeColors.pink,
        );
        visionValue(
          ctx,
          api,
          'Usable validation positives',
          show ? '0' : '',
          1290,
          540,
          show,
          themeColors.pink,
        );
        visionLine(ctx, api, 170, 710, 1750, 710);
        ['Photographs absent', 'Weights absent', 'Model results absent'].forEach((label, i) =>
          visionCard(ctx, api, label, 150 + i * 550, 780, 500, 90, themeColors.muted),
        );
        visionNote(
          ctx,
          api,
          'These records test a policy contract; they cannot establish image discrimination.',
        );
      } else {
        const p = visionPhoto(ctx, api, 140, 390, 440, true);
        visionText(ctx, api, 'R-406-a', 360, 340, 31, themeColors.ink, 'center');
        visionValue(ctx, api, 'Damage score', '.94', 180, 750, true, themeColors.yellow);
        visionValue(ctx, api, 'Brightness', '.12 < .20', 415, 750, true, themeColors.pink);
        const queue = visionCard(
          ctx,
          api,
          'Request a new photo',
          850,
          460,
          460,
          115,
          themeColors.cyan,
        );
        const human = visionCard(
          ctx,
          api,
          'Specialist + policy',
          1410,
          460,
          360,
          115,
          themeColors.muted,
        );
        api.arrow(ctx, p.x + p.width + 25, 530, queue.x - 25, 530, themeColors.pink, 3);
        visionLine(
          ctx,
          api,
          queue.x + queue.width + 25,
          517,
          human.x - 25,
          517,
          themeColors.muted,
          3,
        );
        visionText(ctx, api, 'Separate authority', 1380, 640, 27, themeColors.muted, 'center');
        visionText(
          ctx,
          api,
          currentBeat === 2
            ? 'Permission · label guide · intended use'
            : 'Queue choice preserves specialist judgment',
          960,
          880,
          33,
          themeColors.ink,
          'center',
        );
        visionNote(
          ctx,
          api,
          'Schematic photo and supplied values. No refund or restocking action is performed.',
        );
      }
    }
  });
}
export default {
  id: 'evidence-contract',
  draw: drawEvidenceContract,
  cues: [
    'dv-evidence-contract-0',
    'dv-evidence-contract-operation-0',
    'dv-evidence-contract-1',
    'dv-evidence-contract-operation-1',
    'dv-training-evidence',
    'dv-evidence-contract-2',
    'dv-evidence-contract-operation-2',
  ],
};
