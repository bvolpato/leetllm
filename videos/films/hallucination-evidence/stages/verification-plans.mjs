import {
  drawEvidenceUpgradeFoot,
  drawEvidenceUpgradeTable,
  drawEvidenceUpgradeText,
} from '../defaults.mjs';
export function drawVerificationPlans(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    currentBeat = state.beat ?? 0,
    beatProgress = api.clamp(state.beatP ?? 0, 0, 1),
    q = api.phase(beatProgress, 0.06, 0.88);
  {
    if (currentBeat === 0) {
      drawEvidenceUpgradeText(
        ctx,
        api,
        themeColors,
        'Chain-of-Verification separates the checks from the initial draft',
        960,
        250,
        31,
        themeColors.ink,
        'center',
      );
      drawEvidenceUpgradeTable(
        ctx,
        api,
        themeColors,
        components,
        ['Stage', 'Persistent example artifact'],
        [
          ['Draft', 'Recovery by 14:30 UTC.'],
          ['Plan questions', 'Does a current admitted source contain an ETA?'],
          ['Answer separately', 'No ETA field appears in this supplied record.'],
          ['Revise', 'State supported facts; disclose missing estimate.'],
        ],
        170,
        350,
        1580,
        118,
        28,
      );
    } else {
      drawEvidenceUpgradeText(
        ctx,
        api,
        themeColors,
        'Locate the first failed check before choosing a remedy',
        960,
        255,
        32,
        themeColors.ink,
        'center',
      );
      drawEvidenceUpgradeTable(
        ctx,
        api,
        themeColors,
        components,
        ['Observed case', 'First failed stage', 'Artifact to retain'],
        [
          ['No admitted incident record', 'evidence admission', 'citation + admission receipt'],
          ['Admitted record, invented ETA', 'claim generation', 'field + actual sentence'],
          ['Supported draft; varied meanings', 'stability triage', 'samples + settings'],
        ],
        130,
        370,
        1660,
        125,
        27,
      );
      drawEvidenceUpgradeText(
        ctx,
        api,
        themeColors,
        'These labels locate checks; feed outage, permissions and fabrication need causal investigation',
        960,
        950,
        27,
        themeColors.yellow,
        'center',
      );
    }
    drawEvidenceUpgradeFoot(
      ctx,
      api,
      themeColors,
      'Separate generated answers can reduce dependence; they remain model outputs',
    );
  }
}
export default {
  id: 'verification-plans',
  draw: drawVerificationPlans,
  cues: ['verification-plans-b1', 'verification-plans-b2'],
};
