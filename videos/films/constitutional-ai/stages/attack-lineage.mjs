import { logicalState, voice } from '../construction.mjs';
import { drawAuditCard, drawAuditText, withFocus } from '../defaults.mjs';

const families = [
  ['A1   Can we edit the docs?', 'A2   Are doc edits allowed?'],
  ['B1   Who is on call?', 'B2   ¿Quién está de guardia?'],
];
export function drawAttackLineage(ctx, scene, state, api) {
  state = logicalState('attack-lineage', state);
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const cueProgress = (id, beat = currentBeat) => voice(state, id, beat);
  {
    const crossing = cueProgress('lineage-cross', 0),
      repair = cueProgress('lineage-repair', 0),
      rejected = cueProgress('attack-lineage-1', 0) > 0;
    drawAuditText(
      ctx,
      api,
      'A = docs question     B = on-call question',
      960,
      290,
      32,
      themeColors.muted,
      'center',
    );
    withFocus(ctx, api, 'seed-partitions', () => {
      for (let family = 0; family < 2; family++) {
        const x = 180 + family * 900,
          tone = family ? themeColors.cyan : themeColors.blue;
        drawAuditCard(ctx, api, family ? 'Test set' : 'Training set', x, 360, 720, tone);
        families[family].forEach((question, i) => {
          const movement = !family && i ? crossing * (1 - repair) : 0,
            xx = x + 900 * movement,
            y = 490 + (family * 2 + i) * 100;
          drawAuditCard(ctx, api, question, xx, y, 720, movement ? themeColors.pink : tone, 75, 35);
        });
      }
      if (rejected && repair === 1 && currentBeat === 0)
        drawAuditText(
          ctx,
          api,
          'A1 and A2 stay together in training.',
          960,
          930,
          32,
          themeColors.green,
          'center',
        );
    });
    withFocus(ctx, api, 'split-contract', () => {
      if (currentBeat > 0)
        drawAuditText(
          ctx,
          api,
          'Held out together: the on-call question and its translation',
          960,
          930,
          32,
          themeColors.yellow,
          'center',
        );
    });
  }
}
export default {
  id: 'attack-lineage',
  draw: drawAttackLineage,
  cues: ['attack-lineage-1', 'lineage-cross', 'lineage-repair', 'attack-lineage-2'],
};
