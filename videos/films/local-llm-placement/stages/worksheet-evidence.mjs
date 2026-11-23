import { cache } from '../model.mjs';
import { cueProgress, memoryRail } from '../worksheet.mjs';

export function drawWorksheetEvidence(ctx, scene, state, api) {
  const { C, focus } = api,
    p = cueProgress(scene, state, api);
  const text = (s, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);
  const cases = [
    { name: '4 logs × 16K', cue: 'reference-cache', tokens: 16384, sessions: 4, capped: true },
    { name: '4 logs × 32K', cue: 'longer-logs', tokens: 32768, sessions: 4, capped: true },
    { name: '8 logs × 16K', cue: 'more-logs', tokens: 16384, sessions: 8, capped: true },
    { name: '4 logs × 16K', cue: 'full-storage', tokens: 16384, sessions: 4, capped: false },
  ];
  const x = 470,
    width = 1122,
    maximum = 36;
  const scale = (gb) => x + (width * gb) / maximum;
  text('Model weights   7.6 GB', 125, 266, 31, C.blue);
  text('Workspace   2 GB', 610, 266, 31, C.pink);
  text('Sliding-layer cache', 1005, 266, 31, C.cyan);
  text('Full-layer cache', 1480, 266, 31, C.green);
  for (const [i, row] of cases.entries()) {
    const u = p(row.cue);
    if (i > 0 && u === 0) continue;
    focus.target('row-' + i, () => {
      const y = 400 + i * 122;
      const kv = cache(row.tokens, row.sessions, row.capped);
      text(row.name, 125, y + 29, 36);
      text(
        row.capped ? 'Capped' : 'Full buffers',
        125,
        y + 71,
        27,
        row.capped ? C.muted : C.yellow,
      );
      memoryRail(ctx, api, {
        x,
        y,
        width,
        maximum,
        height: 60,
        segments: [
          { gb: 7.6, color: C.blue },
          { gb: 2, color: C.pink },
          { gb: kv.sliding * u, color: C.cyan },
          { gb: kv.full * u, color: C.green },
        ],
      });
      if (u === 1)
        text(
          (9.6 + kv.total).toFixed(3) + ' GB',
          1820,
          y + 43,
          33,
          row.capped ? C.ink : C.pink,
          'right',
        );
    });
  }
  focus.target('limits', () => {
    for (const [value, label, color] of [
      [19.2, 'Plan 19.2', C.yellow],
      [24, 'Device 24', C.ink],
    ]) {
      api.line(ctx, scale(value), 371, scale(value), 850, color, 3);
      text(label, scale(value), 349, 28, color, 'center');
    }
  });
  focus.target('worksheet-result', () => {
    let line = 'Same device and phase   ·   1K = 1,024 tokens   ·   decimal GB';
    if (p('full-storage') === 1)
      line =
        'Raw cache with full-length sliding buffers   ' +
        cache(16384, 4, false).total.toFixed(3) +
        ' GB';
    if (p('remove-reserve') > 0)
      line =
        'Even with 1 GB of workspace and no reserve: ' +
        (8.6 + cache(16384, 4, false).total).toFixed(3) +
        ' GB needed on a 24 GB card.';
    text(line, 125, 948, 34, p('full-storage') > 0 ? C.yellow : C.muted);
  });
}
export default {
  id: 'worksheet-evidence',
  draw: drawWorksheetEvidence,
  cues: ['reference-cache', 'longer-logs', 'more-logs', 'full-storage', 'remove-reserve'],
};
