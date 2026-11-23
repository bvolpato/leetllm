import {
  cueProgress,
  cueVisible,
  evidenceBook,
  evidenceBox,
  evidenceFootnote,
  evidenceHold,
  evidenceLine,
  evidenceText,
} from '../defaults.mjs';
export function drawTraceContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  api.focus.target('trace-contract-mechanism', () => {
    if (currentBeat === 0) {
      evidenceBook(ctx, api, 200, 350);
      evidenceHold(ctx, api, 1240, 300);
      evidenceBox(ctx, api, 'Runtime events', 610, 300, 480, 80, themeColors.blue);
      const ready = cueVisible(ctx, api, 'trace-observations'),
        read = cueVisible(ctx, api, 'trace-read');
      ['t0 · lookup B7', 't1 · permit op-17', 't2 · hold committed', 't3 · read same B7'].forEach(
        (s, i) => {
          if (ready && i <= Math.floor(cueProgress(ctx, api, 'trace-observations') * 4)) {
            evidenceBox(
              ctx,
              api,
              s,
              610,
              425 + i * 95,
              480,
              70,
              i === 2 ? themeColors.green : themeColors.cyan,
            );
            if (i) evidenceLine(ctx, api, 850, 400 + i * 95, 850, 425 + i * 95, themeColors.line);
          }
        },
      );
      if (read) {
        evidenceText(
          ctx,
          api,
          'Read / denied write: Δstate = 0',
          960,
          895,
          34,
          themeColors.yellow,
          'center',
        );
        evidenceText(
          ctx,
          api,
          'Trusted state is richer than observations',
          960,
          815,
          26,
          themeColors.muted,
          'center',
        );
      }
      evidenceFootnote(
        ctx,
        api,
        'Episode = frozen task + initial world + allowed actions + expected effects + budgets',
      );
    } else {
      const dropped = state.cues?.['trace-leak']?.phase === 'after';
      const redacted = state.cues?.['trace-value']?.phase === 'after';
      const exported = cueVisible(ctx, api, 'trace-export');
      evidenceText(
        ctx,
        api,
        exported ? 'Saved trace' : 'Tool event under review',
        238,
        302,
        47,
        themeColors.ink,
      );
      api.rect(ctx, 230, 352, 1450, 444, themeColors.panel, themeColors.line, 12);
      const rows = [
        ['Book', 'B7', themeColors.cyan],
        ['Operation', 'op-17', themeColors.cyan],
        [
          'Contact email',
          dropped ? 'Field removed' : 'Personal address',
          dropped ? themeColors.muted : themeColors.yellow,
        ],
        [
          'Observation',
          redacted ? 'Held for [redacted]' : 'Held for [contact detail]',
          redacted ? themeColors.green : themeColors.yellow,
        ],
      ];
      let y = 431;
      for (const [field, value, color] of rows) {
        if (exported && field === 'Contact email') continue;
        evidenceText(ctx, api, field, 280, y, 36, themeColors.ink);
        evidenceText(ctx, api, value, 840, y, 41, color);
        y += 99;
      }
      if (exported)
        evidenceText(
          ctx,
          api,
          'Keep approved fields and redacted values for the retention period.',
          960,
          905,
          35,
          themeColors.ink,
          'center',
        );
    }
  });
  return;
}
export default {
  id: 'trace-contract',
  draw: drawTraceContract,
  cues: [
    'trace-world',
    'trace-observations',
    'trace-read',
    'trace-keys',
    'trace-leak',
    'trace-value',
    'trace-export',
  ],
};
