import { cueProgress } from '../arithmetic.mjs';

export function drawStructureAndTables(ctx, scene, state, api) {
  const { C, text, line, rect } = api;
  const b = state.beat ?? 0;
  const p = state.beatP ?? 0;
  const progress = (id, a, z) => cueProgress(state, id, api.phase(p, a, z));
  if (b === 0) {
    const include = progress('attach-heading', 0.32, 0.58);
    text(ctx, 'Incident runbook   /   page 7', 150, 267, 30, C.muted);
    const sections = [
      ['Rollback failure', 'Page on-call within 15 minutes with deploy ID.'],
      ['Routine deploy notes', 'Archive within 14 days after release.'],
    ];
    api.focus.target('headed-sections', () => {
      sections.forEach(([title, body], i) => {
        const y = 363 + i * 282;
        text(ctx, title, 237, y + 51, 48, C.blue);
        text(ctx, body, 237, y + 144, 49, C.ink);
        // Extend the indexed range upward from the body to include its real heading.
        const top = y + 87 * (1 - include);
        line(ctx, 172, top, 172, y + 178, C.blue, 5);
        line(ctx, 172, top, 202, top, C.blue, 5);
        line(ctx, 172, y + 178, 202, y + 178, C.blue, 5);
        text(ctx, 'Indexed span ' + (i + 1), 1760, y + 53, 27, C.muted, 'right');
      });
    });
    return;
  }
  const copied = b > 1 ? 1 : progress('table-repeat-header', 0.36, 0.67);
  const xs = [205, 800, 1275];
  const headers = ['Condition', 'Window', 'Required evidence'];
  const rows = [
    ['Rollback failure', '15 minutes', 'Deploy ID'],
    ['Routine deploy notes', '14 days', 'Release summary'],
  ];
  api.focus.target('table-locator', () =>
    text(ctx, b === 2 ? 'Incident runbook  /  v3  /  page 7  /  Runbook windows' : 'Runbook windows',
      150, 265, 38, C.ink));
  api.focus.target('table-groups', () => {
    rows.forEach((row, i) => {
      const top = 330 + 318 * i;
      rect(ctx, 148, top, 1620, 221, C.panel, C.muted, 5);
      const opacity = i === 0 ? 1 : copied;
      if (opacity > 0) api.components.fade(opacity, () =>
        headers.forEach((header, col) =>
          text(ctx, header, xs[col], top + 65 + 14 * (1 - opacity), 32, C.blue)));
      line(ctx, 178, top + 101, 1738, top + 101, C.muted, 1);
      row.forEach((value, col) => text(ctx, value, xs[col], top + 171, 43, C.ink));
      if (b === 2) text(ctx, 'Source row ' + (i + 1), 1755, top + 264, 28, C.muted, 'right');
    });
  });
}

export default {
  id: 'structure-and-tables', draw: drawStructureAndTables,
  cues: ['attach-heading', 'read-row', 'table-repeat-header', 'row-location'],
};
