import { countFixture } from './arithmetic.mjs';
import { validationFixture } from './fixtures.mjs';
import { text } from './defaults.mjs';

export function countRow(ctx, api, { y, label, fixture, visible, color, selected = false, resultName }) {
  const { correct, total } = countFixture(fixture);
  text(ctx, api, label, 120, y + 46, 39, color);
  for (let i = 0; i < total; i++) {
    const x = 570 + i * 48;
    api.rect(
      ctx,
      x,
      y,
      36,
      57,
      visible && i < correct ? color : api.C.panel,
      visible && i < correct ? undefined : api.C.muted,
      3,
    );
  }
  text(
    ctx,
    api,
    visible && resultName ? resultName + ' · ' + correct + '/' + total : visible ? correct + ' / ' + total : '? / ' + total,
    resultName ? 1540 : 1580,
    y + 47,
    resultName ? 34 : 49,
    visible ? color : api.C.muted,
  );
  if (selected) {
    text(ctx, api, 'frozen', 372, y + 45, 29, color);
    api.line(ctx, 120, y + 70, 465, y + 70, color, 4);
  }
}

export function developmentCounts(ctx, api, { baselineVisible, compiledVisible, selected = false }) {
  api.focus.target('counts', () => {
    text(ctx, api, 'Development  ·  correct answers out of 20', 120, 274, 42, api.C.ink);
    ['baseline', 'compiled'].forEach((key, i) =>
      countRow(ctx, api, {
        y: 345 + i * 115,
        label: i ? 'Compiled A' : 'Baseline',
        fixture: validationFixture[key],
        visible: i ? compiledVisible : baselineVisible,
        color: i ? api.C.cyan : api.C.blue,
        selected: selected && i === 1,
      }),
    );
  });
}
