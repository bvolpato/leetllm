import { V } from '../fixtures.mjs';
import { focusTarget, rowMatrix, text } from '../defaults.mjs';
export function drawIntro(ctx, scene, state, api) {
  const { C: themeColors, components: components, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0,
    q = (i) => (currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, 0.07, 0.9));
  {
    const rows = [
      {
        words: ['She', 'sat', 'by', 'the', 'river', 'bank'],
        color: themeColors.cyan,
        y: 320,
      },
      {
        words: ['She', 'went', 'to', 'the', 'bank', 'to', 'deposit', 'money'],
        color: themeColors.green,
        y: 500,
      },
    ];
    rows.forEach((row, index) => {
      const spacing = index ? 175 : 205,
        start = 960 - ((row.words.length - 1) * spacing) / 2,
        bank = row.words.indexOf('bank'),
        move =
          currentBeat === 0
            ? 0
            : currentBeat === 1
              ? api.phase(q(1), index * 0.5, (index + 1) * 0.5)
              : 1;
      const paint = () =>
        row.words.forEach((word, i) => {
          if (i !== bank) text(ctx, api, word, start + i * spacing, row.y, 34, row.color, 'center');
        });
      if (index === 0) focusTarget(ctx, api, 'intro-object-she-sat-by-the-river-bank-1', paint);
      else paint();
      const startX = start + bank * spacing,
        endX = index ? 1450 : 470,
        exit = api.phase(move, 0, 0.2),
        rail = api.phase(move, 0.2, 0.4),
        drop = api.phase(move, 0.4, 0.75),
        land = api.phase(move, 0.75, 1),
        x = land > 0 ? 1780 + (endX - 1780) * land : startX + (1780 - startX) * rail,
        y = row.y - 50 + 90 * exit + (650 - row.y - 40) * drop;
      components.card({
        label: move === 0 ? 'bank' : 'bank · ID 0',
        x: x - 120,
        y,
        width: 240,
        height: 85,
        fill: themeColors.panel,
        stroke: row.color,
        textColor: row.color,
        fontSize: 32,
        padding: 10,
      });
      if (currentBeat > 0 && move === 1)
        api.arrow(ctx, x, Math.max(y + 100, 750), 960, 810, row.color, 4);
    });
    if (currentBeat > 0)
      focusTarget(ctx, api, 'intro-bank-vector', () => {
        text(ctx, api, 'One shared stored row', 960, 780, 30, themeColors.blue, 'center');
        rowMatrix(ctx, api, [V.bank], 830, 825, themeColors.blue);
      });
    if (currentBeat === 2)
      focusTarget(ctx, api, 'intro-contextual-vectors', () => {
        const a = teaching.axes({
            x: 1450,
            y: 800,
            width: 300,
            height: 180,
            equalUnits: true,
            xDomain: [0, 1],
            yDomain: [0, 1],
            xTicks: [],
            yTicks: [],
            fontSize: 24,
          }),
          o = a.point(0, 0),
          finance = a.point(1, 0),
          river = a.point(0, 1);
        api.arrow(ctx, o.x, o.y, finance.x, finance.y, themeColors.green, 4);
        api.arrow(ctx, o.x, o.y, river.x, river.y, themeColors.cyan, 4);
        text(ctx, api, 'Authored directions', 1590, 780, 26, themeColors.muted, 'center');
        text(ctx, api, 'finance', 1760, 1015, 24, themeColors.green, 'center');
        text(ctx, api, 'river', 1460, 840, 24, themeColors.cyan, 'right');
      });
    text(
      ctx,
      api,
      currentBeat === 0
        ? 'Two occurrences · one vocabulary identity'
        : 'Lookup first · occurrence-specific computation follows',
      960,
      1040,
      29,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['intro-beat-1-focus-1', 'intro-beat-2-focus-1', 'intro-beat-3-focus-1'],
};
